import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { NEW_TANGTOC_20 } from './data/newTangToc20.js';

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

console.log(`Checking ${NEW_TANGTOC_20.length} new TangToc questions...`);

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

// 1. Self uniqueness
const seen = new Set<string>();
for (const q of NEW_TANGTOC_20) {
  const n = norm(q.Prompt);
  if (seen.has(n)) {
    throw new Error(`Duplicate prompt within new questions: "${q.Prompt}"`);
  }
  seen.add(n);
}

// 2. Collision with indexed
for (const q of NEW_TANGTOC_20) {
  const n = norm(q.Prompt);
  for (const ex of existingPrompts) {
    if (norm(ex.prompt) === n) {
      throw new Error(`Collision with ${ex.source} (${ex.sheet}): "${q.Prompt}"`);
    }
  }
}

console.log('Validation passed: 0 collisions!');

// 3. Append to Excel
const wb = xlsx.readFile(excelPath);
const existingRows = xlsx.utils.sheet_to_json<any>(wb.Sheets['TangToc'], { defval: '' });
console.log('Existing TangToc count:', existingRows.length);

const combined = [...existingRows, ...NEW_TANGTOC_20];

const newWs = xlsx.utils.json_to_sheet(combined, {
  header: ['Prompt', 'Answer', 'Alternatives', 'Topic', 'Skip', 'Media']
});

wb.Sheets['TangToc'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log(`Updated TangToc successfully! New total: ${combined.length}`);

// 4. Update indexed prompts
for (const q of NEW_TANGTOC_20) {
  existingPrompts.push({ source: 'kho-cau-hoi-mau.xlsx', sheet: 'TangToc', prompt: q.Prompt.trim() });
}
fs.writeFileSync(indexedPath, JSON.stringify(existingPrompts, null, 2), 'utf8');
console.log(`Updated indexed prompts. Total indexed: ${existingPrompts.length}`);
