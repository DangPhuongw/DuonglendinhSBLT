import React from 'react';
import { Bell, Zap, Clock3 } from 'lucide-react';
import { GAME_CONFIG } from '@olympia/shared';
import { CountdownTimer } from './CountdownTimer';
import { SpaceKeycap, useIsTouchOnly } from './SpaceKeyHint';

/** Màn nhắc luật khi chuyển từ Khởi động riêng sang Khởi động chung (vài giây, server giữ nhịp). */
export const KdChungIntro: React.FC<{ deadline: number | null }> = ({ deadline }) => {
  const touchOnly = useIsTouchOnly();
  const kd = GAME_CONFIG.KHOI_DONG;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center h-full max-h-full py-2 px-3 overflow-hidden text-center">
      <span className="rx-fade-up text-xs sm:text-sm font-heading font-extrabold uppercase tracking-[0.25em] text-[#A6ACDB]">
        Vòng 1 · Phần 2
      </span>
      <h2 className="rx-pop mt-1 text-3xl sm:text-5xl lg:text-6xl font-heading font-black text-[#F7C873] drop-shadow-[0_0_24px_rgba(247,200,115,0.55)]">
        KHỞI ĐỘNG CHUNG
      </h2>
      <p className="rx-fade-up mt-2 sm:mt-3 flex items-center justify-center gap-2 text-lg sm:text-2xl font-heading font-black text-[#EEF0FF]">
        <Bell size={26} className="text-[#F7C873] animate-bounce shrink-0" />
        Bấm chuông nhanh nhất để giành quyền trả lời
      </p>

      {/* Cách bấm chuông: phần nổi bật nhất */}
      <div className="rx-fade-up mt-4 sm:mt-6 w-full rounded-3xl hud hud-gold border-2 border-[#F7C873]/70 bg-[#F7C873]/10 shadow-glow-yellow px-4 py-4 sm:py-6 flex flex-col items-center gap-3">
        {touchOnly ? (
          <>
            <div className="w-20 h-20 rounded-full bg-[#F7C873] flex items-center justify-center shadow-glow-yellow-lg space-key-press">
              <Bell size={36} className="text-[#05060F]" />
            </div>
            <span className="text-base sm:text-xl font-heading font-black text-[#EEF0FF]">Chạm vào nút chuông vàng giữa màn hình</span>
          </>
        ) : (
          <>
            <span className="text-sm sm:text-lg font-heading font-bold text-[#EEF0FF]">Nhấn phím</span>
            <SpaceKeycap pressing size="lg" />
            <span className="text-sm sm:text-lg font-heading font-bold text-[#EEF0FF]">
              trên bàn phím để bấm chuông <span className="text-[#A6ACDB] font-medium">(hoặc bấm vào nút chuông)</span>
            </span>
          </>
        )}
      </div>

      <div className="rx-fade-up mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full text-xs sm:text-sm font-bold">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#11163A] border border-[#262E66] px-3 py-2">
          <Zap size={16} className="text-[#43E6B5] shrink-0" />
          <span>
            Đúng <span className="text-[#43E6B5]">+{kd.CHUNG_CORRECT_POINTS}đ</span> · Sai/hết giờ{' '}
            <span className="text-[#FF5D8F]">{kd.CHUNG_WRONG_OR_TIMEOUT_POINTS}đ</span>
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#11163A] border border-[#262E66] px-3 py-2">
          <Clock3 size={16} className="text-[#7CB4FF] shrink-0" />
          <span>Chuông khóa {GAME_CONFIG.BUZZ_LOCK_SECONDS} giây đầu mỗi câu</span>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#11163A] border border-[#262E66] px-3 py-2">
          <Bell size={16} className="text-[#F7C873] shrink-0" />
          <span>Giành chuông xong có {kd.CHUNG_ANSWER_SECONDS} giây trả lời</span>
        </div>
      </div>

      <div className="w-full mt-4 max-w-md">
        <CountdownTimer deadline={deadline} totalDurationSeconds={kd.CHUNG_INTRO_SECONDS} showSeconds={false} />
        <p className="mt-1 text-xs text-[#A6ACDB] font-medium">Câu hỏi đầu tiên sắp bắt đầu…</p>
      </div>
    </div>
  );
};
