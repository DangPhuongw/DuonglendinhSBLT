import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Star, Bell, Send, Trophy, CheckCircle2 } from 'lucide-react';

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
        <div className="w-full bg-white border-3 border-[#171717] rounded-3xl p-6 sm:p-8 shadow-neo-lg flex flex-col items-center">
          <span className="text-xs uppercase font-black bg-[#FFE45C] text-[#171717] px-3.5 py-1 rounded-full border-2 border-[#171717] shadow-neo-sm mb-2">
            Lượt thi Về Đích
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mb-2">
            {activePlayer?.name}
          </h2>
          <p className="text-xs text-gray-700 font-bold mb-6">Chọn gói câu hỏi trong 20 giây:</p>

          <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={20} className="mb-6" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-lg">
            {[40, 60, 80].map((pkg) => (
              <button
                key={pkg}
                onClick={() => isMyTurn && choosePackage(pkg as any)}
                disabled={!isMyTurn}
                className={`p-5 rounded-2xl border-2 border-[#171717] flex flex-col items-center gap-1.5 transition-all ${
                  isMyTurn
                    ? 'bg-white hover:bg-[#FFE45C] shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer'
                    : 'bg-gray-100 opacity-60 cursor-default shadow-none text-gray-500'
                }`}
              >
                <span className="text-2xl font-black text-[#171717] tabular-nums">{pkg} ĐIỂM</span>
                <span className="text-xs text-gray-700 font-black font-mono">
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
      </div>
    );
  }

  // --- 2. STAR DECISION (10s) ---
  if (subPhase === 'STAR_DECISION') {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-full bg-white border-3 border-[#171717] rounded-3xl p-6 sm:p-8 shadow-neo-lg flex flex-col items-center">
          <span className="text-xs uppercase font-black bg-[#FFE45C] text-[#171717] px-3.5 py-1 rounded-full border-2 border-[#171717] shadow-neo-sm mb-2">
            Câu hỏi {questionIndex + 1} ({questionPoints} Điểm) - {activePlayer?.name}
          </span>
          <h2 className="text-2xl font-black text-[#171717] mb-2">Quyết định Ngôi sao hy vọng</h2>
          <p className="text-xs text-gray-700 font-bold mb-6">
            Mỗi thí sinh chỉ được sử dụng 1 lần trong cả vòng Về Đích.
          </p>

          <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={10} className="mb-6" />

          {isMyTurn && !myPlayer.starUsed ? (
            <div className="flex gap-4">
              <button
                onClick={() => setHopeStar(true)}
                className="px-6 py-3.5 bg-[#FFE45C] hover:bg-[#ffe040] text-[#171717] font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 border-2 border-[#171717] shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer transition-all"
              >
                <Star size={16} className="fill-[#171717] text-[#171717]" />
                <span>Đặt Ngôi sao hy vọng</span>
              </button>
              <button
                onClick={() => setHopeStar(false)}
                className="px-6 py-3.5 bg-white hover:bg-gray-100 text-[#171717] font-black rounded-xl text-xs uppercase tracking-wider border-2 border-[#171717] shadow-neo-sm transition-all cursor-pointer"
              >
                Không dùng
              </button>
            </div>
          ) : (
            <div className="text-xs text-gray-600 font-bold italic bg-[#FFFDF7] p-3 rounded-xl border-2 border-[#171717]">
              {myPlayer.starUsed
                ? 'Thí sinh đã sử dụng Ngôi sao hy vọng trước đó.'
                : 'Đang chờ thí sinh đưa ra quyết định...'}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4 px-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3 py-1 rounded-lg border-2 border-[#171717] shadow-neo-sm flex items-center gap-1.5">
            <Trophy size={16} />
            Về Đích - {activePlayer?.name} (Câu {questionIndex + 1}/3 - {questionPoints}đ)
          </span>
          {room.state.hopeStarActive && (
            <span className="flex items-center gap-1 text-[10px] bg-[#FFE45C] text-[#171717] font-black px-2.5 py-0.5 rounded-full border border-[#171717] shadow-neo-sm animate-pulse">
              <Star size={12} className="fill-[#171717] text-[#171717]" />
              <span>NGÔI SAO HY VỌNG</span>
            </span>
          )}
        </div>
        <span className="text-xs text-gray-700 font-bold bg-white border-2 border-[#171717] px-2.5 py-1 rounded-lg shadow-neo-sm tabular-nums">
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
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#FFE45C] hover:bg-[#ffe040] border-4 border-[#171717] shadow-neo-lg flex flex-col items-center justify-center gap-1 buzzer-active cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-neo transition-transform"
            >
              <Bell size={36} className="text-[#171717] animate-bounce" />
              <span className="font-black text-[#171717] text-sm tracking-wider uppercase">
                GIÀNH QUYỀN
              </span>
              <span className="text-[11px] text-gray-800 font-black uppercase tracking-widest bg-white border border-[#171717] px-2 py-0.5 rounded-full mt-1">
                Phím Space
              </span>
            </button>
          ) : (
            <div className="text-xs text-[#171717] font-black p-3 bg-white rounded-xl border-2 border-[#171717] shadow-neo-sm">
              Bạn chưa có câu trả lời chính xác. Các thí sinh khác đang có 5s giành quyền trả lời!
            </div>
          )}
        </div>
      )}

      {/* Steal buzzer winner notice */}
      {subPhase === 'STEAL_ANSWER' && room.state.buzzerLockedBy && (
        <div className="w-full p-3 mb-4 bg-[#FFE45C] border-2 border-[#171717] rounded-xl text-center text-xs sm:text-sm font-black text-[#171717] shadow-neo animate-bounce">
          🔔 {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || buzzWinner?.winnerName} đã giành quyền trả lời câu hỏi!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-white border-3 border-[#171717] rounded-2xl p-6 sm:p-8 shadow-neo-lg">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3 py-1 rounded-md border-2 border-[#171717] shadow-neo-sm">
              Câu hỏi Về Đích ({questionPoints} điểm)
            </span>
            <QuestionSpeakerButton question={currentQ} autoRead={subPhase === 'QUESTION'} />
          </div>

          <p className="text-base sm:text-xl font-black text-[#171717] mb-6 leading-relaxed">
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
                className="flex-1 px-4 py-3 bg-white border-2 border-[#171717] rounded-xl text-[#171717] uppercase placeholder-gray-400 focus:outline-none focus:bg-[#FFFDF7] text-sm font-black tracking-wider shadow-neo-sm transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#FFE45C] hover:bg-[#ffe040] text-[#171717] font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border-2 border-[#171717] shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <Send size={14} />
                <span>Gửi</span>
              </button>
            </form>
          )}

          {submitted && subPhase === 'QUESTION' && (
            <div className="text-xs text-[#171717] mt-3 font-bold flex items-center gap-2 bg-[#55D6C2]/30 border-2 border-[#171717] px-3.5 py-2 rounded-xl shadow-neo-sm">
              <CheckCircle2 size={16} />
              <span>
                Đã ghi nhận: <strong className="text-[#171717] font-black">"{inputAnswer.toUpperCase()}"</strong>. Có thể đổi đáp án đến khi hết giờ.
              </span>
            </div>
          )}

          {/* Reveal */}
          {subPhase === 'REVEAL' && lastReveal && (
            <div className="mt-6 pt-4 border-t-2 border-[#171717] flex items-center justify-between">
              <span className="text-xs text-gray-700 font-black uppercase tracking-wider">Đáp án chính xác:</span>
              <span className="text-base font-black text-[#171717] bg-[#55D6C2] px-3.5 py-1 rounded-xl border-2 border-[#171717] shadow-neo-sm tracking-wider">
                {lastReveal.correctAnswer}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
