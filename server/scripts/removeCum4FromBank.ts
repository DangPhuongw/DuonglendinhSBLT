import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('question-bank/kho-cau-hoi-mau.xlsx');
const wb = xlsx.readFile(filePath);
const rows: any[] = xlsx.utils.sheet_to_json(wb.Sheets['VCNV']);
const filtered = rows.filter(r => r.Cluster !== 'Cum-04');
wb.Sheets['VCNV'] = xlsx.utils.json_to_sheet(filtered);
xlsx.writeFile(wb, filePath);
console.log('Đã gỡ Cum-04 khỏi kho-cau-hoi-mau.xlsx để TRỐNG CƠM dành riêng cho bộ đề thi đấu!');
