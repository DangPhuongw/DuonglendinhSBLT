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
  GAME_CONFIG,
  matchAnswer,
  normalizeAnswer,
} from '@olympia/shared';
import { EventQueue } from './EventQueue.js';
import { SnapshotManager } from './SnapshotManager.js';
import { DEFAULT_QUESTION_SET } from './defaultQuestionSet.js';

export interface StateMachineCallbacks {
  broadcastRoom: (room: Room) => void;
  broadcastPhaseChange: (data: {
    round: RoundType;
    subPhase: string;
    deadline: number | null;
    question?: ClientQuestion;
    metadata?: any;
  }) => void;
  broadcastBuzzWon: (data: { winnerId: string; winnerName: string; diffMs?: number }) => void;
  broadcastBuzzRejected: (toSocketId: string | null, data: { reason: string }) => void;
  emitAnswerAck: (toPlayerId: string, data: { questionId: string; receivedAt: number }) => void;
  broadcastReveal: (data: RevealPayload) => void;
  broadcastScoreUpdate: (data: { scores: Record<string, number>; lastEvents: ScoreEvent[] }) => void;
  broadcastPlayerUpdate: (players: Player[]) => void;
}

export class RoomStateMachine {
  public room: Room;
  public eventQueue: EventQueue;
  public questionSet: QuestionSet;
  private callbacks: StateMachineCallbacks;
  private activeTimer: NodeJS.Timeout | null = null;

  // Working state during rounds
  private answersMap: Map<string, { answer: string; timestamp: number }> = new Map();
  private disqualifiedBuzzers: Set<string> = new Set();
  private buzzedPlayerId: string | null = null;
  private buzzerOpenTime: number = 0;
  private pendingCnvBuzzerId: string | null = null;
  private veDichPlayerQueue: string[] = [];
  private veDichCurrentQuestionIndex: number = 0;
  private veDichCurrentQuestionPoints: number = 10;
  private veDichHopeStarActive: boolean = false;
  private tieBreakQuestionIndex: number = 0;
  private vcnvRowsAskedCount: number = 0;
  private vcnvCurrentRowIndex: number = 0;
  private vcnvPlayerQueue: string[] = [];
  private lastRevealedPayload: RevealPayload | null = null;
  private chosenKdPackages: Map<string, number> = new Map();

  constructor(
    roomCode: string,
    hostPlayer: { id: string; name: string; token: string },
    callbacks: StateMachineCallbacks,
    initialQuestionSet?: QuestionSet
  ) {
    this.eventQueue = new EventQueue();
    this.callbacks = callbacks;
    this.questionSet = initialQuestionSet || DEFAULT_QUESTION_SET;

    const host: Player = {
      id: hostPlayer.id,
      name: hostPlayer.name,
      seat: 1,
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
      state: {
        ...this.room.state,
        currentQuestion: sanitizedQ,
      },
    };
  }

  public syncRoom(): void {
    this.callbacks.broadcastRoom(this.getSanitizedRoom());
  }

  public setCallbacks(callbacks: StateMachineCallbacks): void {
    this.callbacks = callbacks;
  }

  // --- Timer scheduling ---

  private clearTimer(): void {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
  }

  private setDeadline(durationMs: number, onExpire: () => Promise<void>): void {
    this.clearTimer();
    const now = Date.now();
    this.room.state.deadline = now + durationMs;

    this.activeTimer = setTimeout(() => {
      this.eventQueue.enqueue(async () => {
        // If deadline hasn't changed or expired
        if (this.room.state.deadline && Date.now() >= this.room.state.deadline - 50) {
          await onExpire();
        }
      });
    }, durationMs);
  }

  // --- Player Management ---

