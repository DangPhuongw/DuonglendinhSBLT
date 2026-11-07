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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {/* Box 1: Khởi Động Riêng */}
            <div className="bg-[#111827] border border-[#303D52] rounded-xl p-2.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <Package size={14} className="text-[#FFD43B]" />
                    Khởi Động Riêng
                  </span>
                </div>

                {/* Mini illustration: 5 Mystery Boxes with '?' */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-lg p-1.5 my-1 flex items-center justify-between gap-1 shadow-inner">
                  {[
                    { border: 'border-[#FFD43B]', text: 'text-[#FFD43B]', glow: 'shadow-glow-yellow' },
                    { border: 'border-[#00D9FF]', text: 'text-[#00D9FF]', glow: 'shadow-glow-cyan' },
                    { border: 'border-[#FF496C]', text: 'text-[#FF496C]', glow: 'shadow-glow-danger' },
                    { border: 'border-[#20D6A0]', text: 'text-[#20D6A0]', glow: 'shadow-glow-success' },
                    { border: 'border-[#A855F7]', text: 'text-[#A855F7]', glow: 'shadow-glow-purple' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 flex items-center justify-center py-0.5 bg-[#1C2638] border ${item.border} rounded-md ${item.glow} font-heading font-black text-xs ${item.text} leading-none select-none`}
                    >
                      ?
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5 text-left text-[11px] font-medium text-[#94A3B8] mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Chọn 1 ô • 6 câu (15s/câu)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20D6A0] shrink-0" />
                  <span className="text-[#F8FAFC]">
                    Đúng: <strong className="text-[#20D6A0]">+10đ</strong> | Sai: <strong>0đ</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF496C] shrink-0" />
                  <span>Ô đã chọn sẽ bị khóa</span>
                </div>
              </div>
            </div>

            {/* Box 2: Khởi Động Chung */}
            <div className="bg-[#111827] border border-[#303D52] rounded-xl p-2.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <Bell size={14} className="text-[#FFD43B]" />
                    Khởi Động Chung
                  </span>
                </div>

                {/* Mini illustration: Buzzer bell */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-lg p-1.5 my-1 flex items-center justify-center gap-2 shadow-inner">
                  <div className="w-6 h-6 rounded-full bg-[#FFD43B] border border-[#FFD43B] text-[#090D18] flex items-center justify-center shadow-glow-yellow">
                    <Bell size={12} className="text-[#090D18] animate-bounce" />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-heading font-bold uppercase text-[#F8FAFC] block leading-none">Bấm Chuông (Space)</span>
                    <span className="text-[9px] text-[#94A3B8]">Giành quyền trong 3 giây</span>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 text-left text-[11px] font-medium text-[#94A3B8] mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>12 câu hỏi chung cho tất cả</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20D6A0] shrink-0" />
                  <span className="text-[#F8FAFC]">
                    Đúng: <strong className="text-[#20D6A0]">+10đ</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF496C] shrink-0" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {/* Box 1: 4 Hàng Ngang */}
            <div className="bg-[#111827] border border-[#303D52] rounded-xl p-2.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <Layers size={14} className="text-[#00D9FF]" />
                    4 Hàng Ngang (Gợi Ý)
                  </span>
                  <span className="text-[9px] font-digital font-bold bg-[#FFD43B]/20 text-[#FFD43B] px-1.5 py-0.5 rounded border border-[#FFD43B]/40 tabular-nums">
                    +10đ / hàng
                  </span>
                </div>

                {/* Mini illustration: 4 Rows */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-lg p-1.5 my-1 space-y-0.5 shadow-inner">
                  {[1, 2, 3, 4].map((r) => (
                    <div key={r} className="flex items-center gap-1 bg-[#1C2638] border border-[#303D52] px-1.5 py-0.5 rounded">
                      <span className="text-[8px] font-heading font-bold w-3 h-3 rounded-full bg-[#FFD43B] text-[#090D18] flex items-center justify-center">
                        {r}
                      </span>
                      <div className="flex gap-0.5 flex-1">
                        {Array.from({ length: 6 }).map((_, c) => (
                          <div key={c} className="w-2 h-2 rounded-[2px] bg-[#303D52]/60 border border-[#00D9FF]/20" />
                        ))}
                      </div>
                      <span className="text-[8px] font-digital text-[#64748B] tabular-nums">30s</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5 text-left text-[11px] font-medium text-[#94A3B8] mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Chọn hàng • Cùng trả lời 30s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20D6A0] shrink-0" />
                  <span className="text-[#F8FAFC]">
                    Đúng: <strong className="text-[#20D6A0]">+10đ</strong> & mở ô chữ
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Từ Khóa Chướng Ngại Vật */}
            <div className="bg-[#111827] border border-[#303D52] rounded-xl p-2.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <Key size={14} className="text-[#FFD43B]" />
                    Từ Khóa Chính
                  </span>
                  <span className="text-[9px] font-digital font-bold bg-[#00D9FF]/20 text-[#00D9FF] px-1.5 py-0.5 rounded border border-[#00D9FF]/40 tabular-nums">
                    60đ ➔ 20đ
                  </span>
                </div>

                {/* Mini illustration: Score ladder */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-lg p-1.5 my-1 flex items-center justify-between gap-1 shadow-inner">
                  {[
                    { q: 'C1', pts: '60đ' },
                    { q: 'C2', pts: '50đ' },
                    { q: 'C3', pts: '40đ' },
                    { q: 'C4', pts: '30đ' },
                    { q: 'TT', pts: '20đ' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center py-0.5 bg-[#1C2638] border border-[#303D52] rounded"
                    >
                      <span className="text-[7px] text-[#64748B] font-bold">{item.q}</span>
                      <span className="text-[9px] font-digital font-bold text-[#FFD43B] tabular-nums">{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5 text-left text-[11px] font-medium text-[#94A3B8] mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                  <span className="truncate">Đoán từ khóa chính • Điểm giảm dần</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Chuông mở sau khi câu 1 xuất hiện</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF496C] shrink-0" />
                  <span className="text-[#FF496C] font-bold">Đoán sai: Bị loại khỏi vòng VCNV</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'TANG_TOC':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {/* Box 1: Thể thức thi đấu */}
            <div className="bg-[#111827] border border-[#303D52] rounded-xl p-2.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <Clock size={14} className="text-[#00D9FF]" />
                    Chạy Đua Tốc Độ
                  </span>
                  <span className="text-[9px] font-digital font-bold bg-[#FFD43B]/20 text-[#FFD43B] px-1.5 py-0.5 rounded border border-[#FFD43B]/40 tabular-nums">
                    30s / câu
                  </span>
                </div>

                {/* Mini illustration: 4 questions */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-lg p-1.5 my-1 flex items-center justify-between gap-1 shadow-inner">
                  {[1, 2, 3, 4].map((q) => (
                    <div
                      key={q}
                      className="flex-1 flex flex-col items-center py-0.5 bg-[#1C2638] border border-[#303D52] rounded-md"
                    >
                      <Zap size={12} className="text-[#FFD43B] fill-[#FFD43B]" />
                      <span className="text-[9px] font-heading font-bold text-[#F8FAFC]">Câu {q}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5 text-left text-[11px] font-medium text-[#94A3B8] mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>4 câu hỏi • Cùng nộp trong 30s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20D6A0] shrink-0" />
                  <span>Càng nhanh càng nhiều điểm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#64748B] shrink-0" />
                  <span>Sai không bị trừ điểm</span>
                </div>
              </div>
            </div>

            {/* Box 2: Thang Điểm Tốc Độ */}
            <div className="bg-[#111827] border border-[#303D52] rounded-xl p-2.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <Award size={14} className="text-[#FFD43B]" />
                    Thang Điểm Tốc Độ
                  </span>
                  <span className="text-[9px] font-digital font-bold bg-[#00D9FF]/20 text-[#00D9FF] px-1.5 py-0.5 rounded border border-[#00D9FF]/40">
                    Top 1 ➔ 5
                  </span>
                </div>

                {/* Mini illustration: Speed ranks */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-lg p-1.5 my-1 flex items-center justify-between gap-1 shadow-inner">
                  {[
                    { rank: '#1', pts: '+30đ', border: 'border-[#FFD43B]', text: 'text-[#FFD43B]' },
                    { rank: '#2', pts: '+25đ', border: 'border-[#00D9FF]', text: 'text-[#00D9FF]' },
                    { rank: '#3', pts: '+20đ', border: 'border-[#20D6A0]', text: 'text-[#20D6A0]' },
                    { rank: '#4', pts: '+15đ', border: 'border-[#303D52]', text: 'text-[#F8FAFC]' },
                    { rank: '#5', pts: '+10đ', border: 'border-[#303D52]', text: 'text-[#94A3B8]' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 flex flex-col items-center py-0.5 rounded bg-[#1C2638] border ${item.border}`}
                    >
                      <span className="text-[8px] font-heading font-bold text-[#94A3B8]">{item.rank}</span>
                      <span className={`text-[9px] font-digital font-bold tabular-nums ${item.text}`}>{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5 text-left text-[11px] font-medium text-[#94A3B8] mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Chỉ tính câu trả lời đúng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD43B] shrink-0" />
                  <span className="text-[#F8FAFC]">Xếp hạng theo giây nộp bài</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'VE_DICH':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {/* Box 1: Chọn gói câu hỏi */}
            <div className="bg-[#111827] border border-[#303D52] rounded-xl p-2.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <Trophy size={14} className="text-[#FFD43B]" />
                    Chọn Gói Điểm
                  </span>
                  <span className="text-[9px] font-digital font-bold bg-[#FFD43B]/20 text-[#FFD43B] px-1.5 py-0.5 rounded border border-[#FFD43B]/40 tabular-nums">
                    40 / 60 / 80đ
                  </span>
                </div>

                {/* Mini illustration: 3 packages */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-lg p-1.5 my-1 flex items-center justify-between gap-1 shadow-inner">
                  {[
                    { pts: '40 ĐIỂM', sub: '10-10-20' },
                    { pts: '60 ĐIỂM', sub: '10-20-30' },
                    { pts: '80 ĐIỂM', sub: '20-30-30' },
                  ].map((pkg, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center py-0.5 bg-[#1C2638] border border-[#303D52] rounded-md"
                    >
                      <span className="text-[10px] font-heading font-bold text-[#FFD43B]">{pkg.pts}</span>
                      <span className="text-[8px] text-[#64748B] font-digital font-bold">{pkg.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5 text-left text-[11px] font-medium text-[#94A3B8] mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                  <span>Thời gian: 10đ/15s • 20đ/20s • 30đ/30s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD43B] shrink-0" />
                  <span>Thi đấu theo thứ tự điểm số</span>
                </div>
              </div>
            </div>

            {/* Box 2: Ngôi Sao Hy Vọng & Cướp Điểm */}
            <div className="bg-[#111827] border border-[#303D52] rounded-xl p-2.5 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                    <Star size={14} className="text-[#FFD43B]" />
                    Ngôi Sao & Giành Quyền
                  </span>
                  <span className="text-[9px] font-digital font-bold bg-[#00D9FF]/20 text-[#00D9FF] px-1.5 py-0.5 rounded border border-[#00D9FF]/40">
                    x2 / cướp điểm
                  </span>
                </div>

                {/* Mini illustration: Star & Buzzer */}
                <div className="bg-[#090D18] border border-[#303D52] rounded-lg p-1.5 my-1 flex items-center justify-around gap-1.5 shadow-inner">
                  <div className="flex items-center gap-1 bg-[#1C2638] border border-[#303D52] px-2 py-0.5 rounded-md">
                    <Star size={12} className="fill-[#FFD43B] text-[#FFD43B]" />
                    <div className="text-left">
                      <span className="text-[9px] font-heading font-bold text-[#F8FAFC] block leading-none">Ngôi Sao</span>
                      <span className="text-[8px] text-[#64748B]">1 lần / vòng</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-[#1C2638] border border-[#303D52] px-2 py-0.5 rounded-md">
                    <Bell size={12} className="text-[#00D9FF]" />
                    <div className="text-left">
                      <span className="text-[9px] font-heading font-bold text-[#F8FAFC] block leading-none">Chuông 5s</span>
                      <span className="text-[8px] text-[#64748B]">Cướp điểm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 text-left text-[11px] font-medium text-[#94A3B8] mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD43B] shrink-0" />
                  <span>Ngôi sao: Đúng x2 | Sai trừ số điểm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
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
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center h-full max-h-full py-1 px-2 overflow-hidden">
      <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl p-3 sm:p-4 shadow-2xl text-center flex flex-col items-center">
        <span className="text-[10px] sm:text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3 py-0.5 rounded-full border border-[#FFD43B]/40 shadow-glow-yellow mb-1">
          Chuẩn bị bước vào
        </span>
        <h2 className="text-lg sm:text-xl font-heading font-black text-[#F8FAFC] mb-2">
          {currentRoundTitle}
        </h2>

        {/* Rule Box with Visual Infographics */}
        <div className="w-full mb-2.5 p-2 sm:p-2.5 rounded-xl bg-[#1C2638] border border-[#303D52] text-left shadow-lg">
          <div className="flex items-center gap-1.5 mb-1.5 text-[#F8FAFC] font-heading font-bold text-[11px] uppercase tracking-wider">
            <BookOpen size={14} className="text-[#00D9FF]" />
            <span>Luật chơi tóm tắt</span>
          </div>

          {renderRuleInfographics()}
        </div>

        {isCountdown ? (
          <div className="my-2 flex flex-col items-center">
            <span className="text-[11px] uppercase font-heading font-bold text-[#94A3B8] mb-1">Trận đấu bắt đầu sau</span>
            <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={3} />
          </div>
        ) : (
          <div className="w-full mb-2.5 flex flex-col items-center">
            {isViewer ? (
              <div className="w-full max-w-md p-2 bg-[#00D9FF]/10 border border-[#00D9FF]/40 rounded-xl flex items-center justify-center gap-2 text-xs text-[#00D9FF] font-bold shadow-glow-cyan">
                <Eye size={16} className="shrink-0" />
                <span>Bạn đang theo dõi với vai trò Khán giả. Trận đấu bắt đầu khi thí sinh sẵn sàng.</span>
              </div>
            ) : (
              <button
                onClick={() => setReady(true)}
                disabled={myPlayer.ready}
                className={`w-full max-w-xs py-2 sm:py-2.5 px-6 rounded-xl font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 border transition-all ${
                  myPlayer.ready
                    ? 'bg-[#20D6A0] text-[#090D18] border-[#20D6A0] shadow-glow-success cursor-default'
                    : 'bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] border-[#FFD43B] shadow-glow-yellow-lg hover:scale-105 active:scale-95 cursor-pointer'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>{myPlayer.ready ? 'Bạn đã sẵn sàng' : 'Tôi đã sẵn sàng'}</span>
              </button>
            )}

            {isHost && (
              <button
                onClick={forceStartRound}
                className="mt-1.5 text-[11px] font-heading font-bold text-[#94A3B8] hover:text-[#FFD43B] underline cursor-pointer hover:scale-105 transition-transform"
                title="Bắt đầu vòng thi ngay lập tức không cần chờ"
              >
                ⚡ Bắt đầu vòng thi ngay (Chủ phòng)
              </button>
            )}
          </div>
        )}

        {/* Contestants Readiness List - Compact 5-column / 2-column Grid */}
        <div className="w-full border-t border-[#303D52] pt-2 mt-0.5">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-[10px] uppercase tracking-wider font-heading font-bold text-[#94A3B8]">
              Trạng thái sẵn sàng ({contestants.filter((p) => p.ready).length}/{contestants.length}):
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 w-full">
            {contestants.map((p) => {
              const isAbsent = !p.connected && p.disconnectedAt && Date.now() - p.disconnectedAt > 60000;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-1.5 px-2 bg-[#1C2638] rounded-lg border text-xs ${
                    p.ready ? 'border-[#20D6A0]/40' : 'border-[#303D52]'
                  }`}
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="font-heading font-bold text-[#FFD43B] text-[10px]">G{p.seat}</span>
                    <span className="font-bold text-[#F8FAFC] truncate text-[11px] max-w-[65px]">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`px-1.5 py-0.5 rounded-full font-heading font-bold text-[9px] border ${
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
                        className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-[#FF496C]/20 hover:bg-[#FF496C] border border-[#FF496C]/40 text-[#FF496C] hover:text-white text-[9px] font-heading font-bold transition-all cursor-pointer"
                        title="Bỏ qua thí sinh mất kết nối quá 60s"
                      >
                        <UserX size={9} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {viewers.length > 0 && (
            <div className="mt-2 pt-1 border-t border-[#303D52]/40 flex items-center justify-between text-[11px] text-[#94A3B8]">
              <div className="flex items-center gap-1">
                <Eye size={12} className="text-[#00D9FF]" />
                <span className="font-heading font-bold text-[#00D9FF]">Khán giả ({viewers.length}):</span>
              </div>
              <span className="text-[#F8FAFC] font-medium truncate max-w-sm">
                {viewers.map((v) => v.name).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
