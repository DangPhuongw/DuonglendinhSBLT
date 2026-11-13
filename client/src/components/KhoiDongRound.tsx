import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Bell, Sparkles, Lock, Eye } from 'lucide-react';
import { GAME_CONFIG } from '@olympia/shared';
import { LockedBuzzer } from './LockedBuzzer';
import { useBuzzLock } from '../utils/useBuzzLock';
import { KdChungIntro } from './KdChungIntro';
import { PlayerAvatar } from './PlayerAvatar';

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
  // Chuông khóa 3 giây đầu lượt giành chuông, đếm ngược đến mili giây
  const buzzLockMs = useBuzzLock(room?.state?.buzzUnlockAt);
  const buzzLocked = buzzLockMs > 0;

  const currentRound = room?.state?.round; // 'KD_RIENG' or 'KD_CHUNG'
  const subPhase = room?.state?.subPhase;
  const currentQ = room?.state?.currentQuestion;
  const activePlayer = room?.players.find((p) => p.id === room.state.activePlayerId);
  const isViewer = myPlayer?.role === 'viewer';
  const isMyTurn = Boolean(!isViewer && myPlayer && room?.state?.activePlayerId === myPlayer.id);

  // Active player result from lastReveal or room.state or local selectedOption
  const activeResult = subPhase === 'REVEAL'
    ? (lastReveal?.results?.find((r) => r.playerId === activePlayer?.id) || lastReveal?.results?.[0])
    : null;
  const activeAnswer = (
    subPhase === 'REVEAL'
      ? (activeResult?.answer || room?.state?.activeAnswer)
      : (isMyTurn ? selectedOption : room?.state?.activeAnswer)
  )
    ?.toString()
    ?.toUpperCase()
    ?.trim() || null;

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
        if (buzzLocked) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        buzz();
        return;
      }

      // 1-5 for picking package if active player
      if (isMyTurn && subPhase === 'CHOOSE_PACKAGE') {
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          const index = parseInt(e.key, 10) - 1;
          const pkgs = room?.state?.kdPackages || [];
          // Phím 1-5 ứng với ô thứ 1-5 đang hiện (không phải chỉ số gói)
          if (pkgs[index] && !pkgs[index].chosenBy) {
            chooseKdPackage(pkgs[index].index);
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
  }, [currentRound, subPhase, isMyTurn, currentQ, selectedOption, buzz, submitAnswer, buzzLocked]);

  if (!room || !myPlayer) return null;

  if (currentRound === 'KD_CHUNG' && subPhase === 'INTRO') {
    return <KdChungIntro deadline={room.state.deadline} />;
  }

  const handleSelectOption = (letter: string) => {
    if (!isMyTurn || selectedOption || !currentQ) return;
    setSelectedOption(letter);
    submitAnswer(currentQ.id, letter);
  };

  // Fixed colors for A, B, C, D badges
  const optionBadgeColors: Record<string, string> = {
    A: 'bg-[#FF5D8F]/20 border border-[#FF5D8F] text-[#FF5D8F]',
    B: 'bg-[#B9C0EA]/20 border border-[#B9C0EA] text-[#B9C0EA]',
    C: 'bg-[#F7C873]/20 border border-[#F7C873] text-[#F7C873]',
    D: 'bg-[#43E6B5]/20 border border-[#43E6B5] text-[#43E6B5]',
  };

  // 5 Palette Colors for 5 Mystery Boxes
  const packageThemes = [
    { border: 'border-[#F7C873]', text: 'text-[#F7C873]', glow: 'hover:shadow-glow-yellow', bgGlow: 'bg-[#F7C873]/10' }, // Ô 1: Vàng
    { border: 'border-[#B9C0EA]', text: 'text-[#B9C0EA]', glow: 'hover:shadow-glow-yellow', bgGlow: 'bg-[#B9C0EA]/10' }, // Ô 2: Cyan
    { border: 'border-[#FF5D8F]', text: 'text-[#FF5D8F]', glow: 'hover:shadow-glow-danger', bgGlow: 'bg-[#FF5D8F]/10' }, // Ô 3: Đỏ/Hồng
    { border: 'border-[#43E6B5]', text: 'text-[#43E6B5]', glow: 'hover:shadow-glow-success', bgGlow: 'bg-[#43E6B5]/10' }, // Ô 4: Xanh Mint
    { border: 'border-[#D1A55A]', text: 'text-[#D1A55A]', glow: 'hover:shadow-glow-purple', bgGlow: 'bg-[#D1A55A]/10' }, // Ô 5: Tím Lavender
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
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center h-full max-h-full py-1.5 px-2 overflow-hidden text-center">
        <div className="w-full bg-[#0A0D22] border border-[#262E66] rounded-3xl hud p-4 sm:p-6 shadow-2xl flex flex-col items-center">
          <span className="text-xs font-heading font-extrabold uppercase tracking-wider bg-[#F7C873]/15 text-[#F7C873] px-3.5 py-1 rounded-full border border-[#F7C873]/40 shadow-glow-yellow mb-1.5">
            Vòng 1: Khởi Động Riêng
          </span>
          <PlayerAvatar player={activePlayer} size={64} className="ring-2 ring-[#F7C873] shadow-glow-yellow mb-1.5" />
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#EEF0FF] mb-1">
            LƯỢT THI CỦA: {activePlayer?.name}
          </h2>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xs font-heading font-bold text-[#F7C873] bg-[#11163A] px-3 py-0.5 rounded-full border border-[#262E66]">
              Ghế số {activePlayer?.seat}
            </span>
            <span className="text-xs font-bold text-[#A6ACDB] bg-[#05060F] px-3 py-0.5 rounded-full border border-[#262E66]">
              6 câu hỏi • 15s/câu
            </span>
          </div>

          {subPhase === 'PACKAGE_CONFIRMED' ? (
            <div className="my-4 p-5 rounded-2xl bg-[#11163A] border-2 border-[#F7C873] shadow-glow-yellow-lg flex flex-col items-center gap-2 animate-bounce">
              <Sparkles className="text-[#F7C873]" size={32} />
              <span className="text-lg sm:text-xl font-heading font-black text-[#F7C873]">
                {activePlayer?.name} đã chọn {confirmedPkg?.name || 'Ô câu hỏi'}!
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#A6ACDB]">
                Gói gồm 6 câu hỏi trắc nghiệm (15s/câu). Bắt đầu sau 2 giây...
              </span>
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm text-[#EEF0FF] mb-2.5 max-w-lg font-medium">
                {isMyTurn ? (
                  <span className="text-[#F7C873] font-heading font-bold bg-[#F7C873]/10 px-3 py-1 rounded-lg border border-[#F7C873]/40 inline-block shadow-glow-yellow text-xs sm:text-sm">
                    Đến lượt bạn! Bấm chọn 1 ô hoặc nhấn phím 1 - 5 (10 giây):
                  </span>
                ) : (
                  <span className="text-[#A6ACDB] font-bold text-xs sm:text-sm">Đang chờ thí sinh chọn ô câu hỏi...</span>
                )}
              </p>

              <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={10} className="mb-3.5" />

              {/* 5 MYSTERY BOXES - COLORFUL & CLEAN */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5 w-full">
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
                      className={`group relative p-2.5 sm:p-3.5 rounded-2xl flex flex-col items-center justify-between min-h-[130px] sm:min-h-[148px] border transition-all ${
                        isChosen
                          ? 'bg-[#05060F]/60 opacity-40 cursor-not-allowed select-none shadow-none text-[#6D75AD] border-[#262E66]/40'
                          : canClick
                          ? `bg-[#11163A] ${theme.border} ${theme.glow} hover:scale-105 active:scale-95 cursor-pointer`
                          : `bg-[#11163A] opacity-60 ${theme.border} cursor-not-allowed`
                      }`}
                    >
                      {/* Top: Box Number Chip */}
                      <div className="w-full flex items-center justify-center">
                        <span className={`text-[11px] font-heading font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border flex items-center gap-1 ${
                          isChosen
                            ? 'bg-[#05060F] text-[#6D75AD] border-[#262E66]'
                            : 'bg-[#0A0D22] text-[#EEF0FF] border-[#262E66]'
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
                      <div className="my-1.5 flex flex-col items-center justify-center">
                        <span
                          className={`text-4xl sm:text-5xl font-heading font-black tracking-tight transition-transform duration-200 select-none ${
                            isChosen
                              ? 'text-[#6D75AD] line-through'
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
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#05060F] text-[#A6ACDB] border border-[#262E66] font-bold truncate block w-full text-center">
                            {pkg.chosenByName ? pkg.chosenByName : 'Đã chọn'}
                          </span>
                        ) : canClick ? (
                          <span className="text-[11px] px-3 py-0.5 rounded-lg bg-[#F7C873] text-[#05060F] font-heading font-extrabold uppercase tracking-wider block text-center shadow-glow-yellow group-hover:bg-[#FBE0A8] transition-colors">
                            Chọn
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#6D75AD] font-bold italic block text-center">
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
    <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex flex-col items-center justify-center h-full max-h-full py-1.5 px-3 overflow-hidden">
      {/* Round Header */}
      <div className="w-full flex items-center justify-between mb-2.5 px-1 gap-2 flex-wrap">
        <span className="text-xs sm:text-sm lg:text-base font-heading font-extrabold uppercase tracking-wider bg-[#F7C873]/15 text-[#F7C873] px-3.5 py-1.5 rounded-xl border border-[#F7C873]/40 shadow-glow-yellow">
          {currentRound === 'KD_RIENG'
            ? `KHỞI ĐỘNG RIÊNG - LƯỢT CỦA ${activePlayer?.name?.toUpperCase() || 'THÍ SINH'} - ${(room.state.questionIndex ?? 0) + 1}/${GAME_CONFIG.KHOI_DONG.RIENG_QUESTIONS_PER_PLAYER} CÂU`
            : `KHỞI ĐỘNG CHUNG - GIÀNH CHUÔNG - CÂU ${(room.state.questionIndex ?? 0) + 1}/${GAME_CONFIG.KHOI_DONG.CHUNG_QUESTIONS}`}
        </span>
        <span className="text-xs sm:text-sm text-[#A6ACDB] font-bold bg-[#11163A] border border-[#262E66] px-3.5 py-1.5 rounded-xl tabular-nums">
          {currentRound === 'KD_RIENG' ? 'Đúng +10đ | Sai 0đ' : 'Đúng +10đ | Sai -5đ'}
        </span>
      </div>

      {/* Timer */}
      <CountdownTimer
        deadline={room.state.deadline}
        totalDurationSeconds={
          subPhase === 'QUESTION_BUZZ'
            ? GAME_CONFIG.BUZZ_LOCK_SECONDS + GAME_CONFIG.KHOI_DONG.CHUNG_BUZZ_SECONDS
            : subPhase === 'ANSWERING'
            ? 3
            : 15
        }
        className="mb-3"
      />

      {/* BUZZER SCREEN FOR KD_CHUNG */}
      {currentRound === 'KD_CHUNG' && subPhase === 'QUESTION_BUZZ' && (
        <div className="w-full flex flex-col items-center my-1.5 sm:my-3">
          {isViewer ? (
            <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-[#11163A] border-2 border-[#B9C0EA]/50 shadow-glow-cyan flex flex-col items-center justify-center gap-1.5 p-3 text-center">
              <Eye size={28} className="text-[#B9C0EA] animate-pulse" />
              <span className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-[#B9C0EA]">
                KHÁN GIẢ
              </span>
              <span className="text-xs text-[#A6ACDB] leading-tight">
                Chờ thí sinh bấm chuông
              </span>
            </div>
          ) : buzzLocked ? (
            <LockedBuzzer
              remainingMs={buzzLockMs}
              totalMs={GAME_CONFIG.BUZZ_LOCK_SECONDS * 1000}
              accent="#F7C873"
            />
          ) : (
            <button
              onClick={buzz}
              className="w-24 h-24 sm:w-40 sm:h-40 rounded-full bg-[#F7C873] hover:bg-[#FBE0A8] border-4 border-[#F7C873] shadow-glow-yellow-lg flex flex-col items-center justify-center gap-1 buzzer-active cursor-pointer active:scale-95 transition-transform"
            >
              <Bell size={32} className="text-[#05060F] animate-bounce" />
              <span className="font-heading font-black text-[#05060F] text-sm sm:text-base tracking-wider uppercase">
                BẤM CHUÔNG
              </span>
              <kbd className="hidden sm:inline-flex items-center justify-center mt-1 px-3.5 py-1 rounded-lg bg-[#05060F] text-[#F7C873] font-heading font-black text-base tracking-[0.25em] shadow-[0_3px_0_rgba(0,0,0,0.45)] ring-2 ring-white/60">
                SPACE
              </kbd>
            </button>
          )}

          {buzzRejectedReason && (
            <span className="text-xs sm:text-sm text-[#FF5D8F] font-bold mt-2.5 animate-pulse bg-[#FF5D8F]/10 border border-[#FF5D8F]/40 px-3.5 py-1 rounded-xl">
              {buzzRejectedReason}
            </span>
          )}
        </div>
      )}

      {/* Buzzer Winner Announcement */}
      {subPhase === 'ANSWERING' && Boolean(room.state.buzzerLockedBy) && (
        <div className="w-full p-2.5 mb-2.5 bg-[#F7C873]/20 border border-[#F7C873] rounded-xl text-center text-xs sm:text-sm font-heading font-bold text-[#F7C873] shadow-glow-yellow animate-bounce">
          <PlayerAvatar player={room.players.find((p) => p.id === room.state.buzzerLockedBy)} size={26} className="inline-block align-middle mx-1" /> {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || buzzWinner?.winnerName} đã giành được quyền trả lời (3 giây)!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-[#11163A] border border-[#262E66] rounded-3xl hud p-3.5 sm:p-6 shadow-2xl relative">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider bg-[#F7C873]/15 text-[#F7C873] px-3.5 py-1 rounded-lg border border-[#F7C873]/40 shadow-glow-yellow">
              Câu hỏi
            </span>
            <QuestionSpeakerButton
              question={currentQ}
              autoRead={subPhase === 'QUESTION' || subPhase === 'QUESTION_BUZZ'}
            />
          </div>

          <div className="text-base sm:text-xl md:text-2xl font-bold text-[#EEF0FF] mb-3 sm:mb-4 leading-relaxed">
            {currentQ.prompt}
          </div>

          {/* MCQ Options A, B, C, D */}
          {currentQ.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5">
              {currentQ.options.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                const isChosenByActive = activeAnswer === letter || (isMyTurn && selectedOption === letter);
                const isAnswer =
                  subPhase === 'REVEAL' && lastReveal?.correctAnswer === letter;
                const isWrongSelection =
                  subPhase === 'REVEAL' && isChosenByActive && !isAnswer;
                const isCorrectSelection =
                  subPhase === 'REVEAL' && isChosenByActive && isAnswer;

                return (
                  <button
                    key={letter}
                    onClick={() => handleSelectOption(letter)}
                    disabled={!isMyTurn || selectedOption !== null || subPhase === 'REVEAL'}
                    className={`p-2.5 sm:p-4 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                      isAnswer
                        ? 'bg-[#43E6B5]/20 border-2 border-[#43E6B5] text-[#43E6B5] font-bold shadow-glow-success scale-[1.01]'
                        : isWrongSelection
                        ? 'bg-[#FF5D8F]/20 border-2 border-[#FF5D8F] text-[#FF5D8F] font-bold shadow-glow-danger'
                        : isChosenByActive && subPhase !== 'REVEAL'
                        ? 'bg-[#F7C873]/20 border-2 border-[#F7C873] text-[#F7C873] font-bold shadow-glow-yellow'
                        : isMyTurn && subPhase !== 'REVEAL'
                        ? 'bg-[#0A0D22] hover:bg-[#080B1E] border-[#262E66] hover:border-[#F7C873]/60 hover:shadow-glow-yellow text-[#EEF0FF] cursor-pointer active:scale-95'
                        : 'bg-[#0A0D22]/60 text-[#6D75AD] border-[#262E66]/40 cursor-default opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-heading font-black text-xs sm:text-sm shrink-0 ${
                          isAnswer
                            ? 'bg-[#43E6B5] text-[#05060F]'
                            : isWrongSelection
                            ? 'bg-[#FF5D8F] text-[#05060F]'
                            : isChosenByActive
                            ? 'bg-[#F7C873] text-[#05060F]'
                            : optionBadgeColors[letter] || 'bg-[#11163A] text-[#EEF0FF] border border-[#262E66]'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm sm:text-base font-medium leading-snug pt-0.5">{opt}</span>
                    </div>

                    {/* Badge indicator on option for who selected it */}
                    {subPhase === 'REVEAL' && (
                      <div className="shrink-0 pt-0.5">
                        {isWrongSelection && (
                          <span className="text-[10px] sm:text-xs font-heading font-extrabold px-2 py-0.5 rounded-md bg-[#FF5D8F] text-white shadow-glow-danger flex items-center gap-1">
                            ✕ {activePlayer?.name || 'Thí sinh'} chọn
                          </span>
                        )}
                        {isCorrectSelection && (
                          <span className="text-[10px] sm:text-xs font-heading font-extrabold px-2 py-0.5 rounded-md bg-[#43E6B5] text-[#05060F] shadow-glow-success flex items-center gap-1">
                            ✓ {activePlayer?.name || 'Thí sinh'} chọn đúng
                          </span>
                        )}
                        {isAnswer && !isCorrectSelection && (
                          <span className="text-[10px] sm:text-xs font-heading font-extrabold px-2 py-0.5 rounded-md bg-[#43E6B5] text-[#05060F] shadow-glow-success flex items-center gap-1">
                            ✓ Đáp án chính xác
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Reveal Result Info */}
          {subPhase === 'REVEAL' && lastReveal && (
            <div className="mt-4 pt-3 border-t border-[#262E66] flex flex-col items-center gap-2.5">
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {activePlayer && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold bg-[#0A0D22] px-3.5 py-1.5 rounded-xl border border-[#262E66] shadow-md">
                    <span className="text-[#A6ACDB] font-heading uppercase tracking-wider text-xs">
                      {activePlayer.name} đã chọn:
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg font-heading font-black text-xs sm:text-sm border ${
                        activeResult?.isCorrect
                          ? 'bg-[#43E6B5]/20 text-[#43E6B5] border-[#43E6B5]/50 shadow-glow-success'
                          : 'bg-[#FF5D8F]/20 text-[#FF5D8F] border-[#FF5D8F]/50 shadow-glow-danger'
                      }`}
                    >
                      {activeAnswer ? `${activeAnswer}` : 'Không trả lời'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold bg-[#0A0D22] px-3.5 py-1.5 rounded-xl border border-[#262E66] shadow-md">
                  <span className="text-[#A6ACDB] font-heading uppercase tracking-wider text-xs">Đáp án:</span>
                  <span className="bg-[#43E6B5] text-[#05060F] px-3 py-0.5 rounded-lg font-heading font-black text-xs sm:text-sm shadow-glow-success">
                    {lastReveal.correctAnswer}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
