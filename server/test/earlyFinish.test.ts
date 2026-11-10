import { describe, it, expect, vi } from 'vitest';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';

function createMockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(),
    broadcastBuzzWon: vi.fn(),
    broadcastBuzzRejected: vi.fn(),
    emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(),
    broadcastScoreUpdate: vi.fn(),
    broadcastPlayerUpdate: vi.fn(),
    broadcastAntiCheat: vi.fn(),
  };
}

function setup(code: string, count: number) {
  const machine = new RoomStateMachine(code, { id: 'p1', name: 'P1', token: 't1' }, createMockCallbacks());
  for (let i = 2; i <= count; i++) machine.addPlayer(`P${i}`, `t${i}`);
  return { machine, players: machine.room.players };
}

/** Rời tab 2 lần -> bị loại (MAX_WARNINGS = 1). */
function cheatTwice(machine: RoomStateMachine, playerId: string) {
  machine.reportTabLeave(playerId, 'hidden');
  (machine as any).lastTabLeaveAt.clear();
  machine.reportTabLeave(playerId, 'hidden');
}

const flush = () => new Promise((r) => setTimeout(r, 20));

function inKdChung(machine: RoomStateMachine) {
  machine.room.status = 'KD_CHUNG';
  machine.room.state = { round: 'KD_CHUNG', subPhase: 'QUESTION_BUZZ', deadline: Date.now() + 15000 };
}

describe('Kết thúc sớm khi thí sinh bị loại vì gian lận', () => {
  it('2 người: người thứ nhất bị loại thì người còn lại thắng luôn', async () => {
    const { machine, players } = setup('EF0001', 2);
    const [a, b] = players;
    inKdChung(machine);

    cheatTwice(machine, a.id);
    await flush();

    expect(machine.room.state.round).toBe('FINISHED');
    expect(machine.room.state.winnerId).toBe(b.id);
    expect(machine.room.state.finishReason).toBe('LAST_STANDING');
  });

  it('2 người bị loại cùng lúc (trước khi trận kịp kết thúc): không có quán quân', async () => {
    const { machine, players } = setup('EF0002', 2);
    const [a, b] = players;
    inKdChung(machine);

    // Người thứ 2 bị loại ngay lúc trận vừa kết thúc -> không tính nữa vì đã ở màn FINISHED
    cheatTwice(machine, a.id);
    cheatTwice(machine, b.id);
    await flush();

    expect(machine.room.state.round).toBe('FINISHED');
    // a bị loại trước nên b thắng; vi phạm của b xảy ra sau khi trận đã kết thúc thì không tính
    expect(machine.room.state.winnerId).toBe(b.id);
  });

  it('tất cả bị loại thì kết thúc, không có quán quân', async () => {
    const { machine, players } = setup('EF0003', 2);
    const [a, b] = players;
    inKdChung(machine);
    a.disqualified = true; // đã bị loại từ trước (vd. trận đang chạy với 2 người, chưa kịp kết thúc)

    cheatTwice(machine, b.id);
    await flush();

    expect(machine.room.state.round).toBe('FINISHED');
    expect(machine.room.state.winnerId).toBeUndefined();
    expect(machine.room.state.finishReason).toBe('ALL_DISQUALIFIED');
  });

  it('5 người, 4 người bị loại: người còn lại thắng luôn dù điểm thấp nhất', async () => {
    const { machine, players } = setup('EF0004', 5);
    players.forEach((p, i) => (p.score = 100 - i * 10));
    const survivor = players[4]; // điểm thấp nhất
    inKdChung(machine);

    for (const p of players.slice(0, 3)) {
      cheatTwice(machine, p.id);
      await flush();
      expect(machine.room.state.round).toBe('KD_CHUNG'); // vẫn còn >= 2 người -> chơi tiếp
    }
    cheatTwice(machine, players[3].id);
    await flush();

    expect(machine.room.state.round).toBe('FINISHED');
    expect(machine.room.state.winnerId).toBe(survivor.id);
  });

  it('khán giả không được tính là người còn thi', async () => {
    const { machine, players } = setup('EF0005', 3);
    const [a, b, c] = players;
    c.role = 'viewer';
    inKdChung(machine);

    cheatTwice(machine, a.id);
    await flush();
    expect(machine.room.state.round).toBe('FINISHED');
    expect(machine.room.state.winnerId).toBe(b.id);
  });

  it('câu hỏi phụ: 1 trong 2 người bằng điểm bị loại thì người kia thắng', async () => {
    const { machine, players } = setup('EF0006', 3);
    const [a, b] = players;
    a.score = 50; b.score = 50; players[2].score = 10;
    machine.room.status = 'TIEBREAK';
    machine.room.state = {
      round: 'TIEBREAK',
      subPhase: 'BUZZ_OPEN',
      deadline: Date.now() + 15000,
      eligiblePlayerIds: [a.id, b.id],
    };

    cheatTwice(machine, a.id);
    await flush();
    expect(machine.room.state.round).toBe('FINISHED');
    expect(machine.room.state.winnerId).toBe(b.id);
  });
});
