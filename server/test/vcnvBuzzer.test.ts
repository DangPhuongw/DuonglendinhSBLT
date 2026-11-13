import { describe, it, expect, vi, afterEach } from 'vitest';
import { GAME_CONFIG } from '@olympia/shared';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';

function mockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(), broadcastBuzzWon: vi.fn(), broadcastBuzzRejected: vi.fn(), emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(), broadcastScoreUpdate: vi.fn(), broadcastPlayerUpdate: vi.fn(), broadcastAntiCheat: vi.fn(),
  };
}

async function setup(code: string) {
  const callbacks = mockCallbacks();
  const machine = new RoomStateMachine(code, { id: 'p1', name: 'An', token: 't1' }, callbacks);
  const p2 = machine.addPlayer('Bình', 't2').player!;
  const p3 = machine.addPlayer('Chi', 't3').player!;
  const p1 = machine.room.players[0];
  await (machine as any).startVcnv();
  const obstacle = (machine as any).questionSet.vcnv.obstacle;
  return { machine, callbacks, p1, p2, p3, obstacle };
}

const ROW_MS = GAME_CONFIG.VCNV.ROW_TIME_SECONDS * 1000;
const CNV_MS = GAME_CONFIG.VCNV.CNV_ANSWER_SECONDS * 1000;
const GRACE = GAME_CONFIG.NETWORK_GRACE_MS;
const state = (m: RoomStateMachine) => m.room.state as any;

afterEach(() => vi.useRealTimers());

describe('VCNV: chuông bấm được ngay sau khi ô đầu tiên mở', () => {
  it('trước khi ô đầu tiên mở thì chuông chưa mở', async () => {
    const { machine, callbacks, p2 } = await setup('VB0001');
    expect(machine.handleBuzzer(p2.id)).toBe(false);
    expect(callbacks.broadcastBuzzRejected).toHaveBeenCalledWith(p2.id, expect.anything());
    machine.dispose();
  });

  it('bấm chuông giữa câu hàng ngang: màn nhập từ khóa hiện ngay, câu hàng ngang tạm dừng', async () => {
    vi.useFakeTimers();
    const { machine, p2, obstacle } = await setup('VB0002');
    await (machine as any).presentVcnvRow(0, 0);
    await vi.advanceTimersByTimeAsync(10000);

    expect(machine.handleBuzzer(p2.id)).toBe(true);
    expect(state(machine).subPhase).toBe('CNV_ANSWERING');
    expect(state(machine).activePlayerId).toBe(p2.id);
    expect(state(machine).currentQuestion.id).toBe(obstacle.id);
    expect(state(machine).deadline - Date.now()).toBe(CNV_MS);

    // Câu hàng ngang không tự công bố trong lúc người bấm chuông đang nhập
    await vi.advanceTimersByTimeAsync(ROW_MS);
    expect(state(machine).subPhase).not.toBe('ROW_REVEAL');
    machine.dispose();
  });
});

