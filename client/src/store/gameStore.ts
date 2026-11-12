import { create } from 'zustand';
import { loadMyAvatar, saveMyAvatar } from '../utils/avatar';
import { io, Socket } from 'socket.io-client';
import {
  Room,
  Player,
  ClientToServerEvents,
  ServerToClientEvents,
  RevealPayload,
  ScoreEvent,
  AntiCheatAlert,
  ViewerReaction,
  ViewerReactionKind,
  PredictionCategoryId,
  GAME_CONFIG,
} from '@olympia/shared';
import { soundManager } from '../utils/soundEffects';

interface GameStore {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connected: boolean;
  serverOffset: number;
  room: Room | null;
  player: Player | null;
  myToken: string | null;
  myPlayerId: string | null;
  mySeat: number | null;
  lastReveal: RevealPayload | null;
  buzzWinner: { winnerId: string; winnerName: string; diffMs?: number } | null;
  buzzRejectedReason: string | null;
  antiCheatAlert: (AntiCheatAlert & { receivedAt: number }) | null;

  initSocket: () => void;
  syncClock: () => void;
  createRoom: (name: string) => Promise<{ ok: boolean; error?: string }>;
  joinRoom: (name: string, roomCode: string) => Promise<{ ok: boolean; error?: string }>;
  rejoinRoom: (roomCode: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  setAvatar: (seed: string) => void;
  switchSeat: (targetRole: 'player' | 'viewer', targetSeat: number) => Promise<{ ok: boolean; error?: string }>;
  startGame: () => void;
  playAgain: () => Promise<{ ok: boolean; error?: string }>;
  /** Cảm xúc của khán giả đang bay trên màn hình. */
  reactions: ViewerReaction[];
  sendReaction: (kind: ViewerReactionKind, index: number) => Promise<{ ok: boolean; error?: string; retryInMs?: number }>;
  removeReaction: (id: string) => void;
  placePrediction: (category: PredictionCategoryId, option: string, stake: number) => Promise<{ ok: boolean; error?: string }>;
  setReady: (mediaLoaded?: boolean) => void;
  submitAnswer: (questionId: string, content: string) => void;
  buzz: () => void;
  chooseKdPackage: (packageIndex: number) => void;
  pickVcnvRow: (rowIndex: number) => void;
  choosePackage: (packagePoints: 40 | 60 | 80) => void;
  setHopeStar: (useStar: boolean) => void;
  overrideScore: (questionId: string, playerId: string, isCorrect: boolean) => void;
  skipAbsent: (playerId: string) => void;
  kickPlayer: (playerId: string) => void;
  jumpToRound: (targetRound?: string) => void;
  forceStartRound: () => void;
  leaveRoom: () => void;
}

const STORAGE_KEYS = ['olympia_token', 'olympia_room_code', 'olympia_seat', 'olympia_player_id'];
const clearSavedSession = () => STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  connected: false,
  serverOffset: 0,
  room: null,
  player: null,
  myToken: localStorage.getItem('olympia_token'),
  myPlayerId: localStorage.getItem('olympia_player_id'),
  mySeat: Number(localStorage.getItem('olympia_seat')) || null,
  lastReveal: null,
  buzzWinner: null,
  buzzRejectedReason: null,
  antiCheatAlert: null,
  reactions: [],

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
      // Server không gửi token của ai xuống nữa -> nhận diện bản thân bằng player.id
      const myId = get().myPlayerId;
      const me = myId ? room.players.find((p) => p.id === myId) || null : get().player;
      const prevRound = get().room?.state?.round;
      const newRound = room.state?.round;

      // Only preserve buzzWinner if buzzer is actively locked in a relevant answering subPhase
      const isAnsweringSubPhase =
        room.state?.subPhase === 'ANSWERING' ||
        room.state?.subPhase === 'STEAL_ANSWER' ||
        room.state?.subPhase === 'CNV_ANSWERING' ||
        room.state?.subPhase === 'FINAL_GUESS_ANSWERING' ||
        (room.state?.round === 'VCNV' && Boolean(room.state?.buzzerLockedBy));

      const isBuzzerActive = Boolean(room.state?.buzzerLockedBy);
      const buzzWinner =
        prevRound === newRound && isBuzzerActive && isAnsweringSubPhase ? get().buzzWinner : null;

