import xlsx from 'xlsx';
import { GAME_CONFIG, Question, QuestionSet } from '@olympia/shared';
import { parseDifficulty } from './questionBank.js';

/** Cột độ khó (tùy chọn) của file đề tải lên: Dễ / Trung bình / Khó. */
const readDifficulty = (row: any) =>
  parseDifficulty(String(row.Difficulty ?? row.difficulty ?? row['Độ khó'] ?? row['Do kho'] ?? '')) || undefined;

/** Đọc giá trị phương án trắc nghiệm, bảo toàn các giá trị như số 0 */
const readOption = (row: any, ...keys: string[]): string => {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
};

/** Tên các sheet mà bộ đọc nhận ra (so khớp không phân biệt hoa thường, chỉ cần chứa tên). */
const KNOWN_SHEETS = ['khoidong_rieng', 'khoidong_chung', 'vcnv', 'tangtoc', 'tăng tốc', 'vedich', 'về đích', 'tiebreak', 'phụ'];

/**
 * Đọc file Excel đề thi. Phần nào file không có thì để trống (KHÔNG tự lấy đề mặc định);
 * người gọi quyết định bù phần thiếu từ kho (xem questionFill.ts).
 * Ném lỗi nếu file không giống file đề (không có sheet nào hợp lệ) hoặc là file theo định dạng kho.
 */
