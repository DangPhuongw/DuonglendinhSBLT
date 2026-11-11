import { GAME_CONFIG } from '@olympia/shared';

const cfg = GAME_CONFIG.ANTI_CHEAT;

/** Số lần chỉ bị cảnh cáo trước khi bắt đầu trừ điểm. */
export const FREE_WARNINGS = cfg.PENALTY_FROM_VIOLATION - 1;

const warningPart =
  FREE_WARNINGS <= 0
    ? ''
    : FREE_WARNINGS === 1
    ? 'lần 1 bị cảnh cáo; '
    : FREE_WARNINGS === 2
    ? 'lần 1 và lần 2 bị cảnh cáo; '
    : `lần 1 đến lần ${FREE_WARNINGS} bị cảnh cáo; `;

/** Luật chống gian lận, hiển thị cho thí sinh trước khi trận đấu bắt đầu. */
export const ANTI_CHEAT_RULE = `Chuyển tab hoặc thu nhỏ cửa sổ trò chơi khi câu hỏi đang mở: ${warningPart}từ lần thứ ${cfg.PENALTY_FROM_VIOLATION}, mỗi lần vi phạm bị trừ ${cfg.PENALTY_POINTS} điểm.`;
