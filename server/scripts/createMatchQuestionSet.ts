import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { parseExcelQuestionSet } from '../src/game/questionParser.js';
import { validateQuestionSet } from '../src/game/questionValidator.js';

// Dữ liệu bộ đề chuẩn thi đấu
const kdRiengData = [
  // Ghế 1
  {
    Seat: 1, Order: 1,
    Prompt: 'Thành phố nào là thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam?',
    OptionA: 'Hà Nội', OptionB: 'TP. Hồ Chí Minh', OptionC: 'Đà Nẵng', OptionD: 'Hải Phòng',
    Answer: 'A', Alternatives: 'HÀ NỘI; HA NOI', Difficulty: 'Dễ'
  },
  {
    Seat: 1, Order: 2,
    Prompt: 'Trong cơ thể người, cơ quan nào chịu trách nhiệm chính trong việc co bóp để đẩy máu đi tuần hoàn nuôi các mô và tế bào?',
    OptionA: 'Phổi', OptionB: 'Tim', OptionC: 'Gan', OptionD: 'Thận',
    Answer: 'B', Alternatives: 'TIM; TRÁI TIM; TRAI TIM', Difficulty: 'Dễ'
  },
  {
    Seat: 1, Order: 3,
    Prompt: 'Ký hiệu hóa học của nguyên tố Sắt trong bảng hệ thống tuần hoàn các nguyên tố hóa học là gì?',
    OptionA: 'Fe', OptionB: 'Cu', OptionC: 'Zn', OptionD: 'Al',
    Answer: 'A', Alternatives: 'FE; SẮT; SAT', Difficulty: 'Dễ'
  },
  {
    Seat: 1, Order: 4,
    Prompt: 'Đơn vị đo độ dài cơ bản trong Hệ đơn vị đo lường quốc tế (SI) là gì?',
    OptionA: 'Xentimét (cm)', OptionB: 'Milimét (mm)', OptionC: 'Mét (m)', OptionD: 'Kilômét (km)',
    Answer: 'C', Alternatives: 'MÉT; MET; M', Difficulty: 'Dễ'
  },
  {
    Seat: 1, Order: 5,
    Prompt: 'Vị anh hùng nào đã dựng cờ khởi nghĩa Lam Sơn chống quân Minh xâm lược và lập ra triều đại Hậu Lê?',
    OptionA: 'Lê Lợi', OptionB: 'Lê Thánh Tông', OptionC: 'Lê Hoàn', OptionD: 'Lê Chiêu Thống',
    Answer: 'A', Alternatives: 'LÊ LỢI; LE LOI; LÊ THÁI TỔ; LE THAI TO', Difficulty: 'Trung bình'
  },
  {
    Seat: 1, Order: 6,
    Prompt: 'Giá trị lũy thừa của biểu thức 2 mũ 5 (2^5) bằng bao nhiêu?',
    OptionA: '16', OptionB: '32', OptionC: '64', OptionD: '10',
    Answer: 'B', Alternatives: '32; BA MƯƠI HAI', Difficulty: 'Trung bình'
  },

  // Ghế 2
  {
    Seat: 2, Order: 1,
    Prompt: 'Đại dương nào có diện tích lớn nhất trên bề mặt Trái Đất?',
    OptionA: 'Đại Tây Dương', OptionB: 'Ấn Độ Dương', OptionC: 'Thái Bình Dương', OptionD: 'Bắc Băng Dương',
    Answer: 'C', Alternatives: 'THÁI BÌNH DƯƠNG; THAI BINH DUONG', Difficulty: 'Dễ'
  },
  {
    Seat: 2, Order: 2,
    Prompt: 'Nguyên tố nào có số hiệu nguyên tử bằng 1 và là nguyên tố nhẹ nhất trong vũ trụ?',
    OptionA: 'Hydro', OptionB: 'Heli', OptionC: 'Lithi', OptionD: 'Cacbon',
    Answer: 'A', Alternatives: 'HYDRO; HIDRO; H', Difficulty: 'Dễ'
  },
  {
    Seat: 2, Order: 3,
    Prompt: 'Trong một tam giác vuông, cạnh đối diện với góc vuông được gọi là cạnh gì?',
    OptionA: 'Cạnh kề', OptionB: 'Cạnh đối', OptionC: 'Cạnh huyền', OptionD: 'Đường cao',
    Answer: 'C', Alternatives: 'CẠNH HUYỀN; CANH HUYEN', Difficulty: 'Dễ'
  },
  {
    Seat: 2, Order: 4,
    Prompt: 'Bản Tuyên ngôn Độc lập khai sinh ra nước Việt Nam Dân chủ Cộng hòa ngày 2/9/1945 được Chủ tịch Hồ Chí Minh đọc tại quảng trường nào?',
    OptionA: 'Quảng trường Ba Đình', OptionB: 'Quảng trường Cách Mạng Tháng Tám', OptionC: 'Quảng trường Đông Kinh Nghĩa Thục', OptionD: 'Quảng trường Lam Sơn',
    Answer: 'A', Alternatives: 'QUẢNG TRƯỜNG BA ĐÌNH; BA ĐÌNH; BA DINH', Difficulty: 'Dễ'
  },
  {
    Seat: 2, Order: 5,
    Prompt: 'Hiện tượng các giọt sương đọng trên lá cây vào sáng sớm là kết quả của sự biến đổi trạng thái nào của hơi nước trong không khí?',
    OptionA: 'Sự ngưng tụ', OptionB: 'Sự bay hơi', OptionC: 'Sự nóng chảy', OptionD: 'Sự đông đặc',
    Answer: 'A', Alternatives: 'NGƯNG TỤ; SỰ NGƯNG TỤ; NGUNG TU', Difficulty: 'Trung bình'
  },
  {
    Seat: 2, Order: 6,
    Prompt: 'Trong tác phẩm "Chuyện người con gái Nam Xương" của Nguyễn Dữ, nhân vật người phụ nữ đức hạnh nhưng phải chịu nỗi oan khuất tên là gì?',
    OptionA: 'Vũ Thị Thiết (Vũ Nương)', OptionB: 'Kiều Nguyệt Nga', OptionC: 'Thúy Kiều', OptionD: 'Mị Nương',
    Answer: 'A', Alternatives: 'VŨ NƯƠNG; VU NUONG; VŨ THỊ THIẾT; VU THI THIET', Difficulty: 'Trung bình'
  },

  // Ghế 3
  {
    Seat: 3, Order: 1,
    Prompt: 'Vận tốc truyền của ánh sáng trong chân không xấp xỉ bằng bao nhiêu km/s?',
    OptionA: '300.000 km/s', OptionB: '150.000 km/s', OptionC: '30.000 km/s', OptionD: '3.000 km/s',
    Answer: 'A', Alternatives: '300.000 KM/S; 300000; BA TRĂM NGHÌN KM/S', Difficulty: 'Dễ'
  },
  {
    Seat: 3, Order: 2,
    Prompt: 'Khí nào sau đây được cây xanh hấp thụ trong quá trình quang hợp vào ban ngày?',
    OptionA: 'Cacbonic (CO2)', OptionB: 'Nitơ (N2)', OptionC: 'Mêtan (CH4)', OptionD: 'Lưu huỳnh đioxit (SO2)',
    Answer: 'A', Alternatives: 'CO2; CACBONIC; KHÍ CACBONIC; DIOXIT CACBON', Difficulty: 'Dễ'
  },
  {
    Seat: 3, Order: 3,
    Prompt: 'Quốc gia nào có diện tích lãnh thổ lớn nhất thế giới hiện nay?',
    OptionA: 'Canada', OptionB: 'Liên bang Nga', OptionC: 'Trung Quốc', OptionD: 'Hoa Kỳ',
    Answer: 'B', Alternatives: 'NGA; LIÊN BANG NGA; NƯỚC NGA; RUSSIA', Difficulty: 'Dễ'
  },
  {
    Seat: 3, Order: 4,
    Prompt: 'Trận đại thắng Bạch Đằng năm 938 do vị anh hùng dân tộc nào chỉ huy đã đặt dấu chấm hết cho hơn một thiên niên kỷ Bắc thuộc?',
    OptionA: 'Ngô Quyền', OptionB: 'Đinh Bộ Lĩnh', OptionC: 'Lê Hoàn', OptionD: 'Trần Hưng Đạo',
    Answer: 'A', Alternatives: 'NGÔ QUYỀN; NGO QUYEN', Difficulty: 'Dễ'
  },
  {
    Seat: 3, Order: 5,
    Prompt: 'Tổng số đo ba góc trong của một tam giác bất kỳ trong hình học phẳng Euclide bằng bao nhiêu độ?',
    OptionA: '90 độ', OptionB: '180 độ', OptionC: '270 độ', OptionD: '360 độ',
    Answer: 'B', Alternatives: '180 ĐỘ; 180; MỘT TRĂM TÁM MƯƠI ĐỘ', Difficulty: 'Trung bình'
  },
  {
    Seat: 3, Order: 6,
    Prompt: 'Tác giả của bài thơ thiếu nhi nổi tiếng "Hạt gạo làng ta" là nhà thơ nào?',
    OptionA: 'Trần Đăng Khoa', OptionB: 'Định Hải', OptionC: 'Phạm Hổ', OptionD: 'Xuân Quỳnh',
    Answer: 'A', Alternatives: 'TRẦN ĐĂNG KHOA; TRAN DANG KHOA', Difficulty: 'Trung bình'
  },

  // Ghế 4
  {
    Seat: 4, Order: 1,
    Prompt: 'Kim loại duy nhất nào ở thể lỏng trong điều kiện nhiệt độ phòng tiêu chuẩn?',
    OptionA: 'Thủy ngân (Hg)', OptionB: 'Chì (Pb)', OptionC: 'Thiếc (Sn)', OptionD: 'Nhôm (Al)',
    Answer: 'A', Alternatives: 'THỦY NGÂN; THUY NGAN; HG', Difficulty: 'Dễ'
  },
  {
    Seat: 4, Order: 2,
    Prompt: 'Tác phẩm văn học kiệt xuất nào được xem là đỉnh cao truyện thơ Nôm của đại thi hào Nguyễn Du?',
    OptionA: 'Truyện Kiều', OptionB: 'Lục Vân Tiên', OptionC: 'Chinh phụ ngâm', OptionD: 'Cung oán ngâm khúc',
    Answer: 'A', Alternatives: 'TRUYỆN KIỀU; TRUYEN KIEU; ĐOẠN TRƯỜNG TÂN THANH', Difficulty: 'Dễ'
  },
  {
    Seat: 4, Order: 3,
    Prompt: 'Tứ giác đều có 4 cạnh bằng nhau và 4 góc vuông được gọi là hình gì?',
    OptionA: 'Hình vuông', OptionB: 'Hình chữ nhật', OptionC: 'Hình thoi', OptionD: 'Hình bình hành',
    Answer: 'A', Alternatives: 'HÌNH VUÔNG; HINH VUONG', Difficulty: 'Dễ'
  },
  {
    Seat: 4, Order: 4,
    Prompt: 'Hòn đảo lớn nhất của Việt Nam nằm trong vịnh Thái Lan thuộc tỉnh Kiên Giang có tên là gì?',
    OptionA: 'Đảo Phú Quốc', OptionB: 'Đảo Cát Bà', OptionC: 'Đảo Côn Sơn', OptionD: 'Đảo Lý Sơn',
    Answer: 'A', Alternatives: 'PHÚ QUỐC; PHU QUOC; ĐẢO PHÚ QUỐC', Difficulty: 'Dễ'
  },
  {
    Seat: 4, Order: 5,
    Prompt: 'Sóng âm thanh không thể truyền lan qua môi trường vật chất nào sau đây?',
    OptionA: 'Chân không', OptionB: 'Chất rắn', OptionC: 'Chất lỏng', OptionD: 'Chất khí',
    Answer: 'A', Alternatives: 'CHÂN KHÔNG; CHAN KHONG', Difficulty: 'Trung bình'
  },
  {
    Seat: 4, Order: 6,
    Prompt: 'Vị anh hùng dân tộc nào đã chỉ huy đại quân Tây Sơn tiến ra Thăng Long quét sạch 29 vạn quân Mãn Thanh mùa xuân năm 1789?',
    OptionA: 'Quang Trung (Nguyễn Huệ)', OptionB: 'Nguyễn Nhạc', OptionC: 'Nguyễn Lữ', OptionD: 'Trần Quang Diệu',
    Answer: 'A', Alternatives: 'QUANG TRUNG; NGUYỄN HUỆ; NGUYEN HUE; VUA QUANG TRUNG', Difficulty: 'Trung bình'
  },
];

