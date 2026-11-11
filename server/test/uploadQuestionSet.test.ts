import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import xlsx from 'xlsx';
import { generateExcelTemplate, parseExcelQuestionSet } from '../src/game/questionParser.js';
import { validateQuestionSet } from '../src/game/questionValidator.js';
import { findMissingSections, fillMissingFromBank } from '../src/game/questionFill.js';
import { loadQuestionBank } from '../src/game/questionBank.js';
import { QuestionUsage } from '../src/game/questionComposer.js';
import { DEFAULT_QUESTION_SET } from '../src/game/defaultQuestionSet.js';

const workbookBuffer = (sheets: Record<string, Record<string, unknown>[]>) => {
  const wb = xlsx.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(rows), name);
  return Buffer.from(xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' }));
};

const mcq = (n: number, tag: string) =>
  Array.from({ length: n }, (_, i) => ({
    Prompt: `${tag} ${i + 1}?`, OptionA: 'a', OptionB: 'b', OptionC: 'c', OptionD: 'd', Answer: 'A', Difficulty: 'Dễ',
  }));

const realBank = () => loadQuestionBank(path.resolve(__dirname, '../question-bank')).data;

describe('File mẫu Excel', () => {
  it('có đủ 5 ghế Khởi động riêng, Về đích 10/6/10, không còn cột Image, nạp được và hợp lệ', () => {
    const buffer = generateExcelTemplate();
    const wb = xlsx.read(buffer, { type: 'buffer' });
    expect(wb.SheetNames).toEqual(['KhoiDong_Rieng', 'KhoiDong_Chung', 'VCNV', 'TangToc', 'VeDich', 'TieBreak']);
    const vcnvCols = Object.keys(xlsx.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['VCNV'])[0]);
    expect(vcnvCols).not.toContain('Image');

    const parsed = parseExcelQuestionSet(buffer, 'mau');
    expect(parsed.khoiDong.rieng.map((p) => p.length)).toEqual([6, 6, 6, 6, 6]);
    expect([parsed.veDich.pool10.length, parsed.veDich.pool20.length, parsed.veDich.pool30.length]).toEqual([10, 6, 10]);
    expect(parsed.vcnv.center.answer).toBe('');
    expect(findMissingSections(parsed).sections).toEqual([]);
    expect(validateQuestionSet(parsed).ok).toBe(true);
    // Lời nhắc thời gian cũ (10s/20s/40s) không còn trong câu hỏi mẫu Tăng tốc
    expect(parsed.tangToc.every((q) => !/giây/.test(q.prompt))).toBe(true);
  });
});

describe('Nhận diện file không phải file đề', () => {
  it('file chữ thường hoặc Excel không có sheet hợp lệ bị từ chối, không lẳng lặng dùng đề mặc định', () => {
    expect(() => parseExcelQuestionSet(Buffer.from('xin chao'), 'ghichu')).toThrow(/Không tìm thấy sheet nào hợp lệ/);
    expect(() => parseExcelQuestionSet(workbookBuffer({ Sheet1: [{ a: 1 }] }), 'rong')).toThrow(/KhoiDong_Rieng/);
  });

  it('file theo định dạng kho câu hỏi (cột Cluster) bị từ chối kèm hướng dẫn', () => {
    const bankFile = fs.readFileSync(path.resolve(__dirname, '../question-bank/kho-cau-hoi-mau.xlsx'));
    expect(() => parseExcelQuestionSet(bankFile, 'kho')).toThrow(/định dạng kho câu hỏi/);
  });

  it('phần thiếu để trống thay vì lấy đề mặc định', () => {
    const parsed = parseExcelQuestionSet(workbookBuffer({ KhoiDong_Chung: mcq(12, 'C') }), 'chi-co-chung');
    expect(parsed.khoiDong.chung).toHaveLength(12);
    expect(parsed.khoiDong.rieng.flat()).toHaveLength(0);
    expect(parsed.tangToc).toHaveLength(0);
    expect(parsed.veDich.pool10).toHaveLength(0);
    // Không có câu nào của bộ đề mặc định lọt vào
    const defaultPrompts = new Set(DEFAULT_QUESTION_SET.tangToc.map((q) => q.prompt));
    expect(parsed.tangToc.some((q) => defaultPrompts.has(q.prompt))).toBe(false);
  });
});

