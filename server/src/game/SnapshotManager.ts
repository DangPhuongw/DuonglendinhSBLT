import fs from 'fs';
import path from 'path';
import { QuestionSet, Room } from '@olympia/shared';

const QUESTIONS_SUFFIX = '.questions.json';

export class SnapshotManager {
  private static snapshotDir = path.resolve(process.cwd(), 'snapshots');

  public static init(): void {
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  /** File lịch sử câu hỏi đã dùng (tên bắt đầu bằng _ để không bị đọc nhầm thành snapshot phòng). */
  public static questionUsageFile(): string {
    return path.join(this.snapshotDir, '_question-usage.json');
  }

  public static saveRoom(room: Room): void {
    try {
      this.init();
      const filePath = path.join(this.snapshotDir, `${room.code}.json`);
      const tmpPath = `${filePath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(room), 'utf-8');
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      console.error(`Failed to save snapshot for room ${room.code}:`, err);
    }
  }

  public static loadRooms(): Room[] {
    try {
      this.init();
      const files = fs
        .readdirSync(this.snapshotDir)
        .filter((f) => f.endsWith('.json') && !f.endsWith(QUESTIONS_SUFFIX) && !f.startsWith('_'));
      const rooms: Room[] = [];
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.snapshotDir, file), 'utf-8');
          const room = JSON.parse(content) as Room;
          rooms.push(room);
        } catch (e) {
          console.error(`Error reading snapshot file ${file}:`, e);
        }
      }
      return rooms;
    } catch (err) {
      console.error('Failed to load room snapshots:', err);
      return [];
    }
  }

  public static deleteRoom(roomCode: string): void {
    for (const file of [`${roomCode}.json`, `${roomCode}${QUESTIONS_SUFFIX}`]) {
      try {
        const filePath = path.join(this.snapshotDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`Failed to delete snapshot ${file}:`, err);
      }
    }
  }

  /** Bộ đề lưu riêng, chỉ ghi khi đổi bộ đề (không ghi lại mỗi lần có sự kiện như snapshot phòng). */
  public static saveQuestionSet(roomCode: string, questionSet: QuestionSet): void {
    try {
      this.init();
      const filePath = path.join(this.snapshotDir, `${roomCode}${QUESTIONS_SUFFIX}`);
      fs.writeFileSync(filePath, JSON.stringify(questionSet), 'utf-8');
    } catch (err) {
      console.error(`Failed to save question set for room ${roomCode}:`, err);
    }
  }

  public static loadQuestionSet(roomCode: string): QuestionSet | null {
    try {
      const filePath = path.join(this.snapshotDir, `${roomCode}${QUESTIONS_SUFFIX}`);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as QuestionSet;
    } catch (err) {
      console.error(`Failed to load question set for room ${roomCode}:`, err);
      return null;
    }
  }
}
