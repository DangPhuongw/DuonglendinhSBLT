import { RoomStateMachine, StateMachineCallbacks } from './RoomStateMachine.js';
import { SnapshotManager } from './SnapshotManager.js';
import { GAME_CONFIG, QuestionSet } from '@olympia/shared';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, RoomStateMachine> = new Map();
  private socketToPlayer: Map<string, { roomCode: string; playerId: string }> = new Map();
  private defaultCallbacksFactory: (roomCode: string) => StateMachineCallbacks = () => ({} as any);

  private constructor() {
    this.startCleanupInterval();
  }

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public setCallbacksFactory(factory: (roomCode: string) => StateMachineCallbacks): void {
    this.defaultCallbacksFactory = factory;
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(
    hostName: string,
    token: string,
    customQuestionSet?: QuestionSet
  ): { roomCode: string; machine: RoomStateMachine; playerId: string } {
    const roomCode = this.generateRoomCode();
    const playerId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const callbacks = this.defaultCallbacksFactory(roomCode);

    const machine = new RoomStateMachine(
      roomCode,
      { id: playerId, name: hostName, token },
      callbacks,
      customQuestionSet
    );

    this.rooms.set(roomCode, machine);
    return { roomCode, machine, playerId };
  }

  public getRoom(roomCode: string): RoomStateMachine | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  /**
   * Gắn socket với người chơi. Mỗi người chơi chỉ giữ 1 socket: các socket cũ của cùng người chơi
   * (vd. kết nối cũ chưa kịp ngắt khi vào lại) bị gỡ để khi chúng ngắt muộn sẽ không đánh dấu
   * người chơi offline nhầm. Trả về danh sách socket cũ đã gỡ.
   */
  public associateSocket(socketId: string, roomCode: string, playerId: string): string[] {
    const code = roomCode.toUpperCase();
    const staleSocketIds: string[] = [];
    for (const [sockId, info] of this.socketToPlayer.entries()) {
      if (sockId !== socketId && info.roomCode === code && info.playerId === playerId) {
        staleSocketIds.push(sockId);
      }
    }
    for (const sockId of staleSocketIds) {
      this.socketToPlayer.delete(sockId);
    }
    this.socketToPlayer.set(socketId, { roomCode: code, playerId });
    return staleSocketIds;
  }

  public getPlayerBySocket(socketId: string): { roomCode: string; playerId: string } | undefined {
    return this.socketToPlayer.get(socketId);
  }

  public getSocketByPlayer(roomCode: string, playerId: string): string | undefined {
    const code = roomCode.toUpperCase();
    for (const [sockId, info] of this.socketToPlayer.entries()) {
      if (info.roomCode === code && info.playerId === playerId) {
        return sockId;
      }
    }
    return undefined;
  }

  public removeSocket(socketId: string): { roomCode: string; playerId: string } | undefined {
    const info = this.socketToPlayer.get(socketId);
    if (info) {
      this.socketToPlayer.delete(socketId);
    }
    return info;
  }

  public loadSavedSnapshots(): void {
    const savedRooms = SnapshotManager.loadRooms();
    for (const room of savedRooms) {
      // Re-create machine for each snapshot
      const host = room.players.find((p) => p.id === room.hostId) || room.players[0];
      if (host) {
        const callbacks = this.defaultCallbacksFactory(room.code);
        const machine = new RoomStateMachine(
          room.code,
          { id: host.id, name: host.name, token: host.token ?? '' },
          callbacks
        );
        machine.room = room; // Restore exact room state
        this.rooms.set(room.code, machine);
      }
    }
    console.log(`Loaded ${savedRooms.length} rooms from snapshot.`);
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [code, machine] of this.rooms.entries()) {
        if (now - machine.room.updatedAt > GAME_CONFIG.ROOM_IDLE_TIMEOUT_MS) {
          console.log(`Cleaning up idle room ${code}`);
          SnapshotManager.deleteRoom(code);
          this.rooms.delete(code);
        }
      }
    }, 15 * 60 * 1000); // Check every 15 minutes
  }
}
