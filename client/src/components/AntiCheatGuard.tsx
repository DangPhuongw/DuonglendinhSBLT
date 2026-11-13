import React, { useEffect, useState } from 'react';
import { ShieldX, AlertTriangle } from 'lucide-react';
import { GAME_CONFIG, TabLeaveReason } from '@olympia/shared';
import { useGameStore } from '../store/gameStore';
import { FREE_WARNINGS } from '../utils/antiCheatRules';

/**
 * Chống gian lận rời tab.
 * - Phát hiện khi thí sinh chuyển tab / thu nhỏ cửa sổ quá 2 giây trong lúc câu hỏi đang mở
 *   (Page Visibility API) và báo lên server. Mất focus mà trang vẫn hiện (chỉnh âm lượng...) không tính.
 * - Server quyết định: lần 1, 2 cảnh cáo; từ lần 3 mỗi lần trừ điểm; rồi thông báo cho cả phòng.
 * Lưu ý: trình duyệt chỉ cho PHÁT HIỆN, không chặn được việc tra cứu bằng thiết bị khác.
 */
export const AntiCheatGuard: React.FC = () => {
  const socket = useGameStore((s) => s.socket);
  const room = useGameStore((s) => s.room);
  const me = useGameStore((s) => s.player);
  const alert = useGameStore((s) => s.antiCheatAlert);

  const round = room?.state?.round;
  const subPhase = room?.state?.subPhase;
  const isContestant = Boolean(me && (me.role || 'player') === 'player');
  const guardActive =
    GAME_CONFIG.ANTI_CHEAT.ENABLED &&
    Boolean(socket) &&
    isContestant &&
    !me?.disqualified &&
    Boolean(round && GAME_CONFIG.ANTI_CHEAT.ACTIVE_ROUNDS.includes(round)) &&
    Boolean(subPhase && GAME_CONFIG.ANTI_CHEAT.ACTIVE_SUB_PHASES.includes(subPhase));

  // 1. Theo dõi rời tab
  useEffect(() => {
    if (!guardActive || !socket) return;

    // Chỉ theo dõi việc trang bị ẩn (chuyển tab / thu nhỏ). Không dùng sự kiện mất focus (blur): chỉnh âm
    // lượng, bấm thông báo hay bấm sang màn hình phụ làm mất focus nhưng người chơi vẫn đang nhìn trò chơi.
    let reported = false; // đã báo cho lần rời tab hiện tại
    let unloading = false; // Tải lại / đóng trang không tính là rời tab
    let hiddenTimer: ReturnType<typeof setTimeout> | null = null;

    const cancelTimer = () => {
      if (hiddenTimer) {
        clearTimeout(hiddenTimer);
        hiddenTimer = null;
      }
    };
    // Ẩn quá HIDDEN_GRACE_MS mới tính; quay lại trước đó (lỡ tay) thì bỏ qua.
    // Trình duyệt có thể bắn sự kiện "hidden" lặp lại khi trang vẫn đang ẩn: giữ nguyên mốc bắt đầu,
    // không đếm lại từ đầu (nếu không, sự kiện lặp sẽ làm không bao giờ đủ 2 giây).
    const startHiddenTimer = () => {
      if (hiddenTimer || reported) return;
      hiddenTimer = setTimeout(() => {
        hiddenTimer = null;
        if (document.visibilityState === 'hidden' && !reported && !unloading) {
          reported = true;
          socket.emit('anticheat:leave', { reason: 'hidden' as TabLeaveReason });
        }
      }, GAME_CONFIG.ANTI_CHEAT.HIDDEN_GRACE_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        startHiddenTimer();
      } else {
        cancelTimer();
        reported = false;
      }
    };
    const onUnload = () => {
      unloading = true;
    };

    // Câu hỏi mở ra khi đang ở tab khác -> bắt đầu tính từ lúc này
    if (document.visibilityState === 'hidden') startHiddenTimer();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    return () => {
      cancelTimer();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
    };
  }, [guardActive, socket]);

  // 2. Hiển thị cảnh báo
  const [modalFor, setModalFor] = useState<number | null>(null); // receivedAt của cảnh báo đang mở
  const [toastFor, setToastFor] = useState<number | null>(null);

  useEffect(() => {
    if (!alert || !me) return;
    if (alert.playerId === me.id) {
      setModalFor(alert.receivedAt);
    } else {
      setToastFor(alert.receivedAt);
      const t = setTimeout(() => setToastFor(null), 6000);
      return () => clearTimeout(t);
    }
  }, [alert, me?.id]);

  const showModal = alert && me && alert.playerId === me.id && modalFor === alert.receivedAt;
  const showToast = alert && me && alert.playerId !== me.id && toastFor === alert.receivedAt;
  const leaveCount = me?.tabLeaveCount || 0;
  const warnedOnce = isContestant && !me?.disqualified && leaveCount > 0;
  const cfg = GAME_CONFIG.ANTI_CHEAT;
  const penaltiesSoFar = Math.max(0, leaveCount - FREE_WARNINGS) * cfg.PENALTY_POINTS;
  const badgeText =
    leaveCount <= FREE_WARNINGS
      ? `Đã cảnh cáo ${leaveCount}/${FREE_WARNINGS} – lần thứ ${cfg.PENALTY_FROM_VIOLATION} sẽ bị trừ ${cfg.PENALTY_POINTS} điểm`
      : `Đã rời tab ${leaveCount} lần – đã bị trừ ${penaltiesSoFar} điểm, mỗi lần nữa trừ ${cfg.PENALTY_POINTS} điểm`;

  return (
    <>
      {/* Luật được nhắc ở Sảnh chờ và trong phần trình chiếu luật của màn Sẵn sàng (RulesExplainer) */}

      {/* Nhãn đã bị cảnh cáo (cho chính thí sinh) */}
      {warnedOnce && !showModal && (
        <div className="fixed top-16 right-3 z-40 max-w-[92vw] flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FF5D8F] text-white text-xs sm:text-sm font-black shadow-[0_0_18px_rgba(255,93,143,0.27)] pointer-events-none animate-pulse">
          <AlertTriangle size={15} />
          {badgeText}
        </div>
      )}

      {/* Toast cho cả phòng */}
      {showToast && alert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2A0F24]/95 border-2 border-[#FF5D8F] text-white text-sm sm:text-base font-bold shadow-[0_0_30px_rgba(255,93,143,0.23)]">
          {alert.disqualified ? (
            <ShieldX size={20} className="text-[#FF5D8F] shrink-0" />
          ) : (
            <AlertTriangle size={20} className="text-[#FF5D8F] shrink-0" />
          )}
          <span>
            {alert.disqualified
              ? `${alert.playerName} đã bị LOẠI vì rời tab lần ${alert.count}`
              : alert.penalty > 0
              ? `${alert.playerName} rời tab lần ${alert.count} – bị trừ ${alert.penalty} điểm`
              : `${alert.playerName} rời tab trò chơi – cảnh cáo lần ${alert.count}`}
          </span>
        </div>
      )}

      {/* Cảnh báo đỏ toàn màn hình cho người vi phạm */}
      {showModal && alert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A0F24]/88 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border-4 border-[#FF5D8F] bg-[#2A0F24] p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(255,93,143,0.32)] animate-[pulse_1.2s_ease-in-out_2]">
            {alert.disqualified ? (
              <ShieldX size={64} className="mx-auto text-[#FF5D8F]" />
            ) : (
              <AlertTriangle size={64} className="mx-auto text-[#FF5D8F]" />
            )}
            <h2 className="mt-4 text-2xl sm:text-3xl font-heading font-black text-[#FF5D8F] uppercase tracking-wide">
              {alert.disqualified
                ? 'Bạn đã bị loại'
                : alert.penalty > 0
                ? `Bị trừ ${alert.penalty} điểm`
                : `Cảnh cáo lần ${alert.count}/${FREE_WARNINGS}`}
            </h2>
            <p className="mt-3 text-[#EEF0FF] text-sm sm:text-base leading-relaxed">
              {alert.disqualified
                ? `Bạn đã rời khỏi tab trò chơi ${alert.count} lần trong lúc thi. Bạn bị loại khỏi trận đấu và chỉ có thể tiếp tục theo dõi.`
                : alert.penalty > 0
                ? `Bạn đã rời khỏi tab trò chơi lần thứ ${alert.count} trong lúc thi nên bị trừ ${alert.penalty} điểm. Cả phòng đã được thông báo.`
                : 'Hệ thống phát hiện bạn vừa rời khỏi tab trò chơi trong lúc thi. Cả phòng đã được thông báo.'}
            </p>
            {!alert.disqualified && (
              <p className="mt-3 text-[#F7C873] font-bold text-sm sm:text-base">
                {alert.penalty > 0
                  ? `Mỗi lần rời tab tiếp theo sẽ bị trừ thêm ${cfg.PENALTY_POINTS} điểm.`
                  : alert.count >= FREE_WARNINGS
                  ? `Lần rời tab tiếp theo sẽ bị trừ ${cfg.PENALTY_POINTS} điểm.`
                  : `Từ lần thứ ${cfg.PENALTY_FROM_VIOLATION}, mỗi lần rời tab bị trừ ${cfg.PENALTY_POINTS} điểm.`}
              </p>
            )}
            <button
              onClick={() => setModalFor(null)}
              className="mt-6 w-full py-3 rounded-xl bg-[#FF5D8F] hover:bg-[#FF7FA6] text-white font-heading font-black uppercase tracking-wider transition-colors"
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
