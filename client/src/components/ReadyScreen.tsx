import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { CheckCircle2, AlertCircle, UserX, BookOpen, Zap } from 'lucide-react';

interface RoundRule {
  tagline: string;
  points: { title: string; desc: string; badge?: string }[];
}

const ROUND_RULES: Record<string, RoundRule> = {
  KD_RIENG: {
    tagline: 'Vòng thi gồm 2 phần: Khởi động Riêng và Khởi động Chung',
    points: [
      {
        title: 'Khởi động Riêng',
        desc: 'Mỗi thí sinh chọn 1 trong 5 ô câu hỏi (mỗi ô 5 câu, 15s/câu). Ô đã chọn sẽ bị khóa và người sau không thể chọn lại. Đúng +10đ/câu, sai không bị trừ điểm.',
        badge: '+10đ / 0đ',
      },
      {
        title: 'Khởi động Chung',
        desc: 'Gồm 10 câu hỏi chung cho tất cả. Bấm chuông (phím Space) để giành quyền trả lời trong 3 giây. Đúng +10 điểm, sai/hết giờ -5 điểm.',
        badge: '+10đ / -5đ',
      },
    ],
  },
  VCNV: {
    tagline: 'Tìm từ khóa Chướng ngại vật qua 4 hàng ngang và bức tranh bí ẩn',
    points: [
      {
        title: 'Lượt chọn & Trả lời Hàng ngang',
        desc: 'Lần lượt từng thí sinh chọn 1 hàng ngang. Sau khi chọn, tất cả thí sinh cùng nhập câu trả lời trong 15s. Đúng được +10 điểm và mở 1 góc hình ảnh.',
        badge: '+10đ / hàng',
      },
      {
        title: 'Chuông Chướng ngại vật (CNV)',
        desc: 'Mở từ sau khi giải xong hàng ngang 1. Bấm chuông để đoán từ khóa chính: Đúng nhận 60/50/40/30 điểm (theo số hàng đã mở); Đoán sai bị loại khỏi vòng VCNV.',
        badge: '60/50/40/30đ',
      },
    ],
  },
  TANG_TOC: {
    tagline: 'Chạy đua tốc độ qua 4 câu hỏi thời gian thực cho tất cả thí sinh',
    points: [
      {
        title: 'Thi đấu đồng thời',
        desc: 'Gồm 4 câu hỏi. Tất cả thí sinh cùng trả lời đồng thời trong 30 giây cho mỗi câu.',
        badge: '30 giây / câu',
      },
      {
        title: 'Cộng điểm theo thứ tự tốc độ',
        desc: 'Trả lời đúng nhanh nhất nhận +30 điểm; nhanh thứ hai +25 điểm; thứ ba +20 điểm; thứ tư +15 điểm; thứ năm +10 điểm. Sai không bị trừ điểm.',
        badge: '+30 / +25 / +20...',
      },
    ],
  },
  VE_DICH: {
    tagline: 'Lượt thi cá nhân theo thứ tự điểm số từ cao xuống thấp',
    points: [
      {
        title: 'Chọn gói câu hỏi',
        desc: 'Thí sinh chọn 1 trong 3 gói: 40 điểm (10-10-20), 60 điểm (10-20-30), hoặc 80 điểm (20-30-30). Thời gian suy nghĩ: 10đ/15s, 20đ/20s, 30đ/30s.',
        badge: 'Gói 40/60/80đ',
      },
      {
        title: 'Ngôi sao hy vọng (dùng 1 lần duy nhất)',
        desc: 'Đặt trước khi trả lời câu hỏi: Trả lời đúng nhận x2 điểm câu hỏi, trả lời sai bị trừ đúng số điểm của câu đó.',
        badge: 'x2 hoặc -điểm',
      },
      {
        title: 'Giành quyền trả lời (Cướp điểm)',
        desc: 'Khi thí sinh chính trả lời sai/hết giờ, các thí sinh khác có 5s bấm chuông: Trả lời đúng nhận trọn điểm câu hỏi; Trả lời sai bị trừ 1/2 số điểm.',
        badge: 'Chuông 5s',
      },
    ],
  },
};

