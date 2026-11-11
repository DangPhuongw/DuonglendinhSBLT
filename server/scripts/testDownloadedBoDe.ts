import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { parseExcelQuestionSet } from '../src/game/questionParser.js';
import { validateQuestionSet } from '../src/game/questionValidator.js';
import { fillMissingFromBank, findMissingSections } from '../src/game/questionFill.js';
import { loadQuestionBank } from '../src/game/questionBank.js';
import { QuestionUsage } from '../src/game/questionComposer.js';

const xlsxPath = path.resolve('../bo-de-thi-dau/BoDe_ThiDau_Chuan.xlsx');
const jsonPath = path.resolve('../bo-de-thi-dau/BoDe_ThiDau_Chuan.json');

const buf = fs.readFileSync(xlsxPath);
const parsed = parseExcelQuestionSet(buf, 'BoDe_ThiDau_Chuan.xlsx');

// 1. Lưu lại bản JSON tương ứng
fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, 2), 'utf-8');
console.log(`[OK] Đã cập nhật file JSON: ${jsonPath}`);

// 2. Kiểm tra các sheet và câu hỏi sau khi user sửa
const wb = xlsx.readFile(xlsxPath);
console.log('\n--- TỔNG KẾT NỘI DUNG TẢI VỀ TỪ GOOGLE SHEETS ---');
for (const name of wb.SheetNames) {
  const rows: any[] = xlsx.utils.sheet_to_json(wb.Sheets[name]);
  console.log(`Sheet "${name}": ${rows.length} dòng`);
}

// 3. Chạy qua quy trình nạp đề thi của web (/api/upload-questions)
console.log('\n--- KIỂM TRA QUY TRÌNH NẠP FILE TRÊN WEB (/api/upload-questions) ---');
const bank = loadQuestionBank(path.resolve('question-bank')).data;
const missing = findMissingSections(parsed);
console.log('Thiếu phần nào cần bù từ kho:', missing);

const fill = fillMissingFromBank(parsed, bank, new QuestionUsage());
if (!fill.ok) {
  console.error('[THẤT BẠI] Lỗi bù phần thiếu:', fill.error);
  process.exit(1);
}
console.log('Bù phần thiếu từ kho:', fill.filled.length > 0 ? fill.filled : 'Không cần bù (file đã đủ tất cả các phần)');

const val = validateQuestionSet(fill.questionSet);
if (!val.ok) {
  console.error('[THẤT BẠI] Lỗi xác thực bộ đề:', val.errors);
  process.exit(1);
}

const qs = val.questionSet;
console.log('\n[XÁC THỰC THÀNH CÔNG 100%]');
console.log(`- Tiêu đề: ${qs.title}`);
console.log(`- Khởi động riêng: ${qs.khoiDong.rieng.map((r, i) => `Ghế ${i+1}: ${r.length} câu`).join(', ')}`);
console.log(`- Khởi động chung: ${qs.khoiDong.chung.length} câu`);
console.log(`- VCNV: ${qs.vcnv.rows.length} hàng ngang, Ô trung tâm: "${qs.vcnv.center.prompt || '(Trống)'}", Từ khóa: "${qs.vcnv.obstacle.answer}"`);
console.log(`- Tăng tốc: ${qs.tangToc.length} câu`);
console.log(`- Về đích: 10đ (${qs.veDich.pool10.length} câu), 20đ (${qs.veDich.pool20.length} câu), 30đ (${qs.veDich.pool30.length} câu)`);
console.log(`- Câu hỏi phụ: ${qs.tieBreak.length} câu`);
