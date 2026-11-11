import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { Question, QuestionSet } from '@olympia/shared';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';
import { parseExcelQuestionSet } from '../src/game/questionParser.js';
import { validateQuestionSet } from '../src/game/questionValidator.js';
import { findMissingSections, fillMissingFromBank } from '../src/game/questionFill.js';
import { listQuestionIds, QuestionUsage } from '../src/game/questionComposer.js';
import { loadQuestionBank } from '../src/game/questionBank.js';

/**
 * Kiểm tra bộ đề thi đấu thật (bo-de-thi-dau/BoDe_ThiDau_Chuan.xlsx): nạp như chủ phòng nạp file rồi cho
 * 5 "người chơi" tự động chơi trọn một trận qua tất cả các vòng, để chắc chắn đề không làm trận bị kẹt/lỗi.
 */

const EXAM_FILE = path.resolve(__dirname, '../../bo-de-thi-dau/BoDe_ThiDau_Chuan.xlsx');
const examExists = fs.existsSync(EXAM_FILE);

function mockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(), broadcastBuzzWon: vi.fn(), broadcastBuzzRejected: vi.fn(), emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(), broadcastScoreUpdate: vi.fn(), broadcastPlayerUpdate: vi.fn(), broadcastAntiCheat: vi.fn(),
  };
}

const allQuestions = (qs: QuestionSet): Map<string, Question> => {
  const m = new Map<string, Question>();
  const add = (q: Question) => m.set(q.id, q);
  qs.khoiDong.rieng.flat().forEach(add);
  qs.khoiDong.chung.forEach(add);
  [...qs.vcnv.rows, qs.vcnv.center, qs.vcnv.obstacle].forEach(add);
  qs.tangToc.forEach(add);
  [...qs.veDich.pool10, ...qs.veDich.pool20, ...qs.veDich.pool30].forEach(add);
  qs.tieBreak.forEach(add);
  return m;
};

/** Nạp file như endpoint /api/upload-questions: đọc Excel, bù phần thiếu từ kho, kiểm tra hợp lệ. */
function loadAsHost(file: string) {
  const parsed = parseExcelQuestionSet(fs.readFileSync(file), 'BoDe_ThiDau_Chuan');
  const bank = loadQuestionBank(path.resolve(__dirname, '../question-bank')).data;
  const fill = fillMissingFromBank(parsed, bank, new QuestionUsage());
  if (!fill.ok) throw new Error(fill.error);
  const validation = validateQuestionSet(fill.questionSet);
  if (!validation.ok) throw new Error(validation.errors.join(' '));
  return { parsed, filled: fill.filled, questionSet: validation.questionSet as QuestionSet };
}

interface MatchSummary {
  finished: boolean;
  rounds: string[];
  steps: number;
  asked: Set<string>;
  errors: string[];
  winnerId?: string;
  lastState?: string;
}

