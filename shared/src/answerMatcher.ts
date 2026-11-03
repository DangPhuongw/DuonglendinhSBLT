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

  const validAnswers = [correctAnswer, ...(alternatives || [])];
  return validAnswers.some((ans) => {
    if (!ans) return false;
    return normalizeAnswer(ans, options) === normalizedInput;
  });
}
