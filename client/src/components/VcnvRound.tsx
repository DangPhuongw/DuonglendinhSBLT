import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Bell, Send, CheckCircle2, Sparkles, AlertCircle, Key, Eye } from 'lucide-react';

export const VcnvRound: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const pickVcnvRow = useGameStore((s) => s.pickVcnvRow);
  const buzz = useGameStore((s) => s.buzz);
  const buzzWinner = useGameStore((s) => s.buzzWinner);
  const buzzRejectedReason = useGameStore((s) => s.buzzRejectedReason);
  const lastReveal = useGameStore((s) => s.lastReveal);

  const [inputAnswer, setInputAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  const subPhase = room?.state?.subPhase;
  const currentQ = room?.state?.currentQuestion;
  const rowsRevealed: boolean[] = room?.state?.rowsRevealed || [false, false, false, false];
  const rowLetterCounts: number[] = room?.state?.rowLetterCounts || [3, 3, 6, 10];
  const rowAnswersRevealed = room?.state?.rowAnswersRevealed;
  const activeRowIdx = room?.state?.activeRowIndex;

  // Từ khóa chính (Chướng ngại vật)
  const obstacleLetterCount = room?.state?.obstacleLetterCount || 7;
  const obstacleAnswerRevealed = room?.state?.obstacleAnswerRevealed;
  const obstacleSolved = room?.state?.obstacleSolved;

  const isViewer = myPlayer?.role === 'viewer';
  const isEliminated = Boolean(myPlayer?.eliminatedVcnv);
  const isBuzzerLocked = Boolean(room?.state?.buzzerLockedBy);
  const vcnvQuestionsAppearedCount = room?.state?.vcnvQuestionsAppearedCount || 0;

  // Thang điểm trả lời đúng Chướng ngại vật:
  const currentCnvPoints =
    vcnvQuestionsAppearedCount <= 1
      ? 60
      : vcnvQuestionsAppearedCount === 2
      ? 50
      : vcnvQuestionsAppearedCount === 3
      ? 40
      : vcnvQuestionsAppearedCount === 4
      ? 30
      : 20;

  // Bấm chuông Chướng ngại vật: Chỉ mở sau khi câu hỏi hàng ngang 1 xuất hiện (chỉ thí sinh)
  const canBuzz = !isViewer && !isEliminated && !isBuzzerLocked && vcnvQuestionsAppearedCount >= 1;

  const activeChooser = room?.players.find((p) => p.id === room?.state?.activePlayerId);
  const isMyTurnToPick = Boolean(!isViewer && subPhase === 'PICK_ROW' && myPlayer && room?.state?.activePlayerId === myPlayer.id);

  const isMyTurnToAnswerCnv = Boolean(
    !isViewer &&
    (subPhase === 'CNV_ANSWERING' || subPhase === 'FINAL_GUESS_ANSWERING') &&
    myPlayer &&
    room?.state?.activePlayerId === myPlayer.id
  );

  const activeAnsweringPlayer = room?.players.find((p) => p.id === room?.state?.activePlayerId);

  // Clear input when question or subPhase changes
  useEffect(() => {
    setInputAnswer('');
    setSubmitted(false);
  }, [currentQ?.id, subPhase]);

  // Auto-focus input when answering phase begins
  useEffect(() => {
    if (isMyTurnToAnswerCnv) {
      const timer = setTimeout(() => {
        modalInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else if (subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [subPhase, isMyTurnToAnswerCnv, currentQ?.id]);

  // Stop voice reading on reveal or answering phase
  useEffect(() => {
    if (
      subPhase === 'ROW_REVEAL' ||
      subPhase === 'CENTER_REVEAL' ||
      subPhase === 'CNV_ANSWERING' ||
      subPhase === 'FINAL_GUESS_ANSWERING'
    ) {
      voiceReader.stop();
    }
  }, [subPhase]);

  // Stop speech when round unmounts
  useEffect(() => {
    return () => {
      voiceReader.stop();
    };
  }, []);

  // Keyboard shortcuts: Space for buzzer (ANY TIME), 1-4 for picking rows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      // Buzzer: Space key bất kì lúc nào
      if (e.code === 'Space' && canBuzz && !isInput) {
        e.preventDefault();
        buzz();
        return;
      }

      // Picking rows: Keys 1 to 4 when it's my turn to pick
      if (isMyTurnToPick && !isInput && ['1', '2', '3', '4'].includes(e.key)) {
        const rowIdx = parseInt(e.key, 10) - 1;
        if (rowIdx >= 0 && rowIdx <= 3 && !rowsRevealed[rowIdx]) {
          e.preventDefault();
          pickVcnvRow(rowIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subPhase, canBuzz, isMyTurnToPick, rowsRevealed, buzz, pickVcnvRow]);

  if (!room || !myPlayer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || isEliminated) return;
    if (currentQ) {
      submitAnswer(currentQ.id, inputAnswer.trim());
      setSubmitted(true);
    }
  };

  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center justify-between h-full max-h-full py-1 px-3 overflow-hidden">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & TIMER                                    */}
      {/* ======================================================== */}
      <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl p-2 sm:px-4 sm:py-2 mb-2 shadow-xl flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm lg:text-base font-heading font-black uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border border-[#FFD43B]/40 shadow-glow-yellow">
            VÒNG 2: VƯỢT CHƯỚNG NGẠI VẬT
          </span>
          <span className="text-xs text-[#94A3B8] font-digital font-bold tabular-nums bg-[#1C2638] px-2.5 py-1 rounded-lg border border-[#303D52] hidden sm:inline-block">
            {rowsRevealed.filter(Boolean).length}/4 hàng đã mở
          </span>
        </div>

        {/* Right: Countdown Timer */}
        <div className="w-28 sm:w-36">
          <CountdownTimer
            deadline={room.state.deadline}
            totalDurationSeconds={
              subPhase === 'PICK_ROW'
                ? 10
                : subPhase === 'ROW_QUESTION'
                ? 30
                : subPhase === 'ROW_REVEAL' || subPhase === 'CENTER_REVEAL'
                ? 6
                : subPhase === 'CNV_ANSWERING' || subPhase === 'FINAL_GUESS_ANSWERING'
                ? 15
                : subPhase === 'CENTER_QUESTION'
                ? 30
                : 30
            }
            className="mb-0"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HERO SECTION: TỪ KHÓA CHÍNH (CĂN CENTER & NỔI BẬT)    */}
      {/* ======================================================== */}
      <div className="w-full bg-gradient-to-b from-[#1C2638] via-[#151D2C] to-[#111827] border-2 border-[#FFD43B]/60 rounded-2xl p-3 sm:p-4 mb-2.5 shadow-[0_4px_25px_rgba(255,212,59,0.18)] flex flex-col items-center justify-center text-center shrink-0">
        {/* Title */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm lg:text-base font-heading font-extrabold text-[#FFD43B] uppercase tracking-wider mb-2">
          <Key size={18} className="text-[#FFD43B]" />
          <span>TỪ KHÓA CHƯỚNG NGẠI VẬT ({obstacleLetterCount} CHỮ CÁI)</span>
        </div>

        {/* Big Prominent Letter Boxes */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
          {Array.from({ length: obstacleLetterCount }).map((_, i) => {
            const char = obstacleAnswerRevealed ? obstacleAnswerRevealed[i] : null;
            return (
              <div
                key={i}
                className={`w-9 h-11 sm:w-11 sm:h-13 rounded-xl flex items-center justify-center font-digital font-black text-lg sm:text-2xl border-2 transition-all ${
                  char
                    ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] shadow-glow-yellow scale-105'
                    : 'bg-[#0B101B] text-[#00D9FF] border-[#303D52] shadow-inner'
                }`}
              >
                {char || '?'}
              </div>
            );
          })}
        </div>

        {/* Text: +xx đ nếu trả lời đúng từ khóa vào lúc này */}
        <div
          className="flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-xl bg-[#20D6A0]/15 border border-[#20D6A0]/40 text-[#20D6A0] shadow-glow-success select-none text-xs sm:text-sm font-heading font-bold"
          title="Đoán từ khóa chính dựa trên 4 hàng gợi ý - Sau mỗi câu hỏi gợi ý được lật mở, số điểm nhận được khi đoán từ khóa chính sẽ giảm"
        >
          <Sparkles size={15} className="text-[#20D6A0] shrink-0" />
          <span>+{currentCnvPoints}đ nếu trả lời đúng từ khóa vào lúc này</span>
        </div>

        {/* Integrated Buzzer Button directly under keyword */}
        {subPhase !== 'CNV_ANSWERING' && subPhase !== 'FINAL_GUESS_ANSWERING' && (
          <div className="mt-2.5 w-full flex items-center justify-center">
            <button
              onClick={buzz}
              disabled={!canBuzz}
              className={`px-5 sm:px-7 py-2 sm:py-2.5 rounded-full font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                canBuzz
                  ? 'bg-gradient-to-r from-[#FF496C] via-[#E11D48] to-[#BE123C] text-white border-2 border-[#FF8DA1] shadow-[0_4px_0_#881337,0_0_25px_rgba(255,73,108,0.7)] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_1px_0_#881337] animate-pulse'
                  : isBuzzerLocked
                  ? 'bg-[#1C2638] text-[#FF496C] border border-[#FF496C]/40 opacity-70 cursor-not-allowed'
                  : 'bg-[#0E1524] text-[#64748B] border border-[#303D52] opacity-60 cursor-not-allowed'
              }`}
              title={canBuzz ? 'Bấm chuông giành quyền trả lời Chướng ngại vật (Phím Space)' : 'Chuông hiện chưa mở'}
            >
              <Bell
                size={17}
                className={canBuzz ? 'animate-bounce text-[#FFD43B]' : 'text-[#64748B]'}
              />
              <span>
                {canBuzz
                  ? 'RUNG CHUÔNG GIẢI TỪ KHÓA (PHÍM SPACE)'
                  : isBuzzerLocked
                  ? `🔒 ${room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || 'Thí sinh'} ĐÃ RUNG CHUÔNG`
                  : isEliminated
                  ? 'BẠN ĐÃ DỪNG CUỘC CHƠI Ở VÒNG VCNV'
                  : isViewer
                  ? 'BẠN LÀ KHÁN GIẢ'
                  : vcnvQuestionsAppearedCount < 1
                  ? 'CHUÔNG SẼ MỞ SAU HÀNG NGANG 1'
                  : 'CHUÔNG HIỆN CHƯA MỞ'}
              </span>
            </button>
          </div>
        )}
      </div>

      {buzzRejectedReason && (
        <div className="w-full py-1.5 px-3.5 mb-2 bg-[#FF496C]/15 border border-[#FF496C]/50 rounded-xl text-center text-xs sm:text-sm font-bold text-[#FF496C] shadow-glow-danger shrink-0">
          {buzzRejectedReason}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. GAME BOARD: 4 HÀNG NGANG (GỢI Ý TÌM TỪ KHÓA)          */}
      {/* ======================================================== */}
      <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl p-3 sm:p-3.5 shadow-xl mb-2.5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider text-[#F8FAFC]">
            4 Hàng Ngang (Gợi Ý Tìm Từ Khóa)
          </span>
          <span className="text-xs text-[#94A3B8] font-digital font-bold tabular-nums bg-[#1C2638] px-2.5 py-0.5 rounded-lg border border-[#303D52]">
            {rowsRevealed.filter(Boolean).length}/4 hàng đã mở
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((idx) => {
            const isRevealed = rowsRevealed[idx];
            const isCurrent =
              activeRowIdx === idx &&
              (subPhase === 'ROW_QUESTION' || subPhase === 'ROW_REVEAL');
            const letterCount = rowLetterCounts[idx] || 6;
            const revealedLetters = rowAnswersRevealed ? rowAnswersRevealed[idx] : null;
            const isClickable = subPhase === 'PICK_ROW' && isMyTurnToPick && !isRevealed;

            return (
              <div
                key={idx}
                onClick={() => isClickable && pickVcnvRow(idx)}
                className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                  isClickable
                    ? 'bg-[#1C2638] border-2 border-[#FFD43B] shadow-glow-yellow hover:scale-[1.01] cursor-pointer active:scale-95 animate-pulse'
                    : isCurrent
                    ? 'bg-[#1C2638] border border-[#00D9FF] shadow-glow-cyan font-bold'
                    : isRevealed
                    ? 'bg-[#162132] border border-[#303D52]'
                    : 'bg-[#0E1524] border-[#303D52]/40 opacity-75'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-heading font-black text-xs sm:text-sm shrink-0 ${
                      isClickable || isCurrent
                        ? 'bg-[#FFD43B] text-[#090D18]'
                        : isRevealed && revealedLetters
                        ? 'bg-[#20D6A0] text-[#090D18]'
                        : 'bg-[#1C2638] text-[#94A3B8] border border-[#303D52]'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Letter boxes */}
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: letterCount }).map((_, charIdx) => {
                      const char = isRevealed && revealedLetters ? revealedLetters[charIdx] : null;
                      return (
                        <div
                          key={charIdx}
                          className={`w-7 h-8 sm:w-8 sm:h-9 rounded-lg flex items-center justify-center font-digital font-bold text-xs sm:text-sm border transition-all ${
                            char
                              ? 'bg-[#20D6A0] text-[#090D18] border-[#20D6A0] shadow-glow-success font-black'
                              : isCurrent
                              ? 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF] shadow-glow-cyan'
                              : 'bg-[#1C2638] text-[#64748B] border-[#303D52]'
                          }`}
                        >
                          {char || (isCurrent ? '?' : '•')}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Row Status Badge */}
                <div className="shrink-0">
                  {isClickable ? (
                    <button
                      type="button"
                      className="px-3 py-1 bg-[#FFD43B] text-[#090D18] font-heading font-black text-xs uppercase tracking-wider rounded-lg shadow-glow-yellow hover:scale-105 transition-transform cursor-pointer"
                    >
                      Chọn
                    </button>
                  ) : isRevealed ? (
                    revealedLetters ? (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-heading font-extrabold bg-[#20D6A0]/20 text-[#20D6A0] border border-[#20D6A0]/40 tracking-wider">
                        ĐÃ MỞ
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-heading font-extrabold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 tracking-wider">
                        KHÓA
                      </span>
                    )
                  ) : isCurrent ? (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-heading font-extrabold bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40 tracking-wider animate-pulse">
                      ĐANG GIẢI
                    </span>
                  ) : (
                    <span className="text-[#64748B] text-xs font-heading font-bold tracking-widest px-2">
                      CHƯA MỞ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DYNAMIC INTERACTION CARD (Pick Row / Question / Reveal)*/}
      {/* ======================================================== */}

      {/* Turn Banner (Khi ở pha PICK_ROW) */}
      {subPhase === 'PICK_ROW' && (
        <div
          className={`w-full p-2.5 rounded-xl text-center border transition-all shrink-0 ${
            isMyTurnToPick
              ? 'bg-[#1C2638] border-2 border-[#FFD43B] shadow-glow-yellow-lg animate-pulse'
              : 'bg-[#111827] border-[#303D52]'
          }`}
        >
          {isMyTurnToPick ? (
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles size={16} className="text-[#FFD43B]" />
              <span className="text-xs sm:text-sm font-heading font-black text-[#FFD43B] uppercase tracking-wider">
                Đến lượt bạn chọn hàng ngang! Bấm vào hàng trên hoặc phím 1 - 4
              </span>
            </div>
          ) : (
            <span className="text-xs font-medium text-[#94A3B8]">
              Đang chờ <strong className="font-heading font-bold text-[#FFD43B] bg-[#1C2638] px-2 py-0.5 rounded border border-[#303D52]">{activeChooser?.name || 'Thí sinh'}</strong> chọn hàng ngang...
            </span>
          )}
        </div>
      )}

      {/* Question Card (Khi có câu hỏi hàng ngang hoặc trung tâm) */}
      {currentQ && subPhase !== 'CNV_ANSWERING' && subPhase !== 'FINAL_GUESS_ANSWERING' && (
        <div className="w-full bg-[#1C2638] border border-[#303D52] rounded-xl p-3 sm:p-4 shadow-xl shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] sm:text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-2.5 py-0.5 rounded-md border border-[#FFD43B]/40 shadow-glow-yellow">
              {subPhase === 'CENTER_QUESTION'
                ? 'CÂU HỎI TRUNG TÂM'
                : `HÀNG NGANG ${(activeRowIdx ?? 0) + 1} (${rowLetterCounts[activeRowIdx ?? 0] || 6} CHỮ CÁI)`}
            </span>
            <QuestionSpeakerButton
              question={currentQ}
              autoRead={subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION'}
            />
          </div>

          <p className="text-sm sm:text-base md:text-lg font-bold text-[#F8FAFC] mb-2.5 leading-snug">
            {currentQ.prompt}
          </p>

          {/* Form nhập đáp án */}
          {(subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') && !isEliminated && !isViewer && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Nhập câu trả lời (Enter để gửi)..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#090D18] border border-[#303D52] rounded-xl text-[#F8FAFC] uppercase placeholder-[#64748B] focus:outline-none focus:border-[#00D9FF] focus:shadow-glow-cyan text-xs sm:text-sm md:text-base font-heading font-bold tracking-wider transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] font-heading font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 transition-all border border-[#FFD43B] shadow-glow-yellow hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send size={15} />
                <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
              </button>
            </form>
          )}

          {isViewer && (subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') && (
            <div className="p-2 bg-[#00D9FF]/10 border border-[#00D9FF]/40 rounded-lg text-center text-xs font-bold text-[#00D9FF] flex items-center justify-center gap-1.5 shadow-glow-cyan">
              <Eye size={14} />
              <span>Bạn đang theo dõi với vai trò Khán giả. Đang chờ các thí sinh nhập đáp án...</span>
            </div>
          )}

          {submitted && (subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') && (
            <div className="text-[11px] text-[#20D6A0] mt-1.5 font-bold flex items-center gap-1.5 bg-[#20D6A0]/10 border border-[#20D6A0]/30 px-2.5 py-1 rounded-lg shadow-glow-success w-fit">
              <CheckCircle2 size={13} />
              <span>
                Đã ghi nhận: <strong className="font-heading font-black text-white">"{inputAnswer.toUpperCase()}"</strong>
              </span>
            </div>
          )}

          {isEliminated && (
            <div className="p-2 bg-[#FF496C]/15 border border-[#FF496C]/40 rounded-lg text-center text-xs font-bold text-[#FF496C] flex items-center justify-center gap-1.5 shadow-glow-danger">
              <AlertCircle size={14} />
              <span>Bạn đã bị loại khỏi phần thi VCNV (vẫn theo dõi và cổ vũ các thí sinh khác).</span>
            </div>
          )}

          {/* Reveal Result */}
          {(subPhase === 'ROW_REVEAL' || subPhase === 'CENTER_REVEAL') && lastReveal && (
            <div className="mt-2 pt-2 border-t border-[#303D52] space-y-2">
              {lastReveal.correctAnswer ? (
                <div className="flex items-center justify-between p-2 bg-[#111827] rounded-lg border border-[#303D52]">
                  <span className="text-[11px] text-[#94A3B8] font-heading font-bold uppercase tracking-wider">
                    Đáp án chính xác:
                  </span>
                  <span className="text-xs sm:text-sm font-heading font-black text-[#090D18] bg-[#20D6A0] px-3 py-0.5 rounded-lg shadow-glow-success">
                    {lastReveal.correctAnswer}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-[#111827] rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/5">
                  <span className="text-[11px] text-[#EF4444] font-heading font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle size={13} />
                    Kết quả câu hỏi:
                  </span>
                  <span className="text-[11px] font-heading font-extrabold text-[#FCA5A5] bg-[#EF4444]/20 border border-[#EF4444]/30 px-2.5 py-0.5 rounded-lg">
                    Không ai trả lời đúng
                  </span>
                </div>
              )}

              {lastReveal.results && lastReveal.results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {lastReveal.results.map((res) => {
                    const p = room.players.find((pl) => pl.id === res.playerId);
                    if (!p) return null;
                    return (
                      <div
                        key={res.playerId}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#111827] border border-[#303D52] text-xs sm:text-sm"
                      >
                        <span className="font-bold text-[#F8FAFC] truncate max-w-[90px]">{p.name}:</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {res.answer && (
                            <span className="text-[#94A3B8] text-[11px] sm:text-xs font-mono truncate max-w-[80px]">
                              "{res.answer}"
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded font-digital font-bold border tabular-nums text-xs ${
                              res.isCorrect ? 'bg-[#20D6A0]/20 text-[#20D6A0] border-[#20D6A0]/40' : 'bg-[#FF496C]/20 text-[#FF496C] border-[#FF496C]/40'
                            }`}
                          >
                            {res.isCorrect ? '+10đ' : '0đ'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL NHẬP TỪ KHÓA CHÍNH KHI BẤM CHUÔNG              */}
      {/* ======================================================== */}
      {(subPhase === 'CNV_ANSWERING' || subPhase === 'FINAL_GUESS_ANSWERING') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="max-w-md w-full bg-[#111827] border-2 border-[#FFD43B] rounded-3xl p-6 shadow-glow-yellow-lg flex flex-col items-center text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-[#FFD43B] text-[#090D18] shadow-glow-yellow flex items-center justify-center mb-2.5 animate-bounce">
              <Bell size={26} />
            </div>

            <h3 className="text-xl font-heading font-black uppercase tracking-wider text-[#F8FAFC] mb-1">
              GIẢI MÃ TỪ KHÓA CHÍNH
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <span className="text-xs text-[#94A3B8]">Thí sinh:</span>
              <span className="px-2.5 py-1 bg-[#1C2638] border border-[#FFD43B]/60 rounded-lg text-xs font-heading font-bold text-[#FFD43B]">
                {activeAnsweringPlayer?.name || 'Thí sinh'}
              </span>
              <span className="px-2.5 py-1 bg-[#20D6A0]/20 border border-[#20D6A0]/40 rounded-lg text-xs font-digital font-bold text-[#20D6A0]">
                +{currentCnvPoints}đ
              </span>
            </div>

            {/* Countdown timer */}
            <div className="w-full mb-3.5">
              <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={15} className="w-full" />
            </div>

            {/* Obstacle N letter boxes */}
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              {Array.from({ length: obstacleLetterCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-10 sm:w-9 sm:h-11 rounded-xl bg-[#1C2638] border border-[#00D9FF]/50 flex items-center justify-center text-base sm:text-lg font-digital font-bold text-[#00D9FF] shadow-glow-cyan"
                >
                  ?
                </div>
              ))}
            </div>

            {isMyTurnToAnswerCnv && !isEliminated ? (
              <form onSubmit={handleSubmit} className="w-full space-y-3">
                <input
                  ref={modalInputRef}
                  type="text"
                  autoFocus
                  placeholder="Nhập từ khóa chính..."
                  value={inputAnswer}
                  onChange={(e) => setInputAnswer(e.target.value)}
                  className="w-full px-4 py-3 bg-[#090D18] border-2 border-[#00D9FF] rounded-xl text-[#00D9FF] uppercase text-center font-digital font-bold tracking-widest text-lg sm:text-xl placeholder-[#64748B] focus:outline-none shadow-glow-cyan"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] font-heading font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl border border-[#FFD43B] shadow-glow-yellow hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  {submitted ? 'CẬP NHẬT TỪ KHÓA (ENTER)' : 'XÁC NHẬN GỬI TỪ KHÓA (ENTER)'}
                </button>

                {submitted && (
                  <p className="text-xs text-[#20D6A0] font-bold bg-[#20D6A0]/10 border border-[#20D6A0]/40 p-2 rounded-xl">
                    ✓ Đã ghi nhận: "{inputAnswer.toUpperCase()}"
                  </p>
                )}

                <p className="text-xs text-[#FF496C] font-bold">
                  ⚠️ Trả lời sai sẽ bị loại khỏi vòng VCNV!
                </p>
              </form>
            ) : (
              <div className="w-full p-3.5 bg-[#1C2638] rounded-xl border border-[#303D52] text-xs">
                <p className="font-medium text-[#F8FAFC] text-sm">
                  <strong className="text-[#FFD43B] font-heading">{activeAnsweringPlayer?.name}</strong> đang nhập từ khóa chính...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
