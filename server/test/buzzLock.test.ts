import { describe, it, expect, vi, afterEach } from 'vitest';
import { GAME_CONFIG } from '@olympia/shared';
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

function setup(code: string) {
  const callbacks = createMockCallbacks();
  const machine = new RoomStateMachine(code, { id: 'p1', name: 'An', token: 't1' }, callbacks);
  const p2 = machine.addPlayer('Bình', 't2').player!;
  const p3 = machine.addPlayer('Chi', 't3').player!;
  return { machine, callbacks, p1: machine.room.players[0], p2, p3 };
}

const LOCK_MS = GAME_CONFIG.BUZZ_LOCK_SECONDS * 1000;

afterEach(() => {
  vi.useRealTimers();
});

describe('Khóa chuông 3 giây', () => {
  it('Khởi động chung: bấm trong 3s đầu bị từ chối riêng, hết khóa mới bấm được', async () => {
    vi.useFakeTimers();
    const { machine, callbacks, p2 } = setup('LK0001');
    machine.room.status = 'KD_CHUNG';
    await (machine as any).runKdChungQuestion(0);

    expect(GAME_CONFIG.BUZZ_LOCK_SECONDS).toBe(3);
    expect(machine.room.state.buzzUnlockAt! - Date.now()).toBe(LOCK_MS);

    expect(machine.handleBuzzer(p2.id)).toBe(false);
    expect(callbacks.broadcastBuzzRejected).toHaveBeenCalledWith(p2.id, { reason: expect.stringContaining('khóa') });
    expect(machine.room.state.subPhase).toBe('QUESTION_BUZZ');
    expect(machine.room.state.buzzerLockedBy).toBeNull();

    await vi.advanceTimersByTimeAsync(LOCK_MS - 500);
    expect(machine.handleBuzzer(p2.id)).toBe(false);

    await vi.advanceTimersByTimeAsync(500);
    expect(machine.handleBuzzer(p2.id)).toBe(true);
    expect(machine.room.state.activePlayerId).toBe(p2.id);
  });

  it('Khởi động chung: thời gian giành chuông 15s không bị rút ngắn bởi 3s khóa', async () => {
    vi.useFakeTimers();
    const { machine } = setup('LK0002');
    machine.room.status = 'KD_CHUNG';
    await (machine as any).runKdChungQuestion(0);
    expect(machine.room.state.deadline! - Date.now()).toBe(LOCK_MS + GAME_CONFIG.KHOI_DONG.CHUNG_BUZZ_SECONDS * 1000);
  });

  it('Khởi động chung: bấm trước khi mở khóa không làm mất quyền bấm lần sau', async () => {
    vi.useFakeTimers();
    const { machine, p2 } = setup('LK0003');
    machine.room.status = 'KD_CHUNG';
    await (machine as any).runKdChungQuestion(0);
    machine.handleBuzzer(p2.id);
    machine.handleBuzzer(p2.id);
    await vi.advanceTimersByTimeAsync(LOCK_MS + 10);
    expect(machine.handleBuzzer(p2.id)).toBe(true);
  });

  it('Về đích: chuông cướp điểm khóa 3s đầu và thời gian cướp vẫn 5s sau khi mở', async () => {
    vi.useFakeTimers();
    const { machine, callbacks, p1, p2 } = setup('LK0004');
    const q = (machine as any).questionSet.veDich.pool10[0];
    machine.room.status = 'VE_DICH';
    (machine as any).veDichActiveContestantId = p1.id;
    (machine as any).veDichCurrentQuestionPoints = 10;
    (machine as any).veDichCurrentPointsList = [10, 10, 20];
    (machine as any).veDichCurrentQuestion = q;
    machine.room.state = { round: 'VE_DICH', subPhase: 'QUESTION', activePlayerId: p1.id, currentQuestion: q, deadline: Date.now() + 1000 };

    await (machine as any).evaluateVeDichMainAnswer(p1.id, q, [10, 10, 20], 0); // không trả lời -> mở cướp điểm
    expect(machine.room.state.subPhase).toBe('STEAL_BUZZ');
    expect(machine.room.state.buzzUnlockAt! - Date.now()).toBe(LOCK_MS);
    expect(machine.room.state.deadline! - Date.now()).toBe(LOCK_MS + GAME_CONFIG.VE_DICH.STEAL_BUZZ_SECONDS * 1000);

    expect(machine.handleBuzzer(p2.id)).toBe(false);
    expect(callbacks.broadcastBuzzRejected).toHaveBeenCalledWith(p2.id, { reason: expect.stringContaining('khóa') });

    await vi.advanceTimersByTimeAsync(LOCK_MS + 10);
    expect(machine.handleBuzzer(p2.id)).toBe(true);
    expect(machine.room.state.subPhase).toBe('STEAL_ANSWER');
  });

  it('Câu hỏi phụ không bị ảnh hưởng (đã có 3s chờ tín hiệu riêng)', async () => {
    vi.useFakeTimers();
    const { machine, p1, p2 } = setup('LK0005');
    machine.room.status = 'TIEBREAK';
    await (machine as any).runTiebreakQuestion(0, [p1.id, p2.id]);
    expect(machine.room.state.buzzUnlockAt).toBeUndefined();
  });
});