const kdChungData = [
  {
    Order: 1,
    Prompt: 'Hành tinh nào trong Hệ Mặt Trời được mệnh danh là "Hành tinh Đỏ" do bề mặt chứa nhiều oxit sắt?',
    OptionA: 'Sao Hỏa', OptionB: 'Sao Kim', OptionC: 'Sao Thổ', OptionD: 'Sao Mộc',
    Answer: 'A', Alternatives: 'SAO HỎA; SAO HOA; MARS', Difficulty: 'Dễ'
  },
  {
    Order: 2,
    Prompt: 'Sắc tố sinh học nào trong lá cây giữ vai trò hấp thụ ánh sáng để quang hợp và tạo màu xanh cho lá?',
    OptionA: 'Diệp lục (Clorophyl)', OptionB: 'Carotenoid', OptionC: 'Anthocyanin', OptionD: 'Xanthophyll',
    Answer: 'A', Alternatives: 'DIỆP LỤC; CHLOROPHYLL; CLOROPHYL', Difficulty: 'Dễ'
  },
  {
    Order: 3,
    Prompt: 'Dãy núi nào đóng vai trò là ranh giới tự nhiên ngăn cách giữa hai châu lục Á và Âu?',
    OptionA: 'Dãy Ural', OptionB: 'Dãy Alps', OptionC: 'Dãy Himalaya', OptionD: 'Dãy Andes',
    Answer: 'A', Alternatives: 'URAL; DÃY URAL; DAY URAL', Difficulty: 'Dễ'
  },
  {
    Order: 4,
    Prompt: 'Tập hợp tất cả các số nguyên dương là ước của số 6 gồm bao nhiêu phần tử?',
    OptionA: '4 phần tử', OptionB: '3 phần tử', OptionC: '2 phần tử', OptionD: '5 phần tử',
    Answer: 'A', Alternatives: '4; BỐN; 4 PHẦN TỬ; 4 PHAN TU', Difficulty: 'Dễ'
  },
  {
    Order: 5,
    Prompt: 'Kim loại nào có hàm lượng chiếm tỷ lệ phần trăm lớn nhất trong vỏ Trái Đất?',
    OptionA: 'Nhôm (Al)', OptionB: 'Sắt (Fe)', OptionC: 'Canxi (Ca)', OptionD: 'Đồng (Cu)',
    Answer: 'A', Alternatives: 'NHÔM; NHOM; AL; ALUMINIUM', Difficulty: 'Dễ'
  },
  {
    Order: 6,
    Prompt: 'Tập thơ chữ Hán nổi tiếng "Nhật ký trong tù" gồm 133 bài thơ được sáng tác bởi tác giả nào?',
    OptionA: 'Hồ Chí Minh', OptionB: 'Phan Bội Châu', OptionC: 'Huỳnh Thúc Kháng', OptionD: 'Tố Hữu',
    Answer: 'A', Alternatives: 'HỒ CHÍ MINH; HO CHI MINH; BÁC HỒ; BAC HO', Difficulty: 'Trung bình'
  },
  {
    Order: 7,
    Prompt: 'Lực cản trở chuyển động xuất hiện tại bề mặt tiếp xúc khi một vật trượt trên bề mặt vật khác gọi là gì?',
    OptionA: 'Lực ma sát', OptionB: 'Lực hấp dẫn', OptionC: 'Lực đàn hồi', OptionD: 'Lực đẩy Ác-si-mét',
    Answer: 'A', Alternatives: 'LỰC MA SÁT; MA SÁT; MA SAT; LUC MA SAT', Difficulty: 'Trung bình'
  },
  {
    Order: 8,
    Prompt: 'Tỉnh nào có diện tích tự nhiên rộng nhất trong số 63 tỉnh, thành phố của nước ta hiện nay?',
    OptionA: 'Nghệ An', OptionB: 'Gia Lai', OptionC: 'Sơn La', OptionD: 'Đắk Lắk',
    Answer: 'A', Alternatives: 'NGHỆ AN; NGHE AN; TỈNH NGHỆ AN', Difficulty: 'Trung bình'
  },
  {
    Order: 9,
    Prompt: 'Trong hóa học, ở nhiệt độ 25 độ C, dung dịch có chỉ số pH đúng bằng 7 được gọi là dung dịch gì?',
    OptionA: 'Dung dịch trung tính', OptionB: 'Dung dịch axit', OptionC: 'Dung dịch bazơ', OptionD: 'Dung dịch đệm',
    Answer: 'A', Alternatives: 'TRUNG TÍNH; DUNG DỊCH TRUNG TÍNH; TRUNG TINH', Difficulty: 'Trung bình'
  },
  {
    Order: 10,
    Prompt: 'Tập đoàn cứ điểm Điện Biên Phủ của quân viễn chinh Pháp năm 1954 được chia thành bao nhiêu cứ điểm đề kháng?',
    OptionA: '49 cứ điểm', OptionB: '45 cứ điểm', OptionC: '56 cứ điểm', OptionD: '38 cứ điểm',
    Answer: 'A', Alternatives: '49; BỐN MƯƠI CHÍN; 49 CỨ ĐIỂM', Difficulty: 'Khó'
  },
  {
    Order: 11,
    Prompt: 'Một hình cầu có bán kính R = 3 cm. Thể tích của hình cầu đó bằng bao nhiêu pi xentimét khối?',
    OptionA: '36 pi cm3', OptionB: '27 pi cm3', OptionC: '12 pi cm3', OptionD: '18 pi cm3',
    Answer: 'A', Alternatives: '36 PI CM3; 36; BA MƯƠI SÁU; 36 PI', Difficulty: 'Khó'
  },
  {
    Order: 12,
    Prompt: 'Nhà soạn nhạc thiên tài người Đức nào là tác giả của Bản giao hưởng số 9 (với khúc Ode to Joy) dù đã bị điếc hoàn toàn khi hoàn thành tác phẩm?',
    OptionA: 'Ludwig van Beethoven', OptionB: 'Wolfgang Amadeus Mozart', OptionC: 'Johann Sebastian Bach', OptionD: 'Frederic Chopin',
    Answer: 'A', Alternatives: 'BEETHOVEN; BÉT-TÔ-VEN; LUDWIG VAN BEETHOVEN', Difficulty: 'Khó'
  },
];

