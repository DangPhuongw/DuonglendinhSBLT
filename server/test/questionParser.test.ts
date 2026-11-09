import { describe, it, expect } from 'vitest';
import { generateExcelTemplate, parseExcelQuestionSet } from '../src/game/questionParser.js';
import { DEFAULT_QUESTION_SET } from '../src/game/defaultQuestionSet.js';

describe('generateExcelTemplate & questionParser', () => {
  it('generates a valid Excel template buffer without leaking default questions', () => {
    const buffer = generateExcelTemplate();
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify template does not contain default question answers like "CẦU VỒNG" or specific prompt texts
    const bufferStr = buffer.toString('utf8');
    expect(bufferStr.includes('CẦU VỒNG')).toBe(false);

    // Verify it parses back successfully into a valid QuestionSet
    const parsed = parseExcelQuestionSet(buffer, 'Sample Test Template');
    expect(parsed.title).toBe('Sample Test Template');
    expect(parsed.khoiDong.rieng.length).toBe(5);
    expect(parsed.khoiDong.chung.length).toBe(12);
    expect(parsed.vcnv.rows.length).toBe(4);
    expect(parsed.vcnv.obstacle.answer).toBe('TỪ KHÓA CHÍNH');
    expect(parsed.tangToc.length).toBe(4);
    expect(parsed.veDich.pool10.length).toBeGreaterThan(0);
    expect(parsed.veDich.pool20.length).toBeGreaterThan(0);
    expect(parsed.veDich.pool30.length).toBeGreaterThan(0);
    expect(parsed.tieBreak.length).toBe(3);
  });
});
