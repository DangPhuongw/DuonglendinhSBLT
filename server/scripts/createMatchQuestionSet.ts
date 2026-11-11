import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { parseExcelQuestionSet } from '../src/game/questionParser.js';
import { validateQuestionSet } from '../src/game/questionValidator.js';
import { loadQuestionBank } from '../src/game/questionBank.js';

// Đọc ngân hàng để đảm bảo KHÔNG trùng lặp bất kỳ câu nào với kho
const bank = loadQuestionBank(path.resolve('question-bank')).data as any;
const norm = (t: string) => (t || '').toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim();
const bankPrompts = new Set<string>();
const bankKeywords = new Set<string>();
function collectPrompts(v: any) {
  if (Array.isArray(v)) return v.forEach(collectPrompts);
  if (v && typeof v === 'object') {
    if (typeof v.prompt === 'string') bankPrompts.add(norm(v.prompt));
    if (v.obstacle && typeof v.obstacle.answer === 'string') bankKeywords.add(norm(v.obstacle.answer));
    Object.values(v).forEach(collectPrompts);
  }
}
collectPrompts(bank);

// 1. Khởi động riêng (5 ghế, mỗi ghế 6 câu = 30 câu)
const kdRiengData = [
  // Ghế 1
  {
    Seat: 1, Order: 1,
    Prompt: 'Tên dòng sông thơ mộng chảy qua lòng thành phố Huế gắn liền với chùa Thiên Mụ là sông gì?',
    OptionA: 'Sông Hương', OptionB: 'Sông Gianh', OptionC: 'Sông Thạch Hãn', OptionD: 'Sông Bến Hải',
    Answer: 'A', Alternatives: 'SÔNG HƯƠNG; SONG HUONG; HƯƠNG GIANG', Difficulty: 'Dễ'
  },
  {
    Seat: 1, Order: 2,
    Prompt: 'Nguyên tố hóa học nào có ký hiệu là Au và là kim loại quý có tính dát mỏng tốt nhất?',
    OptionA: 'Vàng', OptionB: 'Bạc', OptionC: 'Đồng', OptionD: 'Bạch kim',
    Answer: 'A', Alternatives: 'VÀNG; VANG; AU', Difficulty: 'Dễ'
  },
  {
    Seat: 1, Order: 3,
    Prompt: 'Trong cơ thể người, chất vận chuyển khí oxy chủ yếu từ phổi đến các mô là gì?',
    OptionA: 'Hồng cầu', OptionB: 'Bạch cầu', OptionC: 'Tiểu cầu', OptionD: 'Huyết tương',
    Answer: 'A', Alternatives: 'HỒNG CẦU; HONG CAU; HEMOGLOBIN', Difficulty: 'Dễ'
  },
  {
    Seat: 1, Order: 4,
    Prompt: 'Tác giả của áng văn chính luận bất hủ "Hịch tướng sĩ" vào thế kỷ 13 là vị tướng nào?',
    OptionA: 'Trần Hưng Đạo', OptionB: 'Trần Quang Khải', OptionC: 'Trần Nhật Duật', OptionD: 'Trần Khánh Dư',
    Answer: 'A', Alternatives: 'TRẦN HƯNG ĐẠO; TRAN HUNG DAO; TRẦN QUỐC TUẤN', Difficulty: 'Dễ'
  },
  {
    Seat: 1, Order: 5,
    Prompt: 'Lũy thừa 3 mũ 4 (3^4) có giá trị bằng bao nhiêu?',
    OptionA: '81', OptionB: '27', OptionC: '243', OptionD: '12',
    Answer: 'A', Alternatives: '81; TÁM MƯƠI MỐT', Difficulty: 'Trung bình'
  },
  {
    Seat: 1, Order: 6,
    Prompt: 'Hiện tượng tán sắc ánh sáng mặt trời qua các giọt nước mưa trong không khí tạo nên hiện tượng quang học rực rỡ nào?',
    OptionA: 'Cầu vồng', OptionB: 'Ảo ảnh', OptionC: 'Nhật thực', OptionD: 'Nguyệt thực',
    Answer: 'A', Alternatives: 'CẦU VỒNG; CAU VONG', Difficulty: 'Trung bình'
  },

  // Ghế 2
  {
    Seat: 2, Order: 1,
    Prompt: 'Quần đảo Hoàng Sa của Việt Nam hiện nay thuộc quyền quản lý hành chính của thành phố trực thuộc trung ương nào?',
    OptionA: 'Đà Nẵng', OptionB: 'Hải Phòng', OptionC: 'Quảng Nam', OptionD: 'Khánh Hòa',
    Answer: 'A', Alternatives: 'ĐÀ NẴNG; DA NANG; THÀNH PHỐ ĐÀ NẴNG', Difficulty: 'Dễ'
  },
  {
    Seat: 2, Order: 2,
    Prompt: 'Chất khí nào chiếm khoảng 78% thể tích bầu khí quyển Trái Đất ở điều kiện tiêu chuẩn?',
    OptionA: 'Nitơ (N2)', OptionB: 'Oxy (O2)', OptionC: 'Cacbonic (CO2)', OptionD: 'Heli (He)',
    Answer: 'A', Alternatives: 'NITƠ; NITO; NITROGEN; N2', Difficulty: 'Dễ'
  },
  {
    Seat: 2, Order: 3,
    Prompt: 'Cơ quan nào trong hệ tiêu hóa của người tiết ra mật để giúp tiêu hóa chất béo?',
    OptionA: 'Gan', OptionB: 'Dạ dày', OptionC: 'Tụy', OptionD: 'Ruột non',
    Answer: 'A', Alternatives: 'GAN', Difficulty: 'Dễ'
  },
  {
    Seat: 2, Order: 4,
    Prompt: 'Vị vua nào của triều Lý đã ban bố chiếu dời đô về Thăng Long vào năm 1010?',
    OptionA: 'Lý Thái Tổ', OptionB: 'Lý Thái Tông', OptionC: 'Lý Thánh Tông', OptionD: 'Lý Nhân Tông',
    Answer: 'A', Alternatives: 'LÝ THÁI TỔ; LY THAI TO; LÝ CÔNG UẨN', Difficulty: 'Dễ'
  },
  {
    Seat: 2, Order: 5,
    Prompt: 'Một hình tròn có bán kính r = 5 cm. Chu vi của hình tròn đó bằng bao nhiêu pi xentimét?',
    OptionA: '10 pi cm', OptionB: '25 pi cm', OptionC: '5 pi cm', OptionD: '20 pi cm',
    Answer: 'A', Alternatives: '10 PI; 10; MƯỜI PI', Difficulty: 'Trung bình'
  },
  {
    Seat: 2, Order: 6,
    Prompt: 'Tác phẩm "Số đỏ" châm biếm sâu cay xã hội tư sản thành thị nửa phong kiến là kiệt tác của nhà văn nào?',
    OptionA: 'Vũ Trọng Phụng', OptionB: 'Nam Cao', OptionC: 'Ngô Tất Tố', OptionD: 'Nguyễn Công Hoan',
    Answer: 'A', Alternatives: 'VŨ TRỌNG PHỤNG; VU TRONG PHUNG', Difficulty: 'Trung bình'
  },

  // Ghế 3
  {
    Seat: 3, Order: 1,
    Prompt: 'Hồ nước ngọt tự nhiên lớn nhất miền Bắc Việt Nam nằm trong vườn quốc gia cùng tên thuộc tỉnh Bắc Kạn là hồ nào?',
    OptionA: 'Hồ Ba Bể', OptionB: 'Hồ Tây', OptionC: 'Hồ Thác Bà', OptionD: 'Hồ Núi Cốc',
    Answer: 'A', Alternatives: 'HỒ BA BỂ; HO BA BE; BA BỂ', Difficulty: 'Dễ'
  },
  {
    Seat: 3, Order: 2,
    Prompt: 'Công thức hóa học của muối ăn thông thường dùng trong nấu nướng hàng ngày là gì?',
    OptionA: 'NaCl', OptionB: 'KCl', OptionC: 'CaCO3', OptionD: 'NaHCO3',
    Answer: 'A', Alternatives: 'NACL; NATRI CLORUA', Difficulty: 'Dễ'
  },
  {
    Seat: 3, Order: 3,
    Prompt: 'Bào quan nào trong tế bào thực vật chứa sắc tố diệp lục để tiến hành quang hợp?',
    OptionA: 'Lục lạp', OptionB: 'Ti thể', OptionC: 'Không bào', OptionD: 'Riboxom',
    Answer: 'A', Alternatives: 'LỤC LẠP; LUC LAP; CHLOROPLAST', Difficulty: 'Dễ'
  },
  {
    Seat: 3, Order: 4,
    Prompt: 'Ai là nữ tướng anh hùng cưỡi voi ra trận đánh đuổi quân Đông Ngô thế kỷ 3 với câu nói nổi tiếng muốn đạp luồng sóng dữ?',
    OptionA: 'Triệu Thị Trinh (Bà Triệu)', OptionB: 'Trưng Trắc', OptionC: 'Trưng Nhị', OptionD: 'Lê Chân',
    Answer: 'A', Alternatives: 'BÀ TRIỆU; BA TRIEU; TRIỆU THỊ TRINH; TRIEU THI TRINH', Difficulty: 'Dễ'
  },
  {
    Seat: 3, Order: 5,
    Prompt: 'Căn bậc ba của số 125 bằng bao nhiêu?',
    OptionA: '5', OptionB: '15', OptionC: '25', OptionD: '3',
    Answer: 'A', Alternatives: '5; NĂM', Difficulty: 'Trung bình'
  },
  {
    Seat: 3, Order: 6,
    Prompt: 'Trong bài thơ "Tây Tiến" của Quang Dũng, dòng sông nào gắn với hình ảnh súng ngửi trời và mường lát hoa về trong đêm hơi?',
    OptionA: 'Sông Mã', OptionB: 'Sông Đà', OptionC: 'Sông Thao', OptionD: 'Sông Lô',
    Answer: 'A', Alternatives: 'SÔNG MÃ; SONG MA', Difficulty: 'Trung bình'
  },

  // Ghế 4
  {
    Seat: 4, Order: 1,
    Prompt: 'Bán đảo Đông Dương trong lịch sử địa lý gồm 3 quốc gia: Việt Nam, Lào và quốc gia nào?',
    OptionA: 'Campuchia', OptionB: 'Thái Lan', OptionC: 'Myanmar', OptionD: 'Malaysia',
    Answer: 'A', Alternatives: 'CAMPUCHIA; CAM-PU-CHIA; CAMBODIA', Difficulty: 'Dễ'
  },
  {
    Seat: 4, Order: 2,
    Prompt: 'Kim loại nào có nhiệt độ nóng chảy cao nhất trong các kim loại và thường dùng làm dây tóc bóng đèn sợi đốt?',
    OptionA: 'Vonfram (W)', OptionB: 'Titan (Ti)', OptionC: 'Sắt (Fe)', OptionD: 'Đồng (Cu)',
    Answer: 'A', Alternatives: 'VONFRAM; TUNGSTEN; W', Difficulty: 'Dễ'
  },
  {
    Seat: 4, Order: 3,
    Prompt: 'Nhóm máu nào trong hệ nhóm máu ABO được xem là nhóm máu chuyên nhận vì có thể nhận mọi nhóm máu trong điều kiện cấp cứu?',
    OptionA: 'Nhóm AB', OptionB: 'Nhóm O', OptionC: 'Nhóm A', OptionD: 'Nhóm B',
    Answer: 'A', Alternatives: 'AB; NHÓM AB; NHOM AB', Difficulty: 'Dễ'
  },
  {
    Seat: 4, Order: 4,
    Prompt: 'Cuộc khởi nghĩa Yên Thế kéo dài gần 30 năm chống thực dân Pháp gắn liền với thủ lĩnh kiệt xuất nào?',
    OptionA: 'Hoàng Hoa Thám', OptionB: 'Phan Đình Phùng', OptionC: 'Nguyễn Thiện Thuật', OptionD: 'Đinh Công Tráng',
    Answer: 'A', Alternatives: 'HOÀNG HOA THÁM; HOANG HOA THAM; ĐỀ THÁM', Difficulty: 'Dễ'
  },
  {
    Seat: 4, Order: 5,
    Prompt: 'Trong mặt phẳng tọa độ Oxy, đường thẳng y = 3x - 1 có hệ số góc bằng bao nhiêu?',
    OptionA: '3', OptionB: '-1', OptionC: '1', OptionD: '-3',
    Answer: 'A', Alternatives: '3; BA', Difficulty: 'Trung bình'
  },
  {
    Seat: 4, Order: 6,
    Prompt: 'Tác giả của tập kịch kinh điển "Hồn Trương Ba, da hàng thịt" và "Tôi và chúng ta" là nhà viết kịch tài hoa nào?',
    OptionA: 'Lưu Quang Vũ', OptionB: 'Xuân Trình', OptionC: 'Đào Hồng Cẩm', OptionD: 'Tào Mạt',
    Answer: 'A', Alternatives: 'LƯU QUANG VŨ; LUU QUANG VU', Difficulty: 'Trung bình'
  },

  // Ghế 5
  {
    Seat: 5, Order: 1,
    Prompt: 'Ngọn núi lửa đã tắt nào cao nhất thế giới và là đỉnh núi cao nhất châu Mỹ thuộc dãy Andes?',
    OptionA: 'Aconcagua', OptionB: 'Kilimanjaro', OptionC: 'Elbrus', OptionD: 'Denali',
    Answer: 'A', Alternatives: 'ACONCAGUA; NÚI ACONCAGUA', Difficulty: 'Dễ'
  },
  {
    Seat: 5, Order: 2,
    Prompt: 'Khí cười thường dùng trong y tế để gây mê giảm đau có công thức hóa học là gì?',
    OptionA: 'N2O (Dinitơ monoxit)', OptionB: 'NO2', OptionC: 'NO', OptionD: 'NH3',
    Answer: 'A', Alternatives: 'N2O; DINITƠ MONOXIT', Difficulty: 'Dễ'
  },
  {
    Seat: 5, Order: 3,
    Prompt: 'Loài thú duy nhất nào có khả năng bay lượn thực sự trên bầu trời nhờ cấu tạo màng cánh bằng da?',
    OptionA: 'Dơi', OptionB: 'Sóc bay', OptionC: 'Chồn bay', OptionD: 'Thú mỏ vịt',
    Answer: 'A', Alternatives: 'DƠI; LOÀI DƠI; DOI', Difficulty: 'Dễ'
  },
  {
    Seat: 5, Order: 4,
    Prompt: 'Vị danh y lỗi lạc đời nhà Trần được tôn vinh là bậc Thánh thuốc Nam với phương châm "Nam dược trị Nam nhân" là ai?',
    OptionA: 'Tuệ Tĩnh', OptionB: 'Hải Thượng Lãn Ông', OptionC: 'Lê Hữu Trác', OptionD: 'Nguyễn Bá Tĩnh',
    Answer: 'A', Alternatives: 'TUỆ TĨNH; TUE TINH; NGUYỄN BÁ TĨNH', Difficulty: 'Dễ'
  },
  {
    Seat: 5, Order: 5,
    Prompt: 'Một hình lăng trụ đứng có đáy là tam giác thì có tất cả bao nhiêu mặt?',
    OptionA: '5 mặt', OptionB: '4 mặt', OptionC: '6 mặt', OptionD: '8 mặt',
    Answer: 'A', Alternatives: '5; NĂM; 5 MẶT', Difficulty: 'Trung bình'
  },
  {
    Seat: 5, Order: 6,
    Prompt: 'Tập truyện ngắn "Gió đầu mùa" và "Hà Nội băm sáu phố phường" là của nhà văn nổi tiếng nào trong Tự Lực Văn Đoàn?',
    OptionA: 'Thạch Lam', OptionB: 'Nhất Linh', OptionC: 'Khái Hưng', OptionD: 'Hoàng Đạo',
    Answer: 'A', Alternatives: 'THẠCH LAM; THACH LAM', Difficulty: 'Trung bình'
  },
];