export function parseExcelQuestionSet(buffer: Buffer, title: string = 'Bộ đề tải lên'): QuestionSet {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

  const recognised = sheetNames.filter((n) => KNOWN_SHEETS.some((k) => n.toLowerCase().includes(k)));
  if (recognised.length === 0) {
    throw new Error(
      'Không tìm thấy sheet nào hợp lệ trong file. File đề cần có các sheet: KhoiDong_Rieng, KhoiDong_Chung, VCNV, TangToc, VeDich, TieBreak. Hãy tải "Excel mẫu" ở Sảnh chờ rồi điền câu hỏi vào.'
    );
  }
  const vcnvSheetName = sheetNames.find((n) => n.toLowerCase().includes('vcnv'));
  if (vcnvSheetName) {
    const vcnvRowsRaw = xlsx.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[vcnvSheetName]);
    if (vcnvRowsRaw.some((r) => Object.keys(r).some((k) => k.toLowerCase() === 'cluster'))) {
      throw new Error(
        'File này theo định dạng kho câu hỏi (sheet VCNV có cột Cluster). Hãy đặt file vào thư mục question-bank trên máy chủ thay vì nạp trực tiếp, hoặc dùng "Excel mẫu" để nạp một bộ đề riêng.'
      );
    }
  }

  const getSheetData = (name: string): any[] => {
    const found = sheetNames.find((s) => s.toLowerCase().includes(name.toLowerCase()));
    if (!found) return [];
    return xlsx.utils.sheet_to_json(workbook.Sheets[found]);
  };

  // 1. KhoiDong_Rieng (5 x 5)
  const kdRiengData = getSheetData('KhoiDong_Rieng') || getSheetData('Rieng');
  const kdRieng: Question[][] = [[], [], [], [], []];
  for (const row of kdRiengData) {
    const seat = Number(row.Seat || row.seat || 1);
    const seatIdx = Math.max(0, Math.min(4, seat - 1));
    const altStr = String(row.Alternatives || row.alternatives || '');
    const alternatives = altStr ? altStr.split(';').map((s) => s.trim()) : [];

    const q: Question = {
      id: `kdr-${seat}-${row.Order || kdRieng[seatIdx].length + 1}`,
      type: 'mcq',
      prompt: String(row.Prompt || row.prompt || ''),
      options: [
        readOption(row, 'OptionA', 'optionA', 'A', 'a', 'Phương án A'),
        readOption(row, 'OptionB', 'optionB', 'B', 'b', 'Phương án B'),
        readOption(row, 'OptionC', 'optionC', 'C', 'c', 'Phương án C'),
        readOption(row, 'OptionD', 'optionD', 'D', 'd', 'Phương án D'),
      ],
      answer: String(row.Answer || row.answer || '').trim().toUpperCase(),
      difficulty: readDifficulty(row),
      alternatives,
    };
    if (kdRieng[seatIdx].length < 6) {
      kdRieng[seatIdx].push(q);
    }
  }

  // 2. KhoiDong_Chung (10 questions)
  const kdChungData = getSheetData('KhoiDong_Chung') || getSheetData('Chung');
  const kdChung: Question[] = [];
  for (const row of kdChungData) {
    const altStr = String(row.Alternatives || row.alternatives || '');
    const alternatives = altStr ? altStr.split(';').map((s) => s.trim()) : [];
    kdChung.push({
      id: `kdc-${kdChung.length + 1}`,
      type: 'mcq',
      prompt: String(row.Prompt || row.prompt || ''),
      options: [
        readOption(row, 'OptionA', 'optionA', 'A', 'a', 'Phương án A'),
        readOption(row, 'OptionB', 'optionB', 'B', 'b', 'Phương án B'),
        readOption(row, 'OptionC', 'optionC', 'C', 'c', 'Phương án C'),
        readOption(row, 'OptionD', 'optionD', 'D', 'd', 'Phương án D'),
      ],
      answer: String(row.Answer || row.answer || '').trim().toUpperCase(),
      difficulty: readDifficulty(row),
      alternatives,
    });
  }

  // 3. VCNV
  const vcnvData = getSheetData('VCNV');
  const vcnvRows: Question[] = [];
  let centerQ: Question = {
    id: 'vcnv-center',
    type: 'text',
    prompt: '',
    answer: '',
    alternatives: [],
  };
  let obsQ: Question = {
    id: 'vcnv-obstacle',
    type: 'text',
    prompt: '',
    answer: '',
    alternatives: [],
  };
  let vcnvImage = '';

  for (const row of vcnvData) {
    const type = String(row.Type || row.type || '').toUpperCase();
    const altStr = String(row.Alternatives || row.alternatives || '');
    const alternatives = altStr ? altStr.split(';').map((s) => s.trim()) : [];
    const prompt = String(row.Prompt || row.prompt || '');
    const answer = String(row.Answer || row.answer || '').trim();

    if (row.Image || row.image) {
      vcnvImage = String(row.Image || row.image);
    }

    if (type.includes('CENTER') || type.includes('TRUNG')) {
      centerQ = {
        id: 'vcnv-center',
        type: 'text',
        prompt,
        answer,
        alternatives,
        ignoreDiacritics: true,
      };
    } else if (type.includes('OBS') || type.includes('CNV') || type.includes('CHƯỚNG')) {
      obsQ = {
        id: 'vcnv-obstacle',
        type: 'text',
        prompt,
        answer,
        alternatives,
        ignoreDiacritics: true,
      };
    } else {
      vcnvRows.push({
        id: `vcnv-row-${vcnvRows.length + 1}`,
        type: 'text',
        prompt,
        answer,
        alternatives,
        ignoreDiacritics: true,
      });
    }
  }

  // 4. TangToc
  const ttData = getSheetData('TangToc') || getSheetData('Tăng Tốc');
  const tangToc: Question[] = [];
  for (const row of ttData) {
    const altStr = String(row.Alternatives || row.alternatives || '');
    const alternatives = altStr ? altStr.split(';').map((s) => s.trim()) : [];
    tangToc.push({
      id: `tt-${tangToc.length + 1}`,
      type: 'text',
      prompt: String(row.Prompt || row.prompt || ''),
      answer: String(row.Answer || row.answer || '').trim(),
      alternatives,
      media: row.Media || row.media || undefined,
      ignoreDiacritics: true,
    });
  }

  // 5. VeDich
  const vdData = getSheetData('VeDich') || getSheetData('Về Đích');
  const pool10: Question[] = [];
  const pool20: Question[] = [];
  const pool30: Question[] = [];
  for (const row of vdData) {
    const points = Number(row.Points || row.points || 10);
    const altStr = String(row.Alternatives || row.alternatives || '');
    const alternatives = altStr ? altStr.split(';').map((s) => s.trim()) : [];
    const q: Question = {
      id: `vd-${points}-${pool10.length + pool20.length + pool30.length + 1}`,
      type: 'text',
      prompt: String(row.Prompt || row.prompt || ''),
      answer: String(row.Answer || row.answer || '').trim(),
      alternatives,
      points: points as any,
      difficulty: GAME_CONFIG.VE_DICH.DIFFICULTY_BY_POINTS[points],
      timeLimit: 20,
      ignoreDiacritics: true,
    };
    if (points === 10) pool10.push(q);
    else if (points === 20) pool20.push(q);
    else pool30.push(q);
  }

  // 6. TieBreak
  const tbData = getSheetData('TieBreak') || getSheetData('Phụ');
  const tieBreak: Question[] = [];
  for (const row of tbData) {
    const altStr = String(row.Alternatives || row.alternatives || '');
    const alternatives = altStr ? altStr.split(';').map((s) => s.trim()) : [];
    tieBreak.push({
      id: `tb-${tieBreak.length + 1}`,
      type: 'text',
      prompt: String(row.Prompt || row.prompt || ''),
      answer: String(row.Answer || row.answer || '').trim(),
      alternatives,
      ignoreDiacritics: true,
    });
  }

  // Không tự bù bằng đề mặc định: phần thiếu để trống và được bù từ kho (hoặc báo lỗi) ở nơi gọi
  const finalKdRieng = kdRieng;
  const finalKdChung = kdChung;
  const finalVcnvRows = vcnvRows.length > 4 ? vcnvRows.slice(0, 4) : vcnvRows;
  const finalCenterQ = centerQ;
  const finalObsQ = obsQ;
  const finalVcnvImage = vcnvImage || undefined;
  const finalTangToc = tangToc;
  const finalPool10 = pool10;
  const finalPool20 = pool20;
  const finalPool30 = pool30;
  const finalTieBreak = tieBreak;

  return {
    id: `qs-${Date.now()}`,
    title,
    khoiDong: {
      rieng: finalKdRieng,
      chung: finalKdChung,
    },
    vcnv: {
      rows: finalVcnvRows,
      center: finalCenterQ,
      obstacle: finalObsQ,
      image: finalVcnvImage,
    },
    tangToc: finalTangToc,
    veDich: {
      pool10: finalPool10,
      pool20: finalPool20,
      pool30: finalPool30,
    },
    tieBreak: finalTieBreak,
  };
}

