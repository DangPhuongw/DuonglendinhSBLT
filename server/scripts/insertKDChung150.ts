import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { KD_CHUNG_RAW_PART1 } from './data/newKDChungPart1.js';
import { KD_CHUNG_RAW_PART2 } from './data/newKDChungPart2.js';
import { RawMCQ } from './data/newKDRiengPart1.js';

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

const allRaw: RawMCQ[] = [...KD_CHUNG_RAW_PART1, ...KD_CHUNG_RAW_PART2];
console.log(`Total raw questions for Khởi động chung: ${allRaw.length}`);

// 1. Self uniqueness
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const seen = new Set<string>();
for (const q of allRaw) {
  const n = norm(q.Prompt);
  if (seen.has(n)) {
    throw new Error(`Self-duplicate prompt: "${q.Prompt}"`);
  }
  seen.add(n);
}

// 2. Collision with indexed
for (const q of allRaw) {
  const n = norm(q.Prompt);
  for (const ex of existingPrompts) {
    if (norm(ex.prompt) === n) {
      throw new Error(`Collision with ${ex.source} (${ex.sheet}): "${q.Prompt}"`);
    }
  }
}

// 3. Separate by difficulty: 62 Dễ, 50 Trung bình, 38 Khó
const easyList = allRaw.filter(q => q.Difficulty === 'Dễ');
const medList = allRaw.filter(q => q.Difficulty === 'Trung bình');
const hardList = allRaw.filter(q => q.Difficulty === 'Khó');
console.log(`Split: ${easyList.length} Dễ, ${medList.length} Trung bình, ${hardList.length} Khó`);
if (easyList.length !== 62 || medList.length !== 50 || hardList.length !== 38) {
  throw new Error(`Invalid counts: easy=${easyList.length}, med=${medList.length}, hard=${hardList.length}`);
}

// 4. Interleave difficulties smoothly:
// We have roughly 5 Easy : 4 Medium : 3 Hard (sum = 12).
// In 150 questions, we can repeat blocks of (D, T, K, D, T, D, K, T, D, T, D, K...)
const interleaved: RawMCQ[] = [];
let eIdx = 0;
let mIdx = 0;
let hIdx = 0;

while (eIdx < easyList.length || mIdx < medList.length || hIdx < hardList.length) {
  if (eIdx < easyList.length) interleaved.push(easyList[eIdx++]);
  if (mIdx < medList.length) interleaved.push(medList[mIdx++]);
  if (hIdx < hardList.length) interleaved.push(hardList[hIdx++]);
  if (eIdx < easyList.length) interleaved.push(easyList[eIdx++]);
}

console.log(`Interleaved total: ${interleaved.length}`);

// 5. Generate balanced target answers: 37 A, 38 B, 37 C, 38 D
const letterCycle = ['A', 'B', 'C', 'D', 'B', 'C', 'D', 'A', 'C', 'D', 'A', 'B', 'D', 'A', 'B', 'C'];
const targetLetters: ('A' | 'B' | 'C' | 'D')[] = [];
for (let i = 0; i < 150; i++) {
  targetLetters.push(letterCycle[i % letterCycle.length] as any);
}
const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
for (const l of targetLetters) letterCounts[l]++;

const targetExact = { A: 37, B: 38, C: 37, D: 38 };
for (const k of ['A', 'B', 'C', 'D'] as const) {
  while (letterCounts[k] > targetExact[k]) {
    const needKey = (['A', 'B', 'C', 'D'] as const).find(x => letterCounts[x] < targetExact[x])!;
    for (let i = targetLetters.length - 1; i >= 0; i--) {
      if (targetLetters[i] === k) {
        targetLetters[i] = needKey;
        letterCounts[k]--;
        letterCounts[needKey]++;
        break;
      }
    }
  }
}
console.log('Final target letter counts for KD Chung:', letterCounts);

// Check max consecutive
let maxConsec = 1;
let curConsec = 1;
for (let i = 1; i < targetLetters.length; i++) {
  if (targetLetters[i] === targetLetters[i - 1]) {
    curConsec++;
    if (curConsec > maxConsec) maxConsec = curConsec;
  } else {
    curConsec = 1;
  }
}
console.log(`Max consecutive identical letters: ${maxConsec}`);
if (maxConsec > 2) {
  throw new Error(`Max consecutive > 2 detected!`);
}

// 6. Build final formatted questions
export interface FormattedMCQ {
  Prompt: string;
  OptionA: string;
  OptionB: string;
  OptionC: string;
  OptionD: string;
  Answer: string;
  Alternatives: string;
  Difficulty: string;
  Topic: string;
}

const formatted: FormattedMCQ[] = [];
const letterToIdx = { A: 0, B: 1, C: 2, D: 3 };

for (let i = 0; i < 150; i++) {
  const raw = interleaved[i];
  const ansLetter = targetLetters[i];
  const ansIdx = letterToIdx[ansLetter];

  const opts: string[] = ['', '', '', ''];
  opts[ansIdx] = raw.Correct;

  let dIdx = 0;
  for (let j = 0; j < 4; j++) {
    if (j !== ansIdx) {
      opts[j] = raw.Distractors[dIdx++];
    }
  }

  const item: FormattedMCQ = {
    Prompt: raw.Prompt,
    OptionA: opts[0],
    OptionB: opts[1],
    OptionC: opts[2],
    OptionD: opts[3],
    Answer: ansLetter,
    Alternatives: raw.Alternatives,
    Difficulty: raw.Difficulty,
    Topic: raw.Topic,
  };

  const str = JSON.stringify(item);
  if (/\b4\d{4}\b/.test(str)) {
    console.warn(`WARNING: 4xxxx pattern detected in item ${i + 1}:`, item);
  }

  formatted.push(item);
}

// 7. Append to Excel
const wb = xlsx.readFile(excelPath);
const existingRows = xlsx.utils.sheet_to_json<any>(wb.Sheets['KhoiDong_Chung'], { defval: '' });
console.log('Existing KhoiDong_Chung count:', existingRows.length);

const combined = [...existingRows, ...formatted];

const newWs = xlsx.utils.json_to_sheet(combined, {
  header: ['Prompt', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'Answer', 'Alternatives', 'Difficulty', 'Topic']
});

wb.Sheets['KhoiDong_Chung'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log(`Updated KhoiDong_Chung successfully! New total: ${combined.length}`);

// 8. Update indexed prompts
for (const q of formatted) {
  existingPrompts.push({ source: 'kho-cau-hoi-mau.xlsx', sheet: 'KhoiDong_Chung', prompt: q.Prompt.trim() });
}
fs.writeFileSync(indexedPath, JSON.stringify(existingPrompts, null, 2), 'utf8');
console.log(`Updated indexed prompts. Total indexed: ${existingPrompts.length}`);
