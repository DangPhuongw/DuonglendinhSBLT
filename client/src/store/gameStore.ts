import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import {
  Room,
  Player,
  ClientToServerEvents,
  ServerToClientEvents,
  RevealPayload,
  ScoreEvent,
} from '@olympia/shared';
import { soundManager } from '../utils/soundEffects';

interface GameStore {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connected: boolean;
  serverOffset: number;
  room: Room | null;
  player: Player | null;
  myToken: string | null;
  mySeat: number | null;
  lastReveal: RevealPayload | null;
  buzzWinner: { winnerId: string; winnerName: string; diffMs?: number } | null;
  buzzRejectedReason: string | null;

  initSocket: () => void;
  syncClock: () => void;
  createRoom: (name: string) => Promise<{ ok: boolean; error?: string }>;
  joinRoom: (name: string, roomCode: string) => Promise<{ ok: boolean; error?: string }>;
  rejoinRoom: (roomCode: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  startGame: () => void;
  setReady: (mediaLoaded?: boolean) => void;
  submitAnswer: (questionId: string, content: string) => void;
  buzz: () => void;
  choosePackage: (packagePoints: 40 | 60 | 80) => void;
  setHopeStar: (useStar: boolean) => void;
  overrideScore: (questionId: string, playerId: string, isCorrect: boolean) => void;
  skipAbsent: (playerId: string) => void;
  kickPlayer: (playerId: string) => void;
  leaveRoom: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  connected: false,
  serverOffset: 0,
  room: null,
  player: null,
  myToken: localStorage.getItem('olympia_token'),
  mySeat: Number(localStorage.getItem('olympia_seat')) || null,
  lastReveal: null,
  buzzWinner: null,
  buzzRejectedReason: null,

  initSocket: () => {
    if (get().socket) return;

    const socketUrl = window.location.origin.includes('localhost:3000')
      ? 'http://localhost:4000'
      : window.location.origin;

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      set({ connected: true });
      get().syncClock();

      // Check if auto-rejoin info exists in localStorage or URL
      const savedToken = localStorage.getItem('olympia_token');
      const savedCode = localStorage.getItem('olympia_room_code');
      if (savedToken && savedCode) {
        get().rejoinRoom(savedCode, savedToken);
      }
    });

    socket.on('disconnect', () => {
      set({ connected: false });
    });

    // Clock sync reply
    socket.on('time:pong', ({ clientSentAt, serverReceivedAt }) => {
      const now = Date.now();
      const rtt = now - clientSentAt;
      const offset = serverReceivedAt - (clientSentAt + rtt / 2);
      set({ serverOffset: Math.round(offset) });
    });

    // Room sync
    socket.on('state:sync', (room) => {
      const currentToken = get().myToken || localStorage.getItem('olympia_token');
      const me = room.players.find((p) => p.token === currentToken) || null;
      const prevRound = get().room?.state?.round;
      const newRound = room.state?.round;

      // Clear buzzWinner if round changed or buzzer is not currently locked
      const buzzWinner = (prevRound !== newRound || !room.state?.buzzerLockedBy) ? null : get().buzzWinner;

      set({ room, player: me, buzzWinner });
    });

    socket.on('player:update', (players) => {
      const currentRoom = get().room;
      if (currentRoom) {
        const currentToken = get().myToken || localStorage.getItem('olympia_token');
        const me = players.find((p) => p.token === currentToken) || null;
        set({
          room: { ...currentRoom, players },
          player: me,
        });
      }
    });

    socket.on('phase:change', (data) => {
      const currentRoom = get().room;
      if (currentRoom) {
        set({
          room: {
            ...currentRoom,
            state: {
              ...currentRoom.state,
              round: data.round,
              subPhase: data.subPhase,
              deadline: data.deadline,
              currentQuestion: data.question,
            },
          },
          buzzWinner: null,
          buzzRejectedReason: null,
        });
      }
    });

    socket.on('buzz:won', (data) => {
      soundManager.playBuzzer();
      set({ buzzWinner: data, buzzRejectedReason: null });
    });

    socket.on('buzz:rejected', (data) => {
      set({ buzzRejectedReason: data.reason });
      setTimeout(() => {
        set({ buzzRejectedReason: null });
      }, 3000);
    });

    socket.on('reveal', (data) => {
      set({ lastReveal: data });
      const currentMe = get().player;
      if (currentMe) {
        const myResult = data.results.find((r) => r.playerId === currentMe.id);
        if (myResult) {
          if (myResult.isCorrect) {
            soundManager.playCorrect();
          } else {
            soundManager.playWrong();
          }
        }
      }
    });

