import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

function findFile(relPath: string): string {
  const p1 = path.resolve(relPath);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve('server', relPath);
  if (fs.existsSync(p2)) return p2;
  const p3 = path.resolve('..', relPath);
  if (fs.existsSync(p3)) return p3;
  return p1;
}

const bankPath = findFile('question-bank/kho-cau-hoi-mau.xlsx');
const wb = xlsx.readFile(bankPath);
const allPrompts: { source: string; sheet: string; prompt: string }[] = [];

for (const sheetName of wb.SheetNames) {
  const data = xlsx.utils.sheet_to_json<any>(wb.Sheets[sheetName], { defval: '' });
  for (const row of data) {
    const p = row.Prompt || row['Câu hỏi'] || '';
    if (p && String(p).trim()) {
      allPrompts.push({ source: 'kho-cau-hoi-mau.xlsx', sheet: sheetName, prompt: String(p).trim() });
    }
  }
}

const boDeDir = fs.existsSync(path.resolve('bo-de-thi-dau')) 
  ? path.resolve('bo-de-thi-dau') 
  : path.resolve('..', 'bo-de-thi-dau');

if (fs.existsSync(boDeDir)) {
  for (const f of fs.readdirSync(boDeDir)) {
    if (f.endsWith('.xlsx')) {
      const bwb = xlsx.readFile(path.join(boDeDir, f));
      for (const s of bwb.SheetNames) {
        const data = xlsx.utils.sheet_to_json<any>(bwb.Sheets[s], { defval: '' });
        for (const row of data) {
          const p = row.Prompt || row['Câu hỏi'] || '';
          if (p && String(p).trim()) {
            allPrompts.push({ source: f, sheet: s, prompt: String(p).trim() });
          }
        }
      }
    }
  }
}

console.log('Total prompts indexed:', allPrompts.length);
const outDir = path.dirname(bankPath);
const outPath = path.join(outDir, 'all_indexed_prompts.json');
fs.writeFileSync(outPath, JSON.stringify(allPrompts, null, 2), 'utf8');
console.log('Saved to', outPath);
