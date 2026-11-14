export interface TangTocItem {
  Prompt: string;
  Answer: string;
  Alternatives: string;
  Topic: string;
  Skip?: string;
  Media?: string;
}

export const NEW_TANGTOC_20: TangTocItem[] = [
  {
    Prompt: 'Cho dãy số: 1, 4, 10, 22, 46, ... Hỏi số tiếp theo trong dãy số này là số nào?',
    Answer: '94',
    Alternatives: '94; SỐ 94; CHÍN MƯƠI TƯ; CHIN MUOI TU; CHÍN TƯ; CHIN TU',
    Topic: 'Dãy số quy luật'
  },
  {
    Prompt: 'Một lớp học có 30 học sinh. Mỗi học sinh đều bắt tay một lần với tất cả các bạn còn lại trong lớp để làm quen. Hỏi có tất cả bao nhiêu cái bắt tay đã diễn ra?',
    Answer: '435',
    Alternatives: '435; 435 CÁI; 435 CAI; 435 LẦN; 435 LAN; BỐN TRĂM BA MƯƠI LĂM; BON TRAM BA MUOI LAM',
    Topic: 'Toán tổ hợp'
  },
  {
    Prompt: 'Hãy sắp xếp các sự kiện lịch sử Việt Nam sau theo thứ tự thời gian từ trước đến sau: (1) Chiến thắng Điện Biên Phủ, (2) Cách mạng Tháng Tám thành công, (3) Chiến dịch Điện Biên Phủ trên không, (4) Giải phóng miền Nam thống nhất đất nước.',
    Answer: '2, 1, 3, 4',
    Alternatives: '2, 1, 3, 4; 2-1-3-4; 2 1 3 4; (2), (1), (3), (4); 2,1,3,4; 2134',
    Topic: 'Lịch sử Việt Nam'
  },
  {
    Prompt: 'Một chiếc đồng hồ kim đang chỉ đúng 3 giờ 00 phút. Hỏi sau ít nhất bao nhiêu phút nữa thì kim phút sẽ đuổi kịp và trùng khít lên kim giờ?',
    Answer: '180/11',
    Alternatives: '180/11; 180/11 PHÚT; 180/11 PHUT; 16 4/11; 16 4/11 PHÚT; 16.36; 16,36',
    Topic: 'Chuyển động kim đồng hồ'
  },
  {
    Prompt: 'Giải mã đảo chữ cái (Anagram): Sắp xếp lại các chữ cái trong cụm từ "Ả N H B Á N H" (bỏ dấu cách) để được tên một loài cây thân gỗ thường được trồng để lấy bóng mát ở sân trường hoặc đường phố?',
    Answer: 'BẰNG LĂNG',
    Alternatives: 'BẰNG LĂNG; BANG LANG; CÂY BẰNG LĂNG; CAY BANG LANG',
    Topic: 'Đố chữ Anagram'
  },
  {
    Prompt: 'Cho ma trận 3x3 với các số ở hàng 1: [3, 5, 8], hàng 2: [4, 7, 11], hàng 3: [6, 9, ?]. Hỏi số cần điền vào vị trí dấu hỏi chấm (?) là số nào?',
    Answer: '15',
    Alternatives: '15; SỐ 15; SO 15; MƯỜI LĂM; MUOI LAM',
    Topic: 'Ma trận số'
  },
  {
    Prompt: 'Hãy sắp xếp các đại dương sau theo thứ tự diện tích từ lớn nhất đến nhỏ nhất: (1) Đại Tây Dương, (2) Thái Bình Dương, (3) Bắc Băng Dương, (4) Ấn Độ Dương.',
    Answer: '2, 1, 4, 3',
    Alternatives: '2, 1, 4, 3; 2-1-4-3; 2 1 4 3; 2,1,4,3; (2), (1), (4), (3); 2143',
    Topic: 'Địa lý thế giới'
  },
  {
    Prompt: 'Hai xe ô tô cùng xuất phát từ hai điểm A và B cách nhau 180 km, đi ngược chiều nhau trên cùng một tuyến đường thẳng. Xe thứ nhất đi với vận tốc 40 km/h, xe thứ hai đi với vận tốc 50 km/h. Hỏi sau bao nhiêu giờ kể từ lúc xuất phát thì hai xe gặp nhau?',
    Answer: '2',
    Alternatives: '2; 2 GIỜ; 2 GIO; 2H; HAI GIỜ; HAI GIO; 2 TIẾNG; 2 TIENG',
    Topic: 'Toán chuyển động'
  },
  {
    Prompt: 'Trong mật mã thay thế chuyển vị dịch 2 vị trí sang phải bảng chữ cái tiếng Anh (A->C, B->D, C->E,...), từ mã hóa nhận được là "EQRF". Hãy tìm từ gốc tiếng Anh 4 chữ cái ban đầu?',
    Answer: 'COPD',
    Alternatives: 'COPD; TỪ COPD; TU COPD',
    Topic: 'Mật mã logic'
  },
  {
    Prompt: 'Một cuốn sách được đánh số trang liên tiếp từ trang 1 đến trang 100. Hỏi người ta phải dùng tất cả bao nhiêu chữ số để đánh số trang cho cuốn sách này?',
    Answer: '192',
    Alternatives: '192; 192 CHỮ SỐ; 192 CHU SO; MỘT TRĂM CHÍN MƯƠI HAI; MOT TRAM CHIN MUOI HAI',
    Topic: 'Toán số học'
  },
  {
    Prompt: 'Hãy xác định một vị danh nhân lịch sử Việt Nam qua các gợi ý sau: (1) Quê ở làng Sen, Nam Đàn, Nghệ An; (2) Năm 1911 ra đi tìm đường cứu nước tại bến cảng Nhà Rồng; (3) Tác giả của tác phẩm "Nhật ký trong tù"; (4) Đọc bản Tuyên ngôn Độc lập ngày 2/9/1945.',
    Answer: 'HỒ CHÍ MINH',
    Alternatives: 'HỒ CHÍ MINH; HO CHI MINH; BÁC HỒ; BAC HO; CHỦ TỊCH HỒ CHÍ MINH; NGUYỄN ÁI QUỐC; NGUYEN AI QUOC',
    Topic: 'Danh nhân lịch sử'
  },
  {
    Prompt: 'Cho dãy các chữ cái viết tắt các ngày trong tuần bằng tiếng Anh: M, T, W, T, F, S, ... Hỏi chữ cái tiếp theo đại diện cho ngày Chủ Nhật là chữ cái nào?',
    Answer: 'S',
    Alternatives: 'S; CHỮ S; CHU S; SUNDAY',
    Topic: 'Quy luật chữ cái'
  },
  {
    Prompt: 'Một hình lập phương có thể tích là 64 cm³. Hỏi diện tích toàn phần của hình lập phương đó bằng bao nhiêu cm²?',
    Answer: '96',
    Alternatives: '96; 96 CM2; 96 CM^2; 96 XĂNG-TI-MÉT VUÔNG; CHÍN MƯƠI SÁU; CHIN MUOI SAU',
    Topic: 'Hình học'
  },
  {
    Prompt: 'Hãy sắp xếp các thành phố sau của Việt Nam theo thứ tự vị trí địa lý từ Bắc vào Nam: (1) Đà Nẵng, (2) Cần Thơ, (3) Hải Phòng, (4) Nha Trang.',
    Answer: '3, 1, 4, 2',
    Alternatives: '3, 1, 4, 2; 3-1-4-2; 3 1 4 2; 3,1,4,2; (3), (1), (4), (2); 3142',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Prompt: 'Năm 2023 không phải năm nhuận có 365 ngày, ngày 1 tháng 1 năm 2023 là ngày Chủ Nhật. Hỏi ngày 1 tháng 1 năm 2024 là ngày thứ mấy trong tuần?',
    Answer: 'THỨ HAI',
    Alternatives: 'THỨ HAI; THU HAI; THỨ 2; THU 2; THỨ HAI (2); THỨ HAI TRONG TUẦN',
    Topic: 'Toán lịch can chi'
  },
  {
    Prompt: 'Có 10 chiếc tất màu đen và 10 chiếc tất màu trắng để lẫn lộn trong một ngăn kéo tối. Hỏi phải lấy ra ngẫu nhiên ít nhất bao nhiêu chiếc tất để chắc chắn có được ít nhất một đôi tất cùng màu?',
    Answer: '3',
    Alternatives: '3; 3 CHIẾC; 3 CHIEC; 3 CÁI; 3 CAI; BA CHIẾC; BA CHIEC',
    Topic: 'Nguyên lý Dirichlet'
  },
  {
    Prompt: 'Ghép các chữ cái đầu của 4 nguyên tố hóa học: Bo (B), Oxy (O), Nitơ (N), Lưu huỳnh (S) theo thứ tự trên ta được một từ tiếng Anh có nghĩa là gì trong tiếng Việt (xương)?',
    Answer: 'BONES',
    Alternatives: 'BONES; XƯƠNG; XUONG; BONE',
    Topic: 'Đố chữ Hóa học'
  },
  {
    Prompt: 'Hãy sắp xếp các công trình / di sản kiến trúc sau theo thứ tự thời gian hoàn thành từ cổ nhất đến mới nhất: (1) Kim tự tháp Giza (Ai Cập), (2) Đấu trường Colosseum (Ý), (3) Tháp Eiffel (Pháp), (4) Đền Taj Mahal (Ấn Độ).',
    Answer: '1, 2, 4, 3',
    Alternatives: '1, 2, 4, 3; 1-2-4-3; 1 2 4 3; 1,2,4,3; (1), (2), (4), (3); 1243',
    Topic: 'Lịch sử kiến trúc thế giới'
  },
  {
    Prompt: 'Trong một gia đình có hai người bố và hai người con, họ cùng đi câu cá và mỗi người đều câu được đúng một con cá mang về. Hỏi có tất cả bao nhiêu con cá đã được mang về nhà (biết không con cá nào bị rơi mất)?',
    Answer: '3',
    Alternatives: '3; 3 CON; 3 CON CÁ; 3 CON CA; BA CON; BA CON CA',
    Topic: 'Đố mẹo logic'
  },
  {
    Prompt: 'Hiện nay mẹ 36 tuổi, con 8 tuổi. Hỏi sau bao nhiêu năm nữa thì tuổi mẹ gấp đúng 3 lần tuổi con?',
    Answer: '6',
    Alternatives: '6; 6 NĂM; 6 NAM; SÁU NĂM; SAU NAM; 6 TUỔI',
    Topic: 'Toán tuổi'
  }
];
