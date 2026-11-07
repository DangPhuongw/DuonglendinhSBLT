import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Zap, Send, Clock, CheckCircle2, XCircle, Award, Eye } from 'lucide-react';

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

  const isViewer = myPlayer?.role === 'viewer';

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
      <div className="w-full flex items-center justify-between mb-4 px-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-heading font-black uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3 py-1 rounded-lg border border-[#FFD43B]/40 shadow-glow-yellow flex items-center gap-1.5">
            <Zap size={15} className="fill-[#FFD43B] text-[#FFD43B]" />
            Vòng 3: Tăng Tốc (Câu {questionIndex + 1}/4)
          </span>
        </div>
        <span className="text-xs text-[#94A3B8] font-medium bg-[#1C2638] border border-[#303D52] px-2.5 py-1 rounded-lg">
          Nộp nhanh nhất nhận điểm cao nhất
        </span>
      </div>

      {/* Timer */}
      <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={30} className="mb-6" />

      {/* Question & Media Card */}
      {currentQ && (
        <div className="w-full bg-[#1C2638] border border-[#303D52] rounded-2xl p-6 sm:p-8 shadow-2xl mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3 py-1 rounded-md border border-[#FFD43B]/40 shadow-glow-yellow">
              Câu hỏi số {questionIndex + 1}
            </span>
            <QuestionSpeakerButton question={currentQ} autoRead={subPhase === 'QUESTION'} />
          </div>

          <p className="text-base sm:text-xl font-bold text-[#F8FAFC] mb-4 leading-relaxed">
            {currentQ.prompt}
          </p>

          {/* Media if present */}
          {currentQ.media && (
            <div className="my-4 rounded-xl overflow-hidden border border-[#303D52] max-h-80 flex items-center justify-center bg-[#090D18] shadow-inner">
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
          {subPhase === 'QUESTION' && !isViewer && (
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Nhập câu trả lời của bạn (Enter để gửi)..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#090D18] border border-[#303D52] rounded-xl text-[#F8FAFC] uppercase placeholder-[#64748B] focus:outline-none focus:border-[#00D9FF] focus:shadow-glow-cyan text-sm sm:text-base font-heading font-bold tracking-wider transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] font-heading font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border border-[#FFD43B] shadow-glow-yellow hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send size={14} />
                <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
              </button>
            </form>
          )}

          {subPhase === 'QUESTION' && isViewer && (
            <div className="mt-4 p-3.5 bg-[#00D9FF]/10 border border-[#00D9FF]/40 rounded-xl text-center text-xs font-bold text-[#00D9FF] flex items-center justify-center gap-2 shadow-glow-cyan">
              <Eye size={16} />
              <span>Bạn đang theo dõi với vai trò Khán giả. Đang chờ các thí sinh nộp đáp án...</span>
            </div>
          )}

          {submitted && subPhase === 'QUESTION' && (
            <div className="text-xs text-[#20D6A0] mt-3 font-bold flex items-center gap-2 bg-[#20D6A0]/10 border border-[#20D6A0]/30 px-3.5 py-2 rounded-xl shadow-glow-success">
              <CheckCircle2 size={16} className="text-[#20D6A0]" />
              <span>
                Đã ghi nhận: <strong className="text-white font-heading font-bold">"{inputAnswer.toUpperCase()}"</strong>. Bạn có thể sửa đổi đến khi hết giờ.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVEAL SCREEN: Hiện đáp án của 4 người theo thời gian kèm dấu tick đúng/sai */}
      {/* ========================================================================= */}
      {subPhase === 'REVEAL' && lastReveal && (
        <div className="w-full bg-[#111827] border border-[#303D52] rounded-3xl p-5 sm:p-7 shadow-2xl">
          {/* Header Đáp án chính xác */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-[#303D52]">
            <div>
              <span className="text-xs uppercase font-heading font-bold text-[#94A3B8] tracking-wider block">
                Đáp án chính xác:
              </span>
              <span className="text-xl sm:text-2xl font-heading font-black text-[#090D18] bg-[#20D6A0] px-4 py-1 rounded-xl shadow-glow-success tracking-wider mt-1 inline-block">
                {lastReveal.correctAnswer}
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-[#1C2638] border border-[#303D52] text-xs font-medium text-[#94A3B8] flex items-center gap-1.5">
              <Clock size={13} className="text-[#00D9FF]" />
              <span>Sắp xếp theo thời gian nộp nhanh nhất</span>
            </div>
          </div>

          {/* Danh sách các thí sinh theo thời gian kèm dấu tick đúng/sai */}
          <div className="mt-5 space-y-3">
            <h4 className="text-xs font-heading font-bold text-[#94A3B8] uppercase tracking-widest flex items-center gap-2">
              <Award size={16} className="text-[#FFD43B]" />
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
                      ? 'bg-[#20D6A0]/10 border-[#20D6A0]/50 shadow-glow-success'
                      : hasSubmitted
                      ? 'bg-[#FF496C]/10 border-[#FF496C]/40'
                      : 'bg-[#1C2638]/50 border-[#303D52]/40 opacity-70'
                  }`}
                >
                  {/* Left: Thứ hạng + Dấu tick đúng/sai + Thông tin thí sinh & đáp án */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Thứ hạng (1, 2, 3, 4) */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center font-heading font-bold text-xs sm:text-sm shrink-0 ${
                        res.isCorrect
                          ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] shadow-glow-yellow'
                          : 'bg-[#1C2638] text-[#94A3B8] border-[#303D52]'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Dấu tick đúng / sai nổi bật */}
                    <div className="shrink-0">
                      {res.isCorrect ? (
                        <div
                          title="Đúng"
                          className="w-8 h-8 rounded-full bg-[#20D6A0] text-[#090D18] flex items-center justify-center shadow-glow-success"
                        >
                          <CheckCircle2 size={20} className="stroke-[2.5]" />
                        </div>
                      ) : (
                        <div
                          title="Sai"
                          className="w-8 h-8 rounded-full bg-[#FF496C] text-[#090D18] flex items-center justify-center shadow-glow-danger"
                        >
                          <XCircle size={20} className="stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    {/* Tên & Đáp án thí sinh */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F8FAFC] text-sm sm:text-base truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-heading font-bold px-1.5 py-0.5 rounded bg-[#1C2638] border border-[#303D52] text-[#94A3B8] tabular-nums">
                          Ghế {p.seat}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs sm:text-sm">
                        {hasSubmitted ? (
                          <span
                            className={`font-heading font-bold tracking-wider uppercase ${
                              res.isCorrect ? 'text-[#20D6A0]' : 'text-[#64748B] line-through'
                            }`}
                          >
                            "{res.answer}"
                          </span>
                        ) : (
                          <span className="text-[#64748B] italic text-xs font-medium">
                            (Chưa nộp câu trả lời)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Thời gian nộp (giây) + Điểm số đạt được */}
                  <div className="flex items-center gap-2.5 sm:gap-4 shrink-0 font-digital">
                    {/* Thời gian */}
                    {hasSubmitted && res.timeSec != null ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#090D18] border border-[#303D52] text-xs sm:text-sm text-[#00D9FF] font-bold shadow-glow-cyan tabular-nums">
                        <Clock size={13} className="text-[#00D9FF]" />
                        <span>{Number(res.timeSec).toFixed(2)}s</span>
                      </div>
                    ) : (
                      <span className="text-[#64748B] text-xs italic px-2">--</span>
                    )}

                    {/* Điểm số */}
                    <div
                      className={`text-sm sm:text-base font-bold px-3 py-1 rounded-xl min-w-[54px] text-center tabular-nums ${
                        res.delta > 0
                          ? 'bg-[#FFD43B] text-[#090D18] shadow-glow-yellow'
                          : 'bg-[#1C2638] text-[#64748B] border border-[#303D52]'
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
