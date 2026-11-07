export function normalizeAnswer(
  input: string,
  options?: { isVcnvRow?: boolean; ignoreDiacritics?: boolean }
): string {
  if (!input) return '';
  let str = input.normalize('NFC').trim().replace(/\s+/g, ' ').toUpperCase();
  if (options?.ignoreDiacritics) {
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D');
  }
  if (options?.isVcnvRow) {
    str = str.replace(/\s+/g, ''); // Hàng ngang VCNV không tính dấu cách
  }
  return str;
}

export function matchAnswer(
  playerInput: string,
  correctAnswer: string,
  alternatives: string[] = [],
  options?: { isVcnvRow?: boolean; ignoreDiacritics?: boolean }
): boolean {
  if (!playerInput) return false;
  const normalizedInput = normalizeAnswer(playerInput, options);
  if (!normalizedInput) return false;

  const normalizedCorrect = normalizeAnswer(correctAnswer, options);

  // Xử lý câu hỏi trắc nghiệm (MCQ) hoặc khi người chơi chọn chữ cái A, B, C, D:
  // Nếu đáp án chuẩn là A, B, C, D và người chơi bấm chọn A, B, C, D:
  // BẮT BUỘC người chơi phải chọn đúng chữ cái của đáp án chuẩn (không thể chọn A mà được tính đúng khi đáp án là B).
  const isMcqLetter = ['A', 'B', 'C', 'D'].includes(normalizedInput);
  const isCorrectMcqLetter = ['A', 'B', 'C', 'D'].includes(normalizedCorrect);

  if (isCorrectMcqLetter && isMcqLetter) {
    return normalizedInput === normalizedCorrect;
  }

  const validAnswers = [correctAnswer, ...(alternatives || [])];
  return validAnswers.some((ans) => {
    if (!ans) return false;
    const normAns = normalizeAnswer(ans, options);
    // Nếu người chơi chọn chữ cái A, B, C, D thì không được match với alternative là chữ cái khác
    if (isMcqLetter && ['A', 'B', 'C', 'D'].includes(normAns) && normAns !== normalizedCorrect) {
      return false;
    }
    return normAns === normalizedInput;
  });
}
