import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { voiceReader } from '../utils/voiceReader';
import { bgmManager } from '../utils/bgmManager';
import { LogOut, Headphones, Maximize, Minimize, Music, AlertTriangle, X } from 'lucide-react';
import { VolumeSlider } from './VolumeSlider';

export const Navbar: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const leaveRoom = useGameStore((s) => s.leaveRoom);

  const [ttsEnabled, setTtsEnabled] = useState(voiceReader.isEnabled);
  const [bgmEnabled, setBgmEnabled] = useState(bgmManager.isEnabled);
  const [voiceStatus, setVoiceStatus] = useState(voiceReader.voiceStatus);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [ttsVolume, setTtsVolume] = useState(voiceReader.volume);
  const [bgmVolume, setBgmVolume] = useState(bgmManager.volume);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // Theo dõi việc máy có giọng đọc tiếng Việt hay không
  useEffect(() => {
    setVoiceStatus(voiceReader.voiceStatus);
    return voiceReader.subscribeStatus(setVoiceStatus);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleBgm = () => {
    const next = bgmManager.toggle();
    setBgmEnabled(next);
  };

  const toggleTts = () => {
    const next = voiceReader.toggle();
    setTtsEnabled(next);
  };

  const changeTtsVolume = (value: number) => {
    voiceReader.volume = value;
    setTtsVolume(value);
  };

  const changeBgmVolume = (value: number) => {
    bgmManager.volume = value;
    setBgmVolume(value);
  };

  // Thả thanh trượt giọng đọc: đọc thử một câu ngắn để nghe mức âm lượng (không ngắt khi đang đọc câu hỏi)
  const previewVoice = () => {
    if (voiceReader.isEnabled && !voiceReader.isSpeaking) {
      voiceReader.speak('Kiểm tra âm lượng giọng đọc');
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Lỗi khi chuyển chế độ toàn màn hình:', err);
    }
  };

  return (
    <header className="w-full h-14 shrink-0 bg-[#111827]/95 backdrop-blur-md border-b border-[#303D52] px-3 sm:px-6 flex items-center justify-between z-50 shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3">
        {/* Brand Logo ĐẤU TRƯỜNG TRÍ TUỆ */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-8 h-8 rounded-xl bg-[#FFD43B] text-[#090D18] border border-[#FFD43B] flex items-center justify-center font-extrabold font-heading text-sm shadow-glow-yellow transition-transform duration-200 group-hover:scale-105">
            ĐT
          </div>
          <span className="font-heading font-extrabold tracking-tight text-[#F8FAFC] text-base sm:text-lg leading-none group-hover:text-[#FFD43B] transition-colors">
            ĐẤU TRƯỜNG TRÍ TUỆ
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice reading toggle + volume */}
        <button
          onClick={toggleTts}
          className={`flex items-center gap-2 text-xs sm:text-sm font-bold font-heading px-3.5 py-1.5 rounded-xl border transition-all active:scale-95 ${
            ttsEnabled
              ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] shadow-glow-yellow'
              : 'bg-[#1C2638] text-[#94A3B8] border-[#303D52] hover:border-[#00D9FF] hover:text-[#F8FAFC]'
          }`}
          title={ttsEnabled ? 'Tắt đọc câu hỏi (Tiếng Việt)' : 'Bật đọc câu hỏi (Tiếng Việt)'}
        >
          <Headphones size={17} className="stroke-[2.5]" />
          <span className="hidden sm:inline">
            {ttsEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT'}
          </span>
        </button>
        {/* Thiết bị không có giọng tiếng Việt: giọng đọc bị tắt để khỏi đọc nhầm bằng tiếng Anh */}
        {voiceStatus === 'missing' && (
          <div className="relative">
            <button
              onClick={() => setShowVoiceHelp((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold font-heading px-2.5 py-1.5 rounded-xl bg-[#FB923C]/15 text-[#FB923C] border border-[#FB923C]/60 hover:bg-[#FB923C]/25 transition-colors"
              title="Máy chưa có giọng đọc tiếng Việt: bấm để xem cách cài"
              aria-label="Máy chưa có giọng đọc tiếng Việt"
              aria-expanded={showVoiceHelp}
            >
              <AlertTriangle size={16} className="stroke-[2.5]" />
              <span className="hidden lg:inline">Chưa có giọng Việt</span>
            </button>
            {showVoiceHelp && (
              <div
                role="dialog"
                className="absolute right-0 top-full mt-2 w-[min(22rem,90vw)] z-[60] rounded-2xl bg-[#111827] border border-[#FB923C]/60 shadow-2xl p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-heading font-black text-sm text-[#FB923C]">Thiết bị chưa có giọng đọc tiếng Việt</p>
                  <button onClick={() => setShowVoiceHelp(false)} className="text-[#94A3B8] hover:text-white" aria-label="Đóng">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-[#94A3B8] mb-2">
                  Giọng đọc câu hỏi đã được tạm tắt trên máy này để không đọc nhầm bằng tiếng Anh. Cài giọng tiếng Việt rồi tải lại trang:
                </p>
                <ul className="space-y-1.5 text-xs text-[#F8FAFC] list-disc pl-4">
                  <li><b>Windows:</b> Cài đặt → Thời gian &amp; ngôn ngữ → Giọng nói → Thêm giọng nói → Tiếng Việt. Hoặc dùng trình duyệt <b>Microsoft Edge</b> (có sẵn giọng Hoài My, Nam Minh).</li>
                  <li><b>Android:</b> Cài đặt → Chuyển văn bản thành giọng nói → Google → cài dữ liệu giọng nói Tiếng Việt.</li>
                  <li><b>iPhone / iPad / Mac:</b> Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt (Linh).</li>
                </ul>
              </div>
            )}
          </div>
        )}
        <VolumeSlider
          className="hidden xl:flex"
          label="Âm lượng giọng đọc"
          value={ttsVolume}
          onChange={changeTtsVolume}
          onCommit={previewVoice}
          dimmed={!ttsEnabled}
        />

        {/* BGM Music toggle */}
        <button
          onClick={toggleBgm}
          className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold font-heading px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
            bgmEnabled
              ? 'bg-[#1C2638] text-[#FFD43B] border-[#FFD43B]/60 shadow-glow-yellow'
              : 'bg-[#1C2638] text-[#64748B] border-[#303D52] hover:text-[#94A3B8]'
          }`}
          title={bgmEnabled ? 'Nhạc nền: Đang BẬT (bấm để tắt)' : 'Nhạc nền: Đang TẮT (bấm để bật)'}
        >
          <Music size={17} className={`stroke-[2.5] ${bgmEnabled ? 'animate-pulse text-[#FFD43B]' : 'text-[#64748B]'}`} />
          <span className="hidden md:inline">
            {bgmEnabled ? 'Nhạc nền: BẬT' : 'Nhạc nền: TẮT'}
          </span>
        </button>
        <VolumeSlider
          className="hidden xl:flex"
          label="Âm lượng nhạc nền"
          value={bgmVolume}
          onChange={changeBgmVolume}
          dimmed={!bgmEnabled}
        />

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className={`p-2 sm:p-2.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center ${
            isFullscreen
              ? 'bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF] shadow-glow-cyan'
              : 'bg-[#1C2638] text-[#94A3B8] hover:text-[#00D9FF] hover:border-[#00D9FF] border-[#303D52] hover:shadow-glow-cyan'
          }`}
          title={isFullscreen ? 'Thu nhỏ màn hình (Esc)' : 'Mở toàn màn hình (F11)'}
          aria-label={isFullscreen ? 'Thu nhỏ màn hình' : 'Mở toàn màn hình'}
        >
          {isFullscreen ? (
            <Minimize size={18} className="stroke-[2.5]" />
          ) : (
            <Maximize size={18} className="stroke-[2.5]" />
          )}
        </button>

        {/* Leave room button */}
        {room && (
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold font-heading px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#1C2638] hover:bg-[#FF496C] text-[#FF496C] hover:text-white border border-[#FF496C]/50 hover:border-[#FF496C] transition-all active:scale-95 hover:shadow-glow-danger"
            title="Rời phòng"
          >
            <LogOut size={16} className="stroke-[2.5]" />
            <span className="hidden sm:inline">Rời phòng</span>
          </button>
        )}
      </div>
    </header>
  );
};
