import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { bgmManager } from '../utils/bgmManager';

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

  useEffect(() => {
    bgmManager.setUrgency(isUrgent);
    return () => bgmManager.setUrgency(false);
  }, [isUrgent]);

  return (
    <div className={`w-full max-w-xl mx-auto flex flex-col items-center gap-1.5 ${className}`}>
      <div className="flex justify-between items-center w-full px-1">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          Thời gian còn lại
        </span>
        <span
          className={`font-mono text-xl font-bold tracking-tight ${
            isUrgent ? 'text-rose-500 animate-pulse' : 'text-amber-400'
          }`}
        >
          {seconds}s
        </span>
      </div>
      <div className="w-full bg-slate-800/80 rounded-full h-3 p-0.5 overflow-hidden border border-slate-700/60 shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-100 ease-linear ${
            isUrgent
              ? 'bg-gradient-to-r from-rose-600 to-amber-500'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
