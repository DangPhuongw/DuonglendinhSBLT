import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import confetti from 'canvas-confetti';
import { Trophy, Download } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

export const Podium: React.FC = () => {
  const room = useGameStore((s) => s.room);

  useEffect(() => {
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

  // Sort contestants by total score (viewers excluded)
  const sorted = [...room.players]
    .filter((p) => (p.role || 'player') === 'player')
    .sort((a, b) => b.score - a.score);
  const champ = sorted[0];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Title */}
      <div className="text-center mb-8">
        <span className="text-xs font-heading font-black uppercase tracking-widest bg-[#FFD43B]/15 text-[#FFD43B] px-3.5 py-1 rounded-full border border-[#FFD43B]/40 shadow-glow-yellow mb-2 inline-block">
          CHUNG CUỘC TRẬN ĐẤU
        </span>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-[#F8FAFC] mt-1">
          BỤC VINH QUANG OLYMPIA
        </h1>
      </div>

      {/* Champion Laurel Box */}
      {champ && (
        <div className="w-full max-w-md bg-[#1C2638] border-2 border-[#FFD43B] rounded-3xl p-6 sm:p-8 mb-8 text-center shadow-glow-yellow-lg flex flex-col items-center relative">
          <div className="w-20 h-20 rounded-2xl bg-[#FFD43B] text-[#090D18] border border-[#FFD43B] flex items-center justify-center mb-3 shadow-glow-yellow animate-bounce">
            <Trophy size={42} />
          </div>
          <span className="text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/20 px-3 py-0.5 rounded-full border border-[#FFD43B]/50 text-[#FFD43B] mb-1.5 shadow-glow-yellow">
            QUÁN QUÂN VÒNG NGUYỆT QUẾ
          </span>
          <h2 className="text-2xl sm:text-4xl font-heading font-black text-[#F8FAFC]">{champ.name}</h2>
          <span className="text-4xl sm:text-6xl font-digital font-bold tabular-nums text-[#FFD43B] mt-2 drop-shadow-[0_0_15px_rgba(255,212,59,0.5)]">
            {champ.score} <span className="text-base text-[#94A3B8] font-heading font-bold">ĐIỂM</span>
          </span>
        </div>
      )}

      {/* Full Score Breakdown Table */}
      <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl p-6 shadow-2xl mb-6">
        <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#94A3B8] mb-4">
          Bảng tổng kết điểm từng vòng thi:
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#303D52] text-[#94A3B8] font-heading font-bold uppercase text-xs tracking-wider">
                <th className="py-2.5 px-3">Hạng</th>
                <th className="py-2.5 px-3">Thí sinh</th>
                <th className="py-2.5 px-3 text-center">Khởi Động</th>
                <th className="py-2.5 px-3 text-center">VCNV</th>
                <th className="py-2.5 px-3 text-center">Tăng Tốc</th>
                <th className="py-2.5 px-3 text-center">Về Đích</th>
                <th className="py-2.5 px-3 text-right">Tổng Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303D52]/40">
              {sorted.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    idx === 0 ? 'bg-[#FFD43B]/10 font-bold' : 'hover:bg-[#1C2638]/50'
                  }`}
                >
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-heading font-bold text-xs ${
                        idx === 0
                          ? 'bg-[#FFD43B] text-[#090D18] shadow-glow-yellow'
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
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F8FAFC]">{p.name}</span>
                      <span className="text-[10px] text-[#64748B] font-digital tabular-nums">(G{p.seat})</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums font-digital font-bold text-sm text-[#F8FAFC]">{p.roundScores.kd}</td>
                  <td className="py-3 px-3 text-center tabular-nums font-digital font-bold text-sm text-[#F8FAFC]">{p.roundScores.vcnv}</td>
                  <td className="py-3 px-3 text-center tabular-nums font-digital font-bold text-sm text-[#F8FAFC]">{p.roundScores.tt}</td>
                  <td className="py-3 px-3 text-center tabular-nums font-digital font-bold text-sm text-[#F8FAFC]">{p.roundScores.vd}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-digital font-bold text-base sm:text-lg text-[#FFD43B]">
                    {p.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Export Button */}
      <a
        href={`/api/room/${room.code}/export-csv`}
        download={`bien-ban-tran-dau-${room.code}.csv`}
        className="px-6 py-3.5 bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] border border-[#FFD43B] shadow-glow-yellow hover:scale-105 active:scale-95 rounded-xl font-heading font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
      >
        <Download size={16} />
        <span>Tải Biên Bản Trận Đấu (CSV)</span>
      </a>
    </div>
  );
};