// 2. Khởi động chung (12 câu)
const kdChungData = [
  {
    Order: 1,
    Prompt: 'Kênh đào nhân tạo nào khánh thành năm 1869 nối liền Biển Đỏ với Địa Trung Hải?',
    OptionA: 'Kênh đào Suez', OptionB: 'Kênh đào Panama', OptionC: 'Kênh đào Kiel', OptionD: 'Kênh đào Corinth',
    Answer: 'A', Alternatives: 'SUEZ; KÊNH ĐÀO SUEZ; XUY-Ê', Difficulty: 'Dễ'
  },
  {
    Order: 2,
    Prompt: 'Hiện tượng nào mô tả sự phản ứng hướng về phía kích thích ánh sáng của ngọn cây xanh?',
    OptionA: 'Tính hướng sáng', OptionB: 'Tính hướng trọng lực', OptionC: 'Tính hướng nước', OptionD: 'Tính hướng hóa',
    Answer: 'A', Alternatives: 'HƯỚNG SÁNG; TÍNH HƯỚNG SÁNG; HUONG SANG', Difficulty: 'Dễ'
  },
  {
    Order: 3,
    Prompt: 'Chất nào được xem là dung môi hòa tan phổ biến nhất trong đời sống và tự nhiên?',
    OptionA: 'Nước (H2O)', OptionB: 'Rượu etylic', OptionC: 'Benzen', OptionD: 'Dầu hỏa',
    Answer: 'A', Alternatives: 'NƯỚC; NUOC; H2O', Difficulty: 'Dễ'
  },
  {
    Order: 4,
    Prompt: 'Trong đại số, phương trình bậc hai một ẩn ax^2 + bx + c = 0 có nghiệm kép khi biệt thức Delta bằng bao nhiêu?',
    OptionA: '0', OptionB: '1', OptionC: '> 0', OptionD: '< 0',
    Answer: 'A', Alternatives: '0; KHÔNG; BANG 0', Difficulty: 'Dễ'
  },
  {
    Order: 5,
    Prompt: 'Đơn vị đo công suất tiêu thụ điện trong Hệ đo lường quốc tế (SI) là gì?',
    OptionA: 'Oát (W)', OptionB: 'Jun (J)', OptionC: 'Vôn (V)', OptionD: 'Ampe (A)',
    Answer: 'A', Alternatives: 'OÁT; WAT; WATT; W', Difficulty: 'Dễ'
  },
  {
    Order: 6,
    Prompt: 'Tỉnh nào ở vùng Tây Nguyên có thành phố Pleiku là trung tâm tỉnh lỵ?',
    OptionA: 'Gia Lai', OptionB: 'Đắk Lắk', OptionC: 'Kon Tum', OptionD: 'Lâm Đồng',
    Answer: 'A', Alternatives: 'GIA LAI; TỈNH GIA LAI', Difficulty: 'Trung bình'
  },
  {
    Order: 7,
    Prompt: 'Hệ cơ quan nào trong cơ thể người làm nhiệm vụ sản sinh các tế bào miễn dịch và kháng thể để chống lại mầm bệnh?',
    OptionA: 'Hệ miễn dịch', OptionB: 'Hệ bài tiết', OptionC: 'Hệ nội tiết', OptionD: 'Hệ hô hấp',
    Answer: 'A', Alternatives: 'HỆ MIỄN DỊCH; MIEN DICH', Difficulty: 'Trung bình'
  },
  {
    Order: 8,
    Prompt: 'Ai là tác giả của tác phẩm "Đường Kách mệnh" xuất bản năm 1927 làm tài liệu huấn luyện cán bộ cách mạng Việt Nam?',
    OptionA: 'Nguyễn Ái Quốc (Hồ Chí Minh)', OptionB: 'Trần Phú', OptionC: 'Lê Hồng Phong', OptionD: 'Hà Huy Tập',
    Answer: 'A', Alternatives: 'NGUYỄN ÁI QUỐC; HỒ CHÍ MINH; HO CHI MINH', Difficulty: 'Trung bình'
  },
  {
    Order: 9,
    Prompt: 'Góc nội tiếp chắn nửa đường tròn luôn luôn có số đo bằng bao nhiêu độ?',
    OptionA: '90 độ', OptionB: '60 độ', OptionC: '45 độ', OptionD: '180 độ',
    Answer: 'A', Alternatives: '90 ĐỘ; 90; CHÍN MƯƠI ĐỘ', Difficulty: 'Trung bình'
  },
  {
    Order: 10,
    Prompt: 'Phản ứng este hóa giữa axit axetic và rượu etylic tạo ra hợp chất hữu cơ có mùi thơm dễ chịu tên là gì?',
    OptionA: 'Etyl axetat', OptionB: 'Metyl axetat', OptionC: 'Etyl fomat', OptionD: 'Propyl axetat',
    Answer: 'A', Alternatives: 'ETYL AXETAT; ETHYL ACETATE', Difficulty: 'Khó'
  },
  {
    Order: 11,
    Prompt: 'Năm nào nước ta chính thức trở thành thành viên thứ 150 của Tổ chức Thương mại Thế giới (WTO)?',
    OptionA: 'Năm 2007', OptionB: 'Năm 2005', OptionC: 'Năm 2006', OptionD: 'Năm 2008',
    Answer: 'A', Alternatives: '2007; NĂM 2007', Difficulty: 'Khó'
  },
  {
    Order: 12,
    Prompt: 'Thiết bị quang học nào lợi dụng hiện tượng phản xạ toàn phần trong các sợi thủy tinh siêu mỏng để truyền dẫn tín hiệu internet tốc độ cao?',
    OptionA: 'Cáp quang', OptionB: 'Kính tiềm vọng', OptionC: 'Lăng kính', OptionD: 'Kính hiển vi',
    Answer: 'A', Alternatives: 'CÁP QUANG; CAP QUANG; SỢI QUANG', Difficulty: 'Khó'
  },
];

