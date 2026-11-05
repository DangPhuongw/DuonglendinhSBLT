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
    <div className="w-full bg-white border-b-2 border-black px-2 sm:px-4 py-2 shadow-neo-sm">
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
                className="bg-slate-100/60 border-2 border-dashed border-slate-300 rounded-xl p-2 flex flex-col items-center justify-center opacity-60 min-h-[70px]"
              >
                <span className="text-[10px] text-slate-500 font-bold uppercase">Ghế {seatNum}</span>
                <span className="text-xs text-slate-400 italic">Trống</span>
              </div>
            );
          }

          return (
            <div
              key={seatNum}
              className={`relative rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 min-h-[70px] border-2 border-black ${
                isActive
                  ? 'bg-[#E8FE36] shadow-neo scale-[1.03] z-10'
                  : isMe
                  ? 'bg-[#A5C9FF] shadow-neo-sm'
                  : 'bg-white shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5'
              }`}
            >
              {/* Header: Seat & Badges */}
              <div className="flex items-center justify-between gap-1 w-full">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000] ${
                      isActive
                        ? 'bg-black text-[#E8FE36]'
                        : isMe
                        ? 'bg-black text-white'
                        : 'bg-white text-black'
                    }`}
                  >
                    G{seatNum}
                  </span>
                  <span
                    className="text-xs sm:text-sm font-black truncate text-black"
                    title={player.name}
                  >
                    {player.name}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  {isHost && (
                    <span title="Chủ phòng">
                      <Crown size={13} className="text-black fill-yellow-400" />
                    </span>
                  )}
                  {player.starUsed && (
                    <span title="Đã dùng Ngôi sao hy vọng">
                      <Star size={13} className="text-black fill-yellow-400" />
                    </span>
                  )}
                  {!player.connected && (
                    <span title="Mất kết nối">
                      <WifiOff size={13} className="text-rose-600 animate-pulse stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-[10px] uppercase tracking-wider text-black/70 font-black">
                  {player.eliminatedVcnv ? (
                    <span className="text-rose-700 font-black bg-rose-100 px-1 rounded border border-rose-400">Loại VCNV</span>
                  ) : (
                    'Điểm'
                  )}
                </span>
                <span className="text-lg sm:text-2xl font-black tracking-tight font-mono text-black">
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
