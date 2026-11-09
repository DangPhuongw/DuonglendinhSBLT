import { describe, it, expect, vi, afterEach } from 'vitest';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';

function createMockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(),
    broadcastPhaseChange: vi.fn(),
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
  const p2 = machine.addPlayer('Bình', 't2').player!;
  const p3 = machine.addPlayer('Chi', 't3').player!;
  const p1 = machine.room.players[0];
  return { machine, callbacks, p1, p2, p3 };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Khởi động riêng: không nhận đáp án sau khi đã công bố', () => {
  it('từ chối đáp án ở pha REVEAL và không cộng điểm', () => {
    const { machine, p1 } = setup('B2KD01');
    const q = (machine as any).questionSet.khoiDong.rieng[0][0];
    machine.room.status = 'KD_RIENG';
    machine.room.state = {
      round: 'KD_RIENG',
      subPhase: 'REVEAL',
      activePlayerId: p1.id,
      deadline: Date.now() + 3000,
      currentQuestion: q,
    };

    expect(machine.submitAnswer(p1.id, q.id, q.answer)).toBe(false);
    expect(p1.score).toBe(0);
    expect(machine.room.history).toHaveLength(0);
  });

  it('vẫn nhận đáp án ở pha QUESTION', () => {
    const { machine, p1 } = setup('B2KD02');
    const q = (machine as any).questionSet.khoiDong.rieng[0][0];
    machine.room.status = 'KD_RIENG';
    machine.room.state = {
      round: 'KD_RIENG',
      subPhase: 'QUESTION',
      activePlayerId: p1.id,
      deadline: Date.now() + 15000,
      currentQuestion: q,
    };

    expect(machine.submitAnswer(p1.id, q.id, 'A')).toBe(true);
  });
});

describe('Tăng tốc: không nhận đáp án ở pha REVEAL', () => {
  it('từ chối đáp án nộp muộn', () => {
    const { machine, p1 } = setup('B2TT01');
    const q = (machine as any).questionSet.tangToc[0];
    machine.room.status = 'TANG_TOC';
    machine.room.state = {
      round: 'TANG_TOC',
      subPhase: 'REVEAL',
      deadline: Date.now() + 6000,
      currentQuestion: q,
    };
    expect(machine.submitAnswer(p1.id, q.id, q.answer)).toBe(false);
  });
});

describe('Câu hỏi phụ', () => {
  it('chỉ người bằng điểm mới bấm được chuông; người ngoài bị từ chối riêng', () => {
    const { machine, callbacks, p1, p2, p3 } = setup('B2TB01');
    const q = (machine as any).questionSet.tieBreak[0];
    machine.room.status = 'TIEBREAK';
    machine.room.state = {
      round: 'TIEBREAK',
      subPhase: 'BUZZ_OPEN',
      deadline: Date.now() + 15000,
      currentQuestion: q,
      eligiblePlayerIds: [p1.id, p2.id],
      buzzerLockedBy: null,
    };

    expect(machine.handleBuzzer(p3.id)).toBe(false);
    expect(machine.room.state.buzzerLockedBy).toBeNull();
    expect(callbacks.broadcastBuzzRejected).toHaveBeenCalledWith(p3.id, expect.anything());

    expect(machine.handleBuzzer(p2.id)).toBe(true);
    expect(machine.room.state.activePlayerId).toBe(p2.id);
  });

  it('trả lời sai thì sang câu kế tiếp, không lặp mãi câu 2', async () => {
    vi.useFakeTimers();
    const { machine, p1, p2 } = setup('B2TB02');
    const questions = (machine as any).questionSet.tieBreak;
    expect(questions.length).toBeGreaterThanOrEqual(3);
    machine.room.status = 'TIEBREAK';

    await (machine as any).runTiebreakQuestion(0, [p1.id, p2.id]);
    expect(machine.room.state.currentQuestion.id).toBe(questions[0].id);

    // Câu 1: p1 trả lời sai
    machine.room.state.activePlayerId = p1.id;
    await (machine as any).evaluateTiebreakAnswer(p1.id, 'sai');
    await vi.advanceTimersByTimeAsync(3100);
    expect(machine.room.state.currentQuestion.id).toBe(questions[1].id);

    // Câu 2: p2 trả lời sai -> phải sang câu 3 (trước đây bị lặp lại câu 2)
    machine.room.state.activePlayerId = p2.id;
    await (machine as any).evaluateTiebreakAnswer(p2.id, 'sai');
    await vi.advanceTimersByTimeAsync(3100);
    expect(machine.room.state.currentQuestion.id).toBe(questions[2].id);
  });
});

describe('Từ chối bấm chuông gửi riêng', () => {
  it('khán giả bấm chuông chỉ báo cho chính khán giả đó', () => {
    const { machine, callbacks } = setup('B2PR01');
    const viewer = machine.addPlayer('Khán giả 1', 'tv1');
    // Phòng đã đủ 3 thí sinh nên người vào sau là thí sinh; ép thành khán giả
    viewer.player!.role = 'viewer';

    expect(machine.handleBuzzer(viewer.player!.id)).toBe(false);
    expect(callbacks.broadcastBuzzRejected).toHaveBeenCalledWith(viewer.player!.id, expect.anything());
    expect(callbacks.broadcastBuzzRejected).not.toHaveBeenCalledWith(null, expect.anything());
  });
});
