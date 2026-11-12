import React, { useEffect, useState } from 'react';

/** Máy cảm ứng không có bàn phím (điện thoại, máy tính bảng). */
export function useIsTouchOnly(): boolean {
  const query = '(hover: none) and (pointer: coarse)';
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return;
    const onChange = () => setTouch(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return Boolean(touch);
}

/** Phím SPACE vẽ như phím thật trên bàn phím; `pressing` cho phím nhún xuống liên tục để gây chú ý. */
export const SpaceKeycap: React.FC<{ pressing?: boolean; size?: 'md' | 'lg' }> = ({ pressing = false, size = 'md' }) => (
  <kbd
    className={`inline-flex items-center justify-center rounded-xl font-heading font-black tracking-[0.3em] text-[#090D18] bg-gradient-to-b from-[#FFFFFF] to-[#D6DEEA] border border-[#AEB9C9] select-none ${
      size === 'lg' ? 'h-14 sm:h-16 w-56 sm:w-72 text-lg sm:text-2xl' : 'h-10 w-40 sm:w-48 text-sm sm:text-base'
    } ${pressing ? 'space-key-press' : 'shadow-[0_5px_0_#7C8799]'}`}
  >
    SPACE
  </kbd>
);
