import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { RulesExplainer } from './RulesExplainer';
import { CheckCircle2, UserX, Eye } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

const ROUND_NAMES: Record<string, string> = {
  KD_RIENG: 'VÒNG 1: KHỞI ĐỘNG',
  VCNV: 'VÒNG 2: VƯỢT CHƯỚNG NGẠI VẬT',
  TANG_TOC: 'VÒNG 3: TĂNG TỐC',
  VE_DICH: 'VÒNG 4: VỀ ĐÍCH',
  TIEBREAK: 'CÂU HỎI PHỤ',
};

/**
 * Màn Sẵn sàng trước mỗi vòng: trình chiếu luật có hoạt ảnh (RulesExplainer) là phần chính,
 * bên dưới là nút Sẵn sàng và trạng thái sẵn sàng của các thí sinh.
 * (Điểm hiện tại đã có ở màn công bố điểm ngay trước đó và ở bảng điểm chân trang.)
 */
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
  const readyCount = contestants.filter((p) => p.ready).length;

  return (
    <div className="w-full h-full max-w-4xl lg:max-w-5xl mx-auto flex flex-col gap-2 py-1.5 px-2 sm:px-3 overflow-hidden">
      {/* Tiêu đề gọn */}
      <div className="shrink-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="text-[11px] sm:text-xs lg:text-sm font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3 py-1 rounded-full border border-[#FFD43B]/40">
          Chuẩn bị bước vào
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-heading font-black text-[#F8FAFC]">
          {ROUND_NAMES[targetRound] || 'VÒNG TIẾP THEO'}
        </h2>
      </div>

      {/* Trình chiếu luật chơi: chiếm phần không gian còn lại */}
      <RulesExplainer key={targetRound} round={targetRound} className="flex-1 min-h-0" />

      {/* Sẵn sàng */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex flex-col items-center sm:items-start gap-1 sm:w-64 shrink-0">
          {isCountdown ? (
            <div className="w-full">
              <span className="block text-xs uppercase font-heading font-bold text-[#94A3B8] mb-1 text-center sm:text-left">Vòng thi bắt đầu sau</span>
              <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={3} label="" />
            </div>
          ) : isViewer ? (
            <div className="w-full p-2.5 bg-[#00D9FF]/10 border border-[#00D9FF]/40 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-[#00D9FF] font-bold">
              <Eye size={18} className="shrink-0" />
              <span>Bạn là khán giả. Vòng thi bắt đầu khi thí sinh sẵn sàng.</span>
            </div>
          ) : (
            <button
              onClick={() => setReady(true)}
              disabled={myPlayer.ready}
              className={`w-full py-3 px-6 rounded-2xl font-heading font-black uppercase tracking-wider text-sm sm:text-base flex items-center justify-center gap-2 border transition-all ${
                myPlayer.ready
                  ? 'bg-[#20D6A0] text-[#090D18] border-[#20D6A0] shadow-glow-success cursor-default'
                  : 'bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] border-[#FFD43B] shadow-glow-yellow-lg hover:scale-[1.02] active:scale-95 cursor-pointer'
              }`}
            >
              <CheckCircle2 size={20} />
              <span>{myPlayer.ready ? 'Bạn đã sẵn sàng' : 'Tôi đã sẵn sàng'}</span>
            </button>
          )}
          {isHost && !isCountdown && (
            <button
              onClick={forceStartRound}
              className="text-xs font-heading font-bold text-[#94A3B8] hover:text-[#FFD43B] underline cursor-pointer"
              title="Bắt đầu vòng thi ngay lập tức không cần chờ"
            >
              ⚡ Bắt đầu vòng thi ngay (Chủ phòng)
            </button>
          )}
        </div>

        {/* Trạng thái sẵn sàng của thí sinh */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] sm:text-xs uppercase tracking-wider font-heading font-bold text-[#94A3B8] mb-1">
            Đã sẵn sàng {readyCount}/{contestants.length}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {contestants.map((p) => {
              const isAbsent = !p.connected && p.disconnectedAt && Date.now() - p.disconnectedAt > 60000;
              return (
                <span
                  key={p.id}
                  className={`inline-flex items-center gap-1.5 max-w-[11rem] pl-2 pr-1.5 py-1 rounded-full border text-xs font-bold ${
                    p.ready
                      ? 'bg-[#20D6A0]/15 text-[#20D6A0] border-[#20D6A0]/50'
                      : 'bg-[#111827] text-[#94A3B8] border-[#303D52]'
                  }`}
                  title={`${p.name}: ${p.ready ? 'đã sẵn sàng' : 'chưa sẵn sàng'}`}
                >
                  {p.ready ? <CheckCircle2 size={13} className="shrink-0" /> : <span className="w-2 h-2 rounded-full bg-[#64748B] shrink-0" />}
                  <PlayerAvatar player={p} size={18} />
                  <span className="truncate">{p.name}</span>
                  {isHost && isAbsent && !p.ready && (
                    <button
                      onClick={() => skipAbsent(p.id)}
                      className="ml-0.5 p-0.5 rounded-full bg-[#FF496C]/20 hover:bg-[#FF496C] text-[#FF496C] hover:text-white"
                      title="Bỏ qua thí sinh mất kết nối quá 60 giây"
                      aria-label={`Bỏ qua ${p.name}`}
                    >
                      <UserX size={12} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