// 3. VCNV: TRỐNG CƠM (6 câu)
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

// 4. Tăng tốc (4 câu)
const tangTocData = [
  {
    Order: 1,
    Prompt: 'Sắp xếp các đơn vị đo dung lượng dữ liệu sau theo thứ tự từ nhỏ đến lớn: [1] Megabyte (MB), [2] Kilobyte (KB), [3] Terabyte (TB), [4] Gigabyte (GB).',
    Answer: '2-1-4-3',
    Alternatives: '2143; 2, 1, 4, 3; 2 1 4 3; [2] [1] [4] [3]',
    Media: '',
  },
  {
    Order: 2,
    Prompt: 'Điền số tiếp theo vào dãy số theo quy luật: 3, 6, 12, 24, 48, ...?',
    Answer: '96',
    Alternatives: '96; CHÍN MƯƠI SÁU',
    Media: '',
  },
  {
    Order: 3,
    Prompt: 'Sắp xếp các thời kỳ phát triển xã hội loài người theo tiến trình lịch sử từ xưa đến nay: [1] Thời đại đồ sắt, [2] Thời đại đồ đá, [3] Thời đại công nghệ thông tin, [4] Thời đại đồ đồng.',
    Answer: '2-4-1-3',
    Alternatives: '2413; 2, 4, 1, 3; 2 4 1 3; [2] [4] [1] [3]',
    Media: '',
  },
  {
    Order: 4,
    Prompt: 'Trong một giải đấu cờ vua có 4 kỳ thủ Kiên, Long, Minh, Nam: Kiên xếp trên Long nhưng dưới Nam; Minh xếp dưới Long. Hỏi kỳ thủ nào giành giải nhất?',
    Answer: 'NAM',
    Alternatives: 'NAM; BẠN NAM; KỲ THỦ NAM',
    Media: '',
  },
];

