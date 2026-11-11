import { describe, it, expect, vi, afterEach } from 'vitest';
import { GAME_CONFIG, Room } from '@olympia/shared';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';
import { SnapshotManager } from '../src/game/SnapshotManager.js';
import { validateQuestionSet } from '../src/game/questionValidator.js';
import { DEFAULT_QUESTION_SET } from '../src/game/defaultQuestionSet.js';
import { generateExcelTemplate, parseExcelQuestionSet } from '../src/game/questionParser.js';
import { csvCell } from '../src/utils/csv.js';

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
  const p1 = machine.room.players[0];
  return { machine, callbacks, p1, p2, p3 };
}

const GRACE = GAME_CONFIG.NETWORK_GRACE_MS;

afterEach(() => {
  vi.useRealTimers();
});

// ---------------- Đợt 4 ----------------
describe('Đợt 4: đồng hồ', () => {
  it('đặt lại đồng hồ thì tác vụ hết giờ cũ không chạy', async () => {
    vi.useFakeTimers();
    const { machine } = setup('B4T001');
    const oldFn = vi.fn(async () => {});
    const newFn = vi.fn(async () => {});
    (machine as any).setDeadline(1000, oldFn);
    (machine as any).setDeadline(1000, newFn);
    await vi.advanceTimersByTimeAsync(1000 + GRACE + 50);
    expect(oldFn).not.toHaveBeenCalled();
    expect(newFn).toHaveBeenCalledTimes(1);
  });

  it('đáp án tới trong khoảng bù trễ mạng vẫn được chấm, và chỉ chấm 1 lần', async () => {
    vi.useFakeTimers();
    const { machine, p2 } = setup('B4T002');
    machine.room.status = 'KD_CHUNG';
    await (machine as any).runKdChungQuestion(0);
    const q = (machine as any).questionSet.khoiDong.chung[0];

    // Chuông khóa 3s đầu mỗi lượt giành chuông
    await vi.advanceTimersByTimeAsync(GAME_CONFIG.BUZZ_LOCK_SECONDS * 1000 + 10);
    expect(machine.handleBuzzer(p2.id)).toBe(true);
    // Quá deadline 3s nhưng vẫn trong 300ms bù trễ
    await vi.advanceTimersByTimeAsync(GAME_CONFIG.KHOI_DONG.CHUNG_ANSWER_SECONDS * 1000 + GRACE / 2);
    expect(machine.room.state.subPhase).toBe('ANSWERING');
    expect(machine.submitAnswer(p2.id, q.id, q.answer)).toBe(true);

    await vi.advanceTimersByTimeAsync(2000);
    const events = machine.room.history.filter((e) => e.playerId === p2.id && e.questionId === q.id);
    expect(events).toHaveLength(1);
    expect(events[0].delta).toBe(GAME_CONFIG.KHOI_DONG.CHUNG_CORRECT_POINTS);
  });
});

// ---------------- Đợt 5 ----------------
describe('Đợt 5: chuông VCNV', () => {
  it('trả lời sai lúc đoán cuối thì chạy tiếp thời gian còn lại, không đếm lại 15s', async () => {
    vi.useFakeTimers();
    const { machine, p2 } = setup('B5V002');
    await (machine as any).startVcnv();
    await (machine as any).presentVcnvFinalGuess();

    await vi.advanceTimersByTimeAsync(5000);
    expect(machine.handleBuzzer(p2.id)).toBe(true);
    expect(machine.room.state.subPhase).toBe('FINAL_GUESS_ANSWERING');

    await (machine as any).evaluateCnvGuess(p2.id, 'sai');
    expect(machine.room.state.subPhase).toBe('FINAL_GUESS');
    const remaining = machine.room.state.deadline - Date.now();
    expect(remaining).toBeGreaterThan(9000);
    expect(remaining).toBeLessThanOrEqual(10000);
  });

  it('khán giả không được tính là thí sinh còn lại trong VCNV', async () => {
    const { machine, p1, p2, p3 } = setup('B5V003');
    const v = machine.addPlayer('Khán giả', 'tv').player!;
    v.role = 'viewer';
    const active = (machine as any).getActiveVcnvContestants().map((p: any) => p.id);
    expect(active).toEqual([p1.id, p2.id, p3.id]);
  });
});

