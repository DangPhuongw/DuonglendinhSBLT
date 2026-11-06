import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

interface CountdownTimerProps {
  deadline: number | null;
  totalDurationSeconds?: number;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  totalDurationSeconds = 15,
  className = '',
}) => {
  const serverOffset = useGameStore((s) => s.serverOffset);
  const [remainingMs, setRemainingMs] = useState<number>(0);

  useEffect(() => {
    if (!deadline) {
      setRemainingMs(0);
      return;
    }

    const interval = setInterval(() => {
      const nowSynced = Date.now() + serverOffset;
      const rem = Math.max(0, deadline - nowSynced);
      setRemainingMs(rem);
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [deadline, serverOffset]);

  if (!deadline || remainingMs <= 0) {
    return null;
  }

  const seconds = (remainingMs / 1000).toFixed(1);
  const totalMs = totalDurationSeconds * 1000;
  const percent = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));
  const isUrgent = remainingMs <= 5000;

  return (
    <div className={`w-full max-w-xl mx-auto flex flex-col items-center gap-1.5 ${className}`}>
      <div className="flex justify-between items-center w-full px-1">
        <span className="text-xs uppercase tracking-wider font-extrabold text-[#171717]">
          Thời gian còn lại
        </span>
        <span
          className={`font-mono text-xl sm:text-2xl font-black tracking-tight tabular-nums px-3 py-0.5 rounded-lg border-2 border-[#171717] shadow-neo-sm ${
            isUrgent ? 'bg-[#FF9292] text-[#171717] animate-pulse' : 'bg-[#FFE45C] text-[#171717]'
          }`}
        >
          {seconds}s
        </span>
      </div>
      <div className="w-full bg-white rounded-full h-4 p-0.5 overflow-hidden border-2 border-[#171717] shadow-neo-sm">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear border-r-2 border-[#171717] ${
            isUrgent
              ? 'bg-[#FF9292]'
              : 'bg-[#FFE45C]'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
