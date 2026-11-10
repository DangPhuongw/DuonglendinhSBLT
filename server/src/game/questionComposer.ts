import fs from 'fs';
import path from 'path';
import { GAME_CONFIG, Question, QuestionSet } from '@olympia/shared';
import { BankQuestion, Difficulty, QuestionBankData, countFor, findShortages } from './questionBank.js';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
export type DifficultyCounts = Record<Difficulty, number>;

/** Số câu mỗi trận (khớp với BANK_REQUIREMENTS). */
export const COMPOSE_COUNTS = {
  kdRiengPackages: 5,
  kdRiengPerPackage: GAME_CONFIG.KHOI_DONG.RIENG_QUESTIONS_PER_PLAYER,
  kdChung: GAME_CONFIG.KHOI_DONG.CHUNG_QUESTIONS,
  tangToc: 4,
  vd10: 10,
  vd20: 6,
  vd30: 10,
  tieBreak: 3,
};

// ---------- Theo dõi câu đã dùng ----------

/**
 * Ghi nhớ câu nào đã xuất hiện trong trận nào (số thứ tự trận tăng dần).
 * Câu chưa dùng bao giờ (0) hoặc dùng lâu nhất sẽ được ưu tiên bốc, nên cả kho được dùng hết một vòng
 * rồi mới lặp lại câu cũ.
 */
export class QuestionUsage {
  private lastUsed = new Map<string, number>();
  private counter = 0;

  constructor(private readonly file?: string) {
    this.load();
  }

  last(id: string): number {
    return this.lastUsed.get(id) ?? 0;
  }

  /** Đánh dấu một nhóm câu đã dùng trong trận mới. */
  mark(ids: string[]): void {
    this.counter++;
    for (const id of ids) this.lastUsed.set(id, this.counter);
    this.save();
  }

  get games(): number {
    return this.counter;
  }

  private load(): void {
    if (!this.file) return;
    try {
      if (!fs.existsSync(this.file)) return;
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf-8'));
      this.counter = Number(parsed.counter) || 0;
      for (const [id, n] of Object.entries(parsed.lastUsed || {})) this.lastUsed.set(id, Number(n) || 0);
    } catch (err) {
      console.error('Không đọc được lịch sử câu hỏi đã dùng, bắt đầu lại:', err);
    }
  }

  private save(): void {
    if (!this.file) return;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(
        tmp,
        JSON.stringify({ counter: this.counter, lastUsed: Object.fromEntries(this.lastUsed) }),
        'utf-8'
      );
      fs.renameSync(tmp, this.file);
    } catch (err) {
      console.error('Không lưu được lịch sử câu hỏi đã dùng:', err);
    }
  }
}

// ---------- Bốc câu ----------

type Rng = () => number;

function shuffle<T>(list: T[], rng: Rng): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Xáo trộn rồi xếp ổn định theo "lần dùng gần nhất" tăng dần: chưa dùng lên trước, bằng nhau thì ngẫu nhiên. */
function orderByUsage<T extends { id: string }>(list: T[], usage: QuestionUsage, rng: Rng): T[] {
  return shuffle(list, rng).sort((a, b) => usage.last(a.id) - usage.last(b.id));
}

/**
 * Bốc đúng số câu từng mức độ khó (ưu tiên câu chưa dùng / dùng lâu nhất trong mỗi mức),
 * rồi trộn lẫn các mức để thứ tự xuất hiện không đoán được độ khó.
 */
export function drawByDifficulty<T extends { id: string; difficulty?: Difficulty }>(
  pool: T[],
  counts: DifficultyCounts,
  usage: QuestionUsage,
  rng: Rng = Math.random
): T[] {
  const picked: T[] = [];
  for (const d of DIFFICULTY_ORDER) {
    const need = counts[d];
    if (need <= 0) continue;
    const tier = pool.filter((q) => q.difficulty === d);
    if (tier.length < need) throw new Error(`Kho chỉ có ${tier.length} câu mức ${d}, cần ${need}.`);
    picked.push(...orderByUsage(tier, usage, rng).slice(0, need));
  }
  return shuffle(picked, rng);
}

/** Bốc n câu không phân độ khó (Về đích, câu hỏi phụ): ưu tiên câu chưa dùng / dùng lâu nhất. */
export function drawPlain<T extends { id: string }>(pool: T[], n: number, usage: QuestionUsage, rng: Rng = Math.random): T[] {
  if (pool.length < n) throw new Error(`Kho chỉ có ${pool.length} câu, cần ${n}.`);
  return shuffle(orderByUsage(pool, usage, rng).slice(0, n), rng);
}

