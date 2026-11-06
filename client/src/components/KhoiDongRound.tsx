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

  // Fixed colors for A, B, C, D badges
  const optionBadgeColors: Record<string, string> = {
    A: 'bg-[#FF9292] text-[#171717]',
    B: 'bg-[#66C7F2] text-[#171717]',
    C: 'bg-[#FFE45C] text-[#171717]',
    D: 'bg-[#55D6C2] text-[#171717]',
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
        <div className="w-full bg-white border-3 border-[#171717] rounded-3xl p-6 sm:p-8 shadow-neo-lg flex flex-col items-center">
          <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3.5 py-1 rounded-full border-2 border-[#171717] shadow-neo-sm mb-2">
            Vòng 1: Khởi Động Riêng
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mb-1">
            LƯỢT THI CỦA: {activePlayer?.name}
          </h2>
          <span className="text-xs font-bold text-[#171717] bg-[#FFFDF7] px-3 py-0.5 rounded-full border-2 border-[#171717] shadow-neo-sm mb-4">
            Ghế số {activePlayer?.seat}
          </span>

          {subPhase === 'PACKAGE_CONFIRMED' ? (
            <div className="my-6 p-6 rounded-2xl bg-[#FFE45C] border-3 border-[#171717] shadow-neo-lg flex flex-col items-center gap-2 animate-bounce">
              <Sparkles className="text-[#171717]" size={36} />
              <span className="text-xl font-black text-[#171717]">
                {activePlayer?.name} đã chọn {confirmedPkg?.name || 'Ô câu hỏi'}!
              </span>
              <span className="text-xs font-bold text-[#171717]/80">
                Gói gồm 5 câu hỏi trắc nghiệm (15s/câu). Bắt đầu sau 2 giây...
              </span>
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-[#171717] mb-4 max-w-lg font-medium">
                {isMyTurn ? (
                  <span className="text-[#171717] font-black bg-[#FFE45C] px-3 py-1 rounded-lg border-2 border-[#171717] inline-block shadow-neo-sm">
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
                      className={`relative p-4 rounded-2xl flex flex-col items-center justify-between min-h-[160px] border-2 border-[#171717] transition-all ${
                        isChosen
                          ? 'bg-gray-100 opacity-60 cursor-not-allowed select-none shadow-none text-gray-500'
                          : canClick
                          ? 'bg-white hover:bg-[#FFFDF7] shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer'
                          : 'bg-[#FFFDF7] opacity-80 cursor-not-allowed shadow-neo-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-7 h-7 rounded-full border-2 border-[#171717] flex items-center justify-center font-black text-xs ${
                            isChosen
                              ? 'bg-gray-200 text-gray-500'
                              : 'bg-[#FFE45C] text-[#171717] shadow-neo-sm'
                          }`}
                        >
                          {pkg.index + 1}
                        </div>

                        {isChosen ? (
                          <Lock size={15} className="text-[#FF9292]" />
                        ) : (
                          <span className="text-[10px] text-gray-600 font-bold tabular-nums">15s/câu</span>
                        )}
                      </div>

                      <div className="flex flex-col items-center my-1.5">
                        <Package
                          size={28}
                          className={
                            canClick
                              ? 'text-[#171717] animate-pulse'
                              : isChosen
                              ? 'text-gray-400'
                              : 'text-gray-600'
                          }
                        />
                        <span
                          className={`font-black text-sm sm:text-base tracking-wide mt-1 text-[#171717] ${
                            isChosen ? 'line-through opacity-50' : ''
                          }`}
                        >
                          {pkg.name}
                        </span>
                        <span className="text-[11px] text-gray-600 font-bold">
                          5 câu hỏi
                        </span>
                      </div>

                      {isChosen ? (
                        <div className="w-full">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF9292] text-[#171717] border border-[#171717] font-bold truncate block w-full text-center">
                            {pkg.chosenByName ? `Đã chọn: ${pkg.chosenByName}` : 'Đã khóa'}
                          </span>
                        </div>
                      ) : canClick ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FFE45C] text-[#171717] border-2 border-[#171717] font-black uppercase tracking-wider shadow-neo-sm">
                          Bấm chọn
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-semibold italic">
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
      <div className="w-full flex items-center justify-between mb-4 px-1 gap-2 flex-wrap">
        <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3 py-1 rounded-lg border-2 border-[#171717] shadow-neo-sm">
          {currentRound === 'KD_RIENG'
            ? `Khởi Động Riêng - ${activePlayer?.name} (Ghế ${activePlayer?.seat} • Ô ${(room.state.kdChosenPackageIndex ?? 0) + 1} • Câu ${(room.state.questionIndex ?? 0) + 1}/5)`
            : 'Khởi Động Chung - Giành Chuông (10 Câu)'}
        </span>
        <span className="text-xs text-gray-700 font-bold bg-white border-2 border-[#171717] px-2.5 py-1 rounded-lg shadow-neo-sm tabular-nums">
          {currentRound === 'KD_RIENG' ? 'Đúng +10đ | Sai 0đ' : 'Đúng +10đ | Sai -5đ'}
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
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#FFE45C] hover:bg-[#ffe040] border-4 border-[#171717] shadow-neo-lg flex flex-col items-center justify-center gap-1 buzzer-active cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-neo transition-transform"
          >
            <Bell size={36} className="text-[#171717] animate-bounce" />
            <span className="font-black text-[#171717] text-base tracking-wider uppercase">
              BẤM CHUÔNG
            </span>
            <span className="text-[11px] text-gray-800 font-black uppercase tracking-widest bg-white border border-[#171717] px-2 py-0.5 rounded-full mt-1">
              Phím Space
            </span>
          </button>

          {buzzRejectedReason && (
            <span className="text-xs text-[#FF9292] font-black mt-3 animate-pulse bg-white border-2 border-[#171717] px-3 py-1 rounded-lg shadow-neo-sm">
              {buzzRejectedReason}
            </span>
          )}
        </div>
      )}

      {/* Buzzer Winner Announcement */}
      {subPhase === 'ANSWERING' && Boolean(room.state.buzzerLockedBy) && (
        <div className="w-full p-3 mb-4 bg-[#FFE45C] border-2 border-[#171717] rounded-xl text-center text-xs sm:text-sm font-black text-[#171717] shadow-neo animate-bounce">
          🔔 {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || buzzWinner?.winnerName} đã giành được quyền trả lời!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-white border-3 border-[#171717] rounded-2xl p-6 sm:p-8 shadow-neo-lg">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-black uppercase tracking-wider bg-[#FFE45C] text-[#171717] px-3 py-1 rounded-md border-2 border-[#171717] shadow-neo-sm">
              Câu hỏi
            </span>
            <QuestionSpeakerButton
              question={currentQ}
              autoRead={subPhase === 'QUESTION' || subPhase === 'QUESTION_BUZZ'}
            />
          </div>

          <div className="text-base sm:text-xl font-black text-[#171717] mb-6 leading-relaxed">
            {currentQ.prompt}
          </div>

          {/* MCQ Options A, B, C, D */}
          {currentQ.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    className={`p-3.5 sm:p-4 rounded-xl border-2 border-[#171717] text-left flex items-start gap-3 transition-all ${
                      isAnswer
                        ? 'bg-[#55D6C2] text-[#171717] font-black shadow-neo-lg scale-[1.02]'
                        : isWrongSelection
                        ? 'bg-[#FF9292] text-[#171717] font-bold shadow-neo-lg'
                        : isSelected
                        ? 'bg-[#FFE45C] text-[#171717] font-bold shadow-neo-lg'
                        : isMyTurn && subPhase !== 'REVEAL'
                        ? 'bg-white hover:bg-[#FFFDF7] text-[#171717] shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer'
                        : 'bg-gray-100 text-gray-500 cursor-default opacity-80 shadow-none'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg border-2 border-[#171717] flex items-center justify-center font-black text-xs shrink-0 shadow-neo-sm ${
                        isAnswer
                          ? 'bg-white text-[#171717]'
                          : isWrongSelection
                          ? 'bg-white text-[#171717]'
                          : isSelected
                          ? 'bg-[#171717] text-white'
                          : optionBadgeColors[letter] || 'bg-white text-[#171717]'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm font-bold leading-snug pt-0.5">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Reveal Result Info */}
          {subPhase === 'REVEAL' && lastReveal && (
            <div className="mt-6 pt-4 border-t-2 border-[#171717] flex flex-col items-center">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-gray-700 font-bold uppercase tracking-wider">Đáp án chính xác:</span>
                <span className="bg-[#55D6C2] text-[#171717] px-4 py-1 rounded-xl border-2 border-[#171717] font-black text-lg shadow-neo-sm">
                  {lastReveal.correctAnswer}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