describe('VCNV: trả lời sai thì câu đang chạy chạy lại từ đầu', () => {
  it('sai giữa câu hàng ngang: bị loại, câu hỏi chạy lại với đồng hồ đầy và đáp án cũ bị xóa', async () => {
    vi.useFakeTimers();
    const { machine, p1, p2, p3 } = await setup('VB0003');
    await (machine as any).presentVcnvRow(0, 0);
    const rowQ = state(machine).currentQuestion;
    machine.submitAnswer(p3.id, rowQ.id, 'đáp án đã gõ');
    await vi.advanceTimersByTimeAsync(12000);

    machine.handleBuzzer(p2.id);
    machine.submitAnswer(p2.id, state(machine).currentQuestion.id, 'sai bét');
    await vi.advanceTimersByTimeAsync(50);

    expect(p2.eliminatedVcnv).toBe(true);
    expect(state(machine).subPhase).toBe('ROW_QUESTION');
    expect(state(machine).currentQuestion.id).toBe(rowQ.id);
    expect(state(machine).activeRowIndex).toBe(0);
    expect(state(machine).deadline - Date.now()).toBeGreaterThan(ROW_MS - 1000);
    expect((machine as any).answersMap.size).toBe(0);
    expect(state(machine).buzzerLockedBy).toBeNull();

    // Người còn lại vẫn bấm chuông được; người đã bị loại thì không
    expect(machine.handleBuzzer(p2.id)).toBe(false);
    expect(machine.handleBuzzer(p1.id)).toBe(true);
    expect(state(machine).activePlayerId).toBe(p1.id);
    machine.dispose();
  });

  it('hết 15 giây không nhập cũng tính là sai và chạy lại câu hỏi', async () => {
    vi.useFakeTimers();
    const { machine, p2 } = await setup('VB0004');
    await (machine as any).presentVcnvRow(0, 0);
    machine.handleBuzzer(p2.id);
    await vi.advanceTimersByTimeAsync(CNV_MS + GRACE + 100);

    expect(p2.eliminatedVcnv).toBe(true);
    expect(state(machine).subPhase).toBe('ROW_QUESTION');
    expect(state(machine).deadline - Date.now()).toBeGreaterThan(ROW_MS - 1000);
    machine.dispose();
  });

  it('sai giữa câu ô trung tâm: ô trung tâm chạy lại từ đầu', async () => {
    vi.useFakeTimers();
    const { machine, p1 } = await setup('VB0005');
    await (machine as any).presentVcnvRow(0, 0);
    await (machine as any).presentVcnvCenter();
    const centerId = state(machine).currentQuestion.id;
    await vi.advanceTimersByTimeAsync(8000);

    machine.handleBuzzer(p1.id);
    expect(state(machine).subPhase).toBe('CNV_ANSWERING');
    machine.submitAnswer(p1.id, state(machine).currentQuestion.id, 'sai');
    await vi.advanceTimersByTimeAsync(50);

    expect(state(machine).subPhase).toBe('CENTER_QUESTION');
    expect(state(machine).currentQuestion.id).toBe(centerId);
    expect(state(machine).deadline - Date.now()).toBeGreaterThan(GAME_CONFIG.VCNV.CENTER_TIME_SECONDS * 1000 - 1000);
    machine.dispose();
  });

  it('bấm chuông lúc đang chọn hàng: sai thì quay lại lượt chọn hàng', async () => {
    vi.useFakeTimers();
    const { machine, p1 } = await setup('VB0006');
    await (machine as any).presentVcnvRow(0, 0);
    await vi.advanceTimersByTimeAsync(ROW_MS + GRACE + 100); // công bố hàng
    await vi.advanceTimersByTimeAsync(6000 + GRACE + 100); // sang lượt chọn hàng
    expect(state(machine).subPhase).toBe('PICK_ROW');

    machine.handleBuzzer(p1.id);
    machine.submitAnswer(p1.id, state(machine).currentQuestion.id, 'sai');
    await vi.advanceTimersByTimeAsync(50);
    expect(p1.eliminatedVcnv).toBe(true);
    expect(state(machine).subPhase).toBe('PICK_ROW');
    // Người bị loại không còn được chọn hàng
    expect(state(machine).activePlayerId).toBeTruthy();
    expect(state(machine).activePlayerId).not.toBe(p1.id);
    machine.dispose();
  });
});

describe('VCNV: nhập đúng từ khóa thì kết thúc vòng', () => {
  it('đúng giữa câu hàng ngang đầu tiên: +60 điểm, hiện kết quả rồi sang công bố điểm', async () => {
    vi.useFakeTimers();
    const { machine, p2, obstacle } = await setup('VB0007');
    await (machine as any).presentVcnvRow(0, 0);
    await vi.advanceTimersByTimeAsync(5000);

    machine.handleBuzzer(p2.id);
    machine.submitAnswer(p2.id, obstacle.id, obstacle.answer);
    await vi.advanceTimersByTimeAsync(50);

    expect(state(machine).subPhase).toBe('CNV_RESULT');
    expect(p2.score).toBe(GAME_CONFIG.VCNV.CNV_POINTS_BY_ROWS_DONE[1]);
    expect((machine as any).vcnvInterrupted).toBeNull();

    await vi.advanceTimersByTimeAsync(5000 + GRACE + 100);
    expect(state(machine).round).toBe('ROUND_RESULTS');
    machine.dispose();
  });

  it('người cuối cùng còn thi trả lời sai: vòng kết thúc, không chạy lại câu hỏi', async () => {
    vi.useFakeTimers();
    const { machine, p1, p2, p3 } = await setup('VB0008');
    p2.eliminatedVcnv = true;
    p3.eliminatedVcnv = true;
    await (machine as any).presentVcnvRow(0, 0);

    machine.handleBuzzer(p1.id);
    machine.submitAnswer(p1.id, state(machine).currentQuestion.id, 'sai');
    await vi.advanceTimersByTimeAsync(50);
    expect(p1.eliminatedVcnv).toBe(true);
    expect(state(machine).subPhase).not.toBe('ROW_QUESTION');

    await vi.advanceTimersByTimeAsync(4000 + GRACE + 100);
    expect(state(machine).round).toBe('ROUND_RESULTS');
    machine.dispose();
  });
});

