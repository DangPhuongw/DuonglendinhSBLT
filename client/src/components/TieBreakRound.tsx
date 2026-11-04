import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { Bell, AlertTriangle, Send } from 'lucide-react';

export const TieBreakRound: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const buzz = useGameStore((s) => s.buzz);
  const buzzWinner = useGameStore((s) => s.buzzWinner);
  const buzzRejectedReason = useGameStore((s) => s.buzzRejectedReason);
  const lastReveal = useGameStore((s) => s.lastReveal);

  const [inputAnswer, setInputAnswer] = useState('');

  if (!room || !myPlayer) return null;

  const subPhase = room.state.subPhase;
  const currentQ = room.state.currentQuestion;
  const eligibleIds: string[] = room.state.eligiblePlayerIds || [];
  const isEligible = eligibleIds.includes(myPlayer.id);
  const isAnswering = subPhase === 'ANSWERING' && room.state.activePlayerId === myPlayer.id;

  // Space key for buzzer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isEligible && (subPhase === 'WAIT_SIGNAL' || subPhase === 'BUZZ_OPEN')) {
        e.preventDefault();
        buzz();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subPhase, isEligible, buzz]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || !currentQ || !isAnswering) return;
    submitAnswer(currentQ.id, inputAnswer.trim());
  };

  // DRAW LOTS
  if (subPhase === 'DRAW_LOTS') {
    const winner = room.players.find((p) => p.id === room.state.winnerId);
    return (
      <div className="max-w-xl mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-black text-amber-400 mb-2">BỐC THĂM MAY MẮN</h2>
        <p className="text-xs text-slate-400 mb-6">
          Sau 3 câu hỏi phụ vẫn bất phân thắng bại, hệ thống tiến hành bốc thăm ngẫu nhiên:
        </p>
        <div className="text-3xl font-extrabold text-white p-6 bg-slate-900 border border-amber-500/50 rounded-2xl animate-pulse">
          {winner ? winner.name : 'Đang quay số...'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
          CÂU HỎI PHỤ PHÂN ĐỊNH THẮNG THUA
        </span>
        <span className="text-xs text-slate-400 font-mono">Đúng thắng chung cuộc</span>
      </div>

      <CountdownTimer
        deadline={room.state.deadline}
        totalDurationSeconds={
          subPhase === 'WAIT_SIGNAL' ? 3 : subPhase === 'BUZZ_OPEN' ? 15 : 10
        }
        className="mb-6"
      />

      {/* WAIT SIGNAL BANNER (G14: Bấm trước 3s bị phạt) */}
      {subPhase === 'WAIT_SIGNAL' && (
        <div className="w-full p-4 mb-4 bg-amber-950/60 border-2 border-amber-500 rounded-2xl flex items-center justify-center gap-3 animate-pulse">
          <AlertTriangle size={24} className="text-amber-400 shrink-0" />
          <div className="text-center">
            <span className="text-base font-black text-amber-300 uppercase tracking-widest block">
              CHỜ HIỆU LỆNH BẤM CHUÔNG...
            </span>
            <span className="text-[11px] text-amber-400/80">
              Cảnh báo: Bấm chuông trong 3 giây này sẽ bị tước quyền câu này!
            </span>
          </div>
        </div>
      )}

      {/* BUZZ OPEN */}
      {subPhase === 'BUZZ_OPEN' && isEligible && (
        <div className="w-full flex flex-col items-center my-4">
          <button
            onClick={buzz}
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 border-4 border-rose-300 shadow-2xl shadow-rose-600/40 flex flex-col items-center justify-center gap-2 buzzer-active cursor-pointer active:scale-95 transition-transform"
          >
            <Bell size={36} className="text-white animate-bounce" />
            <span className="font-black text-white text-base tracking-wider uppercase">
              BẤM CHUÔNG
            </span>
            <span className="text-[10px] text-rose-200 uppercase tracking-widest">(Phím Space)</span>
          </button>
        </div>
      )}

      {buzzRejectedReason && (
        <div className="w-full p-2.5 mb-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-center text-xs font-bold text-rose-300">
          {buzzRejectedReason}
        </div>
      )}

      {buzzWinner && Boolean(room.state.buzzerLockedBy) && (
        <div className="w-full p-2.5 mb-4 bg-amber-950/60 border border-amber-500/50 rounded-xl text-center text-xs font-bold text-amber-300 animate-bounce">
          {buzzWinner.winnerName} đã giành quyền trả lời câu hỏi!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur">
          <p className="text-base sm:text-xl font-bold text-slate-100 mb-6 leading-relaxed">
            {currentQ.prompt}
          </p>

          {isAnswering && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập câu trả lời của bạn..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white uppercase placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm font-semibold tracking-wider"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
              >
                <Send size={14} />
                <span>Gửi</span>
              </button>
            </form>
          )}

          {subPhase === 'REVEAL' && lastReveal && (
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Đáp án chính xác:</span>
              <span className="text-sm font-black text-emerald-400 tracking-wider">
                {lastReveal.correctAnswer}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
