import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { HostOverrideBar } from './HostOverrideBar';
import { Zap, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const TangTocRound: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const lastReveal = useGameStore((s) => s.lastReveal);

  const [inputAnswer, setInputAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!room || !myPlayer) return null;

  const subPhase = room.state.subPhase;
  const currentQ = room.state.currentQuestion;
  const questionIndex = room.state.questionIndex || 0;

  // Clear answer on new question
  useEffect(() => {
    setInputAnswer('');
    setSubmitted(false);
  }, [currentQ?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || !currentQ || subPhase !== 'QUESTION') return;
    submitAnswer(currentQ.id, inputAnswer.trim());
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Vòng 3: Tăng Tốc (Câu {questionIndex + 1}/4)
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">Điểm: 30 - 25 - 20 - 15 - 10</span>
      </div>

      {/* Timer */}
      <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={30} className="mb-6" />

      {/* Question & Media Card */}
      {currentQ && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur mb-6">
          <p className="text-base sm:text-xl font-bold text-slate-100 mb-4 leading-relaxed">
            {currentQ.prompt}
          </p>

          {/* Media if present */}
          {currentQ.media && (
            <div className="my-4 rounded-xl overflow-hidden border border-slate-700 max-h-80 flex items-center justify-center bg-slate-950">
              {currentQ.media.endsWith('.mp4') ? (
                <video src={currentQ.media} autoPlay controls className="max-h-80 w-auto" />
              ) : (
                <img
                  src={currentQ.media}
                  alt="Câu hỏi tăng tốc"
                  className="max-h-80 w-auto object-contain"
                />
              )}
            </div>
          )}

          {/* Answer input form (during 30s) */}
          {subPhase === 'QUESTION' && (
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Nhập câu trả lời của bạn..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white uppercase placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm font-semibold tracking-wider"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Send size={14} />
                <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
              </button>
            </form>
          )}

          {submitted && subPhase === 'QUESTION' && (
            <p className="text-xs text-emerald-400 mt-2 font-medium">
              Đã ghi nhận: "{inputAnswer.toUpperCase()}". Bạn có thể thay đổi liên tục trong 30 giây.
            </p>
          )}
        </div>
      )}

      {/* REVEAL SCREEN: Submission Times Table (2 decimals) */}
      {subPhase === 'REVEAL' && lastReveal && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs uppercase font-bold text-slate-400">Đáp án chính xác:</span>
            <span className="text-lg font-black text-emerald-400 tracking-wider">
              {lastReveal.correctAnswer}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Bảng thời gian nộp bài của thí sinh:
            </h4>

            {lastReveal.results.map((res) => {
              const p = room.players.find((player) => player.id === res.playerId);
              if (!p) return null;

              return (
                <div
                  key={res.playerId}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    res.isCorrect
                      ? 'bg-emerald-950/30 border-emerald-800/60'
                      : 'bg-slate-950/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">G{p.seat}</span>
                    <span className="font-semibold text-slate-200 text-sm">{p.name}</span>
                    <span className="text-xs italic text-slate-400">
                      "{res.answer || '(Chưa nộp)'}"
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    {res.timeSec && res.timeSec > 0 ? (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock size={12} />
                        <span>{res.timeSec.toFixed(2)}s</span>
                      </span>
                    ) : null}

                    <span
                      className={`font-black text-sm px-2 py-0.5 rounded ${
                        res.delta > 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-slate-600'
                      }`}
                    >
                      {res.delta > 0 ? `+${res.delta}đ` : '0đ'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Host Override Bar */}
      {subPhase === 'REVEAL' && <HostOverrideBar />}
    </div>
  );
};
