export const GAME_CONFIG = {
  MAX_PLAYERS: 5,                  // Tối đa 5 thí sinh
  MAX_VIEWERS: 5,                  // Tối đa 5 người theo dõi / khán giả
  MIN_PLAYERS_FOR_TEST: 2,
  NETWORK_GRACE_MS: 300,           // Bù trễ mạng khi nhận đáp án sau deadline
  DISCONNECT_HOLD_SECONDS: 60,     // Giữ ghế 60s khi mất kết nối (G15)
  ROOM_IDLE_TIMEOUT_MS: 2 * 60 * 60 * 1000, // Tự xóa phòng sau 2 giờ không hoạt động
  HOST_OVERRIDE_WINDOW_SECONDS: 10,// Thời gian chủ phòng được sửa kết quả chấm sau REVEAL
  READY_COUNTDOWN_SECONDS: 3,      // Đếm ngược sau khi tất cả bấm Sẵn sàng

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
    MAX_WARNINGS: 1,               // Số lần được cảnh cáo; vi phạm lần kế tiếp -> bị loại
    DEDUPE_MS: 2000,               // Gộp các tín hiệu (blur + hidden) trong 2s thành 1 lần vi phạm
    // Mất focus cửa sổ (blur) chỉ tính vi phạm nếu kéo dài quá thời gian này. Tránh báo nhầm khi bấm vào
    // thanh địa chỉ, khung media, hộp thoại hệ thống... Chuyển tab / thu nhỏ (hidden) vẫn tính ngay.
    BLUR_GRACE_MS: 1500,
    // Chỉ tính vi phạm trong các vòng đang thi (không tính ở Sảnh chờ / màn Sẵn sàng / Kết thúc)
    ACTIVE_ROUNDS: ['KD_RIENG', 'KD_CHUNG', 'VCNV', 'TANG_TOC', 'VE_DICH', 'TIEBREAK'] as string[],
  },

  KHOI_DONG: {
    RIENG_QUESTIONS_PER_PLAYER: 6,
    RIENG_TIME_SECONDS: 15,
    RIENG_CORRECT_POINTS: 10,
    RIENG_WRONG_POINTS: 0,
    CHUNG_QUESTIONS: 12,
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
