import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

function findExcelPath(): string {
  const p1 = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve('question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p2)) return p2;
  const p3 = path.resolve('../server/question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p3)) return p3;
  throw new Error('Cannot find kho-cau-hoi-mau.xlsx');
}

export const excelPath = findExcelPath();
export const wb = xlsx.readFile(excelPath);

export const NEW_TANGTOC_30 = [
  {
    Prompt: 'Cho dãy số: 2, 3, 5, 9, 17, 33, ... Hỏi số hạng tiếp theo trong dãy số này là số nào?',
    Answer: '65',
    Alternatives: '65; SỐ 65; SO 65; SÁU MƯƠI LĂM; SAU MUOI LAM; SÁU LĂM',
    Topic: 'Toán logic'
  },
  {
    Prompt: 'Một khối lập phương bằng gỗ kích thước 3 x 3 x 3 được sơn màu đỏ toàn bộ 6 mặt ngoài, sau đó cưa thành 27 khối lập phương nhỏ kích thước 1 x 1 x 1. Hỏi có tất cả bao nhiêu khối lập phương nhỏ không bị sơn màu đỏ ở bất kỳ mặt nào?',
    Answer: '1',
    Alternatives: '1; MỘT; MOT; 1 KHỐI; 1 KHOI; MỘT KHỐI; MOT KHOI',
    Topic: 'Hình học không gian'
  },
  {
    Prompt: 'Năm 2024 là năm nhuận có 366 ngày, trong đó ngày 01 tháng 01 là Thứ Hai. Hỏi ngày 31 tháng 12 năm 2024 là thứ mấy trong tuần?',
    Answer: 'THỨ BA',
    Alternatives: 'THỨ BA; THU BA; THỨ 3; THU 3; NGÀY THỨ BA; NGAY THU BA; NGÀY THỨ 3; NGAY THU 3',
    Topic: 'Logic thời gian'
  },
  {
    Prompt: 'Trong mật mã Caesar với bước dịch chuyển sang phải 3 vị trí trong bảng chữ cái tiếng Anh (A thành D, B thành E, C thành F,...), từ mã hóa nhận được là "KHOOR". Hãy giải mã để tìm từ gốc tiếng Anh ban đầu?',
    Answer: 'HELLO',
    Alternatives: 'HELLO; CHỮ HELLO; TỪ HELLO',
    Topic: 'Mật mã học'
  },
  {
    Prompt: 'Hiện nay tuổi của bố gấp 3 lần tuổi của con. Cách đây 12 năm, tuổi của bố gấp 7 lần tuổi của con khi đó. Hỏi hiện nay người con bao nhiêu tuổi?',
    Answer: '18',
    Alternatives: '18; 18 TUỔI; 18 TUOI; MƯỜI TÁM; MUOI TAM; MƯỜI TÁM TUỔI; MUOI TAM TUOI',
    Topic: 'Toán đại số'
  },
  {
    Prompt: 'Có 3 người A, B, C đứng cạnh nhau. Một người luôn nói thật, một người luôn nói dối và một người nói ngẫu nhiên. A nói: "Tôi luôn nói dối". B nói: "A đang nói dối". C nói: "Tôi là người luôn nói thật". Trong ba người, ai chắc chắn là người luôn nói dối?',
    Answer: 'C',
    Alternatives: 'C; NGƯỜI C; NGUOI C',
    Topic: 'Logic suy luận'
  },
  {
    Prompt: 'Trên một bàn cờ vua tiêu chuẩn kích thước 8 x 8 ô, hỏi số lượng ô cờ màu trắng nhiều hơn, ít hơn hay bằng số lượng ô cờ màu đen?',
    Answer: 'BẰNG NHAU',
    Alternatives: 'BẰNG NHAU; BANG NHAU; BẰNG; BANG; SỐ LƯỢNG BẰNG NHAU; SO LUONG BANG NHAU; NHƯ NHAU; NHU NHAU',
    Topic: 'Logic thể thao'
  },
  {
    Prompt: 'Một thanh đòn bẩy đồng chất nhẹ có điểm tựa ở chính giữa. Ở đầu bên trái cách điểm tựa 30 cm đặt một vật nặng 4 kg. Hỏi cần đặt một vật nặng 6 kg ở đầu bên phải cách điểm tựa bao nhiêu xentimét để thanh đòn bẩy thăng bằng?',
    Answer: '20',
    Alternatives: '20; 20 CM; 20CM; 20 XENTIMET; HAI MƯƠI; HAI MUOI; 20 CENTIMET',
    Topic: 'Vật lý ứng dụng'
  },
  {
    Prompt: 'Một người đứng cách gương phẳng thẳng đứng một khoảng 1,5 mét. Nếu người đó lùi xa gương thêm 0,5 mét nữa thì khoảng cách giữa người đó và ảnh của mình trong gương lúc này là bao nhiêu mét?',
    Answer: '4',
    Alternatives: '4; 4 M; 4M; 4 MÉT; 4 MET; BỐN; BON; BỐN MÉT; BON MET',
    Topic: 'Quang học'
  },
  {
    Prompt: 'Tung đồng thời hai con xúc xắc 6 mặt cân đối và đồng chất. Có bao nhiêu khả năng khác nhau để tổng số chấm xuất hiện trên mặt trên của hai con xúc xắc bằng đúng 7?',
    Answer: '6',
    Alternatives: '6; SÁU; SAU; 6 KHẢ NĂNG; 6 KHA NANG; 6 TRƯỜNG HỢP; 6 TRUONG HOP',
    Topic: 'Toán xác suất'
  },
  {
    Prompt: 'Cho dãy chữ cái tiếng Anh tuân theo quy luật logic: M, T, W, T, F, S, ... Hỏi chữ cái tiếp theo cần điền vào dấu ba chấm là chữ cái nào?',
    Answer: 'S',
    Alternatives: 'S; CHỮ S; CHU S',
    Topic: 'Quy luật chuỗi'
  },
  {
    Prompt: 'Một đoàn tàu hỏa dài 200 mét chạy với vận tốc không đổi 72 km/h đi qua một cây cầu. Thời gian từ lúc đầu tàu bắt đầu lên cầu đến lúc toa cuối cùng rời khỏi cầu là 30 giây. Hỏi cây cầu đó dài bao nhiêu mét?',
    Answer: '400',
    Alternatives: '400; 400 M; 400M; 400 MÉT; 400 MET; BỐN TRĂM; BON TRAM; BỐN TRĂM MÉT; BON TRAM MET',
    Topic: 'Toán chuyển động'
  },
  {
    Prompt: 'Khi cân bằng phương trình hóa học của phản ứng oxi hóa - khử giữa sắt và axit sunfuric đặc nóng theo các hệ số nguyên tối giản: a Fe + b H2SO4 (đặc, nóng) -> c Fe2(SO4)3 + d SO2 + e H2O. Hỏi giá trị của hệ số b (axit sunfuric) là bao nhiêu?',
    Answer: '6',
    Alternatives: '6; SÁU; SAU; HỆ SỐ 6; HE SO 6',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Biết rằng Việt Nam nằm trọn vẹn trong múi giờ thứ 7 (UTC+7) và London (Anh) nằm ở múi giờ gốc UTC+0. Khi đồng hồ tại thủ đô Hà Nội chỉ 03 giờ sáng ngày 01 tháng 01, thì tại London đang là mấy giờ của ngày 31 tháng 12 năm trước?',
    Answer: '20 GIỜ',
    Alternatives: '20 GIỜ; 20 GIO; 20H; 20 H; 8 GIỜ TỐI; 8 GIO TOI; 20; 8H TỐI; 8H TOI',
    Topic: 'Địa lý múi giờ'
  },
  {
    Prompt: 'Một giải bóng chuyền có 6 đội tham gia thi đấu theo thể thức vòng tròn một lượt (mỗi đội đều gặp từng đội khác đúng một lần). Hỏi ban tổ chức phải sắp xếp tất cả bao nhiêu trận đấu?',
    Answer: '15',
    Alternatives: '15; 15 TRẬN; 15 TRAN; MƯỜI LĂM; MUOI LAM; 15 TRẬN ĐẤU; 15 TRAN DAU',
    Topic: 'Toán tổ hợp'
  },
  {
    Prompt: 'Trong một mạch điện gồm 3 bóng đèn giống hệt nhau mắc nối tiếp vào nguồn điện không đổi, nếu một bóng đèn bất kỳ bị cháy tóc bóng và đứt mạch thì hai bóng đèn còn lại sẽ sáng hơn hay bị tắt hoàn toàn?',
    Answer: 'TẮT HOÀN TOÀN',
    Alternatives: 'TẮT HOÀN TOÀN; TAT HOAN TOAN; TẮT; TAT; BỊ TẮT; BI TAT; TẮT HẾT; TAT HET',
    Topic: 'Vật lý điện học'
  },
  {
    Prompt: 'Số nguyên dương 25 trong hệ thập phân (cơ số 10) khi được chuyển đổi sang hệ nhị phân (cơ số 2) sẽ được biểu diễn bởi dãy số nhị phân nào?',
    Answer: '11001',
    Alternatives: '11001; 11001B; 00011001; 110012',
    Topic: 'Tin học cơ số'
  },
  {
    Prompt: 'Trong một căn phòng có 5 người. Mỗi người đều bắt tay với tất cả những người còn lại đúng một lần. Hỏi có tổng cộng bao nhiêu cái bắt tay đã diễn ra?',
    Answer: '10',
    Alternatives: '10; 10 CÁI; 10 CAI; MƯỜI; MUOI; 10 LẦN; 10 LAN; 10 CÁI BẮT TAY; 10 CAI BAT TAY',
    Topic: 'Toán logic'
  },
  {
    Prompt: 'Cho lai hai cá thể đậu Hà Lan dị hợp tử về một cặp gen quy định tính trạng màu hạt (Aa x Aa, biết alen A quy định hạt vàng trội hoàn toàn so với alen a quy định hạt xanh). Hỏi tỉ lệ kiểu hình hạt xanh thu được ở đời con F1 là bao nhiêu phần trăm?',
    Answer: '25%',
    Alternatives: '25%; 25; 25 PHẦN TRĂM; 25 PHAN TRAM; MỘT PHẦN TƯ; MOT PHAN TU; 1/4',
    Topic: 'Sinh học di truyền'
  },
  {
    Prompt: 'Vào đúng thời điểm 03 giờ 00 phút trên một mặt đồng hồ kim tiêu chuẩn, góc nhỏ nhất tạo bởi kim giờ và kim phút có số đo bằng bao nhiêu độ?',
    Answer: '90 ĐỘ',
    Alternatives: '90 ĐỘ; 90 DO; 90; 90 DEG; CHÍN MƯƠI ĐỘ; CHIN MUOI DO',
    Topic: 'Hình học đồng hồ'
  },
  {
    Prompt: 'Xét dãy 3 cặp số: (2, 8), (3, 27), (4, 64). Theo quy luật toán học đó, nếu số đầu tiên là 5 thì số thứ hai đi cùng trong cặp sẽ là số nào?',
    Answer: '125',
    Alternatives: '125; MỘT TRĂM HAI MƯƠI LĂM; MOT TRAM HAI MUOI LAM; 125 ĐƠN VỊ',
    Topic: 'Quy luật toán học'
  },
  {
    Prompt: 'Một bể nước rỗng có 2 vòi chảy vào. Nếu chỉ mở vòi thứ nhất thì chảy đầy bể trong 2 giờ; nếu chỉ mở vòi thứ hai thì chảy đầy bể trong 3 giờ. Hỏi nếu mở đồng thời cả hai vòi cùng lúc thì bể nước sẽ đầy sau bao nhiêu phút?',
    Answer: '72 PHÚT',
    Alternatives: '72 PHÚT; 72 PHUT; 72; 72P; 1 GIỜ 12 PHÚT; 1 GIO 12 PHUT',
    Topic: 'Toán vòi nước'
  },
  {
    Prompt: 'Trong tiếng Việt và ngôn ngữ học, một từ hoặc cụm từ đọc xuôi hay đọc ngược đều có phát âm hoặc mặt chữ giống hệt nhau (ví dụ như các từ "ra đa", "bà ba", hay từ tiếng Anh "ROTATOR") được gọi là từ gì?',
    Answer: 'PALINDROME',
    Alternatives: 'PALINDROME; TỪ ĐỐI XỨNG; TU DOI XUNG; THUẬN NGHỊCH ĐỘC; THUAN NGHICH DOC; TỪ THUẬN NGHỊCH; TU THUAN NGHICH',
    Topic: 'Ngôn ngữ học'
  },
  {
    Prompt: 'Một người nhìn thấy tia chớp loé lên trên bầu trời và đúng 6 giây sau mới nghe thấy tiếng sấm rền vang. Biết vận tốc truyền âm trong không khí là 340 m/s (coi vận tốc ánh sáng truyền đi tức thời), hỏi vị trí tia sét đánh cách người quan sát bao nhiêu mét?',
    Answer: '2040',
    Alternatives: '2040; 2040 M; 2040M; 2040 MÉT; 2040 MET; 2,04 KM; 2.04 KM',
    Topic: 'Vật lý âm học'
  },
  {
    Prompt: 'Trong một cuộc thi chạy marathon, Lan vượt qua vận động viên đang chạy ở vị trí thứ hai. Hỏi ngay sau khi vượt qua, Lan đang chạy ở vị trí thứ mấy trong đoàn đua?',
    Answer: 'THỨ HAI',
    Alternatives: 'THỨ HAI; THU HAI; THỨ 2; THU 2; VỊ TRÍ THỨ 2; VI TRI THU 2; VỊ TRÍ THỨ HAI; VI TRI THU HAI; 2',
    Topic: 'Đố mẹo logic'
  },
  {
    Prompt: 'Khí metan (công thức hóa học là CH4) nhẹ hơn hay nặng hơn không khí, biết rằng khối lượng mol trung bình của không khí xấp xỉ 29 g/mol?',
    Answer: 'NHẸ HƠN',
    Alternatives: 'NHẸ HƠN; NHE HON; NHẸ; NHE; NHẸ HƠN KHÔNG KHÍ; NHE HON KHONG KHI',
    Topic: 'Hóa học chất khí'
  },
  {
    Prompt: 'Dãy số Fibonacci nổi tiếng bắt đầu bằng hai số 1: 1, 1, 2, 3, 5, 8, 13, ... Trong đó mỗi số hạng kể từ số thứ ba bằng tổng của hai số liền trước nó. Hỏi số hạng thứ 8 trong dãy số này là số nào?',
    Answer: '21',
    Alternatives: '21; SỐ 21; SO 21; HAI MƯƠI MỐT; HAI MUOI MOT',
    Topic: 'Toán học dãy số'
  },
  {
    Prompt: 'Trên bản đồ Trái Đất, kinh tuyến đối diện qua trục Trái Đất với kinh tuyến gốc 0 độ (kinh tuyến Greenwich) là kinh tuyến bao nhiêu độ?',
    Answer: '180 ĐỘ',
    Alternatives: '180 ĐỘ; 180 DO; 180; KINH TUYẾN 180 ĐỘ; KINH TUYEN 180 DO; KINH TUYẾN 180; KINH TUYEN 180',
    Topic: 'Địa lý Trái Đất'
  },
  {
    Prompt: 'Có 9 đồng tiền xu bề ngoài giống hệt nhau, trong đó có đúng 1 đồng xu giả nhẹ hơn 8 đồng xu thật còn lại. Sử dụng một chiếc cân đĩa thăng bằng (không có quả cân), hỏi số lần cân tối thiểu cần thực hiện để chắc chắn tìm ra được đồng xu giả là bao nhiêu lần?',
    Answer: '2 LẦN',
    Alternatives: '2 LẦN; 2 LAN; 2; HAI LẦN; HAI LAN; HAI; 2 LẦN CÂN; 2 LAN CAN',
    Topic: 'Toán logic kinh điển'
  },
  {
    Prompt: 'Trong công nghệ thông tin và kiến trúc máy tính, một byte tiêu chuẩn được cấu tạo từ bao nhiêu bit dữ liệu?',
    Answer: '8',
    Alternatives: '8; 8 BIT; 8 BITS; TÁM; TAM; 8 BIT DỮ LIỆU; 8 BIT DU LIEU',
    Topic: 'Khoa học máy tính'
  }
];
