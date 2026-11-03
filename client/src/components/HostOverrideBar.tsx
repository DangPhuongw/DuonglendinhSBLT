import React from 'react';
import { useGameStore } from '../store/gameStore';
import { ShieldCheck, RotateCcw } from 'lucide-react';

export const HostOverrideBar: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const lastReveal = useGameStore((s) => s.lastReveal);
  const overrideScore = useGameStore((s) => s.overrideScore);

  if (!room || !myPlayer || room.hostId !== myPlayer.id) return null;
  if (!lastReveal || !lastReveal.results || lastReveal.results.length === 0) return null;

  const expiresAt = lastReveal.overrideWindowExpiresAt || 0;
  if (expiresAt > 0 && Date.now() > expiresAt) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl backdrop-blur">
      <div className="flex items-center gap-2 mb-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
        <ShieldCheck size={16} />
        <span>Bảng điều khiển Chủ phòng: Sửa kết quả chấm (10s)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {lastReveal.results.map((res) => {
          const p = room.players.find((player) => player.id === res.playerId);
          if (!p) return null;

          return (
            <div
              key={res.playerId}
              className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-xs"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-slate-300 truncate">{p.name}:</span>
                <span className="italic text-slate-400 truncate">
                  "{res.answer || '(không có)'}"
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                    res.isCorrect ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                  }`}
                >
                  {res.isCorrect ? 'ĐÚNG' : 'SAI'}
                </span>
                <button
                  onClick={() => overrideScore(lastReveal.questionId, p.id, !res.isCorrect)}
                  className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded border border-amber-500/30 font-semibold text-[10px] transition-colors"
                  title="Đảo kết quả chấm"
                >
                  <RotateCcw size={10} />
                  <span>Đổi thành {!res.isCorrect ? 'Đúng' : 'Sai'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