export function generateExcelTemplate(): Buffer {
  const wb = xlsx.utils.book_new();

  // 1. KhoiDong_Rieng (Mỗi ghế thí sinh 1 - 5 có 6 câu hỏi mẫu trắc nghiệm A, B, C, D)
  const kdRiengRows: any[] = [];
  for (let seat = 1; seat <= 5; seat++) {
    for (let order = 1; order <= GAME_CONFIG.KHOI_DONG.RIENG_QUESTIONS_PER_PLAYER; order++) {
      kdRiengRows.push({
        Seat: seat,
        Order: order,
        Prompt: `[Câu hỏi mẫu] Nội dung câu hỏi Khởi động riêng số ${order} của Thí sinh ${seat}?`,
        OptionA: 'Phương án A',
        OptionB: 'Phương án B',
        OptionC: 'Phương án C',
        OptionD: 'Phương án D',
        Answer: 'A',
        Alternatives: 'PHƯƠNG ÁN A; ĐÁP ÁN A; A',
        Difficulty: order <= GAME_CONFIG.KHOI_DONG.RIENG_DIFFICULTY.easy ? 'Dễ' : 'Trung bình',
      });
    }
  }
  const wsRieng = xlsx.utils.json_to_sheet(kdRiengRows);
  xlsx.utils.book_append_sheet(wb, wsRieng, 'KhoiDong_Rieng');

  // 2. KhoiDong_Chung (12 câu hỏi mẫu trắc nghiệm: 5 dễ, 4 trung bình, 3 khó)
  const kdChungRows: any[] = [];
  const chungCfg = GAME_CONFIG.KHOI_DONG.CHUNG_DIFFICULTY;
  for (let idx = 1; idx <= GAME_CONFIG.KHOI_DONG.CHUNG_QUESTIONS; idx++) {
    kdChungRows.push({
      Order: idx,
      Prompt: `[Câu hỏi mẫu] Nội dung câu hỏi Khởi động chung số ${idx}?`,
      OptionA: 'Lựa chọn A',
      OptionB: 'Lựa chọn B',
      OptionC: 'Lựa chọn C',
      OptionD: 'Lựa chọn D',
      Answer: 'A',
      Alternatives: 'LỰA CHỌN A; ĐÁP ÁN A; A',
      Difficulty: idx <= chungCfg.easy ? 'Dễ' : idx <= chungCfg.easy + chungCfg.medium ? 'Trung bình' : 'Khó',
    });
  }
  const wsChung = xlsx.utils.json_to_sheet(kdChungRows);
  xlsx.utils.book_append_sheet(wb, wsChung, 'KhoiDong_Chung');

  // 3. VCNV (4 hàng ngang gợi ý, 1 câu trung tâm, 1 từ khóa CNV)
  const vcnvRows = [
    {
      Type: 'ROW_1',
      Prompt: '[Câu hỏi mẫu] Câu hỏi gợi ý cho hàng ngang số 1?',
      Answer: 'GỢI Ý 1',
      Alternatives: 'GOI Y 1',
    },
    {
      Type: 'ROW_2',
      Prompt: '[Câu hỏi mẫu] Câu hỏi gợi ý cho hàng ngang số 2?',
      Answer: 'GỢI Ý 2',
      Alternatives: 'GOI Y 2',
    },
    {
      Type: 'ROW_3',
      Prompt: '[Câu hỏi mẫu] Câu hỏi gợi ý cho hàng ngang số 3?',
      Answer: 'GỢI Ý 3',
      Alternatives: 'GOI Y 3',
    },
    {
      Type: 'ROW_4',
      Prompt: '[Câu hỏi mẫu] Câu hỏi gợi ý cho hàng ngang số 4?',
      Answer: 'GỢI Ý 4',
      Alternatives: 'GOI Y 4',
    },
    {
      Type: 'CENTER',
      Prompt: '[Câu hỏi mẫu] Câu hỏi gợi ý hiển thị cho cả phòng để đoán từ khóa (không cần đáp án)',
      Answer: '',
      Alternatives: '',
    },
    {
      Type: 'OBSTACLE',
      Prompt: '[Câu hỏi mẫu] Câu hỏi gợi ý cho từ khóa Chướng ngại vật chính?',
      Answer: 'TỪ KHÓA CHÍNH',
      Alternatives: 'TU KHOA CHINH',
    },
  ];
  const wsVcnv = xlsx.utils.json_to_sheet(vcnvRows);
  xlsx.utils.book_append_sheet(wb, wsVcnv, 'VCNV');

  // 4. TangToc (4 câu hỏi, mỗi câu 30 giây)
  const ttRows = [
    {
      Order: 1,
      Prompt: '[Câu hỏi mẫu] Nội dung câu hỏi Tăng tốc số 1?',
      Answer: 'ĐÁP ÁN 1',
      Alternatives: 'DAP AN 1; CAU TRA LOI 1',
      Media: '',
    },
    {
      Order: 2,
      Prompt: '[Câu hỏi mẫu] Nội dung câu hỏi Tăng tốc số 2?',
      Answer: 'ĐÁP ÁN 2',
      Alternatives: 'DAP AN 2; CAU TRA LOI 2',
      Media: '',
    },
    {
      Order: 3,
      Prompt: '[Câu hỏi mẫu] Nội dung câu hỏi Tăng tốc số 3?',
      Answer: 'ĐÁP ÁN 3',
      Alternatives: 'DAP AN 3; CAU TRA LOI 3',
      Media: '',
    },
    {
      Order: 4,
      Prompt: '[Câu hỏi mẫu] Nội dung câu hỏi Tăng tốc số 4?',
      Answer: 'ĐÁP ÁN 4',
      Alternatives: 'DAP AN 4; CAU TRA LOI 4',
      Media: '',
    },
  ];
  const wsTt = xlsx.utils.json_to_sheet(ttRows);
  xlsx.utils.book_append_sheet(wb, wsTt, 'TangToc');

  // 5. VeDich (Mỗi mức điểm 10đ, 20đ, 30đ có các câu hỏi mẫu)
  const vdRows: any[] = [];
  for (let i = 1; i <= 10; i++) {
    vdRows.push({
      Points: 10,
      Prompt: `[Câu hỏi mẫu] Nội dung câu hỏi Về đích 10 điểm số ${i}?`,
      Answer: `ĐÁP ÁN 10Đ SỐ ${i}`,
      Alternatives: `DAP AN 10D SO ${i}; TRA LOI ${i}`,
    });
  }
  for (let i = 1; i <= 6; i++) {
    vdRows.push({
      Points: 20,
      Prompt: `[Câu hỏi mẫu] Nội dung câu hỏi Về đích 20 điểm số ${i}?`,
      Answer: `ĐÁP ÁN 20Đ SỐ ${i}`,
      Alternatives: `DAP AN 20D SO ${i}; TRA LOI ${i}`,
    });
  }
  for (let i = 1; i <= 10; i++) {
    vdRows.push({
      Points: 30,
      Prompt: `[Câu hỏi mẫu] Nội dung câu hỏi Về đích 30 điểm số ${i}?`,
      Answer: `ĐÁP ÁN 30Đ SỐ ${i}`,
      Alternatives: `DAP AN 30D SO ${i}; TRA LOI ${i}`,
    });
  }
  const wsVd = xlsx.utils.json_to_sheet(vdRows);
  xlsx.utils.book_append_sheet(wb, wsVd, 'VeDich');

  // 6. TieBreak (3 câu hỏi phụ)
  const tbRows = [
    {
      Order: 1,
      Prompt: '[Câu hỏi mẫu] Nội dung câu hỏi phụ (Tie-break) số 1?',
      Answer: 'ĐÁP ÁN PHỤ 1',
      Alternatives: 'DAP AN PHU 1',
    },
    {
      Order: 2,
      Prompt: '[Câu hỏi mẫu] Nội dung câu hỏi phụ (Tie-break) số 2?',
      Answer: 'ĐÁP ÁN PHỤ 2',
      Alternatives: 'DAP AN PHU 2',
    },
    {
      Order: 3,
      Prompt: '[Câu hỏi mẫu] Nội dung câu hỏi phụ (Tie-break) số 3?',
      Answer: 'ĐÁP ÁN PHỤ 3',
      Alternatives: 'DAP AN PHU 3',
    },
  ];
  const wsTb = xlsx.utils.json_to_sheet(tbRows);
  xlsx.utils.book_append_sheet(wb, wsTb, 'TieBreak');

  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
