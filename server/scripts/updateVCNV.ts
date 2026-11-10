import xlsx from 'xlsx';
import path from 'path';

const excelPath = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
const wb = xlsx.readFile(excelPath);

const vcnvRows = [
  {
    Cluster: 'Cum-01',
    Type: 'ROW',
    Prompt: 'Khí hiếm Neon (số hiệu nguyên tử là 10) là chất khí không màu, không mùi, nhưng khi được nạp vào trong các ống thủy tinh chân không và cho dòng điện cao thế chạy qua, nó sẽ tạo ra hiện tượng vật lý đặc trưng nào với sắc đỏ cam rực rỡ, thường được ứng dụng làm biển quảng cáo?',
    Answer: 'PHÁT SÁNG',
    Alternatives: 'PHÁT SÁNG; PHAT SANG; PHÁT QUANG; PHAT QUANG; SỰ PHÁT SÁNG; SU PHAT SANG; SỰ PHÁT QUANG; SU PHAT QUANG; HIỆN TƯỢNG PHÁT SÁNG; HIEN TUONG PHAT SANG; HIỆN TƯỢNG PHÁT QUANG; HIEN TUONG PHAT QUANG',
    Topic: 'Vật lý - Hóa học',
  },
  {
    Cluster: 'Cum-01',
    Type: 'ROW',
    Prompt: 'Ngược lại với quá trình quang hợp chỉ diễn ra khi có ánh sáng, vào khoảng thời gian nào trong ngày thì cây xanh hầu như chỉ thực hiện quá trình hô hấp (hấp thụ khí oxy và thải ra khí cacbonic), khiến các chuyên gia y tế khuyến cáo không nên đặt nhiều cây xanh trong phòng ngủ đóng kín?',
    Answer: 'BAN ĐÊM',
    Alternatives: 'BAN ĐÊM; BAN DEM; ĐÊM; DEM; BUỔI ĐÊM; BUOI DEM; BUỔI TỐI; BUOI TOI; VÀO BAN ĐÊM; VAO BAN DEM; VỀ ĐÊM; VE DEM; TỐI; TOI',
    Topic: 'Sinh học - Đời sống',
  },
  {
    Cluster: 'Cum-01',
    Type: 'ROW',
    Prompt: 'Nhóm côn trùng lớn nhất thế giới về số lượng loài (bao gồm các loài quen thuộc như bọ hung, bọ rùa, xén tóc) có đặc điểm cấu tạo chung là đôi cánh trước biến đổi thành lớp vỏ kitin dày, cứng cáp để bảo vệ đôi cánh màng mỏng dùng để bay ở bên dưới, được gọi chung là gì?',
    Answer: 'BỌ CÁNH CỨNG',
    Alternatives: 'BỌ CÁNH CỨNG; BO CANH CUNG; BỘ CÁNH CỨNG; BO CANH CUNG; CÁNH CỨNG; CANH CUNG; CÔN TRÙNG CÁNH CỨNG; CON TRUNG CANH CUNG; LOÀI BỌ CÁNH CỨNG; LOAI BO CANH CUNG',
    Topic: 'Sinh học',
  },
  {
    Cluster: 'Cum-01',
    Type: 'ROW',
    Prompt: 'Chiến dịch tình nguyện lớn của thanh niên, sinh viên Việt Nam được khởi xướng từ những năm 1990, gắn liền với hình ảnh chiếc áo xanh tình nguyện và chiếc mũ tai bèo về các vùng nông thôn, vùng sâu vùng xa để xây dựng công trình dân sinh và dạy học cho trẻ em, có tên gọi là Chiến dịch "... xanh"?',
    Answer: 'MÙA HÈ',
    Alternatives: 'MÙA HÈ; MUA HE; MÙA HÈ XANH; MUA HE XANH; CHIẾN DỊCH MÙA HÈ XANH; CHIEN DICH MUA HE XANH; MÙA HÈ TÌNH NGUYỆN; MUA HE TINH NGUYEN; HÈ; HE',
    Topic: 'Xã hội - Phong trào',
  },
  {
    Cluster: 'Cum-01',
    Type: 'CENTER',
    Prompt: 'Loài côn trùng nhỏ bé nào có khả năng phát quang sinh học lập lòe ở phần bụng vào buổi tối nhờ phản ứng oxy hóa chất luciferin để thu hút bạn tình, đồng thời gắn liền với giai thoại hiếu học của Lưỡng quốc Trạng nguyên Mạc Đĩnh Chi khi xưa từng bắt chúng bỏ vào vỏ trứng làm đèn đọc sách?',
    Answer: 'ĐOM ĐÓM',
    Alternatives: 'ĐOM ĐÓM; DOM DOM; CON ĐOM ĐÓM; CON DOM DOM; BỌ ĐOM ĐÓM; BO DOM DOM; LOÀI ĐOM ĐÓM; LOAI DOM DOM',
    Topic: 'Sinh học - Lịch sử',
  },
  {
    Cluster: 'Cum-01',
    Type: 'OBSTACLE',
    Prompt: 'Loài côn trùng nhỏ bé nào có khả năng phát quang sinh học lập lòe ở phần bụng vào buổi tối nhờ phản ứng oxy hóa chất luciferin để thu hút bạn tình, đồng thời gắn liền với giai thoại hiếu học của Lưỡng quốc Trạng nguyên Mạc Đĩnh Chi khi xưa từng bắt chúng bỏ vào vỏ trứng làm đèn đọc sách?',
    Answer: 'ĐOM ĐÓM',
    Alternatives: 'ĐOM ĐÓM; DOM DOM; CON ĐOM ĐÓM; CON DOM DOM; BỌ ĐOM ĐÓM; BO DOM DOM; LOÀI ĐOM ĐÓM; LOAI DOM DOM',
    Topic: 'Từ khóa Chướng ngại vật',
  },
];

const newWs = xlsx.utils.json_to_sheet(vcnvRows, {
  header: ['Cluster', 'Type', 'Prompt', 'Answer', 'Alternatives', 'Topic'],
});

wb.Sheets['VCNV'] = newWs;
xlsx.writeFile(wb, excelPath);

console.log('Successfully updated VCNV sheet in kho-cau-hoi-mau.xlsx!');
