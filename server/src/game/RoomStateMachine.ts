import {
  Room,
  Player,
  RoundType,
  RoomState,
  Question,
  ClientQuestion,
  QuestionSet,
  ScoreEvent,
  RevealPayload,
  RevealResult,
  AntiCheatAlert,
  TabLeaveReason,
  RoundResultEntry,
  GAME_CONFIG,
  matchAnswer,
  normalizeAnswer,
} from '@olympia/shared';
import { EventQueue } from './EventQueue.js';
import { SnapshotManager } from './SnapshotManager.js';
import { DEFAULT_QUESTION_SET } from './defaultQuestionSet.js';
import type { ComposeResult } from './questionComposer.js';

export interface StateMachineCallbacks {
  broadcastRoom: (room: Room) => void;
  broadcastBuzzWon: (data: { winnerId: string; winnerName: string; diffMs?: number }) => void;
  /** toPlayerId: chỉ gửi riêng cho người đó; null = cả phòng. */
  broadcastBuzzRejected: (toPlayerId: string | null, data: { reason: string }) => void;
  emitAnswerAck: (toPlayerId: string, data: { questionId: string; receivedAt: number }) => void;
  broadcastReveal: (data: RevealPayload) => void;
  broadcastScoreUpdate: (data: { scores: Record<string, number>; lastEvents: ScoreEvent[] }) => void;
  broadcastPlayerUpdate: (players: Player[]) => void;
  broadcastAntiCheat?: (data: AntiCheatAlert) => void;
}

/** Bỏ token khỏi danh sách người chơi trước khi gửi cho cả phòng. */
export function toPublicPlayers(players: Player[]): Player[] {
  return players.map(({ token: _token, ...rest }) => rest);
}

export const MAX_PLAYER_NAME_LENGTH = 30;

/** Seed ảnh đại diện: chỉ giữ chữ/số/-/_, tối đa 32 ký tự. Trả undefined nếu rỗng. */
export function sanitizeAvatarSeed(seed: unknown): string | undefined {
  if (typeof seed !== 'string') return undefined;
  const clean = seed.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32);
  return clean || undefined;
}

/** Bỏ ký tự điều khiển, gộp khoảng trắng, cắt độ dài. Trả '' nếu không hợp lệ. */
export function sanitizePlayerName(name: unknown): string {
  if (typeof name !== 'string') return '';
  return name
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PLAYER_NAME_LENGTH);
}

export class RoomStateMachine {
  public room: Room;
  public eventQueue: EventQueue;
  public questionSet: QuestionSet;
  private callbacks: StateMachineCallbacks;
  private activeTimer: NodeJS.Timeout | null = null;
  private activeExpire: (() => Promise<void>) | null = null;
  /** Tăng mỗi lần hủy/đặt lại đồng hồ: tác vụ hết giờ cũ đã nằm trong hàng đợi sẽ tự bỏ qua. */
  private timerGeneration = 0;
  /** Vòng của lần công bố gần nhất (để chủ phòng sửa điểm đúng luật của vòng đó). */
  private lastRevealRound: RoundType | null = null;
  /** VCNV: thời gian còn lại của 15s đoán cuối khi có người bấm chuông (để chạy tiếp, không đếm lại từ đầu). */
  private vcnvFinalGuessRemainingMs: number | null = null;
  /** VCNV: câu hàng ngang / ô trung tâm đang chạy bị chuông ngắt. Trả lời CNV sai thì chạy lại từ đầu. */
  private vcnvInterrupted: { kind: 'ROW' | 'CENTER'; rowIndex: number; stepIndex: number } | null = null;
  private lastTabLeaveAt: Map<string, number> = new Map();
  /** true nếu chủ phòng tự tải bộ đề lên: khi bắt đầu trận sẽ giữ nguyên, không ghép đề ngẫu nhiên từ kho. */
  public customQuestionSet = false;
  /** Hàm ghép đề ngẫu nhiên từ kho câu hỏi (do RoomManager gắn vào). */
  private questionComposer: (() => ComposeResult) | null = null;
  private hostTransferTimer: NodeJS.Timeout | null = null;

  // Working state during rounds
  private answersMap: Map<string, { answer: string; timestamp: number }> = new Map();
  private disqualifiedBuzzers: Set<string> = new Set();
  private buzzedPlayerId: string | null = null;
  private buzzerOpenTime: number = 0;
  private veDichPlayerQueue: string[] = [];
  private veDichCompletedPlayerIds: Set<string> = new Set();
  private veDichUsedQuestionIds: Set<string> = new Set();
  private veDichActiveContestantId: string = '';
  private veDichCurrentPackage: 40 | 60 | 80 = 40;
  private veDichCurrentQuestionIndex: number = 0;
  private veDichCurrentQuestionPoints: number = 10;
  private veDichHopeStarActive: boolean = false;
  private veDichCurrentPointsList: number[] = [];
  private veDichCurrentTurnIndex: number = 0;
  private veDichCurrentQuestion: Question | null = null;
  private tieBreakQuestionIndex: number = 0;
  private vcnvRowsAskedCount: number = 0;
  private vcnvQuestionsAppearedCount: number = 0;
  private vcnvCurrentRowIndex: number = 0;
  private vcnvPlayerQueue: string[] = [];
  private lastRevealedPayload: RevealPayload | null = null;
  private chosenKdPackages: Map<string, number> = new Map();

  constructor(
    roomCode: string,
    hostPlayer: { id: string; name: string; token: string; avatar?: string },
    callbacks: StateMachineCallbacks,
    initialQuestionSet?: QuestionSet
  ) {
    this.eventQueue = new EventQueue();
    this.callbacks = callbacks;
    this.questionSet = initialQuestionSet || DEFAULT_QUESTION_SET;
    this.customQuestionSet = Boolean(initialQuestionSet);

    const host: Player = {
      id: hostPlayer.id,
      name: sanitizePlayerName(hostPlayer.name) || 'Chủ phòng',
      avatar: sanitizeAvatarSeed(hostPlayer.avatar),
      seat: 1,
      role: 'player',
      token: hostPlayer.token,
      connected: true,
      ready: false,
      eliminatedVcnv: false,
      starUsed: false,
      score: 0,
      roundScores: { kd: 0, vcnv: 0, tt: 0, vd: 0 },
    };

    this.room = {
      code: roomCode,
      hostId: host.id,
      status: 'LOBBY',
      players: [host],
      questionSetId: this.questionSet.id,
      state: {
        round: 'LOBBY',
        subPhase: 'WAITING_PLAYERS',
        deadline: null,
      },
      history: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.persistSnapshot();
  }

  // --- Snapshot & Synchronization ---

  public persistSnapshot(): void {
    this.room.updatedAt = Date.now();
    SnapshotManager.saveRoom(this.room);
  }

  /** Đổi bộ đề của phòng và lưu ra đĩa (để khởi động lại server không bị mất bộ đề). */
  public setQuestionSet(questionSet: QuestionSet, source: 'custom' | 'bank' = 'custom'): void {
    this.questionSet = questionSet;
    this.customQuestionSet = source === 'custom';
    this.room.questionSetId = questionSet.id;
    SnapshotManager.saveQuestionSet(this.room.code, questionSet);
    this.persistSnapshot();
  }

  /**
   * Khôi phục phòng từ snapshot sau khi server khởi động lại.
   * Trạng thái giữa vòng (hàng đợi lượt, đồng hồ...) không lưu được, nên vòng đang dở được chơi lại
   * từ đầu: trả về màn Sẵn sàng của vòng đó và trừ lại điểm đã ghi trong vòng đó.
   */
  public restoreFromSnapshot(room: Room): void {
    this.room = room;
    const now = Date.now();
    for (const p of room.players) {
      p.connected = false;
      p.disconnectedAt = now;
      p.ready = false;
    }

    const round = room.state?.round;
    const restartTarget: Partial<Record<RoundType, RoundType>> = {
      KD_RIENG: 'KD_RIENG',
      KD_CHUNG: 'KD_RIENG',
      VCNV: 'VCNV',
      TANG_TOC: 'TANG_TOC',
      VE_DICH: 'VE_DICH',
      TIEBREAK: 'TIEBREAK',
    };

    if (round === 'READY') {
      this.transitionToReady(room.state.targetRound || 'KD_RIENG');
    } else if (round === 'ROUND_RESULTS') {
      const next = room.state.roundResults?.nextRound;
      this.transitionToReady(!next || next === 'FINAL' ? 'TIEBREAK' : next);
    } else if (round && restartTarget[round]) {
      const target = restartTarget[round]!;
      this.rollbackRoundScores(target);
      this.transitionToReady(target);
    } else {
      this.persistSnapshot();
    }
  }

  private rollbackRoundScores(target: RoundType): void {
    const key: Record<string, keyof Player['roundScores'] | undefined> = {
      KD_RIENG: 'kd',
      VCNV: 'vcnv',
      TANG_TOC: 'tt',
      VE_DICH: 'vd',
    };
    const scoreKey = key[target];
    if (!scoreKey) return;
    for (const p of this.room.players) {
      const roundScore = p.roundScores[scoreKey];
      if (roundScore !== 0) {
        this.addScore(p.id, target, '', -roundScore, 'server_restart_rollback');
      }
      if (target === 'VE_DICH') p.starUsed = false;
    }
  }

  public getSanitizedRoom(): Room {
    // Make sure no answers or alternatives leak
    const currentQ = this.room.state.currentQuestion;
    const sanitizedQ = currentQ
      ? {
          id: currentQ.id,
          type: currentQ.type,
          prompt: currentQ.prompt,
          options: currentQ.options,
          media: currentQ.media,
          timeLimit: currentQ.timeLimit,
          points: currentQ.points,
        }
      : undefined;

    return {
      ...this.room,
      players: toPublicPlayers(this.room.players),
      // Lịch sử điểm chỉ dùng ở server (biên bản CSV); không gửi kèm mỗi lần đồng bộ vì càng lúc càng nặng
      history: [],
      state: {
        ...this.room.state,
        currentQuestion: sanitizedQ,
      },
    };
  }

  public syncRoom(): void {
    this.callbacks.broadcastRoom(this.getSanitizedRoom());
  }

  /** Token gửi kèm có đúng là token của chủ phòng hiện tại không. */
  public isHostToken(token: unknown): boolean {
    if (typeof token !== 'string' || !token) return false;
    const host = this.room.players.find((p) => p.id === this.room.hostId);
    return Boolean(host?.token) && host!.token === token;
  }

  public setCallbacks(callbacks: StateMachineCallbacks): void {
    this.callbacks = callbacks;
  }

  // --- Timer scheduling ---

  private clearTimer(): void {
    this.timerGeneration++;
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
  }

  private setDeadline(durationMs: number, onExpire: () => Promise<void>): void {
    this.clearTimer();
    const generation = this.timerGeneration;
    const now = Date.now();
    this.room.state.deadline = now + durationMs;
    this.activeExpire = onExpire;

    // Hẹn giờ chạy sau deadline + NETWORK_GRACE_MS: đáp án gửi sát giờ, tới trễ vì mạng vẫn được nhận
    // (submitAnswer chấp nhận tới deadline + NETWORK_GRACE_MS).
    const fireInMs = durationMs > 0 ? durationMs + GAME_CONFIG.NETWORK_GRACE_MS : 0;

    this.activeTimer = setTimeout(() => {
      this.eventQueue.enqueue(async () => {
        // Đồng hồ đã bị hủy hoặc thay bằng đồng hồ khác trong lúc tác vụ này chờ trong hàng đợi
        if (generation !== this.timerGeneration || !this.room.state.deadline) return;
        this.activeTimer = null;
        await onExpire();
      });
    }, fireInMs);
  }

  /** Dừng mọi đồng hồ của phòng (dùng khi xóa phòng). */
  public dispose(): void {
    this.clearTimer();
    this.clearHostTransferTimer();
    this.eventQueue.clear();
  }

  /** Kết thúc ngay pha đang đếm giờ (chạy luôn hành động hết giờ của pha đó). */
  private expireNow(): void {
    if (this.activeExpire && this.room.state.deadline) {
      this.setDeadline(0, this.activeExpire);
    }
  }

  // --- Player Management ---

  public addPlayer(name: string, token: string, avatar?: string): { ok: boolean; player?: Player; error?: string } {
    if (this.room.status !== 'LOBBY') {
      return { ok: false, error: 'Trận đấu đã bắt đầu, không thể tham gia.' };
    }

    const playerSeatsTaken = new Set(
      this.room.players.filter((p) => (p.role || 'player') === 'player').map((p) => p.seat)
    );
    const viewerSeatsTaken = new Set(
      this.room.players.filter((p) => p.role === 'viewer').map((p) => p.seat)
    );

    let assignedRole: 'player' | 'viewer' = 'player';
    let nextSeat = 1;

    // Ưu tiên xếp vào ghế thí sinh 1-5
    let foundPlayerSeat = false;
    for (let s = 1; s <= GAME_CONFIG.MAX_PLAYERS; s++) {
      if (!playerSeatsTaken.has(s as any)) {
        nextSeat = s as any;
        assignedRole = 'player';
        foundPlayerSeat = true;
        break;
      }
    }

    // Nếu ghế thí sinh đã đầy, xếp vào ghế khán giả 1-5
    if (!foundPlayerSeat) {
      let foundViewerSeat = false;
      for (let s = 1; s <= GAME_CONFIG.MAX_VIEWERS; s++) {
        if (!viewerSeatsTaken.has(s as any)) {
          nextSeat = s as any;
          assignedRole = 'viewer';
          foundViewerSeat = true;
          break;
        }
      }
      if (!foundViewerSeat) {
        return { ok: false, error: `Phòng đã đầy (tối đa ${GAME_CONFIG.MAX_PLAYERS} thí sinh và ${GAME_CONFIG.MAX_VIEWERS} khán giả).` };
      }
    }

    const cleanName = sanitizePlayerName(name);
    if (!cleanName) {
      return { ok: false, error: 'Tên không hợp lệ.' };
    }

    const newPlayer: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      avatar: sanitizeAvatarSeed(avatar),
      seat: nextSeat,
      role: assignedRole,
      token,
      connected: true,
      ready: false,
      eliminatedVcnv: false,
      starUsed: false,
      score: 0,
      roundScores: { kd: 0, vcnv: 0, tt: 0, vd: 0 },
    };

    this.room.players.push(newPlayer);
    this.persistSnapshot();
    this.syncRoom();
    return { ok: true, player: newPlayer };
  }

