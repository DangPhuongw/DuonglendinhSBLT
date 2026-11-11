import xlsx from 'xlsx';
import path from 'path';

const filePath = path.resolve('question-bank/kho-cau-hoi-mau.xlsx');
const wb = xlsx.readFile(filePath);
const sheet = wb.Sheets['VCNV'];
const rows: any[] = xlsx.utils.sheet_to_json(sheet);

// Kiểm tra xem đã có Cum-04 chưa
const hasCum4 = rows.some(r => r.Cluster === 'Cum-04' || r.Answer === 'TRỐNG CƠM');
if (!hasCum4) {
  const newRows = [
    {
      Cluster: 'Cum-04',
      Type: 'ROW',
      Prompt: 'Loại hình nghệ thuật diễn xướng dân gian gắn liền với lễ hội, lao động và phong tục tập quán của cư dân vùng đồng bằng sông Hồng cùng các vùng phụ cận được gọi chung là gì?',
      Answer: 'DÂN CA BẮC BỘ',
      Alternatives: 'DÂN CA BẮC BỘ; DAN CA BAC BO; DÂN CA; DAN CA; DÂN CA ĐỒNG BẰNG BẮC BỘ',
      Topic: 'Âm nhạc dân gian',
    },
    {
      Cluster: 'Cum-04',
      Type: 'ROW',
      Prompt: 'Theo hệ thống phân loại Hornbostel–Sachs trong âm nhạc học, thuật ngữ chung nào dùng để chỉ những thiết bị, đồ vật chuyên biệt tạo ra các dao động âm thanh có cao độ, trường độ và âm sắc phục vụ biểu diễn?',
      Answer: 'NHẠC CỤ',
      Alternatives: 'NHẠC CỤ; NHAC CU; NHẠC KHÍ; NHAC KHI',
      Topic: 'Âm nhạc',
    },
    {
      Cluster: 'Cum-04',
      Type: 'ROW',
      Prompt: 'Trong kỹ thuật xây dựng thành quách, lăng tẩm cổ truyền của người Việt xưa, bên cạnh vôi và mật mía, chất phụ gia hữu cơ giàu tinh bột nào thường được nấu chín để trộn vào vữa nhằm tăng độ kết dính bền vững qua hàng trăm năm?',
      Answer: 'CƠM NẾP',
      Alternatives: 'CƠM NẾP; COM NEP; GẠO NẾP; CƠM; XÔI',
      Topic: 'Lịch sử - Xây dựng',
    },
    {
      Cluster: 'Cum-04',
      Type: 'ROW',
      Prompt: 'Trong tác phẩm "Dế Mèn phiêu lưu ký" của nhà văn Tô Hoài, hiệp sĩ Dế Mèn đã ra tay xóa nợ và phá vây giải cứu chị Nhà Trò khỏi sự ức hiếp của đàn sinh vật nào?',
      Answer: 'CON NHỆN',
      Alternatives: 'CON NHỆN; CON NHEN; NHỆN; NHEN; ĐÀN NHỆN; LOÀI NHỆN',
      Topic: 'Văn học thiếu nhi',
    },
    {
      Cluster: 'Cum-04',
      Type: 'CENTER',
      Prompt: 'Hình tượng con nhện giăng tơ cùng câu hát quen thuộc "Khen ai khéo vỗ, ố mấy bông mà nên bông" xuất hiện trong làn điệu dân ca Bắc Bộ nổi tiếng nào?',
      Answer: 'TRỐNG CƠM',
      Alternatives: 'TRỐNG CƠM; TRONG COM',
      Topic: 'Văn hóa - Âm nhạc',
    },
    {
      Cluster: 'Cum-04',
      Type: 'OBSTACLE',
      Prompt: 'Tên một nhạc khí gõ hình trụ bịt da hai đầu trong dàn nhạc cổ truyền Việt Nam, đồng thời là tên một bản dân ca Bắc Bộ vui tươi có xuất xứ tên gọi bắt nguồn từ tập quán dán tinh bột dẻo vào tâm mặt trống để định âm?',
      Answer: 'TRỐNG CƠM',
      Alternatives: 'TRỐNG CƠM; TRONG COM',
      Topic: 'Chướng ngại vật',
    },
  ];

  rows.push(...newRows);
  const newSheet = xlsx.utils.json_to_sheet(rows);
  wb.Sheets['VCNV'] = newSheet;
  xlsx.writeFile(wb, filePath);
  console.log('Đã thêm thành công cụm VCNV Cum-04 (TRỐNG CƠM) vào kho-cau-hoi-mau.xlsx!');
} else {
  console.log('Cum-04 đã tồn tại trong kho-cau-hoi-mau.xlsx.');
}
