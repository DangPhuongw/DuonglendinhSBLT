import { describe, it, expect, vi } from 'vitest';
import { GAME_CONFIG } from '@olympia/shared';
import { ReactionLimiter } from '../src/game/reactionLimiter.js';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';

const R = GAME_CONFIG.VIEWER_REACTIONS;

function mockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(), broadcastBuzzWon: vi.fn(), broadcastBuzzRejected: vi.fn(), emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(), broadcastScoreUpdate: vi.fn(), broadcastPlayerUpdate: vi.fn(), broadcastAntiCheat: vi.fn(),
  };
}

describe('Chống spam cảm xúc khán giả', () => {
  it('mỗi khán giả phải cách nhau tối thiểu MIN_INTERVAL_MS', () => {
    const lim = new ReactionLimiter();
    expect(lim.check('R1', 'v1', 1000)).toEqual({ ok: true });
    const r = lim.check('R1', 'v1', 1000 + R.MIN_INTERVAL_MS - 100);
    expect(r).toEqual({ ok: false, scope: 'player', retryInMs: 100 });
    expect(lim.check('R1', 'v1', 1000 + R.MIN_INTERVAL_MS)).toEqual({ ok: true });
  });

  it('tối đa BURST_MAX lần trong BURST_WINDOW_MS, hết cửa sổ thì thả tiếp được', () => {
    const lim = new ReactionLimiter();
    let t = 0;
    for (let i = 0; i < R.BURST_MAX; i++) {
      expect(lim.check('R1', 'v1', t).ok).toBe(true);
      t += R.MIN_INTERVAL_MS;
    }
    const blocked = lim.check('R1', 'v1', t);
    expect(blocked).toMatchObject({ ok: false, scope: 'player' });
    expect(lim.check('R1', 'v1', R.BURST_WINDOW_MS).ok).toBe(true);
  });

  it('cả phòng tối đa ROOM_MAX thông điệp trong ROOM_WINDOW_MS, phòng khác không bị ảnh hưởng', () => {
    const lim = new ReactionLimiter();
    for (let i = 0; i < R.ROOM_MAX; i++) expect(lim.check('R1', `v${i}`, 100 + i).ok).toBe(true);
    expect(lim.check('R1', 'vX', 200)).toMatchObject({ ok: false, scope: 'room' });
    expect(lim.check('R2', 'vX', 200).ok).toBe(true);
    expect(lim.check('R1', 'vX', 100 + R.ROOM_WINDOW_MS).ok).toBe(true);
  });

  it('bộ tin nhắn cố định có các câu được yêu cầu', () => {
    expect(R.MESSAGES).toEqual(expect.arrayContaining(['GOAT 🐐', 'Ngu', 'Bot', 'Hack à?', 'Đẳng cấp', 'Cố lên!']));
  });
});

describe('10 ghế khán giả', () => {
  it('đủ 5 thí sinh thì người vào sau thành khán giả, tối đa 10 khán giả', () => {
    expect(GAME_CONFIG.MAX_VIEWERS).toBe(10);
    const machine = new RoomStateMachine('VIEW01', { id: 'host', name: 'Chủ phòng', token: 't0' }, mockCallbacks());
    for (let i = 2; i <= 5; i++) expect(machine.addPlayer(`TS${i}`, `t${i}`).player?.role).toBe('player');

    for (let i = 1; i <= 10; i++) {
      const res = machine.addPlayer(`KG${i}`, `k${i}`);
      expect(res.ok).toBe(true);
      expect(res.player).toMatchObject({ role: 'viewer', seat: i });
    }
    const full = machine.addPlayer('Thừa', 'kx');
    expect(full.ok).toBe(false);
    expect(full.error).toContain('10 khán giả');
  });

  it('đổi sang ghế khán giả 6-10 được, ghế thí sinh vẫn chỉ 1-5', () => {
    const machine = new RoomStateMachine('VIEW02', { id: 'host', name: 'Chủ phòng', token: 't0' }, mockCallbacks());
    const p = machine.addPlayer('Bình', 't1').player!;
    expect(machine.switchSeat(p.id, 'viewer', 10)).toEqual({ ok: true });
    expect(machine.room.players.find((x) => x.id === p.id)).toMatchObject({ role: 'viewer', seat: 10 });
    expect(machine.switchSeat(p.id, 'viewer', 11).ok).toBe(false);
    expect(machine.switchSeat(p.id, 'player', 6).ok).toBe(false);
    expect(machine.switchSeat(p.id, 'player', 5)).toEqual({ ok: true });
  });
});
