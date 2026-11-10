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

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '', raw: true });
  let count = 0;
  rows.forEach((row, idx) => {
    const rowStr = JSON.stringify(row);
    const matches = rowStr.match(/\b4\d{4}\b/g);
    if (matches) {
      count++;
      console.log(`[${sheetName}] Row ${idx + 2}: Matches = ${matches.join(', ')}`);
      console.log('   Prompt:', row.Prompt || row['Câu hỏi']);
      console.log('   A:', row.OptionA, 'B:', row.OptionB, 'C:', row.OptionC, 'D:', row.OptionD);
      console.log('   Answer:', row.Answer, 'Alternatives:', row.Alternatives);
    }
  });
  console.log(`Sheet ${sheetName}: ${count} rows with 4xxxx\n`);
}
