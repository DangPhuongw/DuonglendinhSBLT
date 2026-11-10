import React, { useEffect, useRef, useState } from 'react';
import { Crown, ShieldX } from 'lucide-react';
import { GAME_CONFIG, RoundResultEntry, RoundType } from '@olympia/shared';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundEffects';

const ROUND_LABELS: Partial<Record<RoundType, { index: string; name: string }>> = {
  KD_RIENG: { index: 'Vòng 1', name: 'Khởi động' },
  KD_CHUNG: { index: 'Vòng 1', name: 'Khởi động' },
  VCNV: { index: 'Vòng 2', name: 'Vượt chướng ngại vật' },
  TANG_TOC: { index: 'Vòng 3', name: 'Tăng tốc' },
  VE_DICH: { index: 'Vòng 4', name: 'Về đích' },
};

const cfg = GAME_CONFIG.ROUND_RESULTS;

/**
 * Màn công bố điểm sau mỗi vòng.
 * Tên thí sinh lần lượt bay từ trái vào giữa, từ điểm thấp tới cao (người dẫn đầu xuất hiện sau cùng),
 * giữ bảng điểm một lúc rồi mờ dần. Thời gian chạy theo đồng hồ server (startedAt, deadline) nên mọi
 * máy thấy giống nhau, kể cả người vào lại giữa chừng.
 */
export const RoundResults: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const serverOffset = useGameStore((s) => s.serverOffset);
  const results = room?.state?.roundResults;
  const deadline = room?.state?.deadline ?? null;

  const [now, setNow] = useState(() => Date.now() + serverOffset);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + serverOffset), 50);
    return () => clearInterval(id);
  }, [serverOffset]);

  // Âm thanh: mỗi tên bay vào một tiếng "vút", người dẫn đầu (xuất hiện cuối) là kèn chiến thắng
  const playedRef = useRef(-1);
  const startedAt = results?.startedAt ?? 0;
  const entryCount = results?.entries.length ?? 0;
  const revealedCount = results
    ? Math.min(
        entryCount,
        Math.max(0, Math.floor((now - startedAt - cfg.START_DELAY_MS) / cfg.STAGGER_MS) + 1)
      )
    : 0;

  useEffect(() => {
    playedRef.current = -1;
  }, [startedAt]);

  useEffect(() => {
    if (!results) return;
    const lastIdx = revealedCount - 1;
    if (lastIdx <= playedRef.current) return;
    // Vào giữa chừng: không phát dồn các tiếng đã qua
    const revealAt = startedAt + cfg.START_DELAY_MS + lastIdx * cfg.STAGGER_MS;
    if (now - revealAt < 400) {
      if (lastIdx === entryCount - 1) {
        setTimeout(() => soundManager.playFanfare(), cfg.ENTRY_MS * 0.8);
      } else {
        soundManager.playWhoosh();
      }
    }
    playedRef.current = lastIdx;
  }, [revealedCount, results, startedAt, entryCount, now]);

  if (!room || !results) return null;

  const label = ROUND_LABELS[results.finishedRound];
  const fading = deadline !== null && now >= deadline - cfg.FADE_MS;

  // Hiển thị theo hạng: cao nhất ở trên. entries có thứ tự xuất hiện (thấp -> cao) nên đảo lại.
  const rows = results.entries
    .map((entry, appearIndex) => ({ entry, appearIndex }))
    .reverse();

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-3 py-2 overflow-hidden"
      style={{
        opacity: fading ? 0 : 1,
        transition: `opacity ${cfg.FADE_MS}ms ease-out`,
      }}
    >
      {/* Tiêu đề */}
      <div className="text-center mb-4 sm:mb-6 rr-title">
        <span className="inline-block text-xs sm:text-sm font-heading font-black uppercase tracking-[0.25em] bg-[#FFD43B]/15 text-[#FFD43B] px-4 py-1 rounded-full border border-[#FFD43B]/40 shadow-glow-yellow">
          Kết thúc {label?.index ?? 'vòng thi'}
        </span>
        <h1 className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-[#F8FAFC] tracking-tight">
          BẢNG ĐIỂM
        </h1>
        {label && (
          <p className="mt-1 text-sm sm:text-base font-heading font-bold text-[#94A3B8] uppercase tracking-wider">
            {label.name}
          </p>
        )}
      </div>

      {/* Danh sách */}
      <ol className="w-full max-w-2xl flex flex-col gap-2 sm:gap-3">
        {rows.map(({ entry, appearIndex }) => {
          const revealAt = startedAt + cfg.START_DELAY_MS + appearIndex * cfg.STAGGER_MS;
          const elapsed = now - revealAt;
          return (
            <ResultRow
              // startedAt trong key: mỗi lần công bố là các dòng mới, hiệu ứng luôn chạy lại từ đầu
              key={`${startedAt}-${entry.playerId}`}
              entry={entry}
              visible={elapsed >= 0}
              // Vào lại giữa chừng: tên đã bay xong thì hiện luôn, không chạy lại hiệu ứng
              animate={elapsed < cfg.ENTRY_MS}
              isMe={myPlayer?.id === entry.playerId}
            />
          );
        })}
      </ol>
    </div>
  );
};

