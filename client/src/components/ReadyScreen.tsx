import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import {
  CheckCircle2,
  AlertCircle,
  UserX,
  BookOpen,
  Package,
  Bell,
  Layers,
  Key,
  Clock,
  Award,
  Trophy,
  Star,
  Zap,
  Eye,
  Crown,
} from 'lucide-react';

export const ReadyScreen: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const setReady = useGameStore((s) => s.setReady);
  const skipAbsent = useGameStore((s) => s.skipAbsent);
  const forceStartRound = useGameStore((s) => s.forceStartRound);

  if (!room || !myPlayer) return null;

  const isHost = room.hostId === myPlayer.id;
  const isViewer = myPlayer.role === 'viewer';
  const targetRound = room.state.targetRound || 'KD_RIENG';
  const isCountdown = room.state.subPhase === 'COUNTDOWN';
  const contestants = room.players.filter((p) => (p.role || 'player') === 'player');
  const viewers = room.players.filter((p) => p.role === 'viewer');

  const roundNames: Record<string, string> = {
    KD_RIENG: 'VÒNG 1: KHỞI ĐỘNG',
    VCNV: 'VÒNG 2: VƯỢT CHƯỚNG NGẠI VẬT',
    TANG_TOC: 'VÒNG 3: TĂNG TỐC',
    VE_DICH: 'VÒNG 4: VỀ ĐÍCH',
  };

  const currentRoundTitle = roundNames[targetRound] || 'VÒNG TIẾP THEO';

  // Render visual infographic cards for each round's rules
  const renderRuleInfographics = () => {
    switch (targetRound) {
      case 'KD_RIENG':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
            {/* Box 1: Khởi Động Riêng */}
            <div className="bg-[#111827] border border-[#303D52] rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-black text-sm sm:text-base lg:text-lg uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                    <Package size={18} className="text-[#FFD43B]" />
                    Khởi Động Riêng
                  </span>
                </div>

                {/* Mini illustration: 5 Mystery Boxes with '?' */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-xl p-2.5 my-2 flex items-center justify-between gap-2 shadow-inner">
                  {[
                    { border: 'border-[#FFD43B]', text: 'text-[#FFD43B]', glow: 'shadow-glow-yellow' },
                    { border: 'border-[#00D9FF]', text: 'text-[#00D9FF]', glow: 'shadow-glow-cyan' },
                    { border: 'border-[#FF496C]', text: 'text-[#FF496C]', glow: 'shadow-glow-danger' },
                    { border: 'border-[#20D6A0]', text: 'text-[#20D6A0]', glow: 'shadow-glow-success' },
                    { border: 'border-[#A855F7]', text: 'text-[#A855F7]', glow: 'shadow-glow-purple' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 flex items-center justify-center py-1.5 sm:py-2 bg-[#1C2638] border ${item.border} rounded-xl ${item.glow} font-heading font-black text-base sm:text-lg ${item.text} leading-none select-none`}
                    >
                      ?
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-left text-xs sm:text-sm lg:text-base font-medium text-[#94A3B8] mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Chọn 1 ô • 6 câu (15s/câu)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#20D6A0] shrink-0" />
                  <span className="text-[#F8FAFC]">
                    Đúng: <strong className="text-[#20D6A0]">+10đ</strong> | Sai: <strong>0đ</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF496C] shrink-0" />
                  <span>Ô đã chọn sẽ bị khóa</span>
                </div>
              </div>
            </div>

            {/* Box 2: Khởi Động Chung */}
            <div className="bg-[#111827] border border-[#303D52] rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-black text-sm sm:text-base lg:text-lg uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                    <Bell size={18} className="text-[#FFD43B]" />
                    Khởi Động Chung
                  </span>
                </div>

                {/* Mini illustration: Buzzer bell */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-xl p-2.5 my-2 flex items-center justify-center gap-3 shadow-inner">
                  <div className="w-8 h-8 rounded-full bg-[#FFD43B] border border-[#FFD43B] text-[#090D18] flex items-center justify-center shadow-glow-yellow">
                    <Bell size={16} className="text-[#090D18] animate-bounce" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs sm:text-sm font-heading font-black uppercase text-[#F8FAFC] block leading-none">Bấm Chuông (Phím Space)</span>
                    <span className="text-xs text-[#94A3B8]">Giành quyền trong 3 giây</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-left text-xs sm:text-sm lg:text-base font-medium text-[#94A3B8] mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>12 câu hỏi chung cho tất cả</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#20D6A0] shrink-0" />
                  <span className="text-[#F8FAFC]">
                    Đúng: <strong className="text-[#20D6A0]">+10đ</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF496C] shrink-0" />
                  <span className="text-[#F8FAFC]">
                    Sai / Hết giờ: <strong className="text-[#FF496C]">-5đ</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'VCNV':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
            {/* Box 1: 4 Hàng Ngang */}
            <div className="bg-[#111827] border border-[#303D52] rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-black text-sm sm:text-base lg:text-lg uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                    <Layers size={18} className="text-[#00D9FF]" />
                    4 Hàng Ngang (Gợi Ý)
                  </span>
                  <span className="text-xs sm:text-sm font-digital font-bold bg-[#FFD43B]/20 text-[#FFD43B] px-2.5 py-0.5 rounded-lg border border-[#FFD43B]/40 tabular-nums">
                    +10đ / hàng
                  </span>
                </div>

                {/* Mini illustration: 4 Rows */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-xl p-2 my-2 space-y-1 shadow-inner">
                  {[1, 2, 3, 4].map((r) => (
                    <div key={r} className="flex items-center gap-1.5 bg-[#1C2638] border border-[#303D52] px-2 py-0.5 rounded-lg">
                      <span className="text-xs font-heading font-black w-4 h-4 rounded-full bg-[#FFD43B] text-[#090D18] flex items-center justify-center">
                        {r}
                      </span>
                      <div className="flex gap-1 flex-1">
                        {Array.from({ length: 6 }).map((_, c) => (
                          <div key={c} className="w-3 h-3 rounded-[3px] bg-[#303D52]/60 border border-[#00D9FF]/20" />
                        ))}
                      </div>
                      <span className="text-xs font-digital text-[#94A3B8] tabular-nums font-bold">30s</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-left text-xs sm:text-sm lg:text-base font-medium text-[#94A3B8] mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Chọn hàng • Cùng trả lời 30s</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#20D6A0] shrink-0" />
                  <span className="text-[#F8FAFC]">
                    Đúng: <strong className="text-[#20D6A0]">+10đ</strong> & mở ô chữ
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Từ Khóa Chướng Ngại Vật */}
            <div className="bg-[#111827] border border-[#303D52] rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-black text-sm sm:text-base lg:text-lg uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                    <Key size={18} className="text-[#FFD43B]" />
                    Từ Khóa Chính
                  </span>
                  <span className="text-xs sm:text-sm font-digital font-bold bg-[#00D9FF]/20 text-[#00D9FF] px-2.5 py-0.5 rounded-lg border border-[#00D9FF]/40 tabular-nums">
                    60đ ➔ 20đ
                  </span>
                </div>

                {/* Mini illustration: Score ladder */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-xl p-2 my-2 flex items-center justify-between gap-1.5 shadow-inner">
                  {[
                    { q: 'C1', pts: '60đ' },
                    { q: 'C2', pts: '50đ' },
                    { q: 'C3', pts: '40đ' },
                    { q: 'C4', pts: '30đ' },
                    { q: 'TT', pts: '20đ' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center py-1 bg-[#1C2638] border border-[#303D52] rounded-lg"
                    >
                      <span className="text-[11px] sm:text-xs text-[#94A3B8] font-bold">{item.q}</span>
                      <span className="text-xs sm:text-sm font-digital font-bold text-[#FFD43B] tabular-nums">{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-left text-xs sm:text-sm lg:text-base font-medium text-[#94A3B8] mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shrink-0" />
                  <span className="truncate">Đoán từ khóa chính • Điểm giảm dần</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Chuông mở sau khi câu 1 xuất hiện</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF496C] shrink-0" />
                  <span className="text-[#FF496C] font-bold">Đoán sai: Bị loại khỏi vòng VCNV</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'TANG_TOC':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
            {/* Box 1: Thể thức thi đấu */}
            <div className="bg-[#111827] border border-[#303D52] rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-black text-sm sm:text-base lg:text-lg uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                    <Clock size={18} className="text-[#00D9FF]" />
                    Chạy Đua Tốc Độ
                  </span>
                  <span className="text-xs sm:text-sm font-digital font-bold bg-[#FFD43B]/20 text-[#FFD43B] px-2.5 py-0.5 rounded-lg border border-[#FFD43B]/40 tabular-nums">
                    30s / câu
                  </span>
                </div>

                {/* Mini illustration: 4 questions */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-xl p-2 my-2 flex items-center justify-between gap-1.5 shadow-inner">
                  {[1, 2, 3, 4].map((q) => (
                    <div
                      key={q}
                      className="flex-1 flex flex-col items-center py-1 bg-[#1C2638] border border-[#303D52] rounded-lg"
                    >
                      <Zap size={14} className="text-[#FFD43B] fill-[#FFD43B]" />
                      <span className="text-xs sm:text-sm font-heading font-bold text-[#F8FAFC]">Câu {q}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-left text-xs sm:text-sm lg:text-base font-medium text-[#94A3B8] mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>4 câu hỏi • Cùng nộp trong 30s</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#20D6A0] shrink-0" />
                  <span>Càng nhanh càng nhiều điểm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#64748B] shrink-0" />
                  <span>Sai không bị trừ điểm</span>
                </div>
              </div>
            </div>

            {/* Box 2: Thang Điểm Tốc Độ */}
            <div className="bg-[#111827] border border-[#303D52] rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-black text-sm sm:text-base lg:text-lg uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                    <Award size={18} className="text-[#FFD43B]" />
                    Thang Điểm Tốc Độ
                  </span>
                  <span className="text-xs sm:text-sm font-digital font-bold bg-[#00D9FF]/20 text-[#00D9FF] px-2.5 py-0.5 rounded-lg border border-[#00D9FF]/40">
                    Top 1 ➔ 5
                  </span>
                </div>

                {/* Mini illustration: Speed ranks */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-xl p-2 my-2 flex items-center justify-between gap-1.5 shadow-inner">
                  {[
                    { rank: '#1', pts: '+30đ', border: 'border-[#FFD43B]', text: 'text-[#FFD43B]' },
                    { rank: '#2', pts: '+25đ', border: 'border-[#00D9FF]', text: 'text-[#00D9FF]' },
                    { rank: '#3', pts: '+20đ', border: 'border-[#20D6A0]', text: 'text-[#20D6A0]' },
                    { rank: '#4', pts: '+15đ', border: 'border-[#303D52]', text: 'text-[#F8FAFC]' },
                    { rank: '#5', pts: '+10đ', border: 'border-[#303D52]', text: 'text-[#94A3B8]' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 flex flex-col items-center py-1 rounded-lg bg-[#1C2638] border ${item.border}`}
                    >
                      <span className="text-xs font-heading font-bold text-[#94A3B8]">{item.rank}</span>
                      <span className={`text-xs sm:text-sm font-digital font-bold tabular-nums ${item.text}`}>{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-left text-xs sm:text-sm lg:text-base font-medium text-[#94A3B8] mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Chỉ tính câu trả lời đúng</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFD43B] shrink-0" />
                  <span className="text-[#F8FAFC]">Xếp hạng theo giây nộp bài</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'VE_DICH':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
            {/* Box 1: Chọn gói câu hỏi */}
            <div className="bg-[#111827] border border-[#303D52] rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-black text-sm sm:text-base lg:text-lg uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                    <Trophy size={18} className="text-[#FFD43B]" />
                    Chọn Gói Điểm
                  </span>
                  <span className="text-xs sm:text-sm font-digital font-bold bg-[#FFD43B]/20 text-[#FFD43B] px-2.5 py-0.5 rounded-lg border border-[#FFD43B]/40 tabular-nums">
                    40 / 60 / 80đ
                  </span>
                </div>

                {/* Mini illustration: 3 packages */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-xl p-2 my-2 flex items-center justify-between gap-2 shadow-inner">
                  {[
                    { pts: '40 ĐIỂM', sub: '10-10-20' },
                    { pts: '60 ĐIỂM', sub: '10-20-30' },
                    { pts: '80 ĐIỂM', sub: '20-30-30' },
                  ].map((pkg, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center py-1.5 bg-[#1C2638] border border-[#303D52] rounded-xl"
                    >
                      <span className="text-xs sm:text-sm md:text-base font-heading font-black text-[#FFD43B]">{pkg.pts}</span>
                      <span className="text-xs text-[#94A3B8] font-digital font-bold mt-0.5">{pkg.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-left text-xs sm:text-sm lg:text-base font-medium text-[#94A3B8] mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Thời gian: 30s / câu (mọi mức điểm)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFD43B] shrink-0" />
                  <span>Thi đấu theo thứ tự điểm số</span>
                </div>
              </div>
            </div>

            {/* Box 2: Ngôi Sao Hy Vọng & Cướp Điểm */}
            <div className="bg-[#111827] border border-[#303D52] rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-black text-sm sm:text-base lg:text-lg uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                    <Star size={18} className="text-[#FFD43B]" />
                    Ngôi Sao & Giành Quyền
                  </span>
                  <span className="text-xs sm:text-sm font-digital font-bold bg-[#00D9FF]/20 text-[#00D9FF] px-2.5 py-0.5 rounded-lg border border-[#00D9FF]/40">
                    x2 / cướp điểm
                  </span>
                </div>

                {/* Mini illustration: Star & Buzzer */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-xl p-2 my-2 flex items-center justify-around gap-2 shadow-inner">
                  <div className="flex items-center gap-2 bg-[#1C2638] border border-[#303D52] px-3 py-1.5 rounded-xl">
                    <Star size={16} className="fill-[#FFD43B] text-[#FFD43B]" />
                    <div className="text-left">
                      <span className="text-xs sm:text-sm font-heading font-bold text-[#F8FAFC] block leading-none">Ngôi Sao</span>
                      <span className="text-[11px] text-[#94A3B8] mt-0.5 block">1 lần / vòng</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#1C2638] border border-[#303D52] px-3 py-1.5 rounded-xl">
                    <Bell size={16} className="text-[#00D9FF]" />
                    <div className="text-left">
                      <span className="text-xs sm:text-sm font-heading font-bold text-[#F8FAFC] block leading-none">Chuông 5s</span>
                      <span className="text-[11px] text-[#94A3B8] mt-0.5 block">Cướp điểm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-left text-xs sm:text-sm lg:text-base font-medium text-[#94A3B8] mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFD43B] shrink-0" />
                  <span>Ngôi sao: Đúng x2 | Sai trừ số điểm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Chuông: Đúng nhận trọn | Sai trừ 1/2đ</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center justify-center h-full max-h-full py-1.5 px-3 overflow-hidden">
      <div className="w-full bg-[#111827] border border-[#303D52] rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl text-center flex flex-col items-center">
        <span className="text-xs sm:text-sm lg:text-base font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-4 py-1.5 rounded-full border border-[#FFD43B]/40 shadow-glow-yellow mb-2">
          Chuẩn bị bước vào
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-[#F8FAFC] mb-3">
          {currentRoundTitle}
        </h2>

        {/* Summary Scoreboard at the end of each round */}
        {targetRound !== 'KD_RIENG' && (
          <div className="w-full mb-3 p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-[#1C2638] to-[#111827] border-2 border-[#FFD43B]/50 shadow-[0_4px_25px_rgba(255,212,59,0.15)] text-left">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-[#FFD43B] font-heading font-black text-xs sm:text-sm lg:text-base uppercase tracking-wider">
                <Trophy size={18} className="text-[#FFD43B]" />
                <span>BẢNG TỔNG KẾT ĐIỂM SỐ SAU VÒNG ĐẤU</span>
              </div>
              <span className="text-[11px] sm:text-xs text-[#94A3B8] font-heading font-semibold">
                Xếp hạng hiện tại
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
              {[...contestants].sort((a, b) => b.score - a.score).map((p, index) => {
                const isLeader = index === 0 && p.score > 0;
                const isMe = p.id === myPlayer.id;
                const medals = ['🥇', '🥈', '🥉', '4', '5'];
                return (
                  <div
                    key={p.id}
                    className={`p-2.5 sm:p-3 rounded-xl border flex flex-col justify-between transition-all ${
                      isLeader
                        ? 'bg-[#1C2638] border-[#FFD43B] shadow-[0_0_15px_rgba(255,212,59,0.25)]'
                        : isMe
                        ? 'bg-[#162132] border-[#00D9FF]/70'
                        : 'bg-[#0E1524] border-[#303D52]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-sm sm:text-base font-black">
                        {medals[index] || index + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate max-w-[100px]" title={p.name}>
                        {p.name}
                      </span>
                      {isLeader && <Crown size={15} className="text-[#FFD43B] fill-[#FFD43B] shrink-0" />}
                    </div>
                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-digital font-black text-[#FFD43B] tabular-nums">
                        {p.score}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] ml-1 font-heading font-bold">điểm</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rule Box with Visual Infographics */}
        <div className="w-full mb-3 sm:mb-4 p-3 sm:p-4 rounded-2xl bg-[#1C2638] border border-[#303D52] text-left shadow-lg">
          <div className="flex items-center gap-2 mb-2.5 text-[#F8FAFC] font-heading font-bold text-sm sm:text-base lg:text-lg uppercase tracking-wider">
            <BookOpen size={18} className="text-[#00D9FF]" />
            <span>Luật chơi tóm tắt</span>
          </div>

          {renderRuleInfographics()}
        </div>

        {isCountdown ? (
          <div className="my-2.5 flex flex-col items-center">
            <span className="text-xs sm:text-sm uppercase font-heading font-bold text-[#94A3B8] mb-1.5">Trận đấu bắt đầu sau</span>
            <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={3} />
          </div>
        ) : (
          <div className="w-full mb-3 sm:mb-4 flex flex-col items-center">
            {isViewer ? (
              <div className="w-full max-w-lg p-3 bg-[#00D9FF]/10 border border-[#00D9FF]/40 rounded-2xl flex items-center justify-center gap-2.5 text-xs sm:text-sm md:text-base text-[#00D9FF] font-bold shadow-glow-cyan">
                <Eye size={20} className="shrink-0" />
                <span>Bạn đang theo dõi với vai trò Khán giả. Trận đấu bắt đầu khi thí sinh sẵn sàng.</span>
              </div>
            ) : (
              <button
                onClick={() => setReady(true)}
                disabled={myPlayer.ready}
                className={`w-full max-w-sm sm:max-w-md py-3.5 px-8 sm:py-4 sm:px-12 rounded-2xl font-heading font-black uppercase tracking-wider text-base sm:text-lg lg:text-xl flex items-center justify-center gap-2.5 border transition-all ${
                  myPlayer.ready
                    ? 'bg-[#20D6A0] text-[#090D18] border-[#20D6A0] shadow-glow-success cursor-default'
                    : 'bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] border-[#FFD43B] shadow-glow-yellow-lg hover:scale-105 active:scale-95 cursor-pointer'
                }`}
              >
                <CheckCircle2 size={22} />
                <span>{myPlayer.ready ? 'Bạn đã sẵn sàng' : 'Tôi đã sẵn sàng'}</span>
              </button>
            )}

            {isHost && (
              <button
                onClick={forceStartRound}
                className="mt-2 text-xs font-heading font-bold text-[#94A3B8] hover:text-[#FFD43B] underline cursor-pointer hover:scale-105 transition-transform"
                title="Bắt đầu vòng thi ngay lập tức không cần chờ"
              >
                ⚡ Bắt đầu vòng thi ngay (Chủ phòng)
              </button>
            )}
          </div>
        )}

        {/* Contestants Readiness List - Compact 5-column / 2-column Grid */}
        <div className="w-full border-t border-[#303D52] pt-3 mt-1">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs sm:text-sm lg:text-base uppercase tracking-wider font-heading font-bold text-[#94A3B8]">
              Trạng thái sẵn sàng ({contestants.filter((p) => p.ready).length}/{contestants.length}):
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 w-full">
            {contestants.map((p) => {
              const isAbsent = !p.connected && p.disconnectedAt && Date.now() - p.disconnectedAt > 60000;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 sm:p-3 bg-[#1C2638] rounded-2xl border text-sm sm:text-base ${
                    p.ready ? 'border-[#20D6A0]/40 shadow-glow-success' : 'border-[#303D52]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-[#F8FAFC] truncate text-xs sm:text-sm lg:text-base max-w-[120px] sm:max-w-[160px]">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full font-heading font-bold text-xs sm:text-sm border ${
                        p.ready
                          ? 'bg-[#20D6A0]/20 text-[#20D6A0] border-[#20D6A0]/40'
                          : 'bg-[#111827] text-[#64748B] border-[#303D52]'
                      }`}
                    >
                      {p.ready ? 'Sẵn sàng' : 'Chưa'}
                    </span>

                    {/* Host skip absent button if disconnected > 60s */}
                    {isHost && isAbsent && !p.ready && (
                      <button
                        onClick={() => skipAbsent(p.id)}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-[#FF496C]/20 hover:bg-[#FF496C] border border-[#FF496C]/40 text-[#FF496C] hover:text-white text-xs font-heading font-bold transition-all cursor-pointer"
                        title="Bỏ qua thí sinh mất kết nối quá 60s"
                      >
                        <UserX size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {viewers.length > 0 && (
            <div className="mt-3 pt-2 border-t border-[#303D52]/40 flex items-center justify-between text-xs sm:text-sm text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#00D9FF]" />
                <span className="font-heading font-bold text-[#00D9FF]">Khán giả ({viewers.length}):</span>
              </div>
              <span className="text-[#F8FAFC] font-medium truncate max-w-sm sm:max-w-md">
                {viewers.map((v) => v.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
