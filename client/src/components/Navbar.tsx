import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/soundEffects';
import { voiceReader } from '../utils/voiceReader';
import { bgmManager } from '../utils/bgmManager';
import { Volume2, VolumeX, Copy, Check, LogOut, Radio, Music, Mic, MicOff } from 'lucide-react';

export const Navbar: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const connected = useGameStore((s) => s.connected);
  const leaveRoom = useGameStore((s) => s.leaveRoom);

  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(soundManager.isMuted);
  const [voiceEnabled, setVoiceEnabled] = useState(voiceReader.isEnabled);
  const [bgmEnabled, setBgmEnabled] = useState(bgmManager.isEnabled);

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

  const toggleVoice = () => {
    const newVal = voiceReader.toggle();
    setVoiceEnabled(newVal);
  };

  const toggleBgm = () => {
    const newVal = bgmManager.toggle();
    setBgmEnabled(newVal);
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 sm:gap-3">
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

      <div className="flex items-center gap-1.5 sm:gap-2">
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

        {/* Voice TTS Toggle */}
        <button
          onClick={toggleVoice}
          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold ${
            voiceEnabled
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/80 opacity-60'
          }`}
          title={voiceEnabled ? 'Giọng đọc câu hỏi: ĐANG BẬT (Bấm để tắt)' : 'Giọng đọc câu hỏi: ĐANG TẮT (Bấm để bật)'}
        >
          {voiceEnabled ? <Mic size={15} className="text-amber-400" /> : <MicOff size={15} />}
          <span className="hidden xl:inline">{voiceEnabled ? 'Giọng đọc' : 'Giọng đọc tắt'}</span>
        </button>

        {/* BGM Music Toggle */}
        <button
          onClick={toggleBgm}
          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-semibold ${
            bgmEnabled
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700/80 opacity-60'
          }`}
          title={bgmEnabled ? 'Nhạc nền hồi hộp: ĐANG BẬT (Bấm để tắt)' : 'Nhạc nền hồi hộp: ĐANG TẮT (Bấm để bật)'}
        >
          <Music size={15} className={bgmEnabled ? 'text-amber-400' : 'text-slate-400'} />
          <span className="hidden xl:inline">{bgmEnabled ? 'Nhạc nền' : 'Nhạc nền tắt'}</span>
        </button>

        {/* Sound SFX toggle */}
        <button
          onClick={toggleSound}
          className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title={muted ? 'Âm thanh hiệu ứng: TẮT' : 'Âm thanh hiệu ứng: BẬT'}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
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