async function playFullMatch(qs: QuestionSet, players = 5): Promise<MatchSummary> {
  vi.useFakeTimers();
  const errors: string[] = [];
  const errSpy = vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(a.map(String).join(' ')); });
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  const machine = new RoomStateMachine('SIM001', { id: 'p1', name: 'An', token: 't1' }, mockCallbacks());
  for (let i = 2; i <= players; i++) machine.addPlayer(`P${i}`, `t${i}`);
  machine.setQuestionSet(qs, 'custom');
  const ids = machine.room.players.map((p) => p.id);
  expect(machine.startGame(ids[0]).ok).toBe(true);

  const byId = allQuestions(qs);
  const asked = new Set<string>();
  const rounds: string[] = [];
  const acted = new Set<string>();
  const once = (key: string) => (acted.has(key) ? false : (acted.add(key), true));
  const st = () => machine.room.state as any;
  const answerOf = (id: string) => byId.get(id)?.answer ?? '';
  let buzzTurn = 0;
  let steps = 0;

  for (; steps < 40000 && st().round !== 'FINISHED'; steps++) {
    await vi.advanceTimersByTimeAsync(250);
    const s = st();
    if (rounds[rounds.length - 1] !== s.round) rounds.push(s.round);
    const q = s.currentQuestion as Question | undefined;
    if (q) asked.add(q.id);
    const key = `${s.round}/${s.subPhase}/${q?.id ?? ''}/${s.activePlayerId ?? ''}/${s.deadline ?? ''}/${s.stepIndex ?? ''}/${(s.rowsRevealed || []).filter(Boolean).length}`;

    if (s.round === 'READY' && s.subPhase === 'WAITING_READY') {
      ids.forEach((id) => machine.setPlayerReady(id, true));
    } else if (s.round === 'KD_RIENG') {
      if (s.subPhase === 'CHOOSE_PACKAGE' && once(key)) {
        const free = (s.kdPackages as any[]).find((p) => !p.chosenBy);
        machine.chooseKdPackage(s.activePlayerId, free ? free.index : 0);
      } else if (s.subPhase === 'QUESTION' && q && once(key)) {
        machine.submitAnswer(s.activePlayerId, q.id, answerOf(q.id));
      }
    } else if (s.round === 'KD_CHUNG') {
      if (s.subPhase === 'QUESTION_BUZZ' && Date.now() >= (s.buzzUnlockAt ?? 0) && once(key)) {
        machine.handleBuzzer(ids[buzzTurn++ % ids.length]);
      } else if (s.subPhase === 'ANSWERING' && q && once(key)) {
        machine.submitAnswer(s.activePlayerId, q.id, buzzTurn % 3 === 0 ? 'B' : answerOf(q.id));
      }
    } else if (s.round === 'VCNV') {
      if (s.subPhase === 'PICK_ROW' && once(key)) {
        const idx = [0, 1, 2, 3].find((i) => !(s.rowsRevealed || [])[i]);
        if (idx !== undefined) machine.pickVcnvRow(s.activePlayerId, idx);
      } else if (s.subPhase === 'ROW_QUESTION' && q && once(key)) {
        ids.forEach((id) => machine.submitAnswer(id, q.id, answerOf(q.id)));
      } else if (s.subPhase === 'FINAL_GUESS' && once(key)) {
        const obstacle = qs.vcnv.obstacle;
        const buzzer = ids.find((id) => !machine.room.players.find((p) => p.id === id)?.eliminatedVcnv)!;
        if (machine.handleBuzzer(buzzer)) machine.submitAnswer(buzzer, obstacle.id, obstacle.answer);
      } else if (s.subPhase === 'CNV_ANSWERING' && q && once(key)) {
        machine.submitAnswer(s.activePlayerId, q.id, answerOf(q.id));
      }
    } else if (s.round === 'TANG_TOC') {
      if (s.subPhase === 'QUESTION' && q && once(key)) ids.forEach((id) => machine.submitAnswer(id, q.id, answerOf(q.id)));
    } else if (s.round === 'VE_DICH') {
      if (s.subPhase === 'CHOOSE_PACKAGE' && once(key)) machine.chooseVeDichPackage(s.activePlayerId, 80);
      else if (s.subPhase === 'STAR_DECISION' && once(key)) machine.setHopeStar(s.activePlayerId, false);
      else if (s.subPhase === 'QUESTION' && q && once(key)) machine.submitAnswer(s.activePlayerId, q.id, steps % 2 ? 'sai' : answerOf(q.id));
      else if (s.subPhase === 'STEAL_BUZZ' && Date.now() >= (s.buzzUnlockAt ?? 0) && once(key)) {
        machine.handleBuzzer(ids.find((id) => id !== s.mainPlayerId)!);
      } else if (s.subPhase === 'STEAL_ANSWER' && q && once(key)) machine.submitAnswer(s.activePlayerId, q.id, answerOf(q.id));
    } else if (s.round === 'TIEBREAK') {
      if (s.subPhase === 'BUZZ_OPEN' && once(key)) machine.handleBuzzer((s.eligiblePlayerIds || [])[0]);
      else if (s.subPhase === 'ANSWERING' && q && once(key)) machine.submitAnswer(s.activePlayerId, q.id, 'sai');
    }
  }

  const finished = st().round === 'FINISHED';
  const winnerId = st().winnerId;
  const lastState = `${st().round}/${st().subPhase} active=${st().activePlayerId} deadline=${st().deadline ? st().deadline - Date.now() : null} q=${st().currentQuestion?.id}`;
  machine.dispose();
  errSpy.mockRestore();
  logSpy.mockRestore();
  return { finished, rounds, steps, asked, errors, winnerId, lastState };
}

afterEach(() => vi.useRealTimers());

