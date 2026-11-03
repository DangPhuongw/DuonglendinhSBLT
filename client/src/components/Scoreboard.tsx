import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Star, WifiOff, Crown } from 'lucide-react';

export const Scoreboard: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);

  if (!room) return null;

  // Ensure 5 seats are represented
  const seats = [1, 2, 3, 4, 5] as const;

  return (
    <div className="w-full bg-slate-900/95 border-b border-slate-800/80 px-2 sm:px-4 py-2 shadow-md">
      <div className="max-w-6xl mx-auto grid grid-cols-5 gap-1.5 sm:gap-3">
        {seats.map((seatNum) => {
          const player = room.players.find((p) => p.seat === seatNum);
          const isMe = myPlayer && player && player.id === myPlayer.id;
          const isActive = player && room.state.activePlayerId === player.id;
          const isHost = player && room.hostId === player.id;

          if (!player) {
            return (
              <div
                key={seatNum}
                className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-2 flex flex-col items-center justify-center opacity-40 min-h-[70px]"
              >
                <span className="text-[10px] text-slate-500 font-bold uppercase">Ghế {seatNum}</span>
                <span className="text-xs text-slate-600 italic">Trống</span>
              </div>
            );
          }

          return (
            <div
              key={seatNum}
              className={`relative rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-300 min-h-[70px] ${
                isActive
                  ? 'bg-gradient-to-b from-amber-950/60 to-slate-900 border-2 border-amber-500 shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : isMe
                  ? 'bg-slate-800/90 border border-indigo-500/60 shadow'
                  : 'bg-slate-900/80 border border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Header: Seat & Badges */}
              <div className="flex items-center justify-between gap-1 w-full">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-amber-500 text-slate-950'
                        : isMe
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    G{seatNum}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      isMe ? 'text-indigo-300 font-bold' : 'text-slate-200'
                    }`}
                    title={player.name}
                  >
                    {player.name}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  {isHost && (
                    <span title="Chủ phòng">
                      <Crown size={12} className="text-amber-400" />
                    </span>
                  )}
                  {player.starUsed && (
                    <span title="Đã dùng Ngôi sao hy vọng">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    </span>
                  )}
                  {!player.connected && (
                    <span title="Mất kết nối">
                      <WifiOff size={12} className="text-rose-500 animate-pulse" />
                    </span>
                  )}
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                  {player.eliminatedVcnv ? (
                    <span className="text-rose-400 font-bold">Loại VCNV</span>
                  ) : (
                    'Điểm'
                  )}
                </span>
                <span
                  className={`text-lg sm:text-2xl font-black tracking-tight font-mono ${
                    isActive
                      ? 'text-amber-400 animate-pulse'
                      : isMe
                      ? 'text-indigo-200'
                      : 'text-slate-100'
                  }`}
                >
                  {player.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