const vcnvData = [
  {
    Type: 'ROW_1',
    Prompt: 'Loại hình nghệ thuật diễn xướng dân gian gắn liền với lễ hội, lao động và phong tục tập quán của cư dân vùng đồng bằng sông Hồng cùng các vùng phụ cận được gọi chung là gì?',
    Answer: 'DÂN CA BẮC BỘ',
    Alternatives: 'DAN CA BAC BO; DÂN CA; DAN CA; DÂN CA ĐỒNG BẰNG BẮC BỘ',
    Image: '',
  },
  {
    Type: 'ROW_2',
    Prompt: 'Theo hệ thống phân loại Hornbostel–Sachs trong âm nhạc học, thuật ngữ chung nào dùng để chỉ những thiết bị, đồ vật chuyên biệt tạo ra các dao động âm thanh có cao độ, trường độ và âm sắc phục vụ biểu diễn?',
    Answer: 'NHẠC CỤ',
    Alternatives: 'NHAC CU; NHẠC KHÍ; NHAC KHI',
    Image: '',
  },
  {
    Type: 'ROW_3',
    Prompt: 'Trong kỹ thuật xây dựng thành quách, lăng tẩm cổ truyền của người Việt xưa, bên cạnh vôi và mật mía, chất phụ gia hữu cơ giàu tinh bột nào thường được nấu chín để trộn vào vữa nhằm tăng độ kết dính bền vững qua hàng trăm năm?',
    Answer: 'CƠM NẾP',
    Alternatives: 'COM NEP; CƠM; XÔI; GẠO NẾP; CƠM XÔI',
    Image: '',
  },
  {
    Type: 'ROW_4',
    Prompt: 'Trong tác phẩm "Dế Mèn phiêu lưu ký" của nhà văn Tô Hoài, hiệp sĩ Dế Mèn đã ra tay xóa nợ và phá vây giải cứu chị Nhà Trò khỏi sự ức hiếp của đàn sinh vật nào?',
    Answer: 'CON NHỆN',
    Alternatives: 'CON NHEN; NHỆN; NHEN; ĐÀN NHỆN; LOÀI NHỆN',
    Image: '',
  },
  {
    Type: 'CENTER',
    Prompt: 'Hình tượng con nhện giăng tơ cùng câu hát quen thuộc "Khen ai khéo vỗ, ố mấy bông mà nên bông" xuất hiện trong làn điệu dân ca Bắc Bộ nổi tiếng nào?',
    Answer: 'TRỐNG CƠM',
    Alternatives: 'TRONG COM',
    Image: '',
  },
  {
    Type: 'OBSTACLE',
    Prompt: 'Tên một nhạc khí gõ hình trụ bịt da hai đầu trong dàn nhạc cổ truyền Việt Nam, đồng thời là tên một bản dân ca Bắc Bộ vui tươi có xuất xứ tên gọi bắt nguồn từ tập quán dán tinh bột dẻo vào tâm mặt trống để định âm?',
    Answer: 'TRỐNG CƠM',
    Alternatives: 'TRONG COM',
    Image: '',
  },
];