  public addPlayer(name: string, token: string): { ok: boolean; player?: Player; error?: string } {
    if (this.room.players.length >= GAME_CONFIG.MAX_PLAYERS) {
      return { ok: false, error: 'Phòng đã đủ 5 người chơi.' };
    }

    if (this.room.status !== 'LOBBY') {
      return { ok: false, error: 'Trận đấu đã bắt đầu, không thể tham gia.' };
    }

    const takenSeats = new Set(this.room.players.map((p) => p.seat));
    let nextSeat: 1 | 2 | 3 | 4 | 5 = 1;
    for (let s = 1; s <= GAME_CONFIG.MAX_PLAYERS; s++) {
      if (!takenSeats.has(s as any)) {
        nextSeat = s as any;
        break;
      }
    }

    const newPlayer: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      seat: nextSeat,
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

  public handleDisconnect(playerId: string): void {
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.connected = false;
    player.disconnectedAt = Date.now();

    // If host disconnected, reassign host to first connected player
    if (this.room.hostId === player.id) {
      const nextHost = this.room.players.find((p) => p.connected && p.id !== player.id);
      if (nextHost) {
        this.room.hostId = nextHost.id;
      }
    }

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(this.room.players);
    this.syncRoom();
  }

  public handleReconnect(token: string): { ok: boolean; player?: Player; error?: string } {
    const player = this.room.players.find((p) => p.token === token);
    if (!player) {
      return { ok: false, error: 'Token không hợp lệ hoặc người chơi không tồn tại.' };
    }

    player.connected = true;
    player.disconnectedAt = undefined;

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(this.room.players);
    this.syncRoom();
    return { ok: true, player };
  }

  public setPlayerReady(playerId: string, mediaLoaded: boolean): void {
    const player = this.room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.ready = true;
    player.mediaLoaded = mediaLoaded;

    this.callbacks.broadcastPlayerUpdate(this.room.players);

    // If in READY screen, check if all connected players are ready
    if (this.room.state.round === 'READY') {
      const connectedPlayers = this.room.players.filter((p) => p.connected);
      const allReady = connectedPlayers.length > 0 && connectedPlayers.every((p) => p.ready);
      if (allReady) {
        this.startReadyCountdown();
      }
    }
  }

  public skipAbsentPlayer(hostId: string, absentPlayerId: string): void {
    if (this.room.hostId !== hostId) return;
    const player = this.room.players.find((p) => p.id === absentPlayerId);
    if (!player || player.connected) return;

    // Mark as ready or eliminate from current phase
    player.ready = true;
    this.callbacks.broadcastPlayerUpdate(this.room.players);

    if (this.room.state.round === 'READY') {
      const activePlayers = this.room.players.filter((p) => p.connected || p.ready);
      const allReady = activePlayers.every((p) => p.ready);
      if (allReady) {
        this.startReadyCountdown();
      }
    }
  }

  public kickPlayer(hostId: string, targetPlayerId: string): boolean {
    if (this.room.hostId !== hostId) return false;
    if (hostId === targetPlayerId) return false;

    const idx = this.room.players.findIndex((p) => p.id === targetPlayerId);
    if (idx === -1) return false;

    this.room.players.splice(idx, 1);
    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(this.room.players);
    this.syncRoom();
    return true;
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

    // Calculate new delta based on round
    let newDelta = 0;
    const round = this.room.state.round;

    if (round === 'KD_RIENG') {
      newDelta = isCorrect ? GAME_CONFIG.KHOI_DONG.RIENG_CORRECT_POINTS : 0;
    } else if (round === 'KD_CHUNG') {
      newDelta = isCorrect
        ? GAME_CONFIG.KHOI_DONG.CHUNG_CORRECT_POINTS
        : GAME_CONFIG.KHOI_DONG.CHUNG_WRONG_OR_TIMEOUT_POINTS;
    } else if (round === 'VCNV') {
      newDelta = isCorrect ? GAME_CONFIG.VCNV.ROW_CORRECT_POINTS : 0;
    } else if (round === 'TANG_TOC') {
      newDelta = isCorrect ? 10 : 0; // Host override fallback
    } else if (round === 'VE_DICH') {
      newDelta = isCorrect ? this.veDichCurrentQuestionPoints : -this.veDichCurrentQuestionPoints;
    }

    const netAdjustment = newDelta - oldDelta;
    result.isCorrect = isCorrect;
    result.delta = newDelta;

    this.addScore(playerId, round, questionId, netAdjustment, 'host_override');
    this.persistSnapshot();
    this.syncRoom();
    return true;
  }

  // --- Dev / Test shortcut: Tua nhanh vòng ---
  public jumpToRound(targetRound: string = 'VCNV'): void {
    this.clearTimer();
    this.answersMap.clear();
    this.buzzedPlayerId = null;
    this.pendingCnvBuzzerId = null;
    this.eventQueue.enqueue(async () => {
      if (targetRound === 'VCNV') {
        await this.startVcnv();
      } else if (targetRound === 'TANG_TOC') {
        await this.startTangToc();
      } else if (targetRound === 'VE_DICH') {
        await this.startVeDich();
      } else if (targetRound === 'KD_RIENG') {
        await this.startKhoiDongRieng();
      } else if (targetRound === 'KD_CHUNG') {
        await this.startKhoiDongChung();
      } else {
        await this.startVcnv();
      }
    });
  }

  // --- Flow & Transitions ---

  public startGame(hostId: string): { ok: boolean; error?: string } {
    if (this.room.hostId !== hostId) {
      return { ok: false, error: 'Chỉ chủ phòng mới có quyền bắt đầu.' };
    }

    const connectedPlayers = this.room.players.filter((p) => p.connected);
    if (connectedPlayers.length < GAME_CONFIG.MIN_PLAYERS_FOR_TEST) {
      return { ok: false, error: `Cần tối thiểu ${GAME_CONFIG.MIN_PLAYERS_FOR_TEST} người chơi để bắt đầu.` };
    }

    this.transitionToReady('KD_RIENG');
    return { ok: true };
  }

  private transitionToReady(targetRound: RoundType): void {
    this.clearTimer();
    this.buzzedPlayerId = null;
    this.pendingCnvBuzzerId = null;
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
      }
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  // ==========================================
  // VÒNG 1: KHỞI ĐỘNG
  // ==========================================

  private getKdPackagesList() {
    // Luôn luôn có đúng 5 ô câu hỏi tổng
    const totalBoxes = 5;
    const result = [];
    for (let i = 0; i < totalBoxes; i++) {
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
        count: (this.questionSet.khoiDong.rieng[i] || []).length || 5,
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
      const players = [...this.room.players].sort((a, b) => a.seat - b.seat);
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
      const pickIdx = unchosen ? unchosen.index : 0;
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
    const playersInOrder = [...this.room.players].sort((a, b) => a.seat - b.seat);
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

    if (!question) {
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
    };

    const durationMs = GAME_CONFIG.KHOI_DONG.RIENG_TIME_SECONDS * 1000;
    this.setDeadline(durationMs, async () => {
      await this.revealKdRiengQuestion(players, playerIndex, questionIndex, question);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  public submitAnswer(playerId: string, questionId: string, answer: string): boolean {
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
      if (this.room.state.activePlayerId !== playerId) return false;
      // Single choice, lock immediately
      if (!this.answersMap.has(playerId)) {
        this.answersMap.set(playerId, { answer, timestamp: now });
        this.callbacks.emitAnswerAck(playerId, { questionId, receivedAt: now });
        // Immediately trigger reveal early since choice is locked
        this.clearTimer();
        this.eventQueue.enqueue(async () => {
          const players = [...this.room.players].sort((a, b) => a.seat - b.seat);
          const activeIdx = players.findIndex((p) => p.id === playerId);
          const pkgIdx = this.chosenKdPackages.get(playerId) ?? (players[activeIdx].seat - 1);
          const questionsInPkg = this.questionSet.khoiDong.rieng[pkgIdx] || [];
          const qIdx = questionsInPkg.findIndex((q) => q.id === questionId);
          const fullQuestion = questionsInPkg[qIdx] || questionsInPkg[0];
          await this.revealKdRiengQuestion(players, activeIdx, qIdx, fullQuestion);
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

      if (subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') {
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

    this.room.state = {
      round: 'KD_RIENG',
      subPhase: 'REVEAL',
      activePlayerId: currentPlayer.id,
      deadline: null,
      currentQuestion: question,
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
    await this.runKdChungQuestion(0);
  }

  private async runKdChungQuestion(questionIndex: number): Promise<void> {
    const questions = this.questionSet.khoiDong.chung;
    if (questionIndex >= GAME_CONFIG.KHOI_DONG.CHUNG_QUESTIONS || questionIndex >= questions.length) {
      // Done Khởi động -> Transition to VCNV
      this.transitionToReady('VCNV');
      return;
    }

    const question = questions[questionIndex];
    this.buzzedPlayerId = null;
    this.answersMap.clear();
    this.disqualifiedBuzzers.clear();
    this.buzzerOpenTime = Date.now();

    this.room.state = {
      round: 'KD_CHUNG',
      subPhase: 'QUESTION_BUZZ',
      deadline: null,
      currentQuestion: question,
      buzzerLockedBy: null,
      activePlayerId: undefined,
    };

    const durationMs = GAME_CONFIG.KHOI_DONG.CHUNG_BUZZ_SECONDS * 1000;
    this.setDeadline(durationMs, async () => {
      // Nobody buzzed
      await this.skipKdChungQuestion(questionIndex, question);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  public handleBuzzer(playerId: string): boolean {
    const now = Date.now();
    const round = this.room.state.round;
    const subPhase = this.room.state.subPhase;

    if (this.disqualifiedBuzzers.has(playerId)) {
      this.callbacks.broadcastBuzzRejected(null, { reason: 'Bạn đã bị mất quyền bấm chuông câu này.' });
      return false;
    }

    // KD_CHUNG Buzzer
    if (round === 'KD_CHUNG' && subPhase === 'QUESTION_BUZZ') {
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

      // Bấm chuông trả lời từ khóa chính bất kì lúc nào!
      this.clearTimer();
      this.buzzedPlayerId = playerId;
      this.pendingCnvBuzzerId = null;
      this.answersMap.clear();

      this.room.state = {
        ...this.room.state,
        round: 'VCNV',
        subPhase: 'CNV_ANSWERING',
        activePlayerId: playerId,
        buzzerLockedBy: playerId,
        currentQuestion: this.questionSet.vcnv.obstacle,
        deadline: null,
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
      if (playerId === this.room.state.activePlayerId) return false; // Main player cannot steal
      if (this.buzzedPlayerId) return false;

      this.buzzedPlayerId = playerId;
      this.room.state.buzzerLockedBy = playerId;
      this.room.state.activePlayerId = playerId;
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
      if (subPhase === 'WAIT_SIGNAL') {
        // G14: Buzz early loses right for this question
        this.disqualifiedBuzzers.add(playerId);
        this.callbacks.broadcastBuzzRejected(null, {
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

    this.room.state = {
      round: 'KD_CHUNG',
      subPhase: 'REVEAL',
      activePlayerId: winnerId,
      deadline: null,
      currentQuestion: question,
    };

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();

    const qIdx = this.questionSet.khoiDong.chung.findIndex((q) => q.id === questionId);
    this.setDeadline(3000, async () => {
      await this.runKdChungQuestion(qIdx + 1);
    });
  }

  private async skipKdChungQuestion(questionIndex: number, question: Question): Promise<void> {
    this.room.state = {
      round: 'KD_CHUNG',
      subPhase: 'SKIP_REVEAL',
      deadline: null,
      currentQuestion: question,
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
    this.vcnvCurrentRowIndex = 0;
    this.buzzedPlayerId = null;
    this.pendingCnvBuzzerId = null;

    // Reset VCNV state
    for (const p of this.room.players) {
      p.eliminatedVcnv = false;
    }

    // Sort players by seat for turn order
    const sorted = [...this.room.players].sort((a, b) => a.seat - b.seat);
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
      openedPieces: [], // indices of opened pieces (0..4)
      rowsRevealed: [false, false, false, false],
      rowLetterCounts,
      rowAnswersRevealed: [null, null, null, null],
      stepIndex: 0,
      vcnvImage: this.questionSet.vcnv.image || '',
      obstacleLetterCount,
      obstacleAnswerRevealed: null,
    };

    this.persistSnapshot();
    this.syncRoom();

    await this.promptVcnvPickRow(0);
  }

  private async promptVcnvPickRow(stepIndex: number): Promise<void> {
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
      this.transitionToReady('TANG_TOC');
      return;
    }

    const chooserId = activeQueue[stepIndex % activeQueue.length];

    this.buzzedPlayerId = null;
    this.pendingCnvBuzzerId = null;
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

    // 10 seconds for the chooser to pick a row
    const chooseTimeoutSec = 10;
    this.setDeadline(chooseTimeoutSec * 1000, async () => {
      // Auto pick first unrevealed row
      const fallbackRow = unrevealedIndices[0];
      await this.presentVcnvRow(fallbackRow, stepIndex);
    });

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
    const rowQuestion = this.questionSet.vcnv.rows[rowIndex];

    this.answersMap.clear();
    this.buzzerOpenTime = Date.now();
    this.pendingCnvBuzzerId = null;
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

    for (const p of this.room.players) {
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

    // Open row and piece if at least 1 correct
    const openedPieces: number[] = [...(this.room.state.openedPieces || [])];
    const rowsRevealed: boolean[] = [...(this.room.state.rowsRevealed || [false, false, false, false])];
    rowsRevealed[rowIndex] = true;

    if (atLeastOneCorrect && !openedPieces.includes(rowIndex)) {
      openedPieces.push(rowIndex);
    }

    // Reveal letters for this row if at least one correct (Olympia rule)
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
      correctAnswer: question.answer,
      results,
    };
    this.lastRevealedPayload = revealPayload;

    this.room.state = {
      ...this.room.state,
      round: 'VCNV',
      subPhase: 'ROW_REVEAL',
      deadline: null,
      currentQuestion: question,
      openedPieces,
      rowsRevealed,
      rowAnswersRevealed,
      activeRowIndex: rowIndex,
      buzzerLockedBy: this.pendingCnvBuzzerId || null,
    };

    // 6 seconds display for ROW_REVEAL so players have time to see answers and picture
    this.setDeadline(6000, async () => {
      // If someone buzzed for CNV during the row, give them 15s to answer CNV now (G7)
      if (this.pendingCnvBuzzerId) {
        const buzzerId = this.pendingCnvBuzzerId;
        this.pendingCnvBuzzerId = null;
        this.answersMap.clear();

        this.room.state = {
          ...this.room.state,
          round: 'VCNV',
          subPhase: 'CNV_ANSWERING',
          activePlayerId: buzzerId,
          buzzerLockedBy: buzzerId,
          currentQuestion: this.questionSet.vcnv.obstacle,
          deadline: null,
        };

        this.setDeadline(GAME_CONFIG.VCNV.CNV_ANSWER_SECONDS * 1000, async () => {
          await this.evaluateCnvGuess(buzzerId, '');
        });

        this.persistSnapshot();
        this.syncRoom();
        return;
      }

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
      let delta = 20; // Final guess points
      if (!isFinalGuess) {
        // Point index: 1 row done = 60, 2 rows done = 50, 3 = 40, 4 = 30
        const pointsTable = GAME_CONFIG.VCNV.CNV_POINTS_BY_ROWS_DONE;
        delta = pointsTable[this.vcnvRowsAskedCount] || 30;
      }

      this.addScore(playerId, 'VCNV', obsQuestion.id, delta, 'correct');

      // Reveal all pieces (0..4), all rows, all letters, and obstacle answer
      const allRowLetters = this.questionSet.vcnv.rows.map((r) =>
        r.answer.toUpperCase().replace(/\s+/g, '').split('')
      );
      const obstacleLetters = obsQuestion.answer.toUpperCase().replace(/\s+/g, '').split('');
      this.room.state = {
        ...this.room.state,
        round: 'VCNV',
        subPhase: 'CNV_RESULT',
        openedPieces: [0, 1, 2, 3, 4],
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
        this.transitionToReady('TANG_TOC');
      });
      return;
    }

    // Wrong guess or timeout: eliminate player from VCNV
    const player = this.room.players.find((p) => p.id === playerId);
    if (player) {
      player.eliminatedVcnv = true;
    }

    this.buzzedPlayerId = null;
    this.pendingCnvBuzzerId = null;
    this.room.state.buzzerLockedBy = null;
    this.room.state.activePlayerId = undefined;

    const revealPayload: RevealPayload = {
      questionId: obsQuestion.id,
      correctAnswer: '',
      results: [{ playerId, answer: guess, isCorrect: false, delta: 0 }],
    };
    this.callbacks.broadcastReveal(revealPayload);

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(this.room.players);
    this.syncRoom();

    // Check if any non-eliminated players remain
    const remainingPlayers = this.room.players.filter((p) => !p.eliminatedVcnv && p.connected);
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
        this.transitionToReady('TANG_TOC');
      });
      return;
    }

    if (isFinalGuess) {
      // Resume final guess countdown for remaining players
      await this.presentVcnvFinalGuess();
    } else {
      // Continue next row
      await this.promptVcnvPickRow(this.vcnvRowsAskedCount);
    }
  }

  private async presentVcnvCenter(): Promise<void> {
    const centerQ = this.questionSet.vcnv.center;
    this.answersMap.clear();

    this.room.state = {
      ...this.room.state,
      round: 'VCNV',
      subPhase: 'CENTER_QUESTION',
      currentQuestion: centerQ,
      deadline: null,
    };

    const durationMs = GAME_CONFIG.VCNV.CENTER_TIME_SECONDS * 1000;
    this.setDeadline(durationMs, async () => {
      await this.revealVcnvCenter(centerQ);
    });

    this.persistSnapshot();
    this.syncRoom();
  }

  private async revealVcnvCenter(question: Question): Promise<void> {
    const results: RevealResult[] = [];
    let atLeastOneCorrect = false;

    for (const p of this.room.players) {
      if (p.eliminatedVcnv) continue;
      const sub = this.answersMap.get(p.id);
      const ans = sub ? sub.answer : '';
      const isCorrect = matchAnswer(ans, question.answer, question.alternatives, {
        ignoreDiacritics: question.ignoreDiacritics,
      });

      const delta = isCorrect ? GAME_CONFIG.VCNV.CENTER_CORRECT_POINTS : 0;
      if (isCorrect) {
        atLeastOneCorrect = true;
        this.addScore(p.id, 'VCNV', question.id, delta, 'correct');
      }

      results.push({ playerId: p.id, answer: ans, isCorrect, delta });
    }

    const openedPieces: number[] = this.room.state.openedPieces || [];
    if (atLeastOneCorrect && !openedPieces.includes(4)) {
      openedPieces.push(4); // Center piece index = 4
    }

    const revealPayload: RevealPayload = {
      questionId: question.id,
      correctAnswer: question.answer,
      results,
    };
    this.lastRevealedPayload = revealPayload;

    this.room.state = {
      ...this.room.state,
      round: 'VCNV',
      subPhase: 'CENTER_REVEAL',
      deadline: null,
      currentQuestion: question,
      openedPieces,
    };

    this.setDeadline(5000, async () => {
      if (this.pendingCnvBuzzerId) {
        const buzzerId = this.pendingCnvBuzzerId;
        this.pendingCnvBuzzerId = null;
        this.answersMap.clear();

        this.room.state = {
          ...this.room.state,
          round: 'VCNV',
          subPhase: 'CNV_ANSWERING',
          activePlayerId: buzzerId,
          buzzerLockedBy: buzzerId,
          currentQuestion: this.questionSet.vcnv.obstacle,
          deadline: null,
        };

        this.setDeadline(GAME_CONFIG.VCNV.CNV_ANSWER_SECONDS * 1000, async () => {
          await this.evaluateCnvGuess(buzzerId, '');
        });

        this.persistSnapshot();
        this.syncRoom();
        return;
      }

      await this.presentVcnvFinalGuess();
    });

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();
  }

  private async presentVcnvFinalGuess(): Promise<void> {
    const nonEliminated = this.room.players.filter((p) => !p.eliminatedVcnv && p.connected);
    if (nonEliminated.length === 0) {
      // Nobody left -> finish VCNV
      this.transitionToReady('TANG_TOC');
      return;
    }

    this.buzzedPlayerId = null;
    this.pendingCnvBuzzerId = null;
    this.buzzerOpenTime = Date.now();
    this.room.state = {
      ...this.room.state,
      round: 'VCNV',
      subPhase: 'FINAL_GUESS',
      deadline: null,
      buzzerLockedBy: null,
      activePlayerId: undefined,
      currentQuestion: this.questionSet.vcnv.obstacle,
    };

    const durationMs = GAME_CONFIG.VCNV.FINAL_GUESS_SECONDS * 1000;
    this.setDeadline(durationMs, async () => {
      // Time expired without final guess
      this.transitionToReady('TANG_TOC');
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
      this.transitionToReady('VE_DICH');
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
    for (const p of this.room.players) {
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
    // G9: Sort players by current score descending, tiebreaker smaller seat
    const sorted = [...this.room.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.seat - b.seat;
    });

    this.veDichPlayerQueue = sorted.map((p) => p.id);
    await this.runVeDichTurn(0);
  }

  private async runVeDichTurn(playerQueueIndex: number): Promise<void> {
    if (playerQueueIndex >= this.veDichPlayerQueue.length) {
      await this.checkFinishOrTiebreak();
      return;
    }

    const activePlayerId = this.veDichPlayerQueue[playerQueueIndex];
    this.buzzedPlayerId = null;
    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'CHOOSE_PACKAGE',
      activePlayerId,
      deadline: null,
      turnIndex: playerQueueIndex,
      buzzerLockedBy: null,
    };

    const chooseSec = GAME_CONFIG.VE_DICH.CHOOSE_PACKAGE_SECONDS;
    this.setDeadline(chooseSec * 1000, async () => {
      // Default package 40 on timeout
      await this.handleVeDichPackageChosen(activePlayerId, GAME_CONFIG.VE_DICH.DEFAULT_PACKAGE, playerQueueIndex);
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
    const turnIndex = this.room.state.turnIndex || 0;
    this.eventQueue.enqueue(async () => {
      await this.handleVeDichPackageChosen(playerId, packagePoints, turnIndex);
    });
    return true;
  }

  private async handleVeDichPackageChosen(
    playerId: string,
    pkg: 40 | 60 | 80,
    turnIndex: number
  ): Promise<void> {
    const questionPointsList = GAME_CONFIG.VE_DICH.PACKAGES[pkg] || [10, 10, 20];
    await this.runVeDichQuestion(playerId, questionPointsList, 0, turnIndex);
  }

  private async runVeDichQuestion(
    playerId: string,
    pointsList: number[],
    questionIdx: number,
    turnIndex: number
  ): Promise<void> {
    if (questionIdx >= 3) {
      // Next player turn
      await this.runVeDichTurn(turnIndex + 1);
      return;
    }

    this.veDichCurrentQuestionIndex = questionIdx;
    const pValue = pointsList[questionIdx];
    this.veDichCurrentQuestionPoints = pValue;
    this.veDichHopeStarActive = false;

    // Pick question from pool
    const pool =
      pValue === 10
        ? this.questionSet.veDich.pool10
        : pValue === 20
        ? this.questionSet.veDich.pool20
        : this.questionSet.veDich.pool30;

    const question = pool[Math.floor(Math.random() * pool.length)] || pool[0];

    // Star decision phase: 10s
    this.buzzedPlayerId = null;
    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'STAR_DECISION',
      activePlayerId: playerId,
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
    }

    this.persistSnapshot();
    this.callbacks.broadcastPlayerUpdate(this.room.players);
    return true;
  }

  private async presentVeDichQuestion(
    playerId: string,
    question: Question,
    points: number,
    pointsList: number[],
    turnIndex: number
  ): Promise<void> {
    this.answersMap.clear();
    this.buzzedPlayerId = null;
    const durationSec = GAME_CONFIG.VE_DICH.QUESTION_TIME_BY_POINTS[points] || 15;

    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'QUESTION',
      activePlayerId: playerId,
      currentQuestion: question,
      deadline: null,
      hopeStarActive: this.veDichHopeStarActive,
      questionPoints: points,
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
        currentQuestion: question,
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

    // Open Steal Buzz (5s) for the other players (G11)
    this.buzzedPlayerId = null;
    this.buzzerOpenTime = Date.now();

    this.room.state = {
      round: 'VE_DICH',
      subPhase: 'STEAL_BUZZ',
      activePlayerId: playerId, // Main player ID
      currentQuestion: question,
      deadline: null,
      buzzerLockedBy: null,
    };

    const stealBuzzSec = GAME_CONFIG.VE_DICH.STEAL_BUZZ_SECONDS;
    this.setDeadline(stealBuzzSec * 1000, async () => {
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
        currentQuestion: question,
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
    const mainPlayerId = this.veDichPlayerQueue[this.room.state.turnIndex || 0];
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
      currentQuestion: question,
      deadline: null,
      buzzerLockedBy: null,
    };

    this.callbacks.broadcastReveal(revealPayload);
    this.persistSnapshot();
    this.syncRoom();

    const turnIndex = this.room.state.turnIndex || 0;
    const pointsList = [10, 20, 30]; // fallback
    this.setDeadline(3000, async () => {
      await this.runVeDichQuestion(mainPlayerId, pointsList, this.veDichCurrentQuestionIndex + 1, turnIndex);
    });
  }

  // --- TIEBREAK & FINISHED ---

  private async checkFinishOrTiebreak(): Promise<void> {
    // Sort players by score
    const sorted = [...this.room.players].sort((a, b) => b.score - a.score);
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

  private async finishGame(winnerId?: string): Promise<void> {
    this.room.status = 'FINISHED';
    const sorted = [...this.room.players].sort((a, b) => b.score - a.score);
    const finalWinnerId = winnerId || sorted[0].id;

    this.room.state = {
      round: 'FINISHED',
      subPhase: 'PODIUM',
      winnerId: finalWinnerId,
      deadline: null,
    };

    this.persistSnapshot();
    this.syncRoom();
  }
}
