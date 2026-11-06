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
      <div className="w-full flex items-center justify-between mb-4 px-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3 py-1 rounded-lg border-2 border-[#171717] shadow-neo-sm flex items-center gap-1.5">
            <Zap size={15} className="fill-[#171717] stroke-[#171717]" />
            Vòng 3: Tăng Tốc (Câu {questionIndex + 1}/4)
          </span>
        </div>
        <span className="text-xs text-gray-700 font-bold bg-white border-2 border-[#171717] px-2.5 py-1 rounded-lg shadow-neo-sm">
          Nộp nhanh nhất nhận điểm cao nhất
        </span>
      </div>

      {/* Timer */}
      <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={30} className="mb-6" />

      {/* Question & Media Card */}
      {currentQ && (
        <div className="w-full bg-white border-3 border-[#171717] rounded-2xl p-6 sm:p-8 shadow-neo-lg mb-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3 py-1 rounded-md border-2 border-[#171717] shadow-neo-sm">
              Câu hỏi số {questionIndex + 1}
            </span>
            <QuestionSpeakerButton question={currentQ} autoRead={subPhase === 'QUESTION'} />
          </div>

          <p className="text-base sm:text-xl font-black text-[#171717] mb-4 leading-relaxed">
            {currentQ.prompt}
          </p>

          {/* Media if present */}
          {currentQ.media && (
            <div className="my-4 rounded-xl overflow-hidden border-2 border-[#171717] max-h-80 flex items-center justify-center bg-gray-50 shadow-neo">
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
                className="flex-1 px-4 py-3 bg-white border-2 border-[#171717] rounded-xl text-[#171717] uppercase placeholder-gray-400 focus:outline-none focus:bg-[#FFFDF7] text-sm font-black tracking-wider shadow-neo-sm transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#FFE45C] hover:bg-[#ffe040] text-[#171717] font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all border-2 border-[#171717] shadow-neo active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <Send size={14} />
                <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
              </button>
            </form>
          )}

          {submitted && subPhase === 'QUESTION' && (
            <div className="text-xs text-[#171717] mt-3 font-bold flex items-center gap-2 bg-[#55D6C2]/30 border-2 border-[#171717] px-3.5 py-2 rounded-xl shadow-neo-sm">
              <CheckCircle2 size={16} className="text-[#171717]" />
              <span>
                Đã ghi nhận: <strong className="text-[#171717] font-black">"{inputAnswer.toUpperCase()}"</strong>. Bạn có thể sửa đổi đến khi hết giờ.
              </span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVEAL SCREEN: Hiện đáp án của 4 người theo thời gian kèm dấu tick đúng/sai */}
      {/* ========================================================================= */}
      {subPhase === 'REVEAL' && lastReveal && (
        <div className="w-full bg-white border-3 border-[#171717] rounded-3xl p-5 sm:p-7 shadow-neo-lg">
          {/* Header Đáp án chính xác */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b-2 border-[#171717]">
            <div>
              <span className="text-xs uppercase font-black text-gray-600 tracking-wider block">
                Đáp án chính xác:
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#171717] bg-[#55D6C2] px-3.5 py-1 rounded-xl border-2 border-[#171717] shadow-neo-sm tracking-wider mt-1 inline-block">
                {lastReveal.correctAnswer}
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-[#FFFDF7] border-2 border-[#171717] text-xs font-bold text-[#171717] flex items-center gap-1.5 shadow-neo-sm">
              <Clock size={13} className="text-[#171717]" />
              <span>Sắp xếp theo thời gian nộp nhanh nhất</span>
            </div>
          </div>

          {/* Danh sách các thí sinh theo thời gian kèm dấu tick đúng/sai */}
          <div className="mt-5 space-y-3">
            <h4 className="text-xs font-black text-[#171717] uppercase tracking-widest flex items-center gap-2">
              <Award size={16} />
              <span>BẢNG KẾT QUẢ TĂNG TỐC</span>
            </h4>

            {sortedResults.map((res, index) => {
              const p = room.players.find((player) => player.id === res.playerId);
              if (!p) return null;

              const hasSubmitted = Boolean(res.answer && res.timeSec && res.timeSec > 0);

              return (
                <div
                  key={res.playerId}
                  className={`p-3 sm:p-4 rounded-2xl border-2 border-[#171717] transition-all flex items-center justify-between gap-3 ${
                    res.isCorrect
                      ? 'bg-[#55D6C2]/20 shadow-neo'
                      : hasSubmitted
                      ? 'bg-[#FF9292]/20 shadow-neo-sm'
                      : 'bg-gray-50 border-gray-300 opacity-70'
                  }`}
                >
                  {/* Left: Thứ hạng + Dấu tick đúng/sai + Thông tin thí sinh & đáp án */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Thứ hạng (1, 2, 3, 4) */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border-2 border-[#171717] flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-neo-sm ${
                        res.isCorrect
                          ? 'bg-[#FFE45C] text-[#171717]'
                          : 'bg-white text-gray-700'
                      }`}
                    >
                      {index + 1}
                    </div>

                    {/* Dấu tick đúng / sai nổi bật */}
                    <div className="shrink-0">
                      {res.isCorrect ? (
                        <div
                          title="Đúng"
                          className="w-8 h-8 rounded-full bg-[#55D6C2] border-2 border-[#171717] flex items-center justify-center text-[#171717] shadow-neo-sm"
                        >
                          <CheckCircle2 size={20} className="stroke-[2.5]" />
                        </div>
                      ) : (
                        <div
                          title="Sai"
                          className="w-8 h-8 rounded-full bg-[#FF9292] border-2 border-[#171717] flex items-center justify-center text-[#171717] shadow-neo-sm"
                        >
                          <XCircle size={20} className="stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    {/* Tên & Đáp án thí sinh */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#171717] text-sm sm:text-base truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white border border-[#171717] text-gray-700 tabular-nums">
                          Ghế {p.seat}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs sm:text-sm">
                        {hasSubmitted ? (
                          <span
                            className={`font-black tracking-wider uppercase ${
                              res.isCorrect ? 'text-[#171717]' : 'text-gray-500 line-through'
                            }`}
                          >
                            "{res.answer}"
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs font-medium">
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
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border-2 border-[#171717] text-xs sm:text-sm text-[#171717] font-black shadow-neo-sm tabular-nums">
                        <Clock size={13} className="text-[#171717]" />
                        <span>{Number(res.timeSec).toFixed(2)}s</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic px-2">--</span>
                    )}

                    {/* Điểm số */}
                    <div
                      className={`text-sm sm:text-base font-black px-3 py-1 rounded-xl border-2 border-[#171717] min-w-[54px] text-center tabular-nums ${
                        res.delta > 0
                          ? 'bg-[#FFE45C] text-[#171717] shadow-neo-sm'
                          : 'bg-gray-100 text-gray-400'
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
