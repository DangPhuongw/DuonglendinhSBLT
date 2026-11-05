import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Bell, Send, HelpCircle, CheckCircle2, XCircle, Sparkles, AlertCircle, Layers, Key } from 'lucide-react';

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
  // 60đ: sau khi câu 1 xuất hiện (trước khi câu 2 xuất hiện)
  // 50đ: sau khi câu 2 xuất hiện (trước khi câu 3 xuất hiện)
  // 40đ: sau khi câu 3 xuất hiện (trước khi câu 4 xuất hiện)
  // 30đ: sau khi câu 4 xuất hiện (trước khi câu trung tâm xuất hiện)
  // 20đ: sau khi câu thứ 5 (trung tâm) xuất hiện cho đến hết 15s suy nghĩ cuối cùng
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col items-center relative">
      {/* Round Header */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Vòng 2: Vượt Chướng Ngại Vật
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Hàng ngang +10đ | Từ khóa chính: 60/50/40/30đ
        </span>
      </div>

      {/* Timer */}
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
        className="mb-4"
      />

      {/* TỪ KHÓA CHÍNH (N KÝ TỰ CẦN ĐƯỢC GIẢI MÃ) */}
      <div className="w-full bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 sm:p-5 mb-5 shadow-xl text-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-amber-400 animate-pulse" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-300">
              TỪ KHÓA CHÍNH CẦN GIẢI MÃ ({obstacleLetterCount} KÝ TỰ)
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-slate-800/90 px-3 py-1.5 rounded-xl border border-amber-500/30 text-amber-300 font-bold">
            <span>Điểm đoán đúng lúc này:</span>
            <span className="text-amber-400 font-black text-sm">+{currentCnvPoints}đ</span>
          </div>
        </div>

        {/* Thang điểm quy định */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 my-2.5 text-[11px] font-mono">
          <div className={`p-1.5 rounded-lg border text-center transition-all ${vcnvQuestionsAppearedCount === 1 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold scale-105 shadow-sm' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
            <span className="block font-bold">60 ĐIỂM</span>
            <span className="text-[10px] text-slate-500">Sau câu hỏi 1</span>
          </div>
          <div className={`p-1.5 rounded-lg border text-center transition-all ${vcnvQuestionsAppearedCount === 2 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold scale-105 shadow-sm' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
            <span className="block font-bold">50 ĐIỂM</span>
            <span className="text-[10px] text-slate-500">Sau câu hỏi 2</span>
          </div>
          <div className={`p-1.5 rounded-lg border text-center transition-all ${vcnvQuestionsAppearedCount === 3 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold scale-105 shadow-sm' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
            <span className="block font-bold">40 ĐIỂM</span>
            <span className="text-[10px] text-slate-500">Sau câu hỏi 3</span>
          </div>
          <div className={`p-1.5 rounded-lg border text-center transition-all ${vcnvQuestionsAppearedCount === 4 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold scale-105 shadow-sm' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
            <span className="block font-bold">30 ĐIỂM</span>
            <span className="text-[10px] text-slate-500">Sau câu hỏi 4</span>
          </div>
          <div className={`col-span-2 sm:col-span-1 p-1.5 rounded-lg border text-center transition-all ${vcnvQuestionsAppearedCount >= 5 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold scale-105 shadow-sm' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
            <span className="block font-bold">20 ĐIỂM</span>
            <span className="text-[10px] text-slate-500">Gợi ý 5 / Cuối</span>
          </div>
        </div>

        {/* N Letter Boxes for the Main Keyword */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 my-2.5">
          {Array.from({ length: obstacleLetterCount }).map((_, i) => {
            const char = obstacleAnswerRevealed ? obstacleAnswerRevealed[i] : null;
            return (
              <div
                key={i}
                className={`w-8 h-10 sm:w-10 sm:h-12 rounded-xl flex items-center justify-center font-black text-sm sm:text-lg font-mono border transition-all duration-500 shadow-sm ${
                  char
                    ? 'bg-gradient-to-b from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/40 scale-105'
                    : 'bg-slate-950/90 border-amber-500/30 text-amber-500/60'
                }`}
              >
                {char || '?'}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] text-slate-400 mt-1">
          <span>4 từ hàng ngang (4 gợi ý)</span>
          <span className="text-amber-400 hidden sm:inline">•</span>
          <span>Gợi ý thứ 5: Câu hỏi & ô trung tâm</span>
          <span className="text-amber-400 hidden sm:inline">•</span>
          <span className="text-amber-300 font-semibold">
            {vcnvQuestionsAppearedCount < 1
              ? '⏳ Chuông CNV sẽ mở sau khi câu hỏi hàng ngang thứ 1 xuất hiện'
              : '🔔 Bấm chuông (Space) để trả lời từ khóa chính bất kì lúc nào!'}
          </span>
        </div>
      </div>

      {/* Status & Turn Banners */}
      {subPhase === 'PICK_ROW' && (
        <div
          className={`w-full p-3.5 mb-4 rounded-2xl text-center border transition-all ${
            isMyTurnToPick
              ? 'bg-gradient-to-r from-amber-600/30 via-yellow-500/20 to-amber-600/30 border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/40 animate-pulse'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          {isMyTurnToPick ? (
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={18} className="text-amber-400 animate-spin" />
              <span className="text-sm font-black text-amber-300 uppercase tracking-wider">
                Đến lượt bạn chọn hàng ngang! Bấm chọn 1 hàng trên bảng hoặc phím 1 - 4 để bắt đầu câu hỏi
              </span>
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-300">
              Đang chờ thí sinh <strong className="text-amber-400 font-bold text-sm">{activeChooser?.name || 'Thí sinh'}</strong> chọn hàng ngang (chọn xong mới bắt đầu tính giờ)...
            </span>
          )}
        </div>
      )}

      {subPhase === 'ROW_QUESTION' && (
        <div className="w-full p-2.5 mb-4 bg-blue-950/40 border border-blue-500/40 rounded-xl text-center">
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
            ⚡ Hàng ngang số {(activeRowIdx ?? 0) + 1} — Tất cả thí sinh cùng trả lời trong 15 giây!
          </span>
        </div>
      )}

      {subPhase === 'CENTER_QUESTION' && (
        <div className="w-full p-2.5 mb-4 bg-purple-950/40 border border-purple-500/40 rounded-xl text-center">
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
            🎯 Câu hỏi Trung Tâm — Tất cả thí sinh cùng trả lời trong 15 giây!
          </span>
        </div>
      )}

      {buzzRejectedReason && (
        <div className="w-full p-2.5 mb-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-center text-xs font-bold text-rose-300">
          {buzzRejectedReason}
        </div>
      )}

      {/* Main Grid: 4 Rows of Related Words (Left) & 5-Piece Image (Right) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* 4 Rows Puzzle Board (4 Từ liên quan) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>4 Từ Liên Quan (4 Hàng Ngang)</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {rowsRevealed.filter(Boolean).length}/4 hàng đã mở
              </span>
            </div>

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
                  className={`p-3 rounded-xl border transition-all ${
                    isClickable
                      ? 'bg-amber-950/30 border-amber-500 hover:bg-amber-950/60 shadow-md shadow-amber-500/20 cursor-pointer active:scale-[0.99] ring-2 ring-amber-500/40 animate-pulse'
                      : isCurrent
                      ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/20 ring-1 ring-amber-500/40'
                      : isRevealed
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-950/50 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isClickable || isCurrent
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : isRevealed && revealedLetters
                            ? 'bg-emerald-600 text-white font-black'
                            : isRevealed
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        Hàng {idx + 1}: Từ liên quan {idx + 1}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({letterCount} chữ cái)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isClickable ? (
                        <button
                          type="button"
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg shadow"
                        >
                          Chọn hàng {idx + 1}
                        </button>
                      ) : isRevealed ? (
                        revealedLetters ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 tracking-wider">
                            ĐÃ MỞ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 tracking-wider">
                            KHÔNG MỞ
                          </span>
                        )
                      ) : isCurrent ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/30 tracking-wider animate-pulse">
                          ĐANG GIẢI
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px] font-mono tracking-widest">
                          CHƯA MỞ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Letter Boxes (Số ô vuông bằng đúng số chữ cái của đáp án) */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {Array.from({ length: letterCount }).map((_, charIdx) => {
                      const char = isRevealed && revealedLetters ? revealedLetters[charIdx] : null;
                      return (
                        <div
                          key={charIdx}
                          className={`w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center font-black text-xs font-mono border transition-all duration-300 ${
                            char
                              ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30 scale-100'
                              : isCurrent
                              ? 'bg-amber-950/70 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                              : isClickable
                              ? 'bg-slate-800/90 border-amber-500/40 text-slate-400'
                              : 'bg-slate-950/80 border-slate-800 text-slate-600'
                          }`}
                        >
                          {char || (isCurrent ? '?' : '•')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buzzer Button for Main Keyword (Bấm chuông bất kì lúc nào sau câu hỏi 1) */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 leading-tight">
              {isEliminated ? (
                <span className="text-rose-400 font-bold">Bạn đã bị loại khỏi VCNV</span>
              ) : isBuzzerLocked ? (
                <span className="text-amber-400 font-semibold">
                  Chuông đã được bấm bởi {activeAnsweringPlayer?.name || 'thí sinh'}
                </span>
              ) : vcnvQuestionsAppearedCount < 1 ? (
                <span className="text-slate-500 font-medium">
                  Chuông Chướng ngại vật sẽ mở sau khi câu hỏi hàng ngang 1 xuất hiện
                </span>
              ) : (
                <span className="text-amber-300 font-semibold">
                  Bấm chuông trả lời từ khóa chính (+{currentCnvPoints}đ) [Phím Space]
                </span>
              )}
            </span>
            <button
              onClick={buzz}
              disabled={!canBuzz}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 ${
                !canBuzz
                  ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-lg shadow-rose-600/40 cursor-pointer active:scale-95 animate-pulse'
              }`}
            >
              <Bell size={15} />
              <span>{canBuzz ? `Chuông CNV (+${currentCnvPoints}đ)` : 'Chuông CNV'}</span>
            </button>
          </div>
        </div>

        {/* 5-Piece Obstacle Image */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hình Ảnh Gợi Ý (5 Mảnh Ghép)
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              {openedPieces.length}/5 mảnh đã mở
            </span>
          </div>

          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
            {/* Background Image */}
            <img
              src={sampleImage}
              alt="Chướng ngại vật"
              className="w-full h-full object-cover select-none"
            />

            {/* 4 Quadrants (Mảnh 1, 2, 3, 4) */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              {/* Piece 0 (Top Left - Mảnh 1) */}
              <div
                className={`transition-opacity duration-700 border border-slate-900/60 flex flex-col items-center justify-center p-2 ${
                  openedPieces.includes(0) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
                }`}
              >
                {!openedPieces.includes(0) && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-sm shadow">
                      1
                    </span>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wide">Mảnh 1 (Hàng 1)</span>
                  </div>
                )}
              </div>

              {/* Piece 1 (Top Right - Mảnh 2) */}
              <div
                className={`transition-opacity duration-700 border border-slate-900/60 flex flex-col items-center justify-center p-2 ${
                  openedPieces.includes(1) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
                }`}
              >
                {!openedPieces.includes(1) && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-sm shadow">
                      2
                    </span>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wide">Mảnh 2 (Hàng 2)</span>
                  </div>
                )}
              </div>

              {/* Piece 2 (Bottom Left - Mảnh 3) */}
              <div
                className={`transition-opacity duration-700 border border-slate-900/60 flex flex-col items-center justify-center p-2 ${
                  openedPieces.includes(2) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
                }`}
              >
                {!openedPieces.includes(2) && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-sm shadow">
                      3
                    </span>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wide">Mảnh 3 (Hàng 3)</span>
                  </div>
                )}
              </div>

              {/* Piece 3 (Bottom Right - Mảnh 4) */}
              <div
                className={`transition-opacity duration-700 border border-slate-900/60 flex flex-col items-center justify-center p-2 ${
                  openedPieces.includes(3) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
                }`}
              >
                {!openedPieces.includes(3) && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-amber-400 text-sm shadow">
                      4
                    </span>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wide">Mảnh 4 (Hàng 4)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Center Piece (Piece 4 - Ô Trung Tâm / Gợi Ý Thứ 5) */}
            <div
              className={`absolute inset-[22%] rounded-xl transition-opacity duration-700 border-2 border-amber-500/60 flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm ${
                openedPieces.includes(4) ? 'opacity-0 pointer-events-none' : 'bg-slate-950/95 opacity-100'
              }`}
            >
              {!openedPieces.includes(4) && (
                <div className="flex flex-col items-center gap-1 text-center p-1 sm:p-2">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-amber-500/30">
                    5
                  </span>
                  <span className="text-amber-400 font-black text-[11px] sm:text-xs uppercase tracking-wider">
                    Ô Trung Tâm
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">(Gợi ý thứ 5)</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-[11px] text-slate-500">
              {obstacleSolved
                ? '🏆 Từ khóa chính đã được giải mã thành công!'
                : 'Mỗi hàng ngang giải đúng sẽ mở 1 góc hình ảnh tương ứng'}
            </span>
          </div>
        </div>
      </div>

      {/* Row / Center Question Card (Khi có câu hỏi hàng ngang) */}
      {currentQ && subPhase !== 'CNV_ANSWERING' && subPhase !== 'FINAL_GUESS_ANSWERING' && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur">
          {/* Question Title Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <HelpCircle size={15} />
              <span>
                {subPhase === 'CENTER_QUESTION'
                  ? 'CÂU HỎI TRUNG TÂM'
                  : `CÂU HỎI HÀNG NGANG SỐ ${(activeRowIdx ?? 0) + 1} (${rowLetterCounts[activeRowIdx ?? 0] || 6} CHỮ CÁI)`}
              </span>
            </div>
            <QuestionSpeakerButton
              question={currentQ}
              autoRead={subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION'}
            />
          </div>

          {/* Question Prompt */}
          <p className="text-base sm:text-lg font-bold text-slate-100 mb-4 leading-relaxed">
            {currentQ.prompt}
          </p>

          {/* Answer Input form: for all 4 active players in ROW_QUESTION / CENTER_QUESTION */}
          {(subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') && !isEliminated && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Nhập câu trả lời hàng ngang (Enter để gửi)..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white uppercase placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-semibold tracking-wider transition-all"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20 active:scale-95"
              >
                <Send size={14} />
                <span>{submitted ? 'Đổi đáp án' : 'Gửi'}</span>
              </button>
            </form>
          )}

          {submitted && (subPhase === 'ROW_QUESTION' || subPhase === 'CENTER_QUESTION') && (
            <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              <span>
                Đã ghi nhận đáp án: <strong className="text-white">"{inputAnswer.toUpperCase()}"</strong>. Bạn có thể sửa đổi đến khi hết giờ.
              </span>
            </p>
          )}

          {/* If eliminated */}
          {isEliminated && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-center text-xs font-semibold text-rose-300 flex items-center justify-center gap-2">
              <AlertCircle size={15} />
              <span>Bạn đã bị loại khỏi phần thi VCNV (vẫn theo dõi và cổ vũ các thí sinh khác).</span>
            </div>
          )}

          {/* Reveal details: correct answer and all contestants' submissions */}
          {(subPhase === 'ROW_REVEAL' || subPhase === 'CENTER_REVEAL') && lastReveal && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Đáp án chính xác:
                </span>
                <span className="text-base font-black text-emerald-400 tracking-wider">
                  {lastReveal.correctAnswer}
                </span>
              </div>

              {lastReveal.results && lastReveal.results.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider mb-2 block">
                    Kết quả câu trả lời của các thí sinh:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {lastReveal.results.map((res) => {
                      const p = room.players.find((pl) => pl.id === res.playerId);
                      if (!p) return null;
                      return (
                        <div
                          key={res.playerId}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-slate-200">{p.name}:</span>
                            <span className="italic text-slate-400 truncate">
                              "{res.answer || '(không trả lời)'}"
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                              res.isCorrect
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {res.isCorrect ? '+10đ' : '0đ'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MÀN NHẬP TỪ KHÓA CHÍNH (MODAL KHI CÓ NGƯỜI BẤM CHUÔNG) */}
      {/* ======================================================== */}
      {(subPhase === 'CNV_ANSWERING' || subPhase === 'FINAL_GUESS_ANSWERING') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-xl w-full bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/30 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Buzzer icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 mb-3 shadow-lg shadow-amber-500/30 animate-bounce">
              <Bell size={28} />
            </div>

            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-amber-400 mb-1">
              GIẢI MÃ TỪ KHÓA CHÍNH
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <span className="text-xs font-bold text-slate-300">
                Thí sinh bấm chuông:
              </span>
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-xs font-black text-amber-300 uppercase tracking-wider">
                {activeAnsweringPlayer?.name || 'Thí sinh'}
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-xs font-black text-emerald-300 uppercase tracking-wider">
                Đúng: +{currentCnvPoints} điểm
              </span>
            </div>

            {/* Countdown timer */}
            <div className="w-full mb-5">
              <CountdownTimer
                deadline={room.state.deadline}
                totalDurationSeconds={15}
                className="w-full"
              />
            </div>

            {/* Obstacle N letter boxes */}
            <div className="w-full mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Từ khóa chính gồm {obstacleLetterCount} ký tự:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {Array.from({ length: obstacleLetterCount }).map((_, i) => (
                  <div
                    key={i}
                    className="w-9 h-11 sm:w-11 sm:h-13 rounded-xl bg-slate-950 border-2 border-amber-500/50 flex items-center justify-center text-lg sm:text-xl font-black font-mono text-amber-400 shadow-inner"
                  >
                    ?
                  </div>
                ))}
              </div>
            </div>

            {/* If I am the buzzer winner: Dedicated input field */}
            {isMyTurnToAnswerCnv && !isEliminated ? (
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="relative">
                  <input
                    ref={modalInputRef}
                    type="text"
                    autoFocus
                    placeholder="Nhập từ khóa chính tại đây..."
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-950 border-2 border-amber-400 rounded-2xl text-white uppercase text-center font-black tracking-widest text-lg sm:text-xl placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-amber-500/30 transition-all shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={18} />
                  <span>{submitted ? 'CẬP NHẬT TỪ KHÓA (ENTER)' : 'XÁC NHẬN GỬI TỪ KHÓA (ENTER)'}</span>
                </button>

                {submitted && (
                  <p className="text-xs text-emerald-400 font-bold animate-pulse">
                    ✓ Đã ghi nhận: "{inputAnswer.toUpperCase()}". Bạn có thể sửa đổi trước khi hết 15 giây!
                  </p>
                )}

                <p className="text-[11px] text-rose-400 font-medium italic">
                  ⚠️ Lưu ý: Nếu trả lời sai, bạn sẽ bị mất quyền tham gia phần thi này!
                </p>
              </form>
            ) : (
              /* If other contestants are watching */
              <div className="w-full p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-sm font-semibold text-slate-300">
                  Thí sinh <strong className="text-amber-400">{activeAnsweringPlayer?.name}</strong> đang nhập từ khóa chính...
                </p>
                <p className="text-xs text-slate-500">
                  Nếu đúng, vòng thi sẽ kết thúc và thí sinh nhận điểm tối đa. Nếu sai, các bạn còn lại sẽ tiếp tục thi đấu!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
