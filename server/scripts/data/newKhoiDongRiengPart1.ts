export interface KDQ {
  Prompt: string;
  OptionA: string;
  OptionB: string;
  OptionC: string;
  OptionD: string;
  Answer: 'A' | 'B' | 'C' | 'D';
  Alternatives: string;
  Difficulty: 'Dễ' | 'Trung bình';
  Topic: string;
}

export const KD_RIENG_PART1: KDQ[] = [
  // ================= 50 CÂU DỄ (PART 1) =================
  {
    Prompt: 'Ai là tác giả của tác phẩm "Tuyên ngôn Độc lập" khai sinh ra nước Việt Nam Dân chủ Cộng hòa ngày 2 tháng 9 năm 1945?',
    OptionA: 'Phan Bội Châu',
    OptionB: 'Võ Nguyên Giáp',
    OptionC: 'Hồ Chí Minh',
    OptionD: 'Huỳnh Thúc Kháng',
    Answer: 'C',
    Alternatives: 'HỒ CHÍ MINH; HO CHI MINH; BÁC HỒ; BAC HO; CHỦ TỊCH HỒ CHÍ MINH',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Hiện tượng nhật thực xảy ra khi Mặt Trăng che khuất Mặt Trời đối với người quan sát trên Trái Đất thường diễn ra vào ban ngày hay ban đêm?',
    OptionA: 'Ban ngày',
    OptionB: 'Ban đêm',
    OptionC: 'Lúc nửa đêm',
    OptionD: 'Lúc chạng vạng',
    Answer: 'A',
    Alternatives: 'BAN NGÀY; BAN NGAY; NGÀY; NGAY',
    Difficulty: 'Dễ',
    Topic: 'Thiên văn'
  },
  {
    Prompt: 'Tỉnh nào sau đây ở miền Tây Nam Bộ nổi tiếng với làng hoa kiểng Sa Đéc và khu bảo tồn chim Tràm Chim?',
    OptionA: 'An Giang',
    OptionB: 'Tiền Giang',
    OptionC: 'Bến Tre',
    OptionD: 'Đồng Tháp',
    Answer: 'D',
    Alternatives: 'ĐỒNG THÁP; DONG THAP; TỈNH ĐỒNG THÁP',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Khí nào sau đây thoát ra khi cho kim loại kẽm (Zn) tác dụng với dung dịch axit clohiđric (HCl) loãng?',
    OptionA: 'Khí Clo (Cl2)',
    OptionB: 'Khí Hiđro (H2)',
    OptionC: 'Khí Oxy (O2)',
    OptionD: 'Khí Nitơ (N2)',
    Answer: 'B',
    Alternatives: 'KHÍ HIĐRO; KHI HIDRO; H2; HIĐRO; HYDROGEN',
    Difficulty: 'Dễ',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Trong bài thơ "Đất nước" trích trường ca "Mặt đường khát vọng", tác giả Nguyễn Khoa Điềm viết: "Đất Nước bắt đầu với miếng trầu bây giờ bà ăn / Đất Nước lớn lên khi dân mình biết trồng tre mà..." làm gì?',
    OptionA: 'Làm nhà',
    OptionB: 'Dệt vải',
    OptionC: 'Đánh giặc',
    OptionD: 'Chẻ lạt',
    Answer: 'C',
    Alternatives: 'ĐÁNH GIẶC; DANH GIAC; TRỒNG TRE ĐÁNH GIẶC',
    Difficulty: 'Dễ',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Bào quan nào trong tế bào thực vật chứa chất diệp lục và là nơi diễn ra quá trình quang hợp?',
    OptionA: 'Lục lạp',
    OptionB: 'Ti thể',
    OptionC: 'Nhân tế bào',
    OptionD: 'Bộ máy Golgi',
    Answer: 'A',
    Alternatives: 'LỤC LẠP; LUC LAP; CHLOROPLAST',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Một số tự nhiên có chữ số tận cùng là 0 hoặc 5 thì luôn chia hết cho số nguyên dương nào sau đây?',
    OptionA: '2',
    OptionB: '5',
    OptionC: '3',
    OptionD: '9',
    Answer: 'B',
    Alternatives: '5; SỐ 5; SO 5; NĂM; NAM',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Eo biển hẹp nào nối liền giữa bán đảo Mã Lai và đảo Sumatra, là tuyến hàng hải huyết mạch nhộn nhịp bậc nhất châu Á?',
    OptionA: 'Eo biển Bosphorus',
    OptionB: 'Eo biển Bering',
    OptionC: 'Eo biển Hormuz',
    OptionD: 'Eo biển Malacca',
    Answer: 'D',
    Alternatives: 'EO BIỂN MALACCA; MALACCA; MA-LAC-CA',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Chất vôi sống được dùng phổ biến trong xây dựng và khử chua đất trồng trọt có công thức hóa học là gì?',
    OptionA: 'CaO (Canxi oxit)',
    OptionB: 'CaCO3',
    OptionC: 'Ca(OH)2',
    OptionD: 'CaCl2',
    Answer: 'A',
    Alternatives: 'CAO; CANXI OXIT; VÔI SỐNG; VOI SONG',
    Difficulty: 'Dễ',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Ai là vị vua đầu tiên sáng lập nên triều đại nhà Đinh trong lịch sử phong kiến Việt Nam sau khi dẹp loạn 12 sứ quân?',
    OptionA: 'Đinh Liễn',
    OptionB: 'Đinh Bộ Lĩnh',
    OptionC: 'Đinh Điền',
    OptionD: 'Đinh Toàn',
    Answer: 'B',
    Alternatives: 'ĐINH BỘ LĨNH; DINH BO LINH; ĐINH TIÊN HOÀNG; DINH TIEN HOANG',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Nhóm 7 ngôi sao sáng trên bầu trời phương Bắc xếp thành hình chiếc gàu sòng trong chòm sao Đại Hùng được dân gian gọi là gì?',
    OptionA: 'Chòm sao Thần Nông',
    OptionB: 'Chòm sao Lạp Hộ',
    OptionC: 'Chòm sao Bắc Đẩu',
    OptionD: 'Chòm sao Thiên Lang',
    Answer: 'C',
    Alternatives: 'CHÒM SAO BẮC ĐẨU; BAC DAU; BẮC ĐẨU; SAO BẮC ĐẨU',
    Difficulty: 'Dễ',
    Topic: 'Thiên văn'
  },
  {
    Prompt: 'Tác phẩm văn học dân gian nào kể về tình anh em ruột thịt và lòng chung thủy vợ chồng, giải thích nguồn gốc tục ăn trầu của người Việt?',
    OptionA: 'Sự tích cây vú sữa',
    OptionB: 'Sự tích trầu cau',
    OptionC: 'Sự tích quả dưa hấu',
    OptionD: 'Sự tích bánh chưng bánh giầy',
    Answer: 'B',
    Alternatives: 'SỰ TÍCH TRẦU CAU; SU TICH TRAU CAU; TRẦU CAU; TRAU CAU',
    Difficulty: 'Dễ',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Vận động viên điền kinh Usain Bolt mang quốc tịch của quốc gia nào?',
    OptionA: 'Jamaica',
    OptionB: 'Hoa Kỳ',
    OptionC: 'Kenya',
    OptionD: 'Nigeria',
    Answer: 'A',
    Alternatives: 'JAMAICA; GIA-MAI-CA',
    Difficulty: 'Dễ',
    Topic: 'Thể thao'
  },
  {
    Prompt: 'Hệ điều hành máy tính Windows nổi tiếng là sản phẩm của tập đoàn công nghệ nào?',
    OptionA: 'Apple',
    OptionB: 'Google',
    OptionC: 'IBM',
    OptionD: 'Microsoft',
    Answer: 'D',
    Alternatives: 'MICROSOFT; TẬP ĐOÀN MICROSOFT',
    Difficulty: 'Dễ',
    Topic: 'Tin học'
  },
  {
    Prompt: 'Loài động vật nào sau đây là động vật có vú (lớp Thú) nhưng sống hoàn toàn ở đại dương?',
    OptionA: 'Cá mập trắng',
    OptionB: 'Cá voi xanh',
    OptionC: 'Cá hồi',
    OptionD: 'Cá ngừ đại dương',
    Answer: 'B',
    Alternatives: 'CÁ VOI XANH; CA VOI XANH; CÁ VOI; CA VOI',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Dãy núi dài nhất thế giới trên đất liền chạy dọc theo bờ biển phía Tây của lục địa Nam Mỹ có tên là gì?',
    OptionA: 'Dãy Alps',
    OptionB: 'Dãy Himalaya',
    OptionC: 'Dãy Andes',
    OptionD: 'Dãy Rocky',
    Answer: 'C',
    Alternatives: 'DÃY ANDES; DAY ANDES; ANDES',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Chiến thắng Bạch Đằng năm 938 đánh tan quân Nam Hán gắn liền với tên tuổi của vị anh hùng dân tộc nào?',
    OptionA: 'Ngô Quyền',
    OptionB: 'Lê Hoàn',
    OptionC: 'Trần Hưng Đạo',
    OptionD: 'Lý Thường Kiệt',
    Answer: 'A',
    Alternatives: 'NGÔ QUYỀN; NGO QUYEN; TIỀN NGÔ VƯƠNG',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Tập hợp các số tự nhiên lớn hơn 0 thường được ký hiệu bằng chữ cái in hoa nào kèm theo dấu sao (*)?',
    OptionA: 'Z*',
    OptionB: 'Q*',
    OptionC: 'R*',
    OptionD: 'N*',
    Answer: 'D',
    Alternatives: 'N*; N SAO; N',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Khí cacbon monooxit (CO) là một loại khí cực kỳ độc hại vì nó liên kết rất chặt chẽ với chất nào trong hồng cầu, ngăn cản vận chuyển oxy?',
    OptionA: 'Hemoglobin',
    OptionB: 'Canxi',
    OptionC: 'Albumin',
    OptionD: 'Insulin',
    Answer: 'A',
    Alternatives: 'HEMOGLOBIN; HUYẾT SẮC TỐ; HUYET SAC TO; HB',
    Difficulty: 'Dễ',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Trong bài hát "Tiến quân ca" của nhạc sĩ Văn Cao, câu hát mở đầu là gì?',
    OptionA: 'Đoàn quân Việt Nam đi / Chung lòng cứu quốc',
    OptionB: 'Vì nhân dân quên mình / Vì nhân dân hy sinh',
    OptionC: 'Cùng nhau đi hồng binh / Đồng tâm ta đều bước',
    OptionD: 'Lên đàng cùng đoàn ta bước trên đường dài',
    Answer: 'A',
    Alternatives: 'ĐOÀN QUÂN VIỆT NAM ĐI; DOAN QUAN VIET NAM DI',
    Difficulty: 'Dễ',
    Topic: 'Âm nhạc'
  },
  {
    Prompt: 'Thành phố nào là trung tâm kinh tế lớn nhất ở vùng đồng bằng sông Cửu Long, được mệnh danh là thủ phủ Tây Đô?',
    OptionA: 'Mỹ Tho',
    OptionB: 'Cần Thơ',
    OptionC: 'Cà Mau',
    OptionD: 'Rạch Giá',
    Answer: 'B',
    Alternatives: 'CẦN THƠ; CAN THO; TP CẦN THƠ; THANH PHO CAN THO',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Giai điệu của bản sonata số 14 cung Đô thăng thứ của nhà soạn nhạc vĩ đại Beethoven thường được biết đến với tên gọi phổ biến nào?',
    OptionA: 'Bản giao hưởng Định mệnh',
    OptionB: 'Bản sonata Ánh trăng',
    OptionC: 'Khúc ca Đồng quê',
    OptionD: 'Khúc ca Khải hoàn',
    Answer: 'B',
    Alternatives: 'BẢN SONATA ÁNH TRĂNG; ANH TRANG; ÁNH TRĂNG; MOONLIGHT SONATA',
    Difficulty: 'Dễ',
    Topic: 'Âm nhạc'
  },
  {
    Prompt: 'Loài bò sát nào nổi tiếng với khả năng đổi màu sắc cơ thể linh hoạt để ngụy trang và có chiếc lưỡi dài phóng dính con mồi?',
    OptionA: 'Thằn lằn',
    OptionB: 'Kỳ đà',
    OptionC: 'Tắc kè hoa',
    OptionD: 'Cá sấu',
    Answer: 'C',
    Alternatives: 'TẮC KÈ HOA; TAC KE HOA; CHAMELEON; TẮC KÈ',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Tác phẩm truyện ngắn "Làng" với nhân vật chính là ông Hai tha thiết yêu làng Chợ Dầu và yêu kháng chiến là của nhà văn nào?',
    OptionA: 'Kim Lân',
    OptionB: 'Nam Cao',
    OptionC: 'Tô Hoài',
    OptionD: 'Nguyễn Thành Long',
    Answer: 'A',
    Alternatives: 'KIM LÂN; KIM LAN; NHÀ VĂN KIM LÂN',
    Difficulty: 'Dễ',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Trong quang phổ ánh sáng nhìn thấy, màu sắc nào nằm ở vị trí chính giữa giữa màu vàng và màu lam?',
    OptionA: 'Màu đỏ',
    OptionB: 'Màu da cam',
    OptionC: 'Màu tím',
    OptionD: 'Màu lục (xanh lá cây)',
    Answer: 'D',
    Alternatives: 'MÀU LỤC; MAU LUC; MÀU XANH LÁ; XANH LÁ CÂY; LỤC; GREEN',
    Difficulty: 'Dễ',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Đại lượng vật lý đặc trưng cho mức độ nhanh hay chậm của một chuyển động được gọi là gì?',
    OptionA: 'Quãng đường',
    OptionB: 'Vận tốc (hoặc tốc độ)',
    OptionC: 'Gia tốc',
    OptionD: 'Thời gian',
    Answer: 'B',
    Alternatives: 'VẬN TỐC; VAN TOC; TỐC ĐỘ; TOC DO',
    Difficulty: 'Dễ',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Hòn đảo nào ở Bắc Đại Tây Dương là hòn đảo có diện tích tự nhiên lớn nhất thế giới hiện nay?',
    OptionA: 'Đảo Madagascar',
    OptionB: 'Đảo Borneo',
    OptionC: 'Đảo Greenland',
    OptionD: 'Đảo New Guinea',
    Answer: 'C',
    Alternatives: 'GREENLAND; ĐẢO GREENLAND; DAO GREENLAND',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Cây lúa nước thuộc nhóm thực vật có một lá mầm hay hai lá mầm?',
    OptionA: 'Một lá mầm',
    OptionB: 'Hai lá mầm',
    OptionC: 'Ba lá mầm',
    OptionD: 'Không có lá mầm',
    Answer: 'A',
    Alternatives: 'MỘT LÁ MẦM; MOT LA MAM; 1 LÁ MẦM; 1 LA MAM',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Trong tiếng Anh, từ nào dùng để chỉ người làm nghề dạy học (thầy giáo, cô giáo)?',
    OptionA: 'Doctor',
    OptionB: 'Engineer',
    OptionC: 'Farmer',
    OptionD: 'Teacher',
    Answer: 'D',
    Alternatives: 'TEACHER; TỪ TEACHER',
    Difficulty: 'Dễ',
    Topic: 'Tiếng Anh'
  },
  {
    Prompt: 'Tác phẩm văn xuôi nổi tiếng "Dế Mèn phiêu lưu ký" của nhà văn Tô Hoài được dịch ra gần 40 thứ tiếng trên thế giới. Người bạn đường thân thiết cùng Dế Mèn đi phiêu lưu là nhân vật nào?',
    OptionA: 'Dế Choắt',
    OptionB: 'Dế Trũi',
    OptionC: 'Xiến Tóc',
    OptionD: 'Bọ Ngựa',
    Answer: 'B',
    Alternatives: 'DẾ TRŨI; DE TRUI; CHÚ DẾ TRŨI',
    Difficulty: 'Dễ',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Số La Mã "XIX" tương ứng với số tự nhiên nào trong hệ thập phân?',
    OptionA: '14',
    OptionB: '16',
    OptionC: '19',
    OptionD: '21',
    Answer: 'C',
    Alternatives: '19; MƯỜI CHÍN; MUOI CHIN',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Trận thủy chiến lẫy lừng năm 1785 ở miền Tây Nam Bộ quân Tây Sơn do Nguyễn Huệ chỉ huy đã đánh tan 5 vạn quân Xiêm xâm lược diễn ra tại khúc sông nào?',
    OptionA: 'Rạch Gầm - Xoài Mút',
    OptionB: 'Sông Gianh',
    OptionC: 'Sông Bến Hải',
    OptionD: 'Sông Cầu',
    Answer: 'A',
    Alternatives: 'RẠCH GẦM - XOÀI MÚT; RACH GAM XOAI MUT; RẠCH GẦM XOÀI MÚT',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Vị nữ anh hùng trẻ tuổi nào đã chỉ huy cuộc khởi nghĩa năm 248 với câu nói bất hủ: "Tôi muốn cưỡi cơn gió mạnh, đạp luồng sóng dữ, chém cá kình ở biển Đông"?',
    OptionA: 'Bà Triệu (Triệu Thị Trinh)',
    OptionB: 'Bùi Thị Xuân',
    OptionC: 'Lê Chân',
    OptionD: 'Nguyễn Thị Minh Khai',
    Answer: 'A',
    Alternatives: 'BÀ TRIỆU; BA TRIEU; TRIỆU THỊ TRINH; TRIEU THI TRINH',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Trong bóng đá 11 người, cự ly đá phạt đền (penalty) tiêu chuẩn cách khung thành bao nhiêu mét?',
    OptionA: '9 mét',
    OptionB: '10 mét',
    OptionC: '11 mét',
    OptionD: '12 mét',
    Answer: 'C',
    Alternatives: '11 MÉT; 11 MET; 11M; 11; MƯỜI MỘT MÉT',
    Difficulty: 'Dễ',
    Topic: 'Thể thao'
  },
  {
    Prompt: 'Chất khí nào cần thiết cho quá trình hô hấp của con người và hầu hết các sinh vật hiếu khí trên Trái Đất?',
    OptionA: 'Khí Nitơ',
    OptionB: 'Khí Oxy',
    OptionC: 'Khí Hiđro',
    OptionD: 'Khí Cacbonic',
    Answer: 'B',
    Alternatives: 'OXY; KHI OXY; KHÍ OXY; O2; OXYGEN',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Thủ phủ hành chính của tỉnh Thừa Thiên Huế là thành phố nào?',
    OptionA: 'Hội An',
    OptionB: 'Tam Kỳ',
    OptionC: 'Đồng Hới',
    OptionD: 'Huế',
    Answer: 'D',
    Alternatives: 'HUẾ; HUE; THÀNH PHỐ HUẾ; THANH PHO HUE',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Một hình bát giác đều có tất cả bao nhiêu góc trong?',
    OptionA: '8 góc',
    OptionB: '6 góc',
    OptionC: '10 góc',
    OptionD: '12 góc',
    Answer: 'A',
    Alternatives: '8 GÓC; 8 GOC; 8; TÁM GÓC; TAM GOC',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Họa sĩ Leonardo da Vinci là danh họa nổi tiếng người nước nào vào thời kỳ Phục hưng?',
    OptionA: 'Pháp',
    OptionB: 'Ý (Italia)',
    OptionC: 'Tây Ban Nha',
    OptionD: 'Hà Lan',
    Answer: 'B',
    Alternatives: 'Ý; Y; ITALIA; ITALY; NƯỚC Ý; NUOC Y',
    Difficulty: 'Dễ',
    Topic: 'Mỹ thuật'
  },
  {
    Prompt: 'Cây cầu bắc qua sông Hàn ở Đà Nẵng có kiến trúc mô phỏng hình dáng một con rồng và có khả năng phun lửa, phun nước vào dịp cuối tuần có tên là gì?',
    OptionA: 'Cầu Thuận Phước',
    OptionB: 'Cầu Trần Thị Lý',
    OptionC: 'Cầu Rồng',
    OptionD: 'Cầu Tiên Sơn',
    Answer: 'C',
    Alternatives: 'CẦU RỒNG; CAU RONG',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Dụng cụ y tế phổ biến dùng để đo huyết áp của bệnh nhân trong các phòng khám và bệnh viện được gọi là gì?',
    OptionA: 'Nhiệt kế y tế',
    OptionB: 'Kính hiển vi',
    OptionC: 'Ống nghe tim phổi',
    OptionD: 'Huyết áp kế',
    Answer: 'D',
    Alternatives: 'HUYẾT ÁP KẾ; HUYET AP KE; MÁY ĐO HUYẾT ÁP',
    Difficulty: 'Dễ',
    Topic: 'Y học'
  },
  {
    Prompt: 'Trong tác phẩm "Chí Phèo" của nhà văn Nam Cao, món ăn nào mà thị Nở mang cho Chí Phèo đã đánh thức bản tính lương thiện trong con người Chí?',
    OptionA: 'Bát cháo hành',
    OptionB: 'Bát cháo gà',
    OptionC: 'Củ khoai nướng',
    OptionD: 'Bát canh chua',
    Answer: 'A',
    Alternatives: 'BÁT CHÁO HÀNH; BAT CHAO HANH; CHÁO HÀNH; CHAO HANH',
    Difficulty: 'Dễ',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Hợp chất nào chiếm khoảng 70% tổng khối lượng cơ thể người trưởng thành và đóng vai trò dung môi hòa tan các chất?',
    OptionA: 'Nước (H2O)',
    OptionB: 'Protein',
    OptionC: 'Lipid',
    OptionD: 'Glucid',
    Answer: 'A',
    Alternatives: 'NƯỚC; NUOC; H2O',
    Difficulty: 'Dễ',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Hình vuông có độ dài cạnh bằng 5 cm thì chu vi của hình vuông đó bằng bao nhiêu xentimét?',
    OptionA: '10 cm',
    OptionB: '20 cm',
    OptionC: '25 cm',
    OptionD: '15 cm',
    Answer: 'B',
    Alternatives: '20 CM; 20CM; 20; HAI MƯƠI; HAI MUOI',
    Difficulty: 'Dễ',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Quốc kỳ của nước nào trên thế giới chỉ gồm hai màu cơ bản là đỏ và trắng với hình chiếc lá phong ở chính giữa?',
    OptionA: 'Thụy Sĩ',
    OptionB: 'Đan Mạch',
    OptionC: 'Canada',
    OptionD: 'Nhật Bản',
    Answer: 'C',
    Alternatives: 'CANADA; CA-NA-DA',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Chất khí nào tạo ra bọt khí sủi tăm trong các chai nước ngọt có gas và bia?',
    OptionA: 'Khí Cacbonic (CO2)',
    OptionB: 'Khí Oxy (O2)',
    OptionC: 'Khí Nitơ (N2)',
    OptionD: 'Khí Hiđro (H2)',
    Answer: 'A',
    Alternatives: 'KHÍ CACBONIC; KHI CACBONIC; CO2; CARBON DIOXIDE; CACBONIC',
    Difficulty: 'Dễ',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Vị vua nào của triều Trần đã ba lần chỉ đạo quân dân Đại Việt kháng chiến đánh tan các đạo quân xâm lược Nguyên - Mông hung hãn?',
    OptionA: 'Trần Thái Tông',
    OptionB: 'Trần Thánh Tông',
    OptionC: 'Trần Nhân Tông',
    OptionD: 'Cả ba vị vua trên (Trần Thái Tông, Trần Thánh Tông, Trần Nhân Tông qua 3 lần)',
    Answer: 'D',
    Alternatives: 'CẢ BA VỊ VUA TRÊN; CA BA VI VUA TREN; BA VỊ VUA',
    Difficulty: 'Dễ',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Phím tắt phổ biến trên bàn phím máy tính dùng để sao chép (Copy) đoạn văn bản đã chọn là tổ hợp phím nào?',
    OptionA: 'Ctrl + V',
    OptionB: 'Ctrl + C',
    OptionC: 'Ctrl + X',
    OptionD: 'Ctrl + Z',
    Answer: 'B',
    Alternatives: 'CTRL + C; CTRL+C; CONTROL C',
    Difficulty: 'Dễ',
    Topic: 'Tin học'
  },
  {
    Prompt: 'Dòng sông dài nhất châu Phi bắt nguồn từ hồ Victoria và đổ ra Địa Trung Hải là con sông nào?',
    OptionA: 'Sông Congo',
    OptionB: 'Sông Niger',
    OptionC: 'Sông Nin (Nile)',
    OptionD: 'Sông Zambezi',
    Answer: 'C',
    Alternatives: 'SÔNG NIN; SONG NIN; NILE; SÔNG NILE',
    Difficulty: 'Dễ',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Kim loại kiềm nào mềm đến mức có thể cắt dễ dàng bằng dao thường và phản ứng dữ dội với nước, thường được ngâm trong dầu hỏa để bảo quản?',
    OptionA: 'Natri (Na)',
    OptionB: 'Nhôm (Al)',
    OptionC: 'Đồng (Cu)',
    OptionD: 'Sắt (Fe)',
    Answer: 'A',
    Alternatives: 'NATRI; NA; SODIUM',
    Difficulty: 'Dễ',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Môn võ cổ truyền có nguồn gốc từ Hàn Quốc nổi tiếng với các đòn chân đẹp mắt và là môn thi đấu tranh huy chương chính thức tại Olympic là môn gì?',
    OptionA: 'Karate',
    OptionB: 'Taekwondo',
    OptionC: 'Judo',
    OptionD: 'Aikido',
    Answer: 'B',
    Alternatives: 'TAEKWONDO; TE-KWON-DO; THÁI CỰC ĐẠO',
    Difficulty: 'Dễ',
    Topic: 'Thể thao'
  },

  // ================= 25 CÂU TRUNG BÌNH (PART 1) =================
  {
    Prompt: 'Hiện tượng tán sắc ánh sáng lần đầu tiên được nhà bác học vĩ đại nào giải thích bằng thí nghiệm với lăng kính thủy tinh vào năm 1666?',
    OptionA: 'Galileo Galilei',
    OptionB: 'Isaac Newton',
    OptionC: 'Albert Einstein',
    OptionD: 'Michael Faraday',
    Answer: 'B',
    Alternatives: 'ISAAC NEWTON; NEWTON; NIU-TƠN',
    Difficulty: 'Trung bình',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Đoạn trích "Hạnh phúc của một tang gia" trong chương trình Ngữ văn THPT được rút ra từ cuốn tiểu thuyết nổi tiếng nào của nhà văn Vũ Trọng Phụng?',
    OptionA: 'Số đỏ',
    OptionB: 'Giông tố',
    OptionC: 'Vỡ đê',
    OptionD: 'Làm đĩ',
    Answer: 'A',
    Alternatives: 'SỐ ĐỎ; SO DO; TIỂU THUYẾT SỐ ĐỎ',
    Difficulty: 'Trung bình',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Tỉnh nào của Việt Nam là tỉnh duy nhất có đường bờ biển giáp với cả hai vùng biển là vịnh Thái Lan và Biển Đông?',
    OptionA: 'Kiên Giang',
    OptionB: 'Bạc Liêu',
    OptionC: 'Cà Mau',
    OptionD: 'Sóc Trăng',
    Answer: 'C',
    Alternatives: 'CÀ MAU; CA MAU; TỈNH CÀ MAU; TINH CA MAU',
    Difficulty: 'Trung bình',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Trong sinh học phân tử, đơn phân cấu tạo nên chuỗi pôlipeptit của phân tử prôtêin là gì?',
    OptionA: 'Nucleotit',
    OptionB: 'Axit béo',
    OptionC: 'Glucozơ',
    OptionD: 'Axit amin',
    Answer: 'D',
    Alternatives: 'AXIT AMIN; AMINO ACID; AMIN',
    Difficulty: 'Trung bình',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Trận chiến trên sông Bạch Đằng năm 1288 đánh tan đoàn thuyền lương và bắt sống tướng giặc Ô Mã Nhi do danh tướng nào chỉ huy?',
    OptionA: 'Trần Thủ Độ',
    OptionB: 'Trần Quốc Tuấn (Trần Hưng Đạo)',
    OptionC: 'Trần Quang Khải',
    OptionD: 'Trần Nhật Duật',
    Answer: 'B',
    Alternatives: 'TRẦN QUỐC TUẤN; TRAN QUOC TUAN; TRẦN HƯNG ĐẠO; TRAN HUNG DAO; HƯNG ĐẠO VƯƠNG',
    Difficulty: 'Trung bình',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Trong mạng máy tính, giao thức truyền tải siêu văn bản có mã hóa an toàn dữ liệu phổ biến hiện nay được viết tắt là gì?',
    OptionA: 'HTTP',
    OptionB: 'FTP',
    OptionC: 'HTTPS',
    OptionD: 'SMTP',
    Answer: 'C',
    Alternatives: 'HTTPS; GIAO THỨC HTTPS',
    Difficulty: 'Trung bình',
    Topic: 'Tin học'
  },
  {
    Prompt: 'Dung dịch chỉ thị màu phenolphtalein không màu khi nhỏ vào dung dịch bazơ kiềm (như NaOH) sẽ chuyển sang màu gì đặc trưng?',
    OptionA: 'Màu hồng (hoặc đỏ tím)',
    OptionB: 'Màu xanh da trời',
    OptionC: 'Màu vàng chanh',
    OptionD: 'Không đổi màu',
    Answer: 'A',
    Alternatives: 'MÀU HỒNG; MAU HONG; HỒNG; HONG; ĐỎ TÍM',
    Difficulty: 'Trung bình',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Một hình chóp tứ giác đều có bao nhiêu mặt và bao nhiêu cạnh?',
    OptionA: '5 mặt và 8 cạnh',
    OptionB: '4 mặt và 6 cạnh',
    OptionC: '5 mặt và 9 cạnh',
    OptionD: '6 mặt và 8 cạnh',
    Answer: 'A',
    Alternatives: '5 MẶT VÀ 8 CẠNH; 5 MAT VA 8 CANH; 5 MẶT 8 CẠNH',
    Difficulty: 'Trung bình',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Ai là tác giả của bản giao hưởng số 9 (với giai điệu Khải hoàn ca - Ode to Joy) được sáng tác khi ông đã bị điếc hoàn toàn?',
    OptionA: 'Wolfgang Amadeus Mozart',
    OptionB: 'Ludwig van Beethoven',
    OptionC: 'Johann Sebastian Bach',
    OptionD: 'Franz Schubert',
    Answer: 'B',
    Alternatives: 'BEETHOVEN; LUDWIG VAN BEETHOVEN; BÉT-TÔ-VEN',
    Difficulty: 'Trung bình',
    Topic: 'Âm nhạc'
  },
  {
    Prompt: 'Hẻm vực Tu Sản - danh thắng hẻm vực kỳ vĩ và sâu nhất Đông Nam Á - nằm trên dòng sông nào ở tỉnh Hà Giang?',
    OptionA: 'Sông Lô',
    OptionB: 'Sông Gâm',
    OptionC: 'Sông Nho Quế',
    OptionD: 'Sông Miện',
    Answer: 'C',
    Alternatives: 'SÔNG NHO QUẾ; SONG NHO QUE; NHO QUẾ',
    Difficulty: 'Trung bình',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Chiến dịch quân sự nào mở màn cho cuộc Tổng tiến công và nổi dậy mùa xuân năm 1975, giải phóng hoàn toàn miền Nam?',
    OptionA: 'Chiến dịch Tây Nguyên',
    OptionB: 'Chiến dịch Huế - Đà Nẵng',
    OptionC: 'Chiến dịch Hồ Chí Minh',
    OptionD: 'Chiến dịch Đường 9 - Khe Sanh',
    Answer: 'A',
    Alternatives: 'CHIẾN DỊCH TÂY NGUYÊN; CHIEN DICH TAY NGUYEN; TÂY NGUYÊN',
    Difficulty: 'Trung bình',
    Topic: 'Lịch sử'
  },
  {
    Prompt: 'Trong hệ tuần hoàn người, máu chảy từ tâm thất trái của tim sẽ đi trực tiếp vào mạch máu nào để vận chuyển đi nuôi toàn cơ thể?',
    OptionA: 'Tĩnh mạch chủ',
    OptionB: 'Động mạch phổi',
    OptionC: 'Động mạch chủ',
    OptionD: 'Tĩnh mạch phổi',
    Answer: 'C',
    Alternatives: 'ĐỘNG MẠCH CHỦ; DONG MACH CHU; ĐỘNG MẠCH CHỦ NGỰC',
    Difficulty: 'Trung bình',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Ở tế bào sinh vật nhân thực, bào quan nào được coi là "nhà máy năng lượng" của tế bào, nơi tổng hợp phần lớn phân tử ATP?',
    OptionA: 'Ribôxôm',
    OptionB: 'Ti thể',
    OptionC: 'Lưới nội chất',
    OptionD: 'Không bào',
    Answer: 'B',
    Alternatives: 'TI THỂ; TI THE; MITOCHONDRIA',
    Difficulty: 'Trung bình',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Kim loại nào sau đây có tính nhiễm từ mạnh nhất và là thành phần chủ yếu để chế tạo nam châm vĩnh cửu?',
    OptionA: 'Sắt (Fe)',
    OptionB: 'Đồng (Cu)',
    OptionC: 'Nhôm (Al)',
    OptionD: 'Bạc (Ag)',
    Answer: 'A',
    Alternatives: 'SẮT; SAT; FE; SẮT (FE)',
    Difficulty: 'Trung bình',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Khái niệm "Cân bằng sinh thái" bị phá vỡ mạnh nhất khi chuỗi thức ăn bị mất đi thành phần sinh vật nào sau đây?',
    OptionA: 'Sinh vật phân giải',
    OptionB: 'Sinh vật sản xuất',
    OptionC: 'Động vật ăn cỏ',
    OptionD: 'Động vật ăn thịt đầu bảng',
    Answer: 'B',
    Alternatives: 'SINH VẬT SẢN XUẤT; SINH VAT SAN XUAT; THỰC VẬT; CÂY XANH',
    Difficulty: 'Trung bình',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Thành phố trực thuộc Trung ương nào có diện tích tự nhiên lớn nhất Việt Nam sau các đợt mở rộng địa giới hành chính?',
    OptionA: 'Thành phố Hồ Chí Minh',
    OptionB: 'Hà Nội',
    OptionC: 'Hải Phòng',
    OptionD: 'Đà Nẵng',
    Answer: 'B',
    Alternatives: 'HÀ NỘI; HA NOI; THỦ ĐÔ HÀ NỘI',
    Difficulty: 'Trung bình',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Hiện tượng dương cực tan xảy ra trong bình điện phân khi dung dịch điện phân là muối của kim loại nào và anôt làm bằng chính kim loại đó?',
    OptionA: 'Nhôm',
    OptionB: 'Kẽm',
    OptionC: 'Đồng',
    OptionD: 'Bất kỳ kim loại nào thỏa mãn anôt làm bằng kim loại của muối trong dung dịch',
    Answer: 'D',
    Alternatives: 'BẤT KỲ KIM LOẠI NÀO THỎA MÃN; CÙNG KIM LOẠI',
    Difficulty: 'Trung bình',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Nhà thơ nào được mệnh danh là "Hoàng tử thơ tình" của thi đàn hiện đại Việt Nam với những bài thơ "Thơ duyên", "Vội vàng", "Đây thôn Vĩ Dạ" (của bạn ông)?',
    OptionA: 'Xuân Diệu',
    OptionB: 'Hàn Mặc Tử',
    OptionC: 'Huy Cận',
    OptionD: 'Chế Lan Viên',
    Answer: 'A',
    Alternatives: 'XUÂN DIỆU; XUAN DIEU; THI SĨ XUÂN DIỆU',
    Difficulty: 'Trung bình',
    Topic: 'Văn học'
  },
  {
    Prompt: 'Kim loại nào được mệnh danh là "vàng đen" hay "kim loại của tương lai" nhờ độ bền cực cao, nhẹ và chịu nhiệt độ lớn, được dùng nhiều trong hàng không vũ trụ?',
    OptionA: 'Titan (Ti)',
    OptionB: 'Vonfram (W)',
    OptionC: 'Crom (Cr)',
    OptionD: 'Platin (Pt)',
    Answer: 'A',
    Alternatives: 'TITAN; TITANIUM; TI',
    Difficulty: 'Trung bình',
    Topic: 'Hóa học'
  },
  {
    Prompt: 'Dụng cụ chuyên dụng dùng để phát hiện và đo liều lượng bức xạ ion hóa phóng xạ mang tên hai nhà vật lý Hans Geiger và Walther Müller là gì?',
    OptionA: 'Nhiệt lượng kế',
    OptionB: 'Ống đếm Geiger - Müller',
    OptionC: 'Gia tốc kế',
    OptionD: 'Vôn kế tĩnh điện',
    Answer: 'B',
    Alternatives: 'ỐNG ĐẾM GEIGER; ONG DEM GEIGER; MÁY ĐẾM GEIGER',
    Difficulty: 'Trung bình',
    Topic: 'Vật lý'
  },
  {
    Prompt: 'Hình hộp chữ nhật có 3 kích thước lần lượt là 2 cm, 3 cm và 4 cm. Thể tích của hình hộp chữ nhật này bằng bao nhiêu xentimét khối?',
    OptionA: '9 cm3',
    OptionB: '18 cm3',
    OptionC: '24 cm3',
    OptionD: '36 cm3',
    Answer: 'C',
    Alternatives: '24 CM3; 24CM3; 24; HAI MƯƠI BỐN',
    Difficulty: 'Trung bình',
    Topic: 'Toán học'
  },
  {
    Prompt: 'Trong bóng đá, khi một cầu thủ nhận trực tiếp 1 thẻ đỏ (hoặc 2 thẻ vàng) thì đội bóng đó sẽ bị phạt thế nào về số lượng cầu thủ trên sân?',
    OptionA: 'Được thay 1 cầu thủ khác vào sân ngay',
    OptionB: 'Thi đấu thiếu người (chỉ còn 10 người trên sân)',
    OptionC: 'Bị trừ 1 bàn thắng',
    OptionD: 'Bị xử thua ngay lập tức',
    Answer: 'B',
    Alternatives: 'THI ĐẤU THIẾU NGƯỜI; CÒN 10 NGƯỜI; TRUẤT QUYỀN THI ĐẤU',
    Difficulty: 'Trung bình',
    Topic: 'Thể thao'
  },
  {
    Prompt: 'Cây cầu dây văng đầu tiên bắc qua sông Tiền nối liền hai tỉnh Tiền Giang và Vĩnh Long được khánh thành năm 2000 có tên là gì?',
    OptionA: 'Cầu Rạch Miễu',
    OptionB: 'Cầu Cần Thơ',
    OptionC: 'Cầu Mỹ Thuận',
    OptionD: 'Cầu Cổ Chiên',
    Answer: 'C',
    Alternatives: 'CẦU MỸ THUẬN; CAU MY THUAN; MỸ THUẬN; MY THUAN',
    Difficulty: 'Trung bình',
    Topic: 'Địa lý'
  },
  {
    Prompt: 'Cơ chế sao chép phân tử ADN trong nhân tế bào tuân theo hai nguyên tắc cơ bản là nguyên tắc bán bảo toàn và nguyên tắc gì?',
    OptionA: 'Nguyên tắc bổ sung',
    OptionB: 'Nguyên tắc bảo toàn khối lượng',
    OptionC: 'Nguyên tắc ngẫu nhiên',
    OptionD: 'Nguyên tắc đối xứng',
    Answer: 'A',
    Alternatives: 'NGUYÊN TẮC BỔ SUNG; NGUYEN TAC BO SUNG; BỔ SUNG',
    Difficulty: 'Trung bình',
    Topic: 'Sinh học'
  },
  {
    Prompt: 'Trong môn quần vợt (tennis), cú đánh bóng bổng vượt qua tầm với trên không của đối thủ đang đứng gần lưới được gọi là cú gì?',
    OptionA: 'Cú Smash (đập bóng)',
    OptionB: 'Cú Lob (lốp bóng)',
    OptionC: 'Cú Drop shot (bỏ nhỏ)',
    OptionD: 'Cú Volley (bắt lưới)',
    Answer: 'B',
    Alternatives: 'CÚ LOB; LOB; LỐP BÓNG; CU LOB',
    Difficulty: 'Trung bình',
    Topic: 'Thể thao'
  }
];