const tangTocData = [
  {
    Order: 1,
    Prompt: 'Sắp xếp các đơn vị đo thời gian sau theo thứ tự từ ngắn nhất đến dài nhất: [1] Giờ, [2] Giây, [3] Ngày, [4] Phút.',
    Answer: '2-4-1-3',
    Alternatives: '2413; 2, 4, 1, 3; 2 4 1 3; [2] [4] [1] [3]',
    Media: '',
  },
  {
    Order: 2,
    Prompt: 'Điền số còn thiếu vào chỗ trống theo quy luật dãy số sau: 2, 5, 10, 17, 26, ...?',
    Answer: '37',
    Alternatives: 'BA MƯƠI BẢY; 37',
    Media: '',
  },
  {
    Order: 3,
    Prompt: 'Sắp xếp các hành tinh sau theo thứ tự khoảng cách xa dần Mặt Trời: [1] Trái Đất, [2] Sao Hỏa, [3] Sao Kim, [4] Sao Mộc.',
    Answer: '3-1-2-4',
    Alternatives: '3124; 3, 1, 2, 4; 3 1 2 4; [3] [1] [2] [4]',
    Media: '',
  },
  {
    Order: 4,
    Prompt: 'Trong một cuộc thi chạy có 4 vận động viên A, B, C, D: B về đích sau A nhưng trước C; D về đích trước A. Vận động viên nào về đích đầu tiên?',
    Answer: 'D',
    Alternatives: 'VẬN ĐỘNG VIÊN D; D; BẠN D',
    Media: '',
  },
];

