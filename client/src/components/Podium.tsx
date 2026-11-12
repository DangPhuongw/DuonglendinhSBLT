import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import confetti from 'canvas-confetti';
import { Trophy, Download, RotateCcw } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';
import { PlayerAvatar } from './PlayerAvatar';

export const Podium: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const playAgain = useGameStore((s) => s.playAgain);
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState('');

  const handlePlayAgain = async () => {
    setRestarting(true);
    setRestartError('');
    const res = await playAgain();
    setRestarting(false);
    if (!res.ok) setRestartError(res.error || 'Không thể chơi lại.');
  };

  useEffect(() => {
    // Không có quán quân (tất cả bị loại) thì không ăn mừng
    const current = useGameStore.getState().room;
    const hasChampion = Boolean(
      current?.players.some((p) => p.id === current.state.winnerId && !p.disqualified)
    );
    if (!hasChampion) return;

    soundManager.playFanfare();

    // Trigger confetti with Neo-Brutalism vibrant palette
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD43B', '#00D9FF', '#FF496C', '#20D6A0', '#A855F7'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD43B', '#00D9FF', '#FF496C', '#20D6A0', '#A855F7'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  if (!room) return null;

  // Quán quân do server quyết định (có thể thắng nhờ câu hỏi phụ / bốc thăm / là người duy nhất còn lại)
  const winnerId: string | undefined = room.state.winnerId;
  const finishReason: string | undefined = room.state.finishReason;
  const champ = room.players.find((p) => p.id === winnerId && !p.disqualified);

  // Quán quân đứng đầu; còn lại theo điểm, thí sinh bị loại (chống gian lận) luôn xếp cuối
  const sorted = [...room.players]
    .filter((p) => (p.role || 'player') === 'player')
    .sort(
      (a, b) =>
        Number(b.id === champ?.id) - Number(a.id === champ?.id) ||
        Number(Boolean(a.disqualified)) - Number(Boolean(b.disqualified)) ||
        b.score - a.score
    );

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center justify-center h-full max-h-full py-1.5 px-3 overflow-hidden">
      {/* Title */}
      <div className="text-center mb-2.5 sm:mb-3.5">
        <span className="text-xs sm:text-sm font-heading font-black uppercase tracking-widest bg-[#FFD43B]/15 text-[#FFD43B] px-3.5 py-1 rounded-full border border-[#FFD43B]/40 shadow-glow-yellow mb-1.5 inline-block">
          CHUNG CUỘC TRẬN ĐẤU
        </span>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-[#F8FAFC]">
          BỤC VINH QUANG OLYMPIA
        </h1>
      </div>

      {/* Kết thúc sớm do chống gian lận */}
      {finishReason === 'LAST_STANDING' && champ && (
        <div className="w-full max-w-lg mb-2.5 px-4 py-2 rounded-xl bg-[#FF496C]/10 border border-[#FF496C]/40 text-center text-xs sm:text-sm font-bold text-[#FFB4C2]">
          Trận đấu kết thúc sớm: các thí sinh còn lại đã bị loại vì rời tab. {champ.name} là người duy nhất còn thi.
        </div>
      )}
      {!champ && (
        <div className="w-full max-w-lg bg-[#1A0D14] border-2 border-[#FF496C]/60 rounded-3xl p-5 sm:p-6 mb-3 text-center flex flex-col items-center">
          <span className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider bg-[#FF496C]/15 px-3.5 py-1 rounded-full border border-[#FF496C]/50 text-[#FF496C] mb-2">
            KHÔNG CÓ QUÁN QUÂN
          </span>
          <p className="text-sm sm:text-base text-[#F8FAFC] font-bold">
            {finishReason === 'ALL_DISQUALIFIED'
              ? 'Tất cả thí sinh đã bị loại vì rời tab trong lúc thi.'
              : 'Không còn thí sinh hợp lệ để trao giải.'}
          </p>
        </div>
      )}

      {/* Champion Laurel Box */}
      {champ && (
        <div className="w-full max-w-lg bg-[#1C2638] border-2 border-[#FFD43B] rounded-3xl p-5 sm:p-6 mb-3 text-center shadow-glow-yellow-lg flex flex-col items-center relative">
          <div className="relative mb-2">
            <PlayerAvatar player={champ} size={96} className="ring-4 ring-[#FFD43B] shadow-glow-yellow" />
            <div className="absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-[#FFD43B] text-[#090D18] border border-[#FFD43B] flex items-center justify-center shadow-glow-yellow animate-bounce">
              <Trophy size={22} />
            </div>
          </div>
          <span className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/20 px-3.5 py-1 rounded-full border border-[#FFD43B]/50 text-[#FFD43B] mb-1.5 shadow-glow-yellow">
            QUÁN QUÂN VÒNG NGUYỆT QUẾ
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#F8FAFC]">{champ.name}</h2>
          <span className="text-4xl sm:text-6xl font-digital font-bold tabular-nums text-[#FFD43B] mt-1.5 drop-shadow-[0_0_18px_rgba(255,212,59,0.5)]">
            {champ.score} <span className="text-base text-[#94A3B8] font-heading font-bold">ĐIỂM</span>
          </span>
        </div>
      )}

      {/* Full Score Breakdown Table */}
      <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl p-3.5 sm:p-4 shadow-xl mb-3">
        <h3 className="text-xs sm:text-sm font-heading font-bold uppercase tracking-wider text-[#94A3B8] mb-2.5">
          Bảng tổng kết điểm từng vòng thi:
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#303D52] text-[#94A3B8] font-heading font-bold uppercase text-[11px] sm:text-xs tracking-wider">
                <th className="py-2 px-3">Hạng</th>
                <th className="py-2 px-3">Thí sinh</th>
                <th className="py-2 px-2.5 text-center hidden sm:table-cell">Khởi Động</th>
                <th className="py-2 px-2.5 text-center hidden sm:table-cell">VCNV</th>
                <th className="py-2 px-2.5 text-center hidden sm:table-cell">Tăng Tốc</th>
                <th className="py-2 px-2.5 text-center hidden sm:table-cell">Về Đích</th>
                <th className="py-2 px-3 text-right">Tổng Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303D52]/40">
              {sorted.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    p.id === champ?.id ? 'bg-[#FFD43B]/10 font-bold' : 'hover:bg-[#1C2638]/50'
                  }`}
                >
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-heading font-black text-xs ${
                        p.id === champ?.id
                          ? 'bg-[#FFD43B] text-[#090D18] shadow-glow-yellow'
                          : p.disqualified
                          ? 'bg-[#1C2638] text-[#94A3B8] border border-[#303D52]'
                          : idx === 1
                          ? 'bg-[#00D9FF] text-[#090D18]'
                          : idx === 2
                          ? 'bg-[#20D6A0] text-[#090D18]'
                          : 'bg-[#1C2638] text-[#94A3B8] border border-[#303D52]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar player={p} size={28} dimmed={p.disqualified} />
                      <span className="font-bold text-[#F8FAFC] text-xs sm:text-sm">{p.name}</span>
                      {p.disqualified && (
                        <span className="text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded bg-[#FF496C]/15 text-[#FF496C] border border-[#FF496C]/50">LOẠI · RỜI TAB</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-center hidden sm:table-cell tabular-nums font-digital font-bold text-xs sm:text-sm text-[#F8FAFC]">{p.roundScores.kd}</td>
                  <td className="py-2 px-2.5 text-center hidden sm:table-cell tabular-nums font-digital font-bold text-xs sm:text-sm text-[#F8FAFC]">{p.roundScores.vcnv}</td>
                  <td className="py-2 px-2.5 text-center hidden sm:table-cell tabular-nums font-digital font-bold text-xs sm:text-sm text-[#F8FAFC]">{p.roundScores.tt}</td>
                  <td className="py-2 px-2.5 text-center hidden sm:table-cell tabular-nums font-digital font-bold text-xs sm:text-sm text-[#F8FAFC]">{p.roundScores.vd}</td>
                  <td className="py-2 px-3 text-right tabular-nums font-digital font-bold text-base sm:text-lg text-[#FFD43B]">
                    {p.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chơi lại + tải biên bản */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
      {myPlayer && room.hostId === myPlayer.id ? (
        <button
          onClick={handlePlayAgain}
          disabled={restarting}
          className="px-6 py-2.5 bg-[#20D6A0] hover:bg-[#3ae3b2] disabled:opacity-60 text-[#090D18] border border-[#20D6A0] shadow-[0_0_18px_rgba(32,214,160,0.45)] hover:scale-105 active:scale-95 rounded-xl font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw size={16} className={restarting ? 'animate-spin' : ''} />
          <span>{restarting ? 'Đang chuẩn bị...' : 'Chơi lại'}</span>
        </button>
      ) : (
        <span className="px-4 py-2.5 rounded-xl bg-[#1C2638] border border-[#303D52] text-[#94A3B8] text-xs sm:text-sm font-bold">
          Chờ chủ phòng bấm "Chơi lại" để bắt đầu trận mới
        </span>
      )}
      <a
        href={`/api/room/${room.code}/export-csv`}
        download={`bien-ban-tran-dau-${room.code}.csv`}
        className="px-6 py-2.5 bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] border border-[#FFD43B] shadow-glow-yellow hover:scale-105 active:scale-95 rounded-xl font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
      >
        <Download size={16} />
        <span>Tải Biên Bản Trận Đấu (CSV)</span>
      </a>
      </div>
      {restartError && <p className="mt-2 text-xs sm:text-sm font-bold text-[#FF496C]" role="alert">{restartError}</p>}
    </div>
  );
};
