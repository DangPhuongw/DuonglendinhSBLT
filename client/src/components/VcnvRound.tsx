import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { HostOverrideBar } from './HostOverrideBar';
import { Bell, Send, Lock, HelpCircle } from 'lucide-react';

export const VcnvRound: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const buzz = useGameStore((s) => s.buzz);
  const buzzWinner = useGameStore((s) => s.buzzWinner);
  const buzzRejectedReason = useGameStore((s) => s.buzzRejectedReason);
  const lastReveal = useGameStore((s) => s.lastReveal);

  const [inputAnswer, setInputAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!room || !myPlayer) return null;

  const subPhase = room.state.subPhase;
  const currentQ = room.state.currentQuestion;
  const openedPieces: number[] = room.state.openedPieces || [];
  const rowsRevealed: boolean[] = room.state.rowsRevealed || [false, false, false, false];
  const isEliminated = myPlayer.eliminatedVcnv;
  const isBuzzerLocked = Boolean(room.state.buzzerLockedBy);
  const isFirstRow = (room.state.rowStepIndex === 0 || !room.state.rowStepIndex) && subPhase === 'ROW_QUESTION';
  const canBuzz = !isEliminated && !isBuzzerLocked && !isFirstRow;

  const isMyTurnToAnswerCnv =
    (subPhase === 'CNV_ANSWERING' || subPhase === 'FINAL_GUESS_ANSWERING') &&
    room.state.activePlayerId === myPlayer.id;

  // Clear input when question or subPhase changes
  useEffect(() => {
    setInputAnswer('');
    setSubmitted(false);
  }, [currentQ?.id, subPhase]);

  // Space key for buzzer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && canBuzz) {
        if (
          subPhase === 'ROW_QUESTION' ||
          subPhase === 'ROW_REVEAL' ||
          subPhase === 'FINAL_GUESS'
        ) {
          // Buzzer available
          e.preventDefault();
          buzz();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subPhase, canBuzz, buzz]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || isEliminated) return;
    if (currentQ) {
      submitAnswer(currentQ.id, inputAnswer.trim());
      setSubmitted(true);
    }
  };

  const sampleImage =
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Round Header */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
          Vòng 2: Vượt Chướng Ngại Vật
        </span>
        <span className="text-xs text-slate-400 font-mono">
          Hàng ngang +10đ | CNV: 60/50/40/30đ
        </span>
      </div>

      {/* Timer */}
      <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={15} className="mb-4" />

      {/* Buzzer alerts */}
      {buzzWinner && isBuzzerLocked && (
        <div className="w-full p-2.5 mb-3 bg-amber-950/60 border border-amber-500/50 rounded-xl text-center text-xs font-bold text-amber-300 animate-bounce">
          Chuông VCNV: {buzzWinner.winnerName} đã bấm chuông giành quyền giải Chướng ngại vật!
        </div>
      )}

      {buzzRejectedReason && (
        <div className="w-full p-2.5 mb-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-center text-xs font-bold text-rose-300">
          {buzzRejectedReason}
        </div>
      )}

      {/* Main Grid: Puzzle Board & 5-Piece Image */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 4 Rows Puzzle Board */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Bảng hàng ngang (4 Hàng)
            </h4>

            {[0, 1, 2, 3].map((idx) => {
              const isRevealed = rowsRevealed[idx];
              const isCurrent = room.state.activeRowIndex === idx;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-500/10'
                      : isRevealed
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-950/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      Hàng ngang số {idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                    {isRevealed ? (
                      <span className="text-emerald-400 tracking-wider">ĐÃ MỞ</span>
                    ) : (
                      <span className="text-slate-500 tracking-widest">••••••</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buzzer Button for CNV */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {isEliminated ? (
                <span className="text-rose-400 font-bold">Bạn đã bị loại khỏi VCNV</span>
              ) : isBuzzerLocked ? (
                <span className="text-amber-400 font-semibold">
                  {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || 'Có người'} đã bấm chuông
                </span>
              ) : isFirstRow ? (
                <span className="text-slate-500 italic">Chuông sẽ mở từ sau hàng ngang 1</span>
              ) : (
                'Bấm chuông khi đã đoán được từ khóa CNV (Space)'
              )}
            </span>
            <button
              onClick={buzz}
              disabled={!canBuzz}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                !canBuzz
                  ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95 animate-pulse'
              }`}
            >
              <Bell size={14} />
              <span>Chuông CNV</span>
            </button>
          </div>
        </div>

        {/* 5-Piece Obstacle Image */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center relative min-h-[260px] overflow-hidden">
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
            {/* Background Image */}
            <img
              src={sampleImage}
              alt="Chướng ngại vật"
              className="w-full h-full object-cover select-none"
            />

            {/* 4 Quadrants & 1 Center Cover Mask */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              {/* Piece 0 (Top Left) */}
              <div
                className={`transition-opacity duration-700 border border-slate-900/60 flex items-center justify-center ${
                  openedPieces.includes(0) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
                }`}
              >
                {!openedPieces.includes(0) && (
                  <span className="text-slate-600 font-bold text-sm">Mảnh 1</span>
                )}
              </div>

              {/* Piece 1 (Top Right) */}
              <div
                className={`transition-opacity duration-700 border border-slate-900/60 flex items-center justify-center ${
                  openedPieces.includes(1) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
                }`}
              >
                {!openedPieces.includes(1) && (
                  <span className="text-slate-600 font-bold text-sm">Mảnh 2</span>
                )}
              </div>

              {/* Piece 2 (Bottom Left) */}
              <div
                className={`transition-opacity duration-700 border border-slate-900/60 flex items-center justify-center ${
                  openedPieces.includes(2) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
                }`}
              >
                {!openedPieces.includes(2) && (
                  <span className="text-slate-600 font-bold text-sm">Mảnh 3</span>
                )}
              </div>

              {/* Piece 3 (Bottom Right) */}
              <div
                className={`transition-opacity duration-700 border border-slate-900/60 flex items-center justify-center ${
                  openedPieces.includes(3) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
                }`}
              >
                {!openedPieces.includes(3) && (
                  <span className="text-slate-600 font-bold text-sm">Mảnh 4</span>
                )}
              </div>
            </div>

            {/* Center Piece (Piece 4) */}
            <div
              className={`absolute inset-[25%] rounded-lg transition-opacity duration-700 border-2 border-amber-500/40 flex items-center justify-center ${
                openedPieces.includes(4) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
              }`}
            >
              {!openedPieces.includes(4) && (
                <span className="text-amber-500/70 font-black text-xs uppercase tracking-wider">
                  Trung tâm
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Question or CNV Input Box */}
      {currentQ && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur">
          <div className="flex items-center gap-2 mb-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle size={14} />
            <span>
              {subPhase === 'CNV_ANSWERING' || subPhase === 'FINAL_GUESS_ANSWERING'
                ? 'Trả lời Chướng Ngại Vật'
                : subPhase === 'CENTER_QUESTION'
                ? 'Câu hỏi Trung Tâm'
                : 'Câu hỏi Hàng Ngang'}
            </span>
          </div>

          <p className="text-base sm:text-lg font-bold text-slate-100 mb-4">{currentQ.prompt}</p>

          {/* Answer Input form (if active or answering row) */}
          {(subPhase === 'ROW_QUESTION' ||
            subPhase === 'CENTER_QUESTION' ||
            isMyTurnToAnswerCnv) &&
            !isEliminated && (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập câu trả lời của bạn..."
                  value={inputAnswer}
                  onChange={(e) => setInputAnswer(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white uppercase placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm font-semibold tracking-wider"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Send size={14} />
                  <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
                </button>
              </form>
            )}

          {submitted && (
            <p className="text-xs text-emerald-400 mt-2 font-medium">
              Đã ghi nhận đáp án: "{inputAnswer.toUpperCase()}". Bạn có thể sửa đổi đến khi hết giờ.
            </p>
          )}

          {/* Reveal */}
          {(subPhase === 'ROW_REVEAL' || subPhase === 'CENTER_REVEAL') && lastReveal && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Đáp án chính xác:</span>
              <span className="text-sm font-black text-emerald-400 tracking-wider">
                {lastReveal.correctAnswer}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Host Override Score Bar */}
      {(subPhase === 'ROW_REVEAL' || subPhase === 'CENTER_REVEAL') && <HostOverrideBar />}
    </div>
  );
};
