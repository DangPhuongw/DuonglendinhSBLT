import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

function findExcelPath(): string {
  const p1 = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve('question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p2)) return p2;
  throw new Error('Cannot find kho-cau-hoi-mau.xlsx');
}

const wb = xlsx.readFile(findExcelPath(), { cellDates: false, raw: true });

for (const sName of ['KhoiDong_Rieng', 'KhoiDong_Chung']) {
  const sheet = wb.Sheets[sName];
  const rows = xlsx.utils.sheet_to_json<any>(sheet, { defval: '', raw: true });
  rows.forEach((r, idx) => {
    for (const opt of ['OptionA', 'OptionB', 'OptionC', 'OptionD', 'Answer']) {
      const val = r[opt];
      if (typeof val === 'number' && val > 3000) {
        console.log(`[${sName}] Row ${idx + 2} ${opt} = ${val} | Prompt: ${r.Prompt}`);
      }
    }
  });
}
console.log('Done scanning for large numbers in options.');
