import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

export interface VeDichQ {
  Points: 10 | 20 | 30;
  Prompt: string;
  Answer: string;
  Alternatives: string;
}

export const NEW_VEDICH_PART2: VeDichQ[] = [
  // ================= 40 CÂU 10 ĐIỂM =================
  {
    Points: 10,
    Prompt: 'Ngọn núi nào ở tỉnh Tây Ninh là ngọn núi cao nhất vùng Đông Nam Bộ (986 mét), được mệnh danh là "Nóc nhà Nam Bộ"?',
    Answer: 'NÚI BÀ ĐEN',
    Alternatives: 'BÀ ĐEN; NUI BA DEN; NÚI BÀ'
  },
  {
    Points: 10,
    Prompt: 'Quần thể chùa cổ kính nào ở Hà Nội gắn liền với dòng sông Đáy và lễ hội hành hương mùa xuân lớn nhất miền Bắc kéo dài 3 tháng?',
    Answer: 'CHÙA HƯƠNG',
    Alternatives: 'CHÙA HƯƠNG TÍCH; CHUA HUONG; HƯƠNG SƠN'
  },
  {
    Points: 10,
    Prompt: 'Bài thơ "Sóng" với hình tượng con sóng biển khát khao tình yêu vĩnh cửu là thi phẩm nổi tiếng của nữ thi sĩ nào?',
    Answer: 'XUÂN QUỲNH',
    Alternatives: 'XUAN QUYNH; NHÀ THƠ XUÂN QUỲNH'
  },
  {
    Points: 10,
    Prompt: 'Tế bào máu nào trong cơ thể người có chức năng tham gia vào quá trình đông máu để cầm máu khi cơ thể bị thương?',
    Answer: 'TIỂU CẦU',
    Alternatives: 'TIEU CAU; PLATELETS; TẾ BÀO TIỂU CẦU'
  },
  {
    Points: 10,
    Prompt: 'Tế bào quang điện chuyển hóa trực tiếp năng lượng ánh sáng mặt trời thành dạng năng lượng nào?',
    Answer: 'ĐIỆN NĂNG',
    Alternatives: 'DIEN NANG; NĂNG LƯỢNG ĐIỆN; ĐIỆN'
  },
  {
    Points: 10,
    Prompt: 'Dụng cụ quang học nào gồm một gương có bề mặt cong lồi ra ngoài, thường đặt ở góc cua đường đèo để mở rộng tầm nhìn của tài xế?',
    Answer: 'GƯƠNG CẦU LỒI',
    Alternatives: 'GUONG CAU LOI; GƯƠNG LỒI'
  },
  {
    Points: 10,
    Prompt: 'Hình hộp chữ nhật tiêu chuẩn trong hình học không gian có tất cả bao nhiêu mặt phẳng bao quanh?',
    Answer: '6',
    Alternatives: '6 MẶT; SÁU; SAU'
  },
  {
    Points: 10,
    Prompt: 'Thiên hà hình xoắn ốc chứa Hệ Mặt Trời của chúng ta cùng hàng trăm tỉ ngôi sao khác thường được gọi là gì?',
    Answer: 'DẢI NGÂN HÀ',
    Alternatives: 'NGÂN HÀ; MILKY WAY; NGAN HA'
  },
  {
    Points: 10,
    Prompt: 'Cự ly chạy dài kinh điển nhất trong môn điền kinh Olympic có chiều dài tiêu chuẩn là 42,195 km mang tên là gì?',
    Answer: 'MARATHON',
    Alternatives: 'MA-RA-TÔNG; CHẠY MARATHON; MARATON'
  },
  {
    Points: 10,
    Prompt: 'Ai là vị nữ hoàng đế duy nhất và cũng là vị vua cuối cùng của triều đại nhà Lý trước khi nhường ngôi cho Trần Cảnh năm 1225?',
    Answer: 'LÝ CHIÊU HOÀNG',
    Alternatives: 'LY CHIEU HOANG; LÝ PHẬT KIM; PHẬT KIM; CHIÊU THÁNH HOÀNG ĐẾ'
  },
  {
    Points: 10,
    Prompt: 'Vùng biển Mũi Né với những đồi cát bay rực rỡ màu sắc trải dài là địa điểm du lịch nổi tiếng thuộc tỉnh nào?',
    Answer: 'BÌNH THUẬN',
    Alternatives: 'BINH THUAN; TỈNH BÌNH THUẬN'
  },
  {
    Points: 10,
    Prompt: 'Tác phẩm thơ trữ tình "Đây thôn Vĩ Dạ" lấy cảm hứng từ cảnh sắc thiên nhiên xứ Huế là sáng tác của nhà thơ tài hoa bạc mệnh nào?',
    Answer: 'HÀN MẠC TỬ',
    Alternatives: 'HAN MAC TU; NGUYỄN TRỌNG TRÍ'
  },
  {
    Points: 10,
    Prompt: 'Loại tế bào máu nào đóng vai trò như các "chiến sĩ bảo vệ", chuyên thực bào và tiêu diệt các vi khuẩn gây bệnh xâm nhập cơ thể?',
    Answer: 'BẠCH CẦU',
    Alternatives: 'BACH CAU; WHITE BLOOD CELLS; TẾ BÀO BẠCH CẦU'
  },
  {
    Points: 10,
    Prompt: 'Chất khí đơn chất màu vàng lục, có mùi hắc xốc, độc hại và được sục vào nước để khử trùng nước sinh hoạt ở các nhà máy là khí gì?',
    Answer: 'CLO',
    Alternatives: 'CHLORINE; CL2; CL; KHÍ CLO'
  },
  {
    Points: 10,
    Prompt: 'Đơn vị đo tần số dao động trong hệ đo lường quốc tế (SI) được đặt theo tên nhà vật lý Heinrich Hertz là gì?',
    Answer: 'HÉC',
    Alternatives: 'HZ; HERTZ'
  },
  {
    Points: 10,
    Prompt: 'Trong số học, số đối của số âm âm bảy (-7) là số nào?',
    Answer: '7',
    Alternatives: 'BẢY; BAY; SỐ 7; DƯƠNG 7'
  },
  {
    Points: 10,
    Prompt: 'Quốc gia nào trên thế giới sở hữu diện tích lãnh thổ đất liền rộng lớn nhất hành tinh (hơn 17 triệu km2)?',
    Answer: 'NGA',
    Alternatives: 'LIÊN BANG NGA; NƯỚC NGA; RUSSIA'
  },
  {
    Points: 10,
    Prompt: 'Người thầy giáo mẫu mực muôn đời của nền giáo dục Việt Nam thời Trần, từng dâng "Thất trảm sớ" xin chém 7 nịnh thần là ai?',
    Answer: 'CHU VĂN AN',
    Alternatives: 'THẦY CHU VĂN AN; CHU VAN AN; TIÊU CHU VĂN AN'
  },
  {
    Points: 10,
    Prompt: 'Quần thể kiến trúc đền tháp Chăm Pa cổ kính nổi tiếng tại tỉnh Quảng Nam đã được UNESCO công nhận là Di sản Thế giới tên là gì?',
    Answer: 'THÁNH ĐỊA MỸ SƠN',
    Alternatives: 'MỸ SƠN; MY SON; KHU DI TÍCH MỸ SƠN'
  },
  {
    Points: 10,
    Prompt: 'Sắc tố màu xanh lục có trong lục lạp của tế bào thực vật giúp hấp thụ năng lượng quang tử để tổng hợp chất hữu cơ có tên là gì?',
    Answer: 'DIỆP LỤC',
    Alternatives: 'CHLOROPHYLL; DIỆP LỤC TỐ; DIEP LUC'
  },
  {
    Points: 10,
    Prompt: 'Axit vô cơ mạnh có công thức phân tử HCl có mặt tự nhiên với nồng độ thấp trong dịch vị dạ dày người để tiêu hóa thức ăn tên là gì?',
    Answer: 'AXIT CLOHIDRIC',
    Alternatives: 'HYDROCHLORIC ACID; HCL; AXIT CLOHYDRIC'
  },
  {
    Points: 10,
    Prompt: 'Khi được nung nóng tăng nhiệt độ, kích thước chiều dài của một thanh kim loại đồng chất sẽ có xu hướng thay đổi như thế nào?',
    Answer: 'DÀI RA',
    Alternatives: 'TĂNG LÊN; NỞ RA; DÃN NỞ; TĂNG CHIỀU DÀI'
  },
  {
    Points: 10,
    Prompt: 'Ngọn đèo hiểm trở nào là ranh giới tự nhiên trên Quốc lộ 1A giữa hai tỉnh Phú Yên và Khánh Hòa?',
    Answer: 'ĐÈO CẢ',
    Alternatives: 'DEO CA; ĐÈO CẢ'
  },
  {
    Points: 10,
    Prompt: 'Nhà thơ nào khi còn là một cậu bé thần đồng đã sáng tác tập thơ thiếu nhi nổi tiếng "Góc sân và khoảng trời"?',
    Answer: 'TRẦN ĐĂNG KHOA',
    Alternatives: 'TRAN DANG KHOA'
  },
  {
    Points: 10,
    Prompt: 'Cuộc khởi nghĩa Yên Bái do Việt Nam Quốc dân Đảng phát động với câu nói nổi tiếng "Không thành công cũng thành nhân" nổ ra vào năm nào?',
    Answer: '1930',
    Alternatives: 'NĂM 1930; NAM 1930; 1930'
  },
  {
    Points: 10,
    Prompt: 'Hình tứ giác lồi phẳng có hai cạnh đối diện song song với nhau được gọi là hình gì?',
    Answer: 'HÌNH THANG',
    Alternatives: 'THANG; HINH THANG; TRAPEZOID'
  },
  {
    Points: 10,
    Prompt: 'Độ cồn (độ rượu) của đồ uống có cồn biểu thị số mililit rượu etylic nguyên chất có trong bao nhiêu mililit dung dịch rượu?',
    Answer: '100',
    Alternatives: '100 ML; MỘT TRĂM; 100ML'
  },
  {
    Points: 10,
    Prompt: 'Ngôi sao nào trên bầu trời đêm ở Bắc bán cầu luôn nằm gần như cố định thẳng trên trục quay của Trái Đất chỉ hướng bắc?',
    Answer: 'SAO BẮC CỰC',
    Alternatives: 'POLARIS; SAO BAC CUC; NORTH STAR'
  },
  {
    Points: 10,
    Prompt: 'Khớp cử động có biên độ xoay linh hoạt nhất trên cơ thể con người nối giữa chi trên và đai vai được gọi là khớp gì?',
    Answer: 'KHỚP VAI',
    Alternatives: 'KHOP VAI; SHOULDER JOINT'
  },
  {
    Points: 10,
    Prompt: 'Kim loại nào có tính dẫn điện dẫn nhiệt rất tốt, có giá thành hợp lý nên được ứng dụng làm ruột dây cáp điện phổ biến nhất hiện nay?',
    Answer: 'ĐỒNG',
    Alternatives: 'DONG; COPPER; CU'
  },
  {
    Points: 10,
    Prompt: 'Đại thi hào Nguyễn Trãi đã thay lời chủ tướng Lê Lợi viết nên áng thiên cổ hùng văn nào sau khi toàn thắng giặc Minh năm 1428?',
    Answer: 'BÌNH NGÔ ĐẠI CÁO',
    Alternatives: 'BINH NGO DAI CAO'
  },
  {
    Points: 10,
    Prompt: 'Thành phố cao nguyên Đà Lạt thơ mộng ngàn hoa trực thuộc địa bàn tỉnh nào ở vùng Tây Nguyên nước ta?',
    Answer: 'LÂM ĐỒNG',
    Alternatives: 'LAM DONG; TỈNH LÂM ĐỒNG'
  },
  {
    Points: 10,
    Prompt: 'Phương thức truyền nhiệt chủ yếu trong chất lỏng và chất khí bằng cách tạo thành các dòng chuyển động của vật chất gọi là gì?',
    Answer: 'ĐỐI LƯU',
    Alternatives: 'DOI LUU; CONVECTION; HIỆN TƯỢNG ĐỐI LƯU'
  },
  {
    Points: 10,
    Prompt: 'Nhân vật chú bé người gỗ có chiếc mũi dài ra mỗi khi nói dối trong truyện cổ tích của nhà văn Carlo Collodi có tên là gì?',
    Answer: 'PINOCCHIO',
    Alternatives: 'PI-NỐC-KI-Ô; PINOCIO; CHÚ BÉ NGƯỜI GỖ'
  },
  {
    Points: 10,
    Prompt: 'Trong thi đấu môn bơi lội hiện đại, kiểu bơi nào giúp vận động viên đạt được vận tốc di chuyển nhanh nhất trên mặt nước?',
    Answer: 'BƠI TRƯỜN SẤP',
    Alternatives: 'BƠI TỰ DO; BOI TRUON SAP; CRAWL; FREESTYLE'
  },
  {
    Points: 10,
    Prompt: 'Nội tạng nào có kích thước và khối lượng lớn nhất bên trong khoang bụng của con người, đảm nhận chức năng tiết mật và khử độc?',
    Answer: 'GAN',
    Alternatives: 'LÁ GAN; QUẢ GAN; LIVER'
  },
  {
    Points: 10,
    Prompt: 'Hợp chất oxit của cacbon có công thức CO, không màu, không mùi, cực kỳ nguy hiểm vì chiếm chỗ của oxy trong hồng cầu là khí gì?',
    Answer: 'CACBON MONOXIT',
    Alternatives: 'CARBON MONOXIDE; CO; KHÍ CO'
  },
  {
    Points: 10,
    Prompt: 'Nghiệm thực duy nhất của phương trình bậc nhất một ẩn số 2x - 10 = 0 là x bằng bao nhiêu?',
    Answer: '5',
    Alternatives: 'NĂM; NAM; X = 5'
  },
  {
    Points: 10,
    Prompt: 'Khu di tích lịch sử Pác Bó - nơi Bác Hồ trở về nước trực tiếp lãnh đạo cách mạng Việt Nam năm 1941 - thuộc tỉnh nào?',
    Answer: 'CAO BẰNG',
    Alternatives: 'CAO BANG; TỈNH CAO BẰNG'
  },
  {
    Points: 10,
    Prompt: 'Phong trào "Đồng khởi" (1959 - 1960) mở đầu cho cao trào đấu tranh vũ trang kết hợp chính trị nổ ra tiêu biểu nhất tại tỉnh nào?',
    Answer: 'BẾN TRE',
    Alternatives: 'BEN TRE; TỈNH BẾN TRE'
  },

  // ================= 40 CÂU 20 ĐIỂM =================
  {
    Points: 20,
    Prompt: 'Hai cứ điểm kiên cố nào của quân Mãn Thanh ở cửa ngõ phía Nam Thăng Long đã bị quân Tây Sơn tiêu diệt giòn giã trong dịp Tết Kỷ Dậu 1789?',
    Answer: 'NGỌC HỒI - ĐỐNG ĐA',
    Alternatives: 'NGỌC HỒI; ĐỐNG ĐA; NGOC HOI DONG DA'
  },
  {
    Points: 20,
    Prompt: 'Thiết bị điện từ nào hoạt động dựa trên hiện tượng cảm ứng điện từ dùng để tăng hoặc giảm điện áp của dòng điện xoay chiều?',
    Answer: 'MÁY BIẾN ÁP',
    Alternatives: 'MÁY BIẾN THẾ; MAY BIEN AP; TRANSFORMER'
  },
  {
    Points: 20,
    Prompt: 'Hiện tượng một nguyên tố hóa học có thể tạo ra nhiều dạng đơn chất khác nhau về cấu trúc mạng tinh thể (như than chì và kim cương) gọi là gì?',
    Answer: 'HIỆN TƯỢNG THÙ HÌNH',
    Alternatives: 'THÙ HÌNH; DẠNG THÙ HÌNH; ALLOTROPY'
  },
  {
    Points: 20,
    Prompt: 'Động lực đầu dưới của dòng mạch gỗ giúp đẩy nước và muối khoáng từ đất lên thân cây tạo ra một áp suất gọi là áp suất gì?',
    Answer: 'ÁP SUẤT RỄ',
    Alternatives: 'AP SUAT RE; ROOT PRESSURE'
  },
  {
    Points: 20,
    Prompt: 'Hồ Thác Bà - một trong những hồ nước nhân tạo lớn đầu tiên của Việt Nam phục vụ công trình thủy điện Thác Bà - nằm trên địa phận tỉnh nào?',
    Answer: 'YÊN BÁI',
    Alternatives: 'YEN BAI; TỈNH YÊN BÁI'
  },
  {
    Points: 20,
    Prompt: 'Nhà văn hiện thực nào là tác giả của truyện ngắn xuất sắc "Làng" khắc họa tình cảm yêu làng Chợ Dầu gắn bó sâu sắc với tình yêu kháng chiến?',
    Answer: 'KIM LÂN',
    Alternatives: 'KIM LAN; NGUYỄN VĂN TÀI'
  },
  {
    Points: 20,
    Prompt: 'Đồ thị biểu diễn hàm số bậc nhất y = ax + b (với hệ số a khác 0) trong hệ tọa độ Descartes Oxy luôn là một hình gì?',
    Answer: 'ĐƯỜNG THẲNG',
    Alternatives: 'DUONG THANG; MỘT ĐƯỜNG THẲNG'
  },
  {
    Points: 20,
    Prompt: 'Trường học yêu nước tiến bộ Đông Kinh Nghĩa Thục do các nhân sĩ thức thời như Lương Văn Can, Phan Chu Trinh sáng lập năm 1907 tại địa phương nào?',
    Answer: 'HÀ NỘI',
    Alternatives: 'HA NOI; THÀNH PHỐ HÀ NỘI'
  },
  {
    Points: 20,
    Prompt: 'Khoảng cách mà một chùm tia sáng truyền đi được trong môi trường chân không trong khoảng thời gian đúng 1 năm chí tuyến gọi là gì?',
    Answer: 'NĂM ÁNH SÁNG',
    Alternatives: 'LIGHT YEAR; LY; NAM ANH SANG'
  },
  {
    Points: 20,
    Prompt: 'Thiết bị quang học cấu tạo từ lăng kính hoặc cách mạng nhiễu xạ dùng để phân tích chùm sáng đa sắc thành các dải đơn sắc gọi là gì?',
    Answer: 'MÁY QUANG PHỔ',
    Alternatives: 'MAY QUANG PHO; SPECTROMETER; QUANG PHỔ KẾ'
  },
  {
    Points: 20,
    Prompt: 'Phản ứng thế hóa học giữa kim loại đứng trước hydro trong dãy điện hóa (như Zn, Fe) với dung dịch axit clohidric loãng sẽ giải phóng khí nào?',
    Answer: 'KHÍ HIDRO',
    Alternatives: 'H2; HIDRO; HYDROGEN; KHI HIDRO'
  },
  {
    Points: 20,
    Prompt: 'Quá trình tế bào vận chuyển các phân tử hay ion ngược chiều građien nồng độ đòi hỏi phải tiêu tốn phân tử năng lượng ATP gọi là gì?',
    Answer: 'VẬN CHUYỂN CHỦ ĐỘNG',
    Alternatives: 'VẬN CHUYỂN TÍCH CỰC; VAN CHUYEN CHU DONG; ACTIVE TRANSPORT'
  },
  {
    Points: 20,
    Prompt: 'Dòng sông bồi đắp nên châu thổ phì nhiêu lớn nhất miền Bắc nước ta, bắt nguồn từ Vân Nam (Trung Quốc) đổ ra vịnh Bắc Bộ là con sông nào?',
    Answer: 'SÔNG HỒNG',
    Alternatives: 'SÔNG NHỊ HÀ; SONG HONG; SÔNG THAO; RED RIVER'
  },
  {
    Points: 20,
    Prompt: 'Bài thơ "Ánh trăng" với hình ảnh vầng trăng tri kỷ nhắc nhở thái độ sống "uống nước nhớ nguồn" là sáng tác của nhà thơ quân đội nào?',
    Answer: 'NGUYỄN DUY',
    Alternatives: 'NGUYEN DUY'
  },
  {
    Points: 20,
    Prompt: 'Tổ chức liên chính phủ toàn cầu lớn nhất hiện nay được thành lập vào năm 1945 tại San Francisco nhằm gìn giữ hòa bình thế giới là tổ chức nào?',
    Answer: 'LIÊN HỢP QUỐC',
    Alternatives: 'LIEN HOP QUOC; UN; UNITED NATIONS'
  },
  {
    Points: 20,
    Prompt: 'Trong mặt phẳng tọa độ hai chiều Oxy, giao điểm của trục hoành và trục tung có tọa độ (0;0) được gọi là điểm gì?',
    Answer: 'GỐC TỌA ĐỘ',
    Alternatives: 'GOC TOA DO; ĐIỂM GỐC; ĐIỂM O'
  },
  {
    Points: 20,
    Prompt: 'Khí amoniac (công thức hóa học NH3) có tính bazo yếu khi tan trong nước, làm giấy quỳ tím ẩm chuyển sang màu gì?',
    Answer: 'MÀU XANH',
    Alternatives: 'XANH; BLUE; MÀU XANH LAM'
  },
  {
    Points: 20,
    Prompt: 'Đại lượng vật lý đo bằng tỉ số giữa công cơ học thực hiện được và khoảng thời gian thực hiện công đó được gọi là gì?',
    Answer: 'CÔNG SUẤT',
    Alternatives: 'CONG SUAT; POWER'
  },
  {
    Points: 20,
    Prompt: 'Tỉnh nào ở phía Nam Tây Nguyên nổi tiếng với thắng cảnh hồ Tà Đùng - được ví như "vịnh Hạ Long trên cạn"?',
    Answer: 'ĐẮK NÔNG',
    Alternatives: 'DAK NONG; TỈNH ĐẮK NÔNG; DAKNONG'
  },
  {
    Points: 20,
    Prompt: 'Tập hợp các cá thể cùng loài, cùng sinh sống trong một sinh cảnh xác định vào một thời điểm nhất định gọi là gì trong sinh thái học?',
    Answer: 'QUẦN THỂ',
    Alternatives: 'QUẦN THỂ SINH VẬT; QUAN THE; POPULATION'
  },
  {
    Points: 20,
    Prompt: 'Bài thơ "Đoàn thuyền đánh cá" của nhà thơ Huy Cận ra đời từ chuyến đi thực tế dài ngày tại vùng mỏ than của tỉnh nào?',
    Answer: 'QUẢNG NINH',
    Alternatives: 'QUANG NINH; TỈNH QUẢNG NINH'
  },
  {
    Points: 20,
    Prompt: 'Vị đại tướng đầu tiên của Quân đội Nhân dân Việt Nam, người anh cả của lực lượng vũ trang nhân dân Việt Nam là ai?',
    Answer: 'VÕ NGUYÊN GIÁP',
    Alternatives: 'ĐẠI TƯỚNG VÕ NGUYÊN GIÁP; VO NGUYEN GIAP; TƯỚNG GIÁP'
  },
  {
    Points: 20,
    Prompt: 'Đại hội Thể thao Olympic mùa hè hiện đại đầu tiên được tổ chức vào năm 1896 tại thành phố lịch sử nào của Hy Lạp?',
    Answer: 'ATHENS',
    Alternatives: 'A-THEN; ATHEN; ATHENS'
  },
  {
    Points: 20,
    Prompt: 'Polime tự nhiên nào có công thức (C6H10O5)n, là thành phần cấu tạo nên thành tế bào thực vật và sợi bông nõn nguyên chất?',
    Answer: 'XENLULOZƠ',
    Alternatives: 'CELLULOSE; XENLULOZO; CENLULOZO'
  },
  {
    Points: 20,
    Prompt: 'Đường thẳng vuông góc với mặt phẳng phân cách giữa hai môi trường tại điểm tới của tia sáng được gọi là đường gì?',
    Answer: 'PHÁP TUYẾN',
    Alternatives: 'ĐƯỜNG PHÁP TUYẾN; PHAP TUYEN; NORMAL'
  },
  {
    Points: 20,
    Prompt: 'Cụm đảo Cù Lao Chàm nổi tiếng với vẻ đẹp hoang sơ và san hô phong phú trực thuộc địa giới hành chính của thành phố nào ở Quảng Nam?',
    Answer: 'HỘI AN',
    Alternatives: 'THÀNH PHỐ HỘI AN; HOI AN'
  },
  {
    Points: 20,
    Prompt: 'Truyện thơ Nôm "Chuyện người con gái Nam Xương" của tác giả Nguyễn Dữ ngợi ca đức hạnh và số phận bi kịch của người phụ nữ tên là gì?',
    Answer: 'VŨ NƯƠNG',
    Alternatives: 'VŨ THỊ THIẾT; VU NUONG'
  },
  {
    Points: 20,
    Prompt: 'Đa thức hiệu hai bình phương x^2 - 9 khi phân tích thành nhân tử sẽ bằng tích của biểu thức (x - 3) và biểu thức nào?',
    Answer: 'X + 3',
    Alternatives: 'X CỘNG 3; X+3; (X + 3)'
  },
  {
    Points: 20,
    Prompt: 'Anh hùng lực lượng vũ trang nào đã dũng cảm lấy chính thân mình để lấp lỗ châu mai của địch trong trận mở màn Him Lam ở Điện Biên Phủ?',
    Answer: 'PHAN ĐÌNH GIÓT',
    Alternatives: 'PHAN DINH GIOT'
  },
  {
    Points: 20,
    Prompt: 'Trong hệ tuần hoàn kép của thú, vòng tuần hoàn đưa máu giàu oxy từ tâm thất trái đi nuôi khắp các mô cơ quan của cơ thể gọi là vòng tuần hoàn gì?',
    Answer: 'VÒNG TUẦN HOÀN LỚN',
    Alternatives: 'TUẦN HOÀN LỚN; SYSTEMIC CIRCULATION'
  },
  {
    Points: 20,
    Prompt: 'Quốc gia nào ở bán đảo Đông Dương có hình dải đất uốn lượn hình chữ S trải dài trên 15 vĩ độ, thủ đô là Hà Nội?',
    Answer: 'VIỆT NAM',
    Alternatives: 'VIET NAM; CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'
  },
  {
    Points: 20,
    Prompt: 'Phản ứng giữa axit cacboxylic và ancol có mặt axit sunfuric đặc đun nóng để tạo thành este và nước được gọi là phản ứng gì?',
    Answer: 'PHẢN ỨNG ESTE HÓA',
    Alternatives: 'ESTE HÓA; ESTERIFICATION; ESTE HOA'
  },
  {
    Points: 20,
    Prompt: 'Chùm tia phóng xạ gồm dòng các hạt electron mang điện tích âm phóng ra với vận tốc cực lớn từ hạt nhân nguyên tử không bền gọi là gì?',
    Answer: 'TIA BETA TRỪ',
    Alternatives: 'BETA; TIA BETA; BETA TRỪ; BETA MINUS'
  },
  {
    Points: 20,
    Prompt: 'Thiên tiểu thuyết hiện thực gai góc "Bỉ vỏ" viết về số phận đầy bi kịch của cô gái quê tên Bính tại đất Cảng Hải Phòng là của nhà văn nào?',
    Answer: 'NGUYÊN HỒNG',
    Alternatives: 'NGUYEN HONG'
  },
  {
    Points: 20,
    Prompt: 'Triều đại phong kiến nào trong lịch sử Việt Nam kéo dài 175 năm nổi tiếng với lệ đặt Thái thượng hoàng cùng vua coi việc nước?',
    Answer: 'NHÀ TRẦN',
    Alternatives: 'TRIỀU TRẦN; NHA TRAN; NHÀ TRẦN'
  },
  {
    Points: 20,
    Prompt: 'Dãy núi Hoàng Liên Sơn hùng vĩ - nơi có đỉnh Fansipan - nằm trải dài qua địa giới hành chính của hai tỉnh Lào Cai và tỉnh nào?',
    Answer: 'LAI CHÂU',
    Alternatives: 'LAI CHAU; TỈNH LAI CHÂU'
  },
  {
    Points: 20,
    Prompt: 'Enzim ADN polymeraza chỉ có thể gắn các nucleotit tự do vào đầu 3\'-OH tự do, do đó mạch ADN mới luôn được kéo dài theo chiều nào?',
    Answer: '5\' ĐẾN 3\'',
    Alternatives: '5 ĐẾN 3; 5\' - 3\'; 5 PHẨY ĐẾN 3 PHẨY'
  },
  {
    Points: 20,
    Prompt: 'Phương trình bậc hai x^2 = 25 có hai nghiệm thực đối nhau, nghiệm dương của phương trình là số mấy?',
    Answer: '5',
    Alternatives: 'NĂM; SỐ 5; NAM; X = 5'
  },
  {
    Points: 20,
    Prompt: 'Để phòng bệnh bướu cổ và thiểu năng trí tuệ, người ta thường bổ sung vi chất nào vào muối ăn hàng ngày?',
    Answer: 'IOT',
    Alternatives: 'IODINE; I-ỐT; IOT; I'
  },
  {
    Points: 20,
    Prompt: 'Quốc gia châu Âu nào là quê hương khởi nguồn của cuộc Cách mạng công nghiệp lần thứ nhất vào giữa thế kỷ 18 với cỗ máy hơi nước?',
    Answer: 'NƯỚC ANH',
    Alternatives: 'ANH; VƯƠNG QUỐC ANH; GREAT BRITAIN'
  },

  // ================= 40 CÂU 30 ĐIỂM =================
  {
    Points: 30,
    Prompt: 'Trong trận Chi Lăng năm 1427, danh tướng nghĩa quân Lam Sơn nào đã cùng Nguyễn Xí chỉ huy cánh quân phục kích chém đầu Liễu Thăng?',
    Answer: 'LÊ SÁT',
    Alternatives: 'TƯỚNG LÊ SÁT; LE SAT'
  },
  {
    Points: 30,
    Prompt: 'Khi một chùm ánh sáng đơn sắc truyền từ không khí vào môi trường nước có chiết suất n = 4/3 thì bước sóng của ánh sáng sẽ thay đổi thế nào?',
    Answer: 'GIẢM ĐI',
    Alternatives: 'GIẢM; GIAM DI; NHO DI'
  },
  {
    Points: 30,
    Prompt: 'Hợp chất axit cacboxylic no đơn chức duy nhất nào vừa có tính axit vừa có khả năng tham gia phản ứng tráng bạc với thuốc thử Tollens?',
    Answer: 'AXIT FOMIC',
    Alternatives: 'HCOOH; AXIT METANOIC; FORMIC ACID'
  },
  {
    Points: 30,
    Prompt: 'Quy luật di truyền của Mooc-gan khẳng định các gen cùng nằm trên một nhiễm sắc thể có xu hướng cùng phân ly về một giao tử gọi là quy luật gì?',
    Answer: 'LIÊN KẾT GEN',
    Alternatives: 'DI TRUYỀN LIÊN KẾT; LIEN KET GEN; LINKAGE'
  },
  {
    Points: 30,
    Prompt: 'Hồ Ba Bể - hồ nước ngọt tự nhiên trên núi đá vôi lớn nhất nước ta - nằm ở độ cao khoảng 145 mét thuộc địa phận tỉnh nào?',
    Answer: 'BẮC KẠN',
    Alternatives: 'BAC KAN; TỈNH BẮC KẠN; BẮC CẠN'
  },
  {
    Points: 30,
    Prompt: 'Hai số thực dương có tổng bằng 7 và có tích bằng 12. Hãy tìm giá trị của số lớn hơn trong hai số đó?',
    Answer: '4',
    Alternatives: 'BỐN; BON; SỐ 4'
  },
  {
    Points: 30,
    Prompt: 'Cuộc khởi nghĩa Hai Bà Trưng quật khởi đánh đuổi thái thú Tô Định nhà Đông Hán đã nổ ra vào mùa xuân năm nào sau Công nguyên?',
    Answer: 'NĂM 40',
    Alternatives: '40; NĂM 40 SCN; NAM 40'
  },
  {
    Points: 30,
    Prompt: 'Bài thơ "Màu tím hoa sim" bất hủ viết về tình yêu chung thủy thời kháng chiến chống Pháp là tác phẩm của nhà thơ nào quê ở Thanh Hóa?',
    Answer: 'HỮU LOAN',
    Alternatives: 'HUU LOAN; THI SĨ HỮU LOAN'
  },
  {
    Points: 30,
    Prompt: 'Hiện tượng thiên văn khi Mặt Trời chiếu thẳng góc lên đường xích đạo của Trái Đất, ngày và đêm dài bằng nhau ở mọi nơi gọi là ngày gì?',
    Answer: 'NGÀY PHÂN',
    Alternatives: 'XUÂN PHÂN VÀ THU PHÂN; ĐIỂM PHÂN; XUÂN PHÂN; THU PHÂN; EQUINOX'
  },
  {
    Points: 30,
    Prompt: 'Trong công thức tính khoảng vân giao thoa ánh sáng i = (lambda * D) / a, chữ cái "a" biểu diễn đại lượng nào?',
    Answer: 'KHOẢNG CÁCH GIỮA HAI KHE',
    Alternatives: 'KHOANG CACH GIUA HAI KHE; KHOẢNG CÁCH 2 KHE; KHOANG CACH HAI KHE'
  },
  {
    Points: 30,
    Prompt: 'Trong lò cao luyện gang từ quặng manhetit hoặc hematit, chất khí nào đóng vai trò là chất khử chủ yếu để khử các oxit sắt thành sắt?',
    Answer: 'CACBON MONOXIT',
    Alternatives: 'CO; CARBON MONOXIDE; KHÍ CO'
  },
  {
    Points: 30,
    Prompt: 'Địa danh lịch sử Tân Trào - thủ đô kháng chiến nơi Bác Hồ từng sống và làm việc tại lán Nà Nưa năm 1945 - thuộc tỉnh nào?',
    Answer: 'TUYÊN QUANG',
    Alternatives: 'TUYEN QUANG; TỈNH TUYÊN QUANG'
  },
  {
    Points: 30,
    Prompt: 'Đảo Phú Quý (còn được gọi là cù lao Thu) - hòn đảo tiền tiêu giàu tiềm năng du lịch ở biển Nam Trung Bộ - thuộc quyền quản lý của tỉnh nào?',
    Answer: 'BÌNH THUẬN',
    Alternatives: 'BINH THUAN; TỈNH BÌNH THUẬN'
  },
  {
    Points: 30,
    Prompt: 'Đột biến điểm làm hồng cầu biến thành hình liềm ở người xảy ra do dạng đột biến nào ở bộ ba mã hóa thứ 6 của chuỗi beta-hemoglobin?',
    Answer: 'ĐỘT BIẾN THAY THẾ',
    Alternatives: 'THAY THẾ; THAY THE CAP NUCLEOTIT; DOT BIEN THAY THE'
  },
  {
    Points: 30,
    Prompt: 'Tiểu thuyết hiện thực tâm lý lừng danh "Đỏ và Đen" kể về cuộc đời và tham vọng của nhân vật Julien Sorel là kiệt tác của văn hào Pháp nào?',
    Answer: 'STENDHAL',
    Alternatives: 'XTĂNG-ĐAN; STENDHAL; HENRI BEYLE'
  },
  {
    Points: 30,
    Prompt: 'Cho một tam giác vuông có hai cạnh góc vuông lần lượt là 6 cm và 8 cm. Hãy tính độ dài đường cao ứng với cạnh huyền của tam giác đó?',
    Answer: '4,8',
    Alternatives: '4.8; 4,8 CM; BỐN PHẨY TÁM; 24/5'
  },
  {
    Points: 30,
    Prompt: 'Chu kỳ dao động điều hòa của một con lắc đơn chỉ phụ thuộc vào chiều dài của dây treo và đại lượng gia tốc nào của trọng trường?',
    Answer: 'GIA TỐC TRỌNG TRƯỜNG',
    Alternatives: 'GIA TỐC RƠI TỰ DO; G; GIA TOC TRONG TRUONG'
  },
  {
    Points: 30,
    Prompt: 'Hội nghị hợp nhất các tổ chức cộng sản để thành lập Đảng Cộng sản Việt Nam vào mùa xuân năm 1930 diễn ra tại bán đảo nào ở Hương Cảng?',
    Answer: 'CỬU LONG',
    Alternatives: 'HƯƠNG CẢNG; HONG KONG; CUU LONG; KOWLOON'
  },
  {
    Points: 30,
    Prompt: 'Quá trình oxy hóa - khử xảy ra trên bề mặt các điện cực khi có dòng điện một chiều đi qua dung dịch chất điện phân được gọi là gì?',
    Answer: 'ĐIỆN PHÂN',
    Alternatives: 'SỰ ĐIỆN PHÂN; DIEN PHAN; ELECTROLYSIS'
  },
  {
    Points: 30,
    Prompt: 'Hệ thống đầm phá Tam Giang - Cầu Hai, đầm phá nước lợ lớn nhất Đông Nam Á với diện tích 216 km2, thuộc địa phận tỉnh nào?',
    Answer: 'THỪA THIÊN HUẾ',
    Alternatives: 'THUA THIEN HUE; TỈNH THỪA THIÊN HUẾ; HUẾ'
  },
  {
    Points: 30,
    Prompt: 'Hiện tượng hạt phấn của cây này được gió, nước hoặc côn trùng chuyển đến đầu nhụy của cây khác trong cùng loài gọi là hiện tượng gì?',
    Answer: 'GIAO PHẤN',
    Alternatives: 'THỤ PHẤN CHÉO; GIAO PHAN; CROSS POLLINATION'
  },
  {
    Points: 30,
    Prompt: 'Con đường vận tải chiến lược chi viện sức người sức của từ miền Bắc vào chiến trường miền Nam xẻ dọc dãy Trường Sơn mang tên vị lãnh tụ nào?',
    Answer: 'ĐƯỜNG MÒN HỒ CHÍ MINH',
    Alternatives: 'ĐƯỜNG TRƯỜNG SƠN; HỒ CHÍ MINH; HO CHI MINH'
  },
  {
    Points: 30,
    Prompt: 'Vở kịch lịch sử "Vũ Như Tô" khắc họa sâu sắc mâu thuẫn giữa khát vọng nghệ thuật thuần túy và lợi ích quần chúng là tác phẩm của nhà văn nào?',
    Answer: 'NGUYỄN HUY TƯỞNG',
    Alternatives: 'NGUYEN HUY TUONG'
  },
  {
    Points: 30,
    Prompt: 'Quá trình biến đổi trạng thái của một khối lượng khí xác định trong đó thể tích chất khí được duy trì không đổi gọi là quá trình gì?',
    Answer: 'QUÁ TRÌNH ĐẲNG TÍCH',
    Alternatives: 'ĐẲNG TÍCH; DANG TICH; ISOCHORIC PROCESS'
  },
  {
    Points: 30,
    Prompt: 'Phương pháp nhiệt luyện dùng bột kim loại nhôm để khử oxit của các kim loại kém hoạt động hơn ở nhiệt độ cao gọi là phản ứng gì?',
    Answer: 'PHẢN ỨNG NHIỆT NHÔM',
    Alternatives: 'NHIỆT NHÔM; NHIET NHOM; ALUMINOTHERMIC'
  },
  {
    Points: 30,
    Prompt: 'Đạo hàm bậc nhất của hàm số mũ tự nhiên y = e^x (với e là cơ số tự nhiên Euler) bằng hàm số nào?',
    Answer: 'E^X',
    Alternatives: 'E MŨ X; EX; E^X'
  },
  {
    Points: 30,
    Prompt: 'Lá cờ đỏ sao vàng năm cánh lần đầu tiên xuất hiện trong cuộc khởi nghĩa vũ trang hào hùng nào của nhân dân miền Nam năm 1940?',
    Answer: 'KHỞI NGHĨA NAM KỲ',
    Alternatives: 'NAM KỲ KHỞI NGHĨA; KHOI NGHIA NAM KY'
  },
  {
    Points: 30,
    Prompt: 'Quốc gia nào ở khu vực Nam Á là nơi bắt nguồn của Phật giáo và có con sông Hằng linh thiêng chảy qua?',
    Answer: 'ẤN ĐỘ',
    Alternatives: 'AN DO; INDIA; NƯỚC ẤN ĐỘ'
  },
  {
    Points: 30,
    Prompt: 'Ở thực vật C4 (như ngô, mía), chất nhận CO2 đầu tiên trong pha tối quang hợp là hợp chất có chứa bao nhiêu nguyên tử cacbon?',
    Answer: '3',
    Alternatives: '3 CACBON; BA; HỢP CHẤT 3C; PEP'
  },
  {
    Points: 30,
    Prompt: 'Trong mạch dao động điện từ lý tưởng LC, năng lượng điện trường biến thiên điều hòa và tập trung chủ yếu ở linh kiện nào?',
    Answer: 'TỤ ĐIỆN',
    Alternatives: 'TU DIEN; CAPACITOR'
  },
  {
    Points: 30,
    Prompt: 'Bài thơ "Thơ duyên" với những câu thơ xao xuyến "Mây biếc về đâu bay gấp gấp / Con cò trên ruộng cánh phân vân..." là của nhà thơ nào?',
    Answer: 'XUÂN DIỆU',
    Alternatives: 'XUAN DIEU; ÔNG HOÀNG THƠ TÌNH'
  },
  {
    Points: 30,
    Prompt: 'Vị vua nào của triều Lý đã có công đổi tên quốc hiệu nước ta thành Đại Việt và cho xây dựng Văn Miếu Thăng Long năm 1070?',
    Answer: 'LÝ THÁNH TÔNG',
    Alternatives: 'LY THANH TONG; VUA LÝ THÁNH TÔNG'
  },
  {
    Points: 30,
    Prompt: 'Nguyên tố phi kim nhóm VIA nào tồn tại ở dạng tinh thể rắn màu vàng ở điều kiện thường, khi cháy tạo ra ngọn lửa màu xanh lam?',
    Answer: 'LƯU HUỲNH',
    Alternatives: 'S; SULFUR; LUU HUYNH'
  },
  {
    Points: 30,
    Prompt: 'Cột mốc ngã ba biên giới Việt Nam - Lào - Trung Quốc tại đỉnh núi Khoang La San thuộc địa bàn xã Sín Thầu của huyện nào tỉnh Điện Biên?',
    Answer: 'MƯỜNG NHÉ',
    Alternatives: 'HUYỆN MƯỜNG NHÉ; MUONG NHE; A PA CHẢI'
  },
  {
    Points: 30,
    Prompt: 'Trong hệ tọa độ không gian Oxyz, phương trình tổng quát biểu diễn mặt phẳng tọa độ (Oxy) là phương trình nào?',
    Answer: 'Z = 0',
    Alternatives: 'Z=0; Z BẰNG 0'
  },
  {
    Points: 30,
    Prompt: 'Hiện tượng ánh sáng giải phóng các electron liên kết để tạo thành các electron dẫn và lỗ trống bên trong khối bán dẫn gọi là gì?',
    Answer: 'QUANG ĐIỆN TRONG',
    Alternatives: 'HIỆN TƯỢNG QUANG ĐIỆN TRONG; QUANG DẪN; QUANG DIEN TRONG'
  },
  {
    Points: 30,
    Prompt: 'Phi hành gia người Mỹ nào trong sứ mệnh tàu Apollo 11 năm 1969 đã trở thành người đầu tiên đặt chân lên bề mặt Mặt Trăng?',
    Answer: 'NEIL ARMSTRONG',
    Alternatives: 'ARMSTRONG; NAY-Ơ ARM-STRONG; NEIL ALDEN ARMSTRONG'
  },
  {
    Points: 30,
    Prompt: 'Ở các loài động vật giao phối phân tính, do số lượng tinh trùng mang NST X và NST Y sinh ra ngang nhau nên tỉ lệ giới tính khi thụ tinh xấp xỉ tỉ lệ nào?',
    Answer: '1:1',
    Alternatives: '1/1; 1-1; 1 : 1; MỘT MỘT'
  },
  {
    Points: 30,
    Prompt: 'Trong dãy hoạt động hóa học của kim loại, kim loại kiềm nào sau đây có tính khử mạnh nhất: Liti, Natri, Kali hay Canxi?',
    Answer: 'KALI',
    Alternatives: 'K; POTASSIUM'
  },
  {
    Points: 30,
    Prompt: 'Truyện ngắn ấm áp "Gió lạnh đầu mùa" với hình ảnh hai đứa trẻ chia sẻ chiếc áo ấm cho bé Hiên là sáng tác của nhà văn nào?',
    Answer: 'THẠCH LAM',
    Alternatives: 'THACH LAM; NGUYỄN TƯỜNG VINH'
  }
];

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

