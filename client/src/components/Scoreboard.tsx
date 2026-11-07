import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Star, WifiOff, Crown, Eye } from 'lucide-react';

export const Scoreboard: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);

  if (!room) return null;

  // Filter contestants (only contestants have seats on the main board)
  const contestants = room.players.filter((p) => (p.role || 'player') === 'player');
  const viewers = room.players.filter((p) => p.role === 'viewer' && p.connected);

  // Ensure 5 seats are represented
  const seats = [1, 2, 3, 4, 5] as const;

  // Determine top score among connected contestants
  const maxScore = contestants.length > 0 ? Math.max(...contestants.map((p) => p.score)) : 0;

  // Check if there is currently a single active turn (e.g. KD_RIENG, VCNV row pick, VE_DICH)
  const activePlayerId = room.state.activePlayerId;
  const hasActiveTurn = Boolean(activePlayerId);

  return (
    <div className="w-full bg-[#0D1322]/95 backdrop-blur-md border-t border-[#303D52] px-3 sm:px-6 py-2 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-6xl mx-auto grid grid-cols-5 gap-2 sm:gap-3">
        {seats.map((seatNum) => {
          const player = contestants.find((p) => p.seat === seatNum);
          const isMe = myPlayer && player && player.id === myPlayer.id;
          const isTurn = Boolean(player && activePlayerId && player.id === activePlayerId);
          const isDimmed = hasActiveTurn && !isTurn;
          const isHost = player && room.hostId === player.id;
          const isLeader = player && player.score === maxScore && maxScore > 0;

          if (!player) {
            return (
              <div
                key={seatNum}
                className={`bg-[#090D18]/60 border border-dashed border-[#303D52]/40 rounded-xl px-2 py-1.5 flex flex-col items-center justify-center min-h-[58px] transition-opacity duration-300 ${
                  hasActiveTurn ? 'opacity-20' : 'opacity-40'
                }`}
              >
                <span className="text-[10px] text-[#64748B] font-heading font-bold uppercase tracking-wider">GHẾ {seatNum}</span>
                <span className="text-xs text-[#475569] italic">Trống</span>
              </div>
            );
          }

          return (
            <div
              key={seatNum}
              className={`relative rounded-xl px-3 py-1.5 sm:py-2 flex flex-col justify-between transition-all duration-300 min-h-[58px] ${
                isTurn
                  ? 'bg-gradient-to-b from-[#223147] to-[#162235] border-2 border-[#FFD43B] shadow-[0_0_25px_rgba(255,212,59,0.5),inset_0_0_15px_rgba(255,212,59,0.15)] scale-[1.04] z-10'
                  : isDimmed
                  ? 'bg-[#090D18]/70 border border-[#303D52]/40 opacity-30 grayscale-[25%] hover:opacity-75'
                  : isLeader
                  ? 'bg-[#1C2638] border border-[#FFD43B]/80 shadow-[0_0_15px_rgba(255,212,59,0.2)]'
                  : isMe
                  ? 'bg-[#162132] border border-[#00D9FF]/70 shadow-[0_0_10px_rgba(0,217,255,0.15)]'
                  : 'bg-[#111827] border border-[#303D52] hover:border-[#64748B]'
              }`}
            >
              {/* Header: Seat & Badges */}
              <div className="flex items-center justify-between gap-1 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`text-[10px] font-heading font-black px-1.5 py-0.5 rounded transition-colors ${
                      isTurn
                        ? 'bg-[#FFD43B] text-[#090D18] shadow-glow-yellow'
                        : isDimmed
                        ? 'bg-[#111827] text-[#64748B] border border-[#303D52]/40'
                        : isLeader
                        ? 'bg-[#FFD43B]/20 text-[#FFD43B] border border-[#FFD43B]/50'
                        : isMe
                        ? 'bg-[#00D9FF] text-[#090D18]'
                        : 'bg-[#1C2638] text-[#94A3B8] border border-[#303D52]'
                    }`}
                  >
                    G{seatNum}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                      isTurn ? 'text-[#FFD43B] font-heading font-black' : isDimmed ? 'text-[#64748B]' : 'text-[#F8FAFC]'
                    }`}
                    title={player.name}
                  >
                    {player.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isTurn && (
                    <span className="text-[9px] font-heading font-black px-1.5 py-0.2 rounded bg-[#FFD43B] text-[#090D18] shadow-glow-yellow animate-pulse hidden sm:inline-block">
                      LƯỢT ĐẤU
                    </span>
                  )}
                  {isLeader && !isDimmed && (
                    <span title="Dẫn đầu">
                      <Crown size={14} className="text-[#FFD43B] fill-[#FFD43B] animate-pulse" />
                    </span>
                  )}
                  {isHost && !isDimmed && (
                    <span className="text-[9px] font-heading font-extrabold px-1 py-0.2 rounded bg-[#303D52] text-[#94A3B8]" title="Chủ phòng">
                      HOST
                    </span>
                  )}
                  {player.starUsed && !isDimmed && (
                    <span title="Đã dùng Ngôi sao hy vọng">
                      <Star size={13} className="text-[#FFD43B] fill-[#FFD43B]" />
                    </span>
                  )}
                  {!player.connected && (
                    <span title="Mất kết nối">
                      <WifiOff size={13} className="text-[#FF496C] animate-pulse stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-[10px] uppercase tracking-wider font-heading font-bold transition-colors ${
                  isTurn ? 'text-[#FFD43B]' : 'text-[#64748B]'
                }`}>
                  {player.eliminatedVcnv ? (
                    <span className="text-[#FF496C] bg-[#FF496C]/10 px-1 py-0.5 rounded border border-[#FF496C]/40">Loại</span>
                  ) : (
                    'Điểm'
                  )}
                </span>
                <span className={`text-xl sm:text-2xl font-bold font-digital tracking-tight tabular-nums transition-colors ${
                  isTurn
                    ? 'text-[#FFD43B] drop-shadow-[0_0_12px_rgba(255,212,59,0.8)] font-black text-2xl sm:text-3xl'
                    : isDimmed
                    ? 'text-[#64748B]'
                    : isLeader
                    ? 'text-[#FFD43B] drop-shadow-[0_0_8px_rgba(255,212,59,0.5)]'
                    : 'text-[#F8FAFC]'
                }`}>
                  {player.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {viewers.length > 0 && (
        <div className="max-w-6xl mx-auto mt-1 flex items-center justify-end gap-1.5 text-[10px] text-[#94A3B8] font-medium px-1">
          <Eye size={12} className="text-[#00D9FF]" />
          <span>Khán giả ({viewers.length}):</span>
          <span className="text-[#F8FAFC] font-bold truncate max-w-xs">{viewers.map((v) => v.name).join(', ')}</span>
        </div>
      )}
    </div>
  );
};
