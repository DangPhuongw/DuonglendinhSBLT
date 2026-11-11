import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import xlsx from 'xlsx';
import { GAME_CONFIG, Question, QuestionDifficulty } from '@olympia/shared';

/**
 * Kho câu hỏi: đọc tất cả file .xlsx trong một thư mục (xem question-bank/README.md).
 * Mỗi dòng là một câu hỏi; dòng lỗi bị bỏ qua và ghi vào danh sách `issues` thay vì làm hỏng cả kho.
 */

export type Difficulty = QuestionDifficulty;

export interface BankQuestion extends Question {
  topic?: string;
}

export interface VcnvCluster {
  id: string;
  rows: Question[]; // đúng 4 hàng ngang
  center: Question;
  obstacle: Question;
  topic?: string;
}

export interface QuestionBankData {
  kdRieng: BankQuestion[];
  kdChung: BankQuestion[];
  tangToc: BankQuestion[];
  vd10: BankQuestion[];
  vd20: BankQuestion[];
  vd30: BankQuestion[];
  tieBreak: BankQuestion[];
  vcnv: VcnvCluster[];
}

export interface BankIssue {
  file: string;
  sheet: string;
  row: number; // số dòng trong Excel (dòng 1 là tiêu đề); 0 = lỗi của cả sheet / file
  message: string;
}

export interface LoadedBank {
  data: QuestionBankData;
  issues: BankIssue[];
  files: string[];
}

export function emptyBank(): QuestionBankData {
  return { kdRieng: [], kdChung: [], tangToc: [], vd10: [], vd20: [], vd30: [], tieBreak: [], vcnv: [] };
}

// ---------- tiện ích ----------

/** Chuẩn hóa tên cột / tên sheet: bỏ dấu, chữ thường, chỉ giữ chữ và số. */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const SHEET_ALIASES: Record<string, keyof QuestionBankData | 'vcnv'> = {
  khoidongrieng: 'kdRieng',
  rieng: 'kdRieng',
  khoidongchung: 'kdChung',
  chung: 'kdChung',
  vcnv: 'vcnv',
  vuotchuongngaivat: 'vcnv',
  tangtoc: 'tangToc',
  vedich: 'vd10', // sheet chung cho 3 mức điểm (cột Points) -> chia ra vd10/vd20/vd30
  cauhoiphu: 'tieBreak',
  tiebreak: 'tieBreak',
  phu: 'tieBreak',
};

const COLUMN_ALIASES: Record<string, string[]> = {
  prompt: ['prompt', 'cauhoi', 'noidung', 'noidungcauhoi'],
  answer: ['answer', 'dapan'],
  alternatives: ['alternatives', 'dapankhac', 'dapantuongduong', 'cachviettuongduong'],
  optionA: ['optiona', 'a', 'phuongana'],
  optionB: ['optionb', 'b', 'phuonganb'],
  optionC: ['optionc', 'c', 'phuonganc'],
  optionD: ['optiond', 'd', 'phuongand'],
  difficulty: ['difficulty', 'dokho', 'mucdo'],
  topic: ['topic', 'chude', 'ghichu', 'note'],
  skip: ['skip', 'bo', 'boqua', 'tat'],
  id: ['id', 'ma', 'macauhoi'],
  media: ['media', 'hinhanh', 'anh'],
  points: ['points', 'diem'],
  cluster: ['cluster', 'cum', 'macum'],
  type: ['type', 'loai'],
  seat: ['seat'], // cột cũ của file mẫu: bỏ qua
  order: ['order'],
};

type Row = Record<string, string>;

function toRows(sheet: xlsx.WorkSheet): Row[] {
  const raw = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return raw.map((r) => {
    const out: Row = {};
    for (const [k, v] of Object.entries(r)) {
      const norm = normalizeKey(k);
      for (const [canon, aliases] of Object.entries(COLUMN_ALIASES)) {
        if (aliases.includes(norm) && out[canon] === undefined) out[canon] = String(v ?? '').trim();
      }
    }
    return out;
  });
}

const get = (row: Row, key: string): string => row[key] ?? '';