// ---------------- Đợt 6 ----------------
describe('Đợt 6: chủ phòng sửa điểm', () => {
  function withReveal(machine: RoomStateMachine, round: any, results: any[]) {
    (machine as any).lastRevealedPayload = {
      questionId: 'q-x',
      correctAnswer: 'X',
      results,
      overrideWindowExpiresAt: Date.now() + 10000,
    };
    (machine as any).lastRevealRound = round;
  }

  it('Tăng tốc: sửa thành đúng thì tính điểm theo thứ hạng thời gian', () => {
    const { machine, p2, p3 } = setup('B6O001');
    withReveal(machine, 'TANG_TOC', [
      { playerId: p2.id, answer: 'X', isCorrect: true, timeSec: 2, delta: 30 },
      { playerId: p3.id, answer: 'gan dung', isCorrect: false, timeSec: 5, delta: 0 },
    ]);
    expect(machine.overrideScore('p1', 'q-x', p3.id, true)).toBe(true);
    expect(p3.score).toBe(GAME_CONFIG.TANG_TOC.POINTS_BY_RANK[1]);
  });

  it('dùng luật của vòng chứa câu hỏi dù phòng đã sang màn Sẵn sàng', () => {
    const { machine, p2 } = setup('B6O002');
    machine.room.state = { round: 'READY', subPhase: 'WAITING_READY', deadline: null, targetRound: 'VCNV' };
    withReveal(machine, 'KD_CHUNG', [{ playerId: p2.id, answer: 'Y', isCorrect: false, delta: -5 }]);
    expect(machine.overrideScore('p1', 'q-x', p2.id, true)).toBe(true);
    // -5 -> +10: điều chỉnh +15
    expect(p2.score).toBe(15);
  });

  it('chủ phòng không tự sửa điểm của chính mình', () => {
    const { machine, p1 } = setup('B6O003');
    withReveal(machine, 'KD_RIENG', [{ playerId: p1.id, answer: 'A', isCorrect: false, delta: 0 }]);
    expect(machine.overrideScore('p1', 'q-x', p1.id, true)).toBe(false);
    expect(p1.score).toBe(0);
  });
});

