import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Bell, Sparkles, Lock, Eye } from 'lucide-react';

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
  const isViewer = myPlayer?.role === 'viewer';
  const isMyTurn = Boolean(!isViewer && myPlayer && room?.state?.activePlayerId === myPlayer.id);

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

  // Keyboard shortcut listener (1-5 for packages, 1-4 for options, Space for buzzer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space for buzzer (contestants only)
      if (e.code === 'Space' && !isViewer && currentRound === 'KD_CHUNG' && subPhase === 'QUESTION_BUZZ') {
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
    A: 'bg-[#FF496C]/20 border border-[#FF496C] text-[#FF496C]',
    B: 'bg-[#00D9FF]/20 border border-[#00D9FF] text-[#00D9FF]',
    C: 'bg-[#FFD43B]/20 border border-[#FFD43B] text-[#FFD43B]',
    D: 'bg-[#20D6A0]/20 border border-[#20D6A0] text-[#20D6A0]',
  };

  // 5 Palette Colors for 5 Mystery Boxes
  const packageThemes = [
    { border: 'border-[#FFD43B]', text: 'text-[#FFD43B]', glow: 'hover:shadow-glow-yellow', bgGlow: 'bg-[#FFD43B]/10' }, // Ô 1: Vàng
    { border: 'border-[#00D9FF]', text: 'text-[#00D9FF]', glow: 'hover:shadow-glow-cyan', bgGlow: 'bg-[#00D9FF]/10' }, // Ô 2: Cyan
    { border: 'border-[#FF496C]', text: 'text-[#FF496C]', glow: 'hover:shadow-glow-danger', bgGlow: 'bg-[#FF496C]/10' }, // Ô 3: Đỏ/Hồng
    { border: 'border-[#20D6A0]', text: 'text-[#20D6A0]', glow: 'hover:shadow-glow-success', bgGlow: 'bg-[#20D6A0]/10' }, // Ô 4: Xanh Mint
    { border: 'border-[#A855F7]', text: 'text-[#A855F7]', glow: 'hover:shadow-glow-purple', bgGlow: 'bg-[#A855F7]/10' }, // Ô 5: Tím Lavender
  ];

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
        <div className="w-full bg-[#111827] border border-[#303D52] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
          <span className="text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3.5 py-1 rounded-full border border-[#FFD43B]/40 shadow-glow-yellow mb-2">
            Vòng 1: Khởi Động Riêng
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-[#F8FAFC] mb-1">
            LƯỢT THI CỦA: {activePlayer?.name}
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-heading font-bold text-[#FFD43B] bg-[#1C2638] px-3 py-0.5 rounded-full border border-[#303D52]">
              Ghế số {activePlayer?.seat}
            </span>
            <span className="text-xs font-bold text-[#94A3B8] bg-[#090D18] px-3 py-0.5 rounded-full border border-[#303D52]">
              5 câu hỏi • 15s/câu
            </span>
          </div>

          {subPhase === 'PACKAGE_CONFIRMED' ? (
            <div className="my-6 p-6 rounded-2xl bg-[#1C2638] border-2 border-[#FFD43B] shadow-glow-yellow-lg flex flex-col items-center gap-2 animate-bounce">
              <Sparkles className="text-[#FFD43B]" size={36} />
              <span className="text-xl font-heading font-black text-[#FFD43B]">
                {activePlayer?.name} đã chọn {confirmedPkg?.name || 'Ô câu hỏi'}!
              </span>
              <span className="text-xs font-bold text-[#94A3B8]">
                Gói gồm 5 câu hỏi trắc nghiệm (15s/câu). Bắt đầu sau 2 giây...
              </span>
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-[#F8FAFC] mb-4 max-w-lg font-medium">
                {isMyTurn ? (
                  <span className="text-[#FFD43B] font-heading font-bold bg-[#FFD43B]/10 px-3 py-1 rounded-lg border border-[#FFD43B]/40 inline-block shadow-glow-yellow">
                    Đến lượt bạn! Bấm chọn 1 ô hoặc nhấn phím 1 - 5 (10 giây):
                  </span>
                ) : (
                  <span className="text-[#94A3B8] font-bold">Đang chờ thí sinh chọn ô câu hỏi...</span>
                )}
              </p>

              <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={10} className="mb-6" />

              {/* 5 MYSTERY BOXES - COLORFUL & CLEAN */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-3.5 w-full">
                {packages.map((pkg) => {
                  const isChosen = Boolean(pkg.chosenBy);
                  const canClick = isMyTurn && !isChosen;
                  const num = pkg.index + 1;
                  const theme = packageThemes[pkg.index % packageThemes.length];

                  return (
                    <button
                      key={pkg.index}
                      disabled={!canClick}
                      onClick={() => chooseKdPackage(pkg.index)}
                      className={`group relative p-3 sm:p-4 rounded-2xl flex flex-col items-center justify-between min-h-[145px] sm:min-h-[160px] border transition-all ${
                        isChosen
                          ? 'bg-[#090D18]/60 opacity-40 cursor-not-allowed select-none shadow-none text-[#64748B] border-[#303D52]/40'
                          : canClick
                          ? `bg-[#1C2638] ${theme.border} ${theme.glow} hover:scale-105 active:scale-95 cursor-pointer`
                          : `bg-[#1C2638] opacity-60 ${theme.border} cursor-not-allowed`
                      }`}
                    >
                      {/* Top: Box Number Chip */}
                      <div className="w-full flex items-center justify-center">
                        <span className={`text-[11px] font-heading font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border flex items-center gap-1 ${
                          isChosen
                            ? 'bg-[#090D18] text-[#64748B] border-[#303D52]'
                            : 'bg-[#111827] text-[#F8FAFC] border-[#303D52]'
                        }`}>
                          {isChosen ? (
                            <>
                              <Lock size={11} className="stroke-[2.5]" />
                              <span>Đã khóa</span>
                            </>
                          ) : (
                            <span>Ô {num}</span>
                          )}
                        </span>
                      </div>

                      {/* Center: Iconic Mystery Box Question Mark */}
                      <div className="my-2 flex flex-col items-center justify-center">
                        <span
                          className={`text-4xl sm:text-5xl font-heading font-black tracking-tight transition-transform duration-200 select-none ${
                            isChosen
                              ? 'text-[#475569] line-through'
                              : canClick
                              ? `${theme.text} group-hover:scale-125 drop-shadow-[0_0_12px_currentColor]`
                              : theme.text
                          }`}
                        >
                          ?
                        </span>
                      </div>

                      {/* Bottom: Action / Status Badge */}
                      <div className="w-full">
                        {isChosen ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#090D18] text-[#94A3B8] border border-[#303D52] font-bold truncate block w-full text-center">
                            🔒 {pkg.chosenByName ? pkg.chosenByName : 'Đã chọn'}
                          </span>
                        ) : canClick ? (
                          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-[#FFD43B] text-[#090D18] font-heading font-extrabold uppercase tracking-wider block text-center shadow-glow-yellow group-hover:bg-[#ffe066] transition-colors">
                            Chọn
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#64748B] font-bold italic block text-center">
                            Chờ chọn
                          </span>
                        )}
                      </div>
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
        <span className="text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3 py-1 rounded-lg border border-[#FFD43B]/40 shadow-glow-yellow">
          {currentRound === 'KD_RIENG'
            ? `Khởi Động Riêng - ${activePlayer?.name} (Ghế ${activePlayer?.seat} • Ô ${(room.state.kdChosenPackageIndex ?? 0) + 1} • Câu ${(room.state.questionIndex ?? 0) + 1}/5)`
            : 'Khởi Động Chung - Giành Chuông (10 Câu)'}
        </span>
        <span className="text-xs text-[#94A3B8] font-bold bg-[#1C2638] border border-[#303D52] px-2.5 py-1 rounded-lg tabular-nums">
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
            ? 3
            : 15
        }
        className="mb-6"
      />

      {/* BUZZER SCREEN FOR KD_CHUNG */}
      {currentRound === 'KD_CHUNG' && subPhase === 'QUESTION_BUZZ' && (
        <div className="w-full flex flex-col items-center my-4">
          {isViewer ? (
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#1C2638] border-2 border-[#00D9FF]/50 shadow-glow-cyan flex flex-col items-center justify-center gap-1.5 p-4 text-center">
              <Eye size={32} className="text-[#00D9FF] animate-pulse" />
              <span className="font-heading font-black text-xs uppercase tracking-wider text-[#00D9FF]">
                KHÁN GIẢ
              </span>
              <span className="text-[10px] text-[#94A3B8] leading-tight">
                Đang chờ thí sinh bấm chuông giành quyền trả lời
              </span>
            </div>
          ) : (
            <button
              onClick={buzz}
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#FFD43B] hover:bg-[#ffe066] border-4 border-[#FFD43B] shadow-glow-yellow-lg flex flex-col items-center justify-center gap-1 buzzer-active cursor-pointer active:scale-95 transition-transform"
            >
              <Bell size={36} className="text-[#090D18] animate-bounce" />
              <span className="font-heading font-black text-[#090D18] text-base tracking-wider uppercase">
                BẤM CHUÔNG
              </span>
              <span className="text-[11px] text-[#090D18] font-heading font-bold uppercase tracking-widest bg-white/70 px-2 py-0.5 rounded-full mt-1">
                Phím Space
              </span>
            </button>
          )}

          {buzzRejectedReason && (
            <span className="text-xs text-[#FF496C] font-bold mt-3 animate-pulse bg-[#FF496C]/10 border border-[#FF496C]/40 px-3 py-1 rounded-lg">
              {buzzRejectedReason}
            </span>
          )}
        </div>
      )}

      {/* Buzzer Winner Announcement */}
      {subPhase === 'ANSWERING' && Boolean(room.state.buzzerLockedBy) && (
        <div className="w-full p-3 mb-4 bg-[#FFD43B]/20 border border-[#FFD43B] rounded-xl text-center text-xs sm:text-sm font-heading font-bold text-[#FFD43B] shadow-glow-yellow animate-bounce">
          🔔 {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || buzzWinner?.winnerName} đã giành được quyền trả lời (3 giây)!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-[#1C2638] border border-[#303D52] rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="text-xs font-heading font-extrabold uppercase tracking-wider bg-[#FFD43B]/15 text-[#FFD43B] px-3 py-1 rounded-md border border-[#FFD43B]/40 shadow-glow-yellow">
              Câu hỏi
            </span>
            <QuestionSpeakerButton
              question={currentQ}
              autoRead={subPhase === 'QUESTION' || subPhase === 'QUESTION_BUZZ'}
            />
          </div>

          <div className="text-base sm:text-xl font-bold text-[#F8FAFC] mb-6 leading-relaxed">
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
                    className={`p-3.5 sm:p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      isAnswer
                        ? 'bg-[#20D6A0]/20 border-[#20D6A0] text-[#20D6A0] font-bold shadow-glow-success scale-[1.02]'
                        : isWrongSelection
                        ? 'bg-[#FF496C]/20 border-[#FF496C] text-[#FF496C] font-bold shadow-glow-danger'
                        : isSelected
                        ? 'bg-[#FFD43B]/20 border-[#FFD43B] text-[#FFD43B] font-bold shadow-glow-yellow'
                        : isMyTurn && subPhase !== 'REVEAL'
                        ? 'bg-[#111827] hover:bg-[#162132] border-[#303D52] hover:border-[#00D9FF] hover:shadow-glow-cyan text-[#F8FAFC] cursor-pointer active:scale-95'
                        : 'bg-[#111827]/60 text-[#64748B] border-[#303D52]/40 cursor-default opacity-80'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-heading font-bold text-xs shrink-0 ${
                        isAnswer
                          ? 'bg-[#20D6A0] text-[#090D18]'
                          : isWrongSelection
                          ? 'bg-[#FF496C] text-[#090D18]'
                          : isSelected
                          ? 'bg-[#FFD43B] text-[#090D18]'
                          : optionBadgeColors[letter] || 'bg-[#1C2638] text-[#F8FAFC] border border-[#303D52]'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-sm font-medium leading-snug pt-0.5">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Reveal Result Info */}
          {subPhase === 'REVEAL' && lastReveal && (
            <div className="mt-6 pt-4 border-t border-[#303D52] flex flex-col items-center">
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-[#94A3B8] font-heading uppercase tracking-wider">Đáp án chính xác:</span>
                <span className="bg-[#20D6A0] text-[#090D18] px-4 py-1 rounded-xl font-heading font-black text-lg shadow-glow-success">
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