export const ReadyScreen: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const setReady = useGameStore((s) => s.setReady);
  const skipAbsent = useGameStore((s) => s.skipAbsent);

  if (!room || !myPlayer) return null;

  const isHost = room.hostId === myPlayer.id;
  const targetRound = room.state.targetRound || 'KD_RIENG';
  const isCountdown = room.state.subPhase === 'COUNTDOWN';

  const roundNames: Record<string, string> = {
    KD_RIENG: 'VÒNG 1: KHỞI ĐỘNG',
    VCNV: 'VÒNG 2: VƯỢT CHƯỚNG NGẠI VẬT',
    TANG_TOC: 'VÒNG 3: TĂNG TỐC',
    VE_DICH: 'VÒNG 4: VỀ ĐÍCH',
  };

  const currentRoundTitle = roundNames[targetRound] || 'VÒNG TIẾP THEO';
  const currentRule = ROUND_RULES[targetRound];

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full bg-white border-3 border-[#171717] rounded-3xl p-6 sm:p-8 shadow-neo-lg text-center flex flex-col items-center">
        <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3.5 py-1 rounded-full border-2 border-[#171717] shadow-neo-sm mb-2">
          Chuẩn bị bước vào
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mb-4">
          {currentRoundTitle}
        </h2>

        {/* Rule Box */}
        {currentRule && (
          <div className="w-full mb-6 p-4 sm:p-5 rounded-2xl bg-[#FFFDF7] border-2 border-[#171717] text-left shadow-neo">
            <div className="flex items-center gap-2 mb-2 text-[#171717] font-black text-xs uppercase tracking-wider">
              <BookOpen size={16} />
              <span>Luật chơi ngắn gọn</span>
            </div>
            <p className="text-xs text-gray-700 font-bold mb-3 italic">
              {currentRule.tagline}
            </p>
            <div className="space-y-2.5">
              {currentRule.points.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border-2 border-[#171717] shadow-neo-sm flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#171717] flex items-center gap-1.5">
                      <Zap size={14} className="text-[#FFE45C] fill-[#FFE45C] stroke-[#171717] shrink-0" />
                      {pt.title}
                    </span>
                    {pt.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#FFE45C] text-[#171717] border border-[#171717] tabular-nums">
                        {pt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 font-medium text-[11px] sm:text-xs leading-relaxed pl-5">
                    {pt.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCountdown ? (
          <div className="my-4 flex flex-col items-center">
            <span className="text-xs uppercase font-black text-gray-700 mb-2">Trận đấu bắt đầu sau</span>
            <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={3} />
          </div>
        ) : (
          <div className="w-full space-y-4 mb-6">
            <p className="text-xs sm:text-sm text-gray-700 font-bold">
              Vui lòng bấm nút <b>Sẵn sàng</b> để xác nhận và nạp phương tiện cho vòng đấu.
            </p>

            <button
              onClick={() => setReady(true)}
              disabled={myPlayer.ready}
              className={`w-full max-w-xs mx-auto py-3.5 px-6 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 border-2 border-[#171717] transition-all ${
                myPlayer.ready
                  ? 'bg-[#55D6C2] text-[#171717] shadow-neo cursor-default'
                  : 'bg-[#FFE45C] hover:bg-[#ffe040] text-[#171717] shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer'
              }`}
            >
              <CheckCircle2 size={18} />
              <span>{myPlayer.ready ? 'Bạn đã sẵn sàng' : 'Tôi đã sẵn sàng'}</span>
            </button>
          </div>
        )}

        {/* Players Readiness List */}
        <div className="w-full border-t-2 border-[#171717] pt-4 mt-2">
          <h4 className="text-[11px] uppercase tracking-wider font-black text-gray-700 mb-3 text-left">
            Trạng thái sẵn sàng của các thí sinh:
          </h4>
          <div className="space-y-2">
            {room.players.map((p) => {
              const isAbsent = !p.connected && p.disconnectedAt && Date.now() - p.disconnectedAt > 60000;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-[#FFFDF7] rounded-xl border-2 border-[#171717] shadow-neo-sm text-xs font-bold"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-600">G{p.seat}</span>
                    <span className="font-black text-[#171717]">{p.name}</span>
                    {!p.connected && (
                      <span className="flex items-center gap-1 text-[10px] text-[#FF9292] font-black bg-white border border-[#171717] px-1.5 py-0.5 rounded">
                        <AlertCircle size={10} /> Mất kết nối
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-black text-[10px] border border-[#171717] ${
                        p.ready
                          ? 'bg-[#55D6C2] text-[#171717]'
                          : 'bg-white text-gray-600'
                      }`}
                    >
                      {p.ready ? 'Sẵn sàng' : 'Chưa sẵn sàng'}
                    </span>

                    {/* Host skip absent button if disconnected > 60s */}
                    {isHost && isAbsent && !p.ready && (
                      <button
                        onClick={() => skipAbsent(p.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FF9292] hover:bg-[#ff7b7b] border border-[#171717] text-[#171717] text-[10px] font-black transition-all cursor-pointer shadow-neo-sm"
                        title="Bỏ qua thí sinh mất kết nối quá 60s"
                      >
                        <UserX size={10} />
                        <span>Bỏ qua</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
