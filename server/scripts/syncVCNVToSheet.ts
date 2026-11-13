import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';

const excelPath = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
const wb = xlsx.readFile(excelPath);
const vcnvWs = wb.Sheets['VCNV'];

if (!vcnvWs) {
  console.error('VCNV sheet not found!');
  process.exit(1);
}

const csvContent = xlsx.utils.sheet_to_csv(vcnvWs);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbank_vcnv8_'));
const csvPath = path.join(tempDir, 'VCNV.csv');

fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8');
console.log('Exported VCNV CSV to:', csvPath);

const spreadsheetId = '1LCx3afXgORF3lfSohpExNF6y2icF-V2Mi0sAIsnbd3I';
const cmd = `gsheets mutate import-csv ${spreadsheetId} "${csvPath}" --sheet "VCNV"`;
console.log('Running:', cmd);

const output = execSync(cmd, { encoding: 'utf8' });
console.log(output);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('Done sync to Google Sheets!');
