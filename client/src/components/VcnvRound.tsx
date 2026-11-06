import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Bell, Send, CheckCircle2, Sparkles, AlertCircle, Key } from 'lucide-react';

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
  const openedPieces: number[] = room?.state?.openedPieces || [];
  const rowsRevealed: boolean[] = room?.state?.rowsRevealed || [false, false, false, false];
  const rowLetterCounts: number[] = room?.state?.rowLetterCounts || [6, 5, 9, 7];
  const rowAnswersRevealed = room?.state?.rowAnswersRevealed;
  const activeRowIdx = room?.state?.activeRowIndex;

  // Từ khóa chính (Chướng ngại vật)
  const obstacleLetterCount = room?.state?.obstacleLetterCount || 7;
  const obstacleAnswerRevealed = room?.state?.obstacleAnswerRevealed;
  const obstacleSolved = room?.state?.obstacleSolved;

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

  // Bấm chuông Chướng ngại vật: Chỉ mở sau khi câu hỏi hàng ngang 1 xuất hiện
  const canBuzz = !isEliminated && !isBuzzerLocked && vcnvQuestionsAppearedCount >= 1;

  const activeChooser = room?.players.find((p) => p.id === room?.state?.activePlayerId);
  const isMyTurnToPick = Boolean(subPhase === 'PICK_ROW' && myPlayer && room?.state?.activePlayerId === myPlayer.id);

  const isMyTurnToAnswerCnv = Boolean(
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

  const sampleImage =
    room?.state?.vcnvImage ||
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      {/* ======================================================== */}
      {/* 1. TOP UTILITY BAR: Round, Keyword, Timer, Buzzer        */}
      {/* ======================================================== */}
      <div className="w-full bg-white border-3 border-[#171717] rounded-2xl p-3 sm:px-5 sm:py-3 mb-3.5 shadow-neo-lg flex flex-wrap items-center justify-between gap-3">
        {/* Left: Round Pill & Keyword Letter Boxes */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3 py-1 rounded-lg border-2 border-[#171717] shadow-neo-sm">
            VÒNG 2: VCNV
          </span>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#171717]">
            <Key size={16} className="text-[#171717] shrink-0" />
            <span>TỪ KHÓA ({obstacleLetterCount}):</span>
          </div>

          {/* Letter boxes */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: obstacleLetterCount }).map((_, i) => {
              const char = obstacleAnswerRevealed ? obstacleAnswerRevealed[i] : null;
              return (
                <div
                  key={i}
                  className={`w-8 h-10 sm:w-9 sm:h-11 rounded-xl flex items-center justify-center font-black text-sm sm:text-lg font-mono border-2 border-[#171717] transition-all shadow-neo-sm ${
                    char
                      ? 'bg-[#FFE45C] text-[#171717] scale-105'
                      : 'bg-[#FFFDF7] text-[#171717]'
                  }`}
                >
                  {char || '?'}
                </div>
              );
            })}
          </div>

          <span
            className="text-xs sm:text-sm font-black bg-[#55D6C2] text-[#171717] px-2.5 py-1 rounded-lg border-2 border-[#171717] tabular-nums shadow-neo-sm"
            title="Đoán từ khóa chính dựa trên 4 hàng gợi ý - Sau mỗi câu hỏi gợi ý được lật mở, số điểm nhận được khi đoán từ khóa chính sẽ giảm"
          >
            +{currentCnvPoints}đ
          </span>
        </div>

        {/* Right: Timer & CNV Buzzer Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-32 sm:w-44">
            <CountdownTimer
              deadline={room.state.deadline}
              totalDurationSeconds={
                subPhase === 'PICK_ROW'
                  ? 10
                  : subPhase === 'ROW_QUESTION'
                  ? 15
                  : subPhase === 'ROW_REVEAL' || subPhase === 'CENTER_REVEAL'
                  ? 6
                  : subPhase === 'CNV_ANSWERING' || subPhase === 'FINAL_GUESS_ANSWERING'
                  ? 15
                  : subPhase === 'CENTER_QUESTION'
                  ? 15
                  : 15
              }
              className="mb-0"
            />
          </div>

          <button
            onClick={buzz}
            disabled={!canBuzz}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border-2 border-[#171717] shrink-0 ${
              !canBuzz
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed shadow-none'
                : 'bg-[#FFE45C] hover:bg-[#ffe040] text-[#171717] shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer animate-pulse'
            }`}
            title={canBuzz ? 'Bấm chuông đoán từ khóa chính (Phím Space)' : 'Chuông chưa mở'}
          >
            <Bell size={15} />
            <span>Chuông CNV</span>
          </button>
        </div>
      </div>

      {buzzRejectedReason && (
        <div className="w-full py-2 px-4 mb-3 bg-[#FF9292]/30 border-2 border-[#171717] rounded-xl text-center text-xs sm:text-sm font-black text-[#171717] shadow-neo-sm">
          {buzzRejectedReason}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. GAME BOARD: 4 Rows (Left) & 5-Piece Image (Right)     */}
      {/* ======================================================== */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
        {/* Left: 4 Rows */}
        <div className="bg-white border-3 border-[#171717] rounded-2xl p-3.5 sm:p-4 shadow-neo-lg flex flex-col justify-between min-h-[260px] sm:min-h-[280px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#171717]">
              4 Hàng Ngang (Gợi Ý)
            </span>
            <span className="text-xs text-gray-700 font-black tabular-nums bg-[#FFFDF7] px-2 py-0.5 rounded-lg border border-[#171717]">
              {rowsRevealed.filter(Boolean).length}/4 hàng đã mở
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-2">
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
                  className={`p-2 sm:p-2.5 rounded-xl border-2 border-[#171717] transition-all flex items-center justify-between gap-2 ${
                    isClickable
                      ? 'bg-[#FFE45C] shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none animate-pulse'
                      : isCurrent
                      ? 'bg-[#FFE45C]/40 shadow-neo font-bold'
                      : isRevealed
                      ? 'bg-[#FFFDF7] shadow-neo-sm'
                      : 'bg-gray-50 border-gray-300 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg border-2 border-[#171717] flex items-center justify-center font-black text-xs shrink-0 ${
                        isClickable || isCurrent
                          ? 'bg-[#FFE45C] text-[#171717]'
                          : isRevealed && revealedLetters
                          ? 'bg-[#55D6C2] text-[#171717]'
                          : 'bg-white text-gray-700'
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
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center font-black text-xs font-mono border-2 border-[#171717] transition-all ${
                              char
                                ? 'bg-[#55D6C2] text-[#171717] shadow-neo-sm'
                                : isCurrent
                                ? 'bg-[#FFE45C] text-[#171717] shadow-neo-sm'
                                : 'bg-white text-gray-400 border-gray-300'
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
                        className="px-2.5 py-1 bg-[#171717] text-white font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-lg shadow-neo-sm hover:scale-105 transition-transform"
                      >
                        Chọn
                      </button>
                    ) : isRevealed ? (
                      revealedLetters ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black bg-[#55D6C2] text-[#171717] border border-[#171717] tracking-wider">
                          ĐÃ MỞ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black bg-gray-200 text-gray-600 border border-[#171717] tracking-wider">
                          KHÓA
                        </span>
                      )
                    ) : isCurrent ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black bg-[#FFE45C] text-[#171717] border border-[#171717] tracking-wider animate-pulse">
                        ĐANG GIẢI
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs font-bold tracking-widest px-1">
                        CHƯA MỞ
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: 5-Piece Image */}
        <div className="bg-white border-3 border-[#171717] rounded-2xl p-3.5 sm:p-4 shadow-neo-lg flex flex-col justify-between min-h-[260px] sm:min-h-[280px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#171717]">
              Hình Ảnh Gợi Ý (5 Mảnh Ghép)
            </span>
            <span className="text-xs text-gray-700 font-black tabular-nums bg-[#FFFDF7] px-2 py-0.5 rounded-lg border border-[#171717]">
              {openedPieces.length}/5 mảnh đã mở
            </span>
          </div>

          <div className="relative flex-1 min-h-[210px] rounded-xl overflow-hidden border-2 border-[#171717] bg-gray-100 shadow-neo-sm">
            <img
              src={sampleImage}
              alt="Chướng ngại vật"
              className="w-full h-full object-cover select-none"
            />

            {/* 4 Quadrants */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              {[0, 1, 2, 3].map((pieceIdx) => (
                <div
                  key={pieceIdx}
                  className={`transition-opacity duration-500 border border-[#171717] flex items-center justify-center p-2 ${
                    openedPieces.includes(pieceIdx)
                      ? 'opacity-0 pointer-events-none'
                      : 'bg-white opacity-100'
                  }`}
                >
                  {!openedPieces.includes(pieceIdx) && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFE45C] border-2 border-[#171717] flex items-center justify-center font-black text-[#171717] text-xs sm:text-sm shadow-neo-sm">
                        {pieceIdx + 1}
                      </span>
                      <span className="text-[#171717] font-black text-xs uppercase tracking-wide">Mảnh {pieceIdx + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Center Piece 4 */}
            <div
              className={`absolute inset-[18%] rounded-xl transition-opacity duration-500 border-3 border-[#171717] flex flex-col items-center justify-center shadow-neo-lg ${
                openedPieces.includes(4) ? 'opacity-0 pointer-events-none' : 'bg-white opacity-100'
              }`}
            >
              {!openedPieces.includes(4) && (
                <div className="flex items-center gap-2 text-center p-1 sm:p-2">
                  <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFE45C] text-[#171717] font-black text-xs sm:text-sm flex items-center justify-center border-2 border-[#171717] shadow-neo-sm">
                    5
                  </span>
                  <span className="text-[#171717] font-black text-xs sm:text-sm uppercase tracking-wider">
                    Ô Trung Tâm
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. DYNAMIC INTERACTION CARD (Pick Row / Question / Reveal)*/}
      {/* ======================================================== */}

      {/* Turn Banner (Khi ở pha PICK_ROW) */}
      {subPhase === 'PICK_ROW' && (
        <div
          className={`w-full p-4 rounded-2xl text-center border-3 border-[#171717] transition-all ${
            isMyTurnToPick
              ? 'bg-[#FFE45C] shadow-neo-lg animate-pulse'
              : 'bg-white shadow-neo'
          }`}
        >
          {isMyTurnToPick ? (
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={20} className="text-[#171717]" />
              <span className="text-sm sm:text-base font-black text-[#171717] uppercase tracking-wider">
                Đến lượt bạn chọn hàng ngang! Bấm vào hàng trên bàn cờ hoặc phím 1 - 4
              </span>
            </div>
          ) : (
            <span className="text-sm font-bold text-[#171717]">
              Đang chờ <strong className="font-black bg-[#FFE45C] px-2 py-0.5 rounded-lg border border-[#171717]">{activeChooser?.name || 'Thí sinh'}</strong> chọn hàng ngang...
            </span>
          )}
        </div>
      )}

      {/* Question Card (Khi có câu hỏi hàng ngang hoặc trung tâm) */}
      {currentQ && subPhase !== 'CNV_ANSWERING' && subPhase !== 'FINAL_GUESS_ANSWERING' && (
        <div className="w-full bg-white border-3 border-[#171717] rounded-2xl p-4 sm:p-5 shadow-neo-lg">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3 py-1 rounded-md border-2 border-[#171717] shadow-neo-sm">
              {subPhase === 'CENTER_QUESTION'
                ? 'CÂU HỎI TRUNG TÂM'
                : `HÀNG NGANG ${(activeRowIdx ?? 0) + 1} (${rowLetterCounts[activeRowIdx ?? 0] || 6} CHỮ CÁI)`}
            </span>
            <QuestionSpeakerButton
              question={currentQ}
              autoRead={subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION'}
            />
          </div>

          <p className="text-base sm:text-xl font-black text-[#171717] mb-3 leading-relaxed">
            {currentQ.prompt}
          </p>

          {/* Form nhập đáp án */}
          {(subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') && !isEliminated && (
            <form onSubmit={handleSubmit} className="flex gap-2.5">
              <input
                ref={inputRef}
                type="text"
                placeholder="Nhập câu trả lời của bạn (Enter để gửi)..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-4 py-3 bg-white border-2 border-[#171717] rounded-xl text-[#171717] uppercase placeholder-gray-400 focus:outline-none focus:bg-[#FFFDF7] text-sm sm:text-base font-black tracking-wider shadow-neo-sm transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#FFE45C] hover:bg-[#ffe040] text-[#171717] font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 transition-all border-2 border-[#171717] shadow-neo hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
              >
                <Send size={15} />
                <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
              </button>
            </form>
          )}

          {submitted && (subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') && (
            <div className="text-xs text-[#171717] mt-2.5 font-bold flex items-center gap-2 bg-[#55D6C2]/30 border-2 border-[#171717] px-3.5 py-1.5 rounded-xl shadow-neo-sm w-fit">
              <CheckCircle2 size={15} />
              <span>
                Đã ghi nhận: <strong className="font-black text-[#171717]">"{inputAnswer.toUpperCase()}"</strong> (bạn có thể sửa đổi đến khi hết giờ).
              </span>
            </div>
          )}

          {isEliminated && (
            <div className="p-3 bg-[#FF9292]/30 border-2 border-[#171717] rounded-xl text-center text-xs font-black text-[#171717] flex items-center justify-center gap-2 shadow-neo-sm">
              <AlertCircle size={15} />
              <span>Bạn đã bị loại khỏi phần thi VCNV (vẫn theo dõi và cổ vũ các thí sinh khác).</span>
            </div>
          )}

          {/* Reveal Result */}
          {(subPhase === 'ROW_REVEAL' || subPhase === 'CENTER_REVEAL') && lastReveal && (
            <div className="mt-3 pt-3 border-t-2 border-[#171717] space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#FFFDF7] rounded-xl border-2 border-[#171717] shadow-neo-sm">
                <span className="text-xs text-gray-700 font-black uppercase tracking-wider">
                  Đáp án chính xác:
                </span>
                <span className="text-base sm:text-lg font-black text-[#171717] bg-[#55D6C2] px-3.5 py-1 rounded-xl border-2 border-[#171717] shadow-neo-sm">
                  {lastReveal.correctAnswer}
                </span>
              </div>

              {lastReveal.results && lastReveal.results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {lastReveal.results.map((res) => {
                    const p = room.players.find((pl) => pl.id === res.playerId);
                    if (!p) return null;
                    return (
                      <div
                        key={res.playerId}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border-2 border-[#171717] text-xs shadow-neo-sm"
                      >
                        <span className="font-black text-[#171717] truncate">{p.name}:</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-black shrink-0 border border-[#171717] tabular-nums text-[10px] ${
                            res.isCorrect ? 'bg-[#55D6C2] text-[#171717]' : 'bg-[#FF9292] text-[#171717]'
                          }`}
                        >
                          {res.isCorrect ? '+10đ' : '0đ'}
                        </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white border-4 border-[#171717] rounded-3xl p-6 shadow-neo-lg flex flex-col items-center text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-[#FFE45C] border-2 border-[#171717] shadow-neo flex items-center justify-center text-[#171717] mb-2.5 animate-bounce">
              <Bell size={26} />
            </div>

            <h3 className="text-xl font-black uppercase tracking-wider text-[#171717] mb-1">
              GIẢI MÃ TỪ KHÓA CHÍNH
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <span className="text-xs font-bold text-gray-700">Thí sinh:</span>
              <span className="px-2.5 py-1 bg-[#FFE45C] border-2 border-[#171717] rounded-lg text-xs font-black text-[#171717] shadow-neo-sm">
                {activeAnsweringPlayer?.name || 'Thí sinh'}
              </span>
              <span className="px-2.5 py-1 bg-[#55D6C2] border-2 border-[#171717] rounded-lg text-xs font-black text-[#171717] shadow-neo-sm">
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
                  className="w-8 h-10 sm:w-9 sm:h-11 rounded-xl bg-white border-2 border-[#171717] flex items-center justify-center text-base sm:text-lg font-black font-mono text-[#171717] shadow-neo-sm"
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
                  className="w-full px-4 py-3 bg-[#FFFDF7] border-3 border-[#171717] rounded-xl text-[#171717] uppercase text-center font-black tracking-widest text-base sm:text-lg placeholder-gray-400 focus:outline-none shadow-neo"
                />

                <button
                  type="submit"
                  className="w-full py-3 bg-[#FFE45C] hover:bg-[#ffe040] text-[#171717] font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl border-2 border-[#171717] shadow-neo active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  {submitted ? 'CẬP NHẬT TỪ KHÓA (ENTER)' : 'XÁC NHẬN GỬI TỪ KHÓA (ENTER)'}
                </button>

                {submitted && (
                  <p className="text-xs text-[#171717] font-black bg-[#55D6C2]/40 border-2 border-[#171717] p-2 rounded-xl">
                    ✓ Đã ghi nhận: "{inputAnswer.toUpperCase()}"
                  </p>
                )}

                <p className="text-xs text-[#FF9292] font-black">
                  ⚠️ Trả lời sai sẽ bị loại khỏi vòng VCNV!
                </p>
              </form>
            ) : (
              <div className="w-full p-3.5 bg-[#FFFDF7] rounded-xl border-2 border-[#171717] text-xs">
                <p className="font-black text-[#171717] text-sm">
                  <strong className="bg-[#FFE45C] px-1.5 py-0.5 rounded border border-[#171717]">{activeAnsweringPlayer?.name}</strong> đang nhập từ khóa chính...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
