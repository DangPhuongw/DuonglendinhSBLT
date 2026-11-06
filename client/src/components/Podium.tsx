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
        colors: ['#FFE45C', '#FF9292', '#55D6C2', '#66C7F2', '#171717'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFE45C', '#FF9292', '#55D6C2', '#66C7F2', '#171717'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  if (!room) return null;

  // Sort players by total score
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const champ = sorted[0];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Title */}
      <div className="text-center mb-8">
        <span className="text-xs font-black uppercase tracking-widest bg-[#FFE45C] text-[#171717] px-3.5 py-1 rounded-full border-2 border-[#171717] shadow-neo-sm mb-2 inline-block">
          CHUNG CUỘC TRẬN ĐẤU
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-[#171717] mt-1">
          BỤC VINH QUANG OLYMPIA
        </h1>
      </div>

      {/* Champion Laurel Box */}
      {champ && (
        <div className="w-full max-w-md bg-[#FFE45C] border-3 border-[#171717] rounded-3xl p-6 sm:p-8 mb-8 text-center shadow-neo-lg flex flex-col items-center relative">
          <div className="w-20 h-20 rounded-2xl bg-white border-3 border-[#171717] flex items-center justify-center text-[#171717] mb-3 shadow-neo animate-bounce">
            <Trophy size={42} />
          </div>
          <span className="text-xs font-black uppercase tracking-wider bg-white px-3 py-0.5 rounded-full border border-[#171717] text-[#171717] mb-1.5 shadow-neo-sm">
            QUÁN QUÂN VÒNG NGUYỆT QUẾ
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717]">{champ.name}</h2>
          <span className="text-4xl sm:text-5xl font-black tabular-nums text-[#171717] mt-2">
            {champ.score} <span className="text-base text-gray-800">ĐIỂM</span>
          </span>
        </div>
      )}

      {/* Full Score Breakdown Table */}
      <div className="w-full bg-white border-3 border-[#171717] rounded-2xl p-6 shadow-neo-lg mb-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#171717] mb-4">
          Bảng tổng kết điểm từng vòng thi:
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-[#171717] text-[#171717] font-black uppercase text-xs tracking-wider">
                <th className="py-2.5 px-3">Hạng</th>
                <th className="py-2.5 px-3">Thí sinh</th>
                <th className="py-2.5 px-3 text-center">Khởi Động</th>
                <th className="py-2.5 px-3 text-center">VCNV</th>
                <th className="py-2.5 px-3 text-center">Tăng Tốc</th>
                <th className="py-2.5 px-3 text-center">Về Đích</th>
                <th className="py-2.5 px-3 text-right">Tổng Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y border-[#171717]">
              {sorted.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    idx === 0 ? 'bg-[#FFE45C]/20 font-black' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-black text-xs border border-[#171717] ${
                        idx === 0
                          ? 'bg-[#FFE45C] text-[#171717] shadow-neo-sm'
                          : idx === 1
                          ? 'bg-[#66C7F2] text-[#171717]'
                          : idx === 2
                          ? 'bg-[#55D6C2] text-[#171717]'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#171717]">{p.name}</span>
                      <span className="text-[10px] text-gray-600 font-bold tabular-nums">(G{p.seat})</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums font-bold">{p.roundScores.kd}</td>
                  <td className="py-3 px-3 text-center tabular-nums font-bold">{p.roundScores.vcnv}</td>
                  <td className="py-3 px-3 text-center tabular-nums font-bold">{p.roundScores.tt}</td>
                  <td className="py-3 px-3 text-center tabular-nums font-bold">{p.roundScores.vd}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-black text-[#171717] text-base">
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
        className="px-6 py-3.5 bg-white hover:bg-[#FFE45C] text-[#171717] border-2 border-[#171717] shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
      >
        <Download size={16} />
        <span>Tải Biên Bản Trận Đấu (CSV)</span>
      </a>
    </div>
  );
};
