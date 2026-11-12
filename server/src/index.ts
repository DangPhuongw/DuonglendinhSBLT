import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GAME_CONFIG,
} from '@olympia/shared';
import { RoomManager } from './game/RoomManager.js';
import { toPublicPlayers, sanitizePlayerName } from './game/RoomStateMachine.js';
import { SnapshotManager } from './game/SnapshotManager.js';
import { parseExcelQuestionSet, generateExcelTemplate } from './game/questionParser.js';
import { validateQuestionSet } from './game/questionValidator.js';
import { csvCell } from './utils/csv.js';
import { QuestionBankService, resolveBankDir } from './game/questionBankService.js';
import { QuestionUsage, listQuestionIds } from './game/questionComposer.js';
import { ReactionLimiter } from './game/reactionLimiter.js';

const reactionLimiter = new ReactionLimiter();

const app = express();
app.set('trust proxy', 1); // Trust Render / Cloudflare reverse proxy headers
const server = http.createServer(app);

// 1. Anti-Spam HTTP Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 120, // tối đa 120 requests/phút từ 1 IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' },
});

const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 20, // tối đa 20 file upload trong 10 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Tải lên quá thường xuyên. Vui lòng thử lại sau 10 phút.' },
});

app.use('/api/', apiLimiter);
app.use(cors());
app.use(express.json());

// Media uploads directory
const uploadsDir = fs.existsSync(path.resolve(process.cwd(), 'uploads'))
  ? path.resolve(process.cwd(), 'uploads')
  : path.resolve(process.cwd(), 'server/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// Socket.IO
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = RoomManager.getInstance();

// Connect room state machine callbacks to socket.io room broadcasts
roomManager.setCallbacksFactory((roomCode: string) => ({
  broadcastRoom: (room) => {
    io.to(roomCode).emit('state:sync', { ...room, players: toPublicPlayers(room.players) });
  },
  broadcastBuzzWon: (data) => {
    io.to(roomCode).emit('buzz:won', data);
  },
  broadcastBuzzRejected: (toPlayerId, data) => {
    if (!toPlayerId) {
      io.to(roomCode).emit('buzz:rejected', data);
      return;
    }
    // Gửi riêng cho người bấm; nếu không tìm thấy socket thì bỏ qua (không lộ cho cả phòng)
    const socketId = roomManager.getSocketByPlayer(roomCode, toPlayerId);
    if (socketId) io.to(socketId).emit('buzz:rejected', data);
  },
  emitAnswerAck: (toPlayerId, data) => {
    const socketId = roomManager.getSocketByPlayer(roomCode, toPlayerId);
    if (socketId) io.to(socketId).emit('answer:ack', data);
  },
  broadcastReveal: (data) => {
    io.to(roomCode).emit('reveal', data);
  },
  broadcastScoreUpdate: (data) => {
    io.to(roomCode).emit('score:update', data);
  },
  broadcastPlayerUpdate: (players) => {
    io.to(roomCode).emit('player:update', toPublicPlayers(players));
  },
  broadcastAntiCheat: (data) => {
    io.to(roomCode).emit('anticheat:alert', data);
  },
}));

// Kho câu hỏi: mỗi trận ghép đề ngẫu nhiên từ các file Excel trong thư mục question-bank
SnapshotManager.init();
const questionBank = new QuestionBankService(
  resolveBankDir(),
  new QuestionUsage(SnapshotManager.questionUsageFile())
);
questionBank.refresh(true);
roomManager.setQuestionBank(questionBank);

// Load snapshots on startup
roomManager.loadSavedSnapshots();

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// --- REST Endpoints ---

/** Xóa file tạm của multer, bỏ qua lỗi nếu file đã không còn. */
function removeTempFile(filePath?: string): void {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* đã bị xóa */
  }
}

/** Trả về phòng nếu token gửi kèm đúng là token chủ phòng; ngược lại null. */
function getRoomAsHost(roomCodeRaw: unknown, hostToken: unknown) {
  if (typeof roomCodeRaw !== 'string' || !roomCodeRaw.trim()) return null;
  const machine = roomManager.getRoom(roomCodeRaw.trim());
  if (!machine || !machine.isHostToken(hostToken)) return null;
  return machine;
}

