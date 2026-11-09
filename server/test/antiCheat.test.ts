import { describe, it, expect, vi } from 'vitest';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';
import { GAME_CONFIG } from '@olympia/shared';

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

function setup(code: string) {
  const callbacks = createMockCallbacks();
  const machine = new RoomStateMachine(code, { id: 'p1', name: 'An', token: 't1' }, callbacks);
  machine.addPlayer('Bình', 't2');
  machine.addPlayer('Chi', 't3');
  const [a, b, c] = machine.room.players;
  return { machine, callbacks, a, b, c };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('Chống gian lận rời tab', () => {
  it('lần 1 cảnh cáo, lần 2 bị loại; có ghi biên bản', () => {
    vi.useFakeTimers();
    const { machine, callbacks, b } = setup('AC0001');
    machine.room.status = 'TANG_TOC';
    machine.room.state = { round: 'TANG_TOC', subPhase: 'QUESTION', deadline: Date.now() + 30000 };

    const first = machine.reportTabLeave(b.id, 'hidden');
    expect(first).toMatchObject({ count: 1, disqualified: false });
    expect(b.disqualified).toBeFalsy();

    // Tín hiệu trùng (blur ngay sau hidden) không tính thêm
    expect(machine.reportTabLeave(b.id, 'blur')).toBeNull();
    expect(b.tabLeaveCount).toBe(1);

    vi.advanceTimersByTime(GAME_CONFIG.ANTI_CHEAT.DEDUPE_MS + 10);
    const second = machine.reportTabLeave(b.id, 'blur');
    expect(second).toMatchObject({ count: 2, disqualified: true });
    expect(b.disqualified).toBe(true);
    expect(callbacks.broadcastAntiCheat).toHaveBeenCalledTimes(2);

    const reasons = machine.room.history.filter((e) => e.playerId === b.id).map((e) => e.reason);
    expect(reasons).toEqual(['tab_leave_warning', 'tab_leave_disqualified']);

    // Đã loại thì không báo thêm
    vi.advanceTimersByTime(5000);
    expect(machine.reportTabLeave(b.id, 'blur')).toBeNull();
    vi.useRealTimers();
  });

  it('không tính ở Sảnh chờ / màn Sẵn sàng và không áp dụng cho khán giả', () => {
    const { machine, c } = setup('AC0002');
    expect(machine.reportTabLeave(c.id, 'hidden')).toBeNull(); // LOBBY
    machine.room.state = { round: 'READY', subPhase: 'WAITING_READY', deadline: null };
    expect(machine.reportTabLeave(c.id, 'hidden')).toBeNull();

    machine.switchSeat(c.id, 'viewer', 1);
    machine.room.state = { round: 'TANG_TOC', subPhase: 'QUESTION', deadline: Date.now() + 30000 };
    expect(machine.reportTabLeave(c.id, 'hidden')).toBeNull();
    expect(c.tabLeaveCount || 0).toBe(0);
  });

  it('thí sinh bị loại không bấm chuông / nộp bài được nữa', () => {
    const { machine, b } = setup('AC0003');
    b.disqualified = true;
    machine.room.status = 'KD_CHUNG';
    machine.room.state = {
      round: 'KD_CHUNG',
      subPhase: 'QUESTION_BUZZ',
      deadline: Date.now() + 15000,
      buzzerLockedBy: null,
      currentQuestion: { id: 'q1', type: 'text', prompt: 'x', answer: 'y', alternatives: [] },
    };
    expect(machine.handleBuzzer(b.id)).toBe(false);

    machine.room.state = { ...machine.room.state, round: 'TANG_TOC', subPhase: 'QUESTION' };
    expect(machine.submitAnswer(b.id, 'q1', 'y')).toBe(false);
  });

  it('Khởi động riêng: người đang thi bị loại -> chuyển ngay sang thí sinh kế tiếp', async () => {
    const { machine, a, b } = setup('AC0004');
    await (machine as any).startKhoiDongRieng();
    expect(machine.room.state.round).toBe('KD_RIENG');
    expect(machine.room.state.activePlayerId).toBe(a.id);

    // Người 1 vi phạm 2 lần (bỏ qua chống trùng bằng cách xóa mốc thời gian)
    machine.reportTabLeave(a.id, 'hidden');
    (machine as any).lastTabLeaveAt.clear();
    machine.reportTabLeave(a.id, 'hidden');
    expect(a.disqualified).toBe(true);

    // Pha chọn gói bị kết thúc ngay -> xác nhận 2.5s -> bỏ qua người bị loại -> tới lượt người 2
    await sleep(3000); // 2.5s xác nhận + 0.3s bù trễ mạng
    expect(machine.room.state.activePlayerId).toBe(b.id);
  }, 10000);

  it('người bị loại không thể vô địch dù điểm cao nhất', async () => {
    const { machine, a, b, c } = setup('AC0005');
    a.score = 200; a.disqualified = true;
    b.score = 100; c.score = 50;
    await (machine as any).checkFinishOrTiebreak();
    expect(machine.room.state.winnerId).toBe(b.id);
  });
});
