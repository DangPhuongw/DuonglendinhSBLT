import React, { useEffect, useMemo } from 'react';
import { GAME_CONFIG, ViewerReaction } from '@olympia/shared';
import { useGameStore } from '../store/gameStore';

const FLOAT_MS = GAME_CONFIG.VIEWER_REACTIONS.FLOAT_MS;

type CssVars = React.CSSProperties & Record<`--${string}`, string>;

/** Vị trí/độ lắc ngẫu nhiên nhưng cố định cho mỗi thông điệp (theo id) để render lại không bị nhảy. */
function hashToUnit(id: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const FloatingReaction: React.FC<{ reaction: ViewerReaction; onDone: (id: string) => void }> = ({ reaction, onDone }) => {
  useEffect(() => {
    const t = setTimeout(() => onDone(reaction.id), FLOAT_MS);
    return () => clearTimeout(t);
  }, [reaction.id, onDone]);

  const style = useMemo<CssVars>(() => {
    // Xuất phát ngẫu nhiên dọc cả chân màn hình (nhô lên từ sau thanh điểm).
    // Bay lên đều như bóng bay; lắc ngang nhẹ là một chuyển động riêng nên không làm chậm/nhanh nhịp bay.
    const left = 3 + hashToUnit(reaction.id, 1) * 88;
    const sway = 10 + hashToUnit(reaction.id, 2) * 14;
    const swayMs = 2600 + hashToUnit(reaction.id, 3) * 1400;
    const swayDelay = -hashToUnit(reaction.id, 4) * swayMs;
    return {
      left: `${left}%`,
      '--float-ms': `${FLOAT_MS}ms`,
      '--sway': `${sway.toFixed(0)}px`,
      '--sway-ms': `${swayMs.toFixed(0)}ms`,
      '--sway-delay': `${swayDelay.toFixed(0)}ms`,
    };
  }, [reaction.id]);

  if (reaction.kind === 'emoji') {
    const emoji = GAME_CONFIG.VIEWER_REACTIONS.EMOJIS[reaction.index];
    if (!emoji) return null;
    return (
      <div className="reaction-float absolute bottom-0" style={style}>
        <span className="reaction-sway block text-3xl sm:text-4xl leading-none">{emoji}</span>
      </div>
    );
  }

  const text = GAME_CONFIG.VIEWER_REACTIONS.MESSAGES[reaction.index];
  if (!text) return null;
  return (
    <div className="reaction-float absolute bottom-0" style={style}>
      <div className="reaction-sway flex items-baseline gap-1.5 max-w-[200px] rounded-full bg-[#111827]/50 border border-[#00D9FF]/25 px-2.5 py-1">
        <span className="shrink-0 max-w-[70px] truncate text-[10px] sm:text-[11px] font-bold text-[#00D9FF]/80">{reaction.name}</span>
        <span className="truncate text-xs sm:text-sm font-heading font-bold text-[#F8FAFC]/90">{text}</span>
      </div>
    </div>
  );
};

/**
 * Cảm xúc / tin nhắn của khán giả bay chậm từ chân màn hình lên, nằm DƯỚI nội dung (ngay trên nền sao):
 * chỉ lộ ra ở khoảng trống, bị khung câu hỏi / bảng điểm che, mờ để không làm phân tâm thí sinh.
 * Không bắt thao tác chuột; số lượng cùng lúc bị giới hạn trong store.
 */
export const ReactionLayer: React.FC = () => {
  const reactions = useGameStore((s) => s.reactions);
  const removeReaction = useGameStore((s) => s.removeReaction);
  const hasRoom = useGameStore((s) => Boolean(s.room));

  if (!hasRoom || reactions.length === 0) return null;

  return (
    <div className="fixed left-0 right-0 top-14 bottom-0 -z-[5] pointer-events-none overflow-hidden" aria-hidden="true">
      {reactions.map((r) => (
        <FloatingReaction key={r.id} reaction={r} onDone={removeReaction} />
      ))}
    </div>
  );
};
