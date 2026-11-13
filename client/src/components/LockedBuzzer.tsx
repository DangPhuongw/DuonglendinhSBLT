import React from 'react';
import { Lock } from 'lucide-react';

/**
 * Nút chuông đang bị khóa: vòng tiến trình chạy quanh nút và số đếm ngược từ 3.000 về 0.000 (mili giây).
 * Khi hết khóa, nơi dùng đổi sang nút bấm chuông bình thường.
 */
export const LockedBuzzer: React.FC<{
  remainingMs: number;
  totalMs: number;
  /** Màu vòng tiến trình (trùng màu nút chuông của vòng đó). */
  accent: string;
}> = ({ remainingMs, totalMs, accent }) => {
  const progress = Math.min(100, Math.max(0, (1 - remainingMs / totalMs) * 100));
  return (
    <div
      className="w-24 h-24 sm:w-36 sm:h-36 rounded-full p-1"
      style={{ background: `conic-gradient(${accent} ${progress}%, #262E66 0)` }}
      role="img"
      aria-label={`Chuông đang khóa, còn ${(remainingMs / 1000).toFixed(1)} giây`}
    >
      <div className="w-full h-full rounded-full bg-[#0A0D22] flex flex-col items-center justify-center gap-0.5 cursor-not-allowed select-none">
        <Lock size={20} className="text-[#6D75AD]" />
        <span className="font-digital font-bold text-2xl sm:text-4xl tabular-nums text-[#EEF0FF] leading-none">
          {(remainingMs / 1000).toFixed(3)}
        </span>
        <span className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-widest text-[#6D75AD]">
          Chuông đang khóa
        </span>
      </div>
    </div>
  );
};
