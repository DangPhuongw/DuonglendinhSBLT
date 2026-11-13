import xlsx from 'xlsx';
import path from 'path';

const excelPath = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
const wb = xlsx.readFile(excelPath);

const existingRows = xlsx.utils.sheet_to_json<any>(wb.Sheets['VCNV'], { defval: '' });
console.log('Existing VCNV rows count:', existingRows.length);

const cum08Rows = [
  {
    Cluster: 'Cum-08',
    Type: 'ROW',
    Prompt: 'Chất rắn vô định hình được chế tạo chủ yếu từ cát thạch anh (SiO2) nung chảy ở nhiệt độ cao, nổi tiếng với độ trong suốt cùng tính trơ hóa học nên được ứng dụng rộng rãi làm dụng cụ thí nghiệm và thấu kính quang học, có tên gọi là gì?',
    Answer: 'THỦY TINH',
    Alternatives: 'THỦY TINH; THUY TINH; KÍNH; KINH; THẤU KÍNH; THAU KINH',
    Topic: 'Hóa học / Vật liệu',
  },
  {
    Cluster: 'Cum-08',
    Type: 'ROW',
    Prompt: 'Đại lượng vật lý cơ bản được nhà bác học Albert Einstein xác định là chiều thứ tư gắn liền với không gian trong thuyết tương đối, là đại lượng nào?',
    Answer: 'THỜI GIAN',
    Alternatives: 'THỜI GIAN; THOI GIAN',
    Topic: 'Vật lý',
  },
  {
    Cluster: 'Cum-08',
    Type: 'ROW',
    Prompt: 'Các phi hành gia làm việc dài ngày trên Trạm Vũ trụ Quốc tế (ISS) thường gặp tình trạng suy giảm mật độ xương và teo cơ do cơ thể phải thích nghi với môi trường thiếu vắng tác động của lực tự nhiên nào?',
    Answer: 'TRỌNG LỰC',
    Alternatives: 'TRỌNG LỰC; TRONG LUC; LỰC HẤP DẪN; LUC HAP DAN; LỰC HÚT TRÁI ĐẤT; LUC HUT TRAI DAT',
    Topic: 'Vật lý / Vũ trụ',
  },
  {
    Cluster: 'Cum-08',
    Type: 'ROW',
    Prompt: 'Thao tác lật chuyển một vật thể một góc 180 độ nhằm đưa phần đáy lên vị trí đỉnh hoặc làm đảo chiều vận hành ban đầu của vật được gọi là gì?',
    Answer: 'XOAY NGƯỢC',
    Alternatives: 'XOAY NGƯỢC; XOAY NGUOC; ĐẢO NGƯỢC; DAO NGUOC; LẬT NGƯỢC; LAT NGUOC',
    Topic: 'Vật lý / Cơ học',
  },
  {
    Cluster: 'Cum-08',
    Type: 'CENTER',
    Prompt: 'Dụng cụ đo lường cổ điển gồm hai bầu thủy tinh thông nhau qua một eo thắt hẹp, sử dụng dòng chảy ổn định của các hạt khoáng chất mịn dưới tác dụng của trọng lực để ước lượng một khoảng thời gian xác định được gọi là gì?',
    Answer: 'ĐỒNG HỒ CÁT',
    Alternatives: 'ĐỒNG HỒ CÁT; DONG HO CAT',
    Topic: 'Từ khóa Chướng ngại vật',
  },
  {
    Cluster: 'Cum-08',
    Type: 'OBSTACLE',
    Prompt: 'Dụng cụ đo lường cổ điển gồm hai bầu thủy tinh thông nhau qua một eo thắt hẹp, sử dụng dòng chảy ổn định của các hạt khoáng chất mịn dưới tác dụng của trọng lực để ước lượng một khoảng thời gian xác định được gọi là gì?',
    Answer: 'ĐỒNG HỒ CÁT',
    Alternatives: 'ĐỒNG HỒ CÁT; DONG HO CAT',
    Topic: 'Từ khóa Chướng ngại vật',
  },
];

const allRows = [...existingRows, ...cum08Rows];
const newWs = xlsx.utils.json_to_sheet(allRows, {
  header: ['Cluster', 'Type', 'Prompt', 'Answer', 'Alternatives', 'Topic'],
});

wb.Sheets['VCNV'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log('Successfully added Cum-08 to VCNV in kho-cau-hoi-mau.xlsx! Total rows:', allRows.length);
