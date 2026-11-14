import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { KD_RIENG_RAW_PART1, RawMCQ } from './data/newKDRiengPart1.js';
import { KD_RIENG_RAW_PART2 } from './data/newKDRiengPart2.js';

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

const allRaw: RawMCQ[] = [...KD_RIENG_RAW_PART1, ...KD_RIENG_RAW_PART2];
console.log(`Total raw questions for Khởi động riêng: ${allRaw.length}`);

// 1. Check self uniqueness
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

// 3. Separate by difficulty: 100 Dễ, 50 Trung bình
const easyList = allRaw.filter(q => q.Difficulty === 'Dễ');
const medList = allRaw.filter(q => q.Difficulty === 'Trung bình');
console.log(`Split: ${easyList.length} Dễ, ${medList.length} Trung bình`);
if (easyList.length !== 100 || medList.length !== 50) {
  throw new Error(`Invalid counts: easy=${easyList.length}, med=${medList.length}`);
}

// 4. Interleave difficulties: pattern D, D, T, D, D, T (50 blocks of 3 questions: 2 Easy, 1 Med)
const interleaved: RawMCQ[] = [];
let eIdx = 0;
let mIdx = 0;
for (let i = 0; i < 50; i++) {
  interleaved.push(easyList[eIdx++]);
  interleaved.push(easyList[eIdx++]);
  interleaved.push(medList[mIdx++]);
}

// 5. Generate balanced target answers: 37 A, 38 B, 37 C, 38 D
// Cycle: A, B, C, D, B, C, D, A, C, D, A, B, D, A, B, C...
const letterCycle = ['A', 'B', 'C', 'D', 'B', 'C', 'D', 'A', 'C', 'D', 'A', 'B', 'D', 'A', 'B', 'C'];
const targetLetters: ('A' | 'B' | 'C' | 'D')[] = [];
for (let i = 0; i < 150; i++) {
  targetLetters.push(letterCycle[i % letterCycle.length] as any);
}
// Check distribution
const letterCounts = { A: 0, B: 0, C: 0, D: 0 };
for (const l of targetLetters) letterCounts[l]++;
console.log('Target letter counts initially:', letterCounts);
// letterCounts will be ~ 37-38 each. Let's make it exactly A: 37, B: 38, C: 37, D: 38 if needed
// Let's adjust to exact count if slight mismatch
const targetExact = { A: 37, B: 38, C: 37, D: 38 };
// Count differences
for (const k of ['A', 'B', 'C', 'D'] as const) {
  while (letterCounts[k] > targetExact[k]) {
    // Find a replacement target that needs more
    const needKey = (['A', 'B', 'C', 'D'] as const).find(x => letterCounts[x] < targetExact[x])!;
    // Find an occurrence in targetLetters that can be swapped without causing 3 identical consecutive
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
console.log('Final target letter counts:', letterCounts);

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

  // 4xxxx date trap check
  const str = JSON.stringify(item);
  if (/\b4\d{4}\b/.test(str)) {
    console.warn(`WARNING: 4xxxx pattern detected in item ${i + 1}:`, item);
  }

  formatted.push(item);
}

// 7. Append to Excel
const wb = xlsx.readFile(excelPath);
const existingRows = xlsx.utils.sheet_to_json<any>(wb.Sheets['KhoiDong_Rieng'], { defval: '' });
console.log('Existing KhoiDong_Rieng count:', existingRows.length);

const combined = [...existingRows, ...formatted];

const newWs = xlsx.utils.json_to_sheet(combined, {
  header: ['Prompt', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'Answer', 'Alternatives', 'Difficulty', 'Topic']
});

wb.Sheets['KhoiDong_Rieng'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log(`Updated KhoiDong_Rieng successfully! New total: ${combined.length}`);

// 8. Update indexed prompts
for (const q of formatted) {
  existingPrompts.push({ source: 'kho-cau-hoi-mau.xlsx', sheet: 'KhoiDong_Rieng', prompt: q.Prompt.trim() });
}
fs.writeFileSync(indexedPath, JSON.stringify(existingPrompts, null, 2), 'utf8');
console.log(`Updated indexed prompts. Total indexed: ${existingPrompts.length}`);
