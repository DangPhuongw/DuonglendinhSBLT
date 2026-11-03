import fs from 'fs';
import path from 'path';
import { Room } from '@olympia/shared';

export class SnapshotManager {
  private static snapshotDir = path.resolve(process.cwd(), 'snapshots');

  public static init(): void {
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  public static saveRoom(room: Room): void {
    try {
      this.init();
      const filePath = path.join(this.snapshotDir, `${room.code}.json`);
      fs.writeFileSync(filePath, JSON.stringify(room, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Failed to save snapshot for room ${room.code}:`, err);
    }
  }

  public static loadRooms(): Room[] {
    try {
      this.init();
      const files = fs.readdirSync(this.snapshotDir).filter(f => f.endsWith('.json'));
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
    try {
      const filePath = path.join(this.snapshotDir, `${roomCode}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete snapshot for room ${roomCode}:`, err);
    }
  }
}