export function validateAndInsert() {
  console.log(`Checking ${NEW_VEDICH_PART2.length} VeDich part 2 questions...`);

  // 1. Distribution of points
  const pointsCount = { 10: 0, 20: 0, 30: 0 };
  for (const q of NEW_VEDICH_PART2) {
    pointsCount[q.Points]++;
    if (!q.Prompt || !q.Answer) {
      throw new Error(`Missing Prompt or Answer in question: ${JSON.stringify(q)}`);
    }
  }
  console.log('Points distribution:', pointsCount);
  if (pointsCount[10] !== 40 || pointsCount[20] !== 40 || pointsCount[30] !== 40) {
    throw new Error(`Invalid points count: ${JSON.stringify(pointsCount)}`);
  }

  // 2. Self-uniqueness
  const seenNew = new Set<string>();
  for (const q of NEW_VEDICH_PART2) {
    const norm = normalize(q.Prompt);
    if (seenNew.has(norm)) {
      throw new Error(`Duplicate prompt in new VeDich questions: ${q.Prompt}`);
    }
    seenNew.add(norm);
  }

  // 3. Collision with all existing questions
  const existingPath = path.resolve('server/question-bank/all_existing_prompts.json');
  const existing: { sheet: string; prompt: string; answer: string }[] = JSON.parse(fs.readFileSync(existingPath, 'utf8'));

  let collisionCount = 0;
  for (let i = 0; i < NEW_VEDICH_PART2.length; i++) {
    const q = NEW_VEDICH_PART2[i];
    const qTokens = wordTokens(q.Prompt);
    const normQ = normalize(q.Prompt);

    for (const ex of existing) {
      const normEx = normalize(ex.prompt);
      if (normQ === normEx) {
        console.error(`[EXACT] Q${i + 1} (${q.Points}p) collides with ${ex.sheet}: "${q.Prompt}"`);
        collisionCount++;
      } else {
        const exTokens = wordTokens(ex.prompt);
        const sim = jaccardSimilarity(qTokens, exTokens);
        if (sim > 0.48) {
          console.warn(`[SIMILAR ${(sim * 100).toFixed(0)}%] Q${i + 1} (${q.Points}p) ~ ${ex.sheet}: "${q.Prompt}" vs "${ex.prompt}"`);
          collisionCount++;
        }
      }
    }
  }

  if (collisionCount > 0) {
    throw new Error(`Found ${collisionCount} potential collisions.`);
  }

  console.log('ALL 120 VEDICH PART 2 QUESTIONS PASSED VALIDATION! 0 collisions with existing 555 questions.');

  // 4. Update local Excel workbook
  const excelPath = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
  const wb = xlsx.readFile(excelPath);
  const vdSheet = wb.Sheets['VeDich'];
  const existingRows = xlsx.utils.sheet_to_json<any>(vdSheet);

  console.log(`Current VeDich count: ${existingRows.length}`);
  const combinedRows = [...existingRows, ...NEW_VEDICH_PART2];
  console.log(`New VeDich count: ${combinedRows.length}`);

  const newSheet = xlsx.utils.json_to_sheet(combinedRows);
  wb.Sheets['VeDich'] = newSheet;
  xlsx.writeFile(wb, excelPath);
  console.log('Successfully saved updated workbook to', excelPath);
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('addVeDichPart2')) {
  validateAndInsert();
}
