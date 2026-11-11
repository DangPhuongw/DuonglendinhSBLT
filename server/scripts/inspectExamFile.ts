import xlsx from 'xlsx';
import path from 'path';

const p = path.resolve('../bo-de-thi-dau/BoDe_ThiDau_Chuan.xlsx');
const wb = xlsx.readFile(p);
console.log('Sheet names:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[name]);
  console.log(`${name}: ${rows.length} rows`);
}
