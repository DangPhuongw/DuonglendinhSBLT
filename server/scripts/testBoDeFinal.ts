import fs from 'fs';
import path from 'path';
import { parseExcelQuestionSet } from '../src/game/questionParser.js';
import { validateQuestionSet } from '../src/game/questionValidator.js';

const testFiles = [
  '../bo-de-thi-dau/BoDe_ThiDau_Chuan.xlsx',
  '../bo-de-thi-dau/BoDe_KhoiDong_Rieng.xlsx',
  '../bo-de-thi-dau/BoDe_ThiDau_Chuan.json'
];

for (const rel of testFiles) {
  const p = path.resolve(rel);
  const buf = fs.readFileSync(p);
  const raw = p.endsWith('.json') ? JSON.parse(buf.toString('utf-8')) : parseExcelQuestionSet(buf, path.basename(p));
  const val = validateQuestionSet(raw);
  console.log(`Kiểm tra file: ${path.basename(p)}`);
  console.log(`  - Hợp lệ (OK): ${val.ok}`);
  if (!val.ok) {
    console.error(`  - Lỗi:`, val.errors);
  } else {
    console.log(`  - Tiêu đề: ${val.questionSet.title}`);
    console.log(`  - KĐ Riêng: ${val.questionSet.khoiDong.rieng.map((r, i) => `G${i+1}:${r.length}`).join(', ')} câu`);
    console.log(`  - KĐ Chung: ${val.questionSet.khoiDong.chung.length} câu`);
    console.log(`  - VCNV Hàng ngang: ${val.questionSet.vcnv.rows.length} hàng, Chướng ngại vật: ${val.questionSet.vcnv.obstacle.answer}`);
    console.log(`  - Tăng tốc: ${val.questionSet.tangToc.length} câu`);
    console.log(`  - Về đích: 10đ(${val.questionSet.veDich.pool10.length}), 20đ(${val.questionSet.veDich.pool20.length}), 30đ(${val.questionSet.veDich.pool30.length})`);
    console.log(`  - Câu hỏi phụ: ${val.questionSet.tieBreak.length} câu\n`);
  }
}
