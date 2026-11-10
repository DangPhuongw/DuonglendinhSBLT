import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

/**
 * Thời gian còn lại (mili giây) của đợt khóa chuông, theo đồng hồ server.
 * Trả 0 khi không khóa hoặc đã hết khóa. Cập nhật mỗi khung hình để hiển thị đến mili giây.
 */
export function useBuzzLock(unlockAt?: number | null): number {
  const serverOffset = useGameStore((s) => s.serverOffset);
  const compute = () => (unlockAt ? Math.max(0, unlockAt - (Date.now() + serverOffset)) : 0);
  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    setRemaining(compute());
    if (!unlockAt) return;
    let frame = 0;
    const tick = () => {
      const rem = Math.max(0, unlockAt - (Date.now() + serverOffset));
      setRemaining(rem);
      if (rem > 0) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Phòng khi trình duyệt tạm dừng requestAnimationFrame (tab ẩn, tiết kiệm pin): vẫn mở khóa đúng giờ
    const safety = setTimeout(() => setRemaining(0), Math.max(0, unlockAt - (Date.now() + serverOffset)) + 20);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlockAt, serverOffset]);

  return remaining;
}
