import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { Bell, CheckCircle, XCircle } from 'lucide-react';

export const KhoiDongRound: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const buzz = useGameStore((s) => s.buzz);
  const buzzWinner = useGameStore((s) => s.buzzWinner);
  const buzzRejectedReason = useGameStore((s) => s.buzzRejectedReason);
  const lastReveal = useGameStore((s) => s.lastReveal);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!room || !myPlayer) return null;

  const currentRound = room.state.round; // 'KD_RIENG' or 'KD_CHUNG'
  const subPhase = room.state.subPhase;
  const currentQ = room.state.currentQuestion;
  const activePlayer = room.players.find((p) => p.id === room.state.activePlayerId);
  const isMyTurn = myPlayer && room.state.activePlayerId === myPlayer.id;

  // Clear local selected option when question changes
  useEffect(() => {
    setSelectedOption(null);
  }, [currentQ?.id]);

  // Keyboard shortcut listener (1-4 for options, Space for buzzer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for buzzer
      if (e.code === 'Space' && currentRound === 'KD_CHUNG' && subPhase === 'QUESTION_BUZZ') {
        e.preventDefault();
        buzz();
        return;
      }

      // 1-4 for MCQ options if active player
      if (isMyTurn && (subPhase === 'QUESTION' || subPhase === 'ANSWERING') && currentQ?.options) {
        if (['1', '2', '3', '4'].includes(e.key) && !selectedOption) {
          const index = parseInt(e.key, 10) - 1;
          const letter = ['A', 'B', 'C', 'D'][index];
          setSelectedOption(letter);
          submitAnswer(currentQ.id, letter);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRound, subPhase, isMyTurn, currentQ, selectedOption, buzz, submitAnswer]);

  const handleSelectOption = (letter: string) => {
    if (!isMyTurn || selectedOption || !currentQ) return;
    setSelectedOption(letter);
    submitAnswer(currentQ.id, letter);
  };

  // --- 1. TURN INTRO ---
  if (subPhase === 'TURN_INTRO') {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="text-xs uppercase font-bold text-amber-400 tracking-widest mb-2">
          Lượt thi Khởi động riêng
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
          {activePlayer?.name}
        </h2>
        <span className="text-sm font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
          Ghế số {activePlayer?.seat}
        </span>
        <p className="text-xs text-slate-500 mt-4">5 câu hỏi trắc nghiệm (15 giây/câu)</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Round Header */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
          {currentRound === 'KD_RIENG'
            ? `Khởi Động Riêng - ${activePlayer?.name} (Ghế ${activePlayer?.seat})`
            : 'Khởi Động Chung - Giành Chuông (10 Câu)'}
        </span>
        <span className="text-xs text-slate-400 font-mono">
          {currentRound === 'KD_RIENG' ? 'Đúng +10đ | Sai 0đ' : 'Đúng +10đ | Sai/Hết giờ -5đ'}
        </span>
      </div>

      {/* Timer */}
      <CountdownTimer
        deadline={room.state.deadline}
        totalDurationSeconds={
          subPhase === 'QUESTION_BUZZ'
            ? 15
            : subPhase === 'ANSWERING'
            ? 15
            : 15
        }
        className="mb-6"
      />

      {/* BUZZER SCREEN FOR KD_CHUNG */}
      {currentRound === 'KD_CHUNG' && subPhase === 'QUESTION_BUZZ' && (
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

          {buzzRejectedReason && (
            <span className="text-xs text-rose-400 font-semibold mt-3 animate-pulse">
              {buzzRejectedReason}
            </span>
          )}
        </div>
      )}

      {/* Buzzer Winner Announcement */}
      {subPhase === 'ANSWERING' && Boolean(room.state.buzzerLockedBy) && (
        <div className="w-full p-2.5 mb-4 bg-amber-950/60 border border-amber-500/50 rounded-xl text-center text-xs font-bold text-amber-300 animate-bounce">
          Chuông: {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || buzzWinner?.winnerName} đã giành được quyền trả lời!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur">
          <div className="text-base sm:text-xl font-bold text-slate-100 mb-6 leading-relaxed">
            {currentQ.prompt}
          </div>

          {/* MCQ Options A, B, C, D */}
          {currentQ.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                const isSelected = selectedOption === letter;
                const isAnswer =
                  subPhase === 'REVEAL' && lastReveal?.correctAnswer === letter;
                const isWrongSelection =
                  subPhase === 'REVEAL' && isSelected && !isAnswer;

                return (
                  <button
                    key={letter}
                    onClick={() => handleSelectOption(letter)}
                    disabled={!isMyTurn || selectedOption !== null || subPhase === 'REVEAL'}
                    className={`p-3.5 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      isAnswer
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                        : isWrongSelection
                        ? 'bg-rose-950 border-rose-500 text-rose-200'
                        : isSelected
                        ? 'bg-amber-950 border-amber-500 text-amber-200'
                        : isMyTurn && subPhase !== 'REVEAL'
                        ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 cursor-pointer hover:border-slate-500'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 cursor-default'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        isAnswer
                          ? 'bg-emerald-500 text-slate-950'
                          : isWrongSelection
                          ? 'bg-rose-500 text-white'
                          : isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm font-medium leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Reveal Result Info */}
          {subPhase === 'REVEAL' && lastReveal && (
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col items-center">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-slate-400">Đáp án chính xác:</span>
                <span className="text-emerald-400 font-extrabold text-base">
                  {lastReveal.correctAnswer}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Host Override Score Bar removed */}
    </div>
  );
};
