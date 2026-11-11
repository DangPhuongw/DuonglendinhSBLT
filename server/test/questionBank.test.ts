import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import xlsx from 'xlsx';
import { GAME_CONFIG } from '@olympia/shared';
import { RoomStateMachine, StateMachineCallbacks } from '../src/game/RoomStateMachine.js';
import { DEFAULT_QUESTION_SET } from '../src/game/defaultQuestionSet.js';
import { validateQuestionSet } from '../src/game/questionValidator.js';
import { findShortages, loadQuestionBank, parseDifficulty } from '../src/game/questionBank.js';
import {
  QuestionUsage,
  composeQuestionSet,
  drawByDifficulty,
  listQuestionIds,
} from '../src/game/questionComposer.js';
import { QuestionBankService } from '../src/game/questionBankService.js';

// ---------- dữ liệu mẫu ----------

type Sheets = Record<string, Record<string, unknown>[]>;

function writeBank(dir: string, file: string, sheets: Sheets) {
  fs.mkdirSync(dir, { recursive: true });
  const wb = xlsx.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(rows), name);
  }
  xlsx.writeFile(wb, path.join(dir, file));
}

const LABEL = { easy: 'Dễ', medium: 'Trung bình', hard: 'Khó' } as const;

/** Câu trắc nghiệm Khởi động với số lượng từng mức độ khó. */
const kdRows = (counts: { easy?: number; medium?: number; hard?: number }, tag: string) =>
  (Object.entries(counts) as [keyof typeof LABEL, number][]).flatMap(([d, n]) =>
    Array.from({ length: n }, (_, i) => ({
      Prompt: `${tag} ${d} câu ${i + 1}?`,
      OptionA: 'a', OptionB: 'b', OptionC: 'c', OptionD: 'd',
      Answer: 'A',
      Difficulty: LABEL[d],
    }))
  );
const textRows = (n: number, tag: string, extra: Record<string, unknown> = {}) =>
  Array.from({ length: n }, (_, i) => ({ Prompt: `${tag} câu ${i + 1}?`, Answer: `ĐÁP ÁN ${tag} ${i + 1}`, ...extra }));
const vcnvRows = (clusters: number) =>
  Array.from({ length: clusters }, (_, c) => [
    ...[1, 2, 3, 4].map((r) => ({ Cluster: `Cum-${c + 1}`, Type: 'ROW', Prompt: `Cụm ${c + 1} hàng ${r}?`, Answer: `HANG${r}` })),
    { Cluster: `Cum-${c + 1}`, Type: 'CENTER', Prompt: `Cụm ${c + 1} trung tâm?`, Answer: 'TRUNGTAM' },
    { Cluster: `Cum-${c + 1}`, Type: 'OBSTACLE', Prompt: '', Answer: `TUKHOA${c + 1}` },
  ]).flat();

/** Kho gấp `scale` lần nhu cầu mỗi trận (scale = 1: đúng mức tối thiểu). */
function fullSheets(scale = 2): Sheets {
  return {
    HuongDan: [{ 'Hướng dẫn': 'sheet này bị bỏ qua' }],
    KhoiDong_Rieng: kdRows({ easy: 20 * scale, medium: 10 * scale }, 'KDR'),
    KhoiDong_Chung: kdRows({ easy: 5 * scale, medium: 4 * scale, hard: 3 * scale }, 'KDC'),
    VCNV: vcnvRows(scale),
    TangToc: textRows(4 * scale, 'TT'),
    VeDich: [
      ...textRows(10 * scale, 'V10', { Points: 10 }),
      ...textRows(6 * scale, 'V20', { Points: 20 }),
      ...textRows(10 * scale, 'V30', { Points: 30 }),
    ],
    CauHoiPhu: textRows(3 * scale, 'PHU'),
  };
}

const tmpDirs: string[] = [];
function tmpDir(): string {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'olympia-bank-'));
  tmpDirs.push(d);
  return d;
}
function loadFromSheets(sheets: Sheets) {
  const dir = tmpDir();
  writeBank(dir, 'kho.xlsx', sheets);
  return loadQuestionBank(dir);
}

