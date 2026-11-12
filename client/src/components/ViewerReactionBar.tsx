import React, { useEffect, useRef, useState } from 'react';
import { GAME_CONFIG, ViewerReactionKind } from '@olympia/shared';
import { SmilePlus, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

/**
 * Bảng thả cảm xúc cho khán giả: nút tròn góc phải, bấm mở ra hàng emoji và bộ tin nhắn cố định.
 * Sau mỗi lần thả có thời gian chờ ngắn (server cũng chặn spam, client chỉ hiển thị cho dễ hiểu).
 */
export const ViewerReactionBar: React.FC = () => {
  const isViewer = useGameStore((s) => s.player?.role === 'viewer');
  const round = useGameStore((s) => s.room?.state.round);
  const sendReaction = useGameStore((s) => s.sendReaction);
  const [open, setOpen] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [notice, setNotice] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const coolingDown = now < cooldownUntil;

  // Đồng hồ cho vòng đếm thời gian chờ
  useEffect(() => {
    if (!coolingDown) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [coolingDown]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 2200);
    return () => clearTimeout(t);
  }, [notice]);

  // Bấm ra ngoài thì thu bảng lại
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  if (!isViewer || !round) return null;

  const send = async (kind: ViewerReactionKind, index: number) => {
    if (coolingDown) return;
    const start = Date.now();
    setCooldownUntil(start + GAME_CONFIG.VIEWER_REACTIONS.MIN_INTERVAL_MS);
    setNow(start);
    const res = await sendReaction(kind, index);
    if (!res.ok) {
      if (res.retryInMs) setCooldownUntil(Date.now() + res.retryInMs);
      setNow(Date.now());
      setNotice(res.error || 'Chưa gửi được.');
    }
  };

  const total = GAME_CONFIG.VIEWER_REACTIONS.MIN_INTERVAL_MS;
  const remain = Math.max(0, cooldownUntil - now);
  const progress = coolingDown ? Math.min(1, remain / Math.max(total, remain)) : 0;
  const inLobby = round === 'LOBBY';

  return (
    <div
      ref={panelRef}
      className={`fixed right-3 sm:right-5 z-40 flex flex-col items-end gap-2 ${inLobby ? 'bottom-4' : 'bottom-28 sm:bottom-32'}`}
    >
      {notice && (
        <div className="rx-fade-up max-w-[260px] rounded-xl bg-[#111827] border border-[#FFD43B]/50 px-3 py-1.5 text-xs font-bold text-[#FFD43B] shadow-lg" role="status">
          {notice}
        </div>
      )}

      {open && (
        <div className="rx-pop w-[min(92vw,340px)] rounded-2xl bg-[#111827]/95 border border-[#303D52] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-heading font-black uppercase tracking-wider text-[#00D9FF]">Thả cảm xúc</span>
            <button onClick={() => setOpen(false)} className="text-[#64748B] hover:text-[#F8FAFC] cursor-pointer" aria-label="Đóng">
              <X size={15} />
            </button>
          </div>

          <div className={`grid grid-cols-5 gap-1.5 transition-opacity ${coolingDown ? 'opacity-40' : ''}`}>
            {GAME_CONFIG.VIEWER_REACTIONS.EMOJIS.map((emoji, i) => (
              <button
                key={emoji}
                onClick={() => send('emoji', i)}
                disabled={coolingDown}
                className="h-11 rounded-xl bg-[#1C2638] hover:bg-[#24324a] border border-[#303D52] text-2xl leading-none cursor-pointer active:scale-90 transition-transform disabled:cursor-not-allowed"
                aria-label={`Thả ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className={`mt-2 flex flex-wrap gap-1.5 transition-opacity ${coolingDown ? 'opacity-40' : ''}`}>
            {GAME_CONFIG.VIEWER_REACTIONS.MESSAGES.map((msg, i) => (
              <button
                key={msg}
                onClick={() => send('message', i)}
                disabled={coolingDown}
                className="px-2.5 py-1 rounded-full bg-[#0E1524] hover:bg-[#162132] border border-[#00D9FF]/40 hover:border-[#00D9FF] text-xs sm:text-sm font-heading font-bold text-[#F8FAFC] cursor-pointer active:scale-95 transition-all disabled:cursor-not-allowed"
              >
                {msg}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#00D9FF] text-[#090D18] shadow-glow-cyan flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        aria-expanded={open}
        aria-label="Thả cảm xúc"
        title="Thả cảm xúc"
      >
        <SmilePlus size={24} />
        {coolingDown && (
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="16.5" fill="none" stroke="#090D18" strokeOpacity="0.55" strokeWidth="3" strokeDasharray={`${(progress * 103.7).toFixed(1)} 103.7`} />
          </svg>
        )}
      </button>
    </div>
  );
};