// ---------------- Đợt 7 ----------------
describe('Đợt 7: bộ đề và khôi phục', () => {
  it('bộ đề mặc định và file mẫu Excel đều hợp lệ', () => {
    expect(validateQuestionSet(DEFAULT_QUESTION_SET).ok).toBe(true);
    const parsed = parseExcelQuestionSet(generateExcelTemplate(), 'Mẫu');
    const res = validateQuestionSet(parsed);
    if (!res.ok) console.error(res.errors);
    expect(res.ok).toBe(true);
  });

  it('Khởi động riêng chỉ hiện các gói có câu hỏi', () => {
    const { machine } = setup('B7K001');
    const rieng = DEFAULT_QUESTION_SET.khoiDong.rieng.slice(0, 4).concat([[]]);
    (machine as any).questionSet = { ...DEFAULT_QUESTION_SET, khoiDong: { ...DEFAULT_QUESTION_SET.khoiDong, rieng } };
    const pkgs = (machine as any).getKdPackagesList();
    expect(pkgs.map((p: any) => p.index)).toEqual([0, 1, 2, 3]);
    expect(pkgs.every((p: any) => p.count > 0)).toBe(true);
  });

  it('báo lỗi rõ ràng khi bộ đề thiếu phần bắt buộc', () => {
    const broken = JSON.parse(JSON.stringify(DEFAULT_QUESTION_SET));
    broken.veDich.pool30 = [];
    broken.vcnv.obstacle.answer = '';
    const res = validateQuestionSet(broken);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.includes('Về đích 30 điểm'))).toBe(true);
      expect(res.errors.some((e) => e.includes('chướng ngại vật') && e.includes('đáp án'))).toBe(true);
    }
    expect(validateQuestionSet(null).ok).toBe(false);
  });

  it('bộ đề được lưu ra đĩa và đọc lại được', () => {
    const { machine } = setup('B7Q001');
    const qs = { ...DEFAULT_QUESTION_SET, id: 'custom-1', title: 'Bộ đề riêng' };
    machine.setQuestionSet(qs);
    expect(machine.room.questionSetId).toBe('custom-1');
    expect(SnapshotManager.loadQuestionSet('B7Q001')?.title).toBe('Bộ đề riêng');
    SnapshotManager.deleteRoom('B7Q001');
    expect(SnapshotManager.loadQuestionSet('B7Q001')).toBeNull();
  });

  it('khởi động lại giữa vòng VCNV: quay về màn Sẵn sàng của vòng đó và trừ lại điểm VCNV', () => {
    const { machine, p2 } = setup('B7R001');
    const saved: Room = JSON.parse(JSON.stringify(machine.room));
    const savedP2 = saved.players.find((p) => p.id === p2.id)!;
    savedP2.score = 50;
    savedP2.roundScores = { kd: 30, vcnv: 20, tt: 0, vd: 0 };
    saved.status = 'VCNV';
    saved.state = { round: 'VCNV', subPhase: 'ROW_QUESTION', deadline: Date.now() + 10000 };

    const restored = new RoomStateMachine('B7R001', { id: 'p1', name: 'An', token: 't1' }, createMockCallbacks());
    restored.restoreFromSnapshot(saved);

    expect(restored.room.state.round).toBe('READY');
    expect(restored.room.state.targetRound).toBe('VCNV');
    const r2 = restored.room.players.find((p) => p.id === p2.id)!;
    expect(r2.score).toBe(30);
    expect(r2.roundScores.vcnv).toBe(0);
    expect(r2.roundScores.kd).toBe(30);
    expect(restored.room.players.every((p) => !p.connected)).toBe(true);
    SnapshotManager.deleteRoom('B7R001');
  });

  it('thiếu câu Về đích ở một mức điểm thì bỏ qua lượt, không làm treo trận', async () => {
    const { machine, p1 } = setup('B7V001');
    (machine as any).questionSet = { ...DEFAULT_QUESTION_SET, veDich: { pool10: [], pool20: [], pool30: [] } };
    p1.score = 10; // có người dẫn đầu rõ ràng -> kết thúc trận, không vào câu hỏi phụ
    (machine as any).veDichPlayerQueue = [p1.id];
    await (machine as any).runVeDichQuestion(p1.id, [10, 10, 20], 0, 0);
    // Hết người trong hàng đợi -> màn công bố điểm, sau đó mới kết thúc trận
    expect(machine.room.state.round).toBe('ROUND_RESULTS');
    expect(machine.room.state.roundResults?.nextRound).toBe('FINAL');
    machine.dispose();
  });
});

// ---------------- Đợt 8 ----------------
describe('Đợt 8: dọn dẹp', () => {
  it('ô CSV chặn chèn công thức và xử lý dấu nháy kép', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('An "Bé"')).toBe('"An ""Bé"""');
    expect(csvCell(-5)).toBe('-5');
  });

  it('bấm sẵn sàng thêm lần nữa trong lúc đếm ngược không làm đếm lại', async () => {
    const { machine, p1, p2, p3 } = setup('B8R001');
    machine.jumpToRound('p1', 'VCNV');
    await new Promise((r) => setTimeout(r, 20));
    machine.setPlayerReady(p1.id, true);
    machine.setPlayerReady(p2.id, true);
    machine.setPlayerReady(p3.id, true);
    expect(machine.room.state.subPhase).toBe('COUNTDOWN');
    const deadline = machine.room.state.deadline;

    await new Promise((r) => setTimeout(r, 30));
    machine.setPlayerReady(p1.id, true);
    expect(machine.room.state.deadline).toBe(deadline);
    machine.dispose();
  });

  it('không gửi lịch sử điểm kèm mỗi lần đồng bộ', () => {
    const { machine, p2 } = setup('B8H001');
    (machine as any).addScore(p2.id, 'KD_RIENG', 'q', 10, 'correct');
    expect(machine.room.history.length).toBeGreaterThan(0);
    expect(machine.getSanitizedRoom().history).toEqual([]);
  });
});
