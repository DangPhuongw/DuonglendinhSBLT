import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

function findExcelPath(): string {
  const p1 = path.resolve('server/question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p1)) return p1;
  const p2 = path.resolve('question-bank/kho-cau-hoi-mau.xlsx');
  if (fs.existsSync(p2)) return p2;
  throw new Error('Cannot find kho-cau-hoi-mau.xlsx');
}

export const excelPath = findExcelPath();
export const wb = xlsx.readFile(excelPath);

export const NEW_TANGTOC_BATCH2 = [
  {
    Prompt: 'Trong một chiếc hộp có 10 đôi tất màu đen và 10 đôi tất màu trắng lẫn lộn với nhau (tổng cộng 40 chiếc tất riêng lẻ). Trong phòng tối hoàn toàn, hỏi một người cần lấy ra ngẫu nhiên ít nhất bao nhiêu chiếc tất để chắc chắn có được ít nhất một đôi tất cùng màu?',
    Answer: '3',
    Alternatives: '3; 3 CHIẾC; 3 CHIEC; BA; BA CHIẾC; BA CHIEC; 3 CÁI; 3 CAI',
    Topic: 'Toán logic Dirichlet'
  },
  {
    Prompt: 'Một người lái đò cần chở một con sói, một con dê và một bắp cải qua sông bằng chiếc thuyền nhỏ. Mỗi chuyến thuyền chỉ chở được người lái đò cùng một trong ba thứ. Biết rằng vắng người thì sói ăn thịt dê, dê ăn bắp cải; hỏi trong chuyến chở đầu tiên qua sông, người lái đò bắt buộc phải mang theo con vật hoặc đồ vật nào?',
    Answer: 'CON DÊ',
    Alternatives: 'CON DÊ; CON DE; DÊ; DE',
    Topic: 'Đố trí tuệ kinh điển'
  },
  {
    Prompt: 'Một sợi dây thép dài 24 cm được uốn thành một hình chữ nhật có chiều dài gấp đôi chiều rộng. Hỏi diện tích của hình chữ nhật tạo thành là bao nhiêu xentimét vuông?',
    Answer: '32',
    Alternatives: '32; 32 CM2; 32CM2; BA MƯƠI HAI; BA MUOI HAI',
    Topic: 'Hình học phẳng'
  },
  {
    Prompt: 'Trong đại số Boole và mạch điện tử số, cổng logic nào cho kết quả đầu ra bằng 1 (Đúng) khi và chỉ khi hai tín hiệu đầu vào có giá trị khác nhau (một đầu vào là 0 và một đầu vào là 1)?',
    Answer: 'XOR',
    Alternatives: 'XOR; CỔNG XOR; CONG XOR; EXCLUSIVE OR; HOẶC LOẠI TRỪ; HOAC LOAI TRU',
    Topic: 'Tin học phần cứng'
  },
  {
    Prompt: 'Một người xếp các que diêm thành hình tam giác đều: tầng thứ nhất (đỉnh) có 1 que, tầng thứ hai có 2 que, ..., tầng thứ 10 có 10 que. Hỏi người đó đã dùng tất cả bao nhiêu que diêm để xếp đủ 10 tầng như vậy?',
    Answer: '55',
    Alternatives: '55; NĂM MƯƠI LĂM; NAM MUOI LAM; 55 QUE; 55 QUE DIÊM; 55 QUE DIEM',
    Topic: 'Toán dãy số'
  },
  {
    Prompt: 'Một khối nước đá đang nổi lơ lửng trong một cốc nước đầy tới miệng cốc. Khi toàn bộ khối nước đá này tan chảy hoàn toàn thành nước (nhiệt độ nước coi như không đổi), lượng nước trong cốc có bị tràn ra ngoài miệng cốc hay không?',
    Answer: 'KHÔNG',
    Alternatives: 'KHÔNG; KHONG; KHÔNG BỊ TRÀN; KHONG BI TRAN; KHÔNG TRÀN; KHONG TRAN',
    Topic: 'Vật lý chất lưu'
  },
  {
    Prompt: 'Trong bảng mã tín hiệu Morse quốc tế, tín hiệu cầu cứu khẩn cấp "SOS" được phát đi bằng chuỗi ký hiệu gồm bao nhiêu chấm và bao nhiêu gạch? (Nhập đáp án dạng: X chấm Y gạch)',
    Answer: '6 CHẤM 3 GẠCH',
    Alternatives: '6 CHẤM 3 GẠCH; 6 CHAM 3 GACH; 6 CHẤM VÀ 3 GẠCH; 6 CHAM VA 3 GACH; 6 CHẤM, 3 GẠCH; 3 GẠCH 6 CHẤM; 6 DOTS 3 DASHES',
    Topic: 'Mật mã & Truyền tin'
  },
  {
    Prompt: 'Khi pha loãng một dung dịch axit có pH = 3 bằng cách thêm vào đó một lượng nước cất rất lớn, hỏi giá trị pH của dung dịch thu được có thể vượt qua giá trị bao nhiêu?',
    Answer: '7',
    Alternatives: '7; SỐ 7; SO 7; BẢY; BAY; PH 7; PH = 7',
    Topic: 'Hóa học vô cơ'
  },
  {
    Prompt: 'Trong một căn phòng có ít nhất bao nhiêu người để chắc chắn có ít nhất hai người có cùng tháng sinh (dương lịch)?',
    Answer: '13',
    Alternatives: '13; 13 NGƯỜI; 13 NGUOI; MƯỜI BA; MUOI BA; MƯỜI BA NGƯỜI; MUOI BA NGUOI',
    Topic: 'Toán logic xác suất'
  },
  {
    Prompt: 'Trong hiện tượng nhật thực toàn phần, ba thiên thể Mặt Trời, Trái Đất và Mặt Trăng cùng nằm trên một đường thẳng. Hỏi thiên thể nào nằm ở vị trí chính giữa hai thiên thể còn lại?',
    Answer: 'MẶT TRĂNG',
    Alternatives: 'MẶT TRĂNG; MAT TRANG; TRĂNG; TRANG; NGUYỆT; MOON',
    Topic: 'Thiên văn học'
  },
  {
    Prompt: 'Một người cha 40 tuổi và có hai người con 10 tuổi và 6 tuổi. Hỏi sau bao nhiêu năm nữa thì tuổi của người cha bằng đúng tổng số tuổi của hai người con?',
    Answer: '24',
    Alternatives: '24; 24 NĂM; 24 NAM; HAI MƯƠI BỐN; HAI MUOI BON; HAI MƯƠI TƯ; HAI MUOI TU',
    Topic: 'Toán tư duy'
  },
  {
    Prompt: 'Bỏ qua lực cản của không khí, để một vật được ném từ mặt đất có thể đạt được tầm bay xa nhất với cùng một vận tốc ban đầu, góc ném hợp bởi hướng ném và phương nằm ngang phải bằng bao nhiêu độ?',
    Answer: '45 ĐỘ',
    Alternatives: '45 ĐỘ; 45 DO; 45; BỐN MƯƠI LĂM ĐỘ; BON MUOI LAM DO; 45 DEG',
    Topic: 'Vật lý cơ học'
  },
  {
    Prompt: 'Trong hệ thống chữ số La Mã, chữ cái nào được dùng để biểu thị cho giá trị số 1000?',
    Answer: 'M',
    Alternatives: 'M; CHỮ M; CHU M',
    Topic: 'Lịch sử toán học'
  },
  {
    Prompt: 'Trong khoảng thời gian từ đúng 12 giờ trưa hôm nay đến đúng 12 giờ trưa ngày mai (tròn 24 giờ), hai kim giờ và kim phút của một chiếc đồng hồ gặp nhau (chồng khít lên nhau) tất cả bao nhiêu lần?',
    Answer: '22 LẦN',
    Alternatives: '22 LẦN; 22 LAN; 22; HAI MƯƠI HAI LẦN; HAI MUOI HAI LAN; 22 LẦN GẶP NHAU',
    Topic: 'Logic toán thời gian'
  },
  {
    Prompt: 'Theo quy luật di truyền nhóm máu hệ ABO, nếu người bố mang nhóm máu AB và người mẹ mang nhóm máu O thì các con của họ sinh ra chỉ có thể mang một trong hai nhóm máu là nhóm máu A hoặc nhóm máu nào?',
    Answer: 'B',
    Alternatives: 'B; NHÓM B; NHOM B; NHÓM MÁU B; NHOM MAU B',
    Topic: 'Di truyền sinh học'
  },
  {
    Prompt: 'Ở nhiệt độ bao nhiêu thì số đo trên thang nhiệt độ Celsius (°C) và thang nhiệt độ Fahrenheit (°F) có giá trị bằng nhau?',
    Answer: '-40',
    Alternatives: '-40; -40 ĐỘ; -40 DO; ÂM 40; AM 40; ÂM 40 ĐỘ; AM 40 DO; -40 ĐỘ C; -40 ĐỘ F',
    Topic: 'Vật lý nhiệt học'
  },
  {
    Prompt: 'Số nguyên dương nào nhỏ hơn 10 có tính chất đặc biệt là bằng tổng của tất cả các ước số nguyên dương thực sự của nó (1 + 2 + 3)?',
    Answer: '6',
    Alternatives: '6; SỐ 6; SO 6; SÁU; SAU',
    Topic: 'Số học số hoàn hảo'
  },
  {
    Prompt: 'Trong mật mã Atbash cổ đại (chữ cái đầu tiên đổi chỗ cho chữ cái cuối cùng: A thành Z, B thành Y, C thành X,...), chữ cái tiếng Anh "M" (vị trí thứ 13) sẽ được mã hóa thành chữ cái nào?',
    Answer: 'N',
    Alternatives: 'N; CHỮ N; CHU N',
    Topic: 'Mật mã học'
  },
  {
    Prompt: 'Nơi duy nhất trên bề mặt Trái Đất mà bất kể bạn nhìn hoặc bước theo hướng nào thì hướng đó cũng đều là hướng Nam là điểm nào?',
    Answer: 'CỰC BẮC',
    Alternatives: 'CỰC BẮC; CUC BAC; ĐIỂM CỰC BẮC; DIEM CUC BAC; BẮC CỰC; BAC CUC; NORTH POLE',
    Topic: 'Địa lý Trái Đất'
  },
  {
    Prompt: 'Theo chuẩn nhị phân (tiền tố kibibyte / kilobyte trong kiến trúc máy tính), 1 Kilobyte (KB) lưu trữ chứa chính xác bao nhiêu byte?',
    Answer: '1024',
    Alternatives: '1024; 1024 BYTE; 1024 BYTES; 1.024',
    Topic: 'Tin học máy tính'
  },
  {
    Prompt: 'Chữ số tận cùng của phép tính 2 lũy thừa 2024 (2^2024) là chữ số nào?',
    Answer: '6',
    Alternatives: '6; SỐ 6; SO 6; SÁU; SAU',
    Topic: 'Số học chu kỳ'
  },
  {
    Prompt: 'Theo quy chuẩn hiện hành của IUPAC (ở điều kiện chuẩn: nhiệt độ 25 °C và áp suất 1 bar), 1 mol chất khí bất kỳ chiếm thể tích xấp xỉ bằng bao nhiêu lít? (Làm tròn đến 2 chữ số thập phân)',
    Answer: '24,79',
    Alternatives: '24,79; 24.79; 24,79 LÍT; 24.79 LIT; 24,79L; 24.79L',
    Topic: 'Hóa học định lượng'
  },
  {
    Prompt: 'Một khối Rubik 3x3x3 tiêu chuẩn gồm 26 khối lập phương nhỏ ghép xung quanh một trục lõi. Hỏi có tất cả bao nhiêu khối lập phương nhỏ có đúng 3 mặt được dán nhãn màu (các khối góc)?',
    Answer: '8',
    Alternatives: '8; 8 KHỐI; 8 KHOI; TÁM; TAM; TÁM KHỐI; TAM KHOI; 8 VIÊN; 8 VIEN',
    Topic: 'Hình học không gian'
  },
  {
    Prompt: 'Trong 7 màu cơ bản của dải quang phổ ánh sáng trắng nhìn thấy (Đỏ, Da cam, Vàng, Lục, Lam, Chàm, Tím), bức xạ đơn sắc của màu nào có bước sóng dài nhất?',
    Answer: 'ĐỎ',
    Alternatives: 'ĐỎ; DO; MÀU ĐỎ; MAU DO; ÁNH SÁNG ĐỎ; ANH SANG DO; RED',
    Topic: 'Quang phổ học'
  },
  {
    Prompt: 'Bằng đúng 3 nhát cắt thẳng liên tiếp trên một chiếc bánh sinh nhật hình tròn (không di chuyển các phần bánh sau khi cắt), số miếng bánh tối đa có thể tạo ra được là bao nhiêu miếng?',
    Answer: '7',
    Alternatives: '7; 7 MIẾNG; 7 MIENG; BẢY; BAY; 7 PHẦN; 7 PHAN; BẢY MIẾNG; BAY MIENG',
    Topic: 'Toán phân chia mặt phẳng'
  },
  {
    Prompt: 'Trong một cuộc thi có 4 bạn An, Bình, Cường, Dũng đạt 4 vị trí nhất, nhì, ba, tư. Biết: An không phải nhất; Bình về ngay trước An; Dũng không về cuối cùng; Cường về nhì. Hỏi ai là người đạt giải nhất?',
    Answer: 'DŨNG',
    Alternatives: 'DŨNG; DUNG; BẠN DŨNG; BAN DUNG',
    Topic: 'Logic suy luận vị trí'
  },
  {
    Prompt: 'Cấu trúc dữ liệu tuyến tính trong tin học hoạt động theo nguyên lý "Vào sau, ra trước" (LIFO - Last In First Out), thường được ứng dụng để hiện thực hóa tính năng Hoàn tác (Undo) trong các phần mềm, được gọi là gì?',
    Answer: 'NGĂN XẾP',
    Alternatives: 'NGĂN XẾP; NGAN XEP; STACK; CẤU TRÚC NGĂN XẾP; CAU TRUC NGAN XEP',
    Topic: 'Khoa học máy tính'
  },
  {
    Prompt: 'Để xác định chiều của lực từ tác dụng lên một đoạn dây dẫn mang dòng điện đặt trong từ trường đều, người ta sử dụng quy tắc bàn tay trái hay quy tắc bàn tay phải?',
    Answer: 'BÀN TAY TRÁI',
    Alternatives: 'BÀN TAY TRÁI; BAN TAY TRAI; TAY TRÁI; TAY TRAI; QUY TẮC BÀN TAY TRÁI; QUY TAC BAN TAY TRAI; QUY TẮC TAY TRÁI; QUY TAC TAY TRAI',
    Topic: 'Vật lý điện từ'
  },
  {
    Prompt: 'Trong tam giác Pascal, hàng thứ 4 (tính từ hàng 0 là 1) gồm các số: 1, 4, 6, 4, 1. Hỏi tổng của tất cả các số trên hàng thứ 5 của tam giác Pascal bằng bao nhiêu?',
    Answer: '32',
    Alternatives: '32; BA MƯƠI HAI; BA MUOI HAI',
    Topic: 'Toán tổ hợp'
  },
  {
    Prompt: 'Tại đường Xích đạo trên Trái Đất, vào tất cả các ngày trong năm kể cả ngày Hạ chí và Đông chí, độ dài của ban ngày luôn dài hơn, ngắn hơn hay bằng độ dài của ban đêm?',
    Answer: 'BẰNG NHAU',
    Alternatives: 'BẰNG NHAU; BANG NHAU; BẰNG; BANG; LUÔN BẰNG NHAU; LUON BANG NHAU',
    Topic: 'Địa lý tự nhiên'
  }
];

const allExistingPrompts: { sheet: string; prompt: string; answer: string }[] = [];

for (const name of wb.SheetNames) {
  const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets[name], { defval: '' });
  for (const r of rows) {
    const p = String(r.Prompt || r['Câu hỏi'] || r.cauhoi || '').trim();
    const a = String(r.Answer || r['Đáp án'] || r.dapan || '').trim();
    if (p) {
      allExistingPrompts.push({ sheet: name, prompt: p, answer: a });
    }
  }
}

console.log('Total existing prompts in bank:', allExistingPrompts.length);

function words(s: string) {
  return new Set(s.toLowerCase().replace(/[^a-z0-9à-ỹ]/g, ' ').split(/\s+/).filter(Boolean));
}

let collisions = 0;
for (const q of NEW_TANGTOC_BATCH2) {
  const w1 = words(q.Prompt);
  for (const ex of allExistingPrompts) {
    const w2 = words(ex.prompt);
    const inter = [...w1].filter(x => w2.has(x)).length;
    const union = new Set([...w1, ...w2]).size;
    const sim = inter / union;
    if (sim > 0.45) {
      collisions++;
      console.log(`High similarity (${(sim*100).toFixed(1)}%):`);
      console.log(`  New: ${q.Prompt}`);
      console.log(`  Existing (${ex.sheet}): ${ex.prompt}`);
    }
  }
}
console.log(`Collisions found: ${collisions}`);
