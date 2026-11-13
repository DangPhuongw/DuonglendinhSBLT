import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundEffects';
import { getPerfTier } from '../utils/perf';

/** Một điểm ngẫu nhiên nằm trong dải viền (không rơi vào vùng giữa có câu hỏi). */
function edgePoint(): { left: number; top: number } {
  const band = Math.random() < 0.5;
  const t = Math.random() * 100;
  const e = Math.random() * 11;
  const side = Math.random() < 0.5 ? e : 100 - e;
  return band ? { left: t, top: side } : { left: side, top: t };
}

// Máy yếu / điện thoại: ít hạt lấp lánh hơn
const SPARKLES = () => (getPerfTier() === 'low' ? 14 : 34);
const TWINKLES = () => (getPerfTier() === 'low' ? 10 : 26);

const DURATION_MS = 2800;

type CssVars = React.CSSProperties & Record<`--${string}`, string>;

/** Ngôi sao 5 cánh */
const StarShape: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
    <path
      d="M12 1.6l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.7 5.6 21.2 7 14.1 1.7 9.1l7.2-.9z"
      fill="#F7C873"
      stroke="#FBE0A8"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Khi thí sinh đặt Ngôi sao hy vọng, cả màn hình lóe sáng vàng với ngôi sao lớn
 * và các ngôi sao nhỏ lấp lánh trong ~3 giây. Không chặn thao tác (pointer-events: none).
 */
export const HopeStarBurst: React.FC = () => {
  const active = useGameStore((s) => Boolean(s.room?.state.hopeStarActive));
  const round = useGameStore((s) => s.room?.state.round);
  const playerName = useGameStore((s) => {
    const id = s.room?.state.mainPlayerId || s.room?.state.activePlayerId;
    return s.room?.players.find((p) => p.id === id)?.name;
  });
  const [burstKey, setBurstKey] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevActive = useRef(active);

  useEffect(() => {
    const justTurnedOn = active && !prevActive.current;
    prevActive.current = active;
    // Chỉ chạy lúc vừa đặt ngôi sao, không chạy lại khi tải lại trang giữa câu
    if (!justTurnedOn || round !== 'VE_DICH') return;
    setBurstKey((k) => k + 1);
    setVisible(true);
    soundManager.playStarChime();
    const t = setTimeout(() => setVisible(false), DURATION_MS);
    return () => clearTimeout(t);
  }, [active, round]);

  // Mỗi lần lóe tạo bộ ngôi sao mới
  const sparkles = useMemo(
    () =>
      Array.from({ length: SPARKLES() }, (_, i) => {
        const angle = (i / SPARKLES()) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 70 + Math.random() * 190;
        return {
          id: i,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist * 0.45,
          size: 8 + Math.random() * 14,
          delay: Math.random() * 0.5,
          dur: 1.4 + Math.random() * 0.9,
        };
      }),
    [burstKey]
  );
  const twinkles = useMemo(
    () =>
      Array.from({ length: TWINKLES() }, (_, i) => ({
        id: i,
        ...edgePoint(),
        size: 6 + Math.random() * 14,
        delay: Math.random() * 1.4,
        dur: 0.8 + Math.random() * 0.8,
      })),
    [burstKey]
  );

  if (!visible) return null;

  // Ánh vàng chỉ chạy quanh viền + dải thông báo nhỏ ở trên: phần giữa màn hình (câu hỏi) luôn để trống
  return (
    <div key={burstKey} className="fixed inset-0 z-[90] pointer-events-none overflow-hidden" role="status" aria-live="polite">
      <div className="hope-frame absolute inset-0" />

      {twinkles.map((t) => (
        <span
          key={t.id}
          className="hope-twinkle absolute"
          style={{ left: `${t.left}%`, top: `${t.top}%`, '--delay': `${t.delay}s`, '--dur': `${t.dur}s` } as CssVars}
        >
          <StarShape size={t.size} />
        </span>
      ))}

      <div className="absolute left-1/2 top-16 sm:top-20 -translate-x-1/2 flex items-center justify-center">
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="hope-sparkle absolute"
            style={{ '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, '--delay': `${s.delay}s`, '--dur': `${s.dur}s` } as CssVars}
          >
            <StarShape size={s.size} />
          </span>
        ))}
        <div className="hope-banner relative flex items-center gap-3 rounded-full border border-[#F7C873]/70 bg-[#05060F]/80 pl-2 pr-5 py-1.5 shadow-glow-yellow-lg">
          <StarShape size={44} className="hope-star-main w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
          <div className="text-left leading-tight">
            <div className="font-heading font-black text-base sm:text-xl text-[#F7C873] uppercase tracking-wider whitespace-nowrap">Ngôi sao hy vọng</div>
            {playerName && (
              <div className="font-heading font-bold text-xs sm:text-sm text-[#FBE0A8] whitespace-nowrap">{playerName} đặt ngôi sao cho câu này</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
