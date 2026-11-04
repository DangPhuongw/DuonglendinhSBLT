import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  QuestionSet,
} from '@olympia/shared';
import { RoomManager } from './game/RoomManager.js';
import { SnapshotManager } from './game/SnapshotManager.js';
import { parseExcelQuestionSet } from './game/questionParser.js';

const app = express();
const server = http.createServer(app);

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
    io.to(roomCode).emit('state:sync', room);
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
    io.to(roomCode).emit('player:update', players);
  },
}));

// Load snapshots on startup
SnapshotManager.init();
roomManager.loadSavedSnapshots();

// --- REST Endpoints ---

app.post('/api/upload-media', upload.single('media'), (req, res) => {
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

app.post('/api/upload-questions', upload.single('file'), (req, res) => {
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

    res.json({ ok: true, questionSet });
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

// --- Socket.IO Handlers ---

io.on('connection', (socket) => {
  // 1. Clock synchronization ping/pong
  socket.on('time:ping', (data) => {
    socket.emit('time:pong', {
      clientSentAt: data.clientSentAt,
      serverReceivedAt: Date.now(),
    });
  });

  // 2. Room create
  socket.on('room:create', ({ name }, callback) => {
    const token = `tok-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { roomCode, machine, playerId } = roomManager.createRoom(name, token);

    socket.join(roomCode);
    roomManager.associateSocket(socket.id, roomCode, playerId);

    callback({
      ok: true,
      token,
      seat: 1,
      roomCode,
    });

    machine.syncRoom();
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

    callback({
      ok: true,
      token,
      seat: res.player.seat,
      roomCode: code,
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

  // 8. Buzz
  socket.on('buzz', () => {
    const info = roomManager.getPlayerBySocket(socket.id);
    if (!info) return;
    const machine = roomManager.getRoom(info.roomCode);
    if (machine) {
      machine.eventQueue.enqueue(async () => {
        machine.handleBuzzer(info.playerId);
      });
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

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server Olympia Nội Bộ is running on port ${PORT}`);
});
