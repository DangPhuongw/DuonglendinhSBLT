import { describe, it, expect, vi, afterEach } from 'vitest';
import { GAME_CONFIG, PREDICTION_CATEGORIES, Question, QuestionSet } from '@olympia/shared';
import {
  availablePoints,
  createPredictionState,
  lockForRound,
  placeBet,
  predictionLeaderboard,
  resolveCategory,
  voidUnresolved,
} from '../src/game/predictions.js';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';
import { DEFAULT_QUESTION_SET } from '../src/game/defaultQuestionSet.js';

const P = GAME_CONFIG.PREDICTIONS;
const PLAYERS = ['a', 'b', 'c'];

describe('Bảng dự đoán: luật dự đoán', () => {
  it('mỗi người bắt đầu 1000 điểm, mỗi hạng mục 10-250, không vượt số điểm rảnh', () => {
    const s = createPredictionState();
    expect(availablePoints(s, 'v1')).toBe(P.START_POINTS);
    expect(placeBet(s, 'v1', 'champion', 'a', 5, PLAYERS).ok).toBe(false);
    expect(placeBet(s, 'v1', 'champion', 'a', 260, PLAYERS).ok).toBe(false);
    expect(placeBet(s, 'v1', 'champion', 'zzz', 100, PLAYERS)).toMatchObject({ ok: false, error: 'Lựa chọn không hợp lệ.' });

    for (const cat of ['champion', 'lowest', 'top_kd', 'top_vcnv'] as const) expect(placeBet(s, 'v1', cat, 'a', 250, PLAYERS).ok).toBe(true);
    expect(availablePoints(s, 'v1')).toBe(0);
    expect(placeBet(s, 'v1', 'top_tt', 'a', 10, PLAYERS)).toMatchObject({ ok: false });
    // Đổi dự đoán của hạng mục đã đặt thì tính lại phần của chính nó
    expect(placeBet(s, 'v1', 'champion', 'b', 200, PLAYERS).ok).toBe(true);
    expect(availablePoints(s, 'v1')).toBe(50);
    // Hủy dự đoán
    expect(placeBet(s, 'v1', 'lowest', 'a', 0, PLAYERS).ok).toBe(true);
    expect(availablePoints(s, 'v1')).toBe(300);
  });

  it('hạng mục có/không: "có thí sinh trên 250 điểm không"', () => {
    const s = createPredictionState();
    expect(placeBet(s, 'v1', 'over_250', 'yes', 50, PLAYERS).ok).toBe(true);
    expect(placeBet(s, 'v1', 'over_250', 'a', 50, PLAYERS).ok).toBe(false);
    expect(placeBet(s, 'v1', 'champion', 'yes', 50, PLAYERS).ok).toBe(false);
  });

  it('khóa đúng hạng mục theo vòng; đã khóa thì không đặt/đổi/hủy được', () => {
    const s = createPredictionState();
    placeBet(s, 'v1', 'champion', 'a', 100, PLAYERS);
    lockForRound(s, 'KD_RIENG'); // vòng 1 bắt đầu: chưa khóa gì, khóa khi hết Khởi động riêng
    expect(PREDICTION_CATEGORIES.every((c) => s.categories[c.id].status === 'open')).toBe(true);
    lockForRound(s, 'KD_CHUNG');
    const locked = PREDICTION_CATEGORIES.filter((c) => s.categories[c.id].status === 'locked').map((c) => c.id);
    expect(locked.sort()).toEqual(['champion', 'lowest', 'over_250', 'top_kd'].sort());
    expect(placeBet(s, 'v1', 'champion', 'b', 100, PLAYERS).ok).toBe(false);
    expect(placeBet(s, 'v1', 'champion', 'a', 0, PLAYERS).ok).toBe(false);
    expect(placeBet(s, 'v1', 'top_vcnv', 'b', 100, PLAYERS).ok).toBe(true);
  });

  it('đúng +điểm đã dùng, sai -điểm đã dùng, đồng hạng đều đúng, không xác định thì hoàn lại', () => {
    const s = createPredictionState();
    placeBet(s, 'v1', 'top_kd', 'a', 200, PLAYERS);
    placeBet(s, 'v2', 'top_kd', 'b', 150, PLAYERS);
    placeBet(s, 'v3', 'top_kd', 'c', 100, PLAYERS);
    placeBet(s, 'v1', 'champion', 'a', 250, PLAYERS);
    resolveCategory(s, 'top_kd', ['a', 'b']); // a và b đồng điểm cao nhất
    expect(s.balances).toMatchObject({ v1: 1200, v2: 1150, v3: 900 });
    expect(s.bets.v3.top_kd?.result).toBe('lose');

    voidUnresolved(s);
    expect(s.categories.champion.status).toBe('void');
    expect(s.bets.v1.champion?.result).toBe('void');
    expect(s.balances.v1).toBe(1200);
    // Chấm lại lần nữa không làm thay đổi gì
    resolveCategory(s, 'top_kd', ['c']);
    expect(s.balances).toMatchObject({ v1: 1200, v2: 1150, v3: 900 });

    expect(predictionLeaderboard(s).map((r) => r.viewerId)).toEqual(['v1', 'v2', 'v3']);
  });
});

