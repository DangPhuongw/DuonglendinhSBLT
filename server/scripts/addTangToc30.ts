import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { NEW_TANGTOC_30, excelPath, wb } from './testTangToc30.js';

const existingRows = xlsx.utils.sheet_to_json<any>(wb.Sheets['TangToc'], { defval: '' });
console.log('Existing TangToc count:', existingRows.length);

const combined = [...existingRows, ...NEW_TANGTOC_30];

const newWs = xlsx.utils.json_to_sheet(combined, {
  header: ['Prompt', 'Answer', 'Alternatives', 'Topic', 'Skip', 'Media']
});

wb.Sheets['TangToc'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log('Successfully saved TangToc sheet with total:', combined.length);
