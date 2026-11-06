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
    <header className="w-full bg-white border-b-2 border-[#171717] px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-[0_3px_0px_0px_#171717]">
      <div className="flex items-center gap-3">
        {/* Brand Logo ĐẤU TRƯỜNG TRÍ TUỆ */}
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-9 h-9 rounded-lg bg-[#FFE45C] border-2 border-[#171717] flex items-center justify-center font-extrabold text-[#171717] text-sm sm:text-base shadow-neo-sm">
            ĐT
          </div>
          <span className="font-extrabold tracking-tight text-[#171717] text-base sm:text-lg leading-none">
            ĐẤU TRƯỜNG TRÍ TUỆ
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice reading toggle */}
        <button
          onClick={toggleTts}
          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border-2 border-[#171717] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shadow-neo-sm ${
            ttsEnabled
              ? 'bg-[#FFE45C] text-[#171717]'
              : 'bg-white hover:bg-slate-100 text-[#666666]'
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
          className="p-2 rounded-lg bg-white hover:bg-[#FFE45C] text-[#171717] border-2 border-[#171717] shadow-neo-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {muted ? <VolumeX size={16} className="stroke-[2.5]" /> : <Volume2 size={16} className="stroke-[2.5]" />}
        </button>

        {/* Leave room button */}
        {room && (
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-[#FF9292] hover:bg-rose-300 text-[#171717] border-2 border-[#171717] shadow-neo-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