      set({ room, player: me, buzzWinner });
    });

    socket.on('player:update', (players) => {
      const currentRoom = get().room;
      if (currentRoom) {
        const myId = get().myPlayerId;
        const me = myId ? players.find((p) => p.id === myId) || null : get().player;
        set({
          room: { ...currentRoom, players },
          player: me,
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

    socket.on('viewer:reaction', (reaction) => {
      const current = get().reactions;
      // Giới hạn số thông điệp bay cùng lúc trên mỗi máy: quá thì bỏ thông điệp mới (trừ của chính mình)
      const mine = reaction.playerId === get().myPlayerId;
      if (current.length >= GAME_CONFIG.VIEWER_REACTIONS.MAX_ON_SCREEN && !mine) return;
      set({ reactions: [...current.slice(-(GAME_CONFIG.VIEWER_REACTIONS.MAX_ON_SCREEN * 2)), reaction] });
    });

    socket.on('anticheat:alert', (data) => {
      soundManager.playWrong();
      set({ antiCheatAlert: { ...data, receivedAt: Date.now() } });
    });

    socket.on('player:kicked', (data) => {
      clearSavedSession();
      set({ room: null, player: null, myToken: null, myPlayerId: null, mySeat: null });
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

      s.emit('room:create', { name, avatar: loadMyAvatar() }, (res) => {
        if (res.ok && res.token && res.roomCode && res.seat) {
          localStorage.setItem('olympia_token', res.token);
          localStorage.setItem('olympia_room_code', res.roomCode);
          localStorage.setItem('olympia_seat', String(res.seat));
          if (res.player) localStorage.setItem('olympia_player_id', res.player.id);
          set({
            myToken: res.token,
            myPlayerId: res.player?.id ?? null,
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

      s.emit('room:join', { name, roomCode, avatar: loadMyAvatar() }, (res) => {
        if (res.ok && res.token && res.roomCode && res.seat) {
          localStorage.setItem('olympia_token', res.token);
          localStorage.setItem('olympia_room_code', res.roomCode);
          localStorage.setItem('olympia_seat', String(res.seat));
          if (res.player) localStorage.setItem('olympia_player_id', res.player.id);
          set({
            myToken: res.token,
            myPlayerId: res.player?.id ?? null,
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
          localStorage.setItem('olympia_player_id', res.player.id);
          set({
            room: res.room,
            player: res.player,
            mySeat: res.player.seat,
            myToken: token,
            myPlayerId: res.player.id,
          });
          resolve({ ok: true });
        } else {
          // Invalidate saved token
          clearSavedSession();
          resolve({ ok: false, error: res.error || 'Không thể vào lại phòng.' });
        }
      });
    });
  },

  setAvatar: (seed: string) => {
    saveMyAvatar(seed);
    const { socket, room, player } = get();
    if (!socket || !room || !player) return;
    // Cập nhật ngay trên máy mình, server sẽ đồng bộ lại cho cả phòng
    set({
      player: { ...player, avatar: seed },
      room: { ...room, players: room.players.map((p) => (p.id === player.id ? { ...p, avatar: seed } : p)) },
    });
    socket.emit('player:setAvatar', { avatar: seed });
  },

  switchSeat: (targetRole, targetSeat) => {
    // Optimistic instant update in 0ms
    const currentRoom = get().room;
    const currentPlayer = get().player;
    if (currentRoom && currentPlayer) {
      const updatedPlayers = currentRoom.players.map((p) => {
        if (p.id === currentPlayer.id) {
          return { ...p, role: targetRole, seat: targetSeat };
        }
        return p;
      });

      const updatedPlayer: Player = {
        ...currentPlayer,
        role: targetRole,
        seat: targetSeat,
      };

      localStorage.setItem('olympia_seat', String(targetSeat));
      set({
        room: { ...currentRoom, players: updatedPlayers },
        player: updatedPlayer,
        mySeat: targetSeat,
      });
    }

    return new Promise((resolve) => {
      const s = get().socket;
      if (!s) return resolve({ ok: false, error: 'Chưa kết nối tới máy chủ.' });

      let answered = false;
      const timer = setTimeout(() => {
        if (!answered) {
          answered = true;
          resolve({ ok: true });
        }
      }, 1500);

      s.emit('room:switchSeat', { targetRole, targetSeat }, (res) => {
        if (!answered) {
          answered = true;
          clearTimeout(timer);
          if (res && res.ok) {
            resolve({ ok: true });
          } else {
            resolve({ ok: false, error: res?.error || 'Đổi vị trí thất bại.' });
          }
        }
      });
    });
  },

  startGame: () => {
    get().socket?.emit('room:start');
  },

  sendReaction: (kind, index) =>
    new Promise((resolve) => {
      const socket = get().socket;
      if (!socket) return resolve({ ok: false, error: 'Mất kết nối tới máy chủ.' });
      const timer = setTimeout(() => resolve({ ok: false, error: 'Máy chủ không phản hồi.' }), 5000);
      socket.emit('viewer:react', { kind, index }, (res) => {
        clearTimeout(timer);
        resolve(res);
      });
    }),

  removeReaction: (id) => set({ reactions: get().reactions.filter((r) => r.id !== id) }),

  placePrediction: (category, option, stake) =>
    new Promise((resolve) => {
      const socket = get().socket;
      if (!socket) return resolve({ ok: false, error: 'Mất kết nối tới máy chủ.' });
      const timer = setTimeout(() => resolve({ ok: false, error: 'Máy chủ không phản hồi.' }), 6000);
      socket.emit('prediction:place', { category, option, stake }, (res) => {
        clearTimeout(timer);
        resolve(res);
      });
    }),

  playAgain: () =>
    new Promise((resolve) => {
      const socket = get().socket;
      if (!socket) return resolve({ ok: false, error: 'Mất kết nối tới máy chủ.' });
      const timer = setTimeout(() => resolve({ ok: false, error: 'Máy chủ không phản hồi, thử lại nhé.' }), 8000);
      socket.emit('room:playAgain', (res) => {
        clearTimeout(timer);
        resolve(res);
      });
    }),

  setReady: (mediaLoaded = true) => {
    get().socket?.emit('player:ready', { mediaLoaded });
  },

  submitAnswer: (questionId: string, content: string) => {
    get().socket?.emit('answer:submit', { questionId, content });
  },

  buzz: () => {
    get().socket?.emit('buzz', {});
  },

  chooseKdPackage: (packageIndex: number) => {
    get().socket?.emit('kd:choosePackage', { packageIndex });
  },

  pickVcnvRow: (rowIndex: number) => {
    get().socket?.emit('vcnv:pickRow', { rowIndex });
  },

  choosePackage: (packagePoints) => {
    get().socket?.emit('vd:choosePackage', { packagePoints });
  },

  setHopeStar: (useStar) => {
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

  jumpToRound: (targetRound = 'VCNV') => {
    get().socket?.emit('dev:jumpRound', { targetRound });
  },

  forceStartRound: () => {
    get().socket?.emit('dev:forceStartRound');
  },

  leaveRoom: () => {
    clearSavedSession();
    set({ room: null, player: null, myToken: null, myPlayerId: null, mySeat: null });
    window.location.reload();
  },
}));