// Chỉ nhận ảnh / video / âm thanh. Không bao giờ nhận .html, .svg, .js... vì thư mục uploads
// được phục vụ cùng domain với trang game (tránh chèn mã độc - stored XSS).
const ALLOWED_MEDIA_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.mp4', '.webm', '.mp3', '.wav', '.ogg', '.m4a',
]);

/** multer báo lỗi (vd. file quá lớn) bằng JSON thay vì trang lỗi HTML. */
const singleFile = (field: string): express.RequestHandler => (req, res, next) => {
  upload.single(field)(req, res, (err: unknown) => {
    if (!err) return next();
    const tooBig = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE';
    res.status(tooBig ? 413 : 400).json({
      error: tooBig ? 'File quá lớn (tối đa 25MB).' : 'Không đọc được file tải lên.',
    });
  });
};

app.post('/api/upload-media', uploadLimiter, singleFile('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Không có file nào được tải lên.' });
  }
  if (!getRoomAsHost(req.body?.roomCode, req.body?.hostToken)) {
    removeTempFile(req.file.path);
    return res.status(403).json({ error: 'Chỉ chủ phòng mới được tải media lên.' });
  }
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  if (!ALLOWED_MEDIA_EXTS.has(fileExt)) {
    removeTempFile(req.file.path);
    return res.status(400).json({ error: 'Định dạng file không được hỗ trợ (chỉ ảnh, video, âm thanh).' });
  }
  const newFilename = `${req.file.filename}${fileExt}`;
  const newPath = path.join(uploadsDir, newFilename);
  fs.renameSync(req.file.path, newPath);

  res.json({
    url: `/uploads/${newFilename}`,
    originalName: req.file.originalname,
  });
});

app.get('/api/question-template', (req, res) => {
  try {
    const buffer = generateExcelTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="olympia_bo_de_mau.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    console.error('Error generating template:', err);
    res.status(500).json({ error: 'Lỗi khi tạo file mẫu: ' + err.message });
  }
});

app.post('/api/upload-questions', uploadLimiter, singleFile('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Vui lòng chọn file đề thi.' });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.xlsx', '.xls', '.json'].includes(ext)) {
    removeTempFile(filePath);
    return res.status(400).json({ error: 'Chỉ nhận file đề .xlsx, .xls hoặc .json.' });
  }
  try {
    // Chỉ chủ phòng (có token chủ phòng) mới được thay bộ đề, và chỉ khi còn ở Sảnh chờ.
    // Nếu không, thí sinh có thể tự nạp bộ đề mình đã biết đáp án.
    const machine = getRoomAsHost(req.body?.roomCode, req.body?.hostToken);
    if (!machine) {
      return res.status(403).json({ error: 'Chỉ chủ phòng mới được nạp bộ đề.' });
    }
    if (machine.room.status !== 'LOBBY') {
      return res.status(409).json({ error: 'Chỉ có thể đổi bộ đề khi trận đấu chưa bắt đầu.' });
    }

    const buffer = fs.readFileSync(filePath);
    const isJson = ext === '.json';
    const raw: any = isJson
      ? JSON.parse(buffer.toString('utf-8'))
      : parseExcelQuestionSet(buffer, path.parse(req.file.originalname).name);

    // File Excel chỉ có một số vòng: phần thiếu được bù ngẫu nhiên từ kho câu hỏi (JSON phải đủ phần)
    let filled: string[] = [];
    let borrowedIds: string[] = [];
    let candidate: unknown = raw;
    if (!isJson) {
      const fill = questionBank.fillMissing(raw);
      if (!fill.ok) {
        return res.status(400).json({ error: fill.error });
      }
      candidate = fill.questionSet;
      filled = fill.filled;
      borrowedIds = fill.borrowedIds;
    }

    const validation = validateQuestionSet(candidate);
    if (!validation.ok) {
      return res.status(400).json({
        error: 'Bộ đề chưa hợp lệ: ' + validation.errors.join(' '),
        errors: validation.errors,
      });
    }
    const questionSet = validation.questionSet;

    machine.setQuestionSet(questionSet, 'custom');
    questionBank.markUsed(borrowedIds);
    console.log(
      `[Room ${machine.room.code}] Updated custom question set: ${questionSet.title}` +
        (filled.length ? ` (bù từ kho: ${filled.join(', ')})` : '')
    );

    res.json({ ok: true, questionSet, roomUpdated: true, filled });
  } catch (err: any) {
    console.error('Error parsing question file:', err);
    res.status(400).json({ error: 'Lỗi đọc file đề thi: ' + err.message });
  } finally {
    removeTempFile(filePath);
  }
});

