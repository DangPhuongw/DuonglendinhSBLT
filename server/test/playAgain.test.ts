import { describe, it, expect, vi, afterEach } from 'vitest';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';

function mockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(), broadcastBuzzWon: vi.fn(), broadcastBuzzRejected: vi.fn(), emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(), broadcastScoreUpdate: vi.fn(), broadcastPlayerUpdate: vi.fn(), broadcastAntiCheat: vi.fn(),
  };
}

/** Phòng 3 người đã chơi xong: có điểm, đã dùng ngôi sao, có người bị loại. */
function finishedRoom() {
  const machine = new RoomStateMachine('PLAY01', { id: 'host', name: 'Chủ phòng', token: 't0' }, mockCallbacks());
  machine.addPlayer('Bình', 't1');
  machine.addPlayer('Chi', 't2');
  const [a, b, c] = machine.room.players;
  a.score = 150; a.roundScores = { kd: 40, vcnv: 30, tt: 40, vd: 40 }; a.starUsed = true;
  b.score = 80; b.tabLeaveCount = 4; b.disqualified = true; b.eliminatedVcnv = true;
  c.score = 60;
  machine.room.history.push({ id: 'e1', round: 'KD_RIENG', questionId: 'q', playerId: a.id, delta: 10, reason: 'correct', at: 1 });
  machine.room.status = 'FINISHED';
  machine.room.state = { round: 'FINISHED', subPhase: 'PODIUM', winnerId: a.id, deadline: null };
  return machine;
}

afterEach(() => vi.useRealTimers());

describe('Chơi lại sau khi trận kết thúc', () => {
  it('chủ phòng đưa cả phòng về sảnh chờ với điểm và trạng thái mới, giữ nguyên người chơi và ghế', () => {
    const machine = finishedRoom();
    const seatsBefore = machine.room.players.map((p) => `${p.id}:${p.seat}`);

    expect(machine.resetForNewGame('host')).toEqual({ ok: true });
    expect(machine.room.status).toBe('LOBBY');
    expect(machine.room.state.round).toBe('LOBBY');
    expect(machine.room.history).toEqual([]);
    expect(machine.room.players.map((p) => `${p.id}:${p.seat}`)).toEqual(seatsBefore);
    for (const p of machine.room.players) {
      expect(p.score).toBe(0);
      expect(p.roundScores).toEqual({ kd: 0, vcnv: 0, tt: 0, vd: 0 });
      expect(p.starUsed).toBe(false);
      expect(p.disqualified).toBe(false);
      expect(p.tabLeaveCount).toBe(0);
      expect(p.eliminatedVcnv).toBe(false);
      expect(p.ready).toBe(false);
    }
  });

  it('bắt đầu được trận mới ngay sau khi chơi lại', () => {
    vi.useFakeTimers();
    const machine = finishedRoom();
    machine.resetForNewGame('host');
    expect(machine.startGame('host')).toEqual({ ok: true });
    expect(machine.room.state.round).toBe('READY');
    machine.dispose();
  });

  it('chỉ chủ phòng mới được chơi lại, và chỉ khi trận đã kết thúc', () => {
    const machine = finishedRoom();
    const guest = machine.room.players[1].id;
    expect(machine.resetForNewGame(guest).ok).toBe(false);
    expect(machine.room.status).toBe('FINISHED');

    machine.room.status = 'VE_DICH';
    expect(machine.resetForNewGame('host')).toMatchObject({ ok: false, error: 'Trận đấu chưa kết thúc.' });
  });
});