// ===== Chơi trọn trận với khán giả dự đoán =====

function mockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(), broadcastBuzzWon: vi.fn(), broadcastBuzzRejected: vi.fn(), emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(), broadcastScoreUpdate: vi.fn(), broadcastPlayerUpdate: vi.fn(), broadcastAntiCheat: vi.fn(),
  };
}

const answersOf = (qs: QuestionSet) => {
  const m = new Map<string, string>();
  const add = (q: Question) => m.set(q.id, q.answer);
  qs.khoiDong.rieng.flat().forEach(add);
  qs.khoiDong.chung.forEach(add);
  [...qs.vcnv.rows, qs.vcnv.center, qs.vcnv.obstacle].forEach(add);
  qs.tangToc.forEach(add);
  [...qs.veDich.pool10, ...qs.veDich.pool20, ...qs.veDich.pool30].forEach(add);
  qs.tieBreak.forEach(add);
  return m;
};

/** Bot chơi tự động; `onTick` được gọi mỗi bước để test dự đoán giữa trận. */
async function playMatch(machine: RoomStateMachine, contestants: string[], onTick: (round: string) => void) {
  const qs = machine.questionSet;
  const ans = answersOf(qs);
  const acted = new Set<string>();
  const once = (k: string) => (acted.has(k) ? false : (acted.add(k), true));
  const st = () => machine.room.state as any;
  let turn = 0;
  for (let step = 0; step < 40000 && st().round !== 'FINISHED'; step++) {
    await vi.advanceTimersByTimeAsync(250);
    const s = st();
    onTick(s.round);
    const q = s.currentQuestion as Question | undefined;
    const key = `${s.round}/${s.subPhase}/${q?.id ?? ''}/${s.activePlayerId ?? ''}/${s.deadline ?? ''}/${s.stepIndex ?? ''}/${(s.rowsRevealed || []).filter(Boolean).length}`;
    if (s.round === 'READY' && s.subPhase === 'WAITING_READY') machine.room.players.forEach((p) => machine.setPlayerReady(p.id, true));
    else if (s.round === 'KD_RIENG') {
      if (s.subPhase === 'CHOOSE_PACKAGE' && once(key)) machine.chooseKdPackage(s.activePlayerId, ((s.kdPackages as any[]).find((p) => !p.chosenBy) ?? { index: 0 }).index);
      else if (s.subPhase === 'QUESTION' && q && once(key)) machine.submitAnswer(s.activePlayerId, q.id, s.activePlayerId === contestants[0] ? ans.get(q.id)! : 'sai');
    } else if (s.round === 'KD_CHUNG') {
      if (s.subPhase === 'QUESTION_BUZZ' && Date.now() >= (s.buzzUnlockAt ?? 0) && once(key)) machine.handleBuzzer(contestants[turn++ % contestants.length]);
      else if (s.subPhase === 'ANSWERING' && q && once(key)) machine.submitAnswer(s.activePlayerId, q.id, 'sai');
    } else if (s.round === 'VCNV') {
      if (s.subPhase === 'PICK_ROW' && once(key)) {
        const idx = [0, 1, 2, 3].find((i) => !(s.rowsRevealed || [])[i]);
        if (idx !== undefined) machine.pickVcnvRow(s.activePlayerId, idx);
      } else if (s.subPhase === 'ROW_QUESTION' && q && once(key)) contestants.forEach((id) => machine.submitAnswer(id, q.id, 'sai'));
      else if (s.subPhase === 'FINAL_GUESS' && once(key)) {
        // Thí sinh thứ hai giải chướng ngại vật
        if (machine.handleBuzzer(contestants[1])) machine.submitAnswer(contestants[1], qs.vcnv.obstacle.id, qs.vcnv.obstacle.answer);
      } else if (s.subPhase === 'CNV_ANSWERING' && q && once(key)) machine.submitAnswer(s.activePlayerId, q.id, ans.get(q.id)!);
    } else if (s.round === 'TANG_TOC') {
      if (s.subPhase === 'QUESTION' && q && once(key)) contestants.forEach((id) => machine.submitAnswer(id, q.id, 'sai'));
    } else if (s.round === 'VE_DICH') {
      if (s.subPhase === 'CHOOSE_PACKAGE' && once(key)) machine.chooseVeDichPackage(s.activePlayerId, 40);
      else if (s.subPhase === 'STAR_DECISION' && once(key)) machine.setHopeStar(s.activePlayerId, false);
      else if (s.subPhase === 'QUESTION' && q && once(key)) machine.submitAnswer(s.activePlayerId, q.id, 'sai');
    } else if (s.round === 'TIEBREAK') {
      if (s.subPhase === 'BUZZ_OPEN' && once(key)) machine.handleBuzzer((s.eligiblePlayerIds || [])[0]);
      else if (s.subPhase === 'ANSWERING' && q && once(key)) machine.submitAnswer(s.activePlayerId, q.id, ans.get(q.id)!);
    }
  }
  expect(st().round).toBe('FINISHED');
}

