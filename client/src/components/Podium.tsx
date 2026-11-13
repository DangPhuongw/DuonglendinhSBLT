import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import confetti from 'canvas-confetti';
import { Trophy, Download, RotateCcw } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';
import { leaderboardOf } from '../utils/predictions';
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
        colors: ['#F7C873', '#7CB4FF', '#FF5D8F', '#43E6B5', '#9B7BFF'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#F7C873', '#7CB4FF', '#FF5D8F', '#43E6B5', '#9B7BFF'],
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
    <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center justify-start [justify-content:safe_center] h-full max-h-full py-1.5 px-3 overflow-y-auto overflow-x-hidden">
      {/* Title */}
      <div className="text-center mb-2.5 sm:mb-3.5">
        <span className="text-xs sm:text-sm font-heading font-black uppercase tracking-widest bg-[#F7C873]/15 text-[#F7C873] px-3.5 py-1 rounded-full border border-[#F7C873]/40 shadow-glow-yellow mb-1.5 inline-block">
          CHUNG CUỘC TRẬN ĐẤU
        </span>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-[#EEF0FF]">
          BỤC VINH QUANG OLYMPIA
        </h1>
      </div>

      {/* Kết thúc sớm do chống gian lận */}
      {finishReason === 'LAST_STANDING' && champ && (
        <div className="w-full max-w-lg mb-2.5 px-4 py-2 rounded-xl bg-[#FF5D8F]/10 border border-[#FF5D8F]/40 text-center text-xs sm:text-sm font-bold text-[#FFB6CF]">
          Trận đấu kết thúc sớm: các thí sinh còn lại đã bị loại vì rời tab. {champ.name} là người duy nhất còn thi.
        </div>
      )}
      {!champ && (
        <div className="w-full max-w-lg bg-[#2A0F24] border-2 border-[#FF5D8F]/60 rounded-3xl hud p-5 sm:p-6 mb-3 text-center flex flex-col items-center">
          <span className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider bg-[#FF5D8F]/15 px-3.5 py-1 rounded-full border border-[#FF5D8F]/50 text-[#FF5D8F] mb-2">
            KHÔNG CÓ QUÁN QUÂN
          </span>
          <p className="text-sm sm:text-base text-[#EEF0FF] font-bold">
            {finishReason === 'ALL_DISQUALIFIED'
              ? 'Tất cả thí sinh đã bị loại vì rời tab trong lúc thi.'
              : 'Không còn thí sinh hợp lệ để trao giải.'}
          </p>
        </div>
      )}

      {/* Champion Laurel Box */}
      {champ && (
        <div className="w-full max-w-lg bg-[#11163A] border-2 border-[#F7C873] rounded-3xl hud hud-gold p-5 sm:p-6 mb-3 text-center shadow-glow-yellow-lg flex flex-col items-center relative">
          <div className="relative mb-2">
            <PlayerAvatar player={champ} size={96} className="ring-4 ring-[#F7C873] shadow-glow-yellow" />
            <div className="absolute -top-3 -right-3 w-10 h-10 rounded-xl bg-[#F7C873] text-[#05060F] border border-[#F7C873] flex items-center justify-center shadow-glow-yellow animate-bounce">
              <Trophy size={22} />
            </div>
          </div>
          <span className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider bg-[#F7C873]/20 px-3.5 py-1 rounded-full border border-[#F7C873]/50 text-[#F7C873] mb-1.5 shadow-glow-yellow">
            QUÁN QUÂN VÒNG NGUYỆT QUẾ
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-[#EEF0FF]">{champ.name}</h2>
          <span className="text-4xl sm:text-6xl font-digital font-bold tabular-nums text-[#F7C873] mt-1.5 drop-shadow-[0_0_18px_rgba(247,200,115,0.5)]">
            {champ.score} <span className="text-base text-[#A6ACDB] font-heading font-bold">ĐIỂM</span>
          </span>
        </div>
      )}

      {/* Full Score Breakdown Table */}
      <div className="w-full bg-[#0A0D22] border border-[#262E66] rounded-2xl p-3.5 sm:p-4 shadow-xl mb-3">
        <h3 className="text-xs sm:text-sm font-heading font-bold uppercase tracking-wider text-[#A6ACDB] mb-2.5">
          Bảng tổng kết điểm từng vòng thi:
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#262E66] text-[#A6ACDB] font-heading font-bold uppercase text-[11px] sm:text-xs tracking-wider">
                <th className="py-2 px-3">Hạng</th>
                <th className="py-2 px-3">Thí sinh</th>
                <th className="py-2 px-2.5 text-center hidden sm:table-cell">Khởi Động</th>
                <th className="py-2 px-2.5 text-center hidden sm:table-cell">VCNV</th>
                <th className="py-2 px-2.5 text-center hidden sm:table-cell">Tăng Tốc</th>
                <th className="py-2 px-2.5 text-center hidden sm:table-cell">Về Đích</th>
                <th className="py-2 px-3 text-right">Tổng Điểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262E66]/40">
              {sorted.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    p.id === champ?.id ? 'bg-[#F7C873]/10 font-bold' : 'hover:bg-[#11163A]/50'
                  }`}
                >
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-heading font-black text-xs ${
                        p.id === champ?.id
                          ? 'bg-[#F7C873] text-[#05060F] shadow-glow-yellow'
                          : p.disqualified
                          ? 'bg-[#11163A] text-[#A6ACDB] border border-[#262E66]'
                          : idx === 1
                          ? 'bg-[#7CB4FF] text-[#05060F]'
                          : idx === 2
                          ? 'bg-[#43E6B5] text-[#05060F]'
                          : 'bg-[#11163A] text-[#A6ACDB] border border-[#262E66]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <PlayerAvatar player={p} size={28} dimmed={p.disqualified} />
                      <span className="font-bold text-[#EEF0FF] text-xs sm:text-sm">{p.name}</span>
                      {p.disqualified && (
                        <span className="text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded bg-[#FF5D8F]/15 text-[#FF5D8F] border border-[#FF5D8F]/50">LOẠI · RỜI TAB</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2.5 text-center hidden sm:table-cell tabular-nums font-digital font-bold text-xs sm:text-sm text-[#EEF0FF]">{p.roundScores.kd}</td>
                  <td className="py-2 px-2.5 text-center hidden sm:table-cell tabular-nums font-digital font-bold text-xs sm:text-sm text-[#EEF0FF]">{p.roundScores.vcnv}</td>
                  <td className="py-2 px-2.5 text-center hidden sm:table-cell tabular-nums font-digital font-bold text-xs sm:text-sm text-[#EEF0FF]">{p.roundScores.tt}</td>
                  <td className="py-2 px-2.5 text-center hidden sm:table-cell tabular-nums font-digital font-bold text-xs sm:text-sm text-[#EEF0FF]">{p.roundScores.vd}</td>
                  <td className="py-2 px-3 text-right tabular-nums font-digital font-bold text-base sm:text-lg text-[#F7C873]">
                    {p.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vinh danh khán giả dự đoán giỏi nhất */}
      <PredictionKings />

      {/* Chơi lại + tải biên bản */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
      {myPlayer && room.hostId === myPlayer.id ? (
        <button
          onClick={handlePlayAgain}
          disabled={restarting}
          className="px-6 py-2.5 bg-[#43E6B5] hover:bg-[#43E6B5] disabled:opacity-60 text-[#05060F] border border-[#43E6B5] shadow-[0_0_18px_rgba(67,230,181,0.45)] hover:scale-105 active:scale-95 rounded-xl font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw size={16} className={restarting ? 'animate-spin' : ''} />
          <span>{restarting ? 'Đang chuẩn bị...' : 'Chơi lại'}</span>
        </button>
      ) : (
        <span className="px-4 py-2.5 rounded-xl bg-[#11163A] border border-[#262E66] text-[#A6ACDB] text-xs sm:text-sm font-bold">
          Chờ chủ phòng bấm "Chơi lại" để bắt đầu trận mới
        </span>
      )}
      <a
        href={`/api/room/${room.code}/export-csv`}
        download={`bien-ban-tran-dau-${room.code}.csv`}
        className="px-6 py-2.5 bg-[#F7C873] hover:bg-[#FBE0A8] text-[#05060F] border border-[#F7C873] shadow-glow-yellow hover:scale-105 active:scale-95 rounded-xl font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
      >
        <Download size={16} />
        <span>Tải Biên Bản Trận Đấu (CSV)</span>
      </a>
      </div>
      {restartError && <p className="mt-2 text-xs sm:text-sm font-bold text-[#FF5D8F]" role="alert">{restartError}</p>}
    </div>
  );
};

/** "VUA DỰ ĐOÁN": khán giả nhiều điểm dự đoán nhất, kèm hai người xếp sau. */
const PredictionKings: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const board = leaderboardOf(room?.predictions).slice(0, 3);
  if (!room || board.length === 0) return null;

  const viewerOf = (id: string) => room.players.find((p) => p.id === id);
  const [king, ...rest] = board;
  const kingPlayer = viewerOf(king.viewerId);

  return (
    <div className="w-full mb-3 rounded-2xl border border-[#F7C873]/40 bg-gradient-to-r from-[#1D1A38] via-[#11163A] to-[#0A0D22] px-3.5 py-2.5 shadow-glow-yellow flex flex-col sm:flex-row items-center gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg" aria-hidden="true">👑</span>
          <PlayerAvatar player={kingPlayer ?? { name: '?' }} size={44} className="ring-2 ring-[#F7C873]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs font-heading font-black uppercase tracking-[0.2em] text-[#F7C873]">Vua dự đoán</div>
          <div className="text-base sm:text-lg font-heading font-black text-[#EEF0FF] truncate">{kingPlayer?.name ?? 'Khán giả đã rời phòng'}</div>
          <div className="text-xs text-[#CDD2F2]">
            <span className="font-digital font-bold text-[#F7C873]">{king.points}</span> điểm · đoán đúng {king.wins} hạng mục
          </div>
        </div>
      </div>
      {rest.length > 0 && (
        <div className="sm:ml-auto flex items-center gap-2">
          {rest.map((r, i) => {
            const p = viewerOf(r.viewerId);
            return (
              <div key={r.viewerId} className="flex items-center gap-2 rounded-xl bg-[#0D1130] border border-[#262E66] px-2.5 py-1.5">
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-heading font-black text-[#05060F] ${i === 0 ? 'bg-[#CDD2F2]' : 'bg-[#D59E5B]'}`}>{i + 2}</span>
                <PlayerAvatar player={p ?? { name: '?' }} size={24} />
                <div className="leading-tight">
                  <div className="text-xs font-bold text-[#EEF0FF] max-w-[90px] truncate">{p?.name ?? 'Đã rời phòng'}</div>
                  <div className="text-[11px] font-digital text-[#A6ACDB]">{r.points} điểm</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
