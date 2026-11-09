import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldX, AlertTriangle } from 'lucide-react';
import { GAME_CONFIG, TabLeaveReason } from '@olympia/shared';
import { useGameStore } from '../store/gameStore';

/**
 * Chống gian lận rời tab.
 * - Phát hiện khi thí sinh chuyển tab / thu nhỏ / bấm sang cửa sổ khác trong lúc thi
 *   (Page Visibility API + sự kiện blur của cửa sổ) và báo lên server.
 * - Server quyết định: lần 1 cảnh cáo đỏ, lần 2 loại khỏi trận, rồi thông báo cho cả phòng.
 * Lưu ý: trình duyệt chỉ cho PHÁT HIỆN, không chặn được việc tra cứu bằng thiết bị khác.
 */
export const AntiCheatGuard: React.FC = () => {
  const socket = useGameStore((s) => s.socket);
  const room = useGameStore((s) => s.room);
  const me = useGameStore((s) => s.player);
  const alert = useGameStore((s) => s.antiCheatAlert);

  const round = room?.state?.round;
  const isContestant = Boolean(me && (me.role || 'player') === 'player');
  const guardActive =
    GAME_CONFIG.ANTI_CHEAT.ENABLED &&
    Boolean(socket) &&
    isContestant &&
    !me?.disqualified &&
    Boolean(round && GAME_CONFIG.ANTI_CHEAT.ACTIVE_ROUNDS.includes(round));

  // 1. Theo dõi rời tab
  useEffect(() => {
    if (!guardActive || !socket) return;

    let away = false;
    let unloading = false; // Tải lại / đóng trang không tính là rời tab

    const report = (reason: TabLeaveReason) => {
      if (away || unloading) return;
      away = true;
      socket.emit('anticheat:leave', { reason });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') report('hidden');
      else if (document.hasFocus()) away = false;
    };
    const onBlur = () => report('blur');
    const onFocus = () => {
      away = false;
    };
    const onUnload = () => {
      unloading = true;
    };

    // Vào vòng thi khi đang ở tab khác -> tính luôn
    if (document.visibilityState === 'hidden') report('hidden');

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
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
  const warnedOnce = isContestant && !me?.disqualified && (me?.tabLeaveCount || 0) > 0;
  const maxWarnings = GAME_CONFIG.ANTI_CHEAT.MAX_WARNINGS;

  return (
    <>
      {/* Nhắc luật ở màn Sẵn sàng */}
      {round === 'READY' && isContestant && GAME_CONFIG.ANTI_CHEAT.ENABLED && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF496C]/15 border border-[#FF496C]/50 text-[#FFB4C2] text-xs sm:text-sm font-bold shadow-lg pointer-events-none">
          <ShieldAlert size={16} className="text-[#FF496C]" />
          Chống gian lận: rời tab lần 1 bị cảnh cáo, lần 2 bị loại khỏi trận
        </div>
      )}

      {/* Nhãn đã bị cảnh cáo (cho chính thí sinh) */}
      {warnedOnce && !showModal && (
        <div className="fixed top-16 right-3 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF496C] text-white text-xs sm:text-sm font-black shadow-[0_0_18px_rgba(255,73,108,0.6)] pointer-events-none animate-pulse">
          <AlertTriangle size={15} />
          Đã cảnh cáo {me?.tabLeaveCount}/{maxWarnings} – rời tab lần nữa sẽ bị loại
        </div>
      )}

      {/* Toast cho cả phòng */}
      {showToast && alert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B0D18]/95 border-2 border-[#FF496C] text-white text-sm sm:text-base font-bold shadow-[0_0_30px_rgba(255,73,108,0.5)]">
          {alert.disqualified ? (
            <ShieldX size={20} className="text-[#FF496C] shrink-0" />
          ) : (
            <AlertTriangle size={20} className="text-[#FF496C] shrink-0" />
          )}
          <span>
            {alert.disqualified
              ? `${alert.playerName} đã bị LOẠI vì rời tab lần ${alert.count}`
              : `${alert.playerName} rời tab trò chơi – cảnh cáo lần ${alert.count}`}
          </span>
        </div>
      )}

      {/* Cảnh báo đỏ toàn màn hình cho người vi phạm */}
      {showModal && alert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2A0610]/85 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border-4 border-[#FF496C] bg-[#1A0710] p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(255,73,108,0.7)] animate-[pulse_1.2s_ease-in-out_2]">
            {alert.disqualified ? (
              <ShieldX size={64} className="mx-auto text-[#FF496C]" />
            ) : (
              <AlertTriangle size={64} className="mx-auto text-[#FF496C]" />
            )}
            <h2 className="mt-4 text-2xl sm:text-3xl font-heading font-black text-[#FF496C] uppercase tracking-wide">
              {alert.disqualified ? 'Bạn đã bị loại' : `Cảnh báo lần ${alert.count}`}
            </h2>
            <p className="mt-3 text-[#F8FAFC] text-sm sm:text-base leading-relaxed">
              {alert.disqualified
                ? 'Bạn đã rời khỏi tab trò chơi lần thứ hai trong lúc thi. Bạn bị loại khỏi trận đấu và chỉ có thể tiếp tục theo dõi.'
                : 'Hệ thống phát hiện bạn vừa rời khỏi tab trò chơi trong lúc thi. Cả phòng đã được thông báo.'}
            </p>
            {!alert.disqualified && (
              <p className="mt-3 text-[#FFD43B] font-bold text-sm sm:text-base">
                Nếu tái phạm, bạn sẽ bị LOẠI khỏi trận.
              </p>
            )}
            <button
              onClick={() => setModalFor(null)}
              className="mt-6 w-full py-3 rounded-xl bg-[#FF496C] hover:bg-[#ff5f7e] text-white font-heading font-black uppercase tracking-wider transition-colors"
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