describe('Bù phần thiếu từ kho câu hỏi', () => {
  it('file chỉ có Khởi động chung: các vòng còn lại lấy từ kho, phần của file được giữ nguyên', () => {
    const bank = realBank();
    const parsed = parseExcelQuestionSet(workbookBuffer({ KhoiDong_Chung: mcq(12, 'Của chủ phòng') }), 'chi-co-chung');
    const usage = new QuestionUsage();
    const res = fillMissingFromBank(parsed, bank, usage);
    if (!res.ok) throw new Error(res.error);

    expect(res.filled).toEqual(['Khởi động riêng', 'Vượt chướng ngại vật', 'Tăng tốc', 'Về đích 10 điểm', 'Về đích 20 điểm', 'Về đích 30 điểm', 'Câu hỏi phụ']);
    expect(res.questionSet.khoiDong.chung.map((q) => q.prompt)).toEqual(parsed.khoiDong.chung.map((q) => q.prompt));
    expect(res.questionSet.khoiDong.rieng.map((p) => p.length)).toEqual([6, 6, 6, 6, 6]);
    expect(res.questionSet.vcnv.rows).toHaveLength(4);
    expect(res.questionSet.tangToc).toHaveLength(4);
    expect(validateQuestionSet(res.questionSet).ok).toBe(true);

    // Chỉ ghi nhận "đã dùng" các câu mượn từ kho
    expect(res.borrowedIds.length).toBeGreaterThan(0);
    expect(res.borrowedIds.every((id) => !id.startsWith('kdc-') || !parsed.khoiDong.chung.some((q) => q.id === id))).toBe(true);
    expect(usage.games).toBe(0); // chưa đánh dấu cho tới khi bộ đề được chấp nhận
  });

  it('chỉ thiếu ô Khởi động riêng thứ 5 thì chỉ bù ô đó', () => {
    const bank = realBank();
    const seats = [1, 2, 3, 4].flatMap((seat) => mcq(6, `Ghế ${seat}`).map((q, i) => ({ Seat: seat, Order: i + 1, ...q })));
    const parsed = parseExcelQuestionSet(workbookBuffer({ KhoiDong_Rieng: seats }), 'bon-ghe');
    expect(findMissingSections(parsed).riengPackages).toEqual([4]);

    const res = fillMissingFromBank(parsed, bank, new QuestionUsage());
    if (!res.ok) throw new Error(res.error);
    expect(res.filled).toContain('Khởi động riêng (ô 5)');
    expect(res.questionSet.khoiDong.rieng[0][0].prompt).toBe('Ghế 1 1?');
    expect(res.questionSet.khoiDong.rieng[4]).toHaveLength(6);
  });

  it('bộ đề đã đủ thì không đụng tới kho', () => {
    const parsed = parseExcelQuestionSet(generateExcelTemplate(), 'mau');
    const res = fillMissingFromBank(parsed, realBank(), new QuestionUsage());
    expect(res).toMatchObject({ ok: true, filled: [], borrowedIds: [] });
    if (res.ok) expect(res.questionSet).toBe(parsed);
  });

  it('kho không đủ để bù thì báo lỗi nêu rõ phần thiếu', () => {
    const empty = loadQuestionBank(fs.mkdtempSync(path.join(os.tmpdir(), 'olympia-empty-'))).data;
    const parsed = parseExcelQuestionSet(workbookBuffer({ KhoiDong_Chung: mcq(12, 'C') }), 'x');
    const res = fillMissingFromBank(parsed, empty, new QuestionUsage());
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('File đề còn thiếu');
      expect(res.error).toContain('Vượt chướng ngại vật');
      expect(res.error).toContain('Kho câu hỏi cũng chưa đủ');
    }
  });
});
