import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

/** Số mili giây chuông còn khóa, theo đồng hồ server (đọc tức thời, không gây re-render). */
export function lockRemainingMs(unlockAt: number | null | undefined, serverOffset: number): number {
  return unlockAt ? Math.max(0, unlockAt - (Date.now() + serverOffset)) : 0;
}

/**
 * Chuông còn đang khóa hay không. Chỉ đổi trạng thái 2 lần (lúc bắt đầu khóa và lúc mở khóa) bằng một
 * setTimeout, thay vì cập nhật từng khung hình: cả màn hình vòng thi không phải vẽ lại 60 lần/giây.
 * Phần đếm mili giây do LockedBuzzer tự vẽ (cập nhật thẳng vào DOM).
 */
export function useBuzzLocked(unlockAt?: number | null): boolean {
  const serverOffset = useGameStore((s) => s.serverOffset);
  const [locked, setLocked] = useState(() => lockRemainingMs(unlockAt, serverOffset) > 0);

  useEffect(() => {
    const rem = lockRemainingMs(unlockAt, serverOffset);
    setLocked(rem > 0);
    if (rem <= 0) return;
    const timer = setTimeout(() => setLocked(false), rem);
    return () => clearTimeout(timer);
  }, [unlockAt, serverOffset]);

  return locked;
}
