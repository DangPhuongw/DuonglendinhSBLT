import React, { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { lockRemainingMs } from '../utils/useBuzzLock';

/**
 * Nút chuông đang bị khóa: vòng tiến trình chạy quanh nút và số đếm ngược từ 3.000 về 0.000 (mili giây).
 * Con số và vòng tròn được cập nhật thẳng vào DOM mỗi khung hình (không qua React state), nên chỉ
 * phần tử này thay đổi, phần còn lại của màn hình không phải vẽ lại.
 * Khi hết khóa, nơi dùng đổi sang nút bấm chuông bình thường.
 */
export const LockedBuzzer: React.FC<{
  unlockAt: number | null | undefined;
  totalMs: number;
  /** Màu vòng tiến trình (trùng màu nút chuông của vòng đó). */
  accent: string;
}> = ({ unlockAt, totalMs, accent }) => {
  const ringRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    let lastLabel = -1;
    const paint = () => {
      const rem = lockRemainingMs(unlockAt, useGameStore.getState().serverOffset);
      const progress = Math.min(100, Math.max(0, (1 - rem / totalMs) * 100));
      if (ringRef.current) {
        ringRef.current.style.background = `conic-gradient(${accent} ${progress.toFixed(1)}%, #262E66 0)`;
        // Nhãn cho trình đọc màn hình: chỉ cập nhật khi đổi số giây tròn
        const sec = Math.ceil(rem / 1000);
        if (sec !== lastLabel) {
          lastLabel = sec;
          ringRef.current.setAttribute('aria-label', `Chuông đang khóa, còn ${sec} giây`);
        }
      }
      if (numberRef.current) numberRef.current.textContent = (rem / 1000).toFixed(3);
      if (rem > 0) frame = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(frame);
  }, [unlockAt, totalMs, accent]);

  return (
    <div ref={ringRef} className="w-24 h-24 sm:w-36 sm:h-36 rounded-full p-1" role="img" aria-label="Chuông đang khóa">
      <div className="w-full h-full rounded-full bg-[#0A0D22] flex flex-col items-center justify-center gap-0.5 cursor-not-allowed select-none">
        <Lock size={20} className="text-[#6D75AD]" />
        <span ref={numberRef} className="font-digital font-bold text-2xl sm:text-4xl tabular-nums text-[#EEF0FF] leading-none" />
        <span className="text-[10px] sm:text-xs font-heading font-bold uppercase tracking-widest text-[#6D75AD]">
          Chuông đang khóa
        </span>
      </div>
    </div>
  );
};
