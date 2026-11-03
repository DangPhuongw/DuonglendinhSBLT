import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import confetti from 'canvas-confetti';
import { Trophy, Download, Award, Medal } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

export const Podium: React.FC = () => {
  const room = useGameStore((s) => s.room);

  useEffect(() => {
    soundManager.playFanfare();

    // Trigger confetti
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#1E3A8A'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#1E3A8A'],
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
        <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
          CHUNG CUỘC TRẬN ĐẤU
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 mt-1">
          BỤC VINH QUANG OLYMPIA
        </h1>
      </div>

      {/* Champion Laurel Box */}
      {champ && (
        <div className="w-full max-w-md bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-500 rounded-3xl p-6 mb-8 text-center shadow-2xl shadow-amber-500/20 flex flex-col items-center relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 mb-3 shadow-lg shadow-amber-500/40 animate-bounce">
            <Trophy size={40} />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
            QUÁN QUÂN VÒNG NGUYỆT QUẾ
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">{champ.name}</h2>
          <span className="text-4xl font-black font-mono text-amber-300 mt-2">
            {champ.score} <span className="text-base text-amber-500">ĐIỂM</span>
          </span>
        </div>
      )}

      {/* Full Score Breakdown Table */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Bảng tổng kết điểm từng vòng thi:
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Hạng</th>
                <th className="py-2.5 px-3">Thí sinh</th>
                <th className="py-2.5 px-3 text-center">Khởi Động</th>
                <th className="py-2.5 px-3 text-center">VCNV</th>
                <th className="py-2.5 px-3 text-center">Tăng Tốc</th>
                <th className="py-2.5 px-3 text-center">Về Đích</th>
                <th className="py-2.5 px-3 text-right">Tổng Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sorted.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    idx === 0 ? 'bg-amber-950/20 font-bold' : ''
                  }`}
                >
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{p.name}</span>
                      <span className="text-[10px] text-slate-500">(G{p.seat})</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">{p.roundScores.kd}</td>
                  <td className="py-3 px-3 text-center font-mono">{p.roundScores.vcnv}</td>
                  <td className="py-3 px-3 text-center font-mono">{p.roundScores.tt}</td>
                  <td className="py-3 px-3 text-center font-mono">{p.roundScores.vd}</td>
                  <td className="py-3 px-3 text-right font-mono font-black text-amber-400 text-base">
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
        className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-slate-200 hover:text-white transition-all shadow-md"
      >
        <Download size={16} />
        <span>Tải Biên Bản Trận Đấu (CSV)</span>
      </a>
    </div>
  );
};