    socket.on('score:update', ({ scores }) => {
      const currentRoom = get().room;
      if (currentRoom) {
        const updatedPlayers = currentRoom.players.map((p) => ({
          ...p,
          score: scores[p.id] !== undefined ? scores[p.id] : p.score,
        }));
        set({
          room: { ...currentRoom, players: updatedPlayers },
        });
      }
    });

    socket.on('player:kicked', (data) => {
      localStorage.removeItem('olympia_token');
      localStorage.removeItem('olympia_room_code');
      localStorage.removeItem('olympia_seat');
      set({ room: null, player: null, myToken: null, mySeat: null });
      alert(data.reason || 'Bạn đã bị mời ra khỏi phòng.');
    });

    set({ socket });

    // Periodic clock sync every 30s
    setInterval(() => {
      get().syncClock();
    }, 30000);
  },

  syncClock: () => {
    const s = get().socket;
    if (s && s.connected) {
      s.emit('time:ping', { clientSentAt: Date.now() });
    }
  },

  createRoom: (name: string) => {
    return new Promise((resolve) => {
      const s = get().socket;
      if (!s) return resolve({ ok: false, error: 'Chưa kết nối tới máy chủ.' });

      s.emit('room:create', { name }, (res) => {
        if (res.ok && res.token && res.roomCode && res.seat) {
          localStorage.setItem('olympia_token', res.token);
          localStorage.setItem('olympia_room_code', res.roomCode);
          localStorage.setItem('olympia_seat', String(res.seat));
          set({
            myToken: res.token,
            mySeat: res.seat,
            room: res.room || get().room,
            player: res.player || get().player,
          });
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: res.error || 'Tạo phòng thất bại.' });
        }
      });
    });
  },

  joinRoom: (name: string, roomCode: string) => {
    return new Promise((resolve) => {
      const s = get().socket;
      if (!s) return resolve({ ok: false, error: 'Chưa kết nối tới máy chủ.' });

      s.emit('room:join', { name, roomCode }, (res) => {
        if (res.ok && res.token && res.roomCode && res.seat) {
          localStorage.setItem('olympia_token', res.token);
          localStorage.setItem('olympia_room_code', res.roomCode);
          localStorage.setItem('olympia_seat', String(res.seat));
          set({
            myToken: res.token,
            mySeat: res.seat,
            room: res.room || get().room,
            player: res.player || get().player,
          });
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: res.error || 'Vào phòng thất bại.' });
        }
      });
    });
  },

  rejoinRoom: (roomCode: string, token: string) => {
    return new Promise((resolve) => {
      const s = get().socket;
      if (!s) return resolve({ ok: false, error: 'Chưa kết nối tới máy chủ.' });

      s.emit('room:rejoin', { roomCode, token }, (res) => {
        if (res.ok && res.player && res.room) {
          set({
            room: res.room,
            player: res.player,
            mySeat: res.player.seat,
            myToken: token,
          });
          resolve({ ok: true });
        } else {
          // Invalidate saved token
          localStorage.removeItem('olympia_token');
          localStorage.removeItem('olympia_room_code');
          localStorage.removeItem('olympia_seat');
          resolve({ ok: false, error: res.error || 'Không thể vào lại phòng.' });
        }
      });
    });
  },

  startGame: () => {
    get().socket?.emit('room:start');
  },

  setReady: (mediaLoaded = true) => {
    get().socket?.emit('player:ready', { mediaLoaded });
  },

  submitAnswer: (questionId: string, content: string) => {
    get().socket?.emit('answer:submit', { questionId, content });
  },

  buzz: () => {
    get().socket?.emit('buzz', {});
  },

  choosePackage: (packagePoints) => {
    get().socket?.emit('vd:choosePackage', { packagePoints });
  },

  setHopeStar: (useStar) => {
    soundManager.playStar();
    get().socket?.emit('vd:setStar', { useStar });
  },

  overrideScore: (questionId, playerId, isCorrect) => {
    get().socket?.emit('host:overrideScore', { questionId, playerId, isCorrect });
  },

  skipAbsent: (playerId) => {
    get().socket?.emit('host:skipAbsent', { playerId });
  },

  kickPlayer: (playerId) => {
    get().socket?.emit('host:kickPlayer', { playerId });
  },

  leaveRoom: () => {
    localStorage.removeItem('olympia_token');
    localStorage.removeItem('olympia_room_code');
    localStorage.removeItem('olympia_seat');
    set({ room: null, player: null, myToken: null, mySeat: null });
    window.location.reload();
  },
}));
