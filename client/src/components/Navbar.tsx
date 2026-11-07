import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundEffects';
import { voiceReader } from '../utils/voiceReader';
import { Volume2, VolumeX, LogOut, Headphones } from 'lucide-react';

export const Navbar: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const leaveRoom = useGameStore((s) => s.leaveRoom);

  const [muted, setMuted] = useState(soundManager.isMuted);
  const [ttsEnabled, setTtsEnabled] = useState(voiceReader.isEnabled);

  const toggleSound = () => {
    soundManager.isMuted = !soundManager.isMuted;
    setMuted(soundManager.isMuted);
  };

  const toggleTts = () => {
    const next = voiceReader.toggle();
    setTtsEnabled(next);
  };

  return (
    <header className="w-full bg-[#111827]/95 backdrop-blur-md border-b border-[#303D52] px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3">
        {/* Brand Logo ĐẤU TRƯỜNG TRÍ TUỆ */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-9 h-9 rounded-lg bg-[#FFD43B] text-[#090D18] border border-[#FFD43B] flex items-center justify-center font-extrabold font-heading text-sm sm:text-base shadow-glow-yellow transition-transform duration-200 group-hover:scale-105">
            ĐT
          </div>
          <span className="font-heading font-extrabold tracking-tight text-[#F8FAFC] text-base sm:text-lg leading-none group-hover:text-[#FFD43B] transition-colors">
            ĐẤU TRƯỜNG TRÍ TUỆ
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice reading toggle */}
        <button
          onClick={toggleTts}
          className={`flex items-center gap-1.5 text-xs font-bold font-heading px-3 py-1.5 rounded-lg border transition-all active:scale-95 ${
            ttsEnabled
              ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] shadow-glow-yellow'
              : 'bg-[#1C2638] text-[#94A3B8] border-[#303D52] hover:border-[#00D9FF] hover:text-[#F8FAFC]'
          }`}
          title={ttsEnabled ? 'Tắt đọc câu hỏi (Tiếng Việt)' : 'Bật đọc câu hỏi (Tiếng Việt)'}
        >
          <Headphones size={15} className="stroke-[2.5]" />
          <span className="hidden sm:inline">
            {ttsEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT'}
          </span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="p-2 rounded-lg bg-[#1C2638] text-[#94A3B8] hover:text-[#00D9FF] hover:border-[#00D9FF] border border-[#303D52] transition-all active:scale-95 hover:shadow-glow-cyan"
          title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {muted ? <VolumeX size={16} className="stroke-[2.5]" /> : <Volume2 size={16} className="stroke-[2.5]" />}
        </button>

        {/* Leave room button */}
        {room && (
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1 text-xs font-bold font-heading px-3 py-1.5 rounded-lg bg-[#1C2638] hover:bg-[#FF496C] text-[#FF496C] hover:text-white border border-[#FF496C]/50 hover:border-[#FF496C] transition-all active:scale-95 hover:shadow-glow-danger"
            title="Rời phòng"
          >
            <LogOut size={14} className="stroke-[2.5]" />
            <span className="hidden sm:inline">Rời phòng</span>
          </button>
        )}
      </div>
    </header>
  );
};
