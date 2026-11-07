import xlsx from 'xlsx';
import { Question, QuestionSet } from '@olympia/shared';
import { DEFAULT_QUESTION_SET } from './defaultQuestionSet.js';

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
      timeLimit: 30,
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

export function generateExcelTemplate(): Buffer {
  const wb = xlsx.utils.book_new();

  // 1. KhoiDong_Rieng
  const kdRiengRows: any[] = [];
  DEFAULT_QUESTION_SET.khoiDong.rieng.forEach((seatQuestions, seatIdx) => {
    seatQuestions.forEach((q, orderIdx) => {
      kdRiengRows.push({
        Seat: seatIdx + 1,
        Order: orderIdx + 1,
        Prompt: q.prompt,
        OptionA: q.options?.[0] || '',
        OptionB: q.options?.[1] || '',
        OptionC: q.options?.[2] || '',
        OptionD: q.options?.[3] || '',
        Answer: q.answer,
        Alternatives: (q.alternatives || []).join('; '),
      });
    });
  });
  const wsRieng = xlsx.utils.json_to_sheet(kdRiengRows);
  xlsx.utils.book_append_sheet(wb, wsRieng, 'KhoiDong_Rieng');

  // 2. KhoiDong_Chung
  const kdChungRows = DEFAULT_QUESTION_SET.khoiDong.chung.map((q, idx) => ({
    Order: idx + 1,
    Prompt: q.prompt,
    OptionA: q.options?.[0] || '',
    OptionB: q.options?.[1] || '',
    OptionC: q.options?.[2] || '',
    OptionD: q.options?.[3] || '',
    Answer: q.answer,
    Alternatives: (q.alternatives || []).join('; '),
  }));
  const wsChung = xlsx.utils.json_to_sheet(kdChungRows);
  xlsx.utils.book_append_sheet(wb, wsChung, 'KhoiDong_Chung');

  // 3. VCNV
  const vcnvRows: any[] = [];
  DEFAULT_QUESTION_SET.vcnv.rows.forEach((r, idx) => {
    vcnvRows.push({
      Type: `ROW_${idx + 1}`,
      Prompt: r.prompt,
      Answer: r.answer,
      Alternatives: (r.alternatives || []).join('; '),
      Image: idx === 0 ? (DEFAULT_QUESTION_SET.vcnv.image || '') : '',
    });
  });
  vcnvRows.push({
    Type: 'CENTER',
    Prompt: DEFAULT_QUESTION_SET.vcnv.center.prompt,
    Answer: DEFAULT_QUESTION_SET.vcnv.center.answer,
    Alternatives: (DEFAULT_QUESTION_SET.vcnv.center.alternatives || []).join('; '),
    Image: '',
  });
  vcnvRows.push({
    Type: 'OBSTACLE',
    Prompt: DEFAULT_QUESTION_SET.vcnv.obstacle.prompt,
    Answer: DEFAULT_QUESTION_SET.vcnv.obstacle.answer,
    Alternatives: (DEFAULT_QUESTION_SET.vcnv.obstacle.alternatives || []).join('; '),
    Image: '',
  });
  const wsVcnv = xlsx.utils.json_to_sheet(vcnvRows);
  xlsx.utils.book_append_sheet(wb, wsVcnv, 'VCNV');

  // 4. TangToc
  const ttRows = DEFAULT_QUESTION_SET.tangToc.map((q, idx) => ({
    Order: idx + 1,
    Prompt: q.prompt,
    Answer: q.answer,
    Alternatives: (q.alternatives || []).join('; '),
    Media: q.media || '',
  }));
  const wsTt = xlsx.utils.json_to_sheet(ttRows);
  xlsx.utils.book_append_sheet(wb, wsTt, 'TangToc');

  // 5. VeDich
  const vdRows: any[] = [];
  DEFAULT_QUESTION_SET.veDich.pool10.forEach((q) => {
    vdRows.push({
      Points: 10,
      Prompt: q.prompt,
      Answer: q.answer,
      Alternatives: (q.alternatives || []).join('; '),
    });
  });
  DEFAULT_QUESTION_SET.veDich.pool20.forEach((q) => {
    vdRows.push({
      Points: 20,
      Prompt: q.prompt,
      Answer: q.answer,
      Alternatives: (q.alternatives || []).join('; '),
    });
  });
  DEFAULT_QUESTION_SET.veDich.pool30.forEach((q) => {
    vdRows.push({
      Points: 30,
      Prompt: q.prompt,
      Answer: q.answer,
      Alternatives: (q.alternatives || []).join('; '),
    });
  });
  const wsVd = xlsx.utils.json_to_sheet(vdRows);
  xlsx.utils.book_append_sheet(wb, wsVd, 'VeDich');

  // 6. TieBreak
  const tbRows = DEFAULT_QUESTION_SET.tieBreak.map((q, idx) => ({
    Order: idx + 1,
    Prompt: q.prompt,
    Answer: q.answer,
    Alternatives: (q.alternatives || []).join('; '),
  }));
  const wsTb = xlsx.utils.json_to_sheet(tbRows);
  xlsx.utils.book_append_sheet(wb, wsTb, 'TieBreak');

  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
