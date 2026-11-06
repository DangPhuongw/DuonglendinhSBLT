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
    <div className="w-full bg-white border-b-2 border-[#171717] px-3 sm:px-6 py-2 shadow-neo-sm">
      <div className="max-w-6xl mx-auto grid grid-cols-5 gap-2 sm:gap-3">
        {seats.map((seatNum) => {
          const player = room.players.find((p) => p.seat === seatNum);
          const isMe = myPlayer && player && player.id === myPlayer.id;
          const isActive = player && room.state.activePlayerId === player.id;
          const isHost = player && room.hostId === player.id;

          if (!player) {
            return (
              <div
                key={seatNum}
                className="bg-[#FFFDF7] border-2 border-dashed border-[#171717]/25 rounded-xl px-2 py-1.5 flex flex-col items-center justify-center opacity-40 min-h-[58px]"
              >
                <span className="text-[10px] text-[#666666] font-black uppercase">GHẾ {seatNum}</span>
                <span className="text-xs text-[#999999] italic">Trống</span>
              </div>
            );
          }

          return (
            <div
              key={seatNum}
              className={`relative rounded-xl px-3 py-1.5 sm:py-2 flex flex-col justify-between transition-all duration-200 min-h-[58px] border-2 border-[#171717] ${
                isActive
                  ? 'bg-[#FFE45C] shadow-neo scale-[1.02] z-10'
                  : isMe
                  ? 'bg-[#66C7F2]/25 shadow-neo-sm'
                  : 'bg-white shadow-neo-sm hover:shadow-neo hover:-translate-y-0.5'
              }`}
            >
              {/* Header: Seat & Badges */}
              <div className="flex items-center justify-between gap-1 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded border border-[#171717] ${
                      isActive
                        ? 'bg-[#171717] text-[#FFE45C]'
                        : isMe
                        ? 'bg-[#171717] text-white'
                        : 'bg-white text-[#171717]'
                    }`}
                  >
                    G{seatNum}
                  </span>
                  <span
                    className="text-xs sm:text-sm font-black truncate text-[#171717]"
                    title={player.name}
                  >
                    {player.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isHost && (
                    <span title="Chủ phòng">
                      <Crown size={13} className="text-[#171717] fill-[#FFE45C]" />
                    </span>
                  )}
                  {player.starUsed && (
                    <span title="Đã dùng Ngôi sao hy vọng">
                      <Star size={13} className="text-[#171717] fill-[#FFE45C]" />
                    </span>
                  )}
                  {!player.connected && (
                    <span title="Mất kết nối">
                      <WifiOff size={13} className="text-[#FF9292] animate-pulse stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-[10px] uppercase tracking-wider text-[#666666] font-black">
                  {player.eliminatedVcnv ? (
                    <span className="text-[#171717] bg-[#FF9292] px-1 rounded border border-[#171717]">Loại</span>
                  ) : (
                    'Điểm'
                  )}
                </span>
                <span className="text-lg sm:text-2xl font-black tracking-tight font-mono tabular-nums text-[#171717]">
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
