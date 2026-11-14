import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { NEW_VEDICH_10 } from './data/newVeDich10.js';
import { NEW_VEDICH_20 } from './data/newVeDich20.js';
import { NEW_VEDICH_30 } from './data/newVeDich30.js';

function findFile(relPath: string): string {
  const p1 = path.resolve(relPath);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve('server', relPath);
  if (fs.existsSync(p2)) return p2;
  const p3 = path.resolve('..', relPath);
  if (fs.existsSync(p3)) return p3;
  return p1;
}

const excelPath = findFile('question-bank/kho-cau-hoi-mau.xlsx');
const indexedPath = findFile('question-bank/all_indexed_prompts.json');
const existingPrompts: { prompt: string; sheet: string; source: string }[] = JSON.parse(fs.readFileSync(indexedPath, 'utf8'));

const ALL_150_VD = [...NEW_VEDICH_10, ...NEW_VEDICH_20, ...NEW_VEDICH_30];
console.log(`Checking ${ALL_150_VD.length} new VeDich questions...`);

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

// 1. Self uniqueness
const seen = new Set<string>();
for (const q of ALL_150_VD) {
  const n = norm(q.Prompt);
  if (seen.has(n)) {
    throw new Error(`Duplicate prompt within new questions: "${q.Prompt}"`);
  }
  seen.add(n);
}

// 2. Collision with indexed
for (const q of ALL_150_VD) {
  const n = norm(q.Prompt);
  for (const ex of existingPrompts) {
    if (norm(ex.prompt) === n) {
      throw new Error(`Collision with ${ex.source} (${ex.sheet}): "${q.Prompt}"`);
    }
  }
}

// 3. Check Points distribution
const counts = { 10: 0, 20: 0, 30: 0 };
for (const q of ALL_150_VD) {
  counts[q.Points]++;
}
console.log('Points distribution:', counts);
if (counts[10] !== 50 || counts[20] !== 50 || counts[30] !== 50) {
  throw new Error(`Invalid points count: ${JSON.stringify(counts)}`);
}

console.log('Validation passed: 0 collisions!');

// 4. Append to Excel
const wb = xlsx.readFile(excelPath);
const existingRows = xlsx.utils.sheet_to_json<any>(wb.Sheets['VeDich'], { defval: '' });
console.log('Existing VeDich count:', existingRows.length);

const combined = [...existingRows, ...ALL_150_VD];

const newWs = xlsx.utils.json_to_sheet(combined, {
  header: ['Points', 'Prompt', 'Answer', 'Alternatives', 'Topic']
});

wb.Sheets['VeDich'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log(`Updated VeDich successfully! New total: ${combined.length}`);

// 5. Update indexed prompts
for (const q of ALL_150_VD) {
  existingPrompts.push({ source: 'kho-cau-hoi-mau.xlsx', sheet: 'VeDich', prompt: q.Prompt.trim() });
}
fs.writeFileSync(indexedPath, JSON.stringify(existingPrompts, null, 2), 'utf8');
console.log(`Updated indexed prompts. Total indexed: ${existingPrompts.length}`);
