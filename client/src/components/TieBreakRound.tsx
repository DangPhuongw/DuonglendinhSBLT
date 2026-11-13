import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { QuestionSpeakerButton } from './QuestionSpeakerButton';
import { voiceReader } from '../utils/voiceReader';
import { Bell, AlertTriangle, Send } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

export const TieBreakRound: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const buzz = useGameStore((s) => s.buzz);
  const buzzWinner = useGameStore((s) => s.buzzWinner);
  const buzzRejectedReason = useGameStore((s) => s.buzzRejectedReason);
  const lastReveal = useGameStore((s) => s.lastReveal);

  const [inputAnswer, setInputAnswer] = useState('');

  const subPhase = room?.state?.subPhase;
  const currentQ = room?.state?.currentQuestion;
  const eligibleIds: string[] = room?.state?.eligiblePlayerIds || [];
  const isEligible = Boolean(myPlayer && eligibleIds.includes(myPlayer.id));
  const isAnswering = Boolean(subPhase === 'ANSWERING' && myPlayer && room?.state?.activePlayerId === myPlayer.id);

  // Space key for buzzer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isEligible && (subPhase === 'WAIT_SIGNAL' || subPhase === 'BUZZ_OPEN')) {
        e.preventDefault();
        buzz();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subPhase, isEligible, buzz]);

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

  if (!room || !myPlayer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || !currentQ || !isAnswering) return;
    submitAnswer(currentQ.id, inputAnswer.trim());
  };

  // DRAW LOTS
  if (subPhase === 'DRAW_LOTS') {
    const winner = room.players.find((p) => p.id === room.state.winnerId);
    return (
      <div className="w-full max-w-md mx-auto p-3 flex flex-col items-center justify-center h-full max-h-full text-center overflow-hidden">
        <div className="w-full bg-[#0A0D22] border border-[#262E66] rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col items-center">
          <span className="text-[10px] sm:text-xs uppercase font-heading font-black bg-[#F7C873]/15 text-[#F7C873] px-3 py-0.5 rounded-full border border-[#F7C873]/40 shadow-glow-yellow mb-1.5">
            BỐC THĂM MAY MẮN
          </span>
          <h2 className="text-xl font-display font-bold text-[#EEF0FF] mb-1 tracking-[0.04em]">PHÂN ĐỊNH THẮNG THUA</h2>
          <p className="text-xs text-[#A6ACDB] font-medium mb-3">
            Sau 3 câu hỏi phụ vẫn bất phân thắng bại, hệ thống bốc thăm ngẫu nhiên:
          </p>
          <div className="text-xl sm:text-2xl font-heading font-black text-[#F7C873] p-4 bg-[#11163A] border-2 border-[#F7C873] rounded-xl shadow-glow-yellow-lg animate-pulse w-full">
            {winner ? (
              <span className="inline-flex items-center gap-2">
                <PlayerAvatar player={winner} size={40} /> {winner.name}
              </span>
            ) : (
              'Đang quay số...'
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto flex flex-col items-center justify-center h-full max-h-full py-1.5 px-3 overflow-hidden">
      <div className="w-full flex items-center justify-between mb-2.5 px-1 gap-2 flex-wrap">
        <span className="text-xs sm:text-sm lg:text-base font-heading font-black uppercase tracking-wider bg-[#F7C873]/15 text-[#F7C873] px-3.5 py-1.5 rounded-xl border border-[#F7C873]/40 shadow-glow-yellow">
          CÂU HỎI PHỤ PHÂN ĐỊNH THẮNG THUA
        </span>
        <span className="text-xs sm:text-sm text-[#A6ACDB] font-bold bg-[#11163A] border border-[#262E66] px-3.5 py-1.5 rounded-xl">
          Đúng thắng chung cuộc
        </span>
      </div>

      <CountdownTimer
        deadline={room.state.deadline}
        totalDurationSeconds={
          subPhase === 'WAIT_SIGNAL' ? 3 : subPhase === 'BUZZ_OPEN' ? 15 : 10
        }
        className="mb-2 sm:mb-3"
      />

      {/* WAIT SIGNAL BANNER */}
      {subPhase === 'WAIT_SIGNAL' && (
        <div className="w-full p-3 mb-2.5 bg-[#FF5D8F]/15 border-2 border-[#FF5D8F] rounded-2xl flex items-center justify-center gap-2.5 shadow-glow-danger animate-pulse">
          <AlertTriangle size={24} className="text-[#FF5D8F] shrink-0" />
          <div className="text-center">
            <span className="text-sm sm:text-base font-heading font-black text-[#FF5D8F] uppercase tracking-widest block leading-none mb-1">
              CHỜ HIỆU LỆNH BẤM CHUÔNG...
            </span>
            <span className="text-xs text-[#FF5D8F]/90 font-bold">
              Bấm chuông trong 3 giây này sẽ bị tước quyền câu này!
            </span>
          </div>
        </div>
      )}

      {/* BUZZ OPEN */}
      {subPhase === 'BUZZ_OPEN' && isEligible && (
        <div className="w-full flex flex-col items-center my-2.5">
          <button
            onClick={buzz}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#F7C873] hover:bg-[#FBE0A8] border-4 border-[#F7C873] shadow-glow-yellow-lg flex flex-col items-center justify-center gap-1 buzzer-active cursor-pointer active:scale-95 transition-transform"
          >
            <Bell size={32} className="text-[#05060F] animate-bounce" />
            <span className="font-heading font-black text-[#05060F] text-xs sm:text-sm tracking-wider uppercase">
              BẤM CHUÔNG
            </span>
            <kbd className="hidden sm:inline-flex items-center justify-center mt-1 px-3.5 py-1 rounded-lg bg-[#05060F] text-[#F7C873] font-heading font-black text-base tracking-[0.25em] shadow-[0_3px_0_rgba(0,0,0,0.45)] ring-2 ring-white/60">
              SPACE
            </kbd>
          </button>
        </div>
      )}

      {buzzRejectedReason && (
        <div className="w-full p-2.5 mb-2.5 bg-[#FF5D8F]/15 border border-[#FF5D8F]/40 rounded-xl text-center text-xs sm:text-sm font-bold text-[#FF5D8F] shadow-glow-danger">
          {buzzRejectedReason}
        </div>
      )}

      {/* Buzzer Winner Announcement */}
      {subPhase === 'ANSWERING' && Boolean(room.state.buzzerLockedBy) && (
        <div className="w-full p-2.5 mb-2.5 bg-[#F7C873]/20 border border-[#F7C873] rounded-xl text-center text-xs sm:text-sm font-heading font-bold text-[#F7C873] shadow-glow-yellow animate-bounce">
          <PlayerAvatar player={room.players.find((p) => p.id === room.state.buzzerLockedBy)} size={26} className="inline-block align-middle mx-1" /> {room.players.find((p) => p.id === room.state.buzzerLockedBy)?.name || buzzWinner?.winnerName} đã giành quyền trả lời câu hỏi!
        </div>
      )}

      {/* Question Card */}
      {currentQ && (
        <div className="w-full bg-[#11163A] border border-[#262E66] rounded-3xl hud p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs sm:text-sm font-heading font-extrabold uppercase tracking-wider bg-[#F7C873]/15 text-[#F7C873] px-3.5 py-1 rounded-lg border border-[#F7C873]/40 shadow-glow-yellow">
              Câu hỏi phụ
            </span>
            <QuestionSpeakerButton
              question={currentQ}
              autoRead={subPhase === 'WAIT_SIGNAL' || subPhase === 'BUZZ_OPEN'}
            />
          </div>

          <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#EEF0FF] mb-3.5 leading-relaxed">
            {currentQ.prompt}
          </p>

          {isAnswering && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Nhập câu trả lời của bạn..."
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                className="flex-1 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[#05060F] border border-[#262E66] rounded-xl text-[#EEF0FF] uppercase placeholder-[#6D75AD] focus:outline-none focus:border-[#F7C873]/70 focus:shadow-glow-yellow text-xs sm:text-sm md:text-base font-heading font-bold tracking-wider transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2 sm:px-6 sm:py-2.5 bg-[#F7C873] hover:bg-[#FBE0A8] text-[#05060F] font-heading font-black rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 transition-all border border-[#F7C873] shadow-glow-yellow hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Send size={15} />
                <span>Gửi</span>
              </button>
            </form>
          )}

          {subPhase === 'REVEAL' && lastReveal && (
            <div className="mt-3.5 pt-2.5 border-t border-[#262E66] flex items-center justify-between">
              <span className="text-xs text-[#A6ACDB] font-heading font-bold uppercase tracking-wider">Đáp án:</span>
              <span className="text-sm sm:text-base font-heading font-black text-[#05060F] bg-[#43E6B5] px-3.5 py-1 rounded-xl shadow-glow-success tracking-wider">
                {lastReveal.correctAnswer}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
