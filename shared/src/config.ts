export const DIFFICULTY_LABELS: Record<'easy' | 'medium' | 'hard', string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
};

export const GAME_CONFIG = {
  MAX_PLAYERS: 5,                  // Tối đa 5 thí sinh
  MAX_VIEWERS: 5,                  // Tối đa 5 người theo dõi / khán giả
  MIN_PLAYERS_FOR_TEST: 2,
  NETWORK_GRACE_MS: 300,           // Bù trễ mạng khi nhận đáp án sau deadline
  DISCONNECT_HOLD_SECONDS: 60,     // Giữ ghế 60s khi mất kết nối (G15)
  ROOM_IDLE_TIMEOUT_MS: 2 * 60 * 60 * 1000, // Tự xóa phòng sau 2 giờ không hoạt động
  HOST_OVERRIDE_WINDOW_SECONDS: 10,// Thời gian chủ phòng được sửa kết quả chấm sau REVEAL
  READY_COUNTDOWN_SECONDS: 3,      // Đếm ngược sau khi tất cả bấm Sẵn sàng

  // Chuông bị khóa trong N giây đầu của mỗi lượt giành chuông (Khởi động chung, cướp điểm Về đích).
  // Thời gian khóa được cộng thêm vào lượt: thời gian bấm chuông thực sự (15s / 5s) không bị rút ngắn.
  BUZZ_LOCK_SECONDS: 3,

  // Màn công bố điểm sau mỗi vòng (server và client dùng chung để khớp thời gian hiệu ứng)
  ROUND_RESULTS: {
    START_DELAY_MS: 1200,          // Hiện tiêu đề trước khi tên đầu tiên bay vào
    STAGGER_MS: 1100,              // Khoảng cách giữa 2 tên liên tiếp
    ENTRY_MS: 750,                 // Thời gian 1 tên bay từ trái vào giữa
    HOLD_MS: 3500,                 // Giữ bảng điểm sau khi tên cuối cùng xuất hiện
    FADE_MS: 900,                  // Mờ dần trước khi chuyển màn
  },

  ANTI_CHEAT: {
    ENABLED: true,                 // Bật/tắt cơ chế phát hiện rời tab
    // Lần 1, 2: cảnh cáo. Từ lần PENALTY_FROM_VIOLATION (lần 3) trở đi: mỗi lần trừ PENALTY_POINTS điểm.
    PENALTY_FROM_VIOLATION: 3,
    PENALTY_POINTS: 20,
    // Tự loại khỏi trận ở lần vi phạm thứ N. 0 = không bao giờ tự loại (mặc định).
    DISQUALIFY_AT_VIOLATION: 0,
    DEDUPE_MS: 2000,               // Gộp các tín hiệu (blur + hidden) trong 2s thành 1 lần vi phạm
    // Chỉ tính khi trang thật sự bị ẩn (chuyển tab, thu nhỏ cửa sổ, chuyển ứng dụng toàn màn hình).
    // Mất focus mà trang vẫn hiện (chỉnh âm lượng, bấm thông báo, bấm sang màn hình phụ...) KHÔNG tính.
    // Ẩn dưới HIDDEN_GRACE_MS (lỡ tay) cũng bỏ qua.
    HIDDEN_GRACE_MS: 2000,
    // Chỉ tính trong các vòng đang thi...
    ACTIVE_ROUNDS: ['KD_RIENG', 'KD_CHUNG', 'VCNV', 'TANG_TOC', 'VE_DICH', 'TIEBREAK'] as string[],
    // ...và chỉ khi câu hỏi đang mở (đồng hồ trả lời / giành chuông đang chạy). Lúc chọn gói, chọn hàng,
    // công bố đáp án... rời tab không bị tính vì không có gì để tra cứu.
    ACTIVE_SUB_PHASES: [
      'QUESTION', 'QUESTION_BUZZ', 'ANSWERING',                       // Khởi động, Tăng tốc, Về đích
      'ROW_QUESTION', 'CENTER_QUESTION', 'CNV_ANSWERING',             // VCNV
      'FINAL_GUESS', 'FINAL_GUESS_ANSWERING',
      'STAR_DECISION', 'STEAL_BUZZ', 'STEAL_ANSWER',                  // Về đích
      'WAIT_SIGNAL', 'BUZZ_OPEN',                                     // Câu hỏi phụ
    ] as string[],
  },

  KHOI_DONG: {
    RIENG_QUESTIONS_PER_PLAYER: 6,
    // Mỗi ô Khởi động riêng: 4 câu dễ + 2 câu trung bình (thứ tự trộn lẫn) (tổng = RIENG_QUESTIONS_PER_PLAYER)
    RIENG_DIFFICULTY: { easy: 4, medium: 2, hard: 0 },
    RIENG_TIME_SECONDS: 15,
    RIENG_CORRECT_POINTS: 10,
    RIENG_WRONG_POINTS: 0,
    CHUNG_QUESTIONS: 12,
    // Khởi động chung: 5 dễ, 4 trung bình, 3 khó (thứ tự trộn lẫn) (tổng = CHUNG_QUESTIONS)
    CHUNG_DIFFICULTY: { easy: 5, medium: 4, hard: 3 },
    CHUNG_BUZZ_SECONDS: 15,
    CHUNG_ANSWER_SECONDS: 3,
    CHUNG_CORRECT_POINTS: 10,
    CHUNG_WRONG_OR_TIMEOUT_POINTS: -5, // G2: Trừ 5 điểm và qua câu mới ngay
  },

  VCNV: {
    ROW_COUNT: 4,
    ROW_TIME_SECONDS: 30,             // 30 giây suy nghĩ và trả lời cho mỗi câu hỏi hàng ngang
    ROW_CORRECT_POINTS: 10,
    CNV_ANSWER_SECONDS: 15,
    CNV_POINTS_BY_ROWS_DONE: [60, 60, 50, 40, 30], // Index = số hàng ngang đã hỏi xong (1->60, 2->50, 3->40, 4->30)
    CENTER_TIME_SECONDS: 30,          // 30 giây suy nghĩ và trả lời cho câu hỏi ô trung tâm
    CENTER_CORRECT_POINTS: 10,
    FINAL_GUESS_SECONDS: 15,
    FINAL_GUESS_CORRECT_POINTS: 20,
  },

  TANG_TOC: {
    QUESTION_COUNT: 4,
    TIME_SECONDS: 30,
    REVEAL_SECONDS: 6,
    TIE_THRESHOLD_MS: 50,          // G8: Nộp cách nhau <= 50ms tính đồng hạng
    POINTS_BY_RANK: [30, 25, 20, 15, 10],
  },

  VE_DICH: {
    CHOOSE_PACKAGE_SECONDS: 20,
    DEFAULT_PACKAGE: 40 as const,
    PACKAGES: {
      40: [10, 10, 20],
      60: [10, 20, 30],
      80: [20, 30, 30],
    },
    // Độ khó theo mức điểm: 10 điểm = dễ, 20 điểm = trung bình, 30 điểm = khó
    DIFFICULTY_BY_POINTS: { 10: 'easy', 20: 'medium', 30: 'hard' } as Record<number, 'easy' | 'medium' | 'hard'>,
    STAR_DECISION_SECONDS: 7,
    QUESTION_TIME_BY_POINTS: {
      10: 20,
      20: 20,
      30: 20,
    } as Record<number, number>,
    STEAL_BUZZ_SECONDS: 5,
    STEAL_ANSWER_SECONDS: 10,
  },

  TIEBREAK: {
    MAX_QUESTIONS: 3,
    WAIT_SIGNAL_SECONDS: 3,        // G14: Bấm chuông trong 3s này bị mất quyền câu đó
    BUZZ_OPEN_SECONDS: 15,
    ANSWER_SECONDS: 10,
  },
};
