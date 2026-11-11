import fs from 'fs';
import path from 'path';
import { QuestionSet } from '@olympia/shared';
import { LoadedBank, loadQuestionBank, summarizeBank } from './questionBank.js';
import { ComposeResult, QuestionUsage, composeQuestionSet } from './questionComposer.js';
import { validateQuestionSet } from './questionValidator.js';
import { FillResult, fillMissingFromBank } from './questionFill.js';

/** Thư mục kho: biến môi trường QUESTION_BANK_DIR, hoặc ./question-bank, hoặc ./server/question-bank. */
export function resolveBankDir(): string {
  const candidates = [
    process.env.QUESTION_BANK_DIR,
    path.resolve(process.cwd(), 'question-bank'),
    path.resolve(process.cwd(), 'server/question-bank'),
  ].filter((d): d is string => Boolean(d));
  return candidates.find((d) => fs.existsSync(d)) ?? candidates[candidates.length - 1];
}

/**
 * Giữ kho câu hỏi trong bộ nhớ, tự nạp lại khi file Excel trong thư mục thay đổi
 * (sửa file xong là trận kế tiếp dùng luôn, không cần khởi động lại server).
 */
export class QuestionBankService {
  private loaded: LoadedBank | null = null;
  private signature = '';

  constructor(
    private readonly dir: string,
    private readonly usage: QuestionUsage
  ) {}

  private computeSignature(): string {
    try {
      return fs
        .readdirSync(this.dir)
        .filter((f) => /\.xlsx$/i.test(f) && !f.startsWith('~$'))
        .sort()
        .map((f) => {
          const st = fs.statSync(path.join(this.dir, f));
          return `${f}:${st.size}:${st.mtimeMs}`;
        })
        .join('|');
    } catch {
      return '';
    }
  }

  /** Nạp lại nếu có thay đổi. Trả về kho hiện tại. */
  refresh(force = false): LoadedBank {
    const sig = this.computeSignature();
    if (force || !this.loaded || sig !== this.signature) {
      this.loaded = loadQuestionBank(this.dir);
      this.signature = sig;
      const { issues, files } = this.loaded;
      console.log(`[QuestionBank] Đã nạp ${files.length} file từ ${this.dir}:`);
      for (const line of summarizeBank(this.loaded.data)) console.log(`  ${line}`);
      for (const i of issues.slice(0, 20)) {
        console.warn(`  ! ${i.file}${i.sheet ? ` / ${i.sheet}` : ''}${i.row ? ` / dòng ${i.row}` : ''}: ${i.message}`);
      }
      if (issues.length > 20) console.warn(`  ... và ${issues.length - 20} lỗi khác (chạy "npm run bank:check" để xem đủ).`);
    }
    return this.loaded;
  }

  /** Bù các phần còn thiếu của bộ đề tải lên bằng câu hỏi ngẫu nhiên từ kho. */
  fillMissing(qs: QuestionSet): FillResult {
    const bank = this.refresh();
    return fillMissingFromBank(qs, bank.data, this.usage);
  }

  /** Ghi nhớ các câu mượn từ kho đã được dùng (gọi sau khi bộ đề được chấp nhận). */
  markUsed(ids: string[]): void {
    if (ids.length > 0) this.usage.mark(ids);
  }

  /** Ghép một bộ đề mới cho trận, ghi nhớ các câu đã dùng. */
  compose(): ComposeResult {
    const bank = this.refresh();
    const result = composeQuestionSet(bank.data, this.usage);
    if (!result.ok) return result;

    // Kiểm tra lại bằng bộ kiểm tra chung trước khi dùng thật
    const validation = validateQuestionSet(result.questionSet);
    if (!validation.ok) {
      return { ok: false, error: 'Bộ đề ghép ra không hợp lệ: ' + validation.errors.join(' ') };
    }
    this.usage.mark(result.questionIds);
    return { ok: true, questionSet: validation.questionSet as QuestionSet, questionIds: result.questionIds };
  }
}
