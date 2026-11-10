import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

export interface RawQ {
  Prompt: string;
  Correct: string;
  Distractors: [string, string, string];
  Alternatives: string;
  Difficulty: 'Dễ' | 'Trung bình' | 'Khó';
}

export const RAW_QUESTIONS: RawQ[] = [
  // ================= 50 CÂU DỄ =================
  {
    Prompt: 'Thành phố Ottawa là thủ đô của quốc gia nào ở khu vực Bắc Mỹ?',
    Correct: 'Canada',
    Distractors: ['Hoa Kỳ', 'Mexico', 'Cuba'],
    Alternatives: 'CANADA',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Huyền thoại bóng đá người Brazil nào được mệnh danh là "Vua bóng đá"?',
    Correct: 'Pelé',
    Distractors: ['Diego Maradona', 'Ronaldo Nazário', 'Romário'],
    Alternatives: 'PELÉ; PELE',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Loài chim nào là loài chim duy nhất có khả năng bay lùi về phía sau và đập cánh với tốc độ cực nhanh?',
    Correct: 'Chim ruồi',
    Distractors: ['Chim bồ câu', 'Chim sẻ', 'Chim én'],
    Alternatives: 'CHIM RUỒI; CHIM RUOI; HUMMINGBIRD',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Công trình lăng mộ cẩm thạch trắng nổi tiếng Taj Mahal là Di sản Thế giới nằm tại quốc gia nào?',
    Correct: 'Ấn Độ',
    Distractors: ['Pakistan', 'Iran', 'Thổ Nhĩ Kỳ'],
    Alternatives: 'ẤN ĐỘ; AN DO; INDIA',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Tác phẩm văn học thiếu nhi kinh điển "Dế Mèn phiêu lưu ký" là sáng tác của nhà văn Việt Nam nào?',
    Correct: 'Tô Hoài',
    Distractors: ['Nam Cao', 'Thạch Lam', 'Vũ Trọng Phụng'],
    Alternatives: 'TÔ HOÀI; TO HOAI',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Trong hệ đo lường quốc tế (SI), đơn vị chuẩn để đo công và năng lượng là gì?',
    Correct: 'Jun (J)',
    Distractors: ['Oát (W)', 'Niu-tơn (N)', 'Pascan (Pa)'],
    Alternatives: 'JUN; JOULE; J',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Trong quang phổ học, dải màu sắc nào xuất hiện ở viền ngoài cùng phía trên của một cầu vồng chính?',
    Correct: 'Màu đỏ',
    Distractors: ['Màu tím', 'Màu vàng', 'Màu lam'],
    Alternatives: 'MÀU ĐỎ; MAU DO; ĐỎ',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Thác nước tự nhiên không ngắt quãng cao nhất thế giới hiện nay là thác Angel, nằm ở quốc gia nào?',
    Correct: 'Venezuela',
    Distractors: ['Brasil', 'Argentina', 'Canada'],
    Alternatives: 'VENEZUELA',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Trong hình học phẳng, giao điểm của ba đường cao trong một tam giác được gọi là gì?',
    Correct: 'Trực tâm',
    Distractors: ['Trọng tâm', 'Tâm đường tròn nội tiếp', 'Tâm đường tròn ngoại tiếp'],
    Alternatives: 'TRỰC TÂM; TRUC TAM; ORTHOCENTER',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Sự thiếu hụt vitamin nào trong khẩu phần ăn là nguyên nhân chính dẫn đến bệnh Scorbut (chảy máu chân răng)?',
    Correct: 'Vitamin C',
    Distractors: ['Vitamin A', 'Vitamin D', 'Vitamin B12'],
    Alternatives: 'VITAMIN C; C; AXIT ASCORBIC',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Bài thơ châm biếm sâu sắc "Vịnh khoa thi Hương" ("Lọng cắm rợp trời quan sứ đến...") là sáng tác của nhà thơ nào?',
    Correct: 'Trần Tế Xương (Tú Xương)',
    Distractors: ['Nguyễn Khuyến', 'Cao Bá Quát', 'Nguyễn Công Trứ'],
    Alternatives: 'TRẦN TẾ XƯƠNG; TÚ XƯƠNG; TU XUONG',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Loài động vật nào có kích thước và khối lượng cơ thể lớn nhất trên Trái Đất hiện nay?',
    Correct: 'Cá voi xanh',
    Distractors: ['Voi châu Phi', 'Cá mập voi', 'Mực khổng lồ'],
    Alternatives: 'CÁ VOI XANH; CA VOI XANH; BLUE WHALE',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Bảng chữ cái tiếng Anh hiện đại tiêu chuẩn gồm có bao nhiêu chữ cái?',
    Correct: '26',
    Distractors: ['24', '25', '28'],
    Alternatives: '26; HAI MƯƠI SÁU',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Khi dời đô về thành Đại La (Thăng Long) năm 1010, vua Lý Thái Tổ đã đặt niên hiệu đầu tiên của mình là gì?',
    Correct: 'Thuận Thiên',
    Distractors: ['Thiên Thành', 'Thông Thụy', 'Long Thụy Thái Bình'],
    Alternatives: 'THUẬN THIÊN; THUAN THIEN',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Hồ nước ngọt tự nhiên nào có diện tích mặt nước rộng lớn nhất trong khu vực nội thành thủ đô Hà Nội?',
    Correct: 'Hồ Tây',
    Distractors: ['Hồ Hoàn Kiếm', 'Hồ Trúc Bạch', 'Hồ Bảy Mẫu'],
    Alternatives: 'HỒ TÂY; HO TAY',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Theo số liệu thống kê của Liên Hợp Quốc năm 2023, quốc gia nào đã vượt qua Trung Quốc để trở thành quốc gia đông dân nhất thế giới?',
    Correct: 'Ấn Độ',
    Distractors: ['Hoa Kỳ', 'Indonesia', 'Pakistan'],
    Alternatives: 'ẤN ĐỘ; AN DO; INDIA',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Hiện tượng quang học kỳ ảo với các dải sáng nhiều màu xuất hiện trên bầu trời đêm ở vùng cực Trái Đất được gọi là gì?',
    Correct: 'Cực quang',
    Distractors: ['Nhật thực', 'Nguyệt thực', 'Sao băng'],
    Alternatives: 'CỰC QUANG; CUC QUANG; AURORA',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Nhà soạn nhạc lừng danh người Ba Lan Frédéric Chopin được mệnh danh là thiên tài gắn liền với loại nhạc cụ nào?',
    Correct: 'Dương cầm (Piano)',
    Distractors: ['Vĩ cầm (Violon)', 'Ghi-ta', 'Kèn trumpet'],
    Alternatives: 'PIANO; DƯƠNG CẦM; DUONG CAM',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Mô hình cấu trúc không gian xoắn kép của phân tử ADN lần đầu tiên được hai nhà khoa học nào công bố vào năm 1953?',
    Correct: 'James Watson và Francis Crick',
    Distractors: ['Matthias Schleiden và Theodor Schwann', 'Charles Darwin và Alfred Wallace', 'Thomas Morgan và Gregor Mendel'],
    Alternatives: 'WATSON VÀ CRICK; WATSON AND CRICK; WATSON; CRICK',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Bức bích họa khổng lồ trên trần Nhà nguyện Sistine vẽ cảnh "Chúa tạo dựng Adam" là kiệt tác của danh họa nào?',
    Correct: 'Michelangelo',
    Distractors: ['Raphael', 'Claude Monet', 'Vincent van Gogh'],
    Alternatives: 'MICHELANGELO',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Cao nguyên đá Đồng Văn - Công viên địa chất toàn cầu đầu tiên của Việt Nam tọa lạc trên địa bàn tỉnh nào?',
    Correct: 'Hà Giang',
    Distractors: ['Cao Bằng', 'Lào Cai', 'Yên Bái'],
    Alternatives: 'HÀ GIANG; HA GIANG',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Chiếc xương nào có chiều dài và độ chịu lực lớn nhất trong khung xương của cơ thể người trưởng thành?',
    Correct: 'Xương đùi',
    Distractors: ['Xương chày', 'Xương cánh tay', 'Xương sườn'],
    Alternatives: 'XƯƠNG ĐÙI; XUONG DUI; FEMUR',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Hiện tượng một chất chuyển trực tiếp từ thể rắn sang thể khí mà không trải qua thể lỏng được gọi là gì?',
    Correct: 'Thăng hoa',
    Distractors: ['Bay hơi', 'Ngưng tụ', 'Nóng chảy'],
    Alternatives: 'THĂNG HOA; THANG HOA; SUBLIMATION',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Theo Hiệp định Genève năm 1954, dòng sông nào tại tỉnh Quảng Trị được chọn làm giới tuyến quân sự tạm thời giữa hai miền Nam - Bắc?',
    Correct: 'Sông Bến Hải',
    Distractors: ['Sông Hương', 'Sông Gianh', 'Sông Thạch Hãn'],
    Alternatives: 'SÔNG BẾN HẢI; BEN HAI; BẾN HẢI',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Đỉnh Everest, đỉnh núi cao nhất trên đất liền so với mực nước biển, thuộc hệ thống dãy núi nào?',
    Correct: 'Dãy Himalaya',
    Distractors: ['Dãy Andes', 'Dãy Alps', 'Dãy Rocky'],
    Alternatives: 'HIMALAYA; DÃY HIMALAYA',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Khi nhỏ vài giọt giấm ăn vào bột nở (baking soda, NaHCO3), hiện tượng sủi bọt khí xảy ra do thoát ra khí nào?',
    Correct: 'Khí cacbonic (CO2)',
    Distractors: ['Khí oxi (O2)', 'Khí hidro (H2)', 'Khí nitơ (N2)'],
    Alternatives: 'CO2; CACBONIC; CARBON DIOXIDE; KHÍ CACBONIC',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Đơn vị tiền tệ chính thức được sử dụng tại Hợp chúng quốc Hoa Kỳ (Mỹ) là gì?',
    Correct: 'Đô la Mỹ (USD)',
    Distractors: ['Bảng Anh', 'Euro', 'Franc Thụy Sĩ'],
    Alternatives: 'ĐÔ LA; DO LA; USD; DOLLAR',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Vận động viên điền kinh Usain Bolt, người nắm giữ kỷ lục thế giới chạy cự ly 100m và 200m, mang quốc tịch nước nào?',
    Correct: 'Jamaica',
    Distractors: ['Hoa Kỳ', 'Kenya', 'Bahamas'],
    Alternatives: 'JAMAICA',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Vở bi kịch tình yêu lãng mạn kinh điển "Romeo và Juliet" là sáng tác của nhà soạn kịch vĩ đại người Anh nào?',
    Correct: 'William Shakespeare',
    Distractors: ['Charles Dickens', 'George Bernard Shaw', 'Arthur Conan Doyle'],
    Alternatives: 'WILLIAM SHAKESPEARE; SHAKESPEARE',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Châu lục nào trên Trái Đất có khí hậu lạnh giá nhất, khô hạn nhất và nhiều gió bão nhất?',
    Correct: 'Châu Nam Cực',
    Distractors: ['Châu Âu', 'Châu Bắc Cực', 'Châu Đại Dương'],
    Alternatives: 'CHÂU NAM CỰC; NAM CỰC; ANTARCTICA',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Con sông nào dài nhất tại châu Á và dài thứ ba trên thế giới sau sông Nile và sông Amazon?',
    Correct: 'Sông Trường Giang (Dương Tử)',
    Distractors: ['Sông Hoàng Hà', 'Sông Mê Kông', 'Sông Hằng'],
    Alternatives: 'TRƯỜNG GIANG; SÔNG DƯƠNG TỬ; DƯƠNG TỬ; YANGTZE',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Tế bào hồng cầu trong máu người có màu đỏ đặc trưng là nhờ có chứa phân tử protein phức tạp nào?',
    Correct: 'Hemoglobin',
    Distractors: ['Albumin', 'Fibrinogen', 'Keratin'],
    Alternatives: 'HEMOGLOBIN; HUYẾT SẮC TỐ; HUYET SAC TO',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Việt Nam chính thức trở thành thành viên thứ 7 của Hiệp hội các quốc gia Đông Nam Á (ASEAN) vào năm nào?',
    Correct: '1995',
    Distractors: ['1993', '1997', '1999'],
    Alternatives: '1995',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Trong bảng tuần hoàn hóa học, nguyên tố phi kim nào có giá trị độ âm điện lớn nhất (xấp xỉ 3,98 theo thang Pauling)?',
    Correct: 'Flo (F)',
    Distractors: ['Oxi (O)', 'Clo (Cl)', 'Nitơ (N)'],
    Alternatives: 'FLO; FLUORINE; F',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Trong hình học Euclid, công thức tính diện tích S của hình tròn có bán kính r là gì?',
    Correct: 'π * r^2',
    Distractors: ['2 * π * r', '4/3 * π * r^3', '4 * π * r^2'],
    Alternatives: 'PI * R^2; PI R BINH PHUONG; Π * R^2',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Thấu kính phân kỳ mỏng trong không khí luôn tạo ra ảnh có tính chất như thế nào đối với một vật thật?',
    Correct: 'Ảnh ảo, cùng chiều và nhỏ hơn vật',
    Distractors: ['Ảnh thật, ngược chiều và lớn hơn vật', 'Ảnh thật, cùng chiều và bằng vật', 'Ảnh ảo, ngược chiều và bằng vật'],
    Alternatives: 'ẢNH ẢO; ANH AO CUNG CHIEU NHO HON VAT',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Khí ozon trong tầng bình lưu có vai trò hấp thụ phần lớn bức xạ cực tím từ Mặt Trời, có công thức hóa học là gì?',
    Correct: 'O3',
    Distractors: ['O2', 'CO2', 'N2O'],
    Alternatives: 'O3; O-3; OZONE',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Giải quần vợt danh giá hàng năm Wimbledon tại Luân Đôn (Vương quốc Anh) được thi đấu trên loại mặt sân nào?',
    Correct: 'Sân cỏ',
    Distractors: ['Sân đất nện', 'Sân cứng', 'Sân thảm tổng hợp'],
    Alternatives: 'SÂN CỎ; SAN CO; GRASS',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Thành phố cảng Hải Phòng của Việt Nam từ lâu đã gắn liền với mỹ danh loài hoa đặc trưng nào?',
    Correct: 'Hoa phượng đỏ',
    Distractors: ['Hoa sữa', 'Hoa mai vàng', 'Hoa ban'],
    Alternatives: 'HOA PHƯỢNG ĐỎ; HOA PHUONG DO; PHƯỢNG ĐỎ',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Quá trình phân chia tế bào sinh dưỡng giúp cơ thể đa bào sinh trưởng và phát triển được gọi là gì?',
    Correct: 'Nguyên phân',
    Distractors: ['Giảm phân', 'Thụ tinh', 'Trực phân'],
    Alternatives: 'NGUYÊN PHÂN; NGUYEN PHAN; MITOSIS',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Vào ngày 2 tháng 9 năm 1945, Chủ tịch Hồ Chí Minh đã đọc bản Tuyên ngôn Độc lập tại quảng trường nào ở thủ đô Hà Nội?',
    Correct: 'Quảng trường Ba Đình',
    Distractors: ['Quảng trường Đông Kinh Nghĩa Thục', 'Quảng trường Cách mạng Tháng Tám', 'Quảng trường 1-5'],
    Alternatives: 'QUẢNG TRƯỜNG BA ĐÌNH; BA DINH',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Cậu bé mồ côi Rémi và chú chó trung thành Capi là nhân vật chính trong tác phẩm văn học nổi tiếng nào của Hector Malot?',
    Correct: 'Không gia đình',
    Distractors: ['Những người khốn khổ', 'Hai vạn dặm dưới đáy biển', 'Hoàng tử bé'],
    Alternatives: 'KHÔNG GIA ĐÌNH; KHONG GIA DINH; SANS FAMILLE',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Số tự nhiên nào là số duy nhất không phải là số nguyên dương cũng không phải là số nguyên âm?',
    Correct: 'Số 0',
    Distractors: ['Số 1', 'Số -1', 'Số 2'],
    Alternatives: '0; KHÔNG; SỐ 0',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Khí gas dân dụng dùng trong các bình đun nấu gia đình (LPG) có thành phần chính là hỗn hợp của propan và chất nào?',
    Correct: 'Butan',
    Distractors: ['Metan', 'Etan', 'Pentan'],
    Alternatives: 'BUTAN; BUTANE',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Dụng cụ quang học nào được trang bị trên tàu ngầm giúp thủy thủ quan sát cảnh vật trên mặt biển khi tàu đang lặn?',
    Correct: 'Kính tiềm vọng',
    Distractors: ['Kính thiên văn', 'Kính hiển vi', 'Kính vạn hoa'],
    Alternatives: 'KÍNH TIỀM VỌNG; KINH TIEM VONG; PERISCOPE',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Nhạc cụ cổ truyền độc đáo của dân tộc Việt Nam chỉ có duy nhất một dây và dùng que gảy là đàn gì?',
    Correct: 'Đàn bầu (Độc huyền cầm)',
    Distractors: ['Đàn nhị', 'Đàn tranh', 'Đàn tỳ bà'],
    Alternatives: 'ĐÀN BẦU; DAN BAU; ĐỘC HUYỀN CẦM',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Động vật thuộc lớp lưỡng cư (như ếch, cóc) ngoài hô hấp bằng phổi còn có khả năng hô hấp rất hiệu quả qua cơ quan nào?',
    Correct: 'Da',
    Distractors: ['Lông mao', 'Khí quản', 'Vảy sừng'],
    Alternatives: 'DA; QUA DA; LỚP DA',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Quốc gia nào ở khu vực Nam Âu nổi tiếng với hình dáng lãnh thổ trông giống như một chiếc ủng vươn ra biển Địa Trung Hải?',
    Correct: 'Ý (Italia)',
    Distractors: ['Tây Ban Nha', 'Bồ Đào Nha', 'Hy Lạp'],
    Alternatives: 'Ý; ITALIA; ITALY',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Cuộc khởi nghĩa Lam Sơn (1418 - 1427) đánh đuổi ách đô hộ của nhà Minh do vị thủ lĩnh kiệt xuất nào khởi xướng và lãnh đạo?',
    Correct: 'Lê Lợi',
    Distractors: ['Trần Hưng Đạo', 'Quang Trung', 'Đinh Bộ Lĩnh'],
    Alternatives: 'LÊ LỢI; LE LOI; LÊ THÁI TỔ',
    Difficulty: 'Dễ'
  },
  {
    Prompt: 'Vệ tinh tự nhiên duy nhất chuyển động trên quỹ đạo quay quanh hành tinh Trái Đất là thiên thể nào?',
    Correct: 'Mặt Trăng',
    Distractors: ['Sao Hỏa', 'Sao Kim', 'Sao Thủy'],
    Alternatives: 'MẶT TRĂNG; MAT TRANG; MOON',
    Difficulty: 'Dễ'
  },

  // ================= 40 CÂU TRUNG BÌNH =================
  {
    Prompt: 'Thuyết lượng tử ánh sáng được nhà vật lý thiên tài nào đề xuất vào năm 1905 để giải thích trọn vẹn hiện tượng quang điện ngoài?',
    Correct: 'Albert Einstein',
    Distractors: ['Max Planck', 'Niels Bohr', 'Louis de Broglie'],
    Alternatives: 'ALBERT EINSTEIN; EINSTEIN',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Quặng bauxite (bô-xít) là nguồn nguyên liệu khoáng sản chủ yếu được khai thác để tinh chế ra kim loại công nghiệp nào?',
    Correct: 'Nhôm (Al)',
    Distractors: ['Sắt (Fe)', 'Đồng (Cu)', 'Kẽm (Zn)'],
    Alternatives: 'NHÔM; NHOM; ALUMINIUM; AL',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Danh nhân văn hóa nào thời Hậu Lê được dân gian tôn xưng là "Trạng Lường", tác giả cuốn sách toán học "Đại thành toán pháp"?',
    Correct: 'Lương Thế Vinh',
    Distractors: ['Vũ Hữu', 'Lê Quý Đôn', 'Nguyễn Bỉnh Khiêm'],
    Alternatives: 'LƯƠNG THẾ VINH; LUONG THE VINH; TRẠNG LƯỜNG',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Trong hệ đo lường quốc tế (SI), đơn vị đo độ rọi (quang thông trên một đơn vị diện tích bề mặt) là gì?',
    Correct: 'Lux (lx)',
    Distractors: ['Lumen (lm)', 'Candela (cd)', 'Weber (Wb)'],
    Alternatives: 'LUX; LX',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Người Maori là tộc người bản địa sinh sống lâu đời với điệu nhảy chiến binh Haka nổi tiếng tại quốc gia nào?',
    Correct: 'New Zealand',
    Distractors: ['Australia', 'Fiji', 'Papua New Guinea'],
    Alternatives: 'NEW ZEALAND; NIU DI-LÂN',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Tiểu thuyết viết về đề tài chiến tranh "Nỗi buồn chiến tranh" (từng xuất bản với nhan đề "Thân phận của tình yêu") là sáng tác của nhà văn nào?',
    Correct: 'Bảo Ninh',
    Distractors: ['Chu Lai', 'Nguyễn Huy Thiệp', 'Lê Lựu'],
    Alternatives: 'BẢO NINH; BAO NINH',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Loại đường đơn (monosaccharide) nào ngọt nhất trong các loại đường tự nhiên và chiếm tới 40% khối lượng trong mật ong?',
    Correct: 'Fructozơ',
    Distractors: ['Glucozơ', 'Saccarozơ', 'Mantozơ'],
    Alternatives: 'FRUCTOZƠ; FRUCTOZO; FRUCTOSE',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Trước khi thủ đô của nước Ý thống nhất được đặt tại Roma vào năm 1871, thành phố nào từng là thủ đô đầu tiên của Vương quốc Ý (1861-1865)?',
    Correct: 'Torino (Turin)',
    Distractors: ['Milano', 'Firenze (Florence)', 'Napoli'],
    Alternatives: 'TORINO; TURIN',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Hiện tượng vật lý nào sau đây là bằng chứng thực nghiệm rõ ràng nhất khẳng định ánh sáng có bản chất sóng?',
    Correct: 'Hiện tượng giao thoa ánh sáng',
    Distractors: ['Hiệu ứng quang điện ngoài', 'Hiện tượng quang phát quang', 'Áp suất ánh sáng'],
    Alternatives: 'GIAO THOA ÁNH SÁNG; GIAO THOA; INTERFERENCE',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Dung dịch axit axetic (CH3COOH) hòa tan trong nước có nồng độ khoảng 2% đến 5% thường được biết đến với tên gọi thông dụng nào?',
    Correct: 'Giấm ăn',
    Distractors: ['Nước vôi trong', 'Nước javel', 'Cồn y tế'],
    Alternatives: 'GIẤM ĂN; GIAM AN; GIẤM',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Dưới triều Trần, vị vua nào cùng với vua cha Trần Thánh Tông đã trực tiếp lãnh đạo quân dân Đại Việt kháng chiến thắng lợi cuộc xâm lược của quân Nguyên Mông lần 2 (1285) và lần 3 (1288)?',
    Correct: 'Trần Nhân Tông',
    Distractors: ['Trần Thái Tông', 'Trần Anh Tông', 'Trần Nghệ Tông'],
    Alternatives: 'TRẦN NHÂN TÔNG; TRAN NHAN TONG',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Hồ nước ngọt tự nhiên sâu nhất thế giới và chứa khoảng 20% tổng lượng nước ngọt không đóng băng của bề mặt Trái Đất là hồ nào ở Nga?',
    Correct: 'Hồ Baikal',
    Distractors: ['Hồ Superior', 'Hồ Victoria', 'Hồ Tanganyika'],
    Alternatives: 'HỒ BAIKAL; BAIKAL; HO BAIKAL',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Số Avogadro (ký hiệu NA), biểu thị số lượng nguyên tử hoặc phân tử có trong một mol chất, có giá trị xấp xỉ bằng bao nhiêu?',
    Correct: '6,022 x 10^23',
    Distractors: ['1,602 x 10^-19', '3,000 x 10^8', '9,109 x 10^-31'],
    Alternatives: '6,022 X 10^23; 6.022 X 10^23; 6,023 X 10^23',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Bộ phim điện ảnh kinh điển nào của đạo diễn James Cameron phát hành năm 1997 đã giành được kỷ lục 11 tượng vàng giải thưởng Oscar?',
    Correct: 'Titanic',
    Distractors: ['Avatar', 'Kẻ hủy diệt 2', 'Aliens'],
    Alternatives: 'TITANIC',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Hình tượng cây xà nu kiên cường, bất khuất trong truyện ngắn "Rừng xà nu" của nhà văn Nguyễn Trung Thành là biểu tượng cho con người vùng đất nào?',
    Correct: 'Tây Nguyên',
    Distractors: ['Tây Bắc', 'Việt Bắc', 'Đồng bằng sông Cửu Long'],
    Alternatives: 'TÂY NGUYÊN; TAY NGUYEN',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Trong hệ thống phân loại nhóm máu ABO, nhóm máu nào có thể truyền hồng cầu cho bất kỳ nhóm máu nào khác mà không gây ngưng kết hồng cầu?',
    Correct: 'Nhóm máu O',
    Distractors: ['Nhóm máu A', 'Nhóm máu B', 'Nhóm máu AB'],
    Alternatives: 'NHÓM MÁU O; NHOM MAU O; O',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Kênh đào Suez khánh thành năm 1869 là tuyến hàng hải nhân tạo huyết mạch nối liền biển Địa Trung Hải với vùng biển nào?',
    Correct: 'Biển Đỏ (Hồng Hải)',
    Distractors: ['Biển Đen', 'Biển Baltic', 'Biển Caspi'],
    Alternatives: 'BIỂN ĐỎ; BIEN DO; RED SEA; HỒNG HẢI',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Theo định luật Ohm cho đoạn mạch điện thuần điện trở, cường độ dòng điện chạy qua dây dẫn tỉ lệ nghịch với đại lượng vật lý nào?',
    Correct: 'Điện trở của đoạn mạch',
    Distractors: ['Hiệu điện thế', 'Năng lượng điện tiêu thụ', 'Công suất điện'],
    Alternatives: 'ĐIỆN TRỞ; DIEN TRO; RESISTANCE',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Hợp chất oxit của nitơ có công thức phân tử N2O, có khả năng kích thích nhẹ và giảm đau dùng trong gây mê nha khoa, có tên là gì?',
    Correct: 'Đinitơ monoxit',
    Distractors: ['Nitơ monoxit', 'Nitơ đioxit', 'Đinitơ tetroxit'],
    Alternatives: 'ĐINITƠ MONOXIT; DINITO MONOXIT; DINITROGEN MONOXIDE; KHÍ CƯỜI',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Cuộc kháng chiến chống quân xâm lược Tống lần thứ nhất (năm 981) trên sông Bạch Đằng do vị vua anh minh nào chỉ huy thắng lợi?',
    Correct: 'Lê Hoàn (Lê Đại Hành)',
    Distractors: ['Đinh Bộ Lĩnh', 'Lý Thường Kiệt', 'Trần Hưng Đạo'],
    Alternatives: 'LÊ HOÀN; LÊ ĐẠI HÀNH; LE HOAN',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Hòn đảo nào có diện tích tự nhiên lớn nhất trong toàn bộ vùng biển Địa Trung Hải?',
    Correct: 'Đảo Sicilia (Sicily)',
    Distractors: ['Đảo Corse', 'Đảo Sardegna', 'Đảo Síp (Cyprus)'],
    Alternatives: 'SICILIA; SICILY; ĐẢO SICILIA',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Định luật khúc xạ ánh sáng (n1 * sin(i) = n2 * sin(r)) trong vật lý quang học mang tên của nhà toán học người nước nào?',
    Correct: 'Hà Lan',
    Distractors: ['Đức', 'Anh', 'Pháp'],
    Alternatives: 'HÀ LAN; HA LAN; NETHERLANDS',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Tuyến nội tiết nào trong cơ thể người đảm nhận chức năng tiết ra hormone insulin nhằm duy trì nồng độ glucose trong máu ổn định?',
    Correct: 'Tuyến tụy',
    Distractors: ['Tuyến giáp', 'Tuyến thượng thận', 'Tuyến yên'],
    Alternatives: 'TUYẾN TỤY; TUYEN TUY; PANCREAS',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Trong bảng tuần hoàn nguyên tố hóa học đầu tiên do Dmitri Mendeleev lập năm 1869, các nguyên tố được sắp xếp dựa trên đặc điểm nào?',
    Correct: 'Khối lượng nguyên tử (nguyên tử khối)',
    Distractors: ['Số hạt proton trong nhân', 'Bán kính nguyên tử', 'Độ âm điện'],
    Alternatives: 'KHỐI LƯỢNG NGUYÊN TỬ; NGUYÊN TỬ KHỐI; NGUYEN TU KHOI',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Bộ tiểu thuyết cổ điển Trung Hoa "Thủy Hử" mô tả cuộc khởi nghĩa của 108 vị anh hùng Lương Sơn Bạc là tác phẩm của văn sĩ nào?',
    Correct: 'Thi Nại Am',
    Distractors: ['La Quán Trung', 'Ngô Thừa Ân', 'Tào Tuyết Cần'],
    Alternatives: 'THI NẠI AM; THI NAI AM',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Thung lũng Chết (Death Valley), một trong những nơi có nhiệt độ không khí tự nhiên cao kỷ lục trên Trái Đất, nằm ở bang nào của nước Mỹ?',
    Correct: 'California',
    Distractors: ['Texas', 'Arizona', 'Nevada'],
    Alternatives: 'CALIFORNIA',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Trong hệ đo lường quốc tế (SI), đơn vị đo điện dung của một tụ điện mang tên nhà vật lý Michael Faraday là gì?',
    Correct: 'Fara (F)',
    Distractors: ['Vôn (V)', 'Oát (W)', 'Henry (H)'],
    Alternatives: 'FARA; FARAD; F',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Kim loại nhóm IA nào có tính mềm đến mức có thể dùng dao cắt lát dễ dàng và phản ứng mãnh liệt tỏa nhiệt khi thả vào nước?',
    Correct: 'Natri (Na)',
    Distractors: ['Kẽm (Zn)', 'Sắt (Fe)', 'Đồng (Cu)'],
    Alternatives: 'NATRI; NA; SODIUM',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Dòng hải lưu nóng nào chảy dọc bờ đông Bắc Mỹ và băng qua Đại Tây Dương làm dịu bớt khí hậu mùa đông ở Tây và Bắc Âu?',
    Correct: 'Dòng hải lưu Gulf Stream',
    Distractors: ['Dòng hải lưu Humboldt', 'Dòng hải lưu Benguela', 'Dòng hải lưu Kuroshio'],
    Alternatives: 'GULF STREAM; DÒNG GULF STREAM; HAI LUU GULF STREAM',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Trong chu trình hoạt động của động cơ nhiệt đốt trong 4 kỳ (4 thì) truyền thống, thứ tự làm việc chuẩn xác là gì?',
    Correct: 'Nạp - Nén - Nổ (Sinh công) - Xả',
    Distractors: ['Nạp - Nổ - Nén - Xả', 'Nén - Nạp - Nổ - Xả', 'Nạp - Nén - Xả - Nổ'],
    Alternatives: 'NẠP NÉN NỔ XẢ; NAP NEN NO XA',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Những nguyên tử có cùng số đơn vị điện tích hạt nhân (cùng số proton) nhưng khác nhau về số neutron được gọi là gì của nhau?',
    Correct: 'Đồng vị',
    Distractors: ['Đồng phân', 'Đồng đẳng', 'Đồng khối'],
    Alternatives: 'ĐỒNG VỊ; DONG VI; ISOTOPE',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Bản giao hưởng số 5 giọng Đô thứ với 4 nốt nhạc mở đầu mô phỏng "tiếng định mệnh gõ cửa" là kiệt tác của nhà soạn nhạc vĩ đại nào?',
    Correct: 'Ludwig van Beethoven',
    Distractors: ['Wolfgang Amadeus Mozart', 'Johann Sebastian Bach', 'Franz Schubert'],
    Alternatives: 'BEETHOVEN; LUDWIG VAN BEETHOVEN',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Tính đến hết năm 2024, cầu thủ bóng đá nào đang giữ kỷ lục mọi thời đại về số lần giành giải thưởng Quả bóng vàng (Ballon d\'Or) với 8 danh hiệu?',
    Correct: 'Lionel Messi',
    Distractors: ['Cristiano Ronaldo', 'Johan Cruyff', 'Michel Platini'],
    Alternatives: 'LIONEL MESSI; MESSI',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Căn bệnh tan máu bẩm sinh Thalassemia chủ yếu di truyền do sự bất thường trong quá trình tổng hợp chuỗi globin của chất nào trong máu?',
    Correct: 'Hemoglobin',
    Distractors: ['Myoglobin', 'Insulin', 'Collagen'],
    Alternatives: 'HEMOGLOBIN; HUYẾT SẮC TỐ',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Vĩ tuyến 38 độ Bắc từng là ranh giới phân định giới tuyến quân sự tạm thời giữa hai miền của bán đảo nào sau khi Chiến tranh thế giới thứ hai kết thúc?',
    Correct: 'Bán đảo Triều Tiên',
    Distractors: ['Bán đảo Đông Dương', 'Bán đảo Balkan', 'Bán đảo Iberia'],
    Alternatives: 'BÁN ĐẢO TRIỀU TIÊN; TRIỀU TIÊN; KOREAN PENINSULA',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Hiện tượng biên độ dao động cưỡng bức tăng vọt đến giá trị cực đại khi tần số của lực cưỡng bức xấp xỉ bằng tần số riêng của hệ gọi là gì?',
    Correct: 'Cộng hưởng cơ',
    Distractors: ['Tự dao động', 'Sóng dừng', 'Nhiễu xạ sóng'],
    Alternatives: 'CỘNG HƯỞNG; CONG HUONG; RESONANCE',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Nguyên tố bán dẫn nào là vật liệu cơ bản quan trọng nhất được sử dụng để chế tạo các con chip vi xử lý và mạch tích hợp điện tử hiện đại?',
    Correct: 'Silic (Si)',
    Distractors: ['Gecmani (Ge)', 'Cacbon (C)', 'Bo (B)'],
    Alternatives: 'SILIC; SILICON; SI',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Bộ luật "Quốc triều hình luật" (thường được gọi là Luật Hồng Đức), đỉnh cao lập pháp phong kiến Việt Nam, được ban hành dưới triều vua nào?',
    Correct: 'Lê Thánh Tông',
    Distractors: ['Lê Thái Tổ', 'Lê Thái Tông', 'Lê Nhân Tông'],
    Alternatives: 'LÊ THÁNH TÔNG; LE THANH TONG',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Theo định luật bảo toàn cơ năng, khi một vật chuyển động chỉ dưới tác dụng của trọng lực thì đại lượng nào luôn được bảo toàn?',
    Correct: 'Tổng động năng và thế năng',
    Distractors: ['Chỉ riêng động năng', 'Chỉ riêng thế năng', 'Động lượng'],
    Alternatives: 'CƠ NĂNG; TỔNG ĐỘNG NĂNG VÀ THẾ NĂNG',
    Difficulty: 'Trung bình'
  },
  {
    Prompt: 'Hiện tượng ấm lên bất thường của lớp nước biển bề mặt ở khu vực trung tâm và phía đông xích đạo Thái Bình Dương gây xáo trộn khí hậu toàn cầu có tên là gì?',
    Correct: 'El Niño',
    Distractors: ['La Niña', 'Tsunami', 'Monsoon'],
    Alternatives: 'EL NIÑO; EL NINO',
    Difficulty: 'Trung bình'
  },

  // ================= 30 CÂU KHÓ =================
  {
    Prompt: 'Hệ thống các hiệp ước hòa bình nào ký kết năm 1648 đã chấm dứt cuộc Chiến tranh Ba Mươi Năm ở châu Âu và đặt nền móng cho trật tự quốc gia có chủ quyền?',
    Correct: 'Hòa ước Westphalia',
    Distractors: ['Hiệp ước Utrecht', 'Hiệp ước Versailles', 'Hòa ước Vienna'],
    Alternatives: 'HÒA ƯỚC WESTPHALIA; WESTPHALIA; HIỆP ƯỚC WESTPHALIA',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Hằng số khí lý tưởng R trong phương trình trạng thái khí lý tưởng Clapeyron - Mendeleev có giá trị chuẩn xấp xỉ bằng bao nhiêu J/(mol.K)?',
    Correct: '8,314',
    Distractors: ['1,380 x 10^-23', '6,022 x 10^23', '9,810'],
    Alternatives: '8,314; 8.314',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Theo số liệu của Tổng cục Biển và Hải đảo Việt Nam, tỉnh nào có chiều dài đường bờ biển lớn nhất cả nước (khoảng 385 km tính cả vịnh và đảo)?',
    Correct: 'Khánh Hòa',
    Distractors: ['Quảng Ninh', 'Cà Mau', 'Bình Thuận'],
    Alternatives: 'KHÁNH HÒA; KHANH HOA',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Vận tốc vũ trụ cấp 1 (vận tốc tối thiểu để một vật thể phóng từ mặt đất bay vào quỹ đạo tròn ổn định quanh Trái Đất) có giá trị lý thuyết xấp xỉ bằng bao nhiêu?',
    Correct: '7,9 km/s',
    Distractors: ['11,2 km/s', '16,7 km/s', '3,0 x 10^5 km/s'],
    Alternatives: '7,9 KM/S; 7.9 KM/S; 7,9; 7.9',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Bản giao hưởng số 9 cung Mi thứ Op. 95 với tựa đề "Từ thế giới mới" (From the New World) là kiệt tác của nhà soạn nhạc người Séc nào?',
    Correct: 'Antonín Dvořák',
    Distractors: ['Bedřich Smetana', 'Leoš Janáček', 'Gustav Mahler'],
    Alternatives: 'ANTONIN DVORAK; DVORAK; DVOŘÁK',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Trong quá trình sinh tổng hợp protein ở sinh vật nhân thực, bộ ba mã sao (codon) nào đóng vai trò là mã mở đầu cho dịch mã?',
    Correct: 'AUG',
    Distractors: ['UAA', 'UAG', 'UGA'],
    Alternatives: 'AUG',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Cuộc tập kích bất ngờ của hải quân và không quân phát xít Nhật vào căn cứ hải quân Mỹ tại Trân Châu Cảng (Hawaii) diễn ra vào ngày tháng năm nào?',
    Correct: '07/12/1941',
    Distractors: ['01/09/1939', '06/06/1944', '15/08/1945'],
    Alternatives: '07/12/1941; 7/12/1941; 7 THÁNG 12 NĂM 1941',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Eo biển Bering là eo biển tự nhiên ngăn cách bán đảo Chukotka của Nga (châu Á) với vùng đất nào của Hợp chúng quốc Hoa Kỳ?',
    Correct: 'Alaska',
    Distractors: ['Hawaii', 'Bang Washington', 'California'],
    Alternatives: 'ALASKA',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Hằng số Planck (ký hiệu h), một trong những hằng số cơ bản nhất của vật lý lượng tử, có đơn vị đo lường trong hệ SI là gì?',
    Correct: 'Jun nhân giây (J.s)',
    Distractors: ['Jun trên giây (J/s)', 'Niu-tơn nhân mét (N.m)', 'Oát trên mét vuông (W/m^2)'],
    Alternatives: 'JUN GIÂY; J.S; JOULE SECOND',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Độc tố thần kinh cực mạnh tetrodotoxin (TTX) gây tê liệt cơ quan hô hấp có nồng độ cao nhất trong nội tạng của loài sinh vật biển nào?',
    Correct: 'Cá nóc',
    Distractors: ['Rắn biển đực', 'Nhện chuông cát', 'Ốc cối nón'],
    Alternatives: 'CÁ NÓC; CA NOC; PUFFERFISH',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Vị vua nào của triều Hậu Lê được lập lên ngôi hoàng đế khi mới được hơn một tuổi (năm 1442) sau cái chết đột ngột của vua cha Lê Thái Tông?',
    Correct: 'Lê Nhân Tông',
    Distractors: ['Lê Thánh Tông', 'Lê Hiến Tông', 'Lê Túc Tông'],
    Alternatives: 'LÊ NHÂN TÔNG; LE NHAN TONG; LÊ BANG CƠ',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Theo Mô hình chuẩn của vật lý hạt hiện đại, các hạt hadron như proton và neutron được cấu tạo từ tổ hợp các hạt cơ bản nào?',
    Correct: 'Quark',
    Distractors: ['Lepton', 'Boson trung gian', 'Graviton'],
    Alternatives: 'QUARK; HẠT QUARK',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Quốc gia nào trên thế giới sở hữu số lượng múi giờ nhiều nhất (tổng cộng 12 múi giờ) nếu tính gộp toàn bộ các vùng lãnh thổ và đảo hải ngoại?',
    Correct: 'Pháp',
    Distractors: ['Nga', 'Hoa Kỳ', 'Vương quốc Anh'],
    Alternatives: 'PHÁP; PHAP; FRANCE',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Tiểu thuyết theo trường phái hiện thực huyền ảo "Trăm năm cô đơn" kể về dòng họ Buendía tại ngôi làng Macondo là kiệt tác của nhà văn nào?',
    Correct: 'Gabriel García Márquez',
    Distractors: ['Mario Vargas Llosa', 'Jorge Luis Borges', 'Octavio Paz'],
    Alternatives: 'GABRIEL GARCIA MARQUEZ; MARQUEZ; GÁRCIA MÁRQUEZ',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Khí hiếm nào sau đây là nguyên tố bền vững không có tính phóng xạ và có nguyên tử khối lớn nhất trong nhóm khí trơ (nhóm VIIIA)?',
    Correct: 'Xenon (Xe)',
    Distractors: ['Neon (Ne)', 'Argon (Ar)', 'Krypton (Kr)'],
    Alternatives: 'XENON; XE',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Tác phẩm điêu khắc Hy Lạp cổ đại trứ danh "Tượng thần Vệ Nữ thành Milo" (Venus de Milo) hiện được lưu giữ và trưng bày chính thức tại bảo tàng nào?',
    Correct: 'Bảo tàng Louvre (Pháp)',
    Distractors: ['Bảo tàng Prado (Tây Ban Nha)', 'Bảo tàng Uffizi (Ý)', 'Bảo tàng Anh (British Museum)'],
    Alternatives: 'LOUVRE; BẢO TÀNG LOUVRE; MUSÉE DU LOUVRE',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Ngọn núi lửa dạng tầng Kilimanjaro, ngọn núi cao nhất châu Phi với độ cao 5.895 mét so với mực nước biển, thuộc lãnh thổ quốc gia nào?',
    Correct: 'Tanzania',
    Distractors: ['Kenya', 'Ethiopia', 'Uganda'],
    Alternatives: 'TANZANIA',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Nhà vật lý thực nghiệm người Anh nào đã phát hiện ra định luật cảm ứng điện từ vào năm 1831, mở đường cho kỷ nguyên máy phát điện hiện đại?',
    Correct: 'Michael Faraday',
    Distractors: ['James Clerk Maxwell', 'André-Marie Ampère', 'Heinrich Hertz'],
    Alternatives: 'MICHAEL FARADAY; FARADAY',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Con tàu vũ trụ mang tên gì đã đưa nhà du hành Liên Xô Yuri Gagarin thực hiện chuyến bay lịch sử vòng quanh quỹ đạo Trái Đất vào ngày 12 tháng 4 năm 1961?',
    Correct: 'Vostok 1 (Phương Đông 1)',
    Distractors: ['Voskhod 1', 'Soyuz 1', 'Sputnik 1'],
    Alternatives: 'VOSTOK 1; PHƯƠNG ĐÔNG 1; VOSTOK',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Vùng đô thị vịnh San Francisco thuộc tiểu bang California nổi tiếng với mật độ tập trung các tập đoàn công nghệ cao hàng đầu thế giới được gọi là gì?',
    Correct: 'Thung lũng Silicon (Silicon Valley)',
    Distractors: ['Silicon Alley', 'Silicon Prairie', 'Silicon Forest'],
    Alternatives: 'THUNG LŨNG SILICON; SILICON VALLEY',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Loại liên kết hóa học nào được hình thành giữa hai nguyên tử nhờ sự góp chung một hoặc nhiều cặp electron liên kết?',
    Correct: 'Liên kết cộng hóa trị',
    Distractors: ['Liên kết ion', 'Liên kết kim loại', 'Liên kết hydro'],
    Alternatives: 'LIÊN KẾT CỘNG HÓA TRỊ; LIEN KET CONG HOA TRI; COVALENT',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Tính đến năm 2024, tay vợt nam người Serbia nào đang nắm giữ kỷ lục lịch sử quần vợt thế giới với 24 danh hiệu Grand Slam đơn nam?',
    Correct: 'Novak Djokovic',
    Distractors: ['Roger Federer', 'Rafael Nadal', 'Andy Murray'],
    Alternatives: 'NOVAK DJOKOVIC; DJOKOVIC',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Trường ca sử thi "Thần khúc" (La Divina Commedia) mô tả chuyến du hành qua ba cõi Địa ngục, Tĩnh ngục và Thiên đường là kiệt tác của danh nhân văn học nào?',
    Correct: 'Dante Alighieri',
    Distractors: ['Francesco Petrarca', 'Giovanni Boccaccio', 'Niccolò Machiavelli'],
    Alternatives: 'DANTE ALIGHIERI; DANTE',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Trong phân tử của các amino axit tự nhiên (axit amin), hai nhóm chức cơ bản luôn đồng thời hiện diện là nhóm amino (-NH2) và nhóm chức nào?',
    Correct: 'Nhóm cacboxyl (-COOH)',
    Distractors: ['Nhóm hidroxyl (-OH)', 'Nhóm anđehit (-CHO)', 'Nhóm xeton (-CO-)'],
    Alternatives: 'CACBOXYL; NHÓM CACBOXYL; COOH',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Eo biển hàng hải quốc tế Malacca phân tách bán đảo Mã Lai khỏi đảo Sumatra của Indonesia, nối liền Ấn Độ Dương với vùng biển nào?',
    Correct: 'Biển Đông',
    Distractors: ['Biển Đỏ', 'Biển Ả Rập', 'Biển San Hô'],
    Alternatives: 'BIỂN ĐÔNG; BIEN DONG; SOUTH CHINA SEA',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Trong hệ đo lường quốc tế (SI), đơn vị chuẩn để đo hoạt độ phóng xạ của một khối chất phóng xạ (tương đương 1 phân rã mỗi giây) là gì?',
    Correct: 'Becquerel (Bq)',
    Distractors: ['Curie (Ci)', 'Gray (Gy)', 'Sievert (Sv)'],
    Alternatives: 'BECQUEREL; BQ',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Danh sĩ nào được lịch sử phong kiến Việt Nam ghi nhận là vị Trạng nguyên trẻ tuổi nhất, đỗ Trạng nguyên năm 1247 khi mới 13 tuổi?',
    Correct: 'Nguyễn Hiền',
    Distractors: ['Lê Văn Thịnh', 'Mạc Đĩnh Chi', 'Nguyễn Bỉnh Khiêm'],
    Alternatives: 'NGUYỄN HIỀN; NGUYEN HIEN',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Axit fomic (axit metanoic, công thức HCOOH) là axit cacboxylic đơn giản nhất, thường có trong nọc của loài côn trùng nào gây buốt rát khi cắn?',
    Correct: 'Kiến lửa',
    Distractors: ['Bọ xít', 'Bọ cạp', 'Rết đất'],
    Alternatives: 'KIẾN; KIEN LUA; CON KIẾN',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Ngôn ngữ lập trình C kinh điển được nhà khoa học máy tính Dennis Ritchie phát minh và phát triển vào đầu thập niên 1970 tại phòng thí nghiệm danh tiếng nào?',
    Correct: 'Bell Labs (Phòng thí nghiệm Bell)',
    Distractors: ['Xerox PARC', 'IBM Watson Research Center', 'MIT Lincoln Laboratory'],
    Alternatives: 'BELL LABS; PHÒNG THÍ NGHIỆM BELL; PHONG THI NGHIEM BELL',
    Difficulty: 'Khó'
  },
  {
    Prompt: 'Trong vật lý thiên văn, ranh giới xung quanh một lỗ đen mà tại đó vận tốc thoát ly đạt đến tốc độ ánh sáng, khiến không hạt vật chất hay bức xạ nào thoát ra được, gọi là gì?',
    Correct: 'Chân trời sự kiện (Event horizon)',
    Distractors: ['Đĩa bồi tụ quang học', 'Điểm kỳ dị hấp dẫn', 'Khối lượng tới hạn Chandrasekhar'],
    Alternatives: 'CHÂN TRỜI SỰ KIỆN; CHAN TROI SU KIEN; EVENT HORIZON',
    Difficulty: 'Khó'
  }
];

export interface FormattedQuestion {
  Prompt: string;
  OptionA: string;
  OptionB: string;
  OptionC: string;
  OptionD: string;
  Answer: 'A' | 'B' | 'C' | 'D';
  Alternatives: string;
  Difficulty: 'Dễ' | 'Trung bình' | 'Khó';
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordTokens(s: string): Set<string> {
  const words = normalize(s).split(' ').filter((w) => w.length > 2);
  return new Set(words);
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  let inter = 0;
  for (const w of setA) {
    if (setB.has(w)) inter++;
  }
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function buildBalancedQuestions(): FormattedQuestion[] {
  const out: FormattedQuestion[] = [];
  const targetLetters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  RAW_QUESTIONS.forEach((q, idx) => {
    // Distribute answer letters evenly: 0->A, 1->B, 2->C, 3->D, 4->A ...
    const correctLetter = targetLetters[idx % 4];
    const correctIndex = idx % 4; // 0, 1, 2, 3

    const options: string[] = [];
    let dIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === correctIndex) {
        options.push(q.Correct);
      } else {
        options.push(q.Distractors[dIdx++]);
      }
    }

    out.push({
      Prompt: q.Prompt,
      OptionA: options[0],
      OptionB: options[1],
      OptionC: options[2],
      OptionD: options[3],
      Answer: correctLetter,
      Alternatives: q.Alternatives,
      Difficulty: q.Difficulty,
    });
  });

  return out;
}

export function validateAndInsert() {
  const formatted = buildBalancedQuestions();
  console.log(`Checking ${formatted.length} balanced questions...`);

  // 1. Difficulty distribution
  const counts = { Dễ: 0, 'Trung bình': 0, Khó: 0 };
  for (const q of formatted) {
    counts[q.Difficulty]++;
  }
  console.log('Difficulty counts:', counts);
  if (counts['Dễ'] !== 50 || counts['Trung bình'] !== 40 || counts['Khó'] !== 30) {
    throw new Error(`Invalid counts: ${JSON.stringify(counts)}`);
  }

  // 2. Answer balance
  const answerCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of formatted) {
    answerCounts[q.Answer]++;
  }
  console.log('Answer distribution (A/B/C/D):', answerCounts);
  if (answerCounts.A !== 30 || answerCounts.B !== 30 || answerCounts.C !== 30 || answerCounts.D !== 30) {
    throw new Error(`Unbalanced answers: ${JSON.stringify(answerCounts)}`);
  }

  // 3. Self-uniqueness
  const seenNew = new Set<string>();
  for (const q of formatted) {
    const norm = normalize(q.Prompt);
    if (seenNew.has(norm)) {
      throw new Error(`Duplicate prompt in new questions: ${q.Prompt}`);
    }
    seenNew.add(norm);
  }

  // 4. Collision with existing questions across all sheets
  const existingPath = path.resolve('server/question-bank/existing_prompts.json');
  const existing: { sheet: string; prompt: string }[] = JSON.parse(fs.readFileSync(existingPath, 'utf8'));

  let collisionCount = 0;
  for (let i = 0; i < formatted.length; i++) {
    const q = formatted[i];
    const qTokens = wordTokens(q.Prompt);
    const normQ = normalize(q.Prompt);

    for (const ex of existing) {
      const normEx = normalize(ex.prompt);
      if (normQ === normEx) {
        console.error(`[EXACT] Q${i + 1} (${q.Difficulty}) collides with ${ex.sheet}: "${q.Prompt}"`);
        collisionCount++;
      } else {
        const exTokens = wordTokens(ex.prompt);
        const sim = jaccardSimilarity(qTokens, exTokens);
        if (sim > 0.45) {
          console.warn(`[SIMILAR ${(sim * 100).toFixed(0)}%] Q${i + 1} (${q.Difficulty}) ~ ${ex.sheet}: "${q.Prompt}" vs "${ex.prompt}"`);
          collisionCount++;
        }
      }
    }
  }

  if (collisionCount > 0) {
    throw new Error(`Found ${collisionCount} potential collisions.`);
  }

  console.log('ALL 120 QUESTIONS PASSED VALIDATION! 0 collisions with existing 315 questions.');

  // 5. Read existing workbook and append to KhoiDong_Chung
  const excelPath = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
  const wb = xlsx.readFile(excelPath);
  const chungSheet = wb.Sheets['KhoiDong_Chung'];
  const existingRows = xlsx.utils.sheet_to_json<any>(chungSheet);

  console.log(`Current KhoiDong_Chung count: ${existingRows.length}`);
  const combinedRows = [...existingRows, ...formatted];
  console.log(`New KhoiDong_Chung count: ${combinedRows.length}`);

  const newSheet = xlsx.utils.json_to_sheet(combinedRows);
  wb.Sheets['KhoiDong_Chung'] = newSheet;
  xlsx.writeFile(wb, excelPath);
  console.log('Successfully saved updated workbook to', excelPath);
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('addKhoiDongChung')) {
  validateAndInsert();
}
