import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundEffects';
import { voiceReader } from '../utils/voiceReader';
import { Volume2, VolumeX, Copy, Check, LogOut, Radio, Headphones, FastForward } from 'lucide-react';

export const Navbar: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const connected = useGameStore((s) => s.connected);
  const leaveRoom = useGameStore((s) => s.leaveRoom);
  const jumpToRound = useGameStore((s) => s.jumpToRound);

  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(soundManager.isMuted);
  const [ttsEnabled, setTtsEnabled] = useState(voiceReader.isEnabled);

  const handleCopyLink = () => {
    if (!room) return;
    const url = `${window.location.origin}/?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    soundManager.isMuted = !soundManager.isMuted;
    setMuted(soundManager.isMuted);
  };

  const toggleTts = () => {
    const next = voiceReader.toggle();
    setTtsEnabled(next);
  };

  return (
    <header className="w-full bg-white border-b-2 border-black px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 shadow-[0_3px_0px_0px_#000]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#E8FE36] border-2 border-black flex items-center justify-center font-black text-black text-sm shadow-neo-sm">
            OL
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-tight text-black text-base sm:text-lg leading-none">
              OLYMPIA
            </span>
            <span className="bg-[#E8FE36] px-1.5 py-0.5 border border-black rounded-md shadow-[1px_1px_0px_#000] text-[10px] font-black uppercase text-black">
              Nội bộ
            </span>
          </div>
        </div>

        {room && (
          <div className="flex items-center gap-1.5 bg-white border-2 border-black rounded-xl px-2.5 py-1 shadow-neo-sm">
            <span className="text-xs font-bold text-slate-600">Phòng:</span>
            <span className="font-mono font-black text-black text-sm tracking-wider">
              {room.code}
            </span>
            <button
              onClick={handleCopyLink}
              title="Sao chép liên kết vào phòng"
              className="p-1 hover:bg-[#E8FE36] rounded-md transition-colors text-black"
            >
              {copied ? <Check size={14} className="text-emerald-700 stroke-[3]" /> : <Copy size={14} className="stroke-[2.5]" />}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connection status */}
        <div
          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border-2 border-black shadow-neo-sm ${
            connected
              ? 'bg-[#7BF1A8] text-black'
              : 'bg-rose-200 text-rose-950'
          }`}
        >
          <Radio size={12} className={`stroke-[2.5] ${connected ? 'animate-pulse' : ''}`} />
          <span className="hidden md:inline">{connected ? 'Đã kết nối' : 'Mất kết nối'}</span>
        </div>

        {/* Voice reading toggle */}
        <button
          onClick={toggleTts}
          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl border-2 border-black transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none shadow-neo-sm ${
            ttsEnabled
              ? 'bg-[#E8FE36] text-black'
              : 'bg-white hover:bg-slate-100 text-slate-700'
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
          className="p-2 rounded-xl bg-white hover:bg-[#E8FE36] text-black border-2 border-black shadow-neo-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {muted ? <VolumeX size={16} className="stroke-[2.5]" /> : <Volume2 size={16} className="stroke-[2.5]" />}
        </button>

        {/* Leave room button */}
        {room && (
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-rose-200 hover:bg-rose-300 text-black border-2 border-black shadow-neo-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
