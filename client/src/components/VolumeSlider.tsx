import React from 'react';

/** Thanh trượt âm lượng gọn cho thanh điều hướng. */
export const VolumeSlider: React.FC<{
  value: number; // 0-100
  onChange: (value: number) => void;
  /** Gọi khi người dùng thả thanh trượt (để phát âm thử). */
  onCommit?: () => void;
  label: string;
  dimmed?: boolean;
  className?: string;
}> = ({ value, onChange, onCommit, label, dimmed = false, className = '' }) => (
  <label
    className={`items-center gap-1.5 ${dimmed ? 'opacity-50' : ''} ${className}`}
    title={`${label}: ${value}%`}
  >
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      onPointerUp={onCommit}
      onKeyUp={(e) => {
        if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') onCommit?.();
      }}
      aria-label={label}
      aria-valuetext={`${value}%`}
      className="w-24 h-1.5 cursor-pointer accent-[#F7C873]"
    />
    <span className="w-9 text-right text-xs font-digital font-bold tabular-nums text-[#A6ACDB]">
      {value}%
    </span>
  </label>
);