describe.skipIf(!examExists)('Bộ đề thi đấu thật: bo-de-thi-dau/BoDe_ThiDau_Chuan.xlsx', () => {
  it('nạp được, đủ mọi vòng (kể cả sau khi bù phần thiếu từ kho) và hợp lệ', () => {
    const { questionSet, parsed, filled } = loadAsHost(EXAM_FILE);
    // File tự đủ: không cần bù gì từ kho câu hỏi (nên chạy được dù kho trên máy chủ có thay đổi)
    expect(filled).toEqual([]);
    expect(findMissingSections(parsed)).toEqual({ sections: [], riengPackages: [] });
    expect(findMissingSections(questionSet).sections).toEqual([]);
    expect(findMissingSections(questionSet).riengPackages).toEqual([]);
    expect(questionSet.khoiDong.rieng.map((p) => p.length)).toEqual([6, 6, 6, 6, 6]);
    expect(questionSet.khoiDong.chung.length).toBeGreaterThanOrEqual(12);
    expect(questionSet.tangToc.length).toBeGreaterThanOrEqual(4);
    expect(questionSet.veDich.pool10.length).toBeGreaterThanOrEqual(10);
    expect(questionSet.veDich.pool20.length).toBeGreaterThanOrEqual(5);
    expect(questionSet.veDich.pool30.length).toBeGreaterThanOrEqual(10);
    expect(questionSet.tieBreak.length).toBeGreaterThanOrEqual(3);
    // Phần chủ phòng soạn được giữ nguyên
    expect(questionSet.vcnv.obstacle.answer).toBe(parsed.vcnv.obstacle.answer);
  });

  it('mỗi câu trắc nghiệm có đáp án A-D hợp lệ, đủ 4 phương án; mỗi câu tự luận có đáp án; không trùng câu hỏi', () => {
    const { questionSet } = loadAsHost(EXAM_FILE);
    const all = [...allQuestions(questionSet).values()];
    const problems: string[] = [];
    for (const q of all) {
      if (q.type === 'mcq') {
        if (!['A', 'B', 'C', 'D'].includes(q.answer)) problems.push(`${q.id}: đáp án "${q.answer}" không phải A-D`);
        if (!q.options || q.options.some((o) => !String(o).trim())) problems.push(`${q.id}: thiếu phương án`);
      } else if (!q.answer.trim() && q.id !== questionSet.vcnv.center.id) {
        problems.push(`${q.id}: thiếu đáp án`);
      }
      if (q.prompt.length > 400) problems.push(`${q.id}: câu hỏi quá dài (${q.prompt.length} ký tự)`);
    }
    const prompts = all.map((q) => q.prompt.trim().toLowerCase());
    const dupPrompts = prompts.filter((p, i) => prompts.indexOf(p) !== i && p !== questionSet.vcnv.obstacle.prompt.trim().toLowerCase());
    if (dupPrompts.length) problems.push(`${dupPrompts.length} câu hỏi trùng nội dung`);
    expect(problems).toEqual([]);
  });

  it('kiểm tra tính toàn vẹn của các câu hỏi trong bộ đề', () => {
    const { questionSet } = loadAsHost(EXAM_FILE);
    expect(questionSet.vcnv.obstacle.answer).toBeTruthy();
    expect(questionSet.tangToc.length).toBe(4);
  });

  it('5 người chơi tự động chơi trọn trận qua cả 4 vòng mà không lỗi, không kẹt', { timeout: 120000 }, async () => {
    const { questionSet } = loadAsHost(EXAM_FILE);
    const r = await playFullMatch(questionSet, 5);
    expect(r.errors).toEqual([]);
    expect(r.finished).toBe(true);
    expect(r.rounds).toEqual(expect.arrayContaining(['KD_RIENG', 'KD_CHUNG', 'VCNV', 'TANG_TOC', 'VE_DICH', 'ROUND_RESULTS', 'FINISHED']));
    // Đã hỏi ít nhất các câu cố định của mỗi vòng
    const used = listQuestionIds(questionSet);
    expect(r.asked.size).toBeGreaterThan(30);
    expect(used.length).toBeGreaterThan(50);
  });

  it('chơi được với 2 người (tối thiểu)', { timeout: 120000 }, async () => {
    const { questionSet } = loadAsHost(EXAM_FILE);
    const r = await playFullMatch(questionSet, 2);
    expect(r.errors).toEqual([]);
    expect(r.finished).toBe(true);
  });
});
