import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundEffects';
import { Star, WifiOff, Crown, Eye, AlertTriangle } from 'lucide-react';

export const Scoreboard: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);

  // Hiệu ứng bị trừ điểm: so điểm mới với điểm trước đó của từng thí sinh
  const scoreSig = room ? room.players.map((p) => `${p.id}:${p.score}`).join('|') : '';
  const prevScores = useRef<Record<string, number> | null>(null);
  const [penalties, setPenalties] = useState<Record<string, { delta: number; key: number }>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!room) return;
    const next: Record<string, number> = {};
    room.players.forEach((p) => (next[p.id] = p.score));
    const prev = prevScores.current;
    prevScores.current = next;
    if (!prev) return; // lần đầu hiển thị: chỉ ghi nhận, không nháy
    const drops: Record<string, { delta: number; key: number }> = {};
    for (const [id, score] of Object.entries(next)) {
      if (prev[id] !== undefined && score < prev[id]) drops[id] = { delta: score - prev[id], key: Date.now() };
    }
    if (Object.keys(drops).length === 0) return;
    soundManager.playPenalty();
    setPenalties((cur) => ({ ...cur, ...drops }));
    for (const id of Object.keys(drops)) {
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => {
        setPenalties((cur) => {
          const { [id]: _gone, ...rest } = cur;
          return rest;
        });
      }, 2100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreSig]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  if (!room) return null;

  // Filter contestants (only contestants have seats on the main board)
  const contestants = room.players.filter((p) => (p.role || 'player') === 'player');
  const viewers = room.players.filter((p) => p.role === 'viewer' && p.connected);

  // Ensure 5 seats are represented
  const seats = [1, 2, 3, 4, 5] as const;

  // Determine top score among connected contestants
  const ranked = contestants.filter((p) => !p.disqualified);
  const maxScore = ranked.length > 0 ? Math.max(...ranked.map((p) => p.score)) : 0;

  // Check if there is currently a single active turn (e.g. KD_RIENG, VCNV row pick, VE_DICH)
  const activePlayerId = room.state.activePlayerId;
  const hasActiveTurn = Boolean(activePlayerId);

  return (
    <div className="w-full bg-[#0D1322]/95 backdrop-blur-md border-t border-[#303D52] px-3 sm:px-6 py-2 sm:py-2.5 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1450px] mx-auto grid grid-cols-5 gap-2 sm:gap-3">
        {seats.map((seatNum) => {
          const player = contestants.find((p) => p.seat === seatNum);
          const isMe = myPlayer && player && player.id === myPlayer.id;
          const isTurn = Boolean(player && activePlayerId && player.id === activePlayerId);
          const penalty = player ? penalties[player.id] : undefined;
          // Ô đang bị trừ điểm luôn sáng rõ để mọi người thấy
          const isDimmed = hasActiveTurn && !isTurn && !penalty;
          const isHost = player && room.hostId === player.id;
          const isLeader = player && !player.disqualified && player.score === maxScore && maxScore > 0;

          if (!player) {
            return (
              <div
                key={seatNum}
                className={`bg-[#090D18]/60 border border-dashed border-[#303D52]/50 rounded-2xl px-2.5 py-1.5 flex flex-col items-center justify-center min-h-[64px] sm:min-h-[72px] lg:min-h-[78px] transition-opacity duration-300 ${
                  hasActiveTurn ? 'opacity-20' : 'opacity-40'
                }`}
              >
                <span className="text-xs sm:text-sm text-[#64748B] font-heading font-bold uppercase tracking-wider">Trống</span>
              </div>
            );
          }

          return (
            <div
              key={penalty ? `${seatNum}-${penalty.key}` : seatNum}
              className={`${penalty ? 'penalty-card ' : ''}relative rounded-2xl px-3 py-1.5 sm:py-2 flex flex-col justify-between transition-all duration-300 min-h-[64px] sm:min-h-[72px] lg:min-h-[78px] ${
                player.disqualified
                  ? 'bg-[#1A0710]/80 border border-[#FF496C]/60 opacity-60 grayscale'
                  : isTurn
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
              {penalty && (
                <>
                  <div className="penalty-flash absolute inset-0 rounded-2xl pointer-events-none z-20" aria-hidden="true" />
                  <div
                    className="penalty-number absolute left-1/2 top-0 z-30 pointer-events-none font-digital font-black text-3xl sm:text-4xl lg:text-5xl text-[#FF496C] whitespace-nowrap"
                    role="status"
                  >
                    {penalty.delta}
                  </div>
                </>
              )}
              {/* Header: Name & Badges */}
              <div className="flex items-center justify-between gap-1 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`text-xs sm:text-sm lg:text-base font-bold truncate transition-colors ${
                      isTurn ? 'text-[#FFD43B] font-heading font-black' : isDimmed ? 'text-[#64748B]' : 'text-[#F8FAFC]'
                    }`}
                    title={player.name}
                  >
                    {player.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isTurn && (
                    <span className="text-[10px] sm:text-xs font-heading font-black px-2 py-0.5 rounded-md bg-[#FFD43B] text-[#090D18] shadow-glow-yellow animate-pulse hidden sm:inline-block">
                      LƯỢT ĐẤU
                    </span>
                  )}
                  {isLeader && !isDimmed && (
                    <span title="Dẫn đầu">
                      <Crown size={17} className="text-[#FFD43B] fill-[#FFD43B] animate-pulse" />
                    </span>
                  )}
                  {isHost && !isDimmed && (
                    <span className="text-[10px] sm:text-xs font-heading font-extrabold px-1.5 py-0.2 rounded-md bg-[#303D52] text-[#94A3B8]" title="Chủ phòng">
                      HOST
                    </span>
                  )}
                  {player.starUsed && !isDimmed && (
                    <span title="Đã dùng Ngôi sao hy vọng">
                      <Star size={16} className="text-[#FFD43B] fill-[#FFD43B]" />
                    </span>
                  )}
                  {(player.tabLeaveCount || 0) > 0 && !player.disqualified && (
                    <span
                      title={`Đã bị cảnh cáo rời tab ${player.tabLeaveCount} lần`}
                      className="flex items-center gap-0.5 text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-md bg-[#FF496C] text-white animate-pulse"
                    >
                      <AlertTriangle size={12} />
                      {player.tabLeaveCount}
                    </span>
                  )}
                  {!player.connected && (
                    <span title="Mất kết nối">
                      <WifiOff size={16} className="text-[#FF496C] animate-pulse stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-xs sm:text-sm uppercase tracking-wider font-heading font-bold transition-colors ${
                  isTurn ? 'text-[#FFD43B]' : 'text-[#64748B]'
                }`}>
                  {player.disqualified ? (
                    <span className="text-[#FF496C] bg-[#FF496C]/10 px-2 py-0.5 rounded-md border border-[#FF496C]/40 text-xs font-bold">Loại · rời tab</span>
                  ) : player.eliminatedVcnv && room.state.round === 'VCNV' ? (
                    <span className="text-[#FF496C] bg-[#FF496C]/10 px-2 py-0.5 rounded-md border border-[#FF496C]/40 text-xs font-bold">Bị loại</span>
                  ) : (
                    'Điểm'
                  )}
                </span>
                <span className={`font-bold font-digital tracking-tight tabular-nums transition-colors ${
                  isTurn
                    ? 'text-[#FFD43B] drop-shadow-[0_0_12px_rgba(255,212,59,0.8)] font-black text-3xl sm:text-4xl lg:text-5xl'
                    : isDimmed
                    ? 'text-[#64748B] text-2xl sm:text-3xl'
                    : isLeader
                    ? 'text-[#FFD43B] drop-shadow-[0_0_8px_rgba(255,212,59,0.5)] text-2xl sm:text-3xl lg:text-4xl'
                    : 'text-[#F8FAFC] text-2xl sm:text-3xl lg:text-4xl'
                }`}>
                  {player.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {viewers.length > 0 && (
        <div className="max-w-6xl mx-auto mt-1 flex items-center justify-end gap-1.5 text-xs text-[#94A3B8] font-medium px-1">
          <Eye size={13} className="text-[#00D9FF]" />
          <span>Khán giả ({viewers.length}):</span>
          <span className="text-[#F8FAFC] font-bold truncate max-w-xs">{viewers.map((v) => v.name).join(', ')}</span>
        </div>
      )}
    </div>
  );
};
