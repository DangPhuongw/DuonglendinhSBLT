import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  QuestionSet,
} from '@olympia/shared';
import { RoomManager } from './game/RoomManager.js';
import { toPublicPlayers } from './game/RoomStateMachine.js';
import { SnapshotManager } from './game/SnapshotManager.js';
import { parseExcelQuestionSet, generateExcelTemplate } from './game/questionParser.js';

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
  broadcastPhaseChange: (data) => {
    io.to(roomCode).emit('phase:change', data);
  },
  broadcastBuzzWon: (data) => {
    io.to(roomCode).emit('buzz:won', data);
  },
  broadcastBuzzRejected: (toSocketId, data) => {
    if (toSocketId) {
      io.to(toSocketId).emit('buzz:rejected', data);
    } else {
      io.to(roomCode).emit('buzz:rejected', data);
    }
  },
  emitAnswerAck: (toPlayerId, data) => {
    io.to(roomCode).emit('answer:ack', data);
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
}));

// Load snapshots on startup
SnapshotManager.init();
roomManager.loadSavedSnapshots();

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// --- REST Endpoints ---

app.post('/api/upload-media', uploadLimiter, upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Không có file nào được tải lên.' });
  }
  const fileExt = path.extname(req.file.originalname) || '';
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

app.post('/api/upload-questions', uploadLimiter, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Vui lòng chọn file đề thi.' });
  }

  try {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    let questionSet: QuestionSet;

    if (req.file.originalname.endsWith('.json')) {
      questionSet = JSON.parse(buffer.toString('utf-8'));
    } else {
      questionSet = parseExcelQuestionSet(buffer, req.file.originalname);
    }

    // Clean temp file
    fs.unlinkSync(filePath);

    // Gắn trực tiếp bộ đề vào phòng nếu có roomCode
    const roomCode = req.body?.roomCode ? String(req.body.roomCode).toUpperCase() : null;
    let roomUpdated = false;
    if (roomCode) {
      const machine = roomManager.getRoom(roomCode);
      if (machine) {
        machine.questionSet = questionSet;
        machine.persistSnapshot();
        roomUpdated = true;
        console.log(`[Room ${roomCode}] Updated custom question set: ${questionSet.title}`);
      }
    }

    res.json({ ok: true, questionSet, roomUpdated });
  } catch (err: any) {
    console.error('Error parsing question file:', err);
    res.status(500).json({ error: 'Lỗi đọc file đề thi: ' + err.message });
  }
});

app.get('/api/room/:code/export-csv', (req, res) => {
  const code = req.params.code.toUpperCase();
  const machine = roomManager.getRoom(code);
  if (!machine) {
    return res.status(404).send('Phòng không tồn tại.');
  }

  const room = machine.room;
  let csv = 'ID,ThoiDiem,VongThi,CauHoiId,NguoiChoi,SoGhe,BienDongDiem,LyDo\n';

  for (const ev of room.history) {
    const player = room.players.find((p) => p.id === ev.playerId);
    const dateStr = new Date(ev.at).toISOString();
    csv += `"${ev.id}","${dateStr}","${ev.round}","${ev.questionId}","${player ? player.name : ''}",${player ? player.seat : ''},${ev.delta},"${ev.reason}"\n`;
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

  // 1. Clock synchronization ping/pong
  socket.on('time:ping', (data) => {
    if (checkEventSpam()) return;
    socket.emit('time:pong', {
      clientSentAt: data.clientSentAt,
      serverReceivedAt: Date.now(),
    });
  });

  // 2. Room create (giới hạn tối đa 5 phòng / phút từ 1 socket)
  let roomCreateCount = 0;
  let lastRoomCreateReset = Date.now();

  socket.on('room:create', ({ name }, callback) => {
    if (checkEventSpam()) return;
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

    const token = `tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { roomCode, machine, playerId } = roomManager.createRoom(name, token);

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
  socket.on('room:join', ({ name, roomCode }, callback) => {
    const code = roomCode.toUpperCase();
    const machine = roomManager.getRoom(code);
    if (!machine) {
      return callback({ ok: false, error: 'Phòng thi không tồn tại.' });
    }

    const token = `tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const res = machine.addPlayer(name, token);

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
  socket.on('room:rejoin', ({ roomCode, token }, callback) => {
    const code = roomCode.toUpperCase();
    const machine = roomManager.getRoom(code);
    if (!machine) {
      return callback({ ok: false, error: 'Phòng không tồn tại.' });
    }

    const res = machine.handleReconnect(token);
    if (!res.ok || !res.player) {
      return callback({ ok: false, error: res.error });
    }

    socket.join(code);
    roomManager.associateSocket(socket.id, code, res.player.id);

    callback({
      ok: true,
      player: res.player,
      room: machine.getSanitizedRoom(),
    });
  });

  // 4b. Switch seat / role
  socket.on('room:switchSeat', ({ targetRole, targetSeat }, callback) => {
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) {
      if (callback) callback({ ok: false, error: 'Không tìm thấy thông tin người chơi.' });
      return;
    }
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        const res = machine.switchSeat(info.playerId, targetRole, targetSeat);
        if (callback) callback(res);
      });
    } else {
      if (callback) callback({ ok: false, error: 'Phòng không tồn tại.' });
    }
  });

  // 5. Start game
  socket.on('room:start', () => {
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.startGame(info.playerId);
      });
    }
  });

  // 6. Player ready
  socket.on('player:ready', ({ mediaLoaded }) => {
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
  socket.on('answer:submit', ({ questionId, content }) => {
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
  socket.on('buzz', () => {
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
  socket.on('kd:choosePackage', ({ packageIndex }) => {
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.chooseKdPackage(info.playerId, packageIndex);
    }
  });

  // 8b. VCNV: Pick row
  socket.on('vcnv:pickRow', ({ rowIndex }) => {
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.pickVcnvRow(info.playerId, rowIndex);
    }
  });

  // 9. Về đích: choose package
  socket.on('vd:choosePackage', ({ packagePoints }) => {
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.chooseVeDichPackage(info.playerId, packagePoints);
    }
  });

  // 10. Về đích: set star
  socket.on('vd:setStar', ({ useStar }) => {
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.setHopeStar(info.playerId, useStar);
    }
  });

  // 11. Host override
  socket.on('host:overrideScore', ({ questionId, playerId, isCorrect }) => {
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
  socket.on('host:skipAbsent', ({ playerId }) => {
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
  socket.on('host:kickPlayer', ({ playerId }) => {
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
  socket.on('dev:jumpRound', ({ targetRound }) => {
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.jumpToRound(targetRound || 'VCNV');
    }
  });

  socket.on('dev:forceStartRound', () => {
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.forceStartReadyRound();
    }
  });

  // 14. Disconnect
  socket.on('disconnect', () => {
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
