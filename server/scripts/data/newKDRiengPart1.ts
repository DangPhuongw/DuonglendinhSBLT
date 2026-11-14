export interface RawMCQ {
  Prompt: string;
  Correct: string;
  Distractors: [string, string, string];
  Alternatives: string;
  Difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  Topic: string;
}

export const KD_RIENG_RAW_PART1: RawMCQ[] = [
  // --- 50 CÂU DỄ ---
  {
    Prompt: 'Ngọn núi Phú Sĩ là biểu tượng thiên nhiên nổi tiếng của quốc gia nào?',
    Correct: 'Nhật Bản',
    Distractors: ['Hàn Quốc', 'Trung Quốc', 'Mông Cổ'],
    Alternatives: 'NHẬT BẢN; NHAT BAN; JAPAN',
    Difficulty: 'Dễ',
    Topic: 'Địa lý thế giới'
  },
  {
    Prompt: 'Trong cơ thể người, chất khí nào được hít vào phổi để phục vụ cho sự sống?',
    Correct: 'Oxi',
    Distractors: ['Cacbonic', 'Nitơ', 'Hidro'],
    Alternatives: 'OXI; OXYGEN; O2',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Tác giả của bài thơ thiếu nhi nổi tiếng "Hạt gạo làng ta" là nhà thơ nào?',
    Correct: 'Trần Đăng Khoa',
    Distractors: ['Xuân Quỳnh', 'Phạm Tiến Duật', 'Định Hải'],
    Alternatives: 'TRẦN ĐĂNG KHOA; TRAN DANG KHOA',
    Difficulty: 'Dễ',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Trong tam giác đều, số đo của mỗi góc trong bằng bao nhiêu độ?',
    Correct: '60 độ',
    Distractors: ['45 độ', '90 độ', '120 độ'],
    Alternatives: '60; 60 ĐỘ; 60 DO',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Tên dòng sông gắn liền với chiến thắng Bạch Đằng lịch sử năm 938 của Ngô Quyền là gì?',
    Correct: 'Sông Bạch Đằng',
    Distractors: ['Sông Hồng', 'Sông Mã', 'Sông Lam'],
    Alternatives: 'SÔNG BẠCH ĐẰNG; SONG BACH DANG; BẠCH ĐẰNG',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Chất nào trong quả chanh tạo nên vị chua đặc trưng của nó?',
    Correct: 'Axit citric',
    Distractors: ['Axit axetic', 'Axit sunfuric', 'Axit lactic'],
    Alternatives: 'AXIT CITRIC; ACID CITRIC; CITRIC',
    Difficulty: 'Dễ',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Tốc độ truyền ánh sáng trong chân không có giá trị xấp xỉ bao nhiêu km/s?',
    Correct: '300.000 km/s',
    Distractors: ['150.000 km/s', '3.000 km/s', '30.000 km/s'],
    Alternatives: '300.000; 300000; 3.10^8 M/S',
    Difficulty: 'Dễ',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Thủ đô của nước Cộng hòa Pháp là thành phố nào?',
    Correct: 'Paris',
    Distractors: ['Lyon', 'Marseille', 'Bordeaux'],
    Alternatives: 'PARIS; PA-RI',
    Difficulty: 'Dễ',
    Topic: 'Địa lý thế giới'
  },
  {
    Prompt: 'Hệ thần kinh trung ương ở động vật có xương sống gồm não bộ và bộ phận nào?',
    Correct: 'Tủy sống',
    Distractors: ['Hạch thần kinh', 'Dây thần kinh', 'Tủy xương'],
    Alternatives: 'TỦY SỐNG; TUY SONG; SPINAL CORD',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Cầu thủ bóng đá người Argentina nào đã giành danh hiệu Quả bóng Vàng thế giới 8 lần?',
    Correct: 'Lionel Messi',
    Distractors: ['Cristiano Ronaldo', 'Neymar', 'Kylian Mbappé'],
    Alternatives: 'LIONEL MESSI; MESSI; M10',
    Difficulty: 'Dễ',
    Topic: 'Thể thao'
  },
  {
    Prompt: 'Nguyên tố hóa học nào phong phú nhất trong vỏ Trái Đất theo khối lượng?',
    Correct: 'Oxi',
    Distractors: ['Silic', 'Nhôm', 'Sắt'],
    Alternatives: 'OXI; OXYGEN; O',
    Difficulty: 'Dễ',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Trong một năm dương lịch thông thường không nhuận có tất cả bao nhiêu ngày?',
    Correct: '365 ngày',
    Distractors: ['366 ngày', '364 ngày', '360 ngày'],
    Alternatives: '365; 365 NGÀY',
    Difficulty: 'Dễ',
    Topic: 'Khoa học thường thức'
  },
  {
    Prompt: 'Tỉnh nào có diện tích đất tự nhiên lớn nhất cả nước ta hiện nay?',
    Correct: 'Nghệ An',
    Distractors: ['Thanh Hóa', 'Gia Lai', 'Sơn La'],
    Alternatives: 'NGHỆ AN; NGHE AN; TỈNH NGHỆ AN',
    Difficulty: 'Dễ',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Prompt: 'Ai là người sáng lập ra vương triều nhà Lý vào mùa thu năm 1009?',
    Correct: 'Lý Công Uẩn',
    Distractors: ['Lý Thường Kiệt', 'Lý Long Tường', 'Lý Chiêu Hoàng'],
    Alternatives: 'LÝ CÔNG UẨN; LY CONG UAN; LÝ THÁI TỔ',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Đơn vị tiền tệ chính thức được lưu hành tại Nhật Bản có tên là gì?',
    Correct: 'Yên',
    Distractors: ['Won', 'Nhân dân tệ', 'Đô la'],
    Alternatives: 'YÊN; YEN; JPY',
    Difficulty: 'Dễ',
    Topic: 'Kinh tế - Xã hội'
  },
  {
    Prompt: 'Định luật I Newton trong vật lý còn có tên gọi phổ biến khác là định luật gì?',
    Correct: 'Định luật quán tính',
    Distractors: ['Định luật bảo toàn cơ năng', 'Định luật vạn vật hấp dẫn', 'Định luật thế năng'],
    Alternatives: 'ĐỊNH LUẬT QUÁN TÍNH; QUÁN TÍNH; QUAN TINH',
    Difficulty: 'Dễ',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Quá trình thoát hơi nước ở thực vật diễn ra chủ yếu qua bộ phận nào của lá?',
    Correct: 'Khí khổng',
    Distractors: ['Gân lá', 'Lớp cutin', 'Mô giậu'],
    Alternatives: 'KHÍ KHỔNG; KHI KHONG; STOMATA',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Bức tranh nàng "Mona Lisa" lừng danh là kiệt tác hội họa của danh họa người Ý nào?',
    Correct: 'Leonardo da Vinci',
    Distractors: ['Michelangelo', 'Raphael', 'Pablo Picasso'],
    Alternatives: 'LEONARDO DA VINCI; DA VINCI; ĐA VANH-XI',
    Difficulty: 'Dễ',
    Topic: 'Nghệ thuật'
  },
  {
    Prompt: 'Hình vuông có cạnh bằng 5 cm thì chu vi của nó bằng bao nhiêu cm?',
    Correct: '20 cm',
    Distractors: ['25 cm', '15 cm', '10 cm'],
    Alternatives: '20; 20 CM; HAI MƯƠI',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Lá cờ đỏ sao vàng năm cánh lần đầu tiên xuất hiện trong cuộc khởi nghĩa nào năm 1940?',
    Correct: 'Khởi nghĩa Nam Kỳ',
    Distractors: ['Khởi nghĩa Bắc Sơn', 'Binh biến Đô Lương', 'Khởi nghĩa Ba Tơ'],
    Alternatives: 'KHỞI NGHĨA NAM KỲ; KHOI NGHIA NAM KY; NAM KỲ',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Quặng apatit ở Việt Nam tập trung trữ lượng lớn nhất tại tỉnh nào?',
    Correct: 'Lào Cai',
    Distractors: ['Yên Bái', 'Hà Giang', 'Quảng Ninh'],
    Alternatives: 'LÀO CAI; LAO CAI',
    Difficulty: 'Dễ',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Prompt: 'Chất khí nào thoát ra khi nhỏ giấm ăn vào vỏ trứng gà chứa canxi cacbonat?',
    Correct: 'Cacbon đioxit (CO2)',
    Distractors: ['Oxi (O2)', 'Hidro (H2)', 'Lưu huỳnh đioxit (SO2)'],
    Alternatives: 'CO2; CACBON DIOXIT; CACBONIC',
    Difficulty: 'Dễ',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Loài thú nào lớn nhất còn tồn tại trên Trái Đất ngày nay?',
    Correct: 'Cá voi xanh',
    Distractors: ['Voi châu Phi', 'Hà mã', 'Cá mập trắng'],
    Alternatives: 'CÁ VOI XANH; CA VOI XANH; BLUE WHALE',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Tác phẩm văn học "Tắt đèn" của nhà văn Ngô Tất Tố xoay quanh bi kịch của nhân vật nữ nào?',
    Correct: 'Chị Dậu',
    Distractors: ['Thị Nở', 'Mị', 'Chị Út Tịch'],
    Alternatives: 'CHỊ DẬU; CHI DAU',
    Difficulty: 'Dễ',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Tỉnh cực Nam của đất nước ta trên đất liền là tỉnh nào?',
    Correct: 'Cà Mau',
    Distractors: ['Bạc Liêu', 'Kiên Giang', 'Sóc Trăng'],
    Alternatives: 'CÀ MAU; CA MAU',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Dụng cụ nào dùng để đo hiệu điện thế giữa hai điểm trong một đoạn mạch điện?',
    Correct: 'Vôn kế',
    Distractors: ['Ampe kế', 'Oát kế', 'Nhiệt kế'],
    Alternatives: 'VÔN KẾ; VON KE; VOLTMETER',
    Difficulty: 'Dễ',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Số La Mã "X" biểu thị cho số tự nhiên nào trong hệ thập phân?',
    Correct: '10',
    Distractors: ['5', '50', '100'],
    Alternatives: '10; MƯỜI; SỐ 10',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Vị vua cuối cùng của chế độ phong kiến trong lịch sử Việt Nam là ai?',
    Correct: 'Bảo Đại',
    Distractors: ['Khải Định', 'Đồng Khánh', 'Duy Tân'],
    Alternatives: 'BẢO ĐẠI; BAO DAI; VUA BẢO ĐẠI',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Hành tinh nào có kích thước và khối lượng lớn nhất trong Hệ Mặt Trời của chúng ta?',
    Correct: 'Sao Mộc',
    Distractors: ['Sao Thổ', 'Sao Thiên Vương', 'Sao Hải Vương'],
    Alternatives: 'SAO MỘC; SAO MOC; JUPITER; MỘC TINH',
    Difficulty: 'Dễ',
    Topic: 'Thiên văn'
  },
  {
    Prompt: 'Trong cơ thể người, chất cặn bã trong nước tiểu chủ yếu được lọc ra từ cơ quan nào?',
    Correct: 'Thận',
    Distractors: ['Gan', 'Dạ dày', 'Phổi'],
    Alternatives: 'THẬN; THAN; KIDNEY',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Đường hầm đường bộ qua đèo Cù Mông nối liền hai tỉnh Bình Định và tỉnh nào?',
    Correct: 'Phú Yên',
    Distractors: ['Khánh Hòa', 'Quảng Ngãi', 'Gia Lai'],
    Alternatives: 'PHÚ YÊN; PHU YEN',
    Difficulty: 'Dễ',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Prompt: 'Trong tin học, một byte gồm có bao nhiêu bit?',
    Correct: '8 bit',
    Distractors: ['4 bit', '16 bit', '32 bit'],
    Alternatives: '8; 8 BIT; TÁM BIT',
    Difficulty: 'Dễ',
    Topic: 'Tin học'
  },
  {
    Prompt: 'Nguyên tố phi kim nào cần thiết cho hoạt động của tuyến giáp ở người để phòng ngừa bệnh bướu cổ?',
    Correct: 'I-ốt',
    Distractors: ['Clo', 'Flo', 'Lưu huỳnh'],
    Alternatives: 'I-ỐT; IOT; IODINE; I',
    Difficulty: 'Dễ',
    Topic: 'Hóa học - Y tế'
  },
  {
    Prompt: 'Truyền thuyết nào trong dân gian giải thích nguồn gốc của bánh chưng và bánh giầy thời Hùng Vương?',
    Correct: 'Sự tích Bánh chưng bánh giầy',
    Distractors: ['Sơn Tinh Thủy Tinh', 'Thánh Gióng', 'Con Rồng cháu Tiên'],
    Alternatives: 'SỰ TÍCH BÁNH CHƯNG BÁNH GIẦY; LANG LIÊU',
    Difficulty: 'Dễ',
    Topic: 'Văn học dân gian'
  },
  {
    Prompt: 'Hai đường thẳng vuông góc với nhau tạo thành góc có số đo bằng bao nhiêu?',
    Correct: '90 độ',
    Distractors: ['180 độ', '45 độ', '60 độ'],
    Alternatives: '90; 90 ĐỘ; GÓC VUÔNG',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Ai là người cắm lá cờ chiến thắng trên nóc hầm Đờ Cát-xtơ-ri ngày 7/5/1954?',
    Correct: 'Tạ Quốc Luật',
    Distractors: ['Bế Văn Đàn', 'Phan Đình Giót', 'Tô Vĩnh Diện'],
    Alternatives: 'TẠ QUỐC LUẬT; TA QUOC LUAT',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Trong quang phổ học, bảy sắc cầu vồng bắt đầu bằng màu đỏ và kết thúc bằng màu nào?',
    Correct: 'Màu tím',
    Distractors: ['Màu lục', 'Màu lam', 'Màu chàm'],
    Alternatives: 'MÀU TÍM; MAU TIM; TÍM',
    Difficulty: 'Dễ',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Bộ phận nào của cây làm nhiệm vụ hấp thụ nước và muối khoáng hòa tan từ đất?',
    Correct: 'Rễ cây',
    Distractors: ['Thân cây', 'Lá cây', 'Vỏ cây'],
    Alternatives: 'RỄ; RE CAY; RỄ CÂY',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Thủ đô của nước Úc (Australia) là thành phố nào?',
    Correct: 'Canberra',
    Distractors: ['Sydney', 'Melbourne', 'Brisbane'],
    Alternatives: 'CANBERRA; CAN-BE-RA',
    Difficulty: 'Dễ',
    Topic: 'Địa lý thế giới'
  },
  {
    Prompt: 'Hợp chất nào chiếm hơn 70% khối lượng cơ thể của một người trưởng thành?',
    Correct: 'Nước (H2O)',
    Distractors: ['Protein', 'Chất béo', 'Khoáng chất'],
    Alternatives: 'NƯỚC; NUOC; H2O',
    Difficulty: 'Dễ',
    Topic: 'Khoa học'
  },
  {
    Prompt: 'Ai là tác giả của tác phẩm "Hịch tướng sĩ" kêu gọi tinh thần yêu nước chống quân Nguyên Mông?',
    Correct: 'Trần Hưng Đạo',
    Distractors: ['Trần Quang Khải', 'Lý Thường Kiệt', 'Phạm Ngũ Lão'],
    Alternatives: 'TRẦN HƯNG ĐẠO; TRAN HUNG DAO; TRẦN QUỐC TUẤN',
    Difficulty: 'Dễ',
    Topic: 'Văn học lịch sử'
  },
  {
    Prompt: 'Phương tiện giao thông nào thường sử dụng đơn vị "hải lý" để đo khoảng cách hành trình?',
    Correct: 'Tàu thuyền hàng hải',
    Distractors: ['Tàu hỏa', 'Xe ô tô', 'Xe buýt'],
    Alternatives: 'TÀU THỦY; TAU THUYEN; TÀU BIỂN',
    Difficulty: 'Dễ',
    Topic: 'Khoa học kỹ thuật'
  },
  {
    Prompt: 'Số đối của số dương 25 là số nào?',
    Correct: '-25',
    Distractors: ['25', '1/25', '-1/25'],
    Alternatives: '-25; ÂM HAI MƯƠI LĂM; AM 25',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Hồ nước ngọt tự nhiên lớn nhất ở Hà Nội có diện tích mặt nước rộng nhất là hồ nào?',
    Correct: 'Hồ Tây',
    Distractors: ['Hồ Hoàn Kiếm', 'Hồ Trúc Bạch', 'Hồ Ba Mẫu'],
    Alternatives: 'HỒ TÂY; HO TAY',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Ai là nữ thi sĩ nổi tiếng với bài thơ "Bánh trôi nước" trong văn học Việt Nam?',
    Correct: 'Hồ Xuân Hương',
    Distractors: ['Đoàn Thị Điểm', 'Bà Huyện Thanh Quan', 'Anh Thơ'],
    Alternatives: 'HỒ XUÂN HƯƠNG; HO XUAN HUONG',
    Difficulty: 'Dễ',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Định luật vạn vật hấp dẫn được phát biểu rằng mọi vật trong vũ trụ đều hút nhau bằng một lực tỉ lệ thuận với tích hai đại lượng nào?',
    Correct: 'Khối lượng của hai vật',
    Distractors: ['Thể tích của hai vật', 'Vận tốc của hai vật', 'Mật độ của hai vật'],
    Alternatives: 'KHỐI LƯỢNG; KHOI LUONG',
    Difficulty: 'Dễ',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Bộ phận nào trong tai của người thu nhận sóng âm đầu tiên từ môi trường bên ngoài?',
    Correct: 'Vành tai',
    Distractors: ['Màng nhĩ', 'Ốc tai', 'Chuỗi xương tai'],
    Alternatives: 'VÀNH TAI; VANH TAI; LOA TAI',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Kim loại nào được người Việt cổ đúc nên những chiếc trống đồng Đông Sơn lẫy lừng?',
    Correct: 'Đồng',
    Distractors: ['Sắt', 'Chì', 'Kẽm'],
    Alternatives: 'ĐỒNG; DONG; COPPER; CU',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử văn hóa'
  },
  {
    Prompt: 'Dãy núi nào được coi là ranh giới khí hậu tự nhiên giữa miền Bắc và miền Nam Việt Nam?',
    Correct: 'Dãy Bạch Mã',
    Distractors: ['Dãy Hoàng Liên Sơn', 'Dãy Trường Sơn Bắc', 'Dãy Hoành Sơn'],
    Alternatives: 'DÃY BẠCH MÃ; DAY BACH MA; BẠCH MÃ',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Cầu thủ nào đoạt danh hiệu Vua phá lưới World Cup 2022 tại Qatar?',
    Correct: 'Kylian Mbappé',
    Distractors: ['Lionel Messi', 'Olivier Giroud', 'Julian Alvarez'],
    Alternatives: 'MBAPPÉ; KYLIAN MBAPPE; MBAPPE',
    Difficulty: 'Dễ',
    Topic: 'Thể thao'
  },

  // --- 25 CÂU TRUNG BÌNH ---
  {
    Prompt: 'Chất dẫn điện tốt nhất trong các dung dịch điện phân là do sự di chuyển có hướng của các hạt nào?',
    Correct: 'Cation và Anion',
    Distractors: ['Các electron tự do', 'Các phân tử trung hòa', 'Các hạt photon'],
    Alternatives: 'ION; CATION VÀ ANION; CAC ION',
    Difficulty: 'Trung bình',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Trận đánh nào được coi là bước ngoặt quyết định của Chiến tranh thế giới thứ hai ở mặt trận Xô - Đức?',
    Correct: 'Trận Stalingrad',
    Distractors: ['Trận Kursk', 'Trận Moskva', 'Trận Berlin'],
    Alternatives: 'STALINGRAD; XTALIN-GRAT; TRẬN STALINGRAD',
    Difficulty: 'Trung bình',
    Topic: 'Lịch sử thế giới'
  },
  {
    Prompt: 'Trong hình học Euclid, giao điểm của ba đường trung trực trong một tam giác là tâm của đường tròn nào?',
    Correct: 'Đường tròn ngoại tiếp',
    Distractors: ['Đường tròn nội tiếp', 'Đường tròn bàng tiếp', 'Đường tròn Euler'],
    Alternatives: 'NGOẠI TIẾP; DUONG TRON NGOAI TIEP',
    Difficulty: 'Trung bình',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Enzyme Pepsin do dạ dày tiết ra có vai trò xúc tác cho quá trình tiêu hóa chất dinh dưỡng nào?',
    Correct: 'Protein (Chất đạm)',
    Distractors: ['Lipid (Chất béo)', 'Gluxit (Tinh bột)', 'Axit nucleic'],
    Alternatives: 'PROTEIN; CHẤT ĐẠM; PROTEIN ĐẠM',
    Difficulty: 'Trung bình',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Con sông nào dài nhất lục địa Nam Mỹ và có lưu lượng dòng chảy lớn nhất thế giới?',
    Correct: 'Sông Amazon',
    Distractors: ['Sông Parana', 'Sông Orinoco', 'Sông Sao Francisco'],
    Alternatives: 'AMAZON; SÔNG AMAZON; A-MA-ZON',
    Difficulty: 'Trung bình',
    Topic: 'Địa lý thế giới'
  },
  {
    Prompt: 'Gia tốc tiếp tuyến trong chuyển động tròn biểu thị sự thay đổi về yếu tố nào của vectơ vận tốc?',
    Correct: 'Độ lớn vận tốc',
    Distractors: ['Phương vận tốc', 'Chiều quay', 'Góc quay'],
    Alternatives: 'ĐỘ LỚN; DO LON VAN TOC',
    Difficulty: 'Trung bình',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Vị vua nào của triều Trần đã chủ trì Hội nghị Bình Than năm 1282 để bàn kế sách đánh giặc Nguyên?',
    Correct: 'Trần Nhân Tông',
    Distractors: ['Trần Thái Tông', 'Trần Thánh Tông', 'Trần Anh Tông'],
    Alternatives: 'TRẦN NHÂN TÔNG; TRAN NHAN TONG',
    Difficulty: 'Trung bình',
    Topic: 'Lịch sử Việt Nam'
  },
  {
    Prompt: 'Kim loại nào có khả năng tạo thành màng oxit bền vững bảo vệ bề mặt tự nhiên chống ăn mòn trong không khí?',
    Correct: 'Nhôm (Al)',
    Distractors: ['Sắt (Fe)', 'Đồng (Cu)', 'Canxi (Ca)'],
    Alternatives: 'NHÔM; AL; ALUMINIUM',
    Difficulty: 'Trung bình',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Trong di truyền học Menđen, tỉ lệ phân ly kiểu hình ở thế hệ F2 của phép lai một cặp tính trạng trội lặn hoàn toàn là gì?',
    Correct: '3 trội : 1 lặn',
    Distractors: ['1 trội : 1 lặn', '1 : 2 : 1', '9 : 3 : 3 : 1'],
    Alternatives: '3:1; 3 TRỘI 1 LẶN',
    Difficulty: 'Trung bình',
    Topic: 'Di truyền học'
  },
  {
    Prompt: 'Nhà văn nào của Việt Nam là tác giả của truyện ngắn "Vợ nhặt" phản ánh nạn đói năm Ất Dậu 1945?',
    Correct: 'Kim Lân',
    Distractors: ['Tô Hoài', 'Nguyễn Minh Châu', 'Nam Cao'],
    Alternatives: 'KIM LÂN; KIM LAN',
    Difficulty: 'Trung bình',
    Topic: 'Văn học Việt Nam'
  },
  {
    Prompt: 'Đường tiệm cận ngang của đồ thị hàm số y = (2x - 1)/(x + 1) có phương trình là gì?',
    Correct: 'y = 2',
    Distractors: ['y = -1', 'x = -1', 'x = 2'],
    Alternatives: 'Y = 2; Y=2',
    Difficulty: 'Trung bình',
    Topic: 'Toán giải tích'
  },
  {
    Prompt: 'Tỉnh nào ở Tây Nguyên nổi tiếng với địa danh Ngã ba Đông Dương - nơi tiếng gà gáy 3 nước cùng nghe?',
    Correct: 'Kon Tum',
    Distractors: ['Gia Lai', 'Đắk Lắk', 'Đắk Nông'],
    Alternatives: 'KON TUM; TỈNH KON TUM',
    Difficulty: 'Trung bình',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Prompt: 'Lực nào đóng vai trò là lực hướng tâm giữ cho các vệ tinh nhân tạo chuyển động tròn đều quanh Trái Đất?',
    Correct: 'Lực hấp dẫn',
    Distractors: ['Lực quán tính ly tâm', 'Lực đàn hồi', 'Lực ma sát'],
    Alternatives: 'LỰC HẤP DẪN; LUC HAP DAN; TRỌNG LỰC',
    Difficulty: 'Trung bình',
    Topic: 'Vật lý thiên văn'
  },
  {
    Prompt: 'Loại liên kết hóa học chủ yếu được hình thành giữa hai nguyên tử phi kim có độ âm điện tương đương là liên kết gì?',
    Correct: 'Liên kết cộng hóa trị',
    Distractors: ['Liên kết ion', 'Liên kết kim loại', 'Liên kết hidro'],
    Alternatives: 'LIÊN KẾT CỘNG HÓA TRỊ; CỘNG HÓA TRỊ; COVALENT',
    Difficulty: 'Trung bình',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Hệ tuần hoàn hở có ở nhóm động vật nào dưới đây?',
    Correct: 'Chân khớp và Thân mềm',
    Distractors: ['Cá và Lưỡng cư', 'Bò sát và Chim', 'Động vật có vú'],
    Alternatives: 'CHÂN KHỚP; ARTHROPODA; MOLLUSCA',
    Difficulty: 'Trung bình',
    Topic: 'Sinh học động vật'
  },
  {
    Prompt: 'Tác phẩm điêu khắc cổ điển "Người suy tưởng" (Le Penseur) là sáng tác của nhà điêu khắc nổi tiếng nào?',
    Correct: 'Auguste Rodin',
    Distractors: ['Michelangelo', 'Donatello', 'Bernini'],
    Alternatives: 'RODIN; AUGUSTE RODIN; RÔ-ĐANH',
    Difficulty: 'Trung bình',
    Topic: 'Nghệ thuật'
  },
  {
    Prompt: 'Vận động viên điền kinh Usain Bolt mang quốc tịch của quốc gia nào ở vùng Caribe?',
    Correct: 'Jamaica',
    Distractors: ['Trinidad & Tobago', 'Bahamas', 'Cuba'],
    Alternatives: 'JAMAICA; GIA-MAI-CA',
    Difficulty: 'Trung bình',
    Topic: 'Thể thao'
  },
  {
    Prompt: 'Dãy kim loại kiềm trong bảng tuần hoàn hóa học thuộc nhóm nguyên tố nào?',
    Correct: 'Nhóm IA',
    Distractors: ['Nhóm IIA', 'Nhóm IB', 'Nhóm VIIA'],
    Alternatives: 'IA; NHÓM 1; NHÓM IA',
    Difficulty: 'Trung bình',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Tác phẩm văn học trung đại nào của Việt Nam được viết theo thể phú bằng chữ Hán ca ngợi cảnh sắc sông Bạch Đằng?',
    Correct: 'Bạch Đằng giang phú',
    Distractors: ['Thuật hoài', 'Phú sông Đáy', 'Hạc đình phú'],
    Alternatives: 'BẠCH ĐẰNG GIANG PHÚ; BACH DANG GIANG PHU; TRƯƠNG HÁN SIÊU',
    Difficulty: 'Trung bình',
    Topic: 'Văn học trung đại'
  },
  {
    Prompt: 'Hạt nhân nguyên tử Heli (He-4) bị bắn ra trong quá trình phân rã phóng xạ được gọi là hạt gì?',
    Correct: 'Hạt Alpha',
    Distractors: ['Hạt Beta trừ', 'Hạt Beta cộng', 'Hạt Gamma'],
    Alternatives: 'ALPHA; AN-PHA; HẠT ALPHA',
    Difficulty: 'Trung bình',
    Topic: 'Vật lý hạt nhân'
  },
  {
    Prompt: 'Thành phố nào từng là thủ đô cổ kính của nước Ý thời Phục hưng và là cái nôi nghệ thuật châu Âu?',
    Correct: 'Florence',
    Distractors: ['Milano', 'Venice', 'Napoli'],
    Alternatives: 'FLORENCE; PHLO-REN-XƠ; FIRENZE',
    Difficulty: 'Trung bình',
    Topic: 'Lịch sử - Địa lý'
  },
  {
    Prompt: 'Gen nằm trên vùng không tương đồng của nhiễm sắc thể giới tính X ở người di truyền theo quy luật nào?',
    Correct: 'Di truyền chéo',
    Distractors: ['Di truyền thẳng', 'Di truyền theo dòng mẹ', 'Phân ly độc lập'],
    Alternatives: 'DI TRUYỀN CHÉO; DI TRUYEN CHEO; LIÊN KẾT GIỚI TÍNH',
    Difficulty: 'Trung bình',
    Topic: 'Di truyền học'
  },
  {
    Prompt: 'Số giao điểm tối đa của 5 đường thẳng phân biệt cùng nằm trên một mặt phẳng là bao nhiêu?',
    Correct: '10',
    Distractors: ['15', '20', '8'],
    Alternatives: '10; MƯỜI; 10 GIAO ĐIỂM',
    Difficulty: 'Trung bình',
    Topic: 'Toán học tổ hợp'
  },
  {
    Prompt: 'Hợp chất nào làm đục nước vôi trong dư khi sục qua dung dịch?',
    Correct: 'Khí Cacbon đioxit (CO2)',
    Distractors: ['Khí Oxi (O2)', 'Khí Nitơ (N2)', 'Khí Metan (CH4)'],
    Alternatives: 'CO2; CACBON DIOXIT; SO2',
    Difficulty: 'Trung bình',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Ai là Tổng thống đầu tiên của Hợp chủng quốc Hoa Kỳ?',
    Correct: 'George Washington',
    Distractors: ['Thomas Jefferson', 'John Adams', 'Abraham Lincoln'],
    Alternatives: 'GEORGE WASHINGTON; WASHINGTON; OÁ-SHINH-TƠN',
    Difficulty: 'Trung bình',
    Topic: 'Lịch sử thế giới'
  }
];
