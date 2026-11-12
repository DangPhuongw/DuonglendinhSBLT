import React from 'react';
import { avatarUrl, playerAvatarSeed } from '../utils/avatar';

interface Props {
  player?: { avatar?: string; name: string } | null;
  /** Dùng seed trực tiếp (vd. trong bộ chọn ảnh) thay cho player. */
  seed?: string;
  /** Kích thước px. */
  size?: number;
  className?: string;
  dimmed?: boolean;
}

/** Ảnh đại diện hoạt hình (Multiavatar) của người chơi. */
export const PlayerAvatar: React.FC<Props> = ({ player, seed, size = 32, className = '', dimmed }) => {
  const s = seed ?? (player ? playerAvatarSeed(player) : '');
  if (!s) return null;
  return (
    <img
      src={avatarUrl(s)}
      alt={player ? `Ảnh đại diện ${player.name}` : ''}
      width={size}
      height={size}
      draggable={false}
      className={`shrink-0 rounded-full select-none ${dimmed ? 'grayscale opacity-50' : ''} ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
