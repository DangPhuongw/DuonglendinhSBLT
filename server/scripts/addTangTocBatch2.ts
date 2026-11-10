import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { NEW_TANGTOC_BATCH2, excelPath, wb } from './testTangTocBatch2.js';

const existingRows = xlsx.utils.sheet_to_json<any>(wb.Sheets['TangToc'], { defval: '' });
console.log('Existing TangToc count before:', existingRows.length);

const combined = [...existingRows, ...NEW_TANGTOC_BATCH2];

const newWs = xlsx.utils.json_to_sheet(combined, {
  header: ['Prompt', 'Answer', 'Alternatives', 'Topic', 'Skip', 'Media']
});

wb.Sheets['TangToc'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log('Successfully saved TangToc sheet with total:', combined.length);

// Generate Google Sheet batch JSON
const startRow = existingRows.length + 2; // e.g. 34 + 2 = 36
const endRow = startRow + NEW_TANGTOC_BATCH2.length - 1; // 36 + 29 = 65
const range = `TangToc!A${startRow}:D${endRow}`;

const batchOps = [
  {
    op: 'write',
    range,
    data: NEW_TANGTOC_BATCH2.map(q => [q.Prompt, q.Answer, q.Alternatives, q.Topic])
  }
];

const dest = 'C:/Users/ADMIN/.gemini/antigravity/brain/1f2df474-4ea3-4326-ba00-9d818f03d90b/scratch/add_tangtoc_batch2.json';
fs.writeFileSync(dest, JSON.stringify(batchOps, null, 2));
console.log(`Generated batch JSON for Google Sheets: range ${range}, count: ${NEW_TANGTOC_BATCH2.length}`);
