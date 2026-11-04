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
        desc: 'Mỗi thí sinh lần lượt trả lời 5 câu riêng (10s/câu). Đúng được +10 điểm, trả lời sai không bị trừ điểm.',
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
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur text-center flex flex-col items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">
          Chuẩn bị bước vào
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 mb-4">
          {currentRoundTitle}
        </h2>

        {/* Rule Box */}
        {currentRule && (
          <div className="w-full mb-6 p-4 rounded-2xl bg-slate-950/70 border border-amber-500/30 text-left shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <BookOpen size={16} />
              <span>Luật chơi ngắn gọn</span>
            </div>
            <p className="text-xs text-amber-200/90 font-medium mb-3 italic">
              {currentRule.tagline}
            </p>
            <div className="space-y-2">
              {currentRule.points.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Zap size={13} className="text-amber-400 shrink-0" />
                      {pt.title}
                    </span>
                    {pt.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-950/80 text-amber-400 border border-amber-500/30 font-mono">
                        {pt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed pl-4">
                    {pt.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCountdown ? (
          <div className="my-4 flex flex-col items-center">
            <span className="text-xs uppercase font-bold text-slate-400 mb-2">Trận đấu bắt đầu sau</span>
            <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={3} />
          </div>
        ) : (
          <div className="w-full space-y-4 mb-6">
            <p className="text-xs sm:text-sm text-slate-300">
              Vui lòng bấm nút <b>Sẵn sàng</b> để xác nhận và nạp phương tiện cho vòng đấu.
            </p>

            <button
              onClick={() => setReady(true)}
              disabled={myPlayer.ready}
              className={`w-full max-w-xs mx-auto py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
                myPlayer.ready
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95'
              }`}
            >
              <CheckCircle2 size={18} />
              <span>{myPlayer.ready ? 'Bạn đã sẵn sàng' : 'Tôi đã sẵn sàng'}</span>
            </button>
          </div>
        )}

        {/* Players Readiness List */}
        <div className="w-full border-t border-slate-800/80 pt-4 mt-2">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3 text-left">
            Trạng thái sẵn sàng của các thí sinh:
          </h4>
          <div className="space-y-2">
            {room.players.map((p) => {
              const isAbsent = !p.connected && p.disconnectedAt && Date.now() - p.disconnectedAt > 60000;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">G{p.seat}</span>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    {!p.connected && (
                      <span className="flex items-center gap-1 text-[10px] text-rose-400">
                        <AlertCircle size={10} /> Mất kết nối
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        p.ready
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {p.ready ? 'Sẵn sàng' : 'Chưa sẵn sàng'}
                    </span>

                    {/* Host skip absent button if disconnected > 60s */}
                    {isHost && isAbsent && !p.ready && (
                      <button
                        onClick={() => skipAbsent(p.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-semibold transition-colors"
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