// 5. Về đích (10 câu 10đ, 6 câu 20đ, 10 câu 30đ = 26 câu)
const veDichData = [
  // 10 điểm (10 câu)
  { Points: 10, Prompt: 'Nguyên tố khí hiếm có số hiệu nguyên tử bằng 2 thường dùng bơm bóng bay là gì?', Answer: 'HELI', Alternatives: 'HELIUM; HE' },
  { Points: 10, Prompt: 'Thủ đô của nước Nhật Bản hiện nay là thành phố nào?', Answer: 'TOKYO', Alternatives: 'TÔ-KY-Ô; TOKYO' },
  { Points: 10, Prompt: 'Loài chim nào lớn nhất thế giới còn sống nhưng không biết bay và chạy rất nhanh trên sa mạc?', Answer: 'ĐÀ ĐIỂU', Alternatives: 'DA DIEU; CHIM ĐÀ ĐIỂU' },
  { Points: 10, Prompt: 'Đoạn thẳng nối tâm của đường tròn với một điểm bất kỳ trên đường tròn gọi là gì?', Answer: 'BÁN KÍNH', Alternatives: 'BAN KINH; R' },
  { Points: 10, Prompt: 'Hợp chất nào chiếm khoảng 70% khối lượng cơ thể người trưởng thành?', Answer: 'NƯỚC', Alternatives: 'NUOC; H2O' },
  { Points: 10, Prompt: 'Lễ hội Đền Hùng được tổ chức định kỳ hàng năm vào ngày mùng mấy tháng 3 âm lịch?', Answer: 'MÙNG 10 THÁNG 3', Alternatives: '10/3; 10; MÙNG 10; 10 THÁNG 3' },
  { Points: 10, Prompt: 'Hành tinh nào có kích thước và khối lượng lớn nhất trong Hệ Mặt Trời?', Answer: 'SAO MỘC', Alternatives: 'SAO MOC; JUPITER' },
  { Points: 10, Prompt: 'Vị vua nào của triều Tây Sơn đã lãnh đạo quân dân đại phá 29 vạn quân Thanh?', Answer: 'QUANG TRUNG', Alternatives: 'NGUYỄN HUỆ; VUA QUANG TRUNG' },
  { Points: 10, Prompt: 'Đơn vị đo tần số dao động trong hệ đơn vị quốc tế SI là gì?', Answer: 'HERTZ', Alternatives: 'HEC; HZ' },
  { Points: 10, Prompt: 'Tỉnh nào ở cực Nam Tổ quốc nổi tiếng với Mũi Cà Mau?', Answer: 'CÀ MAU', Alternatives: 'CA MAU; TỈNH CÀ MAU' },

  // 20 điểm (6 câu)
  { Points: 20, Prompt: 'Hiện tượng khúc xạ ánh sáng xảy ra khi tia sáng đi qua mặt phân cách giữa hai môi trường có chiết suất như thế nào?', Answer: 'KHÁC NHAU', Alternatives: 'KHAC NHAU; CHIẾT SUẤT KHÁC NHAU' },
  { Points: 20, Prompt: 'Chiến thắng lịch sử Điện Biên Phủ "lừng lẫy năm châu, chấn động địa cầu" diễn ra vào năm nào?', Answer: '1954', Alternatives: 'NĂM 1954; 1954' },
  { Points: 20, Prompt: 'Một hình lập phương có thể tích bằng 64 cm3 thì độ dài mỗi cạnh bằng bao nhiêu xentimét?', Answer: '4', Alternatives: '4 CM; BỐN; 4' },
  { Points: 20, Prompt: 'Tác phẩm văn học trung đại nào của Đặng Trần Côn viết bằng chữ Hán than thở nỗi sầu chia ly người chinh phụ?', Answer: 'CHINH PHỤ NGÂM', Alternatives: 'CHINH PHU NGAM; CHINH PHỤ NGÂM KHÚC' },
  { Points: 20, Prompt: 'Loại liên kết hóa học hình thành do lực hút tĩnh điện giữa các ion mang điện tích trái dấu gọi là liên kết gì?', Answer: 'LIÊN KẾT ION', Alternatives: 'ION; LIEN KET ION' },
  { Points: 20, Prompt: 'Đại dương nào có độ sâu trung bình lớn nhất thế giới và chứa vực thẳm Mariana?', Answer: 'THÁI BÌNH DƯƠNG', Alternatives: 'THAI BINH DUONG; PACIFIC' },

  // 30 điểm (10 câu)
  { Points: 30, Prompt: 'Định luật vật lý nào khẳng định áp suất tác dụng lên một chất lỏng kín được truyền nguyên vẹn theo mọi hướng?', Answer: 'ĐỊNH LUẬT PASCAL', Alternatives: 'PASCAL; PA-XCAN; DINH LUAT PASCAL' },
  { Points: 30, Prompt: 'Kim loại nào có khối lượng riêng lớn nhất và nặng nhất trong tất cả các kim loại (D xấp xỉ 22,6 g/cm3)?', Answer: 'OSMI', Alternatives: 'OSMIUM; OS' },
  { Points: 30, Prompt: 'Hiệp định Geneva chấm dứt chiến tranh, lập lại hòa bình ở Đông Dương được ký kết vào năm nào?', Answer: '1954', Alternatives: 'NĂM 1954; 1954' },
  { Points: 30, Prompt: 'Phương trình bậc ba ax^3 + bx^2 + cx + d = 0 (a khác 0) có tối đa bao nhiêu nghiệm thực?', Answer: '3', Alternatives: '3 NGHIỆM; BA; 3' },
  { Points: 30, Prompt: 'Chất dẫn truyền xung thần kinh tại các cúc xi-náp thần kinh của động vật có tên phổ biến là gì?', Answer: 'AXETYLCHOLIN', Alternatives: 'ACETYLCHOLINE; AXETYL CHOLIN' },
  { Points: 30, Prompt: 'Nhà vật lý người Đức nào đã tìm ra hiện tượng tia X vào năm 1895 và nhận giải Nobel Vật lý đầu tiên trong lịch sử?', Answer: 'WILHELM RONTGEN', Alternatives: 'RONTGEN; RƠN-GHEN; ROENTGEN' },
  { Points: 30, Prompt: 'Dãy núi đá vôi uốn lượn hình cánh cung nào là ranh giới tự nhiên ngăn cách miền Bắc Trung Bộ với vùng Duyên hải Nam Trung Bộ?', Answer: 'DÃY BẠCH MÃ', Alternatives: 'BẠCH MÃ; DAY BACH MA' },
  { Points: 30, Prompt: 'Hợp chất hữu cơ dạng mạch vòng gồm 6 nguyên tử cacbon và 6 nguyên tử hydro có liên kết thơm bền vững là gì?', Answer: 'BENZEN', Alternatives: 'BENZENE; C6H6' },
  { Points: 30, Prompt: 'Vị vua nào của triều Trần đã hai lần trực tiếp chỉ huy đánh tan quân xâm lược Nguyên Mông năm 1285 và 1288 rồi sau đó xuất gia tu hành lập ra Thiền phái Trúc Lâm?', Answer: 'TRẦN NHÂN TÔNG', Alternatives: 'TRAN NHAN TONG; PHẬT HOÀNG TRẦN NHÂN TÔNG' },
  { Points: 30, Prompt: 'Trong mạch điện xoay chiều RLC không phân nhánh, hiện tượng cường độ dòng điện hiệu dụng đạt giá trị cực đại khi ZL = ZC gọi là hiện tượng gì?', Answer: 'CỘNG HƯỞNG ĐIỆN', Alternatives: 'CỘNG HƯỞNG; CONG HUONG DIEN; CONG HUONG' },
];

