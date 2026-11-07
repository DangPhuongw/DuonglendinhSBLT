export type RoundType =
  | 'LOBBY'
  | 'READY'
  | 'KD_RIENG'
  | 'KD_CHUNG'
  | 'VCNV'
  | 'TANG_TOC'
  | 'VE_DICH'
  | 'TIEBREAK'
  | 'FINISHED';

export type PlayerRole = 'player' | 'viewer';

export interface Player {
  id: string;
  name: string;
  seat: 1 | 2 | 3 | 4 | 5;
  role?: PlayerRole;
  token: string;
  connected: boolean;
  disconnectedAt?: number;
  ready: boolean;
  mediaLoaded?: boolean;
  eliminatedVcnv: boolean;
  starUsed: boolean;
  score: number;
  roundScores: {
    kd: number;
    vcnv: number;
    tt: number;
    vd: number;
  };
}

export interface Question {
  id: string;
  type: 'mcq' | 'text';
  prompt: string;
  options?: [string, string, string, string]; // A, B, C, D
  answer: string;                             // Chỉ lưu ở Server, xóa khi gửi xuống Client trước REVEAL
  alternatives: string[];                     // Các đáp án tương đương
  ignoreDiacritics?: boolean;                 // Tùy chọn bỏ qua dấu tiếng Việt theo câu
  media?: string;                             // Đường dẫn file ảnh/video trong thư mục uploads
  timeLimit?: number;
  points?: 10 | 20 | 30;
}

export type ClientQuestion = Omit<Question, 'answer' | 'alternatives'>;

export interface QuestionSet {
  id: string;
  title: string;
  khoiDong: {
    rieng: Question[][]; // [5 người][5 câu]
    chung: Question[];   // [10 câu]
  };
  vcnv: {
    rows: Question[];    // 4 hàng ngang
    center: Question;    // 1 câu trung tâm
    obstacle: Question;  // Chướng ngại vật (CNV)
    image?: string;      // Tùy chọn (đã bỏ tính năng hé mở ảnh)
  };
  tangToc: Question[];   // 4 câu
  veDich: {
    pool10: Question[];  // Tối thiểu 10 câu
    pool20: Question[];  // Tối thiểu 5 câu (khuyến nghị 10)
    pool30: Question[];  // Tối thiểu 10 câu
  };
  tieBreak: Question[];  // Tối thiểu 3 câu
}

export type ScoreReason =
  | 'correct'
  | 'wrong'
  | 'star_correct'
  | 'star_wrong'
  | 'steal_correct'
  | 'steal_wrong'
  | 'host_override';

export interface ScoreEvent {
  id: string;
  round: RoundType;
  questionId: string;
  playerId: string;
  delta: number;
  reason: ScoreReason | string;
  at: number;
}

export interface RevealResult {
  playerId: string;
  answer: string;
  isCorrect: boolean;
  timeSec?: number;
  delta: number;
}

export interface RevealPayload {
  questionId: string;
  correctAnswer: string;
  results: RevealResult[];
  explanation?: string;
  overrideWindowExpiresAt?: number;
}

export interface RoomState {
  round: RoundType;
  targetRound?: RoundType; // For READY screen (e.g. targetRound: 'KD_RIENG')
  subPhase: string;
  deadline: number | null; // Server timestamp
  currentQuestion?: ClientQuestion;
  activePlayerId?: string;
  buzzerLockedBy?: string | null;
  rowLetterCounts?: number[];
  rowAnswersRevealed?: (string[] | null)[];
  activeRowIndex?: number;
  stepIndex?: number;
  kdPackages?: { index: number; name: string; count: number; chosenBy?: string; chosenByName?: string }[];
  kdChosenPackageIndex?: number;
  vcnvImage?: string;
  obstacleLetterCount?: number;
  obstacleAnswerRevealed?: string[] | null;
  vcnvQuestionsAppearedCount?: number;
  // Additional dynamic state fields
  [key: string]: any;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoundType;
  players: Player[];
  questionSetId: string;
  state: RoomState;
  history: ScoreEvent[];
  createdAt: number;
  updatedAt: number;
}

// Socket events interfaces
export interface ServerToClientEvents {
  'state:sync': (room: Room) => void;
  'phase:change': (data: {
    round: RoundType;
    subPhase: string;
    deadline: number | null;
    question?: ClientQuestion;
    metadata?: any;
  }) => void;
  'buzz:won': (data: { winnerId: string; winnerName: string; diffMs?: number }) => void;
  'buzz:rejected': (data: { reason: string }) => void;
  'answer:ack': (data: { questionId: string; receivedAt: number }) => void;
  'reveal': (data: RevealPayload) => void;
  'score:update': (data: { scores: Record<string, number>; lastEvents: ScoreEvent[] }) => void;
  'player:update': (players: Player[]) => void;
  'time:pong': (data: { clientSentAt: number; serverReceivedAt: number }) => void;
  'player:kicked': (data: { reason: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: { name: string }, callback: (res: { ok: boolean; token?: string; seat?: number; roomCode?: string; player?: Player; room?: Room; error?: string }) => void) => void;
  'room:join': (data: { name: string; roomCode: string }, callback: (res: { ok: boolean; token?: string; seat?: number; roomCode?: string; player?: Player; room?: Room; error?: string }) => void) => void;
  'room:rejoin': (data: { roomCode: string; token: string }, callback: (res: { ok: boolean; player?: Player; room?: Room; error?: string }) => void) => void;
  'room:switchSeat': (data: { targetRole: 'player' | 'viewer'; targetSeat: 1 | 2 | 3 | 4 | 5 }, callback?: (res: { ok: boolean; error?: string }) => void) => void;
  'room:start': () => void;
  'player:ready': (data: { mediaLoaded: boolean }) => void;
  'answer:submit': (data: { questionId: string; content: string }) => void;
  'buzz': (data: { questionId?: string }) => void;
  'kd:choosePackage': (data: { packageIndex: number }) => void;
  'vcnv:pickRow': (data: { rowIndex: number }) => void;
  'vd:choosePackage': (data: { packagePoints: 40 | 60 | 80 }) => void;
  'vd:setStar': (data: { useStar: boolean }) => void;
  'host:overrideScore': (data: { questionId: string; playerId: string; isCorrect: boolean }) => void;
  'host:skipAbsent': (data: { playerId: string }) => void;
  'host:kickPlayer': (data: { playerId: string }) => void;
  'dev:jumpRound': (data: { targetRound: string }) => void;
  'dev:forceStartRound'?: () => void;
  'time:ping': (data: { clientSentAt: number }) => void;
}
