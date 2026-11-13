import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Bell, Send, CheckCircle2, Sparkles, AlertCircle, Key, Eye } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

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
  const rowLetterCounts: number[] = room?.state?.rowLetterCounts || [1, 3, 6, 10];
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
        modalInputRef.current?.focus({ preventScroll: true });
      }, 100);
      return () => clearTimeout(timer);
    } else if (subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') {
      const timer = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
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

  // Khung dùng flex-1 + min-h-0: luôn chiếm đủ chiều cao và neo ở trên, không bị căn giữa theo chiều dọc.
  // Nếu không, mỗi lần nội dung phía dưới đổi chiều cao (đổi pha) cả màn hình bị đẩy lên xuống.
  return (
    <div className="w-full max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center justify-start flex-1 min-h-0 py-1.5 px-3 overflow-hidden">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & TIMER                                    */}
      {/* ======================================================== */}
      <div className="w-full bg-[#0A0D22] border border-[#262E66] rounded-2xl p-2 sm:px-4 sm:py-2 mb-2 shadow-xl flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm lg:text-base font-heading font-black uppercase tracking-wider bg-[#F7C873]/15 text-[#F7C873] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl border border-[#F7C873]/40 shadow-glow-yellow">
            VÒNG 2: VƯỢT CHƯỚNG NGẠI VẬT
          </span>
          <span className="text-xs text-[#A6ACDB] font-digital font-bold tabular-nums bg-[#11163A] px-2.5 py-1 rounded-lg border border-[#262E66] hidden sm:inline-block">
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
            reserveSpace
          />
        </div>
      </div>

      {buzzRejectedReason && (
        <div className="w-full py-1.5 px-3.5 mb-2 bg-[#FF5D8F]/15 border border-[#FF5D8F]/50 rounded-xl text-center text-xs sm:text-sm font-bold text-[#FF5D8F] shadow-glow-danger shrink-0">
          {buzzRejectedReason}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. GAME BOARD: 4 HÀNG NGANG & TỪ KHÓA CHÍNH (SIDE-BY-SIDE) */}
      {/* ======================================================== */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 mb-2 shrink-0">
        {/* LEFT: 4 HÀNG NGANG (GỢI Ý) */}
        <div className="md:col-span-7 bg-[#0A0D22] border border-[#262E66] rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-xs sm:text-sm font-heading font-black uppercase tracking-wider text-[#EEF0FF]">
              4 Hàng Ngang (Gợi Ý)
            </span>
            <span className="text-xs text-[#A6ACDB] font-digital font-bold tabular-nums bg-[#11163A] px-2 py-0.5 rounded-lg border border-[#262E66]">
              {rowsRevealed.filter(Boolean).length}/4 hàng đã mở
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
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
                  className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isClickable
                      ? 'bg-[#11163A] border-2 border-[#F7C873] shadow-glow-yellow hover:scale-[1.01] cursor-pointer active:scale-95 animate-pulse'
                      : isCurrent
                      ? 'bg-[#11163A] border-2 border-[#B9C0EA] shadow-glow-cyan font-bold'
                      : isRevealed
                      ? 'bg-[#080B1E] border border-[#262E66]'
                      : 'bg-[#080B1E] border-[#262E66]/40 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-heading font-black text-xs shrink-0 ${
                        isClickable || isCurrent
                          ? 'bg-[#F7C873] text-[#05060F]'
                          : isRevealed && revealedLetters
                          ? 'bg-[#43E6B5] text-[#05060F]'
                          : 'bg-[#11163A] text-[#A6ACDB] border border-[#262E66]'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Letter boxes */}
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: letterCount }).map((_, charIdx) => {
                        const char = isRevealed && revealedLetters ? revealedLetters[charIdx] : null;
                        return (
                          <div
                            key={charIdx}
                            className={`w-6 h-7 sm:w-7 sm:h-8 rounded-md flex items-center justify-center font-digital font-bold text-xs border transition-all ${
                              char
                                ? 'bg-[#43E6B5] text-[#05060F] border-[#43E6B5] shadow-glow-success font-black'
                                : isCurrent
                                ? 'bg-[#B9C0EA]/20 text-[#B9C0EA] border-[#B9C0EA] shadow-glow-cyan'
                                : 'bg-[#11163A] text-[#6D75AD] border-[#262E66]'
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
                        className="px-2.5 py-0.5 bg-[#F7C873] text-[#05060F] font-heading font-black text-xs uppercase tracking-wider rounded-lg shadow-glow-yellow hover:scale-105 transition-transform cursor-pointer"
                      >
                        Chọn
                      </button>
                    ) : isRevealed ? (
                      revealedLetters ? (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-heading font-extrabold bg-[#43E6B5]/20 text-[#43E6B5] border border-[#43E6B5]/40 tracking-wider">
                          ĐÃ MỞ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-heading font-extrabold bg-[#FF5D8F]/15 text-[#FF5D8F] border border-[#FF5D8F]/30 tracking-wider">
                          KHÓA
                        </span>
                      )
                    ) : isCurrent ? (
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-heading font-extrabold bg-[#B9C0EA]/20 text-[#B9C0EA] border border-[#B9C0EA]/40 tracking-wider animate-pulse">
                        ĐANG GIẢI
                      </span>
                    ) : (
                      <span className="text-[#6D75AD] text-[11px] font-heading font-bold tracking-widest px-1">
                        CHƯA MỞ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: TỪ KHÓA CHƯỚNG NGẠI VẬT & RUNG CHUÔNG */}
        <div className="md:col-span-5 bg-gradient-to-b from-[#11163A] via-[#080B1E] to-[#0A0D22] border-2 border-[#F7C873]/60 rounded-2xl p-3 sm:p-3.5 shadow-[0_4px_25px_rgba(247,200,115,0.18)] flex flex-col justify-between text-center">
          {/* Title & Reward points */}
          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-heading font-black text-[#F7C873] uppercase tracking-wider">
              <Key size={16} className="text-[#F7C873]" />
              <span>TỪ KHÓA ({obstacleLetterCount} CHỮ)</span>
            </div>
            <div
              className="px-2.5 py-0.5 rounded-lg bg-[#43E6B5]/20 border border-[#43E6B5]/40 text-[#43E6B5] text-xs font-digital font-bold shadow-glow-success select-none"
              title="Điểm khi giải thành công từ khóa lúc này"
            >
              +{currentCnvPoints}đ
            </div>
          </div>

          {/* Letter boxes */}
          <div className="my-2 flex items-center justify-center gap-1.5 flex-wrap">
            {Array.from({ length: obstacleLetterCount }).map((_, i) => {
              const char = obstacleAnswerRevealed ? obstacleAnswerRevealed[i] : null;
              return (
                <div
                  key={i}
                  className={`w-8 h-10 sm:w-9 sm:h-11 rounded-xl flex items-center justify-center font-digital font-black text-base sm:text-lg border-2 transition-all ${
                    char
                      ? 'bg-[#F7C873] text-[#05060F] border-[#F7C873] shadow-glow-yellow scale-105'
                      : 'bg-[#080B1E] text-[#B9C0EA] border-[#262E66] shadow-inner'
                  }`}
                >
                  {char || '?'}
                </div>
              );
            })}
          </div>

          {/* Buzzer Button */}
          {subPhase !== 'CNV_ANSWERING' && subPhase !== 'FINAL_GUESS_ANSWERING' && (
            <button
              onClick={buzz}
              disabled={!canBuzz}
              className={`w-full py-2 sm:py-2.5 px-3 rounded-xl font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                canBuzz
                  ? 'bg-gradient-to-r from-[#FF5D8F] via-[#C2306A] to-[#C2306A] text-white border-2 border-[#FFB6CF] shadow-[0_4px_0_#2A0F24,0_0_20px_rgba(255,93,143,0.7)] hover:brightness-110 active:translate-y-0.5 active:shadow-[0_1px_0_#2A0F24] animate-pulse'
                : isBuzzerLocked
                ? 'bg-[#11163A] text-[#FF5D8F] border border-[#FF5D8F]/40 opacity-70 cursor-not-allowed'
                : 'bg-[#080B1E] text-[#6D75AD] border border-[#262E66] opacity-60 cursor-not-allowed'
              }`}
              title={canBuzz ? 'Bấm chuông giành quyền trả lời Chướng ngại vật (Phím Space)' : 'Chuông hiện chưa mở'}
            >
              <Bell
                size={16}
                className={canBuzz ? 'animate-bounce text-[#F7C873]' : 'text-[#6D75AD]'}
              />
              {canBuzz && (
                <kbd className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-md bg-white text-[#C2306A] font-heading font-black text-sm tracking-[0.2em] shadow-[0_2px_0_rgba(0,0,0,0.4)] order-last">
                  SPACE
                </kbd>
              )}
              <span className="truncate">
                {canBuzz
                  ? 'RUNG CHUÔNG — NHẤN'
                  : isBuzzerLocked
                  ? `${room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || 'Thí sinh'} ĐÃ BẤM`
                  : isEliminated
                  ? 'ĐÃ BỊ LOẠI KHỎI VCNV'
                  : isViewer
                  ? 'BẠN LÀ KHÁN GIẢ'
                  : vcnvQuestionsAppearedCount < 1
                  ? 'CHUÔNG MỞ SAU HÀNG 1'
                  : 'CHUÔNG CHƯA MỞ'}
              </span>
            </button>
          )}
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
              ? 'bg-[#11163A] border-2 border-[#F7C873] shadow-glow-yellow-lg animate-pulse'
              : 'bg-[#0A0D22] border-[#262E66]'
          }`}
        >
          {isMyTurnToPick ? (
            <div className="flex items-center justify-center gap-1.5">
              <Sparkles size={16} className="text-[#F7C873]" />
              <span className="text-xs sm:text-sm font-heading font-black text-[#F7C873] uppercase tracking-wider">
                Đến lượt bạn chọn hàng ngang! Bấm vào hàng trên hoặc phím 1 - 4
              </span>
            </div>
          ) : (
            <span className="text-xs font-medium text-[#A6ACDB]">
              Đang chờ <strong className="font-heading font-bold text-[#F7C873] bg-[#11163A] px-2 py-0.5 rounded border border-[#262E66]">{activeChooser?.name || 'Thí sinh'}</strong> chọn hàng ngang...
            </span>
          )}
        </div>
      )}

      {/* Question Card (Khi có câu hỏi hàng ngang hoặc trung tâm) */}
      {currentQ && subPhase !== 'CNV_ANSWERING' && subPhase !== 'FINAL_GUESS_ANSWERING' && (
        <div className="w-full bg-[#11163A] border border-[#262E66] rounded-xl p-3 sm:p-4 shadow-xl shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] sm:text-xs font-heading font-extrabold uppercase tracking-wider bg-[#F7C873]/15 text-[#F7C873] px-2.5 py-0.5 rounded-md border border-[#F7C873]/40 shadow-glow-yellow">
              {subPhase === 'CENTER_QUESTION'
                ? 'CÂU HỎI TRUNG TÂM · GỢI Ý'
                : `HÀNG NGANG ${(activeRowIdx ?? 0) + 1} (${rowLetterCounts[activeRowIdx ?? 0] || 6} CHỮ CÁI)`}
            </span>
            <QuestionSpeakerButton
              question={currentQ}
              autoRead={subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION'}
            />
          </div>

          <p className="text-sm sm:text-base md:text-lg font-bold text-[#EEF0FF] mb-2.5 leading-snug">
            {currentQ.prompt}
          </p>

          {/* Câu ô trung tâm: chỉ là gợi ý, không nhập đáp án */}
          {subPhase === 'CENTER_QUESTION' && (
            <div
              role="note"
              className="p-2.5 bg-[#F7C873]/10 border border-[#F7C873]/50 rounded-lg text-xs sm:text-sm font-bold text-[#F7C873] flex items-start gap-2"
            >
              <Bell size={16} className="shrink-0 mt-0.5" />
              <span>
                Đây là câu hỏi gợi ý, không cần trả lời. Dùng nó để đoán <b className="text-white">từ khóa chính</b>
                {!isEliminated && !isViewer ? ' và bấm chuông ngay khi bạn đoán ra!' : '.'}
              </span>
            </div>
          )}

          {/* Form nhập đáp án (chỉ câu hàng ngang) */}
          {subPhase === 'ROW_QUESTION' && !isEliminated && !isViewer && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Nhập câu trả lời (Enter để gửi)..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#05060F] border border-[#262E66] rounded-xl text-[#EEF0FF] uppercase placeholder-[#6D75AD] focus:outline-none focus:border-[#F7C873]/70 focus:shadow-glow-yellow text-xs sm:text-sm md:text-base font-heading font-bold tracking-wider transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2 sm:px-6 sm:py-2.5 bg-[#F7C873] hover:bg-[#FBE0A8] text-[#05060F] font-heading font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 transition-all border border-[#F7C873] shadow-glow-yellow hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send size={15} />
                <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
              </button>
            </form>
          )}

          {isViewer && subPhase === 'ROW_QUESTION' && (
            <div className="p-2 bg-[#B9C0EA]/10 border border-[#B9C0EA]/40 rounded-lg text-center text-xs font-bold text-[#B9C0EA] flex items-center justify-center gap-1.5 shadow-glow-cyan">
              <Eye size={14} />
              <span>Bạn đang theo dõi với vai trò Khán giả. Đang chờ các thí sinh nhập đáp án...</span>
            </div>
          )}

          {submitted && subPhase === 'ROW_QUESTION' && (
            <div className="text-[11px] text-[#43E6B5] mt-1.5 font-bold flex items-center gap-1.5 bg-[#43E6B5]/10 border border-[#43E6B5]/30 px-2.5 py-1 rounded-lg shadow-glow-success w-fit">
              <CheckCircle2 size={13} />
              <span>
                Đã ghi nhận: <strong className="font-heading font-black text-white">"{inputAnswer.toUpperCase()}"</strong>
              </span>
            </div>
          )}

          {isEliminated && (
            <div className="p-2 bg-[#FF5D8F]/15 border border-[#FF5D8F]/40 rounded-lg text-center text-xs font-bold text-[#FF5D8F] flex items-center justify-center gap-1.5 shadow-glow-danger">
              <AlertCircle size={14} />
              <span>Bạn đã bị loại khỏi phần thi VCNV (vẫn theo dõi và cổ vũ các thí sinh khác).</span>
            </div>
          )}

          {/* Reveal Result */}
          {(subPhase === 'ROW_REVEAL' || subPhase === 'CENTER_REVEAL') && lastReveal && (
            <div className="mt-2 pt-2 border-t border-[#262E66] space-y-2">
              {lastReveal.correctAnswer ? (
                <div className="flex items-center justify-between p-2 bg-[#0A0D22] rounded-lg border border-[#262E66]">
                  <span className="text-[11px] text-[#A6ACDB] font-heading font-bold uppercase tracking-wider">
                    Đáp án chính xác:
                  </span>
                  <span className="text-xs sm:text-sm font-heading font-black text-[#05060F] bg-[#43E6B5] px-3 py-0.5 rounded-lg shadow-glow-success">
                    {lastReveal.correctAnswer}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-[#0A0D22] rounded-lg border border-[#FF5D8F]/40 bg-[#FF5D8F]/5">
                  <span className="text-[11px] text-[#FF5D8F] font-heading font-bold uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle size={13} />
                    Kết quả câu hỏi:
                  </span>
                  <span className="text-[11px] font-heading font-extrabold text-[#FFB6CF] bg-[#FF5D8F]/20 border border-[#FF5D8F]/30 px-2.5 py-0.5 rounded-lg">
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
                        className="flex items-center justify-between p-2 rounded-xl bg-[#0A0D22] border border-[#262E66] text-xs sm:text-sm"
                      >
                        <span className="flex items-center gap-1.5 min-w-0">
                          <PlayerAvatar player={p} size={20} />
                          <span className="font-bold text-[#EEF0FF] truncate max-w-[90px]">{p.name}:</span>
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {res.answer && (
                            <span className="text-[#A6ACDB] text-[11px] sm:text-xs font-mono truncate max-w-[80px]">
                              "{res.answer}"
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded font-digital font-bold border tabular-nums text-xs ${
                              res.isCorrect ? 'bg-[#43E6B5]/20 text-[#43E6B5] border-[#43E6B5]/40' : 'bg-[#FF5D8F]/20 text-[#FF5D8F] border-[#FF5D8F]/40'
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
          <div className="max-w-md w-full bg-[#0A0D22] border-2 border-[#F7C873] rounded-3xl hud hud-gold p-6 shadow-glow-yellow-lg flex flex-col items-center text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-[#F7C873] text-[#05060F] shadow-glow-yellow flex items-center justify-center mb-2.5 animate-bounce">
              <Bell size={26} />
            </div>

            <h3 className="text-xl font-heading font-black uppercase tracking-wider text-[#EEF0FF] mb-1">
              GIẢI MÃ TỪ KHÓA CHÍNH
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <span className="text-xs text-[#A6ACDB]">Thí sinh:</span>
              <span className="px-2.5 py-1 bg-[#11163A] border border-[#F7C873]/60 rounded-lg text-xs font-heading font-bold text-[#F7C873]">
                {activeAnsweringPlayer?.name || 'Thí sinh'}
              </span>
              <span className="px-2.5 py-1 bg-[#43E6B5]/20 border border-[#43E6B5]/40 rounded-lg text-xs font-digital font-bold text-[#43E6B5]">
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
                  className="w-8 h-10 sm:w-9 sm:h-11 rounded-xl bg-[#11163A] border border-[#B9C0EA]/50 flex items-center justify-center text-base sm:text-lg font-digital font-bold text-[#B9C0EA] shadow-glow-cyan"
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
                  className="w-full px-4 py-3 bg-[#05060F] border-2 border-[#B9C0EA] rounded-xl text-[#B9C0EA] uppercase text-center font-digital font-bold tracking-widest text-lg sm:text-xl placeholder-[#6D75AD] focus:outline-none shadow-glow-cyan"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-[#F7C873] hover:bg-[#FBE0A8] text-[#05060F] font-heading font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl border border-[#F7C873] shadow-glow-yellow hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  {submitted ? 'CẬP NHẬT TỪ KHÓA (ENTER)' : 'XÁC NHẬN GỬI TỪ KHÓA (ENTER)'}
                </button>

                {submitted && (
                  <p className="text-xs text-[#43E6B5] font-bold bg-[#43E6B5]/10 border border-[#43E6B5]/40 p-2 rounded-xl">
                    ✓ Đã ghi nhận: "{inputAnswer.toUpperCase()}"
                  </p>
                )}

                <p className="text-xs text-[#FF5D8F] font-bold">
                  Trả lời sai sẽ bị loại khỏi vòng VCNV!
                </p>
              </form>
            ) : (
              <div className="w-full p-3.5 bg-[#11163A] rounded-xl border border-[#262E66] text-xs">
                <p className="font-medium text-[#EEF0FF] text-sm">
                  <strong className="text-[#F7C873] font-heading">{activeAnsweringPlayer?.name}</strong> đang nhập từ khóa chính...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