app.get('/api/room/:code/export-csv', (req, res) => {
  const code = req.params.code.toUpperCase();
  const machine = roomManager.getRoom(code);
  if (!machine) {
    return res.status(404).send('Phòng không tồn tại.');
  }

  const room = machine.room;
  const rows: (string | number)[][] = [
    ['ID', 'ThoiDiem', 'VongThi', 'CauHoiId', 'NguoiChoi', 'SoGhe', 'BienDongDiem', 'LyDo'],
  ];
  for (const ev of room.history) {
    const player = room.players.find((p) => p.id === ev.playerId);
    rows.push([
      ev.id,
      new Date(ev.at).toISOString(),
      ev.round,
      ev.questionId,
      player ? player.name : '',
      player ? player.seat : '',
      ev.delta,
      ev.reason,
    ]);
  }
  let csv = rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';

  // Phần cuối biên bản: các câu hỏi đã dùng trong trận (để đối chiếu với kho câu hỏi)
  csv += '\n' + ['BoDe', 'VongThi', 'MaCauHoi'].map(csvCell).join(',') + '\n';
  for (const q of listQuestionIds(machine.questionSet)) {
    csv += [machine.questionSet.id, q.round, q.id].map(csvCell).join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="bien-ban-tran-dau-${code}.csv"`);
  res.send('\uFEFF' + csv); // Include BOM for Excel UTF-8 support
});

// Serve frontend static files if client/dist exists
const clientDistCandidates = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];
const clientDist = clientDistCandidates.find((dir) => fs.existsSync(dir));
if (clientDist) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// --- Socket.IO Anti-Spam & Connection Limiter ---
const ipSocketsMap = new Map<string, number>();
const MAX_SOCKETS_PER_IP = 15; // Cho phép tối đa 15 tab cùng lúc từ 1 địa chỉ IP/WiFi

io.use((socket, next) => {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : socket.handshake.address;

  const current = ipSocketsMap.get(ip) || 0;
  if (current >= MAX_SOCKETS_PER_IP) {
    console.warn(`[AntiSpam] Từ chối IP ${ip}: Vượt quá ${MAX_SOCKETS_PER_IP} kết nối đồng thời.`);
    return next(new Error('Quá nhiều kết nối từ cùng 1 mạng. Vui lòng đóng bớt tab game!'));
  }

  ipSocketsMap.set(ip, current + 1);

  socket.on('disconnect', () => {
    const val = ipSocketsMap.get(ip) || 1;
    if (val <= 1) {
      ipSocketsMap.delete(ip);
    } else {
      ipSocketsMap.set(ip, val - 1);
    }
  });

  next();
});

/** Token bí mật để vào lại phòng: ngẫu nhiên an toàn, không đoán được. */
function generateToken(): string {
  return `tok-${randomBytes(24).toString('base64url')}`;
}

// --- Socket.IO payload helpers ---
// Dữ liệu từ client không đáng tin: luôn kiểm tra kiểu trước khi dùng để một gói tin sai định dạng
// không làm lỗi handler (hoặc làm sập server).

const MAX_ANSWER_LENGTH = 200;

function parseRoomCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9]{4,10}$/.test(code) ? code : null;
}

function asString(value: unknown, maxLength = 200): string | null {
  return typeof value === 'string' && value.length <= maxLength ? value : null;
}

function asInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

/** Callback ack của socket.io có thể bị thiếu hoặc sai kiểu nếu client gửi bậy. */
function toCallback<T>(cb: unknown): (res: T) => void {
  return typeof cb === 'function' ? (cb as (res: T) => void) : () => {};
}

// --- Socket.IO Handlers ---

io.on('connection', (socket) => {
  // Event rate limiter per socket: tối đa 30 sự kiện/giây
  let eventCount = 0;
  let lastEventReset = Date.now();
  const checkEventSpam = (): boolean => {
    const now = Date.now();
    if (now - lastEventReset > 1000) {
      lastEventReset = now;
      eventCount = 0;
    }
    eventCount++;
    return eventCount > 30;
  };

  // Bọc mọi handler trong try/catch: lỗi trong 1 sự kiện chỉ được ghi log, không làm sập server.
  const on = ((event: string, handler: (...args: any[]) => void) =>
    socket.on(event as any, (...args: any[]) => {
      try {
        handler(...args);
      } catch (err) {
        console.error(`[Socket] Lỗi xử lý sự kiện "${event}":`, err);
      }
    })) as typeof socket.on;

  // 1. Clock synchronization ping/pong
  on('time:ping', (data) => {
    if (checkEventSpam()) return;
    const clientSentAt = data?.clientSentAt;
    if (typeof clientSentAt !== 'number' || !Number.isFinite(clientSentAt)) return;
    socket.emit('time:pong', {
      clientSentAt,
      serverReceivedAt: Date.now(),
    });
  });

  // 2. Room create (giới hạn tối đa 5 phòng / phút từ 1 socket)
  let roomCreateCount = 0;
  let lastRoomCreateReset = Date.now();

  on('room:create', (data, cb) => {
    const callback = toCallback<any>(cb);
    if (checkEventSpam()) return;
    const name = sanitizePlayerName(data?.name);
    if (!name) {
      return callback({ ok: false, error: 'Vui lòng nhập tên hợp lệ.' });
    }
    const now = Date.now();
    if (now - lastRoomCreateReset > 60000) {
      lastRoomCreateReset = now;
      roomCreateCount = 0;
    }
    roomCreateCount++;
    if (roomCreateCount > 5) {
      return callback({
        ok: false,
        error: 'Bạn đang tạo phòng quá nhanh. Vui lòng đợi 1 phút trước khi tạo tiếp!',
      });
    }

    const token = generateToken();
    const { roomCode, machine, playerId } = roomManager.createRoom(name, token, undefined, data?.avatar);

    socket.join(roomCode);
    roomManager.associateSocket(socket.id, roomCode, playerId);
    machine.syncRoom();

    const hostPlayer = machine.room.players.find((p) => p.id === playerId);
    callback({
      ok: true,
      token,
      seat: 1,
      roomCode,
      player: hostPlayer,
      room: machine.getSanitizedRoom(),
    });
  });

  // 3. Room join
  on('room:join', (data, cb) => {
    const callback = toCallback<any>(cb);
    if (checkEventSpam()) return;
    const code = parseRoomCode(data?.roomCode);
    const name = sanitizePlayerName(data?.name);
    if (!code) {
      return callback({ ok: false, error: 'Mã phòng không hợp lệ.' });
    }
    if (!name) {
      return callback({ ok: false, error: 'Vui lòng nhập tên hợp lệ.' });
    }
    const machine = roomManager.getRoom(code);
    if (!machine) {
      return callback({ ok: false, error: 'Phòng thi không tồn tại.' });
    }

    const token = generateToken();
    const res = machine.addPlayer(name, token, data?.avatar);

    if (!res.ok || !res.player) {
      return callback({ ok: false, error: res.error });
    }

    socket.join(code);
    roomManager.associateSocket(socket.id, code, res.player.id);
    machine.syncRoom();

    callback({
      ok: true,
      token,
      seat: res.player.seat,
      roomCode: code,
      player: res.player,
      room: machine.getSanitizedRoom(),
    });
  });

  // 4. Room rejoin
  on('room:rejoin', (data, cb) => {
    const callback = toCallback<any>(cb);
    if (checkEventSpam()) return;
    const code = parseRoomCode(data?.roomCode);
    const token = asString(data?.token);
    if (!code || !token) {
      return callback({ ok: false, error: 'Thông tin vào lại phòng không hợp lệ.' });
    }
    const machine = roomManager.getRoom(code);
    if (!machine) {
      return callback({ ok: false, error: 'Phòng không tồn tại.' });
    }

    const res = machine.handleReconnect(token);
    if (!res.ok || !res.player) {
      return callback({ ok: false, error: res.error });
    }

    socket.join(code);
    const staleSocketIds = roomManager.associateSocket(socket.id, code, res.player.id);
    // Kết nối cũ của cùng người chơi không còn nhận tin của phòng nữa
    for (const staleId of staleSocketIds) {
      io.sockets.sockets.get(staleId)?.leave(code);
    }

    callback({
      ok: true,
      player: res.player,
      room: machine.getSanitizedRoom(),
    });
  });

  // 4b. Switch seat / role
  on('room:switchSeat', (data, cb) => {
    const callback = toCallback<{ ok: boolean; error?: string }>(cb);
    if (checkEventSpam()) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) {
      callback({ ok: false, error: 'Không tìm thấy thông tin người chơi.' });
      return;
    }
    const targetRole = data?.targetRole;
    const targetSeat = asInt(data?.targetSeat);
    if ((targetRole !== 'player' && targetRole !== 'viewer') || targetSeat === null) {
      callback({ ok: false, error: 'Vị trí hoặc vai trò không hợp lệ.' });
      return;
    }
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        callback(machine.switchSeat(info.playerId, targetRole, targetSeat));
      });
    } else {
      callback({ ok: false, error: 'Phòng không tồn tại.' });
    }
  });

  // 4c. Đổi ảnh đại diện ở Sảnh chờ
  on('player:setAvatar', (data) => {
    if (checkEventSpam()) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    const machine = info && roomManager.getRoom(info.roomCode);
    if (!info || !machine) return;
    machine.eventQueue.enqueue(async () => machine.setAvatar(info.playerId, data?.avatar));
  });

  // 5. Start game
  on('room:start', () => {
    if (checkEventSpam()) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.startGame(info.playerId);
      });
    }
  });

  // 5b. Play again (after the match has finished)
  on('room:playAgain', (cb) => {
    if (checkEventSpam()) return;
    const reply = typeof cb === 'function' ? cb : () => {};
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return reply({ ok: false, error: 'Bạn chưa ở trong phòng.' });
    const machine = roomManager.getRoom(info.roomCode);
    if (!machine) return reply({ ok: false, error: 'Phòng không tồn tại.' });
    machine.eventQueue.enqueue(async () => {
      reply(machine.resetForNewGame(info.playerId));
    });
  });

  // 5c. Khán giả thả cảm xúc / tin nhắn cố định
  on('viewer:react', (data, cb) => {
    const reply = typeof cb === 'function' ? cb : () => {};
    if (checkEventSpam()) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return reply({ ok: false, error: 'Bạn chưa ở trong phòng.' });
    const machine = roomManager.getRoom(info.roomCode);
    const player = machine?.room.players.find((p) => p.id === info.playerId);
    if (!machine || !player) return reply({ ok: false, error: 'Phòng không tồn tại.' });
    if (player.role !== 'viewer') return reply({ ok: false, error: 'Chỉ khán giả mới thả cảm xúc được.' });

    const kind = data?.kind;
    const index = asInt(data?.index);
    const list = kind === 'emoji' ? GAME_CONFIG.VIEWER_REACTIONS.EMOJIS : kind === 'message' ? GAME_CONFIG.VIEWER_REACTIONS.MESSAGES : null;
    if (!list || index === null || index < 0 || index >= list.length) return reply({ ok: false, error: 'Cảm xúc không hợp lệ.' });

    const now = Date.now();
    const check = reactionLimiter.check(info.roomCode, player.id, now);
    if (!check.ok) {
      return reply({
        ok: false,
        retryInMs: check.retryInMs,
        error: check.scope === 'room' ? 'Màn hình đang nhiều cảm xúc quá, thử lại sau chút nhé.' : 'Thả chậm lại một chút nhé.',
      });
    }
    io.to(info.roomCode).emit('viewer:reaction', {
      id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      playerId: player.id,
      name: player.name,
      kind,
      index,
      at: now,
    });
    reply({ ok: true });
  });

  // 6. Player ready
  on('player:ready', (data) => {
    if (checkEventSpam()) return;
    const mediaLoaded = data?.mediaLoaded === true;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.setPlayerReady(info.playerId, mediaLoaded);
      });
    }
  });

  // 7. Answer submit
  on('answer:submit', (data) => {
    if (checkEventSpam()) return;
    const questionId = asString(data?.questionId);
    const content = asString(data?.content, MAX_ANSWER_LENGTH);
    if (questionId === null || content === null) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.submitAnswer(info.playerId, questionId, content);
      });
    }
  });

  // 8. Buzz (chống spam auto-click chuông)
  let lastBuzzTime = 0;
  on('buzz', () => {
    if (checkEventSpam()) return;
    const now = Date.now();
    if (now - lastBuzzTime < 150) return; // Tối đa ~6 lần bấm/giây
    lastBuzzTime = now;

    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.handleBuzzer(info.playerId);
      });
    }
  });

  // 8a. Khởi động: choose package
  on('kd:choosePackage', (data) => {
    if (checkEventSpam()) return;
    const packageIndex = asInt(data?.packageIndex);
    if (packageIndex === null) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.chooseKdPackage(info.playerId, packageIndex);
      });
    }
  });

  // 8b. VCNV: Pick row
  on('vcnv:pickRow', (data) => {
    if (checkEventSpam()) return;
    const rowIndex = asInt(data?.rowIndex);
    if (rowIndex === null) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.pickVcnvRow(info.playerId, rowIndex);
      });
    }
  });

  // 9. Về đích: choose package
  on('vd:choosePackage', (data) => {
    if (checkEventSpam()) return;
    const packagePoints = data?.packagePoints;
    if (packagePoints !== 40 && packagePoints !== 60 && packagePoints !== 80) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.chooseVeDichPackage(info.playerId, packagePoints);
      });
    }
  });

  // 10. Về đích: set star
  on('vd:setStar', (data) => {
    if (checkEventSpam()) return;
    const useStar = data?.useStar === true;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.setHopeStar(info.playerId, useStar);
      });
    }
  });

  // 11. Host override
  on('host:overrideScore', (data) => {
    if (checkEventSpam()) return;
    const questionId = asString(data?.questionId);
    const playerId = asString(data?.playerId);
    const isCorrect = data?.isCorrect;
    if (questionId === null || playerId === null || typeof isCorrect !== 'boolean') return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.overrideScore(info.playerId, questionId, playerId, isCorrect);
      });
    }
  });

  // 12. Host skip absent
  on('host:skipAbsent', (data) => {
    if (checkEventSpam()) return;
    const playerId = asString(data?.playerId);
    if (playerId === null) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.skipAbsentPlayer(info.playerId, playerId);
      });
    }
  });

  // 13. Host kick player
  on('host:kickPlayer', (data) => {
    if (checkEventSpam()) return;
    const playerId = asString(data?.playerId);
    if (playerId === null) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        const ok = machine.kickPlayer(info.playerId, playerId);
        if (ok) {
          const targetSocketId = roomManager.getSocketByPlayer(info.roomCode, playerId);
          if (targetSocketId) {
            io.to(targetSocketId).emit('player:kicked', {
              reason: 'Bạn đã bị chủ phòng mời ra khỏi phòng.',
            });
            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
              targetSocket.leave(info.roomCode);
            }
            roomManager.removeSocket(targetSocketId);
          }
        }
      });
    }
  });

  // 14. Dev: Jump / Tua nhanh sang vòng khác (tới màn hình chuẩn bị sẵn sàng)
  // Chỉ chủ phòng mới dùng được (kiểm tra trong state machine)
  on('dev:jumpRound', (data) => {
    if (checkEventSpam()) return;
    const targetRound = asString(data?.targetRound, 20) || 'VCNV';
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.jumpToRound(info.playerId, targetRound);
    }
  });

  on('dev:forceStartRound', () => {
    if (checkEventSpam()) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.forceStartReadyRound(info.playerId);
      });
    }
  });

  // 13b. Chống gian lận: client báo đã rời tab / cửa sổ trò chơi
  on('anticheat:leave', (data) => {
    if (checkEventSpam()) return;
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (!machine) return;
    const reason = data?.reason === 'hidden' ? 'hidden' : 'blur';
    machine.eventQueue.enqueue(async () => {
      machine.reportTabLeave(info.playerId, reason);
    });
  });

  // 14. Disconnect
  on('disconnect', () => {
    const info = roomManager.removeSocket(socket.id);
    if (info) {
      const machine = roomManager.getRoom(info.roomCode);
      if (machine) {
        machine.eventQueue.enqueue(async () => {
          machine.handleDisconnect(info.playerId);
        });
      }
    }
  });
});

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server Olympia Nội Bộ is running on http://0.0.0.0:${PORT}`);
});