  /** Đổi ảnh đại diện (chỉ ở Sảnh chờ). */
  public setAvatar(playerId: string, avatar: unknown): void {
    if (this.room.status !== 'LOBBY') return;
    const player = this.room.players.find((p) => p.id === playerId);
    const seed = sanitizeAvatarSeed(avatar);
    if (!player || !seed || player.avatar === seed) return;
    player.avatar = seed;
    this.persistSnapshot();
    this.syncRoom();
  }

  public switchSeat(
    playerId: string,
    targetRole: 'player' | 'viewer',
    targetSeat: number
  ): { ok: boolean; error?: string } {
    if (this.room.status !== 'LOBBY') {
      return { ok: false, error: 'Chỉ có thể đổi vị trí/vai trò ở Sảnh chờ.' };
    }

    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) {
      return { ok: false, error: 'Không tìm thấy thông tin người chơi.' };
    }

    if (targetRole !== 'player' && targetRole !== 'viewer') {
      return { ok: false, error: 'Vai trò không hợp lệ.' };
    }

    const maxSeat = targetRole === 'viewer' ? GAME_CONFIG.MAX_VIEWERS : GAME_CONFIG.MAX_PLAYERS;
    if (!Number.isInteger(targetSeat) || targetSeat < 1 || targetSeat > maxSeat) {
      return { ok: false, error: `Vị trí ghế không hợp lệ (1-${maxSeat}).` };
    }

    // Kiểm tra xem vị trí ghế đích đã có người khác ngồi hay chưa
    const isTaken = this.room.players.some(
      (p) =>
        p.id !== playerId &&
        (p.role || 'player') === targetRole &&
        p.seat === targetSeat
    );

    if (isTaken) {
      return { ok: false, error: 'Vị trí ghế này đã có người ngồi.' };
    }

    // Cập nhật vị trí ghế và vai trò
    player.role = targetRole;
    player.seat = targetSeat;

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
    this.syncRoom();

