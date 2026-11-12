import { describe, it, expect, vi, afterEach } from 'vitest';
import { GAME_CONFIG } from '@olympia/shared';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';

function mockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(), broadcastBuzzWon: vi.fn(), broadcastBuzzRejected: vi.fn(), emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(), broadcastScoreUpdate: vi.fn(), broadcastPlayerUpdate: vi.fn(), broadcastAntiCheat: vi.fn(),
  };
}

afterEach(() => vi.useRealTimers());

describe('Màn nhắc luật Khởi động chung', () => {
  it('hết lượt Khởi động riêng thì hiện màn nhắc luật, sau vài giây mới vào câu 1', async () => {
    vi.useFakeTimers();
    const machine = new RoomStateMachine('INTRO1', { id: 'p1', name: 'An', token: 't1' }, mockCallbacks());
    const p2 = machine.addPlayer('Bình', 't2').player!;

    // Mọi lượt riêng đã xong -> sang Khởi động chung
    await (machine as any).runKhoiDongRiengTurn(machine.room.players, machine.room.players.length, 0);

    expect(machine.room.state.round).toBe('KD_CHUNG');
    expect(machine.room.state.subPhase).toBe('INTRO');
    expect(machine.room.state.deadline! - Date.now()).toBe(GAME_CONFIG.KHOI_DONG.CHUNG_INTRO_SECONDS * 1000);
    expect(machine.room.state.currentQuestion).toBeUndefined();

    // Bấm chuông trong lúc nhắc luật không có tác dụng (và không bị phạt)
    expect(machine.handleBuzzer(p2.id)).toBe(false);
    expect(p2.score).toBe(0);

    await vi.advanceTimersByTimeAsync(GAME_CONFIG.KHOI_DONG.CHUNG_INTRO_SECONDS * 1000 + GAME_CONFIG.NETWORK_GRACE_MS + 50);
    expect(machine.room.state.subPhase).toBe('QUESTION_BUZZ');
    expect(machine.room.state.currentQuestion?.id).toBe(machine.questionSet.khoiDong.chung[0].id);
    machine.dispose();
  });
});
