import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Star, Bell, Send, Trophy, CheckCircle2, Eye } from 'lucide-react';

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
  const isViewer = myPlayer?.role === 'viewer';
  const isMyTurn = Boolean(!isViewer && myPlayer && room?.state?.activePlayerId === myPlayer.id);
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
      if (e.code === 'Space' && !isViewer && subPhase === 'STEAL_BUZZ' && !isMyTurn) {
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
        <div className="w-full bg-[#111827] border border-[#303D52] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          <span className="text-xs uppercase font-heading font-black bg-[#FFD43B]/15 text-[#FFD43B] px-3.5 py-1 rounded-full border border-[#FFD43B]/40 shadow-glow-yellow mb-2">
            Lượt thi Về Đích
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#F8FAFC] mb-2">
            {activePlayer?.name}
          </h2>
          <p className="text-xs text-[#94A3B8] font-medium mb-6">Chọn gói câu hỏi trong 20 giây:</p>

          <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={20} className="mb-6" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-lg">
            {[40, 60, 80].map((pkg) => (
              <button
                key={pkg}
                onClick={() => isMyTurn && choosePackage(pkg as any)}
                disabled={!isMyTurn}
                className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
                  isMyTurn
                    ? 'bg-[#1C2638] hover:border-[#FFD43B] hover:shadow-glow-yellow hover:scale-105 active:scale-95 border-[#303D52] cursor-pointer'
                    : 'bg-[#1C2638]/40 opacity-50 cursor-default border-[#303D52]/40 text-[#64748B]'
                }`}
              >
                <span className="text-2xl sm:text-3xl font-digital font-bold text-[#FFD43B] tabular-nums">{pkg} ĐIỂM</span>
                <span className="text-xs text-[#94A3B8] font-digital font-bold">
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

  // --- 2. STAR DECISION (7s) ---
  if (subPhase === 'STAR_DECISION') {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-full bg-[#111827] border border-[#303D52] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          <span className="text-xs uppercase font-heading font-black bg-[#FFD43B]/15 text-[#FFD43B] px-3.5 py-1 rounded-full border border-[#FFD43B]/40 shadow-glow-yellow mb-2">
            Câu hỏi {questionIndex + 1} ({questionPoints} Điểm) - {activePlayer?.name}
          </span>
          <h2 className="text-2xl font-heading font-black text-[#F8FAFC] mb-2">Quyết định Ngôi sao hy vọng</h2>
          <p className="text-xs text-[#94A3B8] font-medium mb-6">
            Mỗi thí sinh chỉ được sử dụng 1 lần trong cả vòng Về Đích.
          </p>

          <CountdownTimer
            deadline={room.state.deadline}
            totalDurationSeconds={7}
            showSeconds={false}
            className="mb-6"
          />

          {isMyTurn && !myPlayer.starUsed ? (
            <div className="flex gap-4">
              <button
                onClick={() => setHopeStar(true)}
                className="px-6 py-3.5 bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] font-heading font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 border border-[#FFD43B] shadow-glow-yellow hover:scale-105 active:scale-95 cursor-pointer transition-all"
              >
                <Star size={16} className="fill-[#090D18] text-[#090D18]" />
                <span>Đặt Ngôi sao hy vọng</span>
              </button>
              <button
                onClick={() => setHopeStar(false)}
                className="px-6 py-3.5 bg-[#1C2638] hover:bg-[#24324a] text-[#F8FAFC] font-heading font-bold rounded-xl text-xs uppercase tracking-wider border border-[#303D52] transition-all cursor-pointer"
              >
                Không dùng
              </button>
            </div>
          ) : (
            <div className="text-xs text-[#94A3B8] font-medium italic bg-[#090D18] p-3 rounded-xl border border-[#303D52]">
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
          <span className="text-xs font-heading font-black uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3 py-1 rounded-lg border border-[#FFD43B]/40 shadow-glow-yellow flex items-center gap-1.5">
            <Trophy size={16} />
            Về Đích - {activePlayer?.name} (Câu {questionIndex + 1}/3 - {questionPoints}đ)
          </span>
          {room.state.hopeStarActive && (
            <span className="flex items-center gap-1 text-[10px] bg-[#FFD43B] text-[#090D18] font-heading font-black px-2.5 py-0.5 rounded-full shadow-glow-yellow animate-pulse">
              <Star size={12} className="fill-[#090D18] text-[#090D18]" />
              <span>NGÔI SAO HY VỌNG</span>
            </span>
          )}
        </div>
        <span className="text-xs text-[#94A3B8] font-digital font-bold bg-[#1C2638] border border-[#303D52] px-2.5 py-1 rounded-lg tabular-nums">
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
          {isViewer ? (
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#1C2638] border-2 border-[#00D9FF]/50 shadow-glow-cyan flex flex-col items-center justify-center gap-1.5 p-4 text-center">
              <Eye size={32} className="text-[#00D9FF] animate-pulse" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-[#00D9FF]">
                KHÁN GIẢ
              </span>
              <span className="text-[10px] text-[#94A3B8] leading-tight">
                Chờ thí sinh bấm chuông giành quyền
              </span>
            </div>
          ) : !isMyTurn ? (
            <button
              onClick={buzz}
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#FF496C] hover:bg-[#ff6584] border-4 border-[#FF496C] shadow-glow-danger-lg flex flex-col items-center justify-center gap-1 buzzer-active cursor-pointer active:scale-95 transition-transform"
            >
              <Bell size={36} className="text-white animate-bounce" />
              <span className="font-heading font-black text-white text-sm tracking-wider uppercase">
                GIÀNH QUYỀN
              </span>
              <span className="text-[11px] text-white/90 font-heading font-bold uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full mt-1">
                Phím Space
              </span>
            </button>
          ) : (
            <div className="text-xs text-[#FF496C] font-bold p-3 bg-[#FF496C]/10 rounded-xl border border-[#FF496C]/40 shadow-glow-danger">
              Bạn chưa có câu trả lời chính xác. Các thí sinh khác đang có 5s giành quyền trả lời!
            </div>
          )}
        </div>
      )}

      {/* Steal buzzer winner notice */}
      {subPhase === 'STEAL_ANSWER' && room.state.buzzerLockedBy && (
        <div className="w-full p-3 mb-4 bg-[#FFD43B]/20 border border-[#FFD43B] rounded-xl text-center text-xs sm:text-sm font-heading font-bold text-[#FFD43B] shadow-glow-yellow animate-bounce">
          🔔 {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || buzzWinner?.winnerName} đã giành quyền trả lời câu hỏi!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-[#1C2638] border border-[#303D52] rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3 py-1 rounded-md border border-[#FFD43B]/40 shadow-glow-yellow">
              Câu hỏi Về Đích ({questionPoints} điểm)
            </span>
            <QuestionSpeakerButton question={currentQ} autoRead={subPhase === 'QUESTION'} />
          </div>

          <p className="text-base sm:text-xl font-bold text-[#F8FAFC] mb-6 leading-relaxed">
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
                className="flex-1 px-4 py-3 bg-[#090D18] border border-[#303D52] rounded-xl text-[#F8FAFC] uppercase placeholder-[#64748B] focus:outline-none focus:border-[#00D9FF] focus:shadow-glow-cyan text-sm font-heading font-bold tracking-wider transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] font-heading font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border border-[#FFD43B] shadow-glow-yellow hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send size={14} />
                <span>Gửi</span>
              </button>
            </form>
          )}

          {submitted && subPhase === 'QUESTION' && (
            <div className="text-xs text-[#20D6A0] mt-3 font-bold flex items-center gap-2 bg-[#20D6A0]/10 border border-[#20D6A0]/30 px-3.5 py-2 rounded-xl shadow-glow-success">
              <CheckCircle2 size={16} />
              <span>
                Đã ghi nhận: <strong className="text-white font-heading font-bold">"{inputAnswer.toUpperCase()}"</strong>. Có thể đổi đáp án đến khi hết giờ.
              </span>
            </div>
          )}

          {/* Reveal */}
          {subPhase === 'REVEAL' && lastReveal && (
            <div className="mt-6 pt-4 border-t border-[#303D52] flex items-center justify-between">
              <span className="text-xs text-[#94A3B8] font-heading font-bold uppercase tracking-wider">Đáp án chính xác:</span>
              <span className="text-base font-heading font-black text-[#090D18] bg-[#20D6A0] px-3.5 py-1 rounded-xl shadow-glow-success tracking-wider">
                {lastReveal.correctAnswer}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
