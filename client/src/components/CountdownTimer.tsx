import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface CountdownTimerProps {
  deadline: number | null;
  totalDurationSeconds?: number;
  className?: string;
  showSeconds?: boolean;
  label?: string;
  /**
   * Luôn chiếm đúng chỗ của đồng hồ (ẩn đi khi chưa có / đã hết giờ) thay vì biến mất.
   * Dùng ở nơi đồng hồ nằm trong khung cố định, tránh cả giao diện bị nhảy mỗi khi đổi pha.
   */
  reserveSpace?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  totalDurationSeconds = 15,
  className = '',
  showSeconds = true,
  label = 'Thời gian còn lại',
  reserveSpace = false,
}) => {
  const serverOffset = useGameStore((s) => s.serverOffset);
  const computeRemaining = () => (deadline ? Math.max(0, deadline - (Date.now() + serverOffset)) : 0);
  const [remainingMs, setRemainingMs] = useState<number>(computeRemaining);

  useEffect(() => {
    // Tính ngay khi đổi mốc thời gian (không đợi tick đầu tiên 100ms): tránh chớp / biến mất giữa 2 pha
    setRemainingMs(computeRemaining());
    if (!deadline) return;

    const interval = setInterval(() => {
      const rem = computeRemaining();
      setRemainingMs(rem);
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, serverOffset]);

  const inactive = !deadline || remainingMs <= 0;
  if (inactive && !reserveSpace) {
    return null;
  }

  const seconds = inactive ? '0.0' : (remainingMs / 1000).toFixed(1);
  const totalMs = totalDurationSeconds * 1000;
  const percent = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));
  const isWarning = remainingMs <= 6000 && remainingMs > 3000;
  const isCritical = remainingMs <= 3000;
  const isPulsing = remainingMs <= 5000;

  // Color logic according to spec: Yellow -> Orange -> Red
  const timerColor = isCritical
    ? 'text-[#FF496C] border-[#FF496C] bg-[#FF496C]/10 shadow-glow-danger'
    : isWarning
    ? 'text-[#FB923C] border-[#FB923C] bg-[#FB923C]/10 shadow-[0_0_15px_rgba(251,146,60,0.35)]'
    : 'text-[#FFD43B] border-[#FFD43B]/60 bg-[#FFD43B]/10 shadow-glow-yellow';

  const barColor = isCritical
    ? 'bg-[#FF496C] shadow-[0_0_12px_#FF496C]'
    : isWarning
    ? 'bg-[#FB923C] shadow-[0_0_12px_#FB923C]'
    : 'bg-[#FFD43B] shadow-[0_0_12px_#FFD43B]';

  return (
    <div
      className={`w-full max-w-xl mx-auto flex flex-col items-center gap-1.5 ${inactive ? 'invisible' : ''} ${className}`}
      aria-hidden={inactive || undefined}
    >
      <div className={`flex ${showSeconds ? 'justify-between' : 'justify-center'} items-center w-full px-1`}>
        <span className="text-xs uppercase tracking-wider font-heading font-bold text-[#94A3B8]">
          {label}
        </span>
        {showSeconds && (
          <span
            className={`inline-block min-w-[5.2ch] text-right font-digital text-2xl sm:text-3xl font-bold tracking-wider tabular-nums px-3 py-0.5 rounded-lg border transition-colors ${timerColor} ${
              isPulsing ? 'animate-pulse' : ''
            }`}
          >
            {seconds}s
          </span>
        )}
      </div>
      <div className="w-full bg-[#111827] rounded-full h-3 sm:h-3.5 p-0.5 overflow-hidden border border-[#303D52]">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