const veDichData = [
  // 10 điểm
  {
    Points: 10,
    Prompt: 'Nguyên tố hóa học nào có độ phổ biến cao nhất trong vỏ Trái Đất tính theo khối lượng?',
    Answer: 'OXY',
    Alternatives: 'OXYGEN; O; DƯỠNG KHÍ',
  },
  {
    Points: 10,
    Prompt: 'Vị vua nào đã ban bố "Chiếu dời đô" vào mùa thu năm 1010 để định đô tại Thăng Long?',
    Answer: 'LÝ THÁI TỔ',
    Alternatives: 'LY THAI TO; LÝ CÔNG UẨN; LY CONG UAN',
  },
  {
    Points: 10,
    Prompt: 'Đơn vị chuẩn đo lực trong hệ đo lường quốc tế SI là gì?',
    Answer: 'NEWTON',
    Alternatives: 'NIU-TƠN; NIUTON; N',
  },
  {
    Points: 10,
    Prompt: 'Quần thể danh thắng Vịnh Hạ Long - di sản thiên nhiên thế giới thuộc tỉnh/thành phố nào?',
    Answer: 'QUẢNG NINH',
    Alternatives: 'QUANG NINH; TỈNH QUẢNG NINH',
  },
  {
    Points: 10,
    Prompt: 'Tập hợp các số tự nhiên lớn hơn 0 và không vượt quá 5 gồm bao nhiêu phần tử?',
    Answer: '5',
    Alternatives: '5 PHẦN TỬ; NĂM; NĂM PHẦN TỬ',
  },
  {
    Points: 10,
    Prompt: 'Cơ quan sinh dưỡng nào của thực vật thực hiện chức năng quang hợp và thoát hơi nước chủ yếu?',
    Answer: 'LÁ',
    Alternatives: 'LÁ CÂY; LA; LA CAY',
  },

  // 20 điểm
  {
    Points: 20,
    Prompt: 'Trong bảng tuần hoàn hóa học, kim loại kiềm nhẹ nhất và có mật độ khối lượng riêng nhỏ nhất là gì?',
    Answer: 'LITHI',
    Alternatives: 'LITHIUM; LI',
  },
  {
    Points: 20,
    Prompt: 'Cuộc khởi nghĩa Hai Bà Trưng phất cờ khởi nghĩa chống quân Đông Hán nổ ra vào năm nào sau Công nguyên?',
    Answer: 'NĂM 40',
    Alternatives: '40; NĂM 40 SCN; 40 SCN; NAM 40',
  },
  {
    Points: 20,
    Prompt: 'Một hình thang có độ dài hai đáy là 8 cm và 12 cm, chiều cao bằng 5 cm. Diện tích của hình thang đó bằng bao nhiêu xentimét vuông?',
    Answer: '50',
    Alternatives: '50 CM2; NĂM MƯƠI; 50',
  },
  {
    Points: 20,
    Prompt: 'Vườn quốc gia nổi tiếng nào tại tỉnh Quảng Bình được UNESCO công nhận là Di sản thiên nhiên thế giới về địa chất và hang động?',
    Answer: 'PHONG NHA KẺ BÀNG',
    Alternatives: 'PHONG NHA - KẺ BÀNG; PHONG NHA KE BANG; VƯỜN QUỐC GIA PHONG NHA KẺ BÀNG',
  },
  {
    Points: 20,
    Prompt: 'Bộ tiểu thuyết chương hồi lừng danh nào của La Quán Trung mở đầu bằng câu nói: "Thế lớn trong thiên hạ, cứ tan lâu lại hợp, hợp lâu lại tan"?',
    Answer: 'TAM QUỐC DIỄN NGHĨA',
    Alternatives: 'TAM QUOC DIEN NGHIA; TAM QUỐC CHÍ DIỄN NGHĨA; TAM QUỐC',
  },
  {
    Points: 20,
    Prompt: 'Hiện tượng ánh sáng bị đổi hướng khi truyền xiên góc qua mặt phân cách giữa hai môi trường trong suốt khác nhau gọi là gì?',
    Answer: 'KHÚC XẠ ÁNH SÁNG',
    Alternatives: 'KHÚC XẠ; KHUC XA; HIỆN TƯỢNG KHÚC XẠ; KHUC XA ANH SANG',
  },

  // 30 điểm
  {
    Points: 30,
    Prompt: 'Hai điện trở R1 = 6 ôm và R2 = 12 ôm được mắc song song. Điện trở tương đương của đoạn mạch bằng bao nhiêu ôm?',
    Answer: '4',
    Alternatives: '4 ÔM; BỐN; 4 OM',
  },
  {
    Points: 30,
    Prompt: 'Chiến dịch quân sự toàn thắng mùa xuân năm 1975 giải phóng hoàn toàn miền Nam, thống nhất đất nước mang tên vị lãnh tụ vĩ đại nào?',
    Answer: 'CHIẾN DỊCH HỒ CHÍ MINH',
    Alternatives: 'CHIEN DICH HO CHI MINH; HỒ CHÍ MINH; HO CHI MINH',
  },
  {
    Points: 30,
    Prompt: 'Căn bậc hai số học của một số dương x bằng 15. Giá trị của số x đó là bao nhiêu?',
    Answer: '225',
    Alternatives: 'HAI TRĂM HAI MƯƠI LĂM; 225',
  },
  {
    Points: 30,
    Prompt: 'Polysaccharide đại phân tử nào là thành phần cấu tạo chính của thành tế bào thực vật và là nguồn chất xơ chủ yếu?',
    Answer: 'CELLULOSE',
    Alternatives: 'XENLULOZO; CENLULOZO; CELLULOSA; XENLULÔZƠ',
  },
  {
    Points: 30,
    Prompt: 'Con sông nào dài nhất chảy hoàn toàn trên lãnh thổ Việt Nam mà không bắt nguồn từ bên ngoài biên giới?',
    Answer: 'SÔNG ĐỒNG NAI',
    Alternatives: 'SONG DONG NAI; ĐỒNG NAI; DONG NAI',
  },
  {
    Points: 30,
    Prompt: 'Nhà nữ bác học kiệt xuất nào là người đầu tiên và duy nhất trong lịch sử từng nhận hai giải Nobel ở hai lĩnh vực khoa học khác nhau (Vật lý và Hóa học)?',
    Answer: 'MARIE CURIE',
    Alternatives: 'MARI QUY-RI; MARIE SKLODOWSKA-CURIE; MA-RI COI-RI; CURIE; MARIE CURIE',
  },
];

