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
} from 'lucide-react';

export const ReadyScreen: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const setReady = useGameStore((s) => s.setReady);
  const skipAbsent = useGameStore((s) => s.skipAbsent);
  const forceStartRound = useGameStore((s) => s.forceStartRound);

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

  // Render visual infographic cards for each round's rules
  const renderRuleInfographics = () => {
    switch (targetRound) {
      case 'KD_RIENG':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {/* Box 1: Khởi Động Riêng */}
            <div className="bg-white border-2 border-[#171717] rounded-2xl p-3.5 shadow-neo flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                    <Package size={15} className="text-[#171717]" />
                    Khởi Động Riêng
                  </span>
                </div>

                {/* Mini illustration: 5 Mystery Boxes with '?' */}
                <div className="bg-[#FFFDF7] border-2 border-[#171717] rounded-xl p-2 my-2 flex items-center justify-between gap-1.5 shadow-neo-sm">
                  {[
                    { bg: 'bg-[#FFE45C]' },
                    { bg: 'bg-[#66C7F2]' },
                    { bg: 'bg-[#FF9292]' },
                    { bg: 'bg-[#55D6C2]' },
                    { bg: 'bg-[#A98BFF]' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 flex items-center justify-center py-1 sm:py-1.5 ${item.bg} border-2 border-[#171717] rounded-lg shadow-neo-sm font-black text-sm sm:text-base text-[#171717] leading-none select-none`}
                    >
                      ?
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-left text-xs font-bold text-gray-700 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                  <span>Chọn 1 ô • 5 câu (15s/câu)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#55D6C2]" />
                  <span className="text-[#171717]">
                    Đúng: <strong className="text-emerald-600">+10đ</strong> | Sai: <strong>0đ</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF9292]" />
                  <span>Ô đã chọn sẽ bị khóa</span>
                </div>
              </div>
            </div>

            {/* Box 2: Khởi Động Chung */}
            <div className="bg-white border-2 border-[#171717] rounded-2xl p-3.5 shadow-neo flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                    <Bell size={15} className="text-[#171717]" />
                    Khởi Động Chung
                  </span>
                </div>

                {/* Mini illustration: Buzzer bell */}
                <div className="bg-[#FFFDF7] border-2 border-[#171717] rounded-xl p-2 my-2 flex items-center justify-center gap-2.5 shadow-neo-sm">
                  <div className="w-8 h-8 rounded-full bg-[#FFE45C] border-2 border-[#171717] flex items-center justify-center shadow-neo-sm">
                    <Bell size={15} className="text-[#171717] animate-bounce" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-black uppercase block">Bấm Chuông (Space)</span>
                    <span className="text-[10px] text-gray-600 font-bold">Giành quyền trong 3 giây</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-left text-xs font-bold text-gray-700 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                  <span>10 câu hỏi chung cho tất cả</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#55D6C2]" />
                  <span className="text-[#171717]">
                    Đúng: <strong className="text-emerald-600">+10đ</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF9292]" />
                  <span className="text-[#171717]">
                    Sai / Hết giờ: <strong className="text-rose-600">-5đ</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'VCNV':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {/* Box 1: 4 Hàng Ngang */}
            <div className="bg-white border-2 border-[#171717] rounded-2xl p-3.5 shadow-neo flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                    <Layers size={15} />
                    4 Hàng Ngang (Gợi Ý)
                  </span>
                  <span className="text-[10px] font-black bg-[#FFE45C] text-[#171717] px-2 py-0.5 rounded border border-[#171717] tabular-nums">
                    +10đ / hàng
                  </span>
                </div>

                {/* Mini illustration: 4 Rows */}
                <div className="bg-[#FFFDF7] border-2 border-[#171717] rounded-xl p-2 my-2 space-y-1 shadow-neo-sm">
                  {[1, 2, 3, 4].map((r) => (
                    <div key={r} className="flex items-center gap-1.5 bg-white border border-[#171717] px-2 py-0.5 rounded">
                      <span className="text-[9px] font-black w-3.5 h-3.5 rounded-full bg-[#FFE45C] flex items-center justify-center border border-[#171717]">
                        {r}
                      </span>
                      <div className="flex gap-0.5 flex-1">
                        {Array.from({ length: 6 }).map((_, c) => (
                          <div key={c} className="w-2.5 h-2.5 rounded-[2px] bg-gray-200 border border-[#171717]/40" />
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 tabular-nums">15s</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-left text-xs font-bold text-gray-700 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                  <span>Chọn hàng • Cùng trả lời 15s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#55D6C2]" />
                  <span className="text-[#171717]">
                    Đúng: <strong className="text-emerald-600">+10đ</strong> & mở 1 góc ảnh
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Từ Khóa Chướng Ngại Vật */}
            <div className="bg-white border-2 border-[#171717] rounded-2xl p-3.5 shadow-neo flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                    <Key size={15} />
                    Từ Khóa Chính
                  </span>
                  <span className="text-[10px] font-black bg-[#55D6C2] text-[#171717] px-2 py-0.5 rounded border border-[#171717] tabular-nums">
                    60đ ➔ 20đ
                  </span>
                </div>

                {/* Mini illustration: Score ladder */}
                <div className="bg-[#FFFDF7] border-2 border-[#171717] rounded-xl p-2 my-2 flex items-center justify-between gap-1 shadow-neo-sm">
                  {[
                    { q: 'C1', pts: '60đ' },
                    { q: 'C2', pts: '50đ' },
                    { q: 'C3', pts: '40đ' },
                    { q: 'C4', pts: '30đ' },
                    { q: 'TT', pts: '20đ' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center py-0.5 bg-white border border-[#171717] rounded"
                    >
                      <span className="text-[8px] text-gray-500 font-bold">{item.q}</span>
                      <span className="text-[10px] font-black text-[#171717] tabular-nums">{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-left text-xs font-bold text-gray-700 mt-1">
                <div className="flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717] mt-1.5 shrink-0" />
                  <span className="leading-snug text-[#171717]">
                    Đoán từ khóa chính dựa trên 4 hàng gợi ý - Sau mỗi câu hỏi gợi ý được lật mở, số điểm nhận được khi đoán từ khóa chính sẽ giảm
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717] shrink-0" />
                  <span>Chuông mở sau khi câu 1 xuất hiện</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF9292] shrink-0" />
                  <span className="text-rose-600 font-black">Đoán sai: Bị loại khỏi vòng VCNV</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'TANG_TOC':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {/* Box 1: Thể thức thi đấu */}
            <div className="bg-white border-2 border-[#171717] rounded-2xl p-3.5 shadow-neo flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                    <Clock size={15} />
                    Chạy Đua Tốc Độ
                  </span>
                  <span className="text-[10px] font-black bg-[#FFE45C] text-[#171717] px-2 py-0.5 rounded border border-[#171717] tabular-nums">
                    30s / câu
                  </span>
                </div>

                {/* Mini illustration: 4 questions */}
                <div className="bg-[#FFFDF7] border-2 border-[#171717] rounded-xl p-2 my-2 flex items-center justify-between gap-1 shadow-neo-sm">
                  {[1, 2, 3, 4].map((q) => (
                    <div
                      key={q}
                      className="flex-1 flex flex-col items-center py-1 bg-white border border-[#171717] rounded-lg"
                    >
                      <Zap size={14} className="text-[#FFE45C] fill-[#FFE45C] stroke-[#171717]" />
                      <span className="text-[10px] font-black">Câu {q}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-left text-xs font-bold text-gray-700 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                  <span>4 câu hỏi • Cùng nộp trong 30s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#55D6C2]" />
                  <span>Càng nhanh càng nhiều điểm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                  <span>Sai không bị trừ điểm</span>
                </div>
              </div>
            </div>

            {/* Box 2: Thang Điểm Tốc Độ */}
            <div className="bg-white border-2 border-[#171717] rounded-2xl p-3.5 shadow-neo flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                    <Award size={15} />
                    Thang Điểm Tốc Độ
                  </span>
                  <span className="text-[10px] font-black bg-[#55D6C2] text-[#171717] px-2 py-0.5 rounded border border-[#171717]">
                    Top 1 ➔ 5
                  </span>
                </div>

                {/* Mini illustration: Speed ranks */}
                <div className="bg-[#FFFDF7] border-2 border-[#171717] rounded-xl p-2 my-2 flex items-center justify-between gap-1 shadow-neo-sm">
                  {[
                    { rank: '#1', pts: '+30đ', bg: 'bg-[#FFE45C]' },
                    { rank: '#2', pts: '+25đ', bg: 'bg-[#66C7F2]' },
                    { rank: '#3', pts: '+20đ', bg: 'bg-[#55D6C2]' },
                    { rank: '#4', pts: '+15đ', bg: 'bg-white' },
                    { rank: '#5', pts: '+10đ', bg: 'bg-white' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 flex flex-col items-center py-1 rounded border border-[#171717] ${item.bg}`}
                    >
                      <span className="text-[9px] font-black">{item.rank}</span>
                      <span className="text-[10px] font-black tabular-nums">{item.pts}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-left text-xs font-bold text-gray-700 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                  <span>Chỉ tính câu trả lời đúng</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE45C]" />
                  <span className="text-[#171717]">Xếp hạng theo giây nộp bài chính xác</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'VE_DICH':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            {/* Box 1: Chọn gói câu hỏi */}
            <div className="bg-white border-2 border-[#171717] rounded-2xl p-3.5 shadow-neo flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                    <Trophy size={15} />
                    Chọn Gói Điểm
                  </span>
                  <span className="text-[10px] font-black bg-[#FFE45C] text-[#171717] px-2 py-0.5 rounded border border-[#171717] tabular-nums">
                    40 / 60 / 80đ
                  </span>
                </div>

                {/* Mini illustration: 3 packages */}
                <div className="bg-[#FFFDF7] border-2 border-[#171717] rounded-xl p-2 my-2 flex items-center justify-between gap-1.5 shadow-neo-sm">
                  {[
                    { pts: '40 ĐIỂM', sub: '10-10-20' },
                    { pts: '60 ĐIỂM', sub: '10-20-30' },
                    { pts: '80 ĐIỂM', sub: '20-30-30' },
                  ].map((pkg, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center py-1 bg-white border border-[#171717] rounded-lg"
                    >
                      <span className="text-[11px] font-black text-[#171717]">{pkg.pts}</span>
                      <span className="text-[9px] text-gray-500 font-mono font-bold">{pkg.sub}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 text-left text-xs font-bold text-gray-700 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                  <span>Thời gian: 10đ/15s • 20đ/20s • 30đ/30s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE45C]" />
                  <span>Thi đấu theo thứ tự điểm số</span>
                </div>
              </div>
            </div>

            {/* Box 2: Ngôi Sao Hy Vọng & Cướp Điểm */}
            <div className="bg-white border-2 border-[#171717] rounded-2xl p-3.5 shadow-neo flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                    <Star size={15} />
                    Ngôi Sao & Giành Quyền
                  </span>
                  <span className="text-[10px] font-black bg-[#55D6C2] text-[#171717] px-2 py-0.5 rounded border border-[#171717]">
                    x2 / cướp điểm
                  </span>
                </div>

                {/* Mini illustration: Star & Buzzer */}
                <div className="bg-[#FFFDF7] border-2 border-[#171717] rounded-xl p-2 my-2 flex items-center justify-around gap-2 shadow-neo-sm">
                  <div className="flex items-center gap-1.5 bg-white border border-[#171717] px-2.5 py-1 rounded-lg">
                    <Star size={14} className="fill-[#FFE45C] text-[#171717]" />
                    <div className="text-left">
                      <span className="text-[10px] font-black block">Ngôi Sao</span>
                      <span className="text-[9px] text-gray-500 font-bold">1 lần / vòng</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white border border-[#171717] px-2.5 py-1 rounded-lg">
                    <Bell size={14} className="text-[#171717]" />
                    <div className="text-left">
                      <span className="text-[10px] font-black block">Chuông 5s</span>
                      <span className="text-[9px] text-gray-500 font-bold">Cướp điểm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-left text-xs font-bold text-gray-700 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFE45C]" />
                  <span>Ngôi sao: Đúng x2 | Sai trừ số điểm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#55D6C2]" />
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
    <div className="max-w-2xl mx-auto p-3 sm:p-5 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full bg-white border-3 border-[#171717] rounded-3xl p-5 sm:p-7 shadow-neo-lg text-center flex flex-col items-center">
        <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3.5 py-1 rounded-full border-2 border-[#171717] shadow-neo-sm mb-2">
          Chuẩn bị bước vào
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mb-4">
          {currentRoundTitle}
        </h2>

        {/* Rule Box with Visual Infographics */}
        <div className="w-full mb-5 p-3.5 sm:p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#171717] text-left shadow-neo">
          <div className="flex items-center gap-2 mb-2.5 text-[#171717] font-black text-xs uppercase tracking-wider">
            <BookOpen size={16} />
            <span>Luật chơi tóm tắt</span>
          </div>

          {renderRuleInfographics()}
        </div>

        {isCountdown ? (
          <div className="my-4 flex flex-col items-center">
            <span className="text-xs uppercase font-black text-gray-700 mb-2">Trận đấu bắt đầu sau</span>
            <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={3} />
          </div>
        ) : (
          <div className="w-full mb-5 flex flex-col items-center">
            <button
              onClick={() => setReady(true)}
              disabled={myPlayer.ready}
              className={`w-full max-w-xs py-3 px-6 rounded-xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 border-2 border-[#171717] transition-all ${
                myPlayer.ready
                  ? 'bg-[#55D6C2] text-[#171717] shadow-neo cursor-default'
                  : 'bg-[#FFE45C] hover:bg-[#ffe040] text-[#171717] shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer'
              }`}
            >
              <CheckCircle2 size={18} />
              <span>{myPlayer.ready ? 'Bạn đã sẵn sàng' : 'Tôi đã sẵn sàng'}</span>
            </button>
            {isHost && (
              <button
                onClick={forceStartRound}
                className="mt-2.5 text-xs font-black text-gray-700 hover:text-black underline cursor-pointer hover:scale-105 transition-transform"
                title="Bắt đầu vòng thi ngay lập tức không cần chờ"
              >
                ⚡ Bắt đầu vòng thi ngay (Chủ phòng)
              </button>
            )}
          </div>
        )}

        {/* Players Readiness List */}
        <div className="w-full border-t-2 border-[#171717] pt-4 mt-1">
          <h4 className="text-[11px] uppercase tracking-wider font-black text-gray-700 mb-2.5 text-left">
            Trạng thái sẵn sàng của các thí sinh:
          </h4>
          <div className="space-y-1.5">
            {room.players.map((p) => {
              const isAbsent = !p.connected && p.disconnectedAt && Date.now() - p.disconnectedAt > 60000;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 bg-[#FFFDF7] rounded-xl border-2 border-[#171717] shadow-neo-sm text-xs font-bold"
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