afterEach(() => {
  vi.useRealTimers();
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

// ---------- cấu hình ----------

describe('Cấu hình độ khó', () => {
  it('số câu theo độ khó khớp tổng số câu của vòng', () => {
    const kd = GAME_CONFIG.KHOI_DONG;
    expect(kd.RIENG_DIFFICULTY).toEqual({ easy: 4, medium: 2, hard: 0 });
    expect(kd.RIENG_DIFFICULTY.easy + kd.RIENG_DIFFICULTY.medium + kd.RIENG_DIFFICULTY.hard).toBe(kd.RIENG_QUESTIONS_PER_PLAYER);
    expect(kd.CHUNG_DIFFICULTY).toEqual({ easy: 5, medium: 4, hard: 3 });
    expect(kd.CHUNG_DIFFICULTY.easy + kd.CHUNG_DIFFICULTY.medium + kd.CHUNG_DIFFICULTY.hard).toBe(kd.CHUNG_QUESTIONS);
    expect(GAME_CONFIG.VE_DICH.DIFFICULTY_BY_POINTS).toEqual({ 10: 'easy', 20: 'medium', 30: 'hard' });
  });
});

// ---------- kho thật của dự án ----------

describe('Kho câu hỏi đi kèm dự án (server/question-bank)', () => {
  it('đọc không lỗi, đủ câu theo từng mức độ khó, chứa nội dung bộ đề mặc định', () => {
    const { data, issues, files } = loadQuestionBank(path.resolve(__dirname, '../question-bank'));
    expect(issues).toEqual([]);
    expect(files.length).toBeGreaterThan(0);
    expect(findShortages(data)).toEqual([]);

    const prompts = new Set(
      [data.kdRieng, data.kdChung, data.tangToc, data.vd10, data.vd20, data.vd30, data.tieBreak].flat().map((q) => q.prompt)
    );
    const d = DEFAULT_QUESTION_SET;
    for (const q of [...d.khoiDong.rieng.flat(), ...d.khoiDong.chung, ...d.tangToc, ...d.veDich.pool10, ...d.tieBreak]) {
      expect(prompts.has(q.prompt)).toBe(true);
    }
    expect(data.vcnv.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------- đọc file ----------

describe('Đọc kho từ Excel', () => {
  it('đọc đủ các vòng, bỏ qua sheet lạ, Về đích tự gắn độ khó theo điểm', () => {
    const { data, issues } = loadFromSheets(fullSheets(1));
    expect(issues).toEqual([]);
    expect(data.kdRieng.filter((q) => q.difficulty === 'easy')).toHaveLength(20);
    expect(data.kdRieng.filter((q) => q.difficulty === 'medium')).toHaveLength(10);
    expect(data.vd10.every((q) => q.difficulty === 'easy')).toBe(true);
    expect(data.vd20.every((q) => q.difficulty === 'medium')).toBe(true);
    expect(data.vd30.every((q) => q.difficulty === 'hard')).toBe(true);
    expect(data.tangToc.every((q) => q.difficulty === undefined)).toBe(true);
    expect(findShortages(data)).toEqual([]);
  });

  it('Khởi động bắt buộc có độ khó hợp lệ; gộp nhiều file; cột Skip; báo lỗi đúng dòng', () => {
    const dir = tmpDir();
    const mcq = { OptionA: 'a', OptionB: 'b', OptionC: 'c', OptionD: 'd', Answer: 'A' };
    writeBank(dir, 'a.xlsx', {
      KhoiDong_Chung: [
        { 'Câu hỏi': 'Hỏi 1?', ...mcq, 'Độ khó': 'Khó' },
        { 'Câu hỏi': 'Hỏi 2?', ...mcq, 'Độ khó': 'Dễ', Skip: 'x' },
        { 'Câu hỏi': 'Hỏi 3?', ...mcq },
        { 'Câu hỏi': 'Hỏi 4?', ...mcq, 'Độ khó': 'siêu khó' },
        { 'Câu hỏi': 'Hỏi 1?', ...mcq, 'Độ khó': 'Dễ' },
        { 'Câu hỏi': 'Hỏi 5?', ...mcq, Answer: 'E', 'Độ khó': 'Dễ' },
      ],
      // Tăng tốc không dùng độ khó: giá trị lạ không bị coi là lỗi
      TangToc: [{ Prompt: 'TT?', Answer: 'X', Difficulty: 'gì cũng được' }],
    });
    writeBank(dir, 'b.xlsx', { KhoiDong_Chung: [{ Prompt: 'Từ file b?', ...mcq, Difficulty: 'trung bình' }] });

    const { data, issues, files } = loadQuestionBank(dir);
    expect(files).toEqual(['a.xlsx', 'b.xlsx']);
    expect(data.kdChung.map((q) => [q.prompt, q.difficulty])).toEqual([
      ['Hỏi 1?', 'hard'],
      ['Từ file b?', 'medium'],
    ]);
    expect(data.tangToc).toHaveLength(1);

    const msg = issues.map((i) => `${i.file}/${i.sheet}/${i.row}: ${i.message}`).join('\n');
    expect(msg).toContain('KhoiDong_Chung/4: Thiếu độ khó');
    expect(msg).toContain('KhoiDong_Chung/5: Độ khó "siêu khó" không hợp lệ');
    expect(msg).toContain('KhoiDong_Chung/6: Câu hỏi bị trùng');
    expect(msg).toContain('KhoiDong_Chung/7: Đáp án "E" phải là một trong A, B, C, D');
    expect(issues.some((i) => i.sheet === 'TangToc')).toBe(false);
  });

  it('cụm VCNV thiếu hàng thì cả cụm bị bỏ qua, cụm đủ vẫn dùng được', () => {
    const rows = vcnvRows(2).filter((r) => !(r.Cluster === 'Cum-2' && r.Prompt.endsWith('hàng 4?')));
    const { data, issues } = loadFromSheets({ VCNV: rows });
    expect(data.vcnv).toHaveLength(1);
    expect(issues.map((i) => i.message).join(' ')).toContain('Cụm "Cum-2": cần đúng 4 hàng ngang (đang có 3)');
  });

  it('cụm VCNV: dòng CENTER (câu gợi ý) không cần đáp án, nhưng vẫn cần nội dung', () => {
    const rows = vcnvRows(2).map((r) => (r.Cluster === 'Cum-1' && r.Type === 'CENTER' ? { ...r, Answer: '' } : r));
    // Cụm 2: câu gợi ý có đáp án lạc nhưng thiếu nội dung -> bỏ cả cụm
    const broken = rows.map((r) => (r.Cluster === 'Cum-2' && r.Type === 'CENTER' ? { ...r, Prompt: '', Answer: 'x' } : r));
    const { data, issues } = loadFromSheets({ VCNV: broken });
    expect(data.vcnv).toHaveLength(1);
    expect(data.vcnv[0].center.answer).toBe('');
    expect(data.vcnv[0].center.prompt).toContain('trung tâm');
    expect(issues.map((i) => i.message).join(' ')).toContain('Cụm "Cum-2": thiếu nội dung câu hỏi');
    // Dòng ROW / OBSTACLE vẫn bắt buộc có đáp án
    const noAnswer = vcnvRows(1).map((r) => (r.Type === 'ROW' && r.Prompt.endsWith('hàng 1?') ? { ...r, Answer: '' } : r));
    expect(loadFromSheets({ VCNV: noAnswer }).data.vcnv).toHaveLength(0);
  });

  it('bộ đề (tải lên / ghép ra) hợp lệ khi câu gợi ý không có đáp án', () => {
    const set = JSON.parse(JSON.stringify(DEFAULT_QUESTION_SET));
    set.vcnv.center.answer = '';
    expect(validateQuestionSet(set).ok).toBe(true);
    set.vcnv.center.prompt = '';
    expect(validateQuestionSet(set).ok).toBe(false);
    const noKeyword = JSON.parse(JSON.stringify(DEFAULT_QUESTION_SET));
    noKeyword.vcnv.obstacle.answer = '';
    expect(validateQuestionSet(noKeyword).ok).toBe(false);
  });

  it('thư mục không tồn tại hoặc file Excel hỏng không làm sập', () => {
    expect(loadQuestionBank(path.join(os.tmpdir(), 'khong-ton-tai-xyz')).issues).toHaveLength(1);
    const dir = tmpDir();
    fs.writeFileSync(path.join(dir, 'hong.xlsx'), 'không phải excel');
    expect(() => loadQuestionBank(dir)).not.toThrow();
  });

  it('parseDifficulty', () => {
    expect(parseDifficulty('Dễ')).toBe('easy');
    expect(parseDifficulty('Trung bình')).toBe('medium');
    expect(parseDifficulty('vừa')).toBe('medium');
    expect(parseDifficulty('KHÓ')).toBe('hard');
    expect(parseDifficulty('')).toBeUndefined();
    expect(parseDifficulty('???')).toBeNull();
  });
});

// ---------- bốc câu ----------

describe('Bốc câu theo độ khó', () => {
  const countOf = (list: { difficulty?: string }[], d: string) => list.filter((q) => q.difficulty === d).length;

  it('bốc đúng số câu từng mức và trộn lẫn thứ tự các mức', () => {
    const { data } = loadFromSheets(fullSheets(2));
    const orders = new Set<string>();
    for (let k = 0; k < 30; k++) {
      const picked = drawByDifficulty(data.kdChung, { easy: 4, medium: 4, hard: 2 }, new QuestionUsage());
      expect([countOf(picked, 'easy'), countOf(picked, 'medium'), countOf(picked, 'hard')]).toEqual([4, 4, 2]);
      expect(new Set(picked.map((q) => q.id)).size).toBe(10);
      orders.add(picked.map((q) => q.difficulty![0]).join(''));
    }
    // Nhiều thứ tự khác nhau, không phải lúc nào cũng dễ -> khó
    expect(orders.size).toBeGreaterThan(5);
  });

  it('bộ đề ghép ra: mỗi ô riêng 4 dễ + 2 trung bình, chung 5/4/3, Về đích theo điểm', () => {
    const { data } = loadFromSheets(fullSheets(1));
    const res = composeQuestionSet(data, new QuestionUsage());
    if (!res.ok) throw new Error(res.error);
    const qs = res.questionSet;
    expect(validateQuestionSet(qs).ok).toBe(true);

    for (const pkg of qs.khoiDong.rieng) {
      expect(pkg).toHaveLength(6);
      expect([countOf(pkg, 'easy'), countOf(pkg, 'medium')]).toEqual([4, 2]);
    }
    expect([countOf(qs.khoiDong.chung, 'easy'), countOf(qs.khoiDong.chung, 'medium'), countOf(qs.khoiDong.chung, 'hard')]).toEqual([5, 4, 3]);
    expect(qs.veDich.pool10.every((q) => q.difficulty === 'easy')).toBe(true);
    expect(qs.veDich.pool20.every((q) => q.difficulty === 'medium')).toBe(true);
    expect(qs.veDich.pool30.every((q) => q.difficulty === 'hard')).toBe(true);

    expect(qs.tangToc).toHaveLength(4);
    expect(qs.tieBreak).toHaveLength(3);
    const all = listQuestionIds(qs).map((q) => q.id);
    expect(new Set(all).size).toBe(all.length);
    // Không lộ trường nội bộ của kho
    expect(JSON.stringify(qs)).not.toContain('"topic"');
  });

  it('thiếu câu ở một mức độ khó thì báo rõ mức nào thiếu', () => {
    const sheets = fullSheets(1);
    sheets.KhoiDong_Chung = kdRows({ easy: 5, medium: 4, hard: 1 }, 'KDC');
    sheets.KhoiDong_Rieng = kdRows({ easy: 30 }, 'KDR'); // đủ 30 câu nhưng không có câu trung bình
    const res = composeQuestionSet(loadFromSheets(sheets).data, new QuestionUsage());
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('Khởi động chung - Khó có 1/3');
      expect(res.error).toContain('Khởi động riêng - Trung bình có 0/10');
    }
  });

  it('không lặp câu cho tới khi cả kho đã dùng hết một vòng', () => {
    const { data } = loadFromSheets(fullSheets(2)); // mỗi mức độ khó có đúng gấp đôi nhu cầu
    const usage = new QuestionUsage();
    const game = () => {
      const res = composeQuestionSet(data, usage);
      if (!res.ok) throw new Error(res.error);
      usage.mark(res.questionIds);
      return new Set(res.questionIds);
    };
    const g1 = game();
    const g2 = game();
    expect([...g1].filter((id) => g2.has(id))).toEqual([]);
    const g3 = game();
    expect([...g3].filter((id) => g1.has(id)).length).toBeGreaterThan(0);
  });
});

// ---------- dịch vụ kho ----------

describe('QuestionBankService', () => {
  it('tự nạp lại khi file Excel thay đổi, và lưu lịch sử câu đã dùng', () => {
    const dir = tmpDir();
    const usageFile = path.join(dir, 'usage', '_question-usage.json');
    const bankDir = path.join(dir, 'bank');
    writeBank(bankDir, 'kho.xlsx', fullSheets(1));
    const quiet = vi.spyOn(console, 'log').mockImplementation(() => {});
    const quietWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const service = new QuestionBankService(bankDir, new QuestionUsage(usageFile));
    const first = service.compose();
    expect(first.ok).toBe(true);

    const sheets = fullSheets(1);
    sheets.TangToc = textRows(2, 'TT');
    writeBank(bankDir, 'kho.xlsx', sheets);
    const future = new Date(Date.now() + 5000);
    fs.utimesSync(path.join(bankDir, 'kho.xlsx'), future, future);
    expect(service.compose().ok).toBe(false);

    const reloaded = new QuestionUsage(usageFile);
    expect(reloaded.games).toBe(1);
    if (first.ok) expect(reloaded.last(first.questionIds[0])).toBe(1);
    quiet.mockRestore();
    quietWarn.mockRestore();
  });
});

// ---------- tích hợp vào phòng ----------

function mockCallbacks(): StateMachineCallbacks {
  return {
    broadcastRoom: vi.fn(), broadcastBuzzWon: vi.fn(), broadcastBuzzRejected: vi.fn(), emitAnswerAck: vi.fn(),
    broadcastReveal: vi.fn(), broadcastScoreUpdate: vi.fn(), broadcastPlayerUpdate: vi.fn(), broadcastAntiCheat: vi.fn(),
  };
}

describe('Ghép đề khi bắt đầu trận', () => {
  const newMachine = (code: string) => {
    const m = new RoomStateMachine(code, { id: 'p1', name: 'An', token: 't1' }, mockCallbacks());
    m.addPlayer('Bình', 't2');
    return m;
  };

  it('ghép đề từ kho khi bắt đầu, và không đổi đề nếu bấm bắt đầu lần nữa', () => {
    const { data } = loadFromSheets(fullSheets(1));
    const usage = new QuestionUsage();
    const m = newMachine('BK0001');
    m.setQuestionComposer(() => composeQuestionSet(data, usage));
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    expect(m.startGame('p1').ok).toBe(true);
    const chosenId = m.questionSet.id;
    expect(chosenId).toMatch(/^bank-/);
    expect(m.room.questionSetId).toBe(chosenId);
    expect(m.startGame('p1')).toEqual({ ok: false, error: 'Trận đấu đã bắt đầu.' });
    expect(m.questionSet.id).toBe(chosenId);
    log.mockRestore();
    m.dispose();
  });

  it('độ khó và đáp án không bị gửi xuống client', async () => {
    const { data } = loadFromSheets(fullSheets(1));
    const m = newMachine('BK0004');
    m.setQuestionComposer(() => composeQuestionSet(data, new QuestionUsage()));
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    m.startGame('p1');
    m.room.status = 'KD_CHUNG';
    await (m as any).runKdChungQuestion(9);
    const sent = m.getSanitizedRoom().state.currentQuestion as any;
    expect(sent.prompt).toBeTruthy();
    expect(sent.difficulty).toBeUndefined();
    expect(sent.answer).toBeUndefined();
    log.mockRestore();
    m.dispose();
  });

  it('bộ đề chủ phòng tự tải lên được giữ nguyên, không bị thay bằng đề ngẫu nhiên', () => {
    const composer = vi.fn();
    const m = newMachine('BK0002');
    m.setQuestionComposer(composer);
    m.setQuestionSet({ ...DEFAULT_QUESTION_SET, id: 'custom-x' }, 'custom');
    expect(m.startGame('p1').ok).toBe(true);
    expect(composer).not.toHaveBeenCalled();
    expect(m.questionSet.id).toBe('custom-x');
    m.dispose();
  });

  it('kho thiếu câu thì dùng bộ đề mặc định, trận vẫn bắt đầu được', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const m = newMachine('BK0003');
    m.setQuestionComposer(() => ({ ok: false, error: 'Kho thiếu câu' }));
    expect(m.startGame('p1').ok).toBe(true);
    expect(m.questionSet.id).toBe(DEFAULT_QUESTION_SET.id);
    expect(err).toHaveBeenCalled();
    err.mockRestore();
    m.dispose();
  });
});
