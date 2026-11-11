import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

describe('Luật mặc định: 2 lần cảnh cáo, từ lần 3 mỗi lần trừ 20 điểm', () => {
  it('lần 1, 2 chỉ cảnh cáo; lần 3, 4 mỗi lần trừ 20 điểm; không bao giờ tự loại', () => {
    vi.useFakeTimers();
    const { machine, callbacks, b } = setup('ACP001');
    expect(GAME_CONFIG.ANTI_CHEAT.PENALTY_FROM_VIOLATION).toBe(3);
    expect(GAME_CONFIG.ANTI_CHEAT.PENALTY_POINTS).toBe(20);
    expect(GAME_CONFIG.ANTI_CHEAT.DISQUALIFY_AT_VIOLATION).toBe(0);
    machine.room.status = 'TANG_TOC';
    machine.room.state = { round: 'TANG_TOC', subPhase: 'QUESTION', deadline: Date.now() + 30000 };
    b.score = 50;

    const leave = () => {
      const a = machine.reportTabLeave(b.id, 'hidden');
      vi.advanceTimersByTime(GAME_CONFIG.ANTI_CHEAT.DEDUPE_MS + 10);
      return a;
    };

    expect(leave()).toMatchObject({ count: 1, penalty: 0, disqualified: false });
    expect(leave()).toMatchObject({ count: 2, penalty: 0, disqualified: false });
    expect(b.score).toBe(50);

    expect(leave()).toMatchObject({ count: 3, penalty: 20, disqualified: false });
    expect(b.score).toBe(30);
    expect(b.roundScores.tt).toBe(-20);

    expect(leave()).toMatchObject({ count: 4, penalty: 20 });
    expect(b.score).toBe(10);

    // Vẫn tiếp tục trừ (có thể âm điểm), không bị loại
    for (let i = 0; i < 3; i++) leave();
    expect(b.score).toBe(-50);
    expect(b.disqualified).toBeFalsy();

    // Biên bản: 2 lần cảnh cáo (0 điểm) rồi các lần trừ điểm
    const reasons = machine.room.history.filter((e) => e.playerId === b.id).map((e) => `${e.reason}:${e.delta}`);
    expect(reasons.slice(0, 4)).toEqual(['tab_leave_warning:0', 'tab_leave_warning:0', 'tab_leave_penalty:-20', 'tab_leave_penalty:-20']);
    // Bảng điểm cả phòng được cập nhật khi trừ
    expect(callbacks.broadcastScoreUpdate).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('Chỉ tính khi câu hỏi đang mở', () => {
  it('lúc công bố đáp án, chọn gói, chọn hàng... rời tab không bị tính', () => {
    const { machine, b } = setup('ACP002');
    const notCounted: [string, string][] = [
      ['TANG_TOC', 'REVEAL'], ['KD_RIENG', 'CHOOSE_PACKAGE'], ['KD_RIENG', 'REVEAL'], ['VCNV', 'PICK_ROW'],
      ['VCNV', 'ROW_REVEAL'], ['VE_DICH', 'CHOOSE_PACKAGE'], ['VE_DICH', 'PACKAGE_CHOSEN'], ['TIEBREAK', 'DRAW_LOTS'],
    ];
    for (const [round, subPhase] of notCounted) {
      machine.room.state = { round: round as any, subPhase, deadline: Date.now() + 5000 };
      expect(machine.reportTabLeave(b.id, 'hidden')).toBeNull();
    }
    expect(b.tabLeaveCount || 0).toBe(0);

    machine.room.state = { round: 'VCNV', subPhase: 'ROW_QUESTION', deadline: Date.now() + 5000 };
    expect(machine.reportTabLeave(b.id, 'hidden')).toMatchObject({ count: 1 });
  });
});

describe('Chống gian lận rời tab', () => {

  // Các test dưới đây kiểm tra cơ chế tự loại khỏi trận, nên bật lại tùy chọn đó (mặc định đang tắt)
  const DEFAULT_DISQUALIFY_AT = GAME_CONFIG.ANTI_CHEAT.DISQUALIFY_AT_VIOLATION;
  beforeEach(() => {
    GAME_CONFIG.ANTI_CHEAT.DISQUALIFY_AT_VIOLATION = 2;
  });
  afterEach(() => {
    GAME_CONFIG.ANTI_CHEAT.DISQUALIFY_AT_VIOLATION = DEFAULT_DISQUALIFY_AT;
  });

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

    // Lúc chọn ô (chưa có câu hỏi) rời tab không bị tính
    expect(machine.reportTabLeave(a.id, 'hidden')).toBeNull();
    expect(a.tabLeaveCount || 0).toBe(0);

    // Chọn ô -> 2.5s xác nhận -> câu hỏi mở
    machine.chooseKdPackage(a.id, 0);
    await sleep(3000);
    expect(machine.room.state.subPhase).toBe('QUESTION');

    // Người 1 vi phạm 2 lần khi câu hỏi đang mở (bỏ qua chống trùng bằng cách xóa mốc thời gian)
    machine.reportTabLeave(a.id, 'hidden');
    (machine as any).lastTabLeaveAt.clear();
    machine.reportTabLeave(a.id, 'hidden');
    expect(a.disqualified).toBe(true);

    // Câu hỏi bị kết thúc ngay -> công bố 3s -> bỏ qua người bị loại -> tới lượt người 2
    await sleep(3500);
    expect(machine.room.state.activePlayerId).toBe(b.id);
  }, 15000);

  it('người bị loại không thể vô địch dù điểm cao nhất', async () => {
    const { machine, a, b, c } = setup('AC0005');
    a.score = 200; a.disqualified = true;
    b.score = 100; c.score = 50;
    await (machine as any).checkFinishOrTiebreak();
    expect(machine.room.state.winnerId).toBe(b.id);
  });
});
