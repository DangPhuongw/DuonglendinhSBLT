import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

export interface VeDichQ {
  Points: 10 | 20 | 30;
  Prompt: string;
  Answer: string;
  Alternatives: string;
}

export const NEW_VEDICH_QUESTIONS: VeDichQ[] = [
  // ================= 40 CÂU 10 ĐIỂM =================
  {
    Points: 10,
    Prompt: 'Ngọn đèo nổi tiếng nào cắt ngang dãy núi Hoành Sơn, là ranh giới tự nhiên giữa hai tỉnh Hà Tĩnh và Quảng Bình?',
    Answer: 'ĐÈO NGANG',
    Alternatives: 'DEO NGANG; NGANG'
  },
  {
    Points: 10,
    Prompt: 'Quốc gia láng giềng nào có chung đường biên giới trên đất liền dài nhất với Việt Nam?',
    Answer: 'LÀO',
    Alternatives: 'LAO; LAOS; NƯỚC LÀO'
  },
  {
    Points: 10,
    Prompt: 'Nhân vật Thúy Kiều trong kiệt tác "Truyện Kiều" của đại thi hào Nguyễn Du mang họ gì?',
    Answer: 'HỌ VƯƠNG',
    Alternatives: 'VƯƠNG; VUONG; HO VUONG'
  },
  {
    Points: 10,
    Prompt: 'Khí nào là đơn chất nhẹ nhất trong tất cả các chất khí ở điều kiện nhiệt độ và áp suất tiêu chuẩn?',
    Answer: 'HIDRO',
    Alternatives: 'HIĐRO; HYDROGEN; H2; H-2'
  },
  {
    Points: 10,
    Prompt: 'Loài động vật thân mềm nào ở biển thường phun ra chất dịch màu đen để ngụy trang và trốn thoát kẻ thù?',
    Answer: 'MỰC',
    Alternatives: 'CÁ MỰC; CA MUC; MUC'
  },
  {
    Points: 10,
    Prompt: 'Dạng năng lượng dự trữ bên trong một vật nhờ vị trí của nó so với mặt đất được gọi là gì?',
    Answer: 'THẾ NĂNG TRỌNG TRƯỜNG',
    Alternatives: 'THẾ NĂNG; THE NANG; THE NANG TRONG TRUONG'
  },
  {
    Points: 10,
    Prompt: 'Trong hình học, một góc có số đo đúng bằng 90 độ được gọi là góc gì?',
    Answer: 'GÓC VUÔNG',
    Alternatives: 'GOC VUONG; VUÔNG'
  },
  {
    Points: 10,
    Prompt: 'Hiện tượng thủy triều lên xuống hàng ngày trên các đại dương chủ yếu do lực hấp dẫn của thiên thể nào gây ra đối với Trái Đất?',
    Answer: 'MẶT TRĂNG',
    Alternatives: 'MAT TRANG; NGUYỆT CẦU; MOON'
  },
  {
    Points: 10,
    Prompt: 'Môn võ thuật cổ truyền của Việt Nam còn được gọi là Việt Võ Đạo, do võ sư Nguyễn Lộc sáng lập năm 1938 mang tên là gì?',
    Answer: 'VOVINAM',
    Alternatives: 'VIỆT VÕ ĐẠO; VIET VO DAO'
  },
  {
    Points: 10,
    Prompt: 'Trong ký hiệu âm nhạc, dấu hiệu đặt trước nốt nhạc nhằm nâng cao độ của nốt đó lên nửa cung được gọi là gì?',
    Answer: 'DẤU THĂNG',
    Alternatives: 'DAU THANG; DẤU THĂNG (#); SHARP'
  },
  {
    Points: 10,
    Prompt: 'Dưới triều Trần, danh tướng nào được vua phong làm Tiết chế Quốc công chỉ huy tối cao quân đội?',
    Answer: 'TRẦN HƯNG ĐẠO',
    Alternatives: 'TRẦN QUỐC TUẤN; TRAN HUNG DAO; TRAN QUOC TUAN'
  },
  {
    Points: 10,
    Prompt: 'Tỉnh nào ở vùng Duyên hải Nam Trung Bộ gắn liền với danh xưng "Xứ hoa vàng trên cỏ xanh"?',
    Answer: 'PHÚ YÊN',
    Alternatives: 'PHU YEN; TỈNH PHÚ YÊN'
  },
  {
    Points: 10,
    Prompt: 'Cơ quan bài tiết quan trọng nào trong cơ thể người có hình hạt đậu đảm nhiệm chức năng lọc máu tạo nước tiểu?',
    Answer: 'THẬN',
    Alternatives: 'QUẢ THẬN; THAN; QUA THAN; HAI QUẢ THẬN'
  },
  {
    Points: 10,
    Prompt: 'Tập thơ đầu tay xuất bản năm 1946 của nhà thơ Tố Hữu, mở đầu cho sự nghiệp thơ cách mạng của ông có tên là gì?',
    Answer: 'TỪ ẤY',
    Alternatives: 'TU AY; TẬP THƠ TỪ ẤY'
  },
  {
    Points: 10,
    Prompt: 'Kim loại nào thường được phủ (mạ) lên bề mặt các tấm thép mỏng để chế tạo tôn lợp nhà chống gỉ sét?',
    Answer: 'KẼM',
    Alternatives: 'ZN; KEM; ZINC'
  },
  {
    Points: 10,
    Prompt: 'Đại lượng vật lý nào đặc trưng cho mức độ quán tính của một vật thể trong cơ học cổ điển?',
    Answer: 'KHỐI LƯỢNG',
    Alternatives: 'KHOI LUONG; MASS'
  },
  {
    Points: 10,
    Prompt: 'Loài hoa nào gắn liền với câu ca dao quen thuộc "Trong đầm gì đẹp bằng sen / Lá xanh bông trắng lại chen nhị vàng"?',
    Answer: 'HOA SEN',
    Alternatives: 'SEN; BÔNG SEN; CÂY SEN'
  },
  {
    Points: 10,
    Prompt: 'Quốc gia châu Á nào nổi tiếng trên thế giới với biệt danh là "Xứ sở hoa anh đào"?',
    Answer: 'NHẬT BẢN',
    Alternatives: 'NHAT BAN; JAPAN; PHÙ TANG'
  },
  {
    Points: 10,
    Prompt: 'Tác phẩm văn chính luận hào hùng "Hịch tướng sĩ" khuyên răn tướng sĩ rèn luyện võ nghệ chống Nguyên Mông do ai viết?',
    Answer: 'TRẦN HƯNG ĐẠO',
    Alternatives: 'TRẦN QUỐC TUẤN; TRAN HUNG DAO; HƯNG ĐẠO ĐẠI VƯƠNG'
  },
  {
    Points: 10,
    Prompt: 'Trong truyện cổ tích dân gian Việt Nam, chàng dũng sĩ Thạch Sanh đã dùng vũ khí gì để bắn bị thương chim đại bàng cứu công chúa?',
    Answer: 'CUNG TÊN',
    Alternatives: 'CUNG; NỎ; CUNG TEN'
  },
  {
    Points: 10,
    Prompt: 'Cơ quan sinh dưỡng nào của thực vật có hoa đảm nhiệm chức năng chính là đâm sâu vào lòng đất hút nước và khoáng chất?',
    Answer: 'RỄ',
    Alternatives: 'RỄ CÂY; RE; RE CAY; HỆ RỄ'
  },
  {
    Points: 10,
    Prompt: 'Thuốc thử không màu nào sẽ chuyển sang màu hồng đậm (đỏ cánh sen) khi tiếp xúc với môi trường bazơ (kiềm)?',
    Answer: 'PHENOLPHTHALEIN',
    Alternatives: 'PHENOLPHTALEIN; PHENOL PHTHALEIN'
  },
  {
    Points: 10,
    Prompt: 'Sóng cơ học và âm thanh hoàn toàn không thể lan truyền được trong môi trường nào?',
    Answer: 'CHÂN KHÔNG',
    Alternatives: 'CHAN KHONG; VACUUM'
  },
  {
    Points: 10,
    Prompt: 'Huyện đảo Hoàng Sa của nước ta hiện nay trực thuộc quyền quản lý hành chính của tỉnh/thành phố nào?',
    Answer: 'ĐÀ NẴNG',
    Alternatives: 'THÀNH PHỐ ĐÀ NẴNG; DA NANG'
  },
  {
    Points: 10,
    Prompt: 'Chiến thắng oanh liệt trên dòng sông Như Nguyệt năm 1077 chặn đứng quân Tống xâm lược gắn liền với tên tuổi của vị danh tướng nào thời Lý?',
    Answer: 'LÝ THƯỜNG KIỆT',
    Alternatives: 'LY THUONG KIET; THÁI ÚY LÝ THƯỜNG KIỆT'
  },
  {
    Points: 10,
    Prompt: 'Trong một tam giác vuông, cạnh đối diện trực tiếp với góc vuông và là cạnh có độ dài lớn nhất được gọi là gì?',
    Answer: 'CẠNH HUYỀN',
    Alternatives: 'CANH HUYEN; HUYỀN; HYPOTENUSE'
  },
  {
    Points: 10,
    Prompt: 'Hệ thống đèn tín hiệu giao thông đường bộ tiêu chuẩn tại Việt Nam bao gồm ba màu sắc là Đỏ, Vàng và màu gì?',
    Answer: 'XANH LỤC',
    Alternatives: 'XANH; XANH LÁ; XANH LÁ CÂY; XANH LA; GREEN'
  },
  {
    Points: 10,
    Prompt: 'Ngôi sao mẹ nằm tại trung tâm của Hệ Mặt Trời cung cấp nguồn năng lượng ánh sáng và nhiệt vô tận cho Trái Đất là thiên thể nào?',
    Answer: 'MẶT TRỜI',
    Alternatives: 'MAT TROI; THÁI DƯƠNG; SUN'
  },
  {
    Points: 10,
    Prompt: 'Bài thơ "Tây Tiến" hào hùng bi tráng viết về người lính vệ quốc trong kháng chiến chống Pháp là sáng tác bất hủ của nhà thơ nào?',
    Answer: 'QUANG DŨNG',
    Alternatives: 'QUANG DUNG'
  },
  {
    Points: 10,
    Prompt: 'Ngành thực vật bậc cao nào có cấu tạo đơn giản nhất, chưa có mạch dẫn thực sự và thường mọc thành từng mảng xanh ở nơi ẩm thấp?',
    Answer: 'RÊU',
    Alternatives: 'NGÀNH RÊU; REU; CÂY RÊU'
  },
  {
    Points: 10,
    Prompt: 'Dung dịch nước vôi trong thường dùng trong phòng thí nghiệm hóa học là dung dịch loãng của hợp chất canxi nào?',
    Answer: 'CANXI HIDROXIT',
    Alternatives: 'CA(OH)2; CAOH2; CANXI HIĐROXIT; CALCIUM HYDROXIDE'
  },
  {
    Points: 10,
    Prompt: 'Vịnh Cam Ranh - một trong những vịnh biển nước sâu kín gió chiến lược hàng đầu thế giới thuộc địa phận tỉnh nào của nước ta?',
    Answer: 'KHÁNH HÒA',
    Alternatives: 'KHANH HOA; TỈNH KHÁNH HÒA'
  },
  {
    Points: 10,
    Prompt: 'Vị vua sáng lập triều Nguyễn đã thống nhất giang sơn và chính thức đặt quốc hiệu nước ta là Việt Nam vào năm 1804 là ai?',
    Answer: 'GIA LONG',
    Alternatives: 'NGUYỄN ÁNH; NGUYEN ANH; VUA GIA LONG'
  },
  {
    Points: 10,
    Prompt: 'Lực cản xuất hiện ở bề mặt tiếp xúc khi một vật trượt trên bề mặt của vật khác được gọi là lực ma sát gì?',
    Answer: 'MA SÁT TRƯỢT',
    Alternatives: 'LỰC MA SÁT TRƯỢT; MA SAT TRUOT'
  },
  {
    Points: 10,
    Prompt: 'Trong một trận thi đấu bóng đá sân cỏ tiêu chuẩn, thời gian thi đấu chính thức của mỗi hiệp (chưa tính bù giờ) là bao nhiêu phút?',
    Answer: '45',
    Alternatives: '45 PHÚT; BỐN MƯƠI LĂM; BON MUOI LAM'
  },
  {
    Points: 10,
    Prompt: 'Loại hình nghệ thuật sân khấu cổ truyền thịnh hành ở vùng đồng bằng Bắc Bộ, gắn liền với các tích trò sân đình như "Quan Âm Thị Kính" là gì?',
    Answer: 'CHÈO',
    Alternatives: 'HÁT CHÈO; CHEO; NGHỆ THUẬT CHÈO'
  },
  {
    Points: 10,
    Prompt: 'Tác phẩm văn xuôi "Sống chết mặc bay" phản ánh sự vô trách nhiệm của quan lại phong kiến khi đi hộ đê do nhà văn nào sáng tác?',
    Answer: 'PHẠM DUY TỐN',
    Alternatives: 'PHAM DUY TON'
  },
  {
    Points: 10,
    Prompt: 'Hiện tượng rụng bớt lá vào mùa hanh khô hoặc mùa đông ở thực vật có tác dụng chủ yếu nhằm làm giảm quá trình gì?',
    Answer: 'THOÁT HƠI NƯỚC',
    Alternatives: 'THOAT HOI NUOC; SỰ THOÁT HƠI NƯỚC'
  },
  {
    Points: 10,
    Prompt: 'Kim loại nào có ký hiệu hóa học là Cu, có màu đỏ ánh kim đặc trưng và dẫn điện rất tốt chỉ sau bạc?',
    Answer: 'ĐỒNG',
    Alternatives: 'COPPER; CU; DONG'
  },
  {
    Points: 10,
    Prompt: 'Trong hệ đếm cơ số mười (thập phân), số tự nhiên nhỏ nhất có 3 chữ số là số nào?',
    Answer: '100',
    Alternatives: 'MỘT TRĂM; MOT TRAM; SỐ 100'
  },

  // ================= 40 CÂU 20 ĐIỂM =================
  {
    Points: 20,
    Prompt: 'Cuốn sách phê phán chế độ thực dân "Bản án chế độ thực dân Pháp" của người thanh niên yêu nước Nguyễn Ái Quốc được xuất bản lần đầu năm 1925 tại thủ đô nào?',
    Answer: 'PARIS',
    Alternatives: 'PA-RI; PARI; BA LÊ'
  },
  {
    Points: 20,
    Prompt: 'Tật khúc xạ của mắt khiến người mắc chỉ có khả năng nhìn rõ các vật ở cự ly gần mà không nhìn rõ các vật ở xa được gọi là gì?',
    Answer: 'CẬN THỊ',
    Alternatives: 'CAN THI; TẬT CẬN THỊ; MYOPIA'
  },
  {
    Points: 20,
    Prompt: 'Hợp chất hydrocacbon no đơn giản nhất có công thức CH4, sinh ra từ sự phân hủy kị khí ở đáy đầm lầy có tên gọi là gì?',
    Answer: 'METAN',
    Alternatives: 'CH4; METHANE'
  },
  {
    Points: 20,
    Prompt: 'Loại liên kết hóa học hình thành giữa nhóm amin (-NH2) của axit amin này với nhóm cacboxyl (-COOH) của axit amin kế tiếp trong chuỗi protein gọi là gì?',
    Answer: 'LIÊN KẾT PEPTIT',
    Alternatives: 'LIEN KET PEPTIT; PEPTIDE; LIÊN KẾT PEPTIDE'
  },
  {
    Points: 20,
    Prompt: 'Điểm cực Bắc trên đất liền của lãnh thổ Việt Nam nằm tại xã Lũng Cú, thuộc huyện vùng cao nào của tỉnh Hà Giang?',
    Answer: 'ĐỒNG VĂN',
    Alternatives: 'HUYỆN ĐỒNG VĂN; DONG VAN'
  },
  {
    Points: 20,
    Prompt: 'Nhan đề ban đầu của truyện ngắn xuất sắc "Vợ nhặt" khi nhà văn Kim Lân bắt đầu chắp bút viết trước Cách mạng tháng Tám là gì?',
    Answer: 'XÓM NGỤ CƯ',
    Alternatives: 'XOM NGU CU'
  },
  {
    Points: 20,
    Prompt: 'Trong hình học, hai góc có tổng số đo góc cộng lại bằng 180 độ được gọi là hai góc có tính chất gì đối với nhau?',
    Answer: 'BÙ NHAU',
    Alternatives: 'HAI GÓC BÙ NHAU; BU NHAU'
  },
  {
    Points: 20,
    Prompt: 'Hội nghị Diên Hồng lịch sử do triều đình nhà Trần triệu tập năm 1284 quy tụ tầng lớp nào trong cả nước để hỏi kế sách "đánh hay hòa"?',
    Answer: 'CÁC BẬC PHỤ LÃO',
    Alternatives: 'PHỤ LÃO; PHU LAO; CÁC PHỤ LÃO; CÁC CỤ GIÀ'
  },
  {
    Points: 20,
    Prompt: 'Hiện tượng thiên văn xảy ra khi Mặt Trời, Mặt Trăng và Trái Đất thẳng hàng khiến Mặt Trăng che khuất một phần hay toàn phần ánh sáng Mặt Trời gọi là gì?',
    Answer: 'NHẬT THỰC',
    Alternatives: 'NHAT THUC; SOLAR ECLIPSE'
  },
  {
    Points: 20,
    Prompt: 'Đại lượng vật lý véc-tơ bằng tích giữa khối lượng và vận tốc của một vật chuyển động thẳng gọi là gì?',
    Answer: 'ĐỘNG LƯỢNG',
    Alternatives: 'DONG LUONG; MOMENTUM'
  },
  {
    Points: 20,
    Prompt: 'Trong công nghiệp thực phẩm, người ta chuyển hóa dầu thực vật lỏng thành bơ thực vật rắn thông qua phản ứng cộng với chất khí nào?',
    Answer: 'HIDRO',
    Alternatives: 'H2; HIĐRO; HYDROGEN'
  },
  {
    Points: 20,
    Prompt: 'Quá trình phân giải kị khí cacbohidrat bởi các vi sinh vật để tạo ra rượu etylic hoặc axit lactic gọi là quá trình gì?',
    Answer: 'LÊN MEN',
    Alternatives: 'LEN MEN; FERMENTATION; QUÁ TRÌNH LÊN MEN'
  },
  {
    Points: 20,
    Prompt: 'Dòng sông Sêrêpôk độc đáo ở Tây Nguyên chảy ngược theo hướng Tây sang lãnh thổ Campuchia rồi hợp lưu vào con sông quốc tế nào?',
    Answer: 'SÔNG MÊ KÔNG',
    Alternatives: 'ME KONG; MEKONG; SÔNG MEKONG'
  },
  {
    Points: 20,
    Prompt: 'Bài thơ "Nhớ rừng" mượn lời con hổ trong vườn bách thú để thể hiện nỗi uất hận mất tự do là sáng tác của thi sĩ nào?',
    Answer: 'THẾ LỮ',
    Alternatives: 'THE LU; THI SĨ THẾ LỮ'
  },
  {
    Points: 20,
    Prompt: 'Bức tường Berlin ngăn cách hai miền nước Đức - biểu tượng lớn nhất của thời kỳ Chiến tranh Lạnh - chính thức bị phá bỏ vào năm nào?',
    Answer: '1989',
    Alternatives: 'MỘT NGHÌN CHÍN TRĂM TÁM MƯƠI CHÍN; NAM 1989'
  },
  {
    Points: 20,
    Prompt: 'Phép toán giải tích tìm số mũ lũy thừa x sao cho thỏa mãn a^x = b (với a > 0 và a khác 1) được gọi là phép tính gì?',
    Answer: 'LOGARIT',
    Alternatives: 'LÔGARIT; LOG; LOGARITHM'
  },
  {
    Points: 20,
    Prompt: 'Để nhận biết sự có mặt của ion sunfat (SO4 2-) trong dung dịch, thuốc thử phổ biến nhất là dung dịch chứa cation của kim loại nào?',
    Answer: 'BARI',
    Alternatives: 'BA; BA2+; BARIUM'
  },
  {
    Points: 20,
    Prompt: 'Thiết bị kỹ thuật hoạt động dựa trên định luật cảm ứng điện từ nhằm biến đổi cơ năng thành điện năng được gọi là gì?',
    Answer: 'MÁY PHÁT ĐIỆN',
    Alternatives: 'MAY PHAT DIEN; DYNAMO; GENERATOR'
  },
  {
    Points: 20,
    Prompt: 'Tỉnh duy nhất nào của vùng Tây Nguyên có vị trí "ngã ba Đông Dương", giáp ranh biên giới với cả Lào và Campuchia?',
    Answer: 'KON TUM',
    Alternatives: 'KONTUM; TỈNH KON TUM'
  },
  {
    Points: 20,
    Prompt: 'Các đoạn polynucleotit ngắn được tổng hợp ngắt quãng trên mạch khuôn gián đoạn trong quá trình tái bản ADN được đặt tên là gì?',
    Answer: 'OKAZAKI',
    Alternatives: 'ĐOẠN OKAZAKI; OKAZAKI FRAGMENT'
  },
  {
    Points: 20,
    Prompt: 'Nhà văn hiện thực xuất sắc nào thời kỳ 1930 - 1945 được mệnh danh là "ông vua phóng sự đất Bắc" với các thiên phóng sự như "Cạm bẫy người"?',
    Answer: 'VŨ TRỌNG PHỤNG',
    Alternatives: 'VU TRONG PHUNG'
  },
  {
    Points: 20,
    Prompt: 'Vị thủ lĩnh áo vải Tây Sơn nào đã trực tiếp bài binh bố trận đại phá tan tành 5 vạn quân thủy bộ Xiêm tại Rạch Gầm - Xoài Mút năm 1785?',
    Answer: 'NGUYỄN HUỆ',
    Alternatives: 'QUANG TRUNG; NGUYEN HUE; VUA QUANG TRUNG'
  },
  {
    Points: 20,
    Prompt: 'Trong thi đấu môn bóng bàn theo luật hiện hành, một ván đấu kết thúc khi một bên đạt tối thiểu bao nhiêu điểm và cách biệt ít nhất 2 điểm?',
    Answer: '11',
    Alternatives: '11 ĐIỂM; MƯỜI MỘT; MUOI MOT'
  },
  {
    Points: 20,
    Prompt: 'Hợp chất hóa học tạo bởi một nguyên tử hay ion trung tâm liên kết với các phân tử hoặc ion bao quanh (phối tử) được gọi chung là gì?',
    Answer: 'PHỨC CHẤT',
    Alternatives: 'PHUC CHAT; HỢP CHẤT PHỨC; COMPLEX'
  },
  {
    Points: 20,
    Prompt: 'Trong ba trạng thái thông thường của vật chất gồm Rắn, Lỏng và Khí, âm thanh có tốc độ lan truyền nhanh nhất trong môi trường nào?',
    Answer: 'MÔI TRƯỜNG RẮN',
    Alternatives: 'CHẤT RẮN; THỂ RẮN; RẮN; SOLID'
  },
  {
    Points: 20,
    Prompt: 'Di sản Thiên nhiên Thế giới Vườn quốc gia Phong Nha - Kẻ Bàng với hệ thống hang động đá vôi cổ nhất châu Á nằm trên địa bàn tỉnh nào?',
    Answer: 'QUẢNG BÌNH',
    Alternatives: 'QUANG BINH; TỈNH QUẢNG BÌNH'
  },
  {
    Points: 20,
    Prompt: 'Trong tiểu thuyết kinh điển của nhà văn Tây Ban Nha Cervantes, con ngựa già gầy gò của hiệp sĩ Don Quixote có tên gọi là gì?',
    Answer: 'ROCINANTE',
    Alternatives: 'RÔ-XI-NAN-TÊ; ROXINANTE; RÔXINANTÊ'
  },
  {
    Points: 20,
    Prompt: 'Một tam giác vuông có độ dài hai cạnh góc vuông lần lượt là 3 cm và 4 cm thì diện tích của tam giác đó bằng bao nhiêu cm vuông?',
    Answer: '6',
    Alternatives: '6 CM2; 6 CM VUÔNG; SÁU'
  },
  {
    Points: 20,
    Prompt: 'Thủ lĩnh nông dân kiệt xuất nào được mệnh danh là "Hùm xám Yên Thế" đã lãnh đạo cuộc khởi nghĩa Yên Thế chống Pháp ròng rã gần 30 năm?',
    Answer: 'HOÀNG HOA THÁM',
    Alternatives: 'ĐỀ THÁM; HOANG HOA THAM; DE THAM'
  },
  {
    Points: 20,
    Prompt: 'Tế bào thần kinh chính thức thực hiện chức năng tiếp nhận, xử lý và dẫn truyền các xung thần kinh trong cơ thể được gọi là gì?',
    Answer: 'NƠRON',
    Alternatives: 'NEURON; TẾ BÀO THẦN KINH; TẾ BÀO NƠRON'
  },
  {
    Points: 20,
    Prompt: 'Thành phố châu Âu tráng lệ nào là thủ đô của Cộng hòa Pháp, nổi danh khắp năm châu với mỹ danh "Kinh đô ánh sáng"?',
    Answer: 'PARIS',
    Alternatives: 'PA-RI; PARI; BA LÊ'
  },
  {
    Points: 20,
    Prompt: 'Quá trình công nghệ lọc hóa dầu dùng nhiệt độ cao và xúc tác để bẻ gãy phân tử hidrocacbon mạch dài thành mạch ngắn hơn gọi là gì?',
    Answer: 'CRACKING',
    Alternatives: 'BE GAY MACH; CRACKINH; CRACK-INH'
  },
  {
    Points: 20,
    Prompt: 'Hiện tượng chùm sóng ánh sáng bị uốn cong và lan tỏa sang phía sau khi đi sát qua mép một vật cản gọi là hiện tượng gì?',
    Answer: 'NHIỄU XẠ',
    Alternatives: 'NHIỄU XẠ ÁNH SÁNG; NHIEU XA; DIFFRACTION'
  },
  {
    Points: 20,
    Prompt: 'Văn kiện pháp lý lịch sử tuyên bố khai sinh ra nước Việt Nam Dân chủ Cộng hòa ngày 2/9/1945 do ai đích thân soạn thảo?',
    Answer: 'HỒ CHÍ MINH',
    Alternatives: 'BÁC HỒ; HO CHI MINH; CHỦ TỊCH HỒ CHÍ MINH'
  },
  {
    Points: 20,
    Prompt: 'Chiến thắng oanh liệt của quân dân Hà Nội đánh bại cuộc tập kích chiến lược bằng pháo đài bay B-52 cuối năm 1972 được ví là chiến thắng gì?',
    Answer: 'ĐIỆN BIÊN PHỦ TRÊN KHÔNG',
    Alternatives: 'DIEN BIEN PHU TREN KHONG'
  },
  {
    Points: 20,
    Prompt: 'Quần đảo Côn Đảo gồm 16 hòn đảo lớn nhỏ nằm ngoài khơi bờ biển Nam Bộ hiện thuộc địa giới hành chính của tỉnh nào?',
    Answer: 'BÀ RỊA - VŨNG TÀU',
    Alternatives: 'BA RIA VUNG TAU; BÀ RỊA VŨNG TÀU'
  },
  {
    Points: 20,
    Prompt: 'Loại ARN nào có cấu trúc ba thùy đặc trưng, làm nhiệm vụ vận chuyển chính xác các axit amin tới ribôxôm để dịch mã?',
    Answer: 'TARN',
    Alternatives: 'TRNA; ARN VẬN CHUYỂN; T-ARN'
  },
  {
    Points: 20,
    Prompt: 'Tổng của cấp số nhân lùi vô hạn với số hạng đầu u1 = 1 và công bội q = 1/2 có giá trị hội tụ bằng bao nhiêu?',
    Answer: '2',
    Alternatives: 'HAI; SỐ 2'
  },
  {
    Points: 20,
    Prompt: 'Quá trình phá hủy kim loại hoặc hợp kim do tác dụng hóa học của môi trường xung quanh kèm theo sự xuất hiện của dòng điện gọi là gì?',
    Answer: 'ĂN MÒN ĐIỆN HÓA',
    Alternatives: 'ĂN MÒN ĐIỆN HÓA HỌC; AN MON DIEN HOA'
  },
  {
    Points: 20,
    Prompt: 'Vị danh tướng lãnh đạo quân đội lục quân giành độc lập và trở thành Tổng thống đầu tiên của Hợp chúng quốc Hoa Kỳ là ai?',
    Answer: 'GEORGE WASHINGTON',
    Alternatives: 'WASHINGTON; OA-SINH-TƠN'
  },

  // ================= 40 CÂU 30 ĐIỂM =================
  {
    Points: 30,
    Prompt: 'Bài thơ thần được xem là bản Tuyên ngôn Độc lập đầu tiên của dân tộc ta ("Nam quốc sơn hà Nam đế cư...") tương truyền do ai sáng tác?',
    Answer: 'LÝ THƯỜNG KIỆT',
    Alternatives: 'LY THUONG KIET; THÁI ÚY LÝ THƯỜNG KIỆT'
  },
  {
    Points: 30,
    Prompt: 'Phản ứng hạt nhân trong đó một hạt nhân có khối lượng lớn vỡ thành hai mảnh hạt nhân nhẹ hơn sau khi hấp thụ một neutron nhiệt gọi là gì?',
    Answer: 'PHÂN HẠCH',
    Alternatives: 'PHÂN HẠCH HẠT NHÂN; PHAN HACH; NUCLEAR FISSION'
  },
  {
    Points: 30,
    Prompt: 'Axit vô cơ nào có khả năng ăn mòn mạnh thủy tinh (SiO2) nên tuyệt đối không được bảo quản trong các chai lọ thủy tinh thông thường?',
    Answer: 'AXIT FLOXIDRIC',
    Alternatives: 'HF; AXIT FLORIHIDRIC; HYDROFLUORIC ACID; ACID HF'
  },
  {
    Points: 30,
    Prompt: 'Dạng đột biến cấu trúc nhiễm sắc thể xảy ra khi một đoạn nhiễm sắc thể bị đứt ra, xoay ngược 180 độ rồi hàn gắn lại gọi là gì?',
    Answer: 'ĐẢO ĐOẠN',
    Alternatives: 'ĐẢO ĐOẠN NHIỄM SẮC THỂ; DAO DOAN; INVERSION'
  },
  {
    Points: 30,
    Prompt: 'Dòng sông thơ mộng nào chảy qua trung tâm thành phố Huế trước khi hợp lưu và đổ ra phá Tam Giang rồi ra biển Đông qua cửa Thuận An?',
    Answer: 'SÔNG HƯƠNG',
    Alternatives: 'HƯƠNG GIANG; SONG HUONG'
  },
  {
    Points: 30,
    Prompt: 'Trong toán học, một phương trình bậc hai một ẩn có nghiệm kép duy nhất khi biểu thức biệt thức Delta (Δ) có giá trị bằng mấy?',
    Answer: '0',
    Alternatives: 'BẰNG 0; KHÔNG; KHONG; ZERO'
  },
  {
    Points: 30,
    Prompt: 'Nhà cải cách táo bạo nào cuối thời Trần đã cho phát hành tiền giấy "Thông bảo hội sao" đầu tiên trong lịch sử tiền tệ nước ta?',
    Answer: 'HỒ QUÝ LY',
    Alternatives: 'HO QUY LY'
  },
  {
    Points: 30,
    Prompt: 'Tác phẩm văn học dịch Nôm diễn tả tâm trạng xót xa, buồn tủi của người vợ có chồng ra trận do nữ sĩ Đoàn Thị Điểm dịch là gì?',
    Answer: 'CHINH PHỤ NGÂM',
    Alternatives: 'CHINH PHU NGAM; CHINH PHỤ NGÂM KHÚC'
  },
  {
    Points: 30,
    Prompt: 'Vật chất tối trong vũ trụ chiếm phần lớn khối lượng vật chất nhưng không phát ra hay phản xạ loại bức xạ nào nên không thể quan sát trực tiếp?',
    Answer: 'ÁNH SÁNG',
    Alternatives: 'BỨC XẠ ĐIỆN TỪ; ANH SANG; QUANG PHỔ'
  },
  {
    Points: 30,
    Prompt: 'Tỉ số không thứ nguyên giữa tốc độ truyền ánh sáng trong chân không và tốc độ truyền ánh sáng trong môi trường trong suốt gọi là gì?',
    Answer: 'CHIẾT SUẤT',
    Alternatives: 'CHIẾT SUẤT TUYỆT ĐỐI; CHIET SUAT; REFRACTIVE INDEX'
  },
  {
    Points: 30,
    Prompt: 'Loại tơ tổng hợp thuộc dòng polieste được điều chế từ phản ứng trùng ngưng giữa axit terephtalic và etylen glicol có tên gọi phổ biến là gì?',
    Answer: 'TƠ LAPSAN',
    Alternatives: 'LAPSAN; TƠ PET; POLYESTER; DACRON'
  },
  {
    Points: 30,
    Prompt: 'Trận thủy chiến quyết định đầu năm 1258 trên sông Hồng do vua tôi nhà Trần phản công buộc quân Mông Cổ phải tháo chạy khỏi Thăng Long là trận gì?',
    Answer: 'ĐÔNG BỘ ĐẦU',
    Alternatives: 'DONG BO DAU; TRẬN ĐÔNG BỘ ĐẦU'
  },
  {
    Points: 30,
    Prompt: 'Dãy núi hiểm trở nào nằm ở ranh giới giữa tỉnh Thừa Thiên Huế và Đà Nẵng, được xem là bức trường thành tự nhiên chia đôi khí hậu Bắc - Nam?',
    Answer: 'BẠCH MÃ',
    Alternatives: 'DÃY BẠCH MÃ; BACH MA; DÃY NÚI BẠCH MÃ'
  },
  {
    Points: 30,
    Prompt: 'Theo định luật phân ly độc lập của Menđen, phép lai giữa hai cơ thể dị hợp 2 cặp gen (AaBb x AaBb) sẽ cho tỉ lệ phân ly kiểu hình ở F1 là gì?',
    Answer: '9:3:3:1',
    Alternatives: '9:3:3:1; 9-3-3-1; 9 3 3 1'
  },
  {
    Points: 30,
    Prompt: 'Trong loạt truyện trinh thám của Arthur Conan Doyle, vị thám tử Sherlock Holmes sinh sống và làm việc tại căn hộ số 221B trên con phố nào?',
    Answer: 'PHỐ BAKER',
    Alternatives: 'BAKER; PHO BAKER; BAKER STREET'
  },
  {
    Points: 30,
    Prompt: 'Trong giải tích toán học, giá trị nhỏ nhất của tam thức bậc hai f(x) = x^2 - 4x + 5 đạt được tại điểm x bằng bao nhiêu?',
    Answer: '2',
    Alternatives: 'X = 2; HAI; SỐ 2'
  },
  {
    Points: 30,
    Prompt: 'Trong dao động điều hòa của con lắc lò xo, tốc độ chuyển động của vật đạt giá trị cực đại khi vật đi qua vị trí nào?',
    Answer: 'VỊ TRÍ CÂN BẰNG',
    Alternatives: 'VI TRI CAN BANG; TẠI VỊ TRÍ CÂN BẰNG; GỐC TỌA ĐỘ'
  },
  {
    Points: 30,
    Prompt: 'Chiến dịch quân sự quy mô lớn mùa thu - đông năm 1950 của quân đội ta khai thông yết hầu biên giới Việt - Trung dài 750km là chiến dịch nào?',
    Answer: 'CHIẾN DỊCH BIÊN GIỚI',
    Alternatives: 'BIÊN GIỚI; BIÊN GIỚI 1950; BIEN GIOI'
  },
  {
    Points: 30,
    Prompt: 'Phản ứng thủy phân este phức tạp trong chất béo khi đun nóng với dung dịch kiềm (NaOH hoặc KOH) được gọi là phản ứng gì?',
    Answer: 'XÀ PHÒNG HÓA',
    Alternatives: 'XA PHONG HOA; PHẢN ỨNG XÀ PHÒNG HÓA; SAPONIFICATION'
  },
  {
    Points: 30,
    Prompt: 'Vùng cao nguyên đất đỏ bazan rộng lớn nào ở Tây Nguyên là thủ phủ sản xuất và xuất khẩu cà phê lớn nhất Việt Nam?',
    Answer: 'ĐẮK LẮK',
    Alternatives: 'BUÔN MA THUỘT; DAK LAK; DAKLAK; CAO NGUYÊN ĐẮK LẮK'
  },
  {
    Points: 30,
    Prompt: 'Bệnh mù màu đỏ - lục hoặc bệnh máu khó đông ở người di truyền theo cơ chế liên kết với nhiễm sắc thể giới tính nào?',
    Answer: 'NHIỄM SẮC THỂ X',
    Alternatives: 'NST X; X; NHIỄM SẮC THỂ GIỚI TÍNH X'
  },
  {
    Points: 30,
    Prompt: 'Địa danh nào trên núi Dũng Quyết thuộc tỉnh Nghệ An từng được hoàng đế Quang Trung chọn lựa để xây dựng kinh đô Phượng Hoàng Trung Đô?',
    Answer: 'NÚI DŨNG QUYẾT',
    Alternatives: 'DŨNG QUYẾT; DUNG QUYET; THÀNH PHỐ VINH'
  },
  {
    Points: 30,
    Prompt: 'Vở kịch sân khấu nổi tiếng "Hồn Trương Ba, da hàng thịt" đặt ra triết lý nhân sinh về sự hài hòa thể xác và tâm hồn là tác phẩm của ai?',
    Answer: 'LƯU QUANG VŨ',
    Alternatives: 'LUU QUANG VU'
  },
  {
    Points: 30,
    Prompt: 'Trong nhiệt động lực học, đại lượng vật lý ký hiệu là S biểu thị mức độ hỗn loạn của các vi hạt trong một hệ kín được gọi là gì?',
    Answer: 'ENTROPI',
    Alternatives: 'ENTROPY; S'
  },
  {
    Points: 30,
    Prompt: 'Hiện tượng ngọn lửa phát ra màu sắc rực rỡ đặc trưng khi đốt các muối kim loại (như Na màu vàng, Ba màu lục) được ứng dụng trong sản xuất gì?',
    Answer: 'PHÁO HOA',
    Alternatives: 'PHAO HOA; LÀM PHÁO HOA; PHÁO SÁNG'
  },
  {
    Points: 30,
    Prompt: 'Trong giải tích toán học lớp 11, đạo hàm bậc nhất của hàm số lượng giác y = sin(x) là hàm số nào?',
    Answer: 'COS(X)',
    Alternatives: 'COSX; COS X; HÀM COS'
  },
  {
    Points: 30,
    Prompt: 'Trong chiến dịch Điện Biên Phủ năm 1954, Đại tướng Võ Nguyên Giáp đã quyết định chuyển phương châm tác chiến lịch sử sang phương châm nào?',
    Answer: 'ĐÁNH CHẮC TIẾN CHẮC',
    Alternatives: 'DANH CHAC TIEN CHAC; ĐÁNH CHẮC, TIẾN CHẮC'
  },
  {
    Points: 30,
    Prompt: 'Thành phố Bangkok, thủ đô phồn vinh của Vương quốc Thái Lan, có tên gọi bản địa bằng tiếng Thái nghĩa là "Thành phố của các thiên thần" là gì?',
    Answer: 'KRUNG THEP',
    Alternatives: 'KRUNG THEP MAHA NAKHON; KRUNGTHEP; BANGKOK'
  },
  {
    Points: 30,
    Prompt: 'Enzim tiêu hóa nào có trong tuyến nước bọt của người đảm nhận vai trò phân cắt một phần tinh bột chín thành đường đôi mantôzơ?',
    Answer: 'AMYLAZA',
    Alternatives: 'AMYLASE; MEN AMYLASE; PTIALIN'
  },
  {
    Points: 30,
    Prompt: 'Hạt vi mô nào cấu tạo nên hạt nhân nguyên tử nhưng hoàn toàn không mang điện tích và có khối lượng xấp xỉ khối lượng của proton?',
    Answer: 'NEUTRON',
    Alternatives: 'NƠTRON; NOTRON; N'
  },
  {
    Points: 30,
    Prompt: 'Bài thơ "Quê hương" với những vần thơ dạt dào sức sống "Cánh buồm giương to như mảnh hồn làng..." là sáng tác tiêu biểu của nhà thơ nào?',
    Answer: 'TẾ HANH',
    Alternatives: 'TE HANH'
  },
  {
    Points: 30,
    Prompt: 'Thủ lĩnh nghĩa quân nào đã lãnh đạo căn cứ khởi nghĩa Bãi Sậy (Hưng Yên) trong phong trào Cần Vương với chiến thuật du kích xuất quỷ nhập thần?',
    Answer: 'NGUYỄN THIỆN THUẬT',
    Alternatives: 'NGUYEN THIEN THUAT; TÁN THUẬT'
  },
  {
    Points: 30,
    Prompt: 'Trong bảng độ dẫn điện của kim loại ở điều kiện tiêu chuẩn, kim loại nào đứng vị trí thứ hai chỉ sau bạc về khả năng dẫn điện?',
    Answer: 'ĐỒNG',
    Alternatives: 'CU; COPPER; DONG'
  },
  {
    Points: 30,
    Prompt: 'Đèo Hải Vân - con đèo ven biển hùng vĩ được mệnh danh là "Thiên hạ đệ nhất hùng quan" nằm ở ranh giới giữa tỉnh Thừa Thiên Huế và địa phương nào?',
    Answer: 'ĐÀ NẴNG',
    Alternatives: 'THÀNH PHỐ ĐÀ NẴNG; DA NANG'
  },
  {
    Points: 30,
    Prompt: 'Một tam giác đều có độ dài mỗi cạnh bằng 6 cm thì bán kính đường tròn ngoại tiếp của tam giác đó bằng bao nhiêu cm (dưới dạng căn số)?',
    Answer: '2 CĂN 3',
    Alternatives: '2√3; 2 CAN 3; CAN 12; √12'
  },
  {
    Points: 30,
    Prompt: 'Hiện tượng nối tắt mạch điện mà điện trở ngoài gần như bằng 0 khiến cường độ dòng điện tăng vọt cực lớn gây chập cháy gọi là hiện tượng gì?',
    Answer: 'ĐOẢN MẠCH',
    Alternatives: 'CHẬP MẠCH; DOAN MACH; SHORT CIRCUIT'
  },
  {
    Points: 30,
    Prompt: 'Vị lãnh tụ vĩ đại nào của phong trào vô sản quốc tế đã trực tiếp lãnh đạo cuộc Cách mạng xã hội chủ nghĩa Tháng Mười Nga năm 1917?',
    Answer: 'V.I. LENIN',
    Alternatives: 'LENIN; LÊ-NIN; LE NIN; VLADIMIR LENIN'
  },
  {
    Points: 30,
    Prompt: 'Những cơ quan ở các loài sinh vật khác nhau có cùng nguồn gốc phôi thai mặc dù hình thái bên ngoài có thể khác nhau gọi là cơ quan gì?',
    Answer: 'CƠ QUAN TƯƠNG ĐỒNG',
    Alternatives: 'TUONG DONG; CƠ QUAN ĐỒNG NGUỒN; HOMOLOGOUS'
  },
  {
    Points: 30,
    Prompt: 'Chất xúc tác sinh học có bản chất đại phân tử chủ yếu là protein do tế bào sinh vật sản sinh để thúc đẩy các phản ứng sinh hóa gọi là gì?',
    Answer: 'ENZIM',
    Alternatives: 'ENZYME; MEN SINH HỌC; MEN'
  },
  {
    Points: 30,
    Prompt: 'Nhân vật Huấn Cao trong tác phẩm văn học "Chữ người tử tù" của nhà văn Nguyễn Tuân được lấy nguyên mẫu từ danh sĩ lịch sử nào?',
    Answer: 'CAO BÁ QUÁT',
    Alternatives: 'CAO BA QUAT'
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
  console.log(`Checking ${NEW_VEDICH_QUESTIONS.length} VeDich questions...`);

  // 1. Distribution of points
  const pointsCount = { 10: 0, 20: 0, 30: 0 };
  for (const q of NEW_VEDICH_QUESTIONS) {
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
  for (const q of NEW_VEDICH_QUESTIONS) {
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
  for (let i = 0; i < NEW_VEDICH_QUESTIONS.length; i++) {
    const q = NEW_VEDICH_QUESTIONS[i];
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

  console.log('ALL 120 VEDICH QUESTIONS PASSED VALIDATION! 0 collisions with existing 435 questions.');

  // 4. Update local Excel workbook
  const excelPath = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
  const wb = xlsx.readFile(excelPath);
  const vdSheet = wb.Sheets['VeDich'];
  const existingRows = xlsx.utils.sheet_to_json<any>(vdSheet);

  console.log(`Current VeDich count: ${existingRows.length}`);
  const combinedRows = [...existingRows, ...NEW_VEDICH_QUESTIONS];
  console.log(`New VeDich count: ${combinedRows.length}`);

  const newSheet = xlsx.utils.json_to_sheet(combinedRows);
  wb.Sheets['VeDich'] = newSheet;
  xlsx.writeFile(wb, excelPath);
  console.log('Successfully saved updated workbook to', excelPath);
}

if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('addVeDich')) {
  validateAndInsert();
}
