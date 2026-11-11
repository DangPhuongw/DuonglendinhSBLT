import { ALL_150_KDR, wb } from './testKDRieng150.js';
import xlsx from 'xlsx';

const allExistingPrompts: { sheet: string; prompt: string }[] = [];
for (const name of wb.SheetNames) {
  const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets[name], { defval: '' });
  for (const r of rows) {
    const p = String(r.Prompt || r['Câu hỏi'] || r.cauhoi || '').trim();
    if (p) allExistingPrompts.push({ sheet: name, prompt: p });
  }
}

function words(s: string) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9à-ỹ]/g, ' ').split(/\s+/).filter(Boolean));
}

const collidedIndices = new Set<number>();
ALL_150_KDR.forEach((q, idx) => {
  const w1 = words(q.Prompt);
  for (const ex of allExistingPrompts) {
    const w2 = words(ex.prompt);
    const inter = [...w1].filter(x => w2.has(x)).length;
    const union = new Set([...w1, ...w2]).size;
    const sim = inter / union;
    if (sim > 0.45) {
      collidedIndices.add(idx);
      console.log(`IDX ${idx} (#${idx + 1}): [${q.Difficulty}] "${q.Prompt.slice(0, 50)}..." ===> [${ex.sheet}] "${ex.prompt.slice(0, 50)}..." (${(sim * 100).toFixed(0)}%)`);
      break;
    }
  }
});
console.log('\nTotal unique indices with collision:', collidedIndices.size);
console.log('List of indices:', Array.from(collidedIndices).sort((a, b) => a - b));
