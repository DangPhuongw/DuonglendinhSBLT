import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

const spreadsheetId = '1hQcGPDEQD3tt6hyugWljUhJCw5aEc8YOSUhk0hVuvCU';
const xlsxPath = path.resolve('../bo-de-thi-dau/BoDe_ThiDau_Chuan.xlsx');
const wb = xlsx.readFile(xlsxPath);

const sheetConfigs: { name: string; headers: string[] }[] = [
  {
    name: 'KhoiDong_Rieng',
    headers: ['Seat', 'Order', 'Prompt', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'Answer', 'Alternatives', 'Difficulty'],
  },
  {
    name: 'KhoiDong_Chung',
    headers: ['Order', 'Prompt', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'Answer', 'Alternatives', 'Difficulty'],
  },
  {
    name: 'VCNV',
    headers: ['Type', 'Prompt', 'Answer', 'Alternatives', 'Image'],
  },
  {
    name: 'TangToc',
    headers: ['Order', 'Prompt', 'Answer', 'Alternatives', 'Media'],
  },
  {
    name: 'VeDich',
    headers: ['Points', 'Prompt', 'Answer', 'Alternatives'],
  },
  {
    name: 'TieBreak',
    headers: ['Order', 'Prompt', 'Answer', 'Alternatives'],
  },
];

const batchOps: any[] = [];

for (const cfg of sheetConfigs) {
  const ws = wb.Sheets[cfg.name];
  if (!ws) {
    console.error(`Sheet ${cfg.name} không tồn tại trong file Excel!`);
    continue;
  }
  const rawRows: any[] = xlsx.utils.sheet_to_json(ws);
  const rowsData: any[][] = [];
  rowsData.push(cfg.headers);

  for (const r of rawRows) {
    const rowValues = cfg.headers.map((h) => (r[h] !== undefined && r[h] !== null ? String(r[h]) : ''));
    rowsData.push(rowValues);
  }

  batchOps.push({
    op: 'write',
    range: `${cfg.name}!A1`,
    data: rowsData,
  });
}

const batchFile = path.resolve('scratch/upload_bode_gsheets_batch.json');
fs.mkdirSync(path.dirname(batchFile), { recursive: true });
fs.writeFileSync(batchFile, JSON.stringify(batchOps, null, 2), 'utf-8');
console.log(`Đã tạo file batch JSON tại: ${batchFile} với ${batchOps.length} sheets.`);
