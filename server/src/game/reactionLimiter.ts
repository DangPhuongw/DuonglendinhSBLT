import { GAME_CONFIG } from '@olympia/shared';

export type ReactionCheck = { ok: true } | { ok: false; scope: 'player' | 'room'; retryInMs: number };

type Limits = typeof GAME_CONFIG.VIEWER_REACTIONS;

/**
 * Chống spam cảm xúc của khán giả:
 * - mỗi khán giả: cách nhau tối thiểu MIN_INTERVAL_MS và tối đa BURST_MAX lần trong BURST_WINDOW_MS;
 * - cả phòng: tối đa ROOM_MAX thông điệp trong ROOM_WINDOW_MS (vượt thì bỏ, tránh ngập màn hình).
 */
export class ReactionLimiter {
  private perPlayer = new Map<string, number[]>();
  private perRoom = new Map<string, number[]>();

  constructor(private readonly limits: Pick<Limits, 'MIN_INTERVAL_MS' | 'BURST_WINDOW_MS' | 'BURST_MAX' | 'ROOM_WINDOW_MS' | 'ROOM_MAX'> = GAME_CONFIG.VIEWER_REACTIONS) {}

  check(roomCode: string, playerId: string, now = Date.now()): ReactionCheck {
    const L = this.limits;
    const key = `${roomCode}:${playerId}`;

    const mine = (this.perPlayer.get(key) ?? []).filter((t) => now - t < L.BURST_WINDOW_MS);
    const last = mine[mine.length - 1];
    if (last !== undefined && now - last < L.MIN_INTERVAL_MS) {
      this.store(this.perPlayer, key, mine);
      return { ok: false, scope: 'player', retryInMs: L.MIN_INTERVAL_MS - (now - last) };
    }
    if (mine.length >= L.BURST_MAX) {
      this.store(this.perPlayer, key, mine);
      return { ok: false, scope: 'player', retryInMs: L.BURST_WINDOW_MS - (now - mine[0]) };
    }

    const room = (this.perRoom.get(roomCode) ?? []).filter((t) => now - t < L.ROOM_WINDOW_MS);
    if (room.length >= L.ROOM_MAX) {
      this.store(this.perRoom, roomCode, room);
      return { ok: false, scope: 'room', retryInMs: L.ROOM_WINDOW_MS - (now - room[0]) };
    }

    mine.push(now);
    room.push(now);
    this.store(this.perPlayer, key, mine);
    this.store(this.perRoom, roomCode, room);
    return { ok: true };
  }

  private store(map: Map<string, number[]>, key: string, list: number[]): void {
    if (list.length === 0) map.delete(key);
    else map.set(key, list);
  }
}
