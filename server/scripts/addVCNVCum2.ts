import xlsx from 'xlsx';
import path from 'path';

const excelPath = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
const wb = xlsx.readFile(excelPath);

const existingRows = xlsx.utils.sheet_to_json<any>(wb.Sheets['VCNV'], { defval: '' });
console.log('Existing VCNV rows count:', existingRows.length);

const cum02Rows = [
  {
    Cluster: 'Cum-02',
    Type: 'ROW',
    Prompt: 'Điền từ còn thiếu (gồm 2 tiếng) vào câu nói nổi tiếng của Chủ tịch Hồ Chí Minh đúc kết bài học lịch sử của cách mạng Việt Nam: "..., ..., đại ... / Thành công, thành công, đại thành công"?',
    Answer: 'ĐOÀN KẾT',
    Alternatives: 'ĐOÀN KẾT; DOAN KET; ĐOÀN KẾT ĐOÀN KẾT ĐẠI ĐOÀN KẾT; DOAN KET DOAN KET DAI DOAN KET; TINH THẦN ĐOÀN KẾT; TINH THAN DOAN KET; SỰ ĐOÀN KẾT; SU DOAN KET',
    Topic: 'Lịch sử - Xã hội',
  },
  {
    Cluster: 'Cum-02',
    Type: 'ROW',
    Prompt: 'Dòng tranh khắc gỗ truyền thống của làng Đông Hồ (tỉnh Bắc Ninh) gắn liền với hình ảnh "Đám cưới chuột", "Gà đại cát" hay "Lợn đàn" được xếp vào thể loại tranh nghệ thuật nào của Việt Nam?',
    Answer: 'DÂN GIAN',
    Alternatives: 'DÂN GIAN; DAN GIAN; TRANH DÂN GIAN; TRANH DAN GIAN; TRANH DÂN GIAN ĐÔNG HỒ; TRANH DAN GIAN DONG HO; NGHỆ THUẬT DÂN GIAN; NGHE THUAT DAN GIAN',
    Topic: 'Nghệ thuật - Văn hóa',
  },
  {
    Cluster: 'Cum-02',
    Type: 'ROW',
    Prompt: 'Trong Lý thuyết xác suất và Kinh tế học hiện đại, ngành toán học ứng dụng nghiên cứu các tình huống cạnh tranh và hợp tác giữa các bên có lợi ích phụ thuộc lẫn nhau (nổi tiếng với khái niệm Cân bằng Nash của nhà toán học John Nash) được gọi là "Lý thuyết ..."?',
    Answer: 'TRÒ CHƠI',
    Alternatives: 'TRÒ CHƠI; TRO CHOI; LÝ THUYẾT TRÒ CHƠI; LY THUYET TRO CHOI; LÝ THUYẾT GAME; LY THUYET GAME; GAME THEORY',
    Topic: 'Toán học - Kinh tế',
  },
  {
    Cluster: 'Cum-02',
    Type: 'ROW',
    Prompt: 'Trong hình học phẳng, đoạn thẳng nối hai điểm bất kỳ nằm trên một đường tròn được gọi là gì của đường tròn đó (nếu đoạn thẳng này đi qua tâm thì được gọi là đường kính)?',
    Answer: 'DÂY',
    Alternatives: 'DÂY; DAY; DÂY CUNG; DAY CUNG; ĐOẠN DÂY CUNG; DOAN DAY CUNG',
    Topic: 'Toán học',
  },
  {
    Cluster: 'Cum-02',
    Type: 'CENTER',
    Prompt: 'Môn thể thao đồng đội và nghi lễ truyền thống nào của Việt Nam (cùng với Campuchia, Hàn Quốc, Philippines) đã được UNESCO ghi danh là Di sản văn hóa phi vật thể đại diện của nhân loại vào năm 2015, trong đó hai phe cùng nắm vào một sợi thừng dài và dùng sức ghì về phía mình để phân định thắng thua qua vạch mốc ở giữa?',
    Answer: 'KÉO CO',
    Alternatives: 'KÉO CO; KEO CO; TRÒ CHƠI KÉO CO; TRO CHOI KEO CO; TRÒ KÉO CO; TRO KEO CO; NGHI LỄ VÀ TRÒ CHƠI KÉO CO; NGHI LE VA TRO CHOI KEO CO; MÔN KÉO CO; MON KEO CO',
    Topic: 'Văn hóa - Thể thao',
  },
  {
    Cluster: 'Cum-02',
    Type: 'OBSTACLE',
    Prompt: 'Môn thể thao đồng đội và nghi lễ truyền thống nào của Việt Nam (cùng với Campuchia, Hàn Quốc, Philippines) đã được UNESCO ghi danh là Di sản văn hóa phi vật thể đại diện của nhân loại vào năm 2015, trong đó hai phe cùng nắm vào một sợi thừng dài và dùng sức ghì về phía mình để phân định thắng thua qua vạch mốc ở giữa?',
    Answer: 'KÉO CO',
    Alternatives: 'KÉO CO; KEO CO; TRÒ CHƠI KÉO CO; TRO CHOI KEO CO; TRÒ KÉO CO; TRO KEO CO; NGHI LỄ VÀ TRÒ CHƠI KÉO CO; NGHI LE VA TRO CHOI KEO CO; MÔN KÉO CO; MON KEO CO',
    Topic: 'Từ khóa Chướng ngại vật',
  },
];

const allRows = [...existingRows, ...cum02Rows];
const newWs = xlsx.utils.json_to_sheet(allRows, {
  header: ['Cluster', 'Type', 'Prompt', 'Answer', 'Alternatives', 'Topic'],
});

wb.Sheets['VCNV'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log('Successfully added Cum-02 to VCNV in kho-cau-hoi-mau.xlsx! Total rows:', allRows.length);