describe('VCNV: câu hỏi thứ 5 (ô trung tâm) chỉ là gợi ý', () => {
  it('không nhận đáp án, không tính điểm; hết giờ thì sang lượt đoán cuối', async () => {
    vi.useFakeTimers();
    const { machine, callbacks, p1, p2 } = await setup('VB0009');
    await (machine as any).presentVcnvRow(0, 0);
    await (machine as any).presentVcnvCenter();
    const center = state(machine).currentQuestion;
    expect(state(machine).subPhase).toBe('CENTER_QUESTION');

    // Gửi đúng đáp án của câu trung tâm cũng không được nhận
    expect(machine.submitAnswer(p1.id, center.id, (machine as any).questionSet.vcnv.center.answer)).toBe(false);
    expect((machine as any).answersMap.size).toBe(0);

    await vi.advanceTimersByTimeAsync(GAME_CONFIG.VCNV.CENTER_TIME_SECONDS * 1000 + GRACE + 100);
    expect(state(machine).subPhase).toBe('FINAL_GUESS');
    expect(p1.score).toBe(0);
    expect(p2.score).toBe(0);
    // Không có màn công bố đáp án câu trung tâm
    expect(callbacks.broadcastReveal).not.toHaveBeenCalled();
    machine.dispose();
  });

  it('trong lúc câu gợi ý hiện, vẫn bấm chuông đoán từ khóa được (+20 nếu đúng)', async () => {
    vi.useFakeTimers();
    const { machine, p2, obstacle } = await setup('VB0010');
    await (machine as any).presentVcnvRow(0, 0);
    await (machine as any).presentVcnvCenter();
    expect(machine.handleBuzzer(p2.id)).toBe(true);
    machine.submitAnswer(p2.id, obstacle.id, obstacle.answer);
    await vi.advanceTimersByTimeAsync(50);
    expect(state(machine).subPhase).toBe('CNV_RESULT');
    expect(p2.score).toBe(GAME_CONFIG.VCNV.FINAL_GUESS_CORRECT_POINTS);
    machine.dispose();
  });
});

describe('VCNV: báo kết quả đoán từ khóa cho hiệu ứng ở client', () => {
  it('đoán sai: gửi kèm kết quả sai (ai, đoán gì) cho mọi máy trước khi câu hỏi chạy lại', async () => {
    vi.useFakeTimers();
    const { machine, callbacks, p2 } = await setup('VB0901');
    await (machine as any).presentVcnvRow(0, 0);
    await vi.advanceTimersByTimeAsync(5000);
    machine.handleBuzzer(p2.id);
    machine.submitAnswer(p2.id, state(machine).currentQuestion.id, 'sai bét');
    await vi.advanceTimersByTimeAsync(50);

    const sent = (callbacks.broadcastRoom as any).mock.calls.map((c: any[]) => c[0].state.vcnvGuessResult).filter(Boolean);
    expect(sent[sent.length - 1]).toMatchObject({ playerId: p2.id, correct: false, guess: 'sai bét' });
    machine.dispose();
  });

  it('đoán đúng: trạng thái kết quả có kết quả đúng kèm từ khóa đã mở', async () => {
    vi.useFakeTimers();
    const { machine, p2, obstacle } = await setup('VB0902');
    await (machine as any).presentVcnvRow(0, 0);
    await vi.advanceTimersByTimeAsync(5000);
    machine.handleBuzzer(p2.id);
    machine.submitAnswer(p2.id, obstacle.id, obstacle.answer);
    await vi.advanceTimersByTimeAsync(50);

    expect(state(machine).subPhase).toBe('CNV_RESULT');
    expect(state(machine).vcnvGuessResult).toMatchObject({ playerId: p2.id, correct: true, answer: obstacle.answer });
    expect(state(machine).obstacleAnswerRevealed.join('')).toBe(obstacle.answer.toUpperCase().replace(/\s+/g, ''));
    machine.dispose();
  });
});
