import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

function findExcelPath(): string {
  const p1 = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve('question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p2)) return p2;
  throw new Error('Cannot find kho-cau-hoi-mau.xlsx');
}

const excelPath = findExcelPath();
const wb = xlsx.readFile(excelPath);

const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets['KhoiDong_Rieng'], { defval: '' });

console.log('Total rows in KhoiDong_Rieng:', rows.length);

for (const r of rows) {
  const p = r.Prompt || '';
  if (p.includes('Ngày Quốc tế Lao động')) {
    r.OptionA = 'Ngày 8 tháng 3';
    r.OptionB = 'Ngày 1 tháng 5';
    r.OptionC = 'Ngày 1 tháng 6';
    r.OptionD = 'Ngày 2 tháng 9';
    console.log('Fixed:', p);
  } else if (p.includes('Giỗ Tổ Hùng Vương')) {
    r.OptionA = 'Mùng 1 tháng Giêng';
    r.OptionB = 'Mùng 10 tháng 3';
    r.OptionC = 'Ngày 15 tháng 8';
    r.OptionD = 'Ngày 23 tháng Chạp';
    console.log('Fixed:', p);
  } else if (p.includes('hệ số góc bằng bao nhiêu')) {
    r.OptionA = '3';
    r.OptionB = '2';
    r.OptionC = '-2';
    r.OptionD = '1/2';
    console.log('Fixed:', p);
  } else if (p.includes('mặt ngửa khi tung một đồng xu')) {
    r.OptionA = '1/4';
    r.OptionB = '1/2';
    r.OptionC = '3/4';
    r.OptionD = '1';
    console.log('Fixed:', p);
  } else if (p.includes('sin 30°')) {
    r.OptionA = '0';
    r.OptionB = '1/2';
    r.OptionC = 'Căn bậc hai của 3 chia 2';
    r.OptionD = '1';
    console.log('Fixed:', p);
  } else if (p.includes('Ngày Quốc khánh của nước Cộng hòa Xã hội Chủ nghĩa')) {
    r.OptionA = '30 tháng 4';
    r.OptionB = '2 tháng 9';
    r.OptionC = '19 tháng 8';
    r.OptionD = '1 tháng 1';
    console.log('Fixed:', p);
  } else if (p.includes('Ngày Trái Đất (Earth Day)')) {
    r.OptionA = '22 tháng 3';
    r.OptionB = '22 tháng 4';
    r.OptionC = '5 tháng 6';
    r.OptionD = '22 tháng 5';
    console.log('Fixed:', p);
  }
}

const newWs = xlsx.utils.json_to_sheet(rows, {
  header: ['Seat', 'Order', 'Prompt', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'Answer', 'Alternatives', 'Difficulty', 'Topic', 'Skip']
});

wb.Sheets['KhoiDong_Rieng'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log('Successfully updated KhoiDong_Rieng in local Excel!');
