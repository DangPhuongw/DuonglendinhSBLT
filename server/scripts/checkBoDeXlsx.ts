import xlsx from 'xlsx';
const wb = xlsx.readFile('../bo-de-thi-dau/BoDe_ThiDau_Chuan.xlsx');
console.log(xlsx.utils.sheet_to_json(wb.Sheets['VCNV']));
