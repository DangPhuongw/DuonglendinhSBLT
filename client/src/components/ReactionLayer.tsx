import React, { useEffect, useMemo } from 'react';
import { GAME_CONFIG, ViewerReaction } from '@olympia/shared';
import { useGameStore } from '../store/gameStore';

const FLOAT_MS = 3800;

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
    const isMsg = reaction.kind === 'message';
    // Làn bên phải màn hình (kiểu livestream), tin nhắn lệch vào trong hơn một chút để khỏi đè emoji
    const right = isMsg ? 4 + hashToUnit(reaction.id, 1) * 14 : 1 + hashToUnit(reaction.id, 1) * 10;
    const drift = (hashToUnit(reaction.id, 2) - 0.5) * 70;
    return { right: `${right}%`, '--drift': `${drift.toFixed(0)}px`, '--float-ms': `${FLOAT_MS}ms` };
  }, [reaction.id, reaction.kind]);

  if (reaction.kind === 'emoji') {
    const emoji = GAME_CONFIG.VIEWER_REACTIONS.EMOJIS[reaction.index];
    if (!emoji) return null;
    return (
      <div className="reaction-float absolute bottom-0 flex flex-col items-center" style={style}>
        <span className="text-4xl sm:text-5xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] leading-none">{emoji}</span>
        <span className="mt-0.5 max-w-[90px] truncate text-[10px] sm:text-xs font-bold text-white/80 drop-shadow">{reaction.name}</span>
      </div>
    );
  }

  const text = GAME_CONFIG.VIEWER_REACTIONS.MESSAGES[reaction.index];
  if (!text) return null;
  return (
    <div className="reaction-float absolute bottom-0" style={style}>
      <div className="flex items-baseline gap-1.5 max-w-[220px] rounded-full bg-[#111827]/85 border border-[#00D9FF]/50 px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <span className="shrink-0 max-w-[80px] truncate text-[11px] sm:text-xs font-bold text-[#00D9FF]">{reaction.name}</span>
        <span className="truncate text-sm sm:text-base font-heading font-black text-[#F8FAFC]">{text}</span>
      </div>
    </div>
  );
};

/**
 * Cảm xúc / tin nhắn của khán giả bay từ dưới lên ở làn bên phải màn hình (mọi người đều thấy).
 * Không bắt thao tác chuột (pointer-events: none); số lượng cùng lúc bị giới hạn trong store.
 */
export const ReactionLayer: React.FC = () => {
  const reactions = useGameStore((s) => s.reactions);
  const removeReaction = useGameStore((s) => s.removeReaction);
  const hasRoom = useGameStore((s) => Boolean(s.room));

  if (!hasRoom || reactions.length === 0) return null;

  return (
    <div className="fixed left-0 right-0 top-14 bottom-24 sm:bottom-28 z-20 pointer-events-none overflow-hidden" aria-hidden="true">
      {reactions.map((r) => (
        <FloatingReaction key={r.id} reaction={r} onDone={removeReaction} />
      ))}
    </div>
  );
};