function isTruthy(value: string): boolean {
  return ['x', '1', 'true', 'yes', 'co', 'có', 'bo', 'skip', 'tat'].includes(value.trim().toLowerCase());
}

/** undefined = ô trống, null = giá trị không nhận ra. */
export function parseDifficulty(value: string): Difficulty | null | undefined {
  if (!value.trim()) return undefined;
  const v = normalizeKey(value);
  if (['de', 'easy', '1', 'd'].includes(v)) return 'easy';
  if (['vua', 'trungbinh', 'tb', 'medium', '2', 'v'].includes(v)) return 'medium';
  if (['kho', 'hard', '3', 'k'].includes(v)) return 'hard';
  return null;
}

function parseAlternatives(value: string): string[] {
  return value
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

function hash8(text: string): string {
  return crypto.createHash('sha1').update(text.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex').slice(0, 8);
}

// ---------- đọc kho ----------

export function loadQuestionBank(dir: string): LoadedBank {
  const data = emptyBank();
  const issues: BankIssue[] = [];
  const files: string[] = [];
  const seenIds = new Set<string>();

  if (!fs.existsSync(dir)) {
    return { data, issues: [{ file: dir, sheet: '', row: 0, message: 'Không tìm thấy thư mục kho câu hỏi.' }], files };
  }

  const xlsxFiles = fs
    .readdirSync(dir)
    .filter((f) => /\.xlsx$/i.test(f) && !f.startsWith('~$')) // ~$ = file tạm của Excel khi đang mở
    .sort();

  for (const file of xlsxFiles) {
    let workbook: xlsx.WorkBook;
    try {
      workbook = xlsx.read(fs.readFileSync(path.join(dir, file)), { type: 'buffer' });
    } catch (err: any) {
      issues.push({ file, sheet: '', row: 0, message: `Không đọc được file: ${err.message}` });
      continue;
    }
    files.push(file);

    const addIssue = (sheet: string, row: number, message: string) => issues.push({ file, sheet, row, message });

    const claimId = (id: string, sheet: string, row: number): boolean => {
      if (seenIds.has(id)) {
        addIssue(sheet, row, `Câu hỏi bị trùng (mã ${id}), đã bỏ qua dòng này.`);
        return false;
      }
      seenIds.add(id);
      return true;
    };

    for (const sheetName of workbook.SheetNames) {
      const kind = SHEET_ALIASES[normalizeKey(sheetName)];
      if (!kind) continue; // sheet khác (hướng dẫn, ghi chú...) -> bỏ qua
      const rows = toRows(workbook.Sheets[sheetName]);

      if (kind === 'vcnv') {
        parseVcnvSheet(rows, data, (r, m) => addIssue(sheetName, r, m), claimId, sheetName);
        continue;
      }

      rows.forEach((row, idx) => {
        const excelRow = idx + 2;
        const prompt = get(row, 'prompt');
        if (!prompt && !get(row, 'answer')) return; // dòng trống
        if (isTruthy(get(row, 'skip'))) return;

        const built = buildQuestion(row, kind === 'kdRieng' || kind === 'kdChung', kind, (m) =>
          addIssue(sheetName, excelRow, m)
        );
        if (!built) return;
        if (!claimId(built.id, sheetName, excelRow)) return;

        if (kind === 'vd10') {
          const points = Number(get(row, 'points') || 10);
          if (![10, 20, 30].includes(points)) {
            addIssue(sheetName, excelRow, `Điểm "${get(row, 'points')}" không hợp lệ (chỉ 10, 20 hoặc 30).`);
            seenIds.delete(built.id);
            return;
          }
          built.points = points as 10 | 20 | 30;
          built.timeLimit = 20;
          built.difficulty = GAME_CONFIG.VE_DICH.DIFFICULTY_BY_POINTS[points];
          (points === 10 ? data.vd10 : points === 20 ? data.vd20 : data.vd30).push(built);
        } else {
          (data[kind] as BankQuestion[]).push(built);
        }
      });
    }
  }

  return { data, issues, files };
}

function buildQuestion(
  row: Row,
  isMcq: boolean,
  kind: string,
  report: (message: string) => void
): BankQuestion | null {
  const prompt = get(row, 'prompt');
  const answer = get(row, 'answer');
  if (!prompt) return report('Thiếu nội dung câu hỏi.'), null;
  if (!answer) return report('Thiếu đáp án.'), null;

  // Độ khó chỉ dùng ở Khởi động (bắt buộc). Về đích lấy theo mức điểm; các vòng khác bỏ qua cột này.
  let difficulty: Difficulty | undefined;
  if (isMcq) {
    const parsed = parseDifficulty(get(row, 'difficulty'));
    if (parsed === undefined) return report('Thiếu độ khó (Dễ, Trung bình hoặc Khó).'), null;
    if (parsed === null) {
      return report(`Độ khó "${get(row, 'difficulty')}" không hợp lệ (dùng: Dễ, Trung bình, Khó).`), null;
    }
    difficulty = parsed;
  }

  const idPrefix = { kdRieng: 'kdr', kdChung: 'kdc', tangToc: 'tt', vd10: 'vd', tieBreak: 'tb' }[kind] || kind;
  const id = get(row, 'id') || `${idPrefix}-${hash8(prompt)}`;
  const alternatives = parseAlternatives(get(row, 'alternatives'));
  const topic = get(row, 'topic') || undefined;

  if (isMcq) {
    const options = [get(row, 'optionA'), get(row, 'optionB'), get(row, 'optionC'), get(row, 'optionD')];
    if (options.some((o) => !o)) return report('Câu trắc nghiệm cần đủ 4 phương án A, B, C, D.'), null;
    const letter = answer.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(letter)) {
      return report(`Đáp án "${answer}" phải là một trong A, B, C, D.`), null;
    }
    return {
      id,
      type: 'mcq',
      prompt,
      options: options as [string, string, string, string],
      answer: letter,
      alternatives,
      difficulty,
      topic,
    };
  }

  return {
    id,
    type: 'text',
    prompt,
    answer: answer.trim(),
    alternatives,
    media: get(row, 'media') || undefined,
    ignoreDiacritics: true,
    difficulty,
    topic,
  };
}

function parseVcnvSheet(
  rows: Row[],
  data: QuestionBankData,
  report: (row: number, message: string) => void,
  claimId: (id: string, sheet: string, row: number) => boolean,
  sheetName: string
): void {
  const groups = new Map<string, { row: Row; excelRow: number }[]>();
  rows.forEach((row, idx) => {
    if (!get(row, 'prompt') && !get(row, 'answer')) return;
    if (isTruthy(get(row, 'skip'))) return;
    const cluster = get(row, 'cluster');
    if (!cluster) return report(idx + 2, 'Thiếu mã cụm (cột Cluster).');
    if (!groups.has(cluster)) groups.set(cluster, []);
    groups.get(cluster)!.push({ row, excelRow: idx + 2 });
  });

  for (const [cluster, items] of groups) {
    const firstRow = items[0].excelRow;
    const fail = (message: string) => report(firstRow, `Cụm "${cluster}": ${message} Cả cụm đã bị bỏ qua.`);

    const rowQs: Question[] = [];
    let center: Question | null = null;
    let obstacle: Question | null = null;
    let broken = false;
    const clusterKey = hash8(cluster);

    for (const { row, excelRow } of items) {
      const type = normalizeKey(get(row, 'type'));
      const prompt = get(row, 'prompt');
      const answer = get(row, 'answer');
      const isCenter = type.includes('center') || type.includes('trung');
      const isObstacle = type.includes('obs') || type.includes('cnv') || type.includes('chuong') || type.includes('tukhoa');
      const role = isCenter ? 'center' : isObstacle ? 'obstacle' : 'row';
      // Câu ô trung tâm chỉ là gợi ý (không ai trả lời, không chấm điểm) nên không cần đáp án
      if (!answer && role !== 'center') {
        report(excelRow, `Cụm "${cluster}": thiếu đáp án. Cả cụm đã bị bỏ qua.`);
        broken = true;
        continue;
      }
      if (role !== 'obstacle' && !prompt) {
        report(excelRow, `Cụm "${cluster}": thiếu nội dung câu hỏi. Cả cụm đã bị bỏ qua.`);
        broken = true;
        continue;
      }

      const q: Question = {
        id: `vcnv-${clusterKey}-${role === 'row' ? `r${rowQs.length + 1}` : role}`,
        type: 'text',
        prompt: prompt || 'Từ khóa của chướng ngại vật là gì?',
        answer: answer.trim(),
        alternatives: parseAlternatives(get(row, 'alternatives')),
        ignoreDiacritics: true,
      };
      if (role === 'row') rowQs.push(q);
      else if (role === 'center') {
        if (center) {
          fail('có nhiều hơn 1 câu ô trung tâm.');
          broken = true;
        }
        center = q;
      } else {
        if (obstacle) {
          fail('có nhiều hơn 1 từ khóa chướng ngại vật.');
          broken = true;
        }
        obstacle = q;
      }
    }

    if (broken) continue;
    if (rowQs.length !== 4) {
      fail(`cần đúng 4 hàng ngang (đang có ${rowQs.length}).`);
      continue;
    }
    if (!center) {
      fail('thiếu câu ô trung tâm (Type = CENTER).');
      continue;
    }
    if (!obstacle) {
      fail('thiếu từ khóa chướng ngại vật (Type = OBSTACLE).');
      continue;
    }
    if (!claimId(`vcnv-${clusterKey}`, sheetName, firstRow)) continue;
    data.vcnv.push({ id: `vcnv-${clusterKey}`, rows: rowQs, center, obstacle, topic: get(items[0].row, 'topic') || undefined });
  }
}

// ---------- thống kê / kiểm tra ----------

export interface BankRequirement {
  key: keyof QuestionBankData;
  difficulty?: Difficulty;
  label: string;
  needed: number;
}

const KD = GAME_CONFIG.KHOI_DONG;
const RIENG_PACKAGES = 5;

/** Số câu tối thiểu mỗi trận cần (xem questionComposer). */
export const BANK_REQUIREMENTS: BankRequirement[] = [
  { key: 'kdRieng', difficulty: 'easy', label: 'Khởi động riêng - Dễ', needed: KD.RIENG_DIFFICULTY.easy * RIENG_PACKAGES },
  { key: 'kdRieng', difficulty: 'medium', label: 'Khởi động riêng - Trung bình', needed: KD.RIENG_DIFFICULTY.medium * RIENG_PACKAGES },
  { key: 'kdChung', difficulty: 'easy', label: 'Khởi động chung - Dễ', needed: KD.CHUNG_DIFFICULTY.easy },
  { key: 'kdChung', difficulty: 'medium', label: 'Khởi động chung - Trung bình', needed: KD.CHUNG_DIFFICULTY.medium },
  { key: 'kdChung', difficulty: 'hard', label: 'Khởi động chung - Khó', needed: KD.CHUNG_DIFFICULTY.hard },
  { key: 'vcnv', label: 'Vượt chướng ngại vật (cụm)', needed: 1 },
  { key: 'tangToc', label: 'Tăng tốc', needed: 4 },
  { key: 'vd10', label: 'Về đích 10 điểm', needed: 10 },
  { key: 'vd20', label: 'Về đích 20 điểm', needed: 6 },
  { key: 'vd30', label: 'Về đích 30 điểm', needed: 10 },
  { key: 'tieBreak', label: 'Câu hỏi phụ', needed: 3 },
];

/** Số câu hiện có cho một yêu cầu (lọc theo độ khó nếu có). */
export function countFor(data: QuestionBankData, r: BankRequirement): number {
  const list = data[r.key] as Array<{ difficulty?: Difficulty }>;
  return r.difficulty ? list.filter((q) => q.difficulty === r.difficulty).length : list.length;
}

export function findShortages(data: QuestionBankData): BankRequirement[] {
  return BANK_REQUIREMENTS.filter((r) => countFor(data, r) < r.needed);
}

export function summarizeBank(data: QuestionBankData): string[] {
  return BANK_REQUIREMENTS.map((r) => {
    const have = countFor(data, r);
    return `${have >= r.needed ? 'OK ' : 'THIẾU'}  ${r.label}: ${have} (cần tối thiểu ${r.needed} mỗi trận)`;
  });
}