afterEach(() => vi.useRealTimers());

describe('Bảng dự đoán trong một trận thật', () => {
  it('khóa đúng lúc, chấm đúng từng hạng mục và cộng/trừ điểm cho khán giả', { timeout: 120000 }, async () => {
    vi.useFakeTimers();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const machine = new RoomStateMachine('PRED01', { id: 'host', name: 'An', token: 't0' }, mockCallbacks());
    machine.addPlayer('Bình', 't1');
    machine.addPlayer('Chi', 't2');
    machine.setQuestionSet(DEFAULT_QUESTION_SET, 'custom');
    const [a, b, c] = machine.room.players.map((p) => p.id);
    for (let i = 1; i <= 2; i++) machine.addPlayer(`KhánGiả${i}`, `v${i}`);
    // Đủ 3 thí sinh: chuyển 2 người sau sang ghế khán giả
    const viewers = machine.room.players.slice(3).map((p) => p.id);
    viewers.forEach((id, i) => expect(machine.switchSeat(id, 'viewer', i + 1).ok).toBe(true));
    const [v1, v2] = viewers;

    // Thí sinh không được dự đoán
    expect(machine.placePrediction(a, 'champion', a, 100).ok).toBe(false);

    // Trước trận
    expect(machine.placePrediction(v1, 'champion', a, 250).ok).toBe(true);
    expect(machine.placePrediction(v1, 'top_kd', a, 200).ok).toBe(true);
    expect(machine.placePrediction(v1, 'over_250', 'no', 100).ok).toBe(true);
    expect(machine.placePrediction(v2, 'champion', c, 250).ok).toBe(true);
    expect(machine.placePrediction(v2, 'top_kd', b, 100).ok).toBe(true);
    expect(machine.placePrediction(v2, 'lowest', a, 50).ok).toBe(true);

    expect(machine.startGame('host').ok).toBe(true);
    let duringRieng = false;
    let afterRieng = false;
    await playMatch(machine, [a, b, c], (round) => {
      if (round === 'KD_RIENG' && !duringRieng) {
        duringRieng = true;
        // Đang Khởi động riêng: vẫn đổi/đặt được các hạng mục chung cuộc và vòng 1
        expect(machine.placePrediction(v2, 'lowest', b, 50).ok).toBe(true);
      }
      if (round === 'KD_CHUNG' && !afterRieng) {
        afterRieng = true;
        // Hết Khởi động riêng: hạng mục chung cuộc + vòng 1 bị khóa, vòng 2 vẫn mở
        expect(machine.placePrediction(v1, 'champion', b, 100).ok).toBe(false);
        expect(machine.placePrediction(v2, 'top_kd', a, 100).ok).toBe(false);
        expect(machine.placePrediction(v1, 'top_vcnv', b, 150).ok).toBe(true);
        expect(machine.placePrediction(v2, 'top_vcnv', a, 150).ok).toBe(true);
      }
      if (round === 'VCNV') expect(machine.placePrediction(v1, 'top_tt', b, 10).ok).toBe(true);
      if (round === 'TANG_TOC') expect(machine.placePrediction(v1, 'top_vcnv', a, 50).ok).toBe(false);
    });
    logSpy.mockRestore();

    const pred = machine.room.predictions!;
    // Mọi hạng mục đều có kết quả (hoặc hoàn lại), không còn cái nào mở/khóa
    for (const def of PREDICTION_CATEGORIES) expect(['resolved', 'void']).toContain(pred.categories[def.id].status);

    // a trả lời đúng hết Khởi động riêng -> kiếm nhiều điểm nhất vòng 1; chỉ b ghi điểm ở VCNV (giải CNV)
    expect(pred.categories.top_kd.winners).toEqual([a]);
    expect(pred.categories.top_vcnv.winners).toEqual([b]);
    // Vòng 2 tính điểm RIÊNG của vòng: a dẫn tổng điểm nhưng không phải người kiếm nhiều nhất vòng 2
    const pa = machine.room.players.find((p) => p.id === a)!;
    const pb = machine.room.players.find((p) => p.id === b)!;
    expect(pa.roundScores.kd + pa.roundScores.vcnv).toBeGreaterThan(pb.roundScores.kd + pb.roundScores.vcnv);
    expect(pred.categories.champion.winners).toEqual([machine.room.state.winnerId]);
    const anyOver = machine.room.players.some((p) => p.role !== 'viewer' && p.score > 250);
    expect(pred.categories.over_250.winners).toEqual([anyOver ? 'yes' : 'no']);

    // Điểm = 1000 + tổng thắng - tổng thua, khớp với kết quả từng dự đoán
    for (const v of [v1, v2]) {
      let expected = P.START_POINTS;
      for (const bet of Object.values(pred.bets[v])) {
        if (bet?.result === 'win') expected += bet.stake;
        if (bet?.result === 'lose') expected -= bet.stake;
      }
      expect(pred.balances[v]).toBe(expected);
    }
    expect(pred.bets[v1].top_kd?.result).toBe('win');
    expect(pred.bets[v2].top_kd?.result).toBe('lose');
    expect(pred.bets[v1].top_vcnv?.result).toBe('win');
    expect(pred.bets[v2].top_vcnv?.result).toBe('lose');

    // Chơi lại: bảng dự đoán được làm mới
    expect(machine.resetForNewGame('host').ok).toBe(true);
    expect(machine.room.predictions).toBeUndefined();
    machine.dispose();
  });
});
