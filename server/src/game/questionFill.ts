import { Question, QuestionSet } from '@olympia/shared';
import { QuestionBankData } from './questionBank.js';
import { QuestionUsage, composeQuestionSet, listQuestionIds } from './questionComposer.js';

/**
 * Bộ đề tải lên (Excel) có thể chỉ có một số vòng. Phần thiếu được ghép ngẫu nhiên từ kho câu hỏi
 * (ưu tiên câu chưa dùng) thay vì dùng bộ đề mặc định, và được báo lại cho chủ phòng.
 */

export type MissingSection = 'rieng' | 'chung' | 'vcnv' | 'tangToc' | 'vd10' | 'vd20' | 'vd30' | 'tieBreak';

export const SECTION_LABELS: Record<MissingSection, string> = {
  rieng: 'Khởi động riêng',
  chung: 'Khởi động chung',
  vcnv: 'Vượt chướng ngại vật',
  tangToc: 'Tăng tốc',
  vd10: 'Về đích 10 điểm',
  vd20: 'Về đích 20 điểm',
  vd30: 'Về đích 30 điểm',
  tieBreak: 'Câu hỏi phụ',
};

export interface MissingReport {
  sections: MissingSection[];
  /** Chỉ số các ô Khởi động riêng (0-4) chưa có câu nào. */
  riengPackages: number[];
}

/** Những phần mà bộ đề chưa có đủ để chơi. */
export function findMissingSections(qs: QuestionSet): MissingReport {
  const sections: MissingSection[] = [];
  const riengPackages: number[] = [];

  for (let i = 0; i < 5; i++) {
    if (!(qs.khoiDong.rieng[i] || []).length) riengPackages.push(i);
  }
  if (riengPackages.length === 5) sections.push('rieng');
  if (qs.khoiDong.chung.length === 0) sections.push('chung');

  const v = qs.vcnv;
  if (v.rows.length < 4 || !v.center?.prompt || !v.obstacle?.prompt || !v.obstacle?.answer) sections.push('vcnv');

  if (qs.tangToc.length === 0) sections.push('tangToc');
  if (qs.veDich.pool10.length === 0) sections.push('vd10');
  if (qs.veDich.pool20.length === 0) sections.push('vd20');
  if (qs.veDich.pool30.length === 0) sections.push('vd30');
  if (qs.tieBreak.length === 0) sections.push('tieBreak');
  return { sections, riengPackages };
}

export function describeMissing(report: MissingReport): string[] {
  const labels = report.sections.map((s) => SECTION_LABELS[s]);
  // Một số ô Khởi động riêng trống (nhưng không phải tất cả)
  if (!report.sections.includes('rieng') && report.riengPackages.length > 0) {
    labels.unshift(`Khởi động riêng (ô ${report.riengPackages.map((i) => i + 1).join(', ')})`);
  }
  return labels;
}

export type FillResult =
  | { ok: true; questionSet: QuestionSet; filled: string[]; borrowedIds: string[] }
  | { ok: false; error: string };

/**
 * Bù các phần thiếu bằng câu hỏi ngẫu nhiên từ kho. Không đụng tới kho nếu bộ đề đã đủ.
 * Không ghi nhớ "đã dùng" ở đây: người gọi gọi usage.mark(borrowedIds) sau khi bộ đề được chấp nhận.
 */
export function fillMissingFromBank(qs: QuestionSet, bank: QuestionBankData, usage: QuestionUsage): FillResult {
  const report = findMissingSections(qs);
  const filled = describeMissing(report);
  if (filled.length === 0) return { ok: true, questionSet: qs, filled: [], borrowedIds: [] };

  const random = composeQuestionSet(bank, usage);
  if (!random.ok) {
    return {
      ok: false,
      error: `File đề còn thiếu: ${filled.join(', ')}. Kho câu hỏi cũng chưa đủ để bù (${random.error})`,
    };
  }
  const r = random.questionSet;
  const has = (s: MissingSection) => report.sections.includes(s);

  const rieng: Question[][] = qs.khoiDong.rieng.map((pkg) => pkg);
  while (rieng.length < 5) rieng.push([]);
  for (const i of report.riengPackages) rieng[i] = r.khoiDong.rieng[i];

  const merged: QuestionSet = {
    ...qs,
    khoiDong: { rieng, chung: has('chung') ? r.khoiDong.chung : qs.khoiDong.chung },
    vcnv: has('vcnv') ? r.vcnv : qs.vcnv,
    tangToc: has('tangToc') ? r.tangToc : qs.tangToc,
    veDich: {
      pool10: has('vd10') ? r.veDich.pool10 : qs.veDich.pool10,
      pool20: has('vd20') ? r.veDich.pool20 : qs.veDich.pool20,
      pool30: has('vd30') ? r.veDich.pool30 : qs.veDich.pool30,
    },
    tieBreak: has('tieBreak') ? r.tieBreak : qs.tieBreak,
  };

  // Mã các câu được mượn từ kho = các câu có trong bộ đề ghép nhưng không có trong bộ đề tải lên
  const own = new Set(listQuestionIds(qs).map((q) => q.id));
  const borrowedIds = listQuestionIds(merged)
    .map((q) => q.id)
    .filter((id) => !own.has(id));

  return { ok: true, questionSet: merged, filled, borrowedIds };
}
