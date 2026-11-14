export interface VeDichItem {
  Points: 10 | 20 | 30;
  Prompt: string;
  Answer: string;
  Alternatives: string;
  Topic: string;
}

export const NEW_VEDICH_10: VeDichItem[] = [
  {
    Points: 10,
    Prompt: 'Quốc gia nào có diện tích lãnh thổ tự nhiên lớn nhất thế giới hiện nay?',
    Answer: 'NGA',
    Alternatives: 'NGA; LIÊN BANG NGA; LIEN BANG NGA; RUSSIA; NUOC NGA',
    Topic: 'Địa lý thế giới'
  },
  {
    Points: 10,
    Prompt: 'Hành tinh nào trong Hệ Mặt Trời được mệnh danh là "Hành tinh Đỏ"?',
    Answer: 'SAO HỎA',
    Alternatives: 'SAO HỎA; SAO HOA; HỎA TINH; HOA TINH; MARS',
    Topic: 'Thiên văn học'
  },
  {
    Points: 10,
    Prompt: 'Kim loại nào dẫn điện và dẫn nhiệt tốt nhất trong tất cả các kim loại ở điều kiện tiêu chuẩn?',
    Answer: 'BẠC',
    Alternatives: 'BẠC; BAC; AG; SILVER',
    Topic: 'Hóa học'
  },
  {
    Points: 10,
    Prompt: 'Ai là tác giả của tập truyện ngắn nổi tiếng "Vang bóng một thời"?',
    Answer: 'NGUYỄN TUÂN',
    Alternatives: 'NGUYỄN TUÂN; NGUYEN TUAN',
    Topic: 'Văn học Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Đơn vị đo cường độ dòng điện trong hệ đơn vị đo lường quốc tế (SI) là gì?',
    Answer: 'AMPE',
    Alternatives: 'AMPE; AMPERE; A',
    Topic: 'Vật lý'
  },
  {
    Points: 10,
    Prompt: 'Cây cầu dây văng đầu tiên bắc qua sông Tiền nối liền hai tỉnh Tiền Giang và Vĩnh Long có tên là gì?',
    Answer: 'CẦU MỸ THUẬN',
    Alternatives: 'CẦU MỸ THUẬN; CAU MY THUAN; MỸ THUẬN; MY THUAN',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam hiện nay là thành phố nào?',
    Answer: 'HÀ NỘI',
    Alternatives: 'HÀ NỘI; HA NOI; THÀNH PHỐ HÀ NỘI; THANH PHO HA NOI',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Trong cơ thể người, cơ quan nội tạng nào có nhiệm vụ chính là bơm và lưu thông máu qua hệ mạch?',
    Answer: 'TIM',
    Alternatives: 'TIM; TRÁI TIM; TRAI TIM; QUẢ TIM; QUA TIM; HEART',
    Topic: 'Sinh học'
  },
  {
    Points: 10,
    Prompt: 'Trong tam giác vuông, cạnh đối diện với góc vuông được gọi là gì?',
    Answer: 'CẠNH HUYỀN',
    Alternatives: 'CẠNH HUYỀN; CANH HUYEN; HUYỀN',
    Topic: 'Toán học'
  },
  {
    Points: 10,
    Prompt: 'Vị vua nào của triều Nguyễn đã ban Chiếu Cần Vương kêu gọi nhân dân đứng lên giúp vua cứu nước năm 1885?',
    Answer: 'HÀM NGHI',
    Alternatives: 'HÀM NGHI; HAM NGHI; VUA HÀM NGHI; VUA HAM NGHI',
    Topic: 'Lịch sử Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Chất khí nào chiếm thể tích lớn nhất trong thành phần của không khí xung quanh chúng ta?',
    Answer: 'NITƠ',
    Alternatives: 'NITƠ; NITO; NITROGEN; N2',
    Topic: 'Hóa học'
  },
  {
    Points: 10,
    Prompt: 'Đỉnh núi nào được mệnh danh là "nóc nhà của Đông Dương"?',
    Answer: 'FANSIPAN',
    Alternatives: 'FANSIPAN; PHAN XI PĂNG; PHANXIPANG; PHAN SI PANG',
    Topic: 'Địa lý'
  },
  {
    Points: 10,
    Prompt: 'Tác phẩm "Bình Ngô đại cáo" được sáng tác sau chiến thắng chống lại quân xâm lược nào phương Bắc?',
    Answer: 'QUÂN MINH',
    Alternatives: 'QUÂN MINH; QUAN MINH; NHÀ MINH; NHA MINH; GIẶC MINH; GIAC MINH',
    Topic: 'Lịch sử - Văn học'
  },
  {
    Points: 10,
    Prompt: 'Trong âm nhạc, nốt nhạc đứng liền sau nốt Sol trên khuông nhạc có tên là gì?',
    Answer: 'LA',
    Alternatives: 'LA; NỐT LA; NOT LA',
    Topic: 'Âm nhạc'
  },
  {
    Points: 10,
    Prompt: 'Hiện tượng khúc xạ ánh sáng là hiện tượng tia sáng bị đổi hướng khi đi qua mặt phân cách giữa mấy môi trường trong suốt khác nhau?',
    Answer: 'HAI',
    Alternatives: 'HAI; 2; 2 MÔI TRƯỜNG; HAI MOI TRUONG',
    Topic: 'Vật lý'
  },
  {
    Points: 10,
    Prompt: 'Chất sắc tố màu xanh lục giúp thực vật hấp thụ ánh sáng mặt trời để thực hiện quá trình quang hợp gọi là gì?',
    Answer: 'DIỆP LỤC',
    Alternatives: 'DIỆP LỤC; DIEP LUC; CHẤT DIỆP LỤC; CLOROPHILE; CHLOROPHYLL',
    Topic: 'Sinh học'
  },
  {
    Points: 10,
    Prompt: 'Thành phố nào là thành phố trực thuộc Trung ương có diện tích nhỏ nhất của Việt Nam?',
    Answer: 'ĐÀ NẴNG',
    Alternatives: 'ĐÀ NẴNG; DA NANG; THÀNH PHỐ ĐÀ NẴNG; TP ĐÀ NẴNG',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Nhạc sĩ nào là tác giả của ca khúc bất hủ "Tiến quân ca" - Quốc ca nước Cộng hòa Xã hội Chủ nghĩa Việt Nam?',
    Answer: 'VĂN CAO',
    Alternatives: 'VĂN CAO; VAN CAO; NHẠC SĨ VĂN CAO',
    Topic: 'Âm nhạc'
  },
  {
    Points: 10,
    Prompt: 'Số nguyên tố chẵn duy nhất trong tập hợp các số tự nhiên là số nào?',
    Answer: '2',
    Alternatives: '2; SỐ 2; SO 2; HAI',
    Topic: 'Toán học'
  },
  {
    Points: 10,
    Prompt: 'Chiến thắng Bạch Đằng năm 938 do vị anh hùng dân tộc nào lãnh đạo đã chấm dứt hơn 1000 năm Bắc thuộc?',
    Answer: 'NGÔ QUYỀN',
    Alternatives: 'NGÔ QUYỀN; NGO QUYEN',
    Topic: 'Lịch sử Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Nước đóng băng (chuyển sang thể rắn) ở bao nhiêu độ C tại điều kiện áp suất khí quyển tiêu chuẩn?',
    Answer: '0 ĐỘ C',
    Alternatives: '0; 0 ĐỘ; 0 DO; 0 DO C; 0 DEGREE; KHÔNG ĐỘ; KHONG DO',
    Topic: 'Vật lý'
  },
  {
    Points: 10,
    Prompt: 'Nhà văn Đan Mạch nào nổi tiếng thế giới với những câu chuyện cổ tích như "Nàng tiên cá", "Vịt con xấu xí"?',
    Answer: 'ANDERSEN',
    Alternatives: 'ANDERSEN; AN-ĐÉC-XEN; HANS CHRISTIAN ANDERSEN',
    Topic: 'Văn học thế giới'
  },
  {
    Points: 10,
    Prompt: 'Đại dương nào có diện tích nhỏ nhất và độ sâu trung bình nông nhất trên Trái Đất?',
    Answer: 'BẮC BĂNG DƯƠNG',
    Alternatives: 'BẮC BĂNG DƯƠNG; BAC BANG DUONG; ARCTIC OCEAN',
    Topic: 'Địa lý thế giới'
  },
  {
    Points: 10,
    Prompt: 'Tế bào máu nào đóng vai trò chính trong việc vận chuyển oxy từ phổi đến các mô trong cơ thể?',
    Answer: 'HỒNG CẦU',
    Alternatives: 'HỒNG CẦU; HONG CAU; TẾ BÀO HỒNG CẦU; ERYTHROCYTE',
    Topic: 'Sinh học'
  },
  {
    Points: 10,
    Prompt: 'Số đối của số -15 trong toán học là số nào?',
    Answer: '15',
    Alternatives: '15; SỐ 15; +15; MƯỜI LĂM; MUOI LAM',
    Topic: 'Toán học'
  },
  {
    Points: 10,
    Prompt: 'Thành phố Cảng lớn nhất ở khu vực miền Bắc Việt Nam là thành phố nào?',
    Answer: 'HẢI PHÒNG',
    Alternatives: 'HẢI PHÒNG; HAI PHONG; THÀNH PHỐ HẢI PHÒNG',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Nguyên tố hóa học nào có ký hiệu là Fe trong bảng tuần hoàn Mendeleev?',
    Answer: 'SẮT',
    Alternatives: 'SẮT; SAT; IRON',
    Topic: 'Hóa học'
  },
  {
    Points: 10,
    Prompt: 'Năm 1010, vị vua nào đã dời đô từ Hoa Lư về thành Đại La và đổi tên thành Thăng Long?',
    Answer: 'LÝ THÁI TỔ',
    Alternatives: 'LÝ THÁI TỔ; LY THAI TO; LÝ CÔNG UẨN; LY CONG UAN',
    Topic: 'Lịch sử Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Trong chuyển động cơ học, quãng đường đi được bằng vận tốc nhân với đại lượng nào?',
    Answer: 'THỜI GIAN',
    Alternatives: 'THỜI GIAN; THOI GIAN; T',
    Topic: 'Vật lý'
  },
  {
    Points: 10,
    Prompt: 'Bộ phận nào của hoa thường có màu sắc sặc sỡ và hương thơm để thu hút côn trùng thụ phấn?',
    Answer: 'CÁNH HOA',
    Alternatives: 'CÁNH HOA; CANH HOA; TRÀNG HOA; TRANG HOA',
    Topic: 'Sinh học'
  },
  {
    Points: 10,
    Prompt: 'Hồ nước ngọt tự nhiên lớn nhất ở vùng núi phía Bắc Việt Nam nằm tại tỉnh Bắc Kạn có tên là gì?',
    Answer: 'HỒ BA BỂ',
    Alternatives: 'HỒ BA BỂ; HO BA BE; BA BỂ; BA BE',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Giải thưởng cao quý nhất trong lĩnh vực điện ảnh được Viện Hàn lâm Khoa học và Nghệ thuật Điện ảnh Hoa Kỳ trao hàng năm có tên gọi quen thuộc là gì?',
    Answer: 'OSCAR',
    Alternatives: 'OSCAR; GIẢI OSCAR; OSCARS; ACADEMY AWARD',
    Topic: 'Điện ảnh'
  },
  {
    Points: 10,
    Prompt: 'Một hình tròn có bán kính r thì công thức tính đường kính của nó theo r là gì?',
    Answer: '2R',
    Alternatives: '2R; 2*R; 2.R; HAI R; GẤP ĐÔI BÁN KÍNH; 2 LẦN BÁN KÍNH',
    Topic: 'Toán học'
  },
  {
    Points: 10,
    Prompt: 'Ai là nữ tướng đầu tiên của Quân đội Nhân dân Việt Nam, còn gắn liền với phong trào "Đội quân tóc dài" Bến Tre?',
    Answer: 'NGUYỄN THỊ ĐỊNH',
    Alternatives: 'NGUYỄN THỊ ĐỊNH; NGUYEN THI DINH',
    Topic: 'Lịch sử Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Loại vitamin nào được tổng hợp tự nhiên ở da người khi tiếp xúc với tia tử ngoại trong ánh nắng mặt trời buổi sớm?',
    Answer: 'VITAMIN D',
    Alternatives: 'VITAMIN D; D; VITAMIN-D',
    Topic: 'Y học - Đời sống'
  },
  {
    Points: 10,
    Prompt: 'Hợp chất nào làm quỳ tím chuyển sang màu đỏ trong dung dịch nước?',
    Answer: 'AXIT',
    Alternatives: 'AXIT; ACID; DUNG DỊCH AXIT; CHẤT AXIT',
    Topic: 'Hóa học'
  },
  {
    Points: 10,
    Prompt: 'Eo biển hẹp nào ngăn cách giữa lục địa châu Á và lục địa Bắc Mỹ?',
    Answer: 'EO BIỂN BERING',
    Alternatives: 'EO BIỂN BERING; BERING; EO BERING; BE-RING',
    Topic: 'Địa lý thế giới'
  },
  {
    Points: 10,
    Prompt: 'Nhà thơ nào được mệnh danh là "Thi tiên" trong nền văn học cổ điển thời nhà Đường của Trung Quốc?',
    Answer: 'LÝ BẠCH',
    Alternatives: 'LÝ BẠCH; LY BACH; LI BAI',
    Topic: 'Văn học thế giới'
  },
  {
    Points: 10,
    Prompt: 'Đơn vị đo tần số trong hệ đo lường quốc tế (SI) là gì?',
    Answer: 'HERTZ',
    Alternatives: 'HERTZ; HÉC; HZ; HEC',
    Topic: 'Vật lý'
  },
  {
    Points: 10,
    Prompt: 'Bào quan nào trong tế bào thực vật chứa chất diệp lục và là nơi diễn ra phản ứng quang hợp?',
    Answer: 'LỤC LẠP',
    Alternatives: 'LỤC LẠP; LUC LAP; CHLOROPLAST',
    Topic: 'Sinh học'
  },
  {
    Points: 10,
    Prompt: 'Đường xích đạo chia Trái Đất thành hai bán cầu nào?',
    Answer: 'BẮC VÀ NAM',
    Alternatives: 'BẮC VÀ NAM; BAC VA NAM; BẮC BÁN CẦU VÀ NAM BÁN CẦU; BẮC, NAM; NAM VÀ BẮC',
    Topic: 'Địa lý'
  },
  {
    Points: 10,
    Prompt: 'Lễ hội Đền Hùng được tổ chức vào ngày mùng 10 tháng mấy theo âm lịch hàng năm?',
    Answer: 'THÁNG 3',
    Alternatives: 'THÁNG 3; THANG 3; THÁNG BA; THANG BA; 3; BA',
    Topic: 'Văn hóa Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Trong toán học, tích của một số với số nghịch đảo của nó luôn bằng bao nhiêu?',
    Answer: '1',
    Alternatives: '1; MỘT; MOT; SỐ 1',
    Topic: 'Toán học'
  },
  {
    Points: 10,
    Prompt: 'Tên con sông nào dài nhất chảy hoàn toàn trong lãnh thổ Việt Nam và gắn liền với nền văn minh sông Hồng?',
    Answer: 'SÔNG HỒNG',
    Alternatives: 'SÔNG HỒNG; SONG HONG; HỒNG HÀ; SÔNG THAO',
    Topic: 'Địa lý Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Nhà vật lý người Đức nào đã phát minh ra tia X vào năm 1895 và đoạt giải Nobel Vật lý đầu tiên trong lịch sử năm 1901?',
    Answer: 'ROENTGEN',
    Alternatives: 'ROENTGEN; RÖNTGEN; RƠN-GHEN; WILHELM ROENTGEN',
    Topic: 'Vật lý - Lịch sử khoa học'
  },
  {
    Points: 10,
    Prompt: 'Nhóm động vật nào là động vật có xương sống biến nhiệt đầu tiên sống được cả trên cạn và dưới nước?',
    Answer: 'LƯỠNG CƯ',
    Alternatives: 'LƯỠNG CƯ; LUONG CU; LỚP LƯỠNG CƯ; AMPHIBIA',
    Topic: 'Sinh học'
  },
  {
    Points: 10,
    Prompt: 'Kim loại nào có nhiệt độ nóng chảy thấp nhất và tồn tại ở thể lỏng ngay tại nhiệt độ phòng?',
    Answer: 'THỦY NGÂN',
    Alternatives: 'THỦY NGÂN; THUY NGAN; HG; MERCURY',
    Topic: 'Hóa học'
  },
  {
    Points: 10,
    Prompt: 'Nhân vật lão Hạc trong truyện ngắn cùng tên của nhà văn Nam Cao đã nuôi con vật cưng tên là gì?',
    Answer: 'CẬU VÀNG',
    Alternatives: 'CẬU VÀNG; CAU VANG; CHÓ VÀNG; CON CHÓ VÀNG; VÀNG',
    Topic: 'Văn học Việt Nam'
  },
  {
    Points: 10,
    Prompt: 'Nước Việt Nam nằm trong múi giờ thứ mấy theo giờ phối hợp quốc tế (UTC)?',
    Answer: 'MÚI GIỜ SỐ 7',
    Alternatives: '7; MÚI GIỜ 7; MUI GIO 7; UTC+7; GMT+7; MÚI GIỜ THỨ 7; BẢY',
    Topic: 'Địa lý'
  },
  {
    Points: 10,
    Prompt: 'Tác giả của định luật Vạn vật hấp dẫn và 3 định luật chuyển động cơ học kinh điển là nhà khoa học nào?',
    Answer: 'ISAAC NEWTON',
    Alternatives: 'NEWTON; NIU-TƠN; ISAAC NEWTON; NIUTON',
    Topic: 'Vật lý'
  }
];
