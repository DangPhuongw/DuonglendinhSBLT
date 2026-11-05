import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Zap, Send, Clock, CheckCircle2, XCircle, Award } from 'lucide-react';

export const TangTocRound: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const lastReveal = useGameStore((s) => s.lastReveal);

  const [inputAnswer, setInputAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const subPhase = room?.state?.subPhase;
  const currentQ = room?.state?.currentQuestion;
  const questionIndex = room?.state?.questionIndex || 0;

  // Clear answer on new question
  useEffect(() => {
    setInputAnswer('');
    setSubmitted(false);
  }, [currentQ?.id]);

  // Auto-focus input when QUESTION phase starts
  useEffect(() => {
    if (subPhase === 'QUESTION') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [subPhase, currentQ?.id]);

  // Stop voice reading on reveal
  useEffect(() => {
    if (subPhase === 'REVEAL') {
      voiceReader.stop();
    }
  }, [subPhase]);

  // Stop speech when round unmounts
  useEffect(() => {
    return () => {
      voiceReader.stop();
    };
  }, []);

  if (!room || !myPlayer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || !currentQ || subPhase !== 'QUESTION') return;
    submitAnswer(currentQ.id, inputAnswer.trim());
    setSubmitted(true);
  };

  // Sắp xếp kết quả theo thời gian nộp nhanh nhất đứng trước
  const sortedResults = [...(lastReveal?.results || [])].sort((a, b) => {
    const timeA = a.timeSec && a.timeSec > 0 ? a.timeSec : Infinity;
    const timeB = b.timeSec && b.timeSec > 0 ? b.timeSec : Infinity;
    return timeA - timeB;
  });

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Vòng 3: Tăng Tốc (Câu {questionIndex + 1}/4)
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Nộp nhanh nhất nhận điểm cao nhất
        </span>
      </div>

      {/* Timer */}
      <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={30} className="mb-5" />

      {/* Question & Media Card */}
      {currentQ && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Câu hỏi số {questionIndex + 1}
            </span>
            <QuestionSpeakerButton question={currentQ} autoRead={subPhase === 'QUESTION'} />
          </div>

          <p className="text-base sm:text-xl font-bold text-slate-100 mb-4 leading-relaxed">
            {currentQ.prompt}
          </p>

          {/* Media if present */}
          {currentQ.media && (
            <div className="my-4 rounded-xl overflow-hidden border border-slate-700 max-h-80 flex items-center justify-center bg-slate-950 shadow-inner">
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
                ref={inputRef}
                type="text"
                placeholder="Nhập câu trả lời của bạn (Enter để gửi)..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white uppercase placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-semibold tracking-wider transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
              >
                <Send size={14} />
                <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
              </button>
            </form>
          )}

          {submitted && subPhase === 'QUESTION' && (
            <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>
                Đã ghi nhận: <strong className="text-white">"{inputAnswer.toUpperCase()}"</strong>. Bạn có thể sửa đổi đến khi hết giờ.
              </span>
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVEAL SCREEN: Hiện đáp án của 4 người theo thời gian kèm dấu tick đúng/sai */}
      {/* ========================================================================= */}
      {subPhase === 'REVEAL' && lastReveal && (
        <div className="w-full bg-slate-900/95 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur">
          {/* Header Đáp án chính xác */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                Đáp án chính xác:
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-wider mt-0.5 block">
                {lastReveal.correctAnswer}
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock size={13} className="text-amber-400" />
              <span>Sắp xếp theo thời gian nộp nhanh nhất</span>
            </div>
          </div>

          {/* Danh sách 4 thí sinh theo thời gian kèm dấu tick đúng/sai */}
          <div className="mt-5 space-y-3">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Award size={15} />
              <span>BẢNG KẾT QUẢ TĂNG TỐC</span>
            </h4>

            {sortedResults.map((res, index) => {
              const p = room.players.find((player) => player.id === res.playerId);
              if (!p) return null;

              const hasSubmitted = Boolean(res.answer && res.timeSec && res.timeSec > 0);

              return (
                <div
                  key={res.playerId}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    res.isCorrect
                      ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : hasSubmitted
                      ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                  }`}
                >
                  {/* Left: Thứ hạng + Dấu tick đúng/sai + Thông tin thí sinh & đáp án */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Thứ hạng (1, 2, 3, 4) */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
                        res.isCorrect
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Dấu tick đúng / sai nổi bật */}
                    <div className="shrink-0">
                      {res.isCorrect ? (
                        <div
                          title="Đúng"
                          className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/30"
                        >
                          <CheckCircle2 size={20} className="stroke-[2.5]" />
                        </div>
                      ) : (
                        <div
                          title="Sai"
                          className="w-8 h-8 rounded-full bg-rose-500/20 border-2 border-rose-500/80 flex items-center justify-center text-rose-400"
                        >
                          <XCircle size={20} className="stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    {/* Tên & Đáp án thí sinh */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-100 text-sm sm:text-base truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          Ghế {p.seat}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs sm:text-sm">
                        {hasSubmitted ? (
                          <span
                            className={`font-bold tracking-wider uppercase ${
                              res.isCorrect ? 'text-emerald-300' : 'text-rose-300 line-through'
                            }`}
                          >
                            "{res.answer}"
                          </span>
                        ) : (
                          <span className="text-slate-500 italic text-xs">
                            (Chưa nộp câu trả lời)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Thời gian nộp (giây) + Điểm số đạt được */}
                  <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 font-mono">
                    {/* Thời gian */}
                    {hasSubmitted && res.timeSec != null ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs sm:text-sm text-slate-200 font-bold shadow-inner">
                        <Clock size={13} className="text-amber-400" />
                        <span>{Number(res.timeSec).toFixed(2)}s</span>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs italic px-2">--</span>
                    )}

                    {/* Điểm số */}
                    <div
                      className={`text-sm sm:text-base font-black px-3 py-1 rounded-xl border min-w-[54px] text-center ${
                        res.delta > 0
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 text-slate-600 border-slate-800'
                      }`}
                    >
                      {res.delta > 0 ? `+${res.delta}đ` : '0đ'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