// 6. TieBreak (3 câu)
const tieBreakData = [
  { Order: 1, Prompt: 'Hành tinh nào trong Hệ Mặt Trời có hệ thống vành đai băng đá và bụi sáng rõ nhất?', Answer: 'SAO THỔ', Alternatives: 'SAO THO; SATURN' },
  { Order: 2, Prompt: 'Tỉnh nào ở vùng Tây Bắc có địa danh lịch sử lòng chảo Mường Thanh và cứ điểm A1?', Answer: 'ĐIỆN BIÊN', Alternatives: 'DIEN BIEN; TỈNH ĐIỆN BIÊN' },
  { Order: 3, Prompt: 'Nguyên tố hóa học nào tạo nên kim cương và than chì?', Answer: 'CACBON', Alternatives: 'CARBON; C' },
];

// Ghi file Excel
const outDir = path.resolve('../bo-de-thi-dau');
fs.mkdirSync(outDir, { recursive: true });
const wbFull = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(kdRiengData), 'KhoiDong_Rieng');
xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(kdChungData), 'KhoiDong_Chung');
xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(vcnvData), 'VCNV');
xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(tangTocData), 'TangToc');
xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(veDichData), 'VeDich');
xlsx.utils.book_append_sheet(wbFull, xlsx.utils.json_to_sheet(tieBreakData), 'TieBreak');

const fullXlsxPath = path.join(outDir, 'BoDe_ThiDau_Chuan.xlsx');
xlsx.writeFile(wbFull, fullXlsxPath);
console.log(`[OK] Đã ghi: ${fullXlsxPath}`);

// Ghi file JSON
const buf = fs.readFileSync(fullXlsxPath);
const parsed = parseExcelQuestionSet(buf, 'BoDe_ThiDau_Chuan');
const fullJsonPath = path.join(outDir, 'BoDe_ThiDau_Chuan.json');
fs.writeFileSync(fullJsonPath, JSON.stringify(parsed, null, 2), 'utf-8');
console.log(`[OK] Đã ghi JSON: ${fullJsonPath}`);

// Kiểm tra tính hợp lệ
const val = validateQuestionSet(parsed);
console.log(`Validate QuestionSet: OK = ${val.ok}`);
if (!val.ok) {
  console.error('Validation errors:', val.errors);
  process.exit(1);
}