    return { ok: true };
  }

  public handleDisconnect(playerId: string): void {
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.connected = false;
    player.disconnectedAt = Date.now();

    // Chủ phòng mất kết nối (vd. bấm F5, đổi mạng): giữ quyền trong DISCONNECT_HOLD_SECONDS,
    // chỉ chuyển cho người khác nếu quá thời gian đó vẫn chưa vào lại.
    if (this.room.hostId === player.id) {
      this.scheduleHostTransfer(player.id);
    }

    // VCNV: người đang chọn hàng mất kết nối -> pha này không đếm giờ nên phải chuyển lượt ngay
    if (
      this.room.state.round === 'VCNV' &&
      this.room.state.subPhase === 'PICK_ROW' &&
      this.room.state.activePlayerId === player.id
    ) {
      this.eventQueue.enqueue(async () => {
        await this.promptVcnvPickRow(this.room.state.stepIndex || 0);
      });
    }

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
    this.syncRoom();
  }

  private clearHostTransferTimer(): void {
    if (this.hostTransferTimer) {
      clearTimeout(this.hostTransferTimer);
      this.hostTransferTimer = null;
    }
  }

  private scheduleHostTransfer(hostId: string): void {
    this.clearHostTransferTimer();
    const holdMs = GAME_CONFIG.DISCONNECT_HOLD_SECONDS * 1000;
    this.hostTransferTimer = setTimeout(() => {
      this.hostTransferTimer = null;
      this.eventQueue.enqueue(async () => {
        this.transferHostIfAbsent(hostId);
      });
    }, holdMs);
    this.hostTransferTimer.unref?.();
  }

  /** Chuyển quyền chủ phòng nếu chủ phòng hiện tại vẫn vắng mặt. Trả true nếu đã chuyển. */
  private transferHostIfAbsent(hostId: string): boolean {
    if (this.room.hostId !== hostId) return false;
    const host = this.room.players.find((p) => p.id === hostId);
    if (host?.connected) return false;

    const nextHost = this.room.players.find((p) => p.connected && p.id !== hostId);
    if (!nextHost) return false;

    this.room.hostId = nextHost.id;
    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
    this.syncRoom();
    return true;
  }

  public handleReconnect(token: string): { ok: boolean; player?: Player; error?: string } {
    if (!token) {
      return { ok: false, error: 'Token không hợp lệ hoặc người chơi không tồn tại.' };
    }
    const player = this.room.players.find((p) => p.token === token);
    if (!player) {
      return { ok: false, error: 'Token không hợp lệ hoặc người chơi không tồn tại.' };
    }

    player.connected = true;
    player.disconnectedAt = undefined;

    if (this.room.hostId === player.id) {
      // Chủ phòng đã quay lại kịp: hủy việc chuyển quyền
      this.clearHostTransferTimer();
    } else {
      // Chủ phòng vắng quá lâu mà lúc đó không có ai để nhận quyền -> giao cho người vừa vào lại
      const host = this.room.players.find((p) => p.id === this.room.hostId);
      const holdMs = GAME_CONFIG.DISCONNECT_HOLD_SECONDS * 1000;
      if (!host || (!host.connected && Date.now() - (host.disconnectedAt || 0) >= holdMs)) {
        this.room.hostId = player.id;
        this.clearHostTransferTimer();
      }
    }

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
    this.syncRoom();
    return { ok: true, player };
  }

  public setPlayerReady(playerId: string, mediaLoaded: boolean): void {
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.ready = true;
    player.mediaLoaded = mediaLoaded;

    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));

    // If in READY screen, check if all connected contestants (not viewers) are ready
    if (this.room.state.round === 'READY') {
      const connectedContestants = this.room.players.filter(
        (p) => p.connected && p.role !== 'viewer' && !p.disqualified
      );
      const allReady =
        connectedContestants.length > 0 && connectedContestants.every((p) => p.ready);
      if (allReady && this.room.state.subPhase === 'WAITING_READY') {
        this.startReadyCountdown();
      }
    }
  }

  public skipAbsentPlayer(hostId: string, absentPlayerId: string): void {
    if (this.room.hostId !== hostId) return;
    const player = this.room.players.find((p) => p.id === absentPlayerId);
    if (!player) return;

    // Mark as ready or eliminate from current phase
    player.ready = true;
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));

    if (this.room.state.round === 'READY') {
      const activeContestants = this.room.players.filter(
        (p) => (p.connected || p.ready) && p.role !== 'viewer' && !p.disqualified
      );
      const allReady = activeContestants.length > 0 && activeContestants.every((p) => p.ready);
      if (allReady && this.room.state.subPhase === 'WAITING_READY') {
        this.startReadyCountdown();
      }
      return;
    }

    if (
      this.room.state.round === 'VE_DICH' &&
      (this.veDichActiveContestantId === absentPlayerId || this.room.state.activePlayerId === absentPlayerId)
    ) {
      this.clearTimer();
      this.veDichCompletedPlayerIds.add(absentPlayerId);
      this.eventQueue.enqueue(async () => {
        await this.runVeDichTurn(this.veDichCurrentTurnIndex + 1);
      });
      return;
    }

    // VCNV: người tới lượt chọn hàng vắng mặt / không chọn -> chuyển quyền chọn cho người kế tiếp
    if (
      this.room.state.round === 'VCNV' &&
      this.room.state.subPhase === 'PICK_ROW' &&
      this.room.state.activePlayerId === absentPlayerId
    ) {
      this.eventQueue.enqueue(async () => {
        await this.promptVcnvPickRow(this.room.state.stepIndex || 0, absentPlayerId);
      });
      return;
    }
  }

  public kickPlayer(hostId: string, targetPlayerId: string): boolean {
    if (this.room.hostId !== hostId) return false;
    if (hostId === targetPlayerId) return false;

    const idx = this.room.players.findIndex((p) => p.id === targetPlayerId);
    if (idx === -1) return false;

    this.room.players.splice(idx, 1);
    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
    this.syncRoom();
    return true;
  }

  // --- Chống gian lận: rời tab ---

  /**
   * Thí sinh rời tab/cửa sổ trò chơi trong lúc thi.
   * Lần 1, 2: cảnh cáo. Từ lần 3: mỗi lần trừ PENALTY_POINTS điểm (xem GAME_CONFIG.ANTI_CHEAT).
   * Chỉ tự loại khỏi trận nếu bật DISQUALIFY_AT_VIOLATION.
   */
  public reportTabLeave(playerId: string, reason: TabLeaveReason): AntiCheatAlert | null {
    const cfg = GAME_CONFIG.ANTI_CHEAT;
    if (!cfg.ENABLED) return null;

    const player = this.room.players.find((p) => p.id === playerId);
    if (!player || player.role === 'viewer' || player.disqualified) return null;

    const round = this.room.state.round;
    if (!cfg.ACTIVE_ROUNDS.includes(round)) return null;
    // Chỉ tính khi câu hỏi đang mở; lúc công bố, chọn gói... rời tab không bị phạt
    if (!cfg.ACTIVE_SUB_PHASES.includes(this.room.state.subPhase)) return null;

    const now = Date.now();
    const last = this.lastTabLeaveAt.get(playerId);
    if (last && now - last < cfg.DEDUPE_MS) return null;
    this.lastTabLeaveAt.set(playerId, now);

    player.tabLeaveCount = (player.tabLeaveCount || 0) + 1;
    const count = player.tabLeaveCount;
    const disqualified = cfg.DISQUALIFY_AT_VIOLATION > 0 && count >= cfg.DISQUALIFY_AT_VIOLATION;
    const penalty = !disqualified && count >= cfg.PENALTY_FROM_VIOLATION ? cfg.PENALTY_POINTS : 0;
    const questionId = this.room.state.currentQuestion?.id || '';

    if (penalty > 0) {
      // Trừ điểm (ghi vào biên bản CSV và cập nhật bảng điểm cho cả phòng)
      this.addScore(playerId, round, questionId, -penalty, 'tab_leave_penalty');
    } else {
      // Chỉ ghi biên bản, không đổi điểm
      this.room.history.push({
        id: `cheat-${now}-${Math.random().toString(36).substring(2, 6)}`,
        round,
        questionId,
        playerId,
        delta: 0,
        reason: disqualified ? 'tab_leave_disqualified' : 'tab_leave_warning',
        at: now,
      });
    }

    const alert: AntiCheatAlert = {
      playerId,
      playerName: player.name,
      count,
      penalty,
      disqualified,
      reason: reason === 'hidden' ? 'hidden' : 'blur',
      round,
      at: now,
    };
    this.callbacks.broadcastAntiCheat?.(alert);

    if (disqualified) {
      // Còn tối đa 1 người thi (hoặc 1 người trong câu hỏi phụ) thì kết thúc trận luôn, không chơi tiếp
      const early = this.getEarlyFinishOutcome(player.id);
      if (early) {
        player.disqualified = true;
        player.eliminatedVcnv = true;
        this.clearTimer();
        this.eventQueue.enqueue(async () => {
          await this.finishGame(early.winnerId, early.reason);
        });
      } else {
        this.disqualifyPlayer(player);
      }
    }

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
    this.syncRoom();
    return alert;
  }

  /**
   * Trận có phải kết thúc sớm không nếu thêm `newlyDisqualifiedId` bị loại.
   * - Không còn ai: kết thúc, không có người thắng.
   * - Còn đúng 1 người: người đó thắng luôn.
   * - Đang câu hỏi phụ mà chỉ còn 1 (hoặc 0) người trong nhóm bằng điểm: tương tự.
   */
  private getEarlyFinishOutcome(
    newlyDisqualifiedId: string
  ): { winnerId?: string; reason?: 'LAST_STANDING' | 'ALL_DISQUALIFIED' } | null {
    const stillIn = (id: string) => {
      const p = this.room.players.find((pl) => pl.id === id);
      return Boolean(p && (p.role || 'player') === 'player' && !p.disqualified && p.id !== newlyDisqualifiedId);
    };

    const remaining = this.room.players.filter((p) => stillIn(p.id)).map((p) => p.id);
    if (remaining.length === 0) return { reason: 'ALL_DISQUALIFIED' };
    if (remaining.length === 1) return { winnerId: remaining[0], reason: 'LAST_STANDING' };

    if (this.room.state.round === 'TIEBREAK') {
      const tied: string[] = (this.room.state.eligiblePlayerIds || []).filter(stillIn);
      if (tied.length === 1) return { winnerId: tied[0], reason: 'LAST_STANDING' };
      if (tied.length === 0) {
        // Cả nhóm bằng điểm bị loại -> người điểm cao nhất trong số còn lại thắng
        const best = this.room.players
          .filter((p) => remaining.includes(p.id))
          .sort((a, b) => b.score - a.score || a.seat - b.seat)[0];
        return { winnerId: best.id };
      }
    }
    return null;
  }

  private disqualifyPlayer(player: Player): void {
    player.disqualified = true;
    player.eliminatedVcnv = true;

    const state = this.room.state;
    const holdsTurn = state.activePlayerId === player.id || state.buzzerLockedBy === player.id;
    if (!holdsTurn) return;

    // VCNV: đang tới lượt chọn hàng (pha này không đếm giờ) -> chuyển quyền chọn cho người khác
    if (state.round === 'VCNV' && state.subPhase === 'PICK_ROW') {
      this.eventQueue.enqueue(async () => {
        await this.promptVcnvPickRow(this.room.state.stepIndex || 0);
      });
      return;
    }

    // Đang giữ lượt trả lời / chọn gói -> kết thúc ngay như hết giờ (không để cả phòng chờ)
    const fastForwardPhases = [
      'CHOOSE_PACKAGE',
      'STAR_DECISION',
      'QUESTION',
      'ANSWERING',
      'CNV_ANSWERING',
      'FINAL_GUESS_ANSWERING',
      'STEAL_ANSWER',
    ];
    if (fastForwardPhases.includes(state.subPhase)) {
      this.expireNow();
    }
  }

  // --- Score Ledger ---

  private addScore(
    playerId: string,
    round: RoundType,
    questionId: string,
    delta: number,
    reason: string
  ): void {
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.score += delta;
    if (round === 'KD_RIENG' || round === 'KD_CHUNG') {
      player.roundScores.kd += delta;
    } else if (round === 'VCNV') {
      player.roundScores.vcnv += delta;
    } else if (round === 'TANG_TOC') {
      player.roundScores.tt += delta;
    } else if (round === 'VE_DICH') {
      player.roundScores.vd += delta;
    }

    const event: ScoreEvent = {
      id: `score-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      round,
      questionId,
      playerId,
      delta,
      reason,
      at: Date.now(),
    };

    this.room.history.push(event);

    const scores: Record<string, number> = {};
    for (const p of this.room.players) {
      scores[p.id] = p.score;
    }

    this.callbacks.broadcastScoreUpdate({ scores, lastEvents: [event] });
  }

  public overrideScore(
    hostId: string,
    questionId: string,
    playerId: string,
    isCorrect: boolean
  ): boolean {
    if (this.room.hostId !== hostId) return false;
    // Chủ phòng cũng là thí sinh: không được tự sửa kết quả của chính mình
    if (hostId === playerId) return false;
    if (!this.lastRevealedPayload || this.lastRevealedPayload.questionId !== questionId) {
      return false;
    }

    const expiresAt = this.lastRevealedPayload.overrideWindowExpiresAt || 0;
    if (Date.now() > expiresAt) {
      return false;
    }

    const result = this.lastRevealedPayload.results.find((r) => r.playerId === playerId);
    if (!result) return false;

    if (result.isCorrect === isCorrect) return true; // unchanged

    // Revert old score change
    const oldDelta = result.delta;
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return false;

    // Tính điểm mới theo luật của vòng chứa câu hỏi đó (không phải vòng hiện tại: câu cuối của vòng
    // có thể đã chuyển sang màn READY trong lúc còn thời gian sửa).
    // Chỉ các vòng có overrideWindowExpiresAt mới tới được đây: KD_RIENG, KD_CHUNG, TANG_TOC.
    const round = this.lastRevealRound;
    let newDelta: number;

    if (round === 'KD_RIENG') {
      newDelta = isCorrect ? GAME_CONFIG.KHOI_DONG.RIENG_CORRECT_POINTS : 0;
    } else if (round === 'KD_CHUNG') {
      newDelta = isCorrect
        ? GAME_CONFIG.KHOI_DONG.CHUNG_CORRECT_POINTS
        : GAME_CONFIG.KHOI_DONG.CHUNG_WRONG_OR_TIMEOUT_POINTS;
    } else if (round === 'TANG_TOC') {
      if (isCorrect && !result.answer) return false; // Không nộp gì thì không thể chấm đúng
      newDelta = isCorrect ? this.tangTocPointsForOverride(result.playerId) : 0;
    } else {
      return false;
    }

    const netAdjustment = newDelta - oldDelta;
    result.isCorrect = isCorrect;
    result.delta = newDelta;

    this.addScore(playerId, round, questionId, netAdjustment, 'host_override');
    this.persistSnapshot();
    this.syncRoom();
    return true;
  }

  /** Điểm Tăng tốc theo thứ hạng thời gian của người được sửa thành đúng (giữ nguyên điểm người khác). */
  private tangTocPointsForOverride(playerId: string): number {
    const results = this.lastRevealedPayload?.results || [];
    const me = results.find((r) => r.playerId === playerId);
    const myMs = (me?.timeSec || 0) * 1000;
    const tieMs = GAME_CONFIG.TANG_TOC.TIE_THRESHOLD_MS;
    const fasterCorrect = results.filter(
      (r) => r.playerId !== playerId && r.isCorrect && (r.timeSec || 0) * 1000 < myMs - tieMs
    ).length;
    const ranks = GAME_CONFIG.TANG_TOC.POINTS_BY_RANK;
    return ranks[fasterCorrect] ?? ranks[ranks.length - 1];
  }

  // --- Dev / Test shortcut: Tua nhanh vòng tới màn hình chuẩn bị sẵn sàng ---
  public jumpToRound(hostId: string, targetRound: string = 'VCNV'): boolean {
    if (this.room.hostId !== hostId) return false;
    this.clearTimer();
    this.answersMap.clear();
    this.buzzedPlayerId = null;
    this.eventQueue.enqueue(async () => {
      let nextRound: RoundType = 'VCNV';
      const normalized = (targetRound || '').toUpperCase();
      if (
        normalized === 'KD_RIENG' ||
        normalized === 'KHOI_DONG' ||
        normalized === 'KD' ||
        normalized === 'V1'
      ) {
        nextRound = 'KD_RIENG';
      } else if (normalized === 'VCNV' || normalized === 'V2') {
        nextRound = 'VCNV';
      } else if (normalized === 'TANG_TOC' || normalized === 'TT' || normalized === 'V3') {
        nextRound = 'TANG_TOC';
      } else if (normalized === 'VE_DICH' || normalized === 'VD' || normalized === 'V4') {
        nextRound = 'VE_DICH';
      } else {
        nextRound = 'VCNV';
      }
      this.transitionToReady(nextRound);
    });
    return true;
  }

  public forceStartReadyRound(hostId: string): boolean {
    if (this.room.hostId !== hostId) return false;
    if (this.room.state.round === 'READY' && this.room.state.subPhase === 'WAITING_READY') {
      for (const p of this.room.players) {
        if (p.connected) p.ready = true;
      }
      this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
      this.startReadyCountdown();
      return true;
    }
    return false;
  }

  // --- Flow & Transitions ---

  public setQuestionComposer(composer: (() => ComposeResult) | null): void {
    this.questionComposer = composer;
  }

  /** Ghép đề ngẫu nhiên từ kho (nếu chủ phòng không tự tải bộ đề). Lỗi kho thì dùng bộ đề mặc định. */
  private prepareQuestionSet(): void {
    if (this.customQuestionSet || !this.questionComposer) return;
    const result = this.questionComposer();
    if (result.ok) {
      this.setQuestionSet(result.questionSet, 'bank');
      console.log(`[Room ${this.room.code}] Đã ghép bộ đề ngẫu nhiên ${result.questionSet.id}.`);
    } else {
      console.error(`[Room ${this.room.code}] Không ghép được đề từ kho, dùng bộ đề mặc định. ${result.error}`);
    }
  }

  public startGame(hostId: string): { ok: boolean; error?: string } {
    if (this.room.hostId !== hostId) {
      return { ok: false, error: 'Chỉ chủ phòng mới có quyền bắt đầu.' };
    }
    // Chỉ bắt đầu từ Sảnh chờ: bấm lại giữa trận sẽ làm đổi cả bộ đề đang chơi
    if (this.room.status !== 'LOBBY') {
      return { ok: false, error: 'Trận đấu đã bắt đầu.' };
    }

    const connectedContestants = this.room.players.filter(
      (p) => p.connected && p.role !== 'viewer'
    );
    if (connectedContestants.length < GAME_CONFIG.MIN_PLAYERS_FOR_TEST) {
      return { ok: false, error: `Cần tối thiểu ${GAME_CONFIG.MIN_PLAYERS_FOR_TEST} thí sinh để bắt đầu.` };
    }

    this.prepareQuestionSet();
    this.transitionToReady('KD_RIENG');
    return { ok: true };
  }

  /**
   * Trạng thái "bị loại khỏi VCNV" chỉ có ý nghĩa trong vòng VCNV: hết vòng thì xóa, để vòng sau
   * không còn hiện nhãn "Bị loại". Người bị loại vì rời tab thì giữ nguyên (có nhãn riêng).
   */
  private clearVcnvElimination(): void {
    let changed = false;
    for (const p of this.room.players) {
      const keep = Boolean(p.disqualified);
      if (p.eliminatedVcnv !== keep) {
        p.eliminatedVcnv = keep;
        changed = true;
      }
    }
    if (changed) this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
  }

  private transitionToReady(targetRound: RoundType): void {
    if (targetRound !== 'VCNV') this.clearVcnvElimination();
    this.clearTimer();
    this.buzzedPlayerId = null;
    this.room.status = 'READY';
    this.room.state = {
      round: 'READY',
      targetRound,
      subPhase: 'WAITING_READY',
      deadline: null,
      buzzerLockedBy: null,
      activePlayerId: undefined,
    };

    // Reset players ready status
    for (const p of this.room.players) {
      p.ready = false;
      p.mediaLoaded = false;
    }

    this.persistSnapshot();
    this.syncRoom();
  }

  /**
   * Màn công bố điểm sau mỗi vòng: tên thí sinh lần lượt bay vào từ điểm thấp tới cao, giữ một lúc rồi
   * mờ dần. Server giữ nhịp (deadline) để mọi máy chuyển màn cùng lúc; client tự chạy hiệu ứng theo startedAt.
   */
  private showRoundResults(finishedRound: RoundType, next: RoundType | 'FINAL'): void {
    if (finishedRound === 'VCNV') this.clearVcnvElimination();
    this.clearTimer();
    this.buzzedPlayerId = null;
    this.answersMap.clear();

    const roundKey: Partial<Record<RoundType, keyof Player['roundScores']>> = {
      KD_RIENG: 'kd',
      KD_CHUNG: 'kd',
      VCNV: 'vcnv',
      TANG_TOC: 'tt',
      VE_DICH: 'vd',
    };
    const key = roundKey[finishedRound];
    const contestants = this.room.players.filter((p) => (p.role || 'player') === 'player');

    // Hạng tính trên thí sinh còn thi (bị loại xếp cuối); bằng điểm thì cùng hạng
    const ranked = contestants
      .filter((p) => !p.disqualified)
      .map((p) => p.score)
      .sort((a, b) => b - a);
    const rankOf = (p: Player) =>
      p.disqualified ? ranked.length + 1 : ranked.indexOf(p.score) + 1;

    const entries: RoundResultEntry[] = contestants
      .map((p) => ({
        playerId: p.id,
        name: p.name,
        seat: p.seat,
        score: p.score,
        roundScore: key ? p.roundScores[key] : 0,
        rank: rankOf(p),
        disqualified: Boolean(p.disqualified),
      }))
      // Thứ tự xuất hiện: bị loại trước, rồi điểm thấp -> cao; bằng điểm thì ghế nhỏ xuất hiện sau (đứng trên)
      .sort(
        (a, b) =>
          Number(b.disqualified) - Number(a.disqualified) || a.score - b.score || b.seat - a.seat
      );

    const cfg = GAME_CONFIG.ROUND_RESULTS;
    const durationMs =
      cfg.START_DELAY_MS +
      Math.max(0, entries.length - 1) * cfg.STAGGER_MS +
      cfg.ENTRY_MS +
      cfg.HOLD_MS +
      cfg.FADE_MS;

    this.room.status = 'ROUND_RESULTS';
    this.room.state = {
      round: 'ROUND_RESULTS',
      subPhase: 'REVEALING',
      deadline: null,
      buzzerLockedBy: null,
      roundResults: {
        finishedRound,
        nextRound: next,
        startedAt: Date.now(),
        entries,
      },
    };

    this.setDeadline(durationMs, async () => {
      if (next === 'FINAL') {
        await this.checkFinishOrTiebreak();
      } else {
        this.transitionToReady(next);
      }
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  private startReadyCountdown(): void {
    this.room.state.subPhase = 'COUNTDOWN';
    const countdownSec = GAME_CONFIG.READY_COUNTDOWN_SECONDS;
    this.setDeadline(countdownSec * 1000, async () => {
      const target = this.room.state.targetRound;
      if (target === 'KD_RIENG') {
        await this.startKhoiDongRieng();
      } else if (target === 'VCNV') {
        await this.startVcnv();
      } else if (target === 'TANG_TOC') {
        await this.startTangToc();
      } else if (target === 'VE_DICH') {
        await this.startVeDich();
      } else if (target === 'TIEBREAK') {
        await this.checkFinishOrTiebreak();
      }
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  // ==========================================
  // VÒNG 1: KHỞI ĐỘNG
  // ==========================================

  private getKdPackagesList() {
    // Tối đa 5 ô; chỉ hiện các gói có câu hỏi (bộ đề có thể chỉ soạn cho 4 thí sinh)
    const totalBoxes = 5;
    const result = [];
    for (let i = 0; i < totalBoxes; i++) {
      const questionCount = (this.questionSet.khoiDong.rieng[i] || []).length;
      if (questionCount === 0) continue;
      let chosenByPlayerId: string | undefined;
      let chosenByName: string | undefined;
      for (const [pId, pIdx] of this.chosenKdPackages.entries()) {
        if (pIdx === i) {
          chosenByPlayerId = pId;
          const p = this.room.players.find((pl) => pl.id === pId);
          chosenByName = p?.name;
          break;
        }
      }
      result.push({
        index: i,
        name: `Ô số ${i + 1}`,
        count: questionCount,
        chosenBy: chosenByPlayerId,
        chosenByName,
      });
    }
    return result;
  }

  public chooseKdPackage(playerId: string, packageIndex: number): boolean {
    if (this.room.status !== 'KD_RIENG') return false;
    if (this.room.state.subPhase !== 'CHOOSE_PACKAGE') return false;
    if (this.room.state.activePlayerId !== playerId) return false;

    const packages = this.getKdPackagesList();
    const pkg = packages.find((p) => p.index === packageIndex);
    if (!pkg || pkg.chosenBy) {
      return false; // Already chosen or invalid
    }

    this.clearTimer();
    this.eventQueue.enqueue(async () => {
      const players = [...this.room.players].filter((p) => p.role !== 'viewer').sort((a, b) => a.seat - b.seat);
      const playerIdx = players.findIndex((p) => p.id === playerId);
      if (playerIdx === -1) return;
      await this.applyKdPackageChoice(players, playerIdx, packageIndex);
    });
    return true;
  }

  private async promptKdChoosePackage(
    players: Player[],
    playerIndex: number
  ): Promise<void> {
    const currentPlayer = players[playerIndex];
    const packages = this.getKdPackagesList();

    // Nhiều thí sinh hơn số gói có câu hỏi: không còn ô trống để chọn -> dùng lại gói đầu tiên luôn
    if (packages.length > 0 && packages.every((p) => p.chosenBy)) {
      await this.applyKdPackageChoice(players, playerIndex, packages[0].index);
      return;
    }

    this.room.state = {
      round: 'KD_RIENG',
      subPhase: 'CHOOSE_PACKAGE',
      activePlayerId: currentPlayer.id,
      deadline: Date.now() + 10000,
      kdPackages: packages,
    };
    this.persistSnapshot();
    this.syncRoom();

    this.setDeadline(10000, async () => {
      const currentPkgs = this.getKdPackagesList();
      const unchosen = currentPkgs.find((p) => !p.chosenBy);
      const pickIdx = unchosen ? unchosen.index : currentPkgs[0]?.index ?? 0;
      await this.applyKdPackageChoice(players, playerIndex, pickIdx);
    });
  }

  private async applyKdPackageChoice(
    players: Player[],
    playerIndex: number,
    packageIndex: number
  ): Promise<void> {
    const currentPlayer = players[playerIndex];
    this.chosenKdPackages.set(currentPlayer.id, packageIndex);
    const packages = this.getKdPackagesList();

    // Show confirmed choice for 2.5s
    this.room.state = {
      round: 'KD_RIENG',
      subPhase: 'PACKAGE_CONFIRMED',
      activePlayerId: currentPlayer.id,
      deadline: Date.now() + 2500,
      kdPackages: packages,
      kdChosenPackageIndex: packageIndex,
    };
    this.persistSnapshot();
    this.syncRoom();

    this.setDeadline(2500, async () => {
      await this.presentKdRiengQuestion(players, playerIndex, 0);
    });
  }

  private async startKhoiDongRieng(): Promise<void> {
    this.room.status = 'KD_RIENG';
    this.chosenKdPackages.clear();
    const playersInOrder = [...this.room.players].filter((p) => p.role !== 'viewer').sort((a, b) => a.seat - b.seat);
    await this.runKhoiDongRiengTurn(playersInOrder, 0, 0);
  }

  private async runKhoiDongRiengTurn(
    players: Player[],
    playerIndex: number,
    questionIndex: number
  ): Promise<void> {
    if (playerIndex >= players.length) {
      // Done all private turns -> proceed to KD_CHUNG
      await this.startKhoiDongChung();
      return;
    }

    const currentPlayer = players[playerIndex];
    if (currentPlayer.disqualified) {
      await this.runKhoiDongRiengTurn(players, playerIndex + 1, 0);
      return;
    }
    const pkgIdx = this.chosenKdPackages.get(currentPlayer.id);

    // If player hasn't chosen package yet, prompt choice
    if (pkgIdx === undefined) {
      await this.promptKdChoosePackage(players, playerIndex);
      return;
    }

    const playerQuestions = this.questionSet.khoiDong.rieng[pkgIdx] || this.questionSet.khoiDong.rieng[0] || [];

    if (questionIndex >= GAME_CONFIG.KHOI_DONG.RIENG_QUESTIONS_PER_PLAYER || questionIndex >= playerQuestions.length) {
      // Move to next player
      await this.runKhoiDongRiengTurn(players, playerIndex + 1, 0);
      return;
    }

    await this.presentKdRiengQuestion(players, playerIndex, questionIndex);
  }

  private async presentKdRiengQuestion(
    players: Player[],
    playerIndex: number,
    questionIndex: number
  ): Promise<void> {
    const currentPlayer = players[playerIndex];
    const pkgIdx = this.chosenKdPackages.get(currentPlayer.id) ?? (currentPlayer.seat - 1);
    const playerQuestions = this.questionSet.khoiDong.rieng[pkgIdx] || this.questionSet.khoiDong.rieng[0] || [];
    const question = playerQuestions[questionIndex];

    if (!question || currentPlayer.disqualified) {
      await this.runKhoiDongRiengTurn(players, playerIndex + 1, 0);
      return;
    }

    this.answersMap.clear();
    this.room.state = {
      round: 'KD_RIENG',
      subPhase: 'QUESTION',
      activePlayerId: currentPlayer.id,
      deadline: null,
      currentQuestion: question,
      kdChosenPackageIndex: pkgIdx,
      questionIndex,
      activeAnswer: undefined,
    };

    const durationMs = GAME_CONFIG.KHOI_DONG.RIENG_TIME_SECONDS * 1000;
    this.setDeadline(durationMs, async () => {
      await this.revealKdRiengQuestion(players, playerIndex, questionIndex, question);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  public submitAnswer(playerId: string, questionId: string, answer: string): boolean {
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player || player.role === 'viewer' || player.disqualified) {
      return false;
    }

    const now = Date.now();
    const deadline = this.room.state.deadline;
    if (deadline && now > deadline + GAME_CONFIG.NETWORK_GRACE_MS) {
      return false; // Submission rejected due to deadline expired
    }

    const currentQ = this.room.state.currentQuestion;
    if (!currentQ || currentQ.id !== questionId) {
      return false;
    }

    const round = this.room.state.round;
    const subPhase = this.room.state.subPhase;

    if (round === 'KD_RIENG') {
      // Chỉ nhận đáp án khi câu hỏi đang mở. Ở pha REVEAL đáp án đúng đã hiện, nhận thêm là gian lận.
      if (subPhase !== 'QUESTION') return false;
      if (this.room.state.activePlayerId !== playerId) return false;
      // Single choice, lock immediately
      if (!this.answersMap.has(playerId)) {
        this.answersMap.set(playerId, { answer, timestamp: now });
        this.callbacks.emitAnswerAck(playerId, { questionId, receivedAt: now });
        this.room.state.activeAnswer = answer;
        this.persistSnapshot();
        this.syncRoom();
        // Immediately trigger reveal early since choice is locked
        this.clearTimer();
        this.eventQueue.enqueue(async () => {
          const players = [...this.room.players].filter((p) => p.role !== 'viewer').sort((a, b) => a.seat - b.seat);
          const activeIdx = players.findIndex((p) => p.id === playerId);
          const pkgIdx = this.chosenKdPackages.get(playerId) ?? (players[activeIdx].seat - 1);
          const questionsInPkg = this.questionSet.khoiDong.rieng[pkgIdx] || [];
          const qIdx = questionsInPkg.findIndex((q) => q.id === questionId);
          const currentQuestionIndex = typeof this.room.state.questionIndex === 'number' ? this.room.state.questionIndex : (qIdx >= 0 ? qIdx : 0);
          const fullQuestion = questionsInPkg[currentQuestionIndex] || questionsInPkg[0];
          await this.revealKdRiengQuestion(players, activeIdx, currentQuestionIndex, fullQuestion);
        });
        return true;
      }
      return false;
    }

    if (round === 'KD_CHUNG') {
      if (subPhase !== 'ANSWERING' || this.room.state.activePlayerId !== playerId) {
        return false;
      }
      if (!this.answersMap.has(playerId)) {
        this.answersMap.set(playerId, { answer, timestamp: now });
        this.callbacks.emitAnswerAck(playerId, { questionId, receivedAt: now });
        this.clearTimer();
        this.eventQueue.enqueue(async () => {
          await this.finishKdChungAnswer(questionId);
        });
        return true;
      }
      return false;
    }

    if (round === 'VCNV') {
      const player = this.room.players.find((p) => p.id === playerId);
      if (!player || player.eliminatedVcnv) return false;

      // Chỉ câu hàng ngang nhận đáp án. Câu ô trung tâm chỉ là gợi ý để đoán từ khóa (bấm chuông).
      if (subPhase === 'ROW_QUESTION') {
        // Can overwrite until deadline
        this.answersMap.set(playerId, { answer, timestamp: now });
        this.callbacks.emitAnswerAck(playerId, { questionId, receivedAt: now });
        return true;
      }

      if (subPhase === 'CNV_ANSWERING' || subPhase === 'FINAL_GUESS_ANSWERING') {
        if (this.room.state.activePlayerId !== playerId) return false;
        if (!this.answersMap.has(playerId)) {
          this.answersMap.set(playerId, { answer, timestamp: now });
          this.callbacks.emitAnswerAck(playerId, { questionId, receivedAt: now });
          this.clearTimer();
          this.eventQueue.enqueue(async () => {
            await this.evaluateCnvGuess(playerId, answer);
          });
          return true;
        }
      }
      return false;
    }

    if (round === 'TANG_TOC') {
      if (subPhase !== 'QUESTION') return false;
      // Overwrite until deadline
      this.answersMap.set(playerId, { answer, timestamp: now });
      this.callbacks.emitAnswerAck(playerId, { questionId, receivedAt: now });
      return true;
    }

    if (round === 'VE_DICH') {
      if (subPhase === 'QUESTION' && this.room.state.activePlayerId === playerId) {
        // Active player can overwrite answer
        this.answersMap.set(playerId, { answer, timestamp: now });
        this.callbacks.emitAnswerAck(playerId, { questionId, receivedAt: now });
        return true;
      }
      if (subPhase === 'STEAL_ANSWER' && this.room.state.activePlayerId === playerId) {
        // Stealer: first submission only!
        if (!this.answersMap.has(playerId)) {
          this.answersMap.set(playerId, { answer, timestamp: now });
          this.callbacks.emitAnswerAck(playerId, { questionId, receivedAt: now });
          this.clearTimer();
          this.eventQueue.enqueue(async () => {
            await this.evaluateVeDichSteal(playerId, answer);
          });
          return true;
        }
      }
      return false;
    }

    if (round === 'TIEBREAK') {
      if (subPhase === 'ANSWERING' && this.room.state.activePlayerId === playerId) {
        if (!this.answersMap.has(playerId)) {
          this.answersMap.set(playerId, { answer, timestamp: now });
          this.callbacks.emitAnswerAck(playerId, { questionId, receivedAt: now });
          this.clearTimer();
          this.eventQueue.enqueue(async () => {
            await this.evaluateTiebreakAnswer(playerId, answer);
          });
          return true;
        }
      }
      return false;
    }

    return false;
  }

  private async revealKdRiengQuestion(
    players: Player[],
    playerIndex: number,
    questionIndex: number,
    question: Question
  ): Promise<void> {
    const currentPlayer = players[playerIndex];
    const submission = this.answersMap.get(currentPlayer.id);
    const playerAns = submission ? submission.answer : '';
    const isCorrect = matchAnswer(playerAns, question.answer, question.alternatives, {
      ignoreDiacritics: question.ignoreDiacritics,
    });

    const delta = isCorrect ? GAME_CONFIG.KHOI_DONG.RIENG_CORRECT_POINTS : 0;
    if (delta > 0) {
      this.addScore(currentPlayer.id, 'KD_RIENG', question.id, delta, 'correct');
    }

    const results: RevealResult[] = [
      {
        playerId: currentPlayer.id,
        answer: playerAns,
        isCorrect,
        delta,
      },
    ];

    const revealPayload: RevealPayload = {
      questionId: question.id,
      correctAnswer: question.answer,
      results,
      overrideWindowExpiresAt: Date.now() + GAME_CONFIG.HOST_OVERRIDE_WINDOW_SECONDS * 1000,
    };
    this.lastRevealedPayload = revealPayload;
    this.lastRevealRound = this.room.state.round;

    const pkgIdx = this.chosenKdPackages.get(currentPlayer.id) ?? (currentPlayer.seat - 1);
    this.room.state = {
      round: 'KD_RIENG',
      subPhase: 'REVEAL',
      activePlayerId: currentPlayer.id,
      deadline: null,
      currentQuestion: question,
      kdChosenPackageIndex: pkgIdx,
      questionIndex,
      activeAnswer: playerAns,
    };

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();

    this.setDeadline(3000, async () => {
      await this.runKhoiDongRiengTurn(players, playerIndex, questionIndex + 1);
    });
  }

  // --- KD CHUNG ---

  private async startKhoiDongChung(): Promise<void> {
    this.room.status = 'KD_CHUNG';
    // Màn nhắc luật trước câu đầu: chuyển từ lượt riêng sang giành chuông, nhắc phím SPACE
    const introMs = GAME_CONFIG.KHOI_DONG.CHUNG_INTRO_SECONDS * 1000;
    this.buzzedPlayerId = null;
    this.room.state = {
      round: 'KD_CHUNG',
      subPhase: 'INTRO',
      deadline: null,
      buzzerLockedBy: null,
      activePlayerId: undefined,
    };
    this.setDeadline(introMs, async () => {
      await this.runKdChungQuestion(0);
    });
    this.persistSnapshot();
    this.syncRoom();
  }

  private async runKdChungQuestion(questionIndex: number): Promise<void> {
    const questions = this.questionSet.khoiDong.chung;
    if (questionIndex >= GAME_CONFIG.KHOI_DONG.CHUNG_QUESTIONS || questionIndex >= questions.length) {
      // Done Khởi động -> công bố điểm -> VCNV
      this.showRoundResults('KD_CHUNG', 'VCNV');
      return;
    }

    const question = questions[questionIndex];
    this.buzzedPlayerId = null;
    this.answersMap.clear();
    this.disqualifiedBuzzers.clear();
    // Chuông khóa BUZZ_LOCK_SECONDS đầu; thời gian giành chuông tính từ lúc mở khóa
    const lockMs = GAME_CONFIG.BUZZ_LOCK_SECONDS * 1000;
    const buzzUnlockAt = Date.now() + lockMs;
    this.buzzerOpenTime = buzzUnlockAt;

    this.room.state = {
      round: 'KD_CHUNG',
      subPhase: 'QUESTION_BUZZ',
      deadline: null,
      buzzUnlockAt,
      currentQuestion: question,
      buzzerLockedBy: null,
      activePlayerId: undefined,
    };

    const durationMs = lockMs + GAME_CONFIG.KHOI_DONG.CHUNG_BUZZ_SECONDS * 1000;
    this.setDeadline(durationMs, async () => {
      // Nobody buzzed
      await this.skipKdChungQuestion(questionIndex, question);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  /** Chuông còn đang khóa: báo riêng cho người bấm và bỏ qua lần bấm (không bị phạt). */
  private rejectIfBuzzLocked(playerId: string, now: number): boolean {
    const unlockAt = this.room.state.buzzUnlockAt;
    // Cho lệch đồng hồ tối đa 30ms giữa client và server
    if (typeof unlockAt === 'number' && now + 30 < unlockAt) {
      this.callbacks.broadcastBuzzRejected(playerId, { reason: 'Chuông đang bị khóa, chưa thể bấm!' });
      return true;
    }
    return false;
  }

  public handleBuzzer(playerId: string): boolean {
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player || player.role === 'viewer') {
      this.callbacks.broadcastBuzzRejected(playerId, { reason: 'Khán giả không thể bấm chuông.' });
      return false;
    }
    if (player.disqualified) return false;

    const now = Date.now();
    const round = this.room.state.round;
    const subPhase = this.room.state.subPhase;

    if (this.disqualifiedBuzzers.has(playerId)) {
      this.callbacks.broadcastBuzzRejected(playerId, { reason: 'Bạn đã bị mất quyền bấm chuông câu này.' });
      return false;
    }

    // KD_CHUNG Buzzer
    if (round === 'KD_CHUNG' && subPhase === 'QUESTION_BUZZ') {
      if (this.rejectIfBuzzLocked(playerId, now)) return false;
      if (this.buzzedPlayerId) return false;
      this.buzzedPlayerId = playerId;
      this.room.state.buzzerLockedBy = playerId;
      this.room.state.activePlayerId = playerId;
      this.room.state.subPhase = 'ANSWERING';

      const diffMs = now - this.buzzerOpenTime;
      const winner = this.room.players.find((p) => p.id === playerId);
      this.callbacks.broadcastBuzzWon({
        winnerId: playerId,
        winnerName: winner ? winner.name : 'Unknown',
        diffMs,
      });

      this.clearTimer();
      const ansDurationMs = GAME_CONFIG.KHOI_DONG.CHUNG_ANSWER_SECONDS * 1000;
      this.setDeadline(ansDurationMs, async () => {
        const currentQ = this.room.state.currentQuestion;
        if (currentQ) {
          await this.finishKdChungAnswer(currentQ.id);
        }
      });

      this.persistSnapshot();
      this.syncRoom();
      return true;
    }

    // VCNV Buzzer: Bấm chuông để trả lời từ khóa chính bất kì lúc nào
    if (round === 'VCNV') {
      const player = this.room.players.find((p) => p.id === playerId);
      if (!player || player.eliminatedVcnv) return false;
      if (this.buzzedPlayerId) return false; // Already locked
      if (this.room.state.obstacleSolved || subPhase === 'CNV_RESULT') return false;

      // Chuông Chướng ngại vật chỉ mở sau khi câu hỏi hàng ngang thứ 1 xuất hiện
      if (this.vcnvQuestionsAppearedCount < 1) {
        this.callbacks.broadcastBuzzRejected(playerId, {
          reason: 'Chuông Chướng ngại vật chỉ mở sau khi câu hỏi hàng ngang thứ 1 xuất hiện.',
        });
        return false;
      }

      // Đang có câu hàng ngang / ô trung tâm: dừng câu hỏi và hiện màn nhập từ khóa ngay.
      // Trả lời sai thì câu hỏi này chạy lại từ đầu (xem evaluateCnvGuess); trả lời đúng thì kết thúc vòng.
      this.vcnvInterrupted = null;
      if (subPhase === 'ROW_QUESTION') {
        this.vcnvInterrupted = {
          kind: 'ROW',
          rowIndex: this.room.state.activeRowIndex ?? this.vcnvCurrentRowIndex,
          stepIndex: this.room.state.stepIndex ?? 0,
        };
      } else if (subPhase === 'CENTER_QUESTION') {
        this.vcnvInterrupted = { kind: 'CENTER', rowIndex: -1, stepIndex: this.room.state.stepIndex ?? 0 };
      }

      // Các pha khác (chọn hàng, công bố, đoán cuối): cũng trả lời CNV ngay
      const isFinalGuess = subPhase === 'FINAL_GUESS';
      if (isFinalGuess) {
        // Tạm dừng 15s đoán cuối, lưu thời gian còn lại để chạy tiếp nếu người này trả lời sai
        this.vcnvFinalGuessRemainingMs = Math.max(0, (this.room.state.deadline || now) - now);
      }
      this.clearTimer();
      this.buzzedPlayerId = playerId;
      this.answersMap.clear();

      this.room.state = {
        ...this.room.state,
        round: 'VCNV',
        subPhase: isFinalGuess ? 'FINAL_GUESS_ANSWERING' : 'CNV_ANSWERING',
        activePlayerId: playerId,
        buzzerLockedBy: playerId,
        currentQuestion: this.questionSet.vcnv.obstacle,
        deadline: null,
        vcnvQuestionsAppearedCount: this.vcnvQuestionsAppearedCount,
      };

      const diffMs = now - this.buzzerOpenTime;
      this.callbacks.broadcastBuzzWon({
        winnerId: playerId,
        winnerName: player.name,
        diffMs,
      });

      this.setDeadline(GAME_CONFIG.VCNV.CNV_ANSWER_SECONDS * 1000, async () => {
        await this.evaluateCnvGuess(playerId, '');
      });

      this.persistSnapshot();
      this.syncRoom();
      return true;
    }

    // VE_DICH Steal Buzzer
    if (round === 'VE_DICH' && subPhase === 'STEAL_BUZZ') {
      const mainPlayerId = this.veDichActiveContestantId || this.room.state.mainPlayerId || this.room.state.activePlayerId;
      if (playerId === mainPlayerId) return false; // Main contestant cannot steal their own question
      if (this.rejectIfBuzzLocked(playerId, now)) return false;
      if (this.buzzedPlayerId) return false;

      this.buzzedPlayerId = playerId;
      this.room.state.buzzerLockedBy = playerId;
      this.room.state.activePlayerId = playerId;
      this.room.state.mainPlayerId = mainPlayerId;
      this.room.state.turnIndex = this.veDichCurrentTurnIndex;
      this.room.state.subPhase = 'STEAL_ANSWER';

      const player = this.room.players.find((p) => p.id === playerId);
      this.callbacks.broadcastBuzzWon({
        winnerId: playerId,
        winnerName: player ? player.name : 'Unknown',
        diffMs: now - this.buzzerOpenTime,
      });

      this.clearTimer();
      this.setDeadline(GAME_CONFIG.VE_DICH.STEAL_ANSWER_SECONDS * 1000, async () => {
        await this.evaluateVeDichSteal(playerId, '');
      });

      this.persistSnapshot();
      this.syncRoom();
      return true;
    }

    // TIEBREAK Buzzer
    if (round === 'TIEBREAK') {
      const eligible: string[] = this.room.state.eligiblePlayerIds || [];
      if (!eligible.includes(playerId)) {
        this.callbacks.broadcastBuzzRejected(playerId, {
          reason: 'Chỉ các thí sinh bằng điểm mới được bấm chuông câu hỏi phụ.',
        });
        return false;
      }

      if (subPhase === 'WAIT_SIGNAL') {
        // G14: Buzz early loses right for this question
        this.disqualifiedBuzzers.add(playerId);
        this.callbacks.broadcastBuzzRejected(playerId, {
          reason: 'Bấm chuông trước hiệu lệnh: Bị tước quyền trả lời câu này!',
        });
        return false;
      }

      if (subPhase === 'BUZZ_OPEN') {
        if (this.buzzedPlayerId) return false;
        this.buzzedPlayerId = playerId;
        this.room.state.buzzerLockedBy = playerId;
        this.room.state.activePlayerId = playerId;
        this.room.state.subPhase = 'ANSWERING';

        const player = this.room.players.find((p) => p.id === playerId);
        this.callbacks.broadcastBuzzWon({
          winnerId: playerId,
          winnerName: player ? player.name : 'Unknown',
          diffMs: now - this.buzzerOpenTime,
        });

        this.clearTimer();
        this.setDeadline(GAME_CONFIG.TIEBREAK.ANSWER_SECONDS * 1000, async () => {
          await this.evaluateTiebreakAnswer(playerId, '');
        });

        this.persistSnapshot();
        this.syncRoom();
        return true;
      }
    }

    return false;
  }

  private async finishKdChungAnswer(questionId: string): Promise<void> {
    const question = this.questionSet.khoiDong.chung.find((q) => q.id === questionId);
    if (!question || !this.buzzedPlayerId) return;

    const winnerId = this.buzzedPlayerId;
    const submission = this.answersMap.get(winnerId);
    const ans = submission ? submission.answer : '';
    const isCorrect = matchAnswer(ans, question.answer, question.alternatives, {
      ignoreDiacritics: question.ignoreDiacritics,
    });

    const delta = isCorrect
      ? GAME_CONFIG.KHOI_DONG.CHUNG_CORRECT_POINTS
      : GAME_CONFIG.KHOI_DONG.CHUNG_WRONG_OR_TIMEOUT_POINTS;

    this.addScore(winnerId, 'KD_CHUNG', question.id, delta, isCorrect ? 'correct' : 'wrong');

    const results: RevealResult[] = [
      {
        playerId: winnerId,
        answer: ans,
        isCorrect,
        delta,
      },
    ];

    const revealPayload: RevealPayload = {
      questionId: question.id,
      correctAnswer: question.answer,
      results,
      overrideWindowExpiresAt: Date.now() + GAME_CONFIG.HOST_OVERRIDE_WINDOW_SECONDS * 1000,
    };
    this.lastRevealedPayload = revealPayload;
    this.lastRevealRound = this.room.state.round;

    const qIdx = this.questionSet.khoiDong.chung.findIndex((q) => q.id === questionId);
    this.room.state = {
      round: 'KD_CHUNG',
      subPhase: 'REVEAL',
      activePlayerId: winnerId,
      deadline: null,
      currentQuestion: question,
      questionIndex: qIdx >= 0 ? qIdx : 0,
      activeAnswer: ans,
    };

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();

    this.setDeadline(3000, async () => {
      await this.runKdChungQuestion((qIdx >= 0 ? qIdx : 0) + 1);
    });
  }

  private async skipKdChungQuestion(questionIndex: number, question: Question): Promise<void> {
    this.room.state = {
      round: 'KD_CHUNG',
      subPhase: 'SKIP_REVEAL',
      deadline: null,
      currentQuestion: question,
      questionIndex,
    };

    const revealPayload: RevealPayload = {
      questionId: question.id,
      correctAnswer: question.answer,
      results: [],
    };

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();

    this.setDeadline(3000, async () => {
      await this.runKdChungQuestion(questionIndex + 1);
    });
  }

  // ==========================================
  // VÒNG 2: VƯỢT CHƯỚNG NGẠI VẬT (VCNV)
  // ==========================================

  private async startVcnv(): Promise<void> {
    this.room.status = 'VCNV';
    this.vcnvRowsAskedCount = 0;
    this.vcnvInterrupted = null;
    this.vcnvQuestionsAppearedCount = 0;
    this.vcnvCurrentRowIndex = 0;
    this.buzzedPlayerId = null;

    // Reset VCNV state
    for (const p of this.room.players) {
      p.eliminatedVcnv = Boolean(p.disqualified);
    }

    // Sort players by seat for turn order (contestants only)
    const sorted = [...this.room.players].filter((p) => p.role !== 'viewer').sort((a, b) => a.seat - b.seat);
    this.vcnvPlayerQueue = sorted.map((p) => p.id);

    // Calculate letter counts for all 4 rows
    const rowLetterCounts = this.questionSet.vcnv.rows.map((r) =>
      r.answer.toUpperCase().replace(/\s+/g, '').length
    );

    // Calculate letter count for obstacle main keyword
    const obstacleLetters = this.questionSet.vcnv.obstacle.answer
      .toUpperCase()
      .replace(/\s+/g, '')
      .split('');
    const obstacleLetterCount = obstacleLetters.length;

    // Initial state
    this.room.state = {
      round: 'VCNV',
      subPhase: 'PICK_ROW',
      deadline: null,
      buzzerLockedBy: null,
      activePlayerId: this.vcnvPlayerQueue[0],
      rowsRevealed: [false, false, false, false],
      rowLetterCounts,
      rowAnswersRevealed: [null, null, null, null],
      stepIndex: 0,
      obstacleLetterCount,
      obstacleAnswerRevealed: null,
      vcnvQuestionsAppearedCount: 0,
    };

    this.persistSnapshot();
    this.syncRoom();

    await this.promptVcnvPickRow(0);
  }

  private async promptVcnvPickRow(stepIndex: number, skipPlayerId?: string): Promise<void> {
    if (stepIndex >= 4) {
      // All 4 rows finished without CNV guessed -> Center question
      await this.presentVcnvCenter();
      return;
    }

    const rowsRevealed: boolean[] = this.room.state.rowsRevealed || [false, false, false, false];
    const unrevealedIndices = [0, 1, 2, 3].filter((idx) => !rowsRevealed[idx]);
    if (unrevealedIndices.length === 0) {
      await this.presentVcnvCenter();
      return;
    }

    // Determine who picks this row (among active non-eliminated connected players)
    const activeQueue = this.vcnvPlayerQueue.filter((id) => {
      const p = this.room.players.find((pl) => pl.id === id);
      return p && !p.eliminatedVcnv && p.connected;
    });

    if (activeQueue.length === 0) {
      // No active players left -> transition to Tăng Tốc
      this.showRoundResults('VCNV', 'TANG_TOC');
      return;
    }

    let chooserIdx = stepIndex % activeQueue.length;
    if (skipPlayerId && activeQueue[chooserIdx] === skipPlayerId && activeQueue.length > 1) {
      chooserIdx = (chooserIdx + 1) % activeQueue.length;
    }
    const chooserId = activeQueue[chooserIdx];

    this.buzzedPlayerId = null;
    this.answersMap.clear();

    this.room.state = {
      ...this.room.state,
      round: 'VCNV',
      subPhase: 'PICK_ROW',
      activePlayerId: chooserId,
      deadline: null,
      buzzerLockedBy: null,
      activeRowIndex: undefined,
      stepIndex,
      currentQuestion: undefined,
    };

    // Lúc chọn hàng không đếm giờ: không đặt deadline.
    // Khi thí sinh bấm chọn hàng (pickVcnvRow -> presentVcnvRow), lúc đó mới bắt đầu tính giờ 15 giây cho câu hỏi!

    this.persistSnapshot();
    this.syncRoom();
  }

  public pickVcnvRow(playerId: string, rowIndex: number): boolean {
    if (this.room.state.round !== 'VCNV' || this.room.state.subPhase !== 'PICK_ROW') {
      return false;
    }
    if (this.room.state.activePlayerId !== playerId) {
      return false;
    }
    if (rowIndex < 0 || rowIndex > 3) {
      return false;
    }
    const rowsRevealed = this.room.state.rowsRevealed || [false, false, false, false];
    if (rowsRevealed[rowIndex]) {
      return false; // Row already chosen/revealed
    }

    this.clearTimer();
    const stepIndex = this.room.state.stepIndex || 0;
    this.eventQueue.enqueue(async () => {
      await this.presentVcnvRow(rowIndex, stepIndex);
    });
    return true;
  }

  private async presentVcnvRow(rowIndex: number, stepIndex: number): Promise<void> {
    this.vcnvCurrentRowIndex = rowIndex;
    this.vcnvQuestionsAppearedCount = Math.max(this.vcnvQuestionsAppearedCount, stepIndex + 1);
    const rowQuestion = this.questionSet.vcnv.rows[rowIndex];

    this.answersMap.clear();
    this.buzzerOpenTime = Date.now();
    this.buzzedPlayerId = null;

    this.room.state = {
      ...this.room.state,
      round: 'VCNV',
      subPhase: 'ROW_QUESTION',
      currentQuestion: rowQuestion,
      deadline: null,
      buzzerLockedBy: null,
      activePlayerId: undefined, // All non-eliminated players answer!
      activeRowIndex: rowIndex,
      stepIndex,
      vcnvQuestionsAppearedCount: this.vcnvQuestionsAppearedCount,
    };

    const durationMs = GAME_CONFIG.VCNV.ROW_TIME_SECONDS * 1000;
    this.setDeadline(durationMs, async () => {
      await this.revealVcnvRow(stepIndex, rowIndex, rowQuestion);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  private async revealVcnvRow(
    stepIndex: number,
    rowIndex: number,
    question: Question
  ): Promise<void> {
    this.vcnvRowsAskedCount++;
    const results: RevealResult[] = [];
    let atLeastOneCorrect = false;

    for (const p of this.room.players.filter((pl) => pl.role !== 'viewer')) {
      if (p.eliminatedVcnv) continue;
      const sub = this.answersMap.get(p.id);
      const ans = sub ? sub.answer : '';
      const isCorrect = matchAnswer(ans, question.answer, question.alternatives, {
        isVcnvRow: true,
        ignoreDiacritics: question.ignoreDiacritics,
      });

      const delta = isCorrect ? GAME_CONFIG.VCNV.ROW_CORRECT_POINTS : 0;
      if (isCorrect) {
        atLeastOneCorrect = true;
        this.addScore(p.id, 'VCNV', question.id, delta, 'correct');
      }

      results.push({
        playerId: p.id,
        answer: ans,
        isCorrect,
        delta,
      });
    }

    // Mark row as played/revealed
    const rowsRevealed: boolean[] = [...(this.room.state.rowsRevealed || [false, false, false, false])];
    rowsRevealed[rowIndex] = true;

    // Reveal letters for this row if at least one correct (Olympia rule: không ai đúng thì giữ kín đáp án)
    const rowAnswersRevealed: (string[] | null)[] = [
      ...(this.room.state.rowAnswersRevealed || [null, null, null, null]),
    ];
    if (atLeastOneCorrect) {
      rowAnswersRevealed[rowIndex] = question.answer.toUpperCase().replace(/\s+/g, '').split('');
    } else {
      rowAnswersRevealed[rowIndex] = null;
    }

    const revealPayload: RevealPayload = {
      questionId: question.id,
      correctAnswer: atLeastOneCorrect ? question.answer : '',
      results,
    };
    this.lastRevealedPayload = revealPayload;

    this.room.state = {
      ...this.room.state,
      round: 'VCNV',
      subPhase: 'ROW_REVEAL',
      deadline: null,
      currentQuestion: question,
      rowsRevealed,
      rowAnswersRevealed,
      activeRowIndex: rowIndex,
      buzzerLockedBy: null,
      vcnvQuestionsAppearedCount: this.vcnvQuestionsAppearedCount,
    };

    // 6 seconds display for ROW_REVEAL so players have time to see answers and picture
    this.setDeadline(6000, async () => {
      // Next row prompt
      await this.promptVcnvPickRow(this.vcnvRowsAskedCount);
    });

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();
  }

  private async evaluateCnvGuess(playerId: string, guess: string): Promise<void> {
    const obsQuestion = this.questionSet.vcnv.obstacle;
    const isCorrect = matchAnswer(guess, obsQuestion.answer, obsQuestion.alternatives, {
      ignoreDiacritics: true,
    });

    const isFinalGuess = this.room.state.subPhase === 'FINAL_GUESS_ANSWERING';

    if (isCorrect) {
      this.vcnvInterrupted = null; // Trả lời đúng: vòng kết thúc, không còn câu nào để chạy lại
      // Thang điểm trả lời đúng Chướng ngại vật:
      // 60đ: Bấm chuông trả lời đúng sau khi câu hỏi hàng ngang 1 xuất hiện (trước khi câu 2 xuất hiện)
      // 50đ: Bấm chuông trả lời đúng sau khi câu hỏi hàng ngang 2 xuất hiện (trước khi câu 3 xuất hiện)
      // 40đ: Bấm chuông trả lời đúng sau khi câu hỏi hàng ngang 3 xuất hiện (trước khi câu 4 xuất hiện)
      // 30đ: Bấm chuông trả lời đúng sau khi câu hỏi hàng ngang 4 xuất hiện (trước khi câu ô trung tâm xuất hiện)
      // 20đ: Bấm chuông trả lời đúng sau khi câu hỏi thứ 5 (ô trung tâm) xuất hiện cho đến khi hết 15s suy nghĩ cuối cùng
      let delta = 20;
      if (this.vcnvQuestionsAppearedCount <= 1) {
        delta = 60;
      } else if (this.vcnvQuestionsAppearedCount === 2) {
        delta = 50;
      } else if (this.vcnvQuestionsAppearedCount === 3) {
        delta = 40;
      } else if (this.vcnvQuestionsAppearedCount === 4) {
        delta = 30;
      } else {
        delta = 20;
      }

      this.addScore(playerId, 'VCNV', obsQuestion.id, delta, 'correct');

      // Reveal all rows, all letters, and obstacle answer
      const allRowLetters = this.questionSet.vcnv.rows.map((r) =>
        r.answer.toUpperCase().replace(/\s+/g, '').split('')
      );
      const obstacleLetters = obsQuestion.answer.toUpperCase().replace(/\s+/g, '').split('');
      this.room.state = {
        ...this.room.state,
        round: 'VCNV',
        subPhase: 'CNV_RESULT',
        rowsRevealed: [true, true, true, true],
        rowAnswersRevealed: allRowLetters,
        obstacleSolved: true,
        obstacleAnswerRevealed: obstacleLetters,
      };

      const revealPayload: RevealPayload = {
        questionId: obsQuestion.id,
        correctAnswer: obsQuestion.answer,
        results: [{ playerId, answer: guess, isCorrect: true, delta }],
      };
      this.lastRevealedPayload = revealPayload;

      this.callbacks.broadcastReveal(revealPayload);
      this.persistSnapshot();
      this.syncRoom();

      // Proceed to Tăng Tốc
      this.setDeadline(5000, async () => {
        this.showRoundResults('VCNV', 'TANG_TOC');
      });
      return;
    }

    // Wrong guess or timeout: eliminate player from VCNV
    const player = this.room.players.find((p) => p.id === playerId);
    if (player) {
      player.eliminatedVcnv = true;
    }

    this.buzzedPlayerId = null;
    this.room.state.buzzerLockedBy = null;
    this.room.state.activePlayerId = undefined;

    const revealPayload: RevealPayload = {
      questionId: obsQuestion.id,
      correctAnswer: '',
      results: [{ playerId, answer: guess, isCorrect: false, delta: 0 }],
    };
    this.callbacks.broadcastReveal(revealPayload);

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
    this.syncRoom();

    // Check if any non-eliminated players remain (chỉ tính thí sinh, không tính khán giả)
    const remainingPlayers = this.getActiveVcnvContestants();
    if (remainingPlayers.length === 0) {
      // Nobody left -> finish VCNV
      const obstacleLetters = obsQuestion.answer.toUpperCase().replace(/\s+/g, '').split('');
      this.room.state.obstacleAnswerRevealed = obstacleLetters;
      this.callbacks.broadcastReveal({
        questionId: obsQuestion.id,
        correctAnswer: obsQuestion.answer,
        results: [{ playerId, answer: guess, isCorrect: false, delta: 0 }],
      });
      this.syncRoom();
      this.setDeadline(4000, async () => {
        this.showRoundResults('VCNV', 'TANG_TOC');
      });
      return;
    }

    // Chuông đã ngắt một câu đang chạy: chạy lại câu đó từ đầu (đồng hồ đầy, mọi người trả lời lại)
    const interrupted = this.vcnvInterrupted;
    this.vcnvInterrupted = null;
    if (interrupted) {
      if (interrupted.kind === 'ROW') {
        await this.presentVcnvRow(interrupted.rowIndex, interrupted.stepIndex);
      } else {
        await this.presentVcnvCenter();
      }
      return;
    }

    if (isFinalGuess) {
      // Chạy tiếp phần thời gian đoán cuối còn lại (tối thiểu 1s), không đếm lại 15s từ đầu
      await this.presentVcnvFinalGuess(Math.max(1000, this.vcnvFinalGuessRemainingMs ?? 0));
    } else if (this.vcnvQuestionsAppearedCount >= 5) {
      await this.presentVcnvFinalGuess();
    } else {
      // Continue next row
      await this.promptVcnvPickRow(this.vcnvRowsAskedCount);
    }
  }

  /**
   * Câu hỏi thứ 5 (ô trung tâm): KHÔNG nhận đáp án, không tính điểm. Câu hỏi chỉ hiện ra làm gợi ý để
   * người chơi đoán từ khóa chính (bấm chuông như mọi lúc). Hết giờ thì sang lượt đoán cuối.
   */
  private async presentVcnvCenter(): Promise<void> {
    const centerQ = this.questionSet.vcnv.center;
    this.answersMap.clear();
    this.vcnvQuestionsAppearedCount = 5;

    this.room.state = {
      ...this.room.state,
      round: 'VCNV',
      subPhase: 'CENTER_QUESTION',
      currentQuestion: centerQ,
      deadline: null,
      vcnvQuestionsAppearedCount: 5,
    };

    const durationMs = GAME_CONFIG.VCNV.CENTER_TIME_SECONDS * 1000;
    this.setDeadline(durationMs, async () => {
      await this.presentVcnvFinalGuess();
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  /** Thí sinh còn quyền thi VCNV (chưa bị loại, đang kết nối, không phải khán giả). */
  private getActiveVcnvContestants(): Player[] {
    return this.room.players.filter(
      (p) => p.role !== 'viewer' && !p.eliminatedVcnv && !p.disqualified && p.connected
    );
  }

  private async presentVcnvFinalGuess(durationOverrideMs?: number): Promise<void> {
    const nonEliminated = this.getActiveVcnvContestants();
    if (nonEliminated.length === 0) {
      // Nobody left -> finish VCNV
      this.showRoundResults('VCNV', 'TANG_TOC');
      return;
    }

    this.buzzedPlayerId = null;
    this.buzzerOpenTime = Date.now();
    this.vcnvQuestionsAppearedCount = 5;
    this.room.state = {
      ...this.room.state,
      round: 'VCNV',
      subPhase: 'FINAL_GUESS',
      deadline: null,
      buzzerLockedBy: null,
      activePlayerId: undefined,
      currentQuestion: this.questionSet.vcnv.obstacle,
      vcnvQuestionsAppearedCount: 5,
    };

    const durationMs = durationOverrideMs ?? GAME_CONFIG.VCNV.FINAL_GUESS_SECONDS * 1000;
    this.vcnvFinalGuessRemainingMs = null;
    this.setDeadline(durationMs, async () => {
      // Time expired without final guess
      this.showRoundResults('VCNV', 'TANG_TOC');
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  // ==========================================
  // VÒNG 3: TĂNG TỐC (G8)
  // ==========================================

  private async startTangToc(): Promise<void> {
    this.room.status = 'TANG_TOC';
    this.buzzedPlayerId = null;
    this.room.state.buzzerLockedBy = null;
    await this.runTangTocQuestion(0);
  }

  private async runTangTocQuestion(questionIndex: number): Promise<void> {
    const questions = this.questionSet.tangToc;
    if (questionIndex >= GAME_CONFIG.TANG_TOC.QUESTION_COUNT || questionIndex >= questions.length) {
      this.showRoundResults('TANG_TOC', 'VE_DICH');
      return;
    }

    const question = questions[questionIndex];
    this.answersMap.clear();
    this.buzzedPlayerId = null;
    const durationMs = GAME_CONFIG.TANG_TOC.TIME_SECONDS * 1000;

    this.room.state = {
      round: 'TANG_TOC',
      subPhase: 'QUESTION',
      currentQuestion: question,
      deadline: null,
      questionIndex,
      buzzerLockedBy: null,
    };

    const startTime = Date.now();
    this.setDeadline(durationMs, async () => {
      await this.revealTangTocQuestion(questionIndex, question, startTime);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  private async revealTangTocQuestion(
    questionIndex: number,
    question: Question,
    startTime: number
  ): Promise<void> {
    // Collect answers and verify correctness
    interface TangTocSub {
      playerId: string;
      answer: string;
      isCorrect: boolean;
      timestamp: number;
      timeSec: number;
    }

    const subs: TangTocSub[] = [];
    for (const p of this.room.players.filter((pl) => pl.role !== 'viewer')) {
      const sub = this.answersMap.get(p.id);
      if (sub) {
        const isCorrect = matchAnswer(sub.answer, question.answer, question.alternatives, {
          ignoreDiacritics: question.ignoreDiacritics,
        });
        const elapsedSec = Math.max(0, (sub.timestamp - startTime) / 1000);
        subs.push({
          playerId: p.id,
          answer: sub.answer,
          isCorrect,
          timestamp: sub.timestamp,
          timeSec: Math.round(elapsedSec * 100) / 100,
        });
      } else {
        subs.push({
          playerId: p.id,
          answer: '',
          isCorrect: false,
          timestamp: Infinity,
          timeSec: 0,
        });
      }
    }

    // Filter correct submissions and sort by timestamp
    const correctSubs = subs.filter((s) => s.isCorrect).sort((a, b) => a.timestamp - b.timestamp);

    // G8: Points rank [30, 25, 20, 15, 10], tied if diff <= 50ms
    const pointsRank = GAME_CONFIG.TANG_TOC.POINTS_BY_RANK;
    const playerPointsMap: Map<string, number> = new Map();

    let currentRankIdx = 0;
    for (let i = 0; i < correctSubs.length; i++) {
      if (i > 0) {
        const diff = correctSubs[i].timestamp - correctSubs[i - 1].timestamp;
        if (diff > GAME_CONFIG.TANG_TOC.TIE_THRESHOLD_MS) {
          currentRankIdx = i; // Next actual rank
        }
      }
      const pts = pointsRank[currentRankIdx] || 10;
      playerPointsMap.set(correctSubs[i].playerId, pts);
      this.addScore(correctSubs[i].playerId, 'TANG_TOC', question.id, pts, 'correct');
    }

    // Sắp xếp tất cả thí sinh theo thời gian nộp nhanh nhất (fastest first), chưa nộp ở cuối
    subs.sort((a, b) => {
      if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
      const pA = this.room.players.find((p) => p.id === a.playerId);
      const pB = this.room.players.find((p) => p.id === b.playerId);
      return (pA?.seat || 0) - (pB?.seat || 0);
    });

    const results: RevealResult[] = subs.map((s) => ({
      playerId: s.playerId,
      answer: s.answer,
      isCorrect: s.isCorrect,
      timeSec: s.timeSec,
      delta: playerPointsMap.get(s.playerId) || 0,
    }));

    const revealPayload: RevealPayload = {
      questionId: question.id,
      correctAnswer: question.answer,
      results,
      overrideWindowExpiresAt: Date.now() + GAME_CONFIG.HOST_OVERRIDE_WINDOW_SECONDS * 1000,
    };
    this.lastRevealedPayload = revealPayload;
    this.lastRevealRound = this.room.state.round;

    this.buzzedPlayerId = null;
    this.room.state = {
      round: 'TANG_TOC',
      subPhase: 'REVEAL',
      currentQuestion: question,
      deadline: null,
      questionIndex,
      buzzerLockedBy: null,
    };

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();

    const revealDuration = GAME_CONFIG.TANG_TOC.REVEAL_SECONDS * 1000;
    this.setDeadline(revealDuration, async () => {
      await this.runTangTocQuestion(questionIndex + 1);
    });
  }

  // ==========================================
  // VÒNG 4: VỀ ĐÍCH & CÂU HỎI PHỤ
  // ==========================================

  private async startVeDich(): Promise<void> {
    this.room.status = 'VE_DICH';
    this.buzzedPlayerId = null;
    this.room.state.buzzerLockedBy = null;
    this.veDichCompletedPlayerIds.clear();
    this.veDichUsedQuestionIds.clear();

    // G9: Sort players by current score descending, tiebreaker smaller seat (contestants only)
    const sorted = [...this.room.players]
      .filter((p) => p.role !== 'viewer' && p.connected)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.seat - b.seat;
      });

    const eligible = sorted.length > 0
      ? sorted
      : [...this.room.players].filter((p) => p.role !== 'viewer');

    this.veDichPlayerQueue = eligible.map((p) => p.id);
    await this.runVeDichTurn(0);
  }

  private async runVeDichTurn(playerQueueIndex: number): Promise<void> {
    if (playerQueueIndex >= this.veDichPlayerQueue.length) {
      // Hết lượt Về đích -> công bố điểm -> câu hỏi phụ (nếu hòa) hoặc bục vinh quang
      this.showRoundResults('VE_DICH', 'FINAL');
      return;
    }

    const activePlayerId = this.veDichPlayerQueue[playerQueueIndex];

    // Guarantee: Each player has at most 1 package/turn in Ve Dich!
    if (this.veDichCompletedPlayerIds.has(activePlayerId)) {
      await this.runVeDichTurn(playerQueueIndex + 1);
      return;
    }

    const activePlayer = this.room.players.find((p) => p.id === activePlayerId);
    // If contestant disconnected, immediately skip them to prevent game stall
    if (!activePlayer || !activePlayer.connected || activePlayer.disqualified) {
      this.veDichCompletedPlayerIds.add(activePlayerId);
      await this.runVeDichTurn(playerQueueIndex + 1);
      return;
    }

    this.veDichActiveContestantId = activePlayerId;
    this.veDichCurrentTurnIndex = playerQueueIndex;
    this.buzzedPlayerId = null;

    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'CHOOSE_PACKAGE',
      activePlayerId,
      mainPlayerId: activePlayerId,
      deadline: null,
      turnIndex: playerQueueIndex,
      buzzerLockedBy: null,
    };

    const chooseSec = GAME_CONFIG.VE_DICH.CHOOSE_PACKAGE_SECONDS;
    this.setDeadline(chooseSec * 1000, async () => {
      // Default package 40 on timeout
      await this.handleVeDichPackageChosen(activePlayerId, GAME_CONFIG.VE_DICH.DEFAULT_PACKAGE, playerQueueIndex, true);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  public chooseVeDichPackage(playerId: string, packagePoints: 40 | 60 | 80): boolean {
    if (this.room.state.round !== 'VE_DICH' || this.room.state.subPhase !== 'CHOOSE_PACKAGE') {
      return false;
    }
    if (this.room.state.activePlayerId !== playerId) {
      return false;
    }

    this.clearTimer();
    const turnIndex = this.veDichCurrentTurnIndex;
    this.eventQueue.enqueue(async () => {
      await this.handleVeDichPackageChosen(playerId, packagePoints, turnIndex, false);
    });
    return true;
  }

  private async handleVeDichPackageChosen(
    playerId: string,
    pkg: 40 | 60 | 80,
    turnIndex: number,
    isAutoTimeout: boolean = false
  ): Promise<void> {
    const questionPointsList = GAME_CONFIG.VE_DICH.PACKAGES[pkg] || [10, 10, 20];
    const player = this.room.players.find((p) => p.id === playerId);
    const playerName = player ? player.name : 'Thí sinh';

    this.veDichCurrentPackage = pkg;
    this.veDichCurrentPointsList = questionPointsList;
    this.veDichCurrentTurnIndex = turnIndex;
    this.veDichActiveContestantId = playerId;

    // Show announcement for 2.5 seconds
    this.clearTimer();
    this.buzzedPlayerId = null;
    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'PACKAGE_CHOSEN',
      activePlayerId: playerId,
      mainPlayerId: playerId,
      turnIndex,
      chosenPackage: pkg,
      chosenPackagePointsList: questionPointsList,
      chosenPackagePlayerName: playerName,
      isAutoTimeout,
      deadline: null,
      buzzerLockedBy: null,
    };
    this.persistSnapshot();
    this.syncRoom();

    this.setDeadline(2500, async () => {
      await this.runVeDichQuestion(playerId, questionPointsList, 0, turnIndex);
    });
  }

  private async runVeDichQuestion(
    playerId: string,
    pointsList: number[],
    questionIdx: number,
    turnIndex: number
  ): Promise<void> {
    const contestant = this.room.players.find((p) => p.id === playerId);
    if (questionIdx >= 3 || !contestant || contestant.disqualified) {
      // Contestant has finished their 3 questions! Mark completed!
      this.veDichCompletedPlayerIds.add(playerId);
      await this.runVeDichTurn(turnIndex + 1);
      return;
    }

    this.veDichCurrentQuestionIndex = questionIdx;
    this.veDichCurrentPointsList = pointsList;
    this.veDichCurrentTurnIndex = turnIndex;
    this.veDichActiveContestantId = playerId;
    const pValue = pointsList[questionIdx];
    this.veDichCurrentQuestionPoints = pValue;
    this.veDichHopeStarActive = false;

    // Pick question from pool without repeating across contestants
    const pool =
      pValue === 10
        ? this.questionSet.veDich.pool10
        : pValue === 20
        ? this.questionSet.veDich.pool20
        : this.questionSet.veDich.pool30;

    const unusedPool = pool.filter((q) => !this.veDichUsedQuestionIds.has(q.id));
    const candidateList = unusedPool.length > 0 ? unusedPool : pool;
    const question = candidateList[Math.floor(Math.random() * candidateList.length)] || pool[0];
    if (!question) {
      // Bộ đề không có câu cho mức điểm này -> kết thúc lượt thay vì làm treo trận
      console.error(`[Room ${this.room.code}] Thiếu câu hỏi Về đích ${pValue} điểm, bỏ qua lượt.`);
      this.veDichCompletedPlayerIds.add(playerId);
      await this.runVeDichTurn(turnIndex + 1);
      return;
    }
    this.veDichUsedQuestionIds.add(question.id);
    this.veDichCurrentQuestion = question;

    // Nếu thí sinh đã sử dụng Ngôi sao hy vọng ở câu hỏi trước rồi thì bỏ qua 7s suy nghĩ, vào luôn câu hỏi
    const player = this.room.players.find((p) => p.id === playerId);
    if (player && player.starUsed) {
      this.buzzedPlayerId = null;
      await this.presentVeDichQuestion(playerId, question, pValue, pointsList, turnIndex);
      return;
    }

    // Star decision phase: 7s (không đếm số giây, bắt đầu luôn khi chọn)
    this.buzzedPlayerId = null;
    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'STAR_DECISION',
      activePlayerId: playerId,
      mainPlayerId: playerId,
      turnIndex,
      chosenPackage: this.veDichCurrentPackage,
      chosenPackagePointsList: pointsList,
      deadline: null,
      currentQuestion: question,
      questionPoints: pValue,
      questionIndex: questionIdx,
      buzzerLockedBy: null,
    };

    this.setDeadline(GAME_CONFIG.VE_DICH.STAR_DECISION_SECONDS * 1000, async () => {
      await this.presentVeDichQuestion(playerId, question, pValue, pointsList, turnIndex);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  public setHopeStar(playerId: string, useStar: boolean): boolean {
    if (this.room.state.round !== 'VE_DICH' || this.room.state.subPhase !== 'STAR_DECISION') {
      return false;
    }
    if (this.room.state.activePlayerId !== playerId) return false;

    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return false;

    if (useStar && player.starUsed) {
      return false; // Already used star in this round
    }

    if (useStar) {
      player.starUsed = true;
      this.veDichHopeStarActive = true;
    } else {
      this.veDichHopeStarActive = false;
    }

    // Bắt đầu câu hỏi ngay lập tức khi thí sinh đưa ra quyết định (chọn hoặc không chọn)
    this.clearTimer();
    const currentQ = this.veDichCurrentQuestion;
    const pValue = this.veDichCurrentQuestionPoints;
    const pointsList = this.veDichCurrentPointsList;
    const turnIndex = this.veDichCurrentTurnIndex;

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));

    this.eventQueue.enqueue(async () => {
      if (currentQ) {
        await this.presentVeDichQuestion(playerId, currentQ, pValue, pointsList, turnIndex);
      }
    });

    return true;
  }

  private async presentVeDichQuestion(
    playerId: string,
    question: Question,
    points: number,
    pointsList: number[],
    turnIndex: number
  ): Promise<void> {
    const contestant = this.room.players.find((p) => p.id === playerId);
    if (!contestant || contestant.disqualified) {
      this.veDichCompletedPlayerIds.add(playerId);
      await this.runVeDichTurn(turnIndex + 1);
      return;
    }

    this.answersMap.clear();
    this.buzzedPlayerId = null;
    const durationSec = GAME_CONFIG.VE_DICH.QUESTION_TIME_BY_POINTS[points] || 20;

    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'QUESTION',
      activePlayerId: playerId,
      mainPlayerId: playerId,
      turnIndex,
      chosenPackage: this.veDichCurrentPackage,
      chosenPackagePointsList: pointsList,
      currentQuestion: question,
      deadline: null,
      hopeStarActive: this.veDichHopeStarActive,
      questionPoints: points,
      questionIndex: this.veDichCurrentQuestionIndex,
      buzzerLockedBy: null,
    };

    this.setDeadline(durationSec * 1000, async () => {
      await this.evaluateVeDichMainAnswer(playerId, question, pointsList, turnIndex);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  private async evaluateVeDichMainAnswer(
    playerId: string,
    question: Question,
    pointsList: number[],
    turnIndex: number
  ): Promise<void> {
    const sub = this.answersMap.get(playerId);
    const ans = sub ? sub.answer : '';
    const isCorrect = matchAnswer(ans, question.answer, question.alternatives, {
      ignoreDiacritics: question.ignoreDiacritics,
    });

    const p = this.veDichCurrentQuestionPoints;
    const hasStar = this.veDichHopeStarActive;

    if (isCorrect) {
      // Case 1 & 5: Correct -> +p or +2p
      const delta = hasStar ? 2 * p : p;
      this.addScore(playerId, 'VE_DICH', question.id, delta, hasStar ? 'star_correct' : 'correct');

      const revealPayload: RevealPayload = {
        questionId: question.id,
        correctAnswer: question.answer,
        results: [{ playerId, answer: ans, isCorrect: true, delta }],
      };
      this.lastRevealedPayload = revealPayload;

      this.buzzedPlayerId = null;
      this.room.state = {
        round: 'VE_DICH',
        subPhase: 'REVEAL',
        activePlayerId: playerId,
        mainPlayerId: playerId,
        turnIndex,
        chosenPackage: this.veDichCurrentPackage,
        chosenPackagePointsList: pointsList,
        currentQuestion: question,
        questionPoints: p,
        questionIndex: this.veDichCurrentQuestionIndex,
        deadline: null,
        buzzerLockedBy: null,
      };

      this.callbacks.broadcastReveal(revealPayload);
      this.persistSnapshot();
      this.syncRoom();

      this.setDeadline(3000, async () => {
        await this.runVeDichQuestion(playerId, pointsList, this.veDichCurrentQuestionIndex + 1, turnIndex);
      });
      return;
    }

    // Wrong or timeout:
    // If star was used, active player is immediately deducted -p (G12: only deducted once)
    if (hasStar) {
      this.addScore(playerId, 'VE_DICH', question.id, -p, 'star_wrong');
    }

    // Open Steal Buzz (5s) for the other players (G11); chuông khóa BUZZ_LOCK_SECONDS đầu
    this.buzzedPlayerId = null;
    const stealLockMs = GAME_CONFIG.BUZZ_LOCK_SECONDS * 1000;
    const stealUnlockAt = Date.now() + stealLockMs;
    this.buzzerOpenTime = stealUnlockAt;

    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'STEAL_BUZZ',
      activePlayerId: playerId, // Main player ID
      mainPlayerId: playerId,
      turnIndex,
      chosenPackage: this.veDichCurrentPackage,
      chosenPackagePointsList: pointsList,
      currentQuestion: question,
      questionPoints: p,
      questionIndex: this.veDichCurrentQuestionIndex,
      buzzUnlockAt: stealUnlockAt,
      deadline: null,
      buzzerLockedBy: null,
    };

    const stealBuzzSec = GAME_CONFIG.VE_DICH.STEAL_BUZZ_SECONDS;
    this.setDeadline(stealLockMs + stealBuzzSec * 1000, async () => {
      // Nobody buzzed to steal
      const revealPayload: RevealPayload = {
        questionId: question.id,
        correctAnswer: question.answer,
        results: [{ playerId, answer: ans, isCorrect: false, delta: hasStar ? -p : 0 }],
      };
      this.lastRevealedPayload = revealPayload;

      this.buzzedPlayerId = null;
      this.room.state = {
        round: 'VE_DICH',
        subPhase: 'REVEAL',
        activePlayerId: playerId,
        mainPlayerId: playerId,
        turnIndex,
        chosenPackage: this.veDichCurrentPackage,
        chosenPackagePointsList: pointsList,
        currentQuestion: question,
        questionPoints: p,
        questionIndex: this.veDichCurrentQuestionIndex,
        deadline: null,
        buzzerLockedBy: null,
      };

      this.callbacks.broadcastReveal(revealPayload);
      this.persistSnapshot();
      this.syncRoom();

      this.setDeadline(3000, async () => {
        await this.runVeDichQuestion(playerId, pointsList, this.veDichCurrentQuestionIndex + 1, turnIndex);
      });
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  private async evaluateVeDichSteal(stealerId: string, stealAnswer: string): Promise<void> {
    const question = this.room.state.currentQuestion as Question;
    const mainPlayerId = this.veDichActiveContestantId;
    const turnIndex = this.veDichCurrentTurnIndex;
    const pointsList = this.veDichCurrentPointsList;
    const p = this.veDichCurrentQuestionPoints;
    const hasStar = this.veDichHopeStarActive;

    const isCorrect = matchAnswer(stealAnswer, question.answer, question.alternatives, {
      ignoreDiacritics: question.ignoreDiacritics,
    });

    const results: RevealResult[] = [];

    if (isCorrect) {
      // Stealer gets +p
      this.addScore(stealerId, 'VE_DICH', question.id, p, 'steal_correct');
      results.push({ playerId: stealerId, answer: stealAnswer, isCorrect: true, delta: p });

      // If main player didn't have star, active player loses -p!
      // If star was used, active player was ALREADY deducted -p in evaluateVeDichMainAnswer (G12: only deducted once)
      if (!hasStar) {
        this.addScore(mainPlayerId, 'VE_DICH', question.id, -p, 'wrong');
        results.push({ playerId: mainPlayerId, answer: '', isCorrect: false, delta: -p });
      }
    } else {
      // Stealer loses -p/2
      const penalty = Math.floor(p / 2);
      this.addScore(stealerId, 'VE_DICH', question.id, -penalty, 'steal_wrong');
      results.push({ playerId: stealerId, answer: stealAnswer, isCorrect: false, delta: -penalty });
    }

    const revealPayload: RevealPayload = {
      questionId: question.id,
      correctAnswer: question.answer,
      results,
    };
    this.lastRevealedPayload = revealPayload;

    this.buzzedPlayerId = null;
    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'REVEAL',
      activePlayerId: mainPlayerId,
      mainPlayerId,
      turnIndex,
      chosenPackage: this.veDichCurrentPackage,
      chosenPackagePointsList: pointsList,
      currentQuestion: question,
      questionPoints: p,
      questionIndex: this.veDichCurrentQuestionIndex,
      deadline: null,
      buzzerLockedBy: null,
    };

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();

    this.setDeadline(3000, async () => {
      await this.runVeDichQuestion(mainPlayerId, pointsList, this.veDichCurrentQuestionIndex + 1, turnIndex);
    });
  }

  // --- TIEBREAK & FINISHED ---

  private async checkFinishOrTiebreak(): Promise<void> {
    // Sort players by score (contestants only)
    const sorted = [...this.room.players]
      .filter((p) => p.role !== 'viewer' && !p.disqualified)
      .sort((a, b) => b.score - a.score);
    if (sorted.length === 0) {
      await this.finishGame();
      return;
    }
    const topScore = sorted[0].score;
    const topPlayers = sorted.filter((p) => p.score === topScore);

    if (topPlayers.length > 1) {
      // Tiebreak!
      this.room.status = 'TIEBREAK';
      this.tieBreakQuestionIndex = 0;
      await this.runTiebreakQuestion(0, topPlayers.map((p) => p.id));
    } else {
      await this.finishGame();
    }
  }

  private async runTiebreakQuestion(qIndex: number, eligiblePlayerIds: string[]): Promise<void> {
    if (qIndex >= GAME_CONFIG.TIEBREAK.MAX_QUESTIONS || qIndex >= this.questionSet.tieBreak.length) {
      // Draw lots after 3 questions
      await this.drawLotsWinner(eligiblePlayerIds);
      return;
    }

    this.tieBreakQuestionIndex = qIndex;
    const question = this.questionSet.tieBreak[qIndex];
    this.disqualifiedBuzzers.clear();
    this.buzzedPlayerId = null;

    // G14: 3s wait signal
    this.room.state = {
      round: 'TIEBREAK',
      subPhase: 'WAIT_SIGNAL',
      currentQuestion: question,
      deadline: null,
      eligiblePlayerIds,
      buzzerLockedBy: null,
    };

    this.setDeadline(GAME_CONFIG.TIEBREAK.WAIT_SIGNAL_SECONDS * 1000, async () => {
      // Open buzzer
      this.buzzerOpenTime = Date.now();
      this.room.state = {
        ...this.room.state,
        subPhase: 'BUZZ_OPEN',
        buzzerLockedBy: null,
      };

      this.setDeadline(GAME_CONFIG.TIEBREAK.BUZZ_OPEN_SECONDS * 1000, async () => {
        // No valid buzz in 15s -> next tiebreak question
        await this.runTiebreakQuestion(qIndex + 1, eligiblePlayerIds);
      });

      this.persistSnapshot();
      this.syncRoom();
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  private async evaluateTiebreakAnswer(playerId: string, ans: string): Promise<void> {
    const question = this.room.state.currentQuestion as Question;
    const isCorrect = matchAnswer(ans, question.answer, question.alternatives, {
      ignoreDiacritics: question.ignoreDiacritics,
    });

    if (isCorrect) {
      // Player won the match!
      await this.finishGame(playerId);
      return;
    }

    // Wrong -> Next tiebreak question
    const revealPayload: RevealPayload = {
      questionId: question.id,
      correctAnswer: question.answer,
      results: [{ playerId, answer: ans, isCorrect: false, delta: 0 }],
    };

    this.room.state = {
      ...this.room.state,
      subPhase: 'REVEAL',
    };

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();

    const eligible = this.room.state.eligiblePlayerIds || [];
    this.setDeadline(3000, async () => {
      await this.runTiebreakQuestion(this.tieBreakQuestionIndex + 1, eligible);
    });
  }

  private async drawLotsWinner(eligiblePlayerIds: string[]): Promise<void> {
    const winnerId = eligiblePlayerIds[Math.floor(Math.random() * eligiblePlayerIds.length)];
    this.room.state = {
      round: 'TIEBREAK',
      subPhase: 'DRAW_LOTS',
      winnerId,
      deadline: null,
    };
    this.persistSnapshot();
    this.syncRoom();

    this.setDeadline(5000, async () => {
      await this.finishGame(winnerId);
    });
  }

  private async finishGame(
    winnerId?: string,
    finishReason?: 'LAST_STANDING' | 'ALL_DISQUALIFIED'
  ): Promise<void> {
    this.clearTimer();
    this.buzzedPlayerId = null;
    this.room.status = 'FINISHED';
    const sorted = [...this.room.players]
      .filter((p) => p.role !== 'viewer' && !p.disqualified)
      .sort((a, b) => b.score - a.score);
    // Không còn thí sinh hợp lệ nào thì không có người thắng (không lấy người bị loại làm quán quân)
    const finalWinnerId = winnerId || sorted[0]?.id;

    this.room.state = {
      round: 'FINISHED',
      subPhase: 'PODIUM',
      winnerId: finalWinnerId,
      finishReason,
      deadline: null,
    };

    this.persistSnapshot();
    this.syncRoom();
  }

  /**
   * Chơi lại: sau khi trận kết thúc, chủ phòng đưa cả phòng về Sảnh chờ với điểm và trạng thái mới,
   * giữ nguyên người chơi và ghế. Bộ đề tự tải lên được giữ (chủ phòng có thể tải bộ khác trong sảnh);
   * bộ đề ghép từ kho sẽ được ghép bộ mới khi bắt đầu.
   */
  public resetForNewGame(hostId: string): { ok: boolean; error?: string } {
    if (this.room.hostId !== hostId) return { ok: false, error: 'Chỉ chủ phòng mới có quyền cho chơi lại.' };
    if (this.room.status !== 'FINISHED') return { ok: false, error: 'Trận đấu chưa kết thúc.' };

    this.clearTimer();
    this.lastRevealRound = null;
    this.vcnvFinalGuessRemainingMs = null;
    this.vcnvInterrupted = null;
    this.lastTabLeaveAt.clear();
    this.answersMap.clear();
    this.disqualifiedBuzzers.clear();
    this.buzzedPlayerId = null;
    this.buzzerOpenTime = 0;
    this.veDichPlayerQueue = [];
    this.veDichCompletedPlayerIds.clear();
    this.veDichUsedQuestionIds.clear();
    this.veDichActiveContestantId = '';
    this.veDichCurrentPackage = 40;
    this.veDichCurrentQuestionIndex = 0;
    this.veDichCurrentQuestionPoints = 10;
    this.veDichHopeStarActive = false;
    this.veDichCurrentPointsList = [];
    this.veDichCurrentTurnIndex = 0;
    this.veDichCurrentQuestion = null;
    this.tieBreakQuestionIndex = 0;
    this.vcnvRowsAskedCount = 0;
    this.vcnvQuestionsAppearedCount = 0;
    this.vcnvCurrentRowIndex = 0;
    this.vcnvPlayerQueue = [];
    this.lastRevealedPayload = null;
    this.chosenKdPackages.clear();

    for (const p of this.room.players) {
      p.score = 0;
      p.roundScores = { kd: 0, vcnv: 0, tt: 0, vd: 0 };
      p.ready = false;
      p.mediaLoaded = false;
      p.eliminatedVcnv = false;
      p.starUsed = false;
      p.tabLeaveCount = 0;
      p.disqualified = false;
    }
    this.room.history = [];
    this.room.status = 'LOBBY';
    this.room.state = { round: 'LOBBY', subPhase: 'WAITING_PLAYERS', deadline: null };

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(toPublicPlayers(this.room.players));
    this.syncRoom();
    return { ok: true };
  }
}
