import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Zap, Send, Clock, CheckCircle2, XCircle, Award, Eye } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

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
        inputRef.current?.focus({ preventScroll: true });
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
    <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center justify-center h-full max-h-full py-1.5 px-3 overflow-hidden">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2.5 px-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm lg:text-base font-heading font-black uppercase tracking-wider bg-[#F7C873]/15 text-[#F7C873] px-3.5 py-1.5 rounded-xl border border-[#F7C873]/40 shadow-glow-yellow flex items-center gap-2">
            <Zap size={16} className="fill-[#F7C873] text-[#F7C873]" />
            Vòng 3: Tăng Tốc (Câu {questionIndex + 1}/4)
          </span>
        </div>
        <span className="text-xs sm:text-sm text-[#A6ACDB] font-bold bg-[#11163A] border border-[#262E66] px-3.5 py-1.5 rounded-xl">
          Nộp nhanh nhất nhận điểm cao nhất
        </span>
      </div>

      {/* Timer */}
      <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={30} className="mb-2 sm:mb-3" />

      {/* Question & Media Card */}
      {currentQ && (
        <div className="w-full bg-[#11163A] border border-[#262E66] rounded-3xl hud p-4 sm:p-5 lg:p-6 shadow-xl mb-2.5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider bg-[#F7C873]/15 text-[#F7C873] px-3 py-1 rounded-lg border border-[#F7C873]/40 shadow-glow-yellow">
              Câu hỏi số {questionIndex + 1}
            </span>
            <QuestionSpeakerButton question={currentQ} autoRead={subPhase === 'QUESTION'} />
          </div>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#EEF0FF] mb-3 leading-relaxed">
            {currentQ.prompt}
          </p>

          {/* Media if present */}
          {currentQ.media && (
            <div className="my-2.5 rounded-xl overflow-hidden border border-[#262E66] max-h-36 sm:max-h-44 flex items-center justify-center bg-[#05060F] shadow-inner">
              {currentQ.media.endsWith('.mp4') ? (
                <video src={currentQ.media} autoPlay controls className="max-h-36 sm:max-h-44 w-auto" />
              ) : (
                <img
                  src={currentQ.media}
                  alt="Câu hỏi tăng tốc"
                  className="max-h-36 sm:max-h-44 w-auto object-contain"
                />
              )}
            </div>
          )}

          {/* Answer input form (during 30s) */}
          {subPhase === 'QUESTION' && !isViewer && (
            <form onSubmit={handleSubmit} className="mt-2.5 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Nhập câu trả lời của bạn (Enter để gửi)..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#05060F] border border-[#262E66] rounded-xl text-[#EEF0FF] uppercase placeholder-[#6D75AD] focus:outline-none focus:border-[#F7C873]/70 focus:shadow-glow-yellow text-xs sm:text-sm md:text-base font-heading font-bold tracking-wider transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2 sm:px-6 sm:py-2.5 bg-[#F7C873] hover:bg-[#FBE0A8] text-[#05060F] font-heading font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 transition-all border border-[#F7C873] shadow-glow-yellow hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send size={15} />
                <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
              </button>
            </form>
          )}

          {subPhase === 'QUESTION' && isViewer && (
            <div className="mt-2.5 p-2.5 bg-[#B9C0EA]/10 border border-[#B9C0EA]/40 rounded-xl text-center text-xs sm:text-sm font-bold text-[#B9C0EA] flex items-center justify-center gap-1.5 shadow-glow-cyan">
              <Eye size={15} />
              <span>Bạn đang theo dõi với vai trò Khán giả. Đang chờ các thí sinh nộp đáp án...</span>
            </div>
          )}

          {submitted && subPhase === 'QUESTION' && (
            <div className="text-xs text-[#43E6B5] mt-2 font-bold flex items-center gap-1.5 bg-[#43E6B5]/10 border border-[#43E6B5]/30 px-3 py-1.5 rounded-xl shadow-glow-success">
              <CheckCircle2 size={15} className="text-[#43E6B5]" />
              <span>
                Đã ghi nhận: <strong className="text-white font-heading font-black">"{inputAnswer.toUpperCase()}"</strong>
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVEAL SCREEN: Hiện đáp án của 4 người theo thời gian kèm dấu tick đúng/sai */}
      {/* ========================================================================= */}
      {subPhase === 'REVEAL' && lastReveal && (
        <div className="w-full bg-[#0A0D22] border border-[#262E66] rounded-2xl p-3.5 sm:p-4 shadow-xl">
          {/* Header Đáp án chính xác */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2.5 border-b border-[#262E66]">
            <div>
              <span className="text-xs uppercase font-heading font-bold text-[#A6ACDB] tracking-wider block">
                Đáp án chính xác:
              </span>
              <span className="text-base sm:text-lg md:text-xl font-heading font-black text-[#05060F] bg-[#43E6B5] px-3.5 py-1 rounded-xl shadow-glow-success tracking-wider mt-1 inline-block">
                {lastReveal.correctAnswer}
              </span>
            </div>
            <div className="px-3 py-1 rounded-full bg-[#11163A] border border-[#262E66] text-xs font-medium text-[#A6ACDB] flex items-center gap-1.5">
              <Clock size={13} className="text-[#B9C0EA]" />
              <span>Sắp xếp theo thời gian nộp nhanh nhất</span>
            </div>
          </div>

          {/* Danh sách các thí sinh theo thời gian kèm dấu tick đúng/sai */}
          <div className="mt-2.5 space-y-2">
            <h4 className="text-xs font-heading font-bold text-[#A6ACDB] uppercase tracking-widest flex items-center gap-1.5">
              <Award size={14} className="text-[#F7C873]" />
              <span>BẢNG KẾT QUẢ TĂNG TỐC</span>
            </h4>

            {sortedResults.map((res, index) => {
              const p = room.players.find((player) => player.id === res.playerId);
              if (!p) return null;

              const hasSubmitted = Boolean(res.answer && res.timeSec && res.timeSec > 0);

              return (
                <div
                  key={res.playerId}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                    res.isCorrect
                      ? 'bg-[#43E6B5]/10 border-[#43E6B5]/50 shadow-glow-success'
                      : hasSubmitted
                      ? 'bg-[#FF5D8F]/10 border-[#FF5D8F]/40'
                      : 'bg-[#11163A]/50 border-[#262E66]/40 opacity-70'
                  }`}
                >
                  {/* Left: Thứ hạng + Dấu tick đúng/sai + Thông tin thí sinh & đáp án */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    {/* Thứ hạng (1, 2, 3, 4) */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center font-heading font-black text-xs sm:text-sm shrink-0 ${
                        res.isCorrect
                          ? 'bg-[#F7C873] text-[#05060F] border-[#F7C873] shadow-glow-yellow'
                          : 'bg-[#11163A] text-[#A6ACDB] border-[#262E66]'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Dấu tick đúng / sai nổi bật */}
                    <div className="shrink-0">
                      {res.isCorrect ? (
                        <div
                          title="Đúng"
                          className="w-7 h-7 rounded-full bg-[#43E6B5] text-[#05060F] flex items-center justify-center shadow-glow-success"
                        >
                          <CheckCircle2 size={18} className="stroke-[2.5]" />
                        </div>
                      ) : (
                        <div
                          title="Sai"
                          className="w-7 h-7 rounded-full bg-[#FF5D8F] text-[#05060F] flex items-center justify-center shadow-glow-danger"
                        >
                          <XCircle size={18} className="stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    {/* Tên & Đáp án thí sinh */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <PlayerAvatar player={p} size={22} />
                        <span className="font-bold text-[#EEF0FF] text-xs sm:text-sm md:text-base truncate max-w-[90px] sm:max-w-[140px]">
                          {p.name}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm mt-0.5">
                        {hasSubmitted ? (
                          <span
                            className={`font-heading font-bold tracking-wider uppercase ${
                              res.isCorrect ? 'text-[#43E6B5]' : 'text-[#6D75AD] line-through'
                            }`}
                          >
                            "{res.answer}"
                          </span>
                        ) : (
                          <span className="text-[#6D75AD] italic text-xs">
                            (Chưa nộp)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Thời gian nộp (giây) + Điểm số đạt được */}
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0 font-digital">
                    {/* Thời gian */}
                    {hasSubmitted && res.timeSec != null ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#05060F] border border-[#262E66] text-xs sm:text-sm text-[#B9C0EA] font-bold shadow-glow-cyan tabular-nums">
                        <Clock size={13} className="text-[#B9C0EA]" />
                        <span>{Number(res.timeSec).toFixed(2)}s</span>
                      </div>
                    ) : (
                      <span className="text-[#6D75AD] text-xs italic px-1">--</span>
                    )}

                    {/* Điểm số */}
                    <div
                      className={`text-xs sm:text-sm md:text-base font-bold px-3 py-1 rounded-xl min-w-[56px] text-center tabular-nums ${
                        res.delta > 0
                          ? 'bg-[#F7C873] text-[#05060F] shadow-glow-yellow'
                          : 'bg-[#11163A] text-[#6D75AD] border border-[#262E66]'
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
