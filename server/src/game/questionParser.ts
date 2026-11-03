import xlsx from 'xlsx';
import { Question, QuestionSet } from '@olympia/shared';

export function parseExcelQuestionSet(buffer: Buffer, title: string = 'Bộ đề tải lên'): QuestionSet {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

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
        String(row.OptionA || row.A || ''),
        String(row.OptionB || row.B || ''),
        String(row.OptionC || row.C || ''),
        String(row.OptionD || row.D || ''),
      ],
      answer: String(row.Answer || row.answer || '').trim().toUpperCase(),
      alternatives,
    };
    if (kdRieng[seatIdx].length < 5) {
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
        String(row.OptionA || row.A || ''),
        String(row.OptionB || row.B || ''),
        String(row.OptionC || row.C || ''),
        String(row.OptionD || row.D || ''),
      ],
      answer: String(row.Answer || row.answer || '').trim().toUpperCase(),
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
      timeLimit: points === 10 ? 10 : points === 20 ? 15 : 20,
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

  return {
    id: `qs-${Date.now()}`,
    title,
    khoiDong: {
      rieng: kdRieng,
      chung: kdChung,
    },
    vcnv: {
      rows: vcnvRows,
      center: centerQ,
      obstacle: obsQ,
      image: vcnvImage,
    },
    tangToc,
    veDich: {
      pool10,
      pool20,
      pool30,
    },
    tieBreak,
  };
}
