import { Question, QuestionSet } from '@olympia/shared';

export type QuestionSetValidation =
  | { ok: true; questionSet: QuestionSet }
  | { ok: false; errors: string[] };

const MAX_ERRORS = 15;

function isObject(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Kiểm tra và chuẩn hóa bộ đề trước khi gắn vào phòng.
 * Bộ đề thiếu phần bắt buộc (vd. không có câu Về đích, thiếu đáp án) sẽ làm trận đấu lỗi giữa chừng,
 * nên phải chặn ngay lúc tải lên và báo rõ lỗi ở đâu.
 */
export function validateQuestionSet(input: unknown): QuestionSetValidation {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const addError = (msg: string) => {
    if (errors.length < MAX_ERRORS) errors.push(msg);
  };

  const checkQuestion = (q: unknown, where: string): Question | null => {
    if (!isObject(q)) {
      addError(`${where}: không phải câu hỏi hợp lệ.`);
      return null;
    }
    if (!isNonEmptyString(q.id)) addError(`${where}: thiếu mã câu hỏi (id).`);
    else if (seenIds.has(q.id)) addError(`${where}: mã câu hỏi "${q.id}" bị trùng.`);
    else seenIds.add(q.id);

    if (!isNonEmptyString(q.prompt)) addError(`${where}: thiếu nội dung câu hỏi.`);
    if (!isNonEmptyString(q.answer)) addError(`${where}: thiếu đáp án.`);

    const hasOptions = Array.isArray(q.options) && q.options.length === 4;
    return {
      ...(q as Question),
      type: q.type === 'mcq' || q.type === 'text' ? q.type : hasOptions ? 'mcq' : 'text',
      options: hasOptions ? (q.options.map((o: unknown) => String(o ?? '')) as Question['options']) : undefined,
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : undefined,
      alternatives: Array.isArray(q.alternatives)
        ? q.alternatives.filter((a: unknown): a is string => typeof a === 'string')
        : [],
    };
  };

  const checkList = (list: unknown, where: string, minCount: number): Question[] => {
    if (!Array.isArray(list)) {
      addError(`${where}: thiếu danh sách câu hỏi.`);
      return [];
    }
    if (list.length < minCount) addError(`${where}: cần tối thiểu ${minCount} câu (đang có ${list.length}).`);
    return list.map((q, i) => checkQuestion(q, `${where} câu ${i + 1}`)).filter((q): q is Question => q !== null);
  };

  if (!isObject(input)) {
    return { ok: false, errors: ['File không chứa bộ đề hợp lệ.'] };
  }

  const kd = isObject(input.khoiDong) ? input.khoiDong : {};
  if (!isObject(input.khoiDong)) addError('Thiếu phần Khởi động.');
  const riengRaw = Array.isArray(kd.rieng) ? kd.rieng : [];
  if (!Array.isArray(kd.rieng) || riengRaw.length === 0) addError('Khởi động riêng: thiếu các gói câu hỏi.');
  // Gói trống được phép (bộ đề có thể chỉ soạn cho 4 thí sinh), nhưng phải có ít nhất 1 gói có câu hỏi
  const rieng = riengRaw.map((pkg: unknown, i: number) => checkList(pkg, `Khởi động riêng gói ${i + 1}`, 0));
  if (riengRaw.length > 0 && rieng.every((pkg: Question[]) => pkg.length === 0)) {
    addError('Khởi động riêng: cần ít nhất 1 gói có câu hỏi.');
  }
  const chung = checkList(kd.chung, 'Khởi động chung', 1);

  const vcnvRaw = isObject(input.vcnv) ? input.vcnv : {};
  if (!isObject(input.vcnv)) addError('Thiếu phần Vượt chướng ngại vật.');
  const rows = checkList(vcnvRaw.rows, 'VCNV hàng ngang', 4);
  if (Array.isArray(vcnvRaw.rows) && vcnvRaw.rows.length > 4) addError('VCNV hàng ngang: chỉ được có đúng 4 hàng.');
  const center = checkQuestion(vcnvRaw.center, 'VCNV ô trung tâm');
  const obstacle = checkQuestion(vcnvRaw.obstacle, 'VCNV chướng ngại vật');

  const tangToc = checkList(input.tangToc, 'Tăng tốc', 1);

  const vdRaw = isObject(input.veDich) ? input.veDich : {};
  if (!isObject(input.veDich)) addError('Thiếu phần Về đích.');
  const pool10 = checkList(vdRaw.pool10, 'Về đích 10 điểm', 1);
  const pool20 = checkList(vdRaw.pool20, 'Về đích 20 điểm', 1);
  const pool30 = checkList(vdRaw.pool30, 'Về đích 30 điểm', 1);

  const tieBreak = input.tieBreak === undefined ? [] : checkList(input.tieBreak, 'Câu hỏi phụ', 0);

  if (errors.length > 0 || !center || !obstacle) {
    return { ok: false, errors: errors.length > 0 ? errors : ['Bộ đề không hợp lệ.'] };
  }

  return {
    ok: true,
    questionSet: {
      id: isNonEmptyString(input.id) ? input.id : `qs-${Date.now()}`,
      title: isNonEmptyString(input.title) ? input.title.trim() : 'Bộ đề tải lên',
      khoiDong: { rieng, chung },
      vcnv: {
        rows,
        center,
        obstacle,
        image: typeof vcnvRaw.image === 'string' ? vcnvRaw.image : undefined,
      },
      tangToc,
      veDich: { pool10, pool20, pool30 },
      tieBreak,
    },
  };
}
