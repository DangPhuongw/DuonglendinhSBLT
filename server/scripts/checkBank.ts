/**
 * Kiểm tra kho câu hỏi: báo lỗi từng dòng, đếm số câu, và chạy thử ghép đề nhiều trận liên tiếp.
 * Chạy: npm run bank:check --workspace=server   (thêm số trận thử: ... -- 20)
 */
import { loadQuestionBank, summarizeBank, findShortages } from '../src/game/questionBank.js';
import { QuestionUsage, composeQuestionSet } from '../src/game/questionComposer.js';
import { resolveBankDir } from '../src/game/questionBankService.js';

const dir = resolveBankDir();
const games = Number(process.argv[2]) || 10;
const { data, issues, files } = loadQuestionBank(dir);

console.log(`Thư mục kho: ${dir}`);
console.log(`File đã đọc (${files.length}): ${files.join(', ') || '(không có)'}\n`);
for (const line of summarizeBank(data)) console.log(line);

if (issues.length > 0) {
  console.log(`\n${issues.length} vấn đề:`);
  for (const i of issues) {
    console.log(`  - ${i.file}${i.sheet ? ` / ${i.sheet}` : ''}${i.row ? ` / dòng ${i.row}` : ''}: ${i.message}`);
  }
} else {
  console.log('\nKhông có dòng nào bị lỗi.');
}

if (findShortages(data).length > 0) {
  console.log('\nKho chưa đủ câu để ghép đề, bỏ qua bước chạy thử.');
  process.exit(1);
}

const usage = new QuestionUsage(); // chỉ trong bộ nhớ, không đụng lịch sử thật
const seen = new Map<string, number>();
let repeats = 0;
for (let g = 1; g <= games; g++) {
  const res = composeQuestionSet(data, usage);
  if (!res.ok) throw new Error(res.error);
  usage.mark(res.questionIds);
  for (const id of res.questionIds) {
    if (seen.has(id)) repeats++;
    seen.set(id, (seen.get(id) || 0) + 1);
  }
}
const total = [data.kdRieng, data.kdChung, data.tangToc, data.vd10, data.vd20, data.vd30, data.tieBreak].reduce((n, l) => n + l.length, 0) + data.vcnv.length;
console.log(`\nChạy thử ${games} trận liên tiếp: dùng ${seen.size}/${total} câu khác nhau, ${repeats} lần câu bị lặp lại.`);
