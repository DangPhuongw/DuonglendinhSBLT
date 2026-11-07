import { describe, it, expect } from 'vitest';
import { normalizeAnswer, matchAnswer } from '@olympia/shared';

describe('answerMatcher', () => {
  it('normalizes whitespace and uppercase', () => {
    expect(normalizeAnswer('  hà   nội  ')).toBe('HÀ NỘI');
  });

  it('handles NFC and NFD decomposition (Unikey, macOS)', () => {
    // 'Hà Nội' in NFD vs NFC
    const nfc = 'Hà Nội'.normalize('NFC');
    const nfd = 'Hà Nội'.normalize('NFD');
    expect(nfc).not.toBe(nfd); // In raw strings they have different byte representations
    expect(normalizeAnswer(nfd)).toBe(normalizeAnswer(nfc));
    expect(matchAnswer(nfd, nfc)).toBe(true);
  });

  it('handles Vietnamese Đ / đ correctly when ignoreDiacritics is true', () => {
    expect(normalizeAnswer('Đà Nẵng', { ignoreDiacritics: true })).toBe('DA NANG');
    expect(normalizeAnswer('điện biên phủ', { ignoreDiacritics: true })).toBe('DIEN BIEN PHU');
    expect(matchAnswer('Da Nang', 'Đà Nẵng', [], { ignoreDiacritics: true })).toBe(true);
  });

  it('handles VCNV row answers without spaces', () => {
    expect(normalizeAnswer('QUANG TRUNG', { isVcnvRow: true })).toBe('QUANGTRUNG');
    expect(matchAnswer('quang trung', 'QUANGTRUNG', [], { isVcnvRow: true })).toBe(true);
    expect(matchAnswer('  quang   trung  ', 'Quang Trung', [], { isVcnvRow: true })).toBe(true);
  });

  it('matches against alternative answers', () => {
    const mainAnswer = 'HỒ CHÍ MINH';
    const alternatives = ['BÁC HỒ', 'NGUYỄN TẤT THÀNH', 'NGUYỄN ÁI QUỐC'];

    expect(matchAnswer('bác hồ', mainAnswer, alternatives)).toBe(true);
    expect(matchAnswer('nguyễn ái quốc', mainAnswer, alternatives)).toBe(true);
    expect(matchAnswer('Võ Nguyên Giáp', mainAnswer, alternatives)).toBe(false);
  });

  it('handles empty or blank inputs safely', () => {
    expect(matchAnswer('', 'HÀ NỘI')).toBe(false);
    expect(matchAnswer('   ', 'HÀ NỘI')).toBe(false);
  });

  it('strictly rejects incorrect MCQ letters even if alternatives contain conflicting letters', () => {
    // When correct answer is B, selecting A must NEVER be true
    expect(matchAnswer('A', 'B', ['AMPE', 'A'])).toBe(false);
    expect(matchAnswer('B', 'B', ['AMPE', 'A'])).toBe(true);
    expect(matchAnswer('C', 'B', ['AMPE', 'A'])).toBe(false);
    expect(matchAnswer('D', 'B', ['AMPE', 'A'])).toBe(false);
  });
});
