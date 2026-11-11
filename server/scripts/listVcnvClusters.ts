import xlsx from 'xlsx';

const wb = xlsx.readFile('question-bank/kho-cau-hoi-mau.xlsx');
const sheet = wb.Sheets['VCNV'];
const rows: any[] = xlsx.utils.sheet_to_json(sheet);
console.log('Keys of first row:', Object.keys(rows[0]));
console.log('First row:', rows[0]);
