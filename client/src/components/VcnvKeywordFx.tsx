import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Siren } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundEffects';
import { getPerfTier } from '../utils/perf';

const WIN_MS = 4200;
const FAIL_MS = 2600;

type Fx = { kind: 'win' | 'fail'; name: string; guess: string; keyword: string; key: number };

/**
 * Hiệu ứng khi một thí sinh đoán từ khóa Vượt chướng ngại vật:
 *  - Đúng: chúc mừng (ánh vàng/xanh, pháo giấy, từ khóa hiện to, tiếng kèn).
 *  - Sai: báo động đỏ (viền đỏ nhấp nháy quanh màn hình, còi), chỉ hiện dải thông báo ở trên
 *    vì vòng thi vẫn tiếp tục: không che câu hỏi đang chạy lại.
 * Dựa vào room.state.vcnvGuessResult do máy chủ gửi (mỗi lần đoán có mốc thời gian riêng).
 */
export const VcnvKeywordFx: React.FC = React.memo(() => {
  // Chỉ theo dõi mốc thời gian của lần đoán: máy chủ gửi lại trạng thái liên tục, không được làm hiệu ứng chạy lại / bị hủy
  const at = useGameStore((s) => (s.room?.state.round === 'VCNV' ? s.room.state.vcnvGuessResult?.at : undefined));
  const [fx, setFx] = useState<Fx | null>(null);
  const seen = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  useEffect(() => {
    const room = useGameStore.getState().room;
    const result = room?.state.vcnvGuessResult;
    if (!at || !result || at === seen.current) return;
    const firstLook = seen.current === null;
    seen.current = at;
    // Vừa mở / tải lại trang giữa chừng: không chạy lại hiệu ứng cũ
    if (firstLook && Date.now() - at > 4000) return;

    const name = room?.players.find((p) => p.id === result.playerId)?.name ?? 'Thí sinh';
    const keyword = (result.answer || (room?.state.obstacleAnswerRevealed ?? []).join('')).toUpperCase();
    const next: Fx = { kind: result.correct ? 'win' : 'fail', name, guess: result.guess, keyword, key: at };
    setFx(next);

    if (result.correct) {
      soundManager.playFanfare();
      const lite = getPerfTier() === 'low';
      import('canvas-confetti').then(({ default: confetti }) => {
        const colors = ['#F7C873', '#43E6B5', '#7CB4FF', '#FBE0A8', '#9B7BFF'];
        const opts = { spread: 75, colors, disableForReducedMotion: true };
        confetti({ ...opts, particleCount: lite ? 40 : 110, origin: { x: 0.5, y: 0.35 }, startVelocity: 38 });
        timers.current.push(
          window.setTimeout(() => {
            confetti({ ...opts, particleCount: lite ? 20 : 60, angle: 60, origin: { x: 0, y: 0.7 } });
            confetti({ ...opts, particleCount: lite ? 20 : 60, angle: 120, origin: { x: 1, y: 0.7 } });
          }, 350)
        );
      });
    } else {
      soundManager.playAlarm();
    }
    timers.current.push(
      window.setTimeout(() => setFx((cur) => (cur?.key === next.key ? null : cur)), result.correct ? WIN_MS : FAIL_MS)
    );
  }, [at]);

  if (!fx) return null;

  if (fx.kind === 'win') {
    return (
      <div key={fx.key} className="fixed inset-0 z-[85] pointer-events-none flex items-center justify-center px-4" role="status" aria-live="assertive">
        <div className="cnv-win-glow absolute inset-0" />
        <div className="cnv-win-card relative text-center rounded-2xl border border-[#43E6B5]/70 bg-[#05060F]/85 px-6 sm:px-10 py-5 sm:py-7 shadow-glow-success">
          <div className="flex items-center justify-center gap-2 text-[#43E6B5] font-heading font-black uppercase tracking-[0.2em] text-sm sm:text-base">
            <CheckCircle2 size={20} />
            Chính xác!
          </div>
          {fx.keyword && (
            <div className="mt-2 font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-gold-gradient tracking-[0.12em] break-words">
              {fx.keyword}
            </div>
          )}
          <div className="mt-2 text-sm sm:text-lg font-bold text-[#EEF0FF]">
            <span className="text-[#F7C873]">{fx.name}</span> đã giải được chướng ngại vật
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={fx.key} className="fixed inset-0 z-[85] pointer-events-none" role="alert" aria-live="assertive">
      <div className="cnv-alarm absolute inset-0" />
      <div className="absolute left-1/2 top-16 sm:top-20 -translate-x-1/2 w-[min(92vw,560px)]">
        <div className="cnv-alarm-banner flex items-center gap-3 rounded-2xl border-2 border-[#FF5D8F] bg-[#2A0F24]/90 px-4 py-3 shadow-glow-danger-lg">
          <Siren size={28} className="text-[#FF5D8F] shrink-0 cnv-siren" />
          <div className="min-w-0 text-left">
            <div className="font-heading font-black uppercase tracking-[0.18em] text-[#FF5D8F] text-sm sm:text-base">Sai rồi!</div>
            <div className="text-xs sm:text-sm font-bold text-[#FFB6CF] truncate">
              {fx.name} đoán “{fx.guess || '...'}” và bị loại khỏi vòng này
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
VcnvKeywordFx.displayName = 'VcnvKeywordFx';
