import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { KD_RIENG_PART1, KDQ } from './data/newKhoiDongRiengPart1.js';
import { KD_RIENG_PART2 } from './data/newKhoiDongRiengPart2.js';

function findExcelPath(): string {
  const p1 = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve('question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p2)) return p2;
  throw new Error('Cannot find kho-cau-hoi-mau.xlsx');
}

export const excelPath = findExcelPath();
export const wb = xlsx.readFile(excelPath);

export const ALL_150_KDR: KDQ[] = [...KD_RIENG_PART1, ...KD_RIENG_PART2];

console.log('Total questions generated:', ALL_150_KDR.length);

const easyCount = ALL_150_KDR.filter(q => q.Difficulty === 'Dễ').length;
const medCount = ALL_150_KDR.filter(q => q.Difficulty === 'Trung bình').length;
console.log(`Difficulty breakdown: ${easyCount} Dễ, ${medCount} Trung bình`);

// Check answer distribution
const ansCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
for (const q of ALL_150_KDR) {
  ansCounts[q.Answer]++;
}
console.log('Answer distribution:', ansCounts);

// Check for 4xxxx or date traps
for (let i = 0; i < ALL_150_KDR.length; i++) {
  const q = ALL_150_KDR[i];
  const str = JSON.stringify(q);
  if (/\b4\d{4}\b/.test(str)) {
    console.error(`ERROR: Question ${i + 1} contains 4xxxx pattern:`, q);
  }
}

// Check similarity with existing bank
const allExistingPrompts: { sheet: string; prompt: string; answer: string }[] = [];

for (const name of wb.SheetNames) {
  const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets[name], { defval: '' });
  for (const r of rows) {
    const p = String(r.Prompt || r['Câu hỏi'] || r.cauhoi || '').trim();
    const a = String(r.Answer || r['Đáp án'] || r.dapan || '').trim();
    if (p) {
      allExistingPrompts.push({ sheet: name, prompt: p, answer: a });
    }
  }
}

console.log('Total existing prompts in bank:', allExistingPrompts.length);

function words(s: string) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9à-ỹ]/g, ' ').split(/\s+/).filter(Boolean));
}

let collisions = 0;
ALL_150_KDR.forEach((q, idx) => {
  const w1 = words(q.Prompt);
  for (const ex of allExistingPrompts) {
    const w2 = words(ex.prompt);
    const inter = [...w1].filter(x => w2.has(x)).length;
    const union = new Set([...w1, ...w2]).size;
    const sim = inter / union;
    if (sim > 0.45) {
      collisions++;
      console.log(`[#${idx + 1}] High similarity (${(sim * 100).toFixed(1)}%):`);
      console.log(`  New: ${q.Prompt}`);
      console.log(`  Existing (${ex.sheet}): ${ex.prompt}`);
    }
  }
});

console.log(`Collisions found: ${collisions}`);
