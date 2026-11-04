import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundEffects';
import { voiceReader } from '../utils/voiceReader';
import { Volume2, VolumeX, Copy, Check, LogOut, Radio, Headphones } from 'lucide-react';

export const Navbar: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const connected = useGameStore((s) => s.connected);
  const leaveRoom = useGameStore((s) => s.leaveRoom);

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
    <header className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-sm shadow-md shadow-amber-500/20">
            OL
          </div>
          <span className="font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-sm md:text-base hidden sm:inline">
            OLYMPIA NỘI BỘ
          </span>
        </div>

        {room && (
          <div className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 transition-all">
            <span className="text-xs text-slate-400">Phòng:</span>
            <span className="font-mono font-bold text-amber-400 text-sm tracking-wider">
              {room.code}
            </span>
            <button
              onClick={handleCopyLink}
              title="Sao chép liên kết vào phòng"
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connection status */}
        <div
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
            connected
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
              : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
          }`}
        >
          <Radio size={12} className={connected ? 'animate-pulse' : ''} />
          <span className="hidden md:inline">{connected ? 'Đã kết nối' : 'Mất kết nối'}</span>
        </div>

        {/* Voice reading toggle */}
        <button
          onClick={toggleTts}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
            ttsEnabled
              ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 hover:bg-amber-900/60 shadow-sm shadow-amber-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
          title={ttsEnabled ? 'Tắt đọc câu hỏi (Tiếng Việt)' : 'Bật đọc câu hỏi (Tiếng Việt)'}
        >
          <Headphones size={15} className={ttsEnabled ? 'text-amber-400' : ''} />
          <span className="hidden sm:inline font-medium">
            {ttsEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT'}
          </span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Leave room button */}
        {room && (
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/60 transition-colors"
            title="Rời phòng"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Rời phòng</span>
          </button>
        )}
      </div>
    </header>
  );
};