const ResultRow: React.FC<{
  entry: RoundResultEntry;
  visible: boolean;
  animate: boolean;
  isMe: boolean;
}> = ({ entry, visible, animate, isMe }) => {
  // Giữ trạng thái "đã chạy hiệu ứng" để không bị giật khi animate đổi từ true sang false
  const [settled, setSettled] = useState(!animate);
  useEffect(() => {
    if (visible && animate) {
      const t = setTimeout(() => setSettled(true), cfg.ENTRY_MS);
      return () => clearTimeout(t);
    }
  }, [visible, animate]);

  const isLeader = entry.rank === 1 && !entry.disqualified;

  const rowTone = entry.disqualified
    ? 'bg-[#1A0D14]/90 border-[#FF496C]/40'
    : isLeader
    ? 'bg-gradient-to-r from-[#3A2E06]/95 via-[#1C2638]/95 to-[#1C2638]/95 border-[#FFD43B] shadow-[0_0_28px_rgba(255,212,59,0.35)]'
    : isMe
    ? 'bg-[#0E2A35]/90 border-[#00D9FF]/70'
    : 'bg-[#111827]/90 border-[#303D52]';

  const rankTone = entry.disqualified
    ? 'bg-[#FF496C]/15 text-[#FF496C] border-[#FF496C]/50'
    : isLeader
    ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B]'
    : 'bg-[#1C2638] text-[#F8FAFC] border-[#303D52]';

  return (
    <li
      className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl border-2 backdrop-blur-sm ${rowTone} ${
        !visible ? 'opacity-0' : animate && !settled ? 'rr-fly-in' : ''
      }`}
      style={animate && !settled ? { animationDuration: `${cfg.ENTRY_MS}ms` } : undefined}
      aria-hidden={!visible}
    >
      {/* Hạng */}
      <span
        className={`shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center font-digital font-bold text-xl sm:text-2xl tabular-nums ${rankTone}`}
      >
        {entry.disqualified ? <ShieldX size={20} /> : entry.rank}
      </span>

      {/* Tên */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {isLeader && <Crown size={20} className="shrink-0 text-[#FFD43B]" />}
          <span
            className={`truncate font-heading font-black text-base sm:text-xl ${
              entry.disqualified ? 'text-[#94A3B8] line-through' : 'text-[#F8FAFC]'
            }`}
          >
            {entry.name}
          </span>
          {isMe && (
            <span className="shrink-0 text-[10px] sm:text-xs font-heading font-bold uppercase text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/40 rounded-md px-1.5 py-0.5">
              Bạn
            </span>
          )}
        </div>
        <span className="text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider text-[#64748B]">
          {entry.disqualified ? 'Bị loại' : `Ghế ${entry.seat}`}
        </span>
      </div>

      {/* Điểm vòng này */}
      {!entry.disqualified && (
        <span
          className={`shrink-0 font-digital font-bold text-sm sm:text-lg tabular-nums px-2 py-0.5 rounded-lg border ${
            entry.roundScore > 0
              ? 'text-[#20D6A0] border-[#20D6A0]/40 bg-[#20D6A0]/10'
              : entry.roundScore < 0
              ? 'text-[#FF496C] border-[#FF496C]/40 bg-[#FF496C]/10'
              : 'text-[#64748B] border-[#303D52] bg-transparent'
          } ${visible ? 'rr-pop' : 'opacity-0'}`}
          style={visible && animate && !settled ? { animationDelay: `${cfg.ENTRY_MS}ms` } : undefined}
          title="Điểm giành được trong vòng này"
        >
          {entry.roundScore > 0 ? `+${entry.roundScore}` : entry.roundScore}
        </span>
      )}

      {/* Tổng điểm */}
      <span
        className={`shrink-0 w-16 sm:w-24 text-right font-digital font-bold text-2xl sm:text-4xl tabular-nums ${
          isLeader ? 'text-[#FFD43B]' : 'text-[#F8FAFC]'
        }`}
      >
        {entry.score}
      </span>
    </li>
  );
};