const tieBreakData = [
  {
    Order: 1,
    Prompt: 'Hành tinh nào trong Hệ Mặt Trời tự quay quanh trục theo chiều ngược lại (từ Đông sang Tây) so với phần lớn các hành tinh khác?',
    Answer: 'SAO KIM',
    Alternatives: 'SAO KIM; SAO HÔM; SAO MAI; VENUS',
  },
  {
    Order: 2,
    Prompt: 'Tỉnh nào ở cực Nam Tổ quốc có ba mặt giáp biển và sở hữu Vườn quốc gia Mũi Cà Mau?',
    Answer: 'CÀ MAU',
    Alternatives: 'CA MAU; TỈNH CÀ MAU',
  },
  {
    Order: 3,
    Prompt: 'Khí nào chiếm tỷ lệ thể tích lớn nhất (khoảng 78%) trong khí quyển Trái Đất?',
    Answer: 'NITƠ',
    Alternatives: 'NITO; NITROGEN; KHÍ NITƠ',
  },
];

async function main() {
  const outDir = path.resolve('../bo-de-thi-dau');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Tạo file Excel bộ đề chuẩn thi đấu đầy đủ: BoDe_ThiDau_Chuan.xlsx
  const wbFull = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(kdRiengData), 'KhoiDong_Rieng');
  xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(kdChungData), 'KhoiDong_Chung');
  xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(vcnvData), 'VCNV');
  xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(tangTocData), 'TangToc');
  xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(veDichData), 'VeDich');
  xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(tieBreakData), 'TieBreak');

  const fullXlsxPath = path.join(outDir, 'BoDe_ThiDau_Chuan.xlsx');
  xlsx.writeFile(wbFull, fullXlsxPath);
  console.log(`[OK] Đã tạo file Excel đầy đủ: ${fullXlsxPath}`);

  // Test nạp thử file Excel qua parser & validator của web
  const fullBuf = fs.readFileSync(fullXlsxPath);
  const fullParsed = parseExcelQuestionSet(fullBuf, 'Bộ đề Thi đấu Chuẩn');
  const fullVal = validateQuestionSet(fullParsed);
  console.log(`[Kiểm tra BoDe_ThiDau_Chuan.xlsx]: OK = ${fullVal.ok}`);
  if (!fullVal.ok) {
    console.error('Lỗi kiểm tra BoDe_ThiDau_Chuan:', fullVal.errors);
    process.exit(1);
  }

  // 2. Tạo file JSON bộ đề thi đấu chuẩn: BoDe_ThiDau_Chuan.json
  const fullJsonPath = path.join(outDir, 'BoDe_ThiDau_Chuan.json');
  fs.writeFileSync(fullJsonPath, JSON.stringify(fullParsed, null, 2), 'utf-8');
  console.log(`[OK] Đã tạo file JSON đầy đủ: ${fullJsonPath}`);

  // 3. Tạo file Excel chỉ chứa Khởi động riêng: BoDe_KhoiDong_Rieng.xlsx
  const wbRieng = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbRieng, xlsx.utils.json_to_sheet(kdRiengData), 'KhoiDong_Rieng');
  const riengXlsxPath = path.join(outDir, 'BoDe_KhoiDong_Rieng.xlsx');
  xlsx.writeFile(wbRieng, riengXlsxPath);
  console.log(`[OK] Đã tạo file Excel Khởi động riêng: ${riengXlsxPath}`);

  // Test nạp thử file Khởi động riêng qua parser & validator của web
  const riengBuf = fs.readFileSync(riengXlsxPath);
  const riengParsed = parseExcelQuestionSet(riengBuf, 'Bộ đề Khởi động riêng');
  const riengVal = validateQuestionSet(riengParsed);
  console.log(`[Kiểm tra BoDe_KhoiDong_Rieng.xlsx]: OK = ${riengVal.ok}`);
  if (!riengVal.ok) {
    console.error('Lỗi kiểm tra BoDe_KhoiDong_Rieng:', riengVal.errors);
    process.exit(1);
  }

  console.log('\n=== TẤT CẢ CÁC BỘ ĐỀ ĐỀU HỢP LỆ VÀ SẴN SÀNG NẠP TRÊN WEB! ===');
}

main().catch((err) => {
  console.error('Lỗi:', err);
  process.exit(1);
});