const toQuestion = ({ topic: _t, ...q }: BankQuestion): Question => q;

// ---------- Ghép đề ----------

export type ComposeResult =
  | { ok: true; questionSet: QuestionSet; questionIds: string[] }
  | { ok: false; error: string };

export function composeQuestionSet(
  bank: QuestionBankData,
  usage: QuestionUsage,
  rng: Rng = Math.random
): ComposeResult {
  const shortages = findShortages(bank);
  if (shortages.length > 0) {
    return {
      ok: false,
      error:
        'Kho câu hỏi chưa đủ: ' +
        shortages.map((s) => `${s.label} có ${countFor(bank, s)}/${s.needed}`).join('; ') +
        '.',
    };
  }

  const c = COMPOSE_COUNTS;

  // Khởi động riêng: 5 ô, mỗi ô 4 dễ + 2 trung bình (trộn lẫn), không trùng câu giữa các ô
  let rienPool = bank.kdRieng;
  const rieng: Question[][] = [];
  for (let i = 0; i < c.kdRiengPackages; i++) {
    const pkg = drawByDifficulty(rienPool, GAME_CONFIG.KHOI_DONG.RIENG_DIFFICULTY, usage, rng);
    const taken = new Set(pkg.map((q) => q.id));
    rienPool = rienPool.filter((q) => !taken.has(q.id));
    rieng.push(pkg.map(toQuestion));
  }

  // Khởi động chung: 4 dễ, 4 trung bình, 2 khó, trộn lẫn thứ tự
  const chung = drawByDifficulty(bank.kdChung, GAME_CONFIG.KHOI_DONG.CHUNG_DIFFICULTY, usage, rng).map(toQuestion);
  const tangToc = drawPlain(bank.tangToc, c.tangToc, usage, rng).map(toQuestion);

  const cluster = drawPlain(bank.vcnv, 1, usage, rng)[0];

  const veDich = {
    pool10: drawPlain(bank.vd10, c.vd10, usage, rng).map(toQuestion),
    pool20: drawPlain(bank.vd20, c.vd20, usage, rng).map(toQuestion),
    pool30: drawPlain(bank.vd30, c.vd30, usage, rng).map(toQuestion),
  };
  const tieBreak = drawPlain(bank.tieBreak, c.tieBreak, usage, rng).map(toQuestion);

  const questionSet: QuestionSet = {
    id: `bank-${Date.now()}`,
    title: 'Bộ đề ngẫu nhiên từ kho câu hỏi',
    khoiDong: { rieng, chung },
    vcnv: { rows: cluster.rows, center: cluster.center, obstacle: cluster.obstacle },
    tangToc,
    veDich,
    tieBreak,
  };

  const questionIds = [
    ...rieng.flat().map((q) => q.id),
    ...chung.map((q) => q.id),
    cluster.id,
    ...tangToc.map((q) => q.id),
    ...veDich.pool10.map((q) => q.id),
    ...veDich.pool20.map((q) => q.id),
    ...veDich.pool30.map((q) => q.id),
    ...tieBreak.map((q) => q.id),
  ];
  return { ok: true, questionSet, questionIds };
}

/** Danh sách (vòng, mã câu) của một bộ đề, dùng cho biên bản. */
export function listQuestionIds(qs: QuestionSet): { round: string; id: string }[] {
  const out: { round: string; id: string }[] = [];
  qs.khoiDong.rieng.forEach((pkg, i) => pkg.forEach((q) => out.push({ round: `Khoi dong rieng - o ${i + 1}`, id: q.id })));
  qs.khoiDong.chung.forEach((q) => out.push({ round: 'Khoi dong chung', id: q.id }));
  [...qs.vcnv.rows, qs.vcnv.center, qs.vcnv.obstacle].forEach((q) => out.push({ round: 'VCNV', id: q.id }));
  qs.tangToc.forEach((q) => out.push({ round: 'Tang toc', id: q.id }));
  for (const [label, pool] of [['10', qs.veDich.pool10], ['20', qs.veDich.pool20], ['30', qs.veDich.pool30]] as const) {
    pool.forEach((q) => out.push({ round: `Ve dich ${label} diem`, id: q.id }));
  }
  qs.tieBreak.forEach((q) => out.push({ round: 'Cau hoi phu', id: q.id }));
  return out;
}
