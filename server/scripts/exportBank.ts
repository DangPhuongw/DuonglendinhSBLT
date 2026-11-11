/**
 * Xuất bộ đề mặc định ra file Excel theo định dạng kho câu hỏi.
 * Chạy: npm run bank:export --workspace=server
 */
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { DIFFICULTY_LABELS, Question } from '@olympia/shared';
import { DEFAULT_QUESTION_SET } from '../src/game/defaultQuestionSet.js';
import { resolveBankDir } from '../src/game/questionBankService.js';

const qs = DEFAULT_QUESTION_SET;
const alt = (q: Question) => (q.alternatives || []).join('; ');
const mcq = (q: Question) => ({
  Prompt: q.prompt,
  OptionA: q.options?.[0] ?? '',
  OptionB: q.options?.[1] ?? '',
  OptionC: q.options?.[2] ?? '',
  OptionD: q.options?.[3] ?? '',
  Answer: q.answer,
  Alternatives: alt(q),
  Difficulty: q.difficulty ? DIFFICULTY_LABELS[q.difficulty] : '',
  Topic: '',
  Skip: '',
});
const text = (q: Question) => ({ Prompt: q.prompt, Answer: q.answer, Alternatives: alt(q), Topic: '', Skip: '' });

const wb = xlsx.utils.book_new();
const add = (name: string, rows: Record<string, unknown>[], widths: number[]) => {
  const ws = xlsx.utils.json_to_sheet(rows);
  ws['!cols'] = widths.map((wch) => ({ wch }));
  xlsx.utils.book_append_sheet(wb, ws, name);
};

add(
  'HuongDan',
  [
    { 'Hướng dẫn': 'Mỗi dòng là một câu hỏi. Thêm câu: thêm dòng mới. Xóa câu: xóa dòng, hoặc gõ x vào cột Skip để tạm tắt.' },
    { 'Hướng dẫn': 'Difficulty (Độ khó, bắt buộc ở 2 sheet Khởi động): Dễ / Trung bình / Khó.' },
    { 'Hướng dẫn': 'Mỗi ô Khởi động riêng: 4 câu Dễ + 2 câu Trung bình. Khởi động chung: 4 Dễ, 4 Trung bình, 2 Khó. Thứ tự xuất hiện được trộn lẫn, người chơi không thấy độ khó.' },
    { 'Hướng dẫn': 'Về đích: độ khó theo điểm (10 = Dễ, 20 = Trung bình, 30 = Khó), không cần cột Difficulty.' },
    { 'Hướng dẫn': 'Alternatives: các cách viết tương đương, cách nhau bằng dấu ; (không cần thêm bản không dấu).' },
    { 'Hướng dẫn': 'Khởi động riêng / chung: trắc nghiệm, Answer là một chữ cái A, B, C hoặc D.' },
    { 'Hướng dẫn': 'VCNV: mỗi cụm gồm 6 dòng cùng mã Cluster: 4 dòng Type=ROW, 1 dòng CENTER, 1 dòng OBSTACLE. Dòng CENTER là câu gợi ý hiện 30 giây để đoán từ khóa, không cần cột Answer.' },
    { 'Hướng dẫn': 'Về đích: cột Points là 10, 20 hoặc 30.' },
    { 'Hướng dẫn': 'Sửa xong lưu file, trận kế tiếp dùng luôn. Kiểm tra kho: npm run bank:check --workspace=server' },
  ],
  [120]
);
add('KhoiDong_Rieng', qs.khoiDong.rieng.flat().map(mcq), [70, 24, 24, 24, 24, 8, 30, 10, 14, 6]);
add('KhoiDong_Chung', qs.khoiDong.chung.map(mcq), [70, 24, 24, 24, 24, 8, 30, 10, 14, 6]);

const vcnvRows: Record<string, unknown>[] = [];
qs.vcnv.rows.forEach((q) => vcnvRows.push({ Cluster: 'Cum-01', Type: 'ROW', ...text(q) }));
vcnvRows.push({ Cluster: 'Cum-01', Type: 'CENTER', ...text(qs.vcnv.center) });
vcnvRows.push({ Cluster: 'Cum-01', Type: 'OBSTACLE', ...text(qs.vcnv.obstacle) });
add('VCNV', vcnvRows, [12, 10, 70, 24, 30, 14, 6]);

add('TangToc', qs.tangToc.map((q) => ({ ...text(q), Media: q.media ?? '' })), [70, 24, 30, 14, 6, 14]);

const vd: Record<string, unknown>[] = [];
for (const [points, pool] of [[10, qs.veDich.pool10], [20, qs.veDich.pool20], [30, qs.veDich.pool30]] as const) {
  pool.forEach((q) => vd.push({ Points: points, ...text(q) }));
}
add('VeDich', vd, [8, 70, 24, 30, 14, 6]);
add('CauHoiPhu', qs.tieBreak.map(text), [70, 24, 30, 14, 6]);

const dir = resolveBankDir();
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'kho-cau-hoi-mau.xlsx');
xlsx.writeFile(wb, file);
console.log(`Đã xuất ${file}`);
