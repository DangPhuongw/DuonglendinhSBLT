import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Star, Bell, Send, Trophy } from 'lucide-react';

export const VeDichRound: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const choosePackage = useGameStore((s) => s.choosePackage);
  const setHopeStar = useGameStore((s) => s.setHopeStar);
  const buzz = useGameStore((s) => s.buzz);
  const buzzWinner = useGameStore((s) => s.buzzWinner);
  const lastReveal = useGameStore((s) => s.lastReveal);

  const [inputAnswer, setInputAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const subPhase = room?.state?.subPhase;
  const currentQ = room?.state?.currentQuestion;
  const activePlayer = room?.players.find((p) => p.id === room.state.activePlayerId);
  const isMyTurn = Boolean(myPlayer && room?.state?.activePlayerId === myPlayer.id);
  const questionPoints = room?.state?.questionPoints || 10;
  const questionIndex = room?.state?.questionIndex || 0;

  // Clear answer on question change
  useEffect(() => {
    setInputAnswer('');
    setSubmitted(false);
  }, [currentQ?.id, subPhase]);

  // Stop voice reading on reveal, steal buzz, or steal answer
  useEffect(() => {
    if (subPhase === 'STEAL_BUZZ' || subPhase === 'STEAL_ANSWER' || subPhase === 'REVEAL') {
      voiceReader.stop();
    }
  }, [subPhase]);

  // Stop speech when round unmounts
  useEffect(() => {
    return () => {
      voiceReader.stop();
    };
  }, []);

  // Space key for steal buzzer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && subPhase === 'STEAL_BUZZ' && !isMyTurn) {
        e.preventDefault();
        buzz();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subPhase, isMyTurn, buzz]);

  if (!room || !myPlayer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || !currentQ) return;
    submitAnswer(currentQ.id, inputAnswer.trim());
    setSubmitted(true);
  };

  // --- 1. CHOOSE PACKAGE (20s) ---
  if (subPhase === 'CHOOSE_PACKAGE') {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="text-xs uppercase font-bold text-amber-400 tracking-widest mb-1">
          Lượt thi Về Đích
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          {activePlayer?.name}
        </h2>
        <p className="text-xs text-slate-400 mb-6">Chọn gói câu hỏi trong 20 giây:</p>

        <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={20} className="mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
          {[40, 60, 80].map((pkg) => (
            <button
              key={pkg}
              onClick={() => isMyTurn && choosePackage(pkg as any)}
              disabled={!isMyTurn}
              className={`p-5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                isMyTurn
                  ? 'bg-slate-900/90 hover:bg-slate-800 border-amber-500/50 hover:border-amber-400 shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95'
                  : 'bg-slate-950/40 border-slate-800 opacity-60 cursor-default'
              }`}
            >
              <span className="text-2xl font-black text-amber-400">{pkg} ĐIỂM</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {pkg === 40
                  ? '10 - 10 - 20'
                  : pkg === 60
                  ? '10 - 20 - 30'
                  : '20 - 30 - 30'}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- 2. STAR DECISION (10s) ---
  if (subPhase === 'STAR_DECISION') {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <span className="text-xs uppercase font-bold text-amber-400 tracking-widest mb-1">
          Câu hỏi {questionIndex + 1} ({questionPoints} Điểm) - {activePlayer?.name}
        </span>
        <h2 className="text-2xl font-black text-white mb-2">Quyết định Ngôi sao hy vọng</h2>
        <p className="text-xs text-slate-400 mb-6">
          Mỗi thí sinh chỉ được sử dụng 1 lần trong cả vòng Về Đích.
        </p>

        <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={10} className="mb-6" />

        {isMyTurn && !myPlayer.starUsed ? (
          <div className="flex gap-4">
            <button
              onClick={() => setHopeStar(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-yellow-500/20 cursor-pointer transition-all"
            >
              <Star size={16} className="fill-slate-950" />
              <span>Đặt Ngôi sao hy vọng</span>
            </button>
            <button
              onClick={() => setHopeStar(false)}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider border border-slate-700 transition-colors"
            >
              Không dùng
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">
            {myPlayer.starUsed
              ? 'Thí sinh đã sử dụng Ngôi sao hy vọng trước đó.'
              : 'Đang chờ thí sinh đưa ra quyết định...'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Về Đích - {activePlayer?.name} (Câu {questionIndex + 1}/3 - {questionPoints}đ)
          </span>
          {room.state.hopeStarActive && (
            <span className="flex items-center gap-1 text-[10px] bg-yellow-500 text-slate-950 font-black px-2 py-0.5 rounded-full animate-pulse">
              <Star size={10} className="fill-slate-950" />
              <span>NGÔI SAO HY VỌNG</span>
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {questionPoints === 10 ? '10s' : questionPoints === 20 ? '15s' : '20s'}
        </span>
      </div>

      {/* Timer */}
      <CountdownTimer
        deadline={room.state.deadline}
        totalDurationSeconds={
          subPhase === 'STEAL_BUZZ'
            ? 5
            : subPhase === 'STEAL_ANSWER'
            ? 10
            : questionPoints === 10
            ? 10
            : questionPoints === 20
            ? 15
            : 20
        }
        className="mb-6"
      />

      {/* STEAL BUZZER SCREEN (5s) */}
      {subPhase === 'STEAL_BUZZ' && (
        <div className="w-full flex flex-col items-center my-4">
          {!isMyTurn ? (
            <button
              onClick={buzz}
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 border-4 border-rose-300 shadow-2xl shadow-rose-600/40 flex flex-col items-center justify-center gap-2 buzzer-active cursor-pointer active:scale-95 transition-transform"
            >
              <Bell size={36} className="text-white animate-bounce" />
              <span className="font-black text-white text-sm tracking-wider uppercase">
                GIÀNH QUYỀN
              </span>
              <span className="text-[10px] text-rose-200 uppercase tracking-widest">(Phím Space)</span>
            </button>
          ) : (
            <div className="text-xs text-amber-400 font-semibold p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              Bạn chưa có câu trả lời chính xác. Các thí sinh khác đang có 5s giành quyền trả lời!
            </div>
          )}
        </div>
      )}

      {/* Steal buzzer winner notice (only shown when someone buzzed in STEAL_ANSWER phase) */}
      {subPhase === 'STEAL_ANSWER' && room.state.buzzerLockedBy && (
        <div className="w-full p-2.5 mb-4 bg-amber-950/60 border border-amber-500/50 rounded-xl text-center text-xs font-bold text-amber-300 animate-bounce">
          {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || buzzWinner?.winnerName} đã giành quyền trả lời câu hỏi!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Câu hỏi Về Đích ({questionPoints} điểm)
            </span>
            <QuestionSpeakerButton question={currentQ} autoRead={subPhase === 'QUESTION'} />
          </div>

          <p className="text-base sm:text-xl font-bold text-slate-100 mb-6 leading-relaxed">
            {currentQ.prompt}
          </p>

          {/* Main player answering input OR Stealer input */}
          {((subPhase === 'QUESTION' && isMyTurn) ||
            (subPhase === 'STEAL_ANSWER' && myPlayer.id === room.state.buzzerLockedBy)) && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder={
                  subPhase === 'STEAL_ANSWER'
                    ? 'Nhập câu trả lời giành quyền (Chỉ tính lần gửi đầu tiên!)...'
                    : 'Nhập câu trả lời của bạn...'
                }
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

          {submitted && subPhase === 'QUESTION' && (
            <p className="text-xs text-emerald-400 mt-2 font-medium">
              Đã ghi nhận: "{inputAnswer.toUpperCase()}". Có thể đổi đáp án đến khi hết giờ.
            </p>
          )}

          {/* Reveal */}
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

      {/* Host Override Bar removed */}
    </div>
  );
};
