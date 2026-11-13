import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundEffects';
import { Star, WifiOff, Crown, Eye, AlertTriangle } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

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
    <div className="w-full bg-gradient-to-b from-[#080B1E]/95 to-[#05060F]/98 backdrop-blur-md border-t border-[#F7C873]/15 px-3 sm:px-6 py-2 sm:py-2.5 shadow-[0_-4px_25px_rgba(0,0,0,0.6)]">
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
                className={`bg-[#05060F]/60 border border-dashed border-[#262E66]/50 rounded-2xl px-2.5 py-1.5 flex flex-col items-center justify-center min-h-[64px] sm:min-h-[72px] lg:min-h-[78px] transition-opacity duration-300 ${
                  hasActiveTurn ? 'opacity-20' : 'opacity-40'
                }`}
              >
                <span className="text-xs sm:text-sm text-[#6D75AD] font-heading font-bold uppercase tracking-wider">Trống</span>
              </div>
            );
          }

          return (
            <div
              key={penalty ? `${seatNum}-${penalty.key}` : seatNum}
              className={`${penalty ? 'penalty-card ' : ''}hud relative rounded-2xl px-3 py-1.5 sm:py-2 flex flex-col justify-between transition-all duration-300 min-h-[64px] sm:min-h-[72px] lg:min-h-[78px] ${
                player.disqualified
                  ? 'bg-[#2A0F24]/80 border border-[#FF5D8F]/60 opacity-60 grayscale'
                  : isTurn
                  ? 'bg-gradient-to-b from-[#1D1A38] to-[#1D1A38] border-2 border-[#F7C873] shadow-[0_0_25px_rgba(247,200,115,0.23),inset_0_0_15px_rgba(247,200,115,0.15)] scale-[1.04] z-10'
                  : isDimmed
                  ? 'bg-[#05060F]/70 border border-[#262E66]/40 opacity-30 grayscale-[25%] hover:opacity-75'
                  : isLeader
                  ? 'bg-[#11163A] border border-[#F7C873]/80 shadow-[0_0_15px_rgba(247,200,115,0.09)]'
                  : isMe
                  ? 'bg-[#080B1E] border border-[#B9C0EA]/70 shadow-[0_0_10px_rgba(185,192,234,0.07)]'
                  : 'bg-[#0A0D22] border border-[#262E66] hover:border-[#6D75AD]'
              }`}
            >
              {penalty && (
                <>
                  <div className="penalty-flash absolute inset-0 rounded-2xl pointer-events-none z-20" aria-hidden="true" />
                  <div
                    className="penalty-number absolute left-1/2 top-0 z-30 pointer-events-none font-digital font-black text-2xl sm:text-4xl lg:text-5xl text-[#FF5D8F] whitespace-nowrap"
                    role="status"
                  >
                    {penalty.delta}
                  </div>
                </>
              )}
              {/* Header: Name & Badges */}
              <div className="flex items-center justify-between gap-1 w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <PlayerAvatar player={player} size={28} dimmed={isDimmed} className={`sm:!w-8 sm:!h-8 ${isTurn ? 'ring-2 ring-[#F7C873]' : ''}`} />
                  <span
                    className={`text-xs sm:text-sm lg:text-base font-bold truncate transition-colors ${
                      isTurn ? 'text-[#F7C873] font-heading font-black' : isDimmed ? 'text-[#6D75AD]' : 'text-[#EEF0FF]'
                    }`}
                    title={player.name}
                  >
                    {player.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isTurn && (
                    <span className="text-[10px] sm:text-xs font-heading font-black px-2 py-0.5 rounded-md bg-[#F7C873] text-[#05060F] shadow-glow-yellow hidden sm:inline-block">
                      LƯỢT ĐẤU
                    </span>
                  )}
                  {isLeader && !isDimmed && (
                    <span title="Dẫn đầu">
                      <Crown size={16} className="text-[#F7C873] fill-[#F7C873]" />
                    </span>
                  )}
                  {isHost && !isDimmed && (
                    <span className="hidden sm:inline-block text-[10px] sm:text-xs font-heading font-extrabold px-1.5 py-0.2 rounded-md bg-[#262E66] text-[#A6ACDB]" title="Chủ phòng">
                      HOST
                    </span>
                  )}
                  {player.starUsed && !isDimmed && (
                    <span title="Đã dùng Ngôi sao hy vọng">
                      <Star size={16} className="text-[#F7C873] fill-[#F7C873]" />
                    </span>
                  )}
                  {(player.tabLeaveCount || 0) > 0 && !player.disqualified && (
                    <span
                      title={`Đã bị cảnh cáo rời tab ${player.tabLeaveCount} lần`}
                      className="flex items-center gap-0.5 text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-md bg-[#FF5D8F] text-white animate-pulse"
                    >
                      <AlertTriangle size={12} />
                      {player.tabLeaveCount}
                    </span>
                  )}
                  {!player.connected && (
                    <span title="Mất kết nối">
                      <WifiOff size={16} className="text-[#FF5D8F] animate-pulse stroke-[2.5]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-xs sm:text-sm uppercase tracking-wider font-heading font-bold transition-colors ${
                  isTurn ? 'text-[#F7C873]' : 'text-[#6D75AD]'
                }`}>
                  {player.disqualified ? (
                    <span className="text-[#FF5D8F] bg-[#FF5D8F]/10 px-2 py-0.5 rounded-md border border-[#FF5D8F]/40 text-xs font-bold">Loại · rời tab</span>
                  ) : player.eliminatedVcnv && room.state.round === 'VCNV' ? (
                    <span className="text-[#FF5D8F] bg-[#FF5D8F]/10 px-2 py-0.5 rounded-md border border-[#FF5D8F]/40 text-xs font-bold">Bị loại</span>
                  ) : (
                    <span className="hidden sm:inline">Điểm</span>
                  )}
                </span>
                <span className={`font-bold font-digital tracking-tight tabular-nums transition-colors ${
                  isTurn
                    ? 'text-[#F7C873] drop-shadow-[0_0_12px_rgba(247,200,115,0.36)] font-black text-2xl sm:text-4xl lg:text-5xl'
                    : isDimmed
                    ? 'text-[#6D75AD] text-xl sm:text-3xl'
                    : isLeader
                    ? 'text-[#F7C873] drop-shadow-[0_0_8px_rgba(247,200,115,0.23)] text-xl sm:text-3xl lg:text-4xl'
                    : 'text-[#EEF0FF] text-xl sm:text-3xl lg:text-4xl'
                }`}>
                  {player.score}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {viewers.length > 0 && (
        <div className="max-w-6xl mx-auto mt-1 flex items-center justify-end gap-1.5 text-xs text-[#A6ACDB] font-medium px-1">
          <Eye size={13} className="text-[#B9C0EA]" />
          <span>Khán giả ({viewers.length}):</span>
          <span className="text-[#EEF0FF] font-bold truncate max-w-xs">{viewers.map((v) => v.name).join(', ')}</span>
        </div>
      )}
    </div>
  );
};
