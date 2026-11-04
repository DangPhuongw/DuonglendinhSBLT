import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Bell, CheckCircle, XCircle, Package, Sparkles, Lock } from 'lucide-react';

export const KhoiDongRound: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const chooseKdPackage = useGameStore((s) => s.chooseKdPackage);
  const buzz = useGameStore((s) => s.buzz);
  const buzzWinner = useGameStore((s) => s.buzzWinner);
  const buzzRejectedReason = useGameStore((s) => s.buzzRejectedReason);
  const lastReveal = useGameStore((s) => s.lastReveal);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentRound = room?.state?.round; // 'KD_RIENG' or 'KD_CHUNG'
  const subPhase = room?.state?.subPhase;
  const currentQ = room?.state?.currentQuestion;
  const activePlayer = room?.players.find((p) => p.id === room.state.activePlayerId);
  const isMyTurn = Boolean(myPlayer && room?.state?.activePlayerId === myPlayer.id);

  // Clear local selected option when question changes
  useEffect(() => {
    setSelectedOption(null);
  }, [currentQ?.id]);

  // Stop voice reading on reveal or answering phase
  useEffect(() => {
    if (subPhase === 'REVEAL' || subPhase === 'ANSWERING') {
      voiceReader.stop();
    }
  }, [subPhase]);

  // Stop speech when round unmounts
  useEffect(() => {
    return () => {
      voiceReader.stop();
    };
  }, []);

  // Keyboard shortcut listener (1-4 for options, Space for buzzer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for buzzer
      if (e.code === 'Space' && currentRound === 'KD_CHUNG' && subPhase === 'QUESTION_BUZZ') {
        e.preventDefault();
        buzz();
        return;
      }

      // 1-5 for picking package if active player
      if (isMyTurn && subPhase === 'CHOOSE_PACKAGE') {
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          const index = parseInt(e.key, 10) - 1;
          const pkgs = room?.state?.kdPackages || [];
          if (!pkgs[index]?.chosenBy) {
            chooseKdPackage(index);
          }
          return;
        }
      }

      // 1-4 for MCQ options if active player
      if (isMyTurn && (subPhase === 'QUESTION' || subPhase === 'ANSWERING') && currentQ?.options) {
        if (['1', '2', '3', '4'].includes(e.key) && !selectedOption) {
          const index = parseInt(e.key, 10) - 1;
          const letter = ['A', 'B', 'C', 'D'][index];
          setSelectedOption(letter);
          if (currentQ) submitAnswer(currentQ.id, letter);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRound, subPhase, isMyTurn, currentQ, selectedOption, buzz, submitAnswer]);

  if (!room || !myPlayer) return null;

  const handleSelectOption = (letter: string) => {
    if (!isMyTurn || selectedOption || !currentQ) return;
    setSelectedOption(letter);
    submitAnswer(currentQ.id, letter);
  };

  // --- 1. CHOOSE PACKAGE (CHỌN Ô CÂU HỎI KHỞI ĐỘNG - 5 Ô TỔNG) ---
  if (subPhase === 'CHOOSE_PACKAGE' || subPhase === 'PACKAGE_CONFIRMED' || subPhase === 'TURN_INTRO') {
    const packages = room.state.kdPackages || [
      { index: 0, name: 'Ô số 1', count: 5 },
      { index: 1, name: 'Ô số 2', count: 5 },
      { index: 2, name: 'Ô số 3', count: 5 },
      { index: 3, name: 'Ô số 4', count: 5 },
      { index: 4, name: 'Ô số 5', count: 5 },
    ];
    const confirmedIndex = room.state.kdChosenPackageIndex;
    const confirmedPkg = packages.find((p) => p.index === confirmedIndex);

    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">
            Vòng 1: Khởi Động Riêng
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
            LƯỢT THI CỦA: {activePlayer?.name}
          </h2>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-0.5 rounded-full border border-slate-700 mb-4">
            Ghế số {activePlayer?.seat}
          </span>

          {subPhase === 'PACKAGE_CONFIRMED' ? (
            <div className="my-6 p-6 rounded-2xl bg-gradient-to-b from-amber-950/60 to-slate-900 border-2 border-amber-500 flex flex-col items-center gap-2 animate-bounce">
              <Sparkles className="text-amber-400" size={32} />
              <span className="text-xl font-black text-amber-300">
                {activePlayer?.name} đã chọn {confirmedPkg?.name || 'Ô câu hỏi'}!
              </span>
              <span className="text-xs text-slate-400">
                Gói gồm 5 câu hỏi trắc nghiệm (15s/câu). Bắt đầu sau 2 giây...
              </span>
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 max-w-lg">
                {isMyTurn ? (
                  <span className="text-amber-300 font-bold">
                    Đến lượt bạn! Hãy chọn 1 trong 5 ô câu hỏi dưới đây (10 giây):
                  </span>
                ) : (
                  <span>Đang chờ thí sinh chọn ô câu hỏi...</span>
                )}
              </p>

              <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={10} className="mb-6" />

              {/* 5 Ô câu hỏi tổng */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full">
                {packages.map((pkg) => {
                  const isChosen = Boolean(pkg.chosenBy);
                  const canClick = isMyTurn && !isChosen;

                  return (
                    <button
                      key={pkg.index}
                      disabled={!canClick}
                      onClick={() => chooseKdPackage(pkg.index)}
                      className={`relative p-4 rounded-2xl flex flex-col items-center justify-between min-h-[160px] border-2 transition-all ${
                        isChosen
                          ? 'bg-slate-950/70 border-slate-800/80 opacity-50 cursor-not-allowed select-none'
                          : canClick
                          ? 'bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/80 hover:border-amber-400 hover:scale-105 shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs ${
                            isChosen
                              ? 'bg-slate-900 border-slate-800 text-slate-600'
                              : 'bg-slate-800 border-slate-700 text-amber-400'
                          }`}
                        >
                          {pkg.index + 1}
                        </div>

                        {isChosen ? (
                          <Lock size={15} className="text-rose-400/80" />
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">15s/câu</span>
                        )}
                      </div>

                      <div className="flex flex-col items-center my-1.5">
                        <Package
                          size={28}
                          className={
                            canClick
                              ? 'text-amber-400 animate-pulse'
                              : isChosen
                              ? 'text-slate-600'
                              : 'text-slate-500'
                          }
                        />
                        <span
                          className={`font-black text-sm sm:text-base tracking-wide mt-1 ${
                            isChosen ? 'text-slate-500 line-through' : 'text-white'
                          }`}
                        >
                          {pkg.name}
                        </span>
                        <span className="text-[11px] text-amber-300/80 font-medium">
                          5 câu hỏi
                        </span>
                      </div>

                      {isChosen ? (
                        <div className="w-full">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/60 truncate block w-full text-center">
                            {pkg.chosenByName ? `Đã chọn: ${pkg.chosenByName}` : 'Đã khóa'}
                          </span>
                        </div>
                      ) : canClick ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold uppercase tracking-wider shadow">
                          Bấm chọn
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">
                          Chưa mở
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Round Header */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
          {currentRound === 'KD_RIENG'
            ? `Khởi Động Riêng - ${activePlayer?.name} (Ghế ${activePlayer?.seat} • Ô số ${(room.state.kdChosenPackageIndex ?? 0) + 1} • Câu ${(room.state.questionIndex ?? 0) + 1}/5)`
            : 'Khởi Động Chung - Giành Chuông (10 Câu)'}
        </span>
        <span className="text-xs text-slate-400 font-mono">
          {currentRound === 'KD_RIENG' ? 'Đúng +10đ | Sai 0đ' : 'Đúng +10đ | Sai/Hết giờ -5đ'}
        </span>
      </div>

      {/* Timer */}
      <CountdownTimer
        deadline={room.state.deadline}
        totalDurationSeconds={
          subPhase === 'QUESTION_BUZZ'
            ? 15
            : subPhase === 'ANSWERING'
            ? 15
            : 15
        }
        className="mb-6"
      />

      {/* BUZZER SCREEN FOR KD_CHUNG */}
      {currentRound === 'KD_CHUNG' && subPhase === 'QUESTION_BUZZ' && (
        <div className="w-full flex flex-col items-center my-4">
          <button
            onClick={buzz}
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 border-4 border-rose-300 shadow-2xl shadow-rose-600/40 flex flex-col items-center justify-center gap-2 buzzer-active cursor-pointer active:scale-95 transition-transform"
          >
            <Bell size={36} className="text-white animate-bounce" />
            <span className="font-black text-white text-base tracking-wider uppercase">
              BẤM CHUÔNG
            </span>
            <span className="text-[10px] text-rose-200 uppercase tracking-widest">(Phím Space)</span>
          </button>

          {buzzRejectedReason && (
            <span className="text-xs text-rose-400 font-semibold mt-3 animate-pulse">
              {buzzRejectedReason}
            </span>
          )}
        </div>
      )}

      {/* Buzzer Winner Announcement */}
      {subPhase === 'ANSWERING' && Boolean(room.state.buzzerLockedBy) && (
        <div className="w-full p-2.5 mb-4 bg-amber-950/60 border border-amber-500/50 rounded-xl text-center text-xs font-bold text-amber-300 animate-bounce">
          Chuông: {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || buzzWinner?.winnerName} đã giành được quyền trả lời!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Câu hỏi
            </span>
            <QuestionSpeakerButton
              question={currentQ}
              autoRead={subPhase === 'QUESTION' || subPhase === 'QUESTION_BUZZ'}
            />
          </div>

          <div className="text-base sm:text-xl font-bold text-slate-100 mb-6 leading-relaxed">
            {currentQ.prompt}
          </div>

          {/* MCQ Options A, B, C, D */}
          {currentQ.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                const isSelected = selectedOption === letter;
                const isAnswer =
                  subPhase === 'REVEAL' && lastReveal?.correctAnswer === letter;
                const isWrongSelection =
                  subPhase === 'REVEAL' && isSelected && !isAnswer;

                return (
                  <button
                    key={letter}
                    onClick={() => handleSelectOption(letter)}
                    disabled={!isMyTurn || selectedOption !== null || subPhase === 'REVEAL'}
                    className={`p-3.5 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      isAnswer
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                        : isWrongSelection
                        ? 'bg-rose-950 border-rose-500 text-rose-200'
                        : isSelected
                        ? 'bg-amber-950 border-amber-500 text-amber-200'
                        : isMyTurn && subPhase !== 'REVEAL'
                        ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200 cursor-pointer hover:border-slate-500'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 cursor-default'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        isAnswer
                          ? 'bg-emerald-500 text-slate-950'
                          : isWrongSelection
                          ? 'bg-rose-500 text-white'
                          : isSelected
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm font-medium leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Reveal Result Info */}
          {subPhase === 'REVEAL' && lastReveal && (
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col items-center">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-slate-400">Đáp án chính xác:</span>
                <span className="text-emerald-400 font-extrabold text-base">
                  {lastReveal.correctAnswer}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Host Override Score Bar removed */}
    </div>
  );
};
