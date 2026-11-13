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
    <header className="relative w-full h-14 shrink-0 bg-[#05060F]/70 backdrop-blur-xl border-b border-[#262E66]/80 px-3 sm:px-6 flex items-center justify-between z-50">
      <span className="nav-hairline" aria-hidden="true" />
      <div className="flex items-center gap-3">
        {/* Brand Logo ĐẤU TRƯỜNG TRÍ TUỆ */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          {/* Biểu tượng: hành tinh có vòng quỹ đạo và một vệ tinh đang xoay */}
          <svg viewBox="0 0 36 36" className="w-9 h-9 shrink-0 overflow-visible" aria-hidden="true">
            <defs>
              <radialGradient id="nav-planet" cx="35%" cy="30%" r="75%">
                <stop offset="0" stopColor="#FBE0A8" />
                <stop offset="0.55" stopColor="#9B7BFF" />
                <stop offset="1" stopColor="#2A2470" />
              </radialGradient>
            </defs>
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#7CB4FF" strokeOpacity="0.28" strokeWidth="0.8" />
            <circle cx="18" cy="18" r="8.2" fill="url(#nav-planet)" />
            <g className="orbit-ring">
              <ellipse cx="18" cy="18" rx="15.5" ry="15.5" fill="none" />
              <circle cx="18" cy="2.5" r="1.7" fill="#F7C873" />
            </g>
          </svg>
          <span className="hidden min-[430px]:flex flex-col leading-none min-w-0">
            <span className="font-heading font-bold whitespace-nowrap tracking-[0.08em] sm:tracking-[0.14em] text-[#EEF0FF] text-[11px] min-[400px]:text-sm sm:text-base group-hover:text-[#FBE0A8] transition-colors">
              ĐẤU TRƯỜNG TRÍ TUỆ
            </span>
            <span className="tech-label !text-[0.55rem] !tracking-[0.34em] mt-1 hidden sm:block">Olympia Arena</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Voice reading toggle + volume */}
        <button
          onClick={toggleTts}
          className={`flex items-center gap-2 text-xs sm:text-sm font-bold font-heading px-3.5 py-1.5 rounded-xl border transition-all active:scale-95 ${
            ttsEnabled
              ? 'bg-[#F7C873] text-[#05060F] border-[#F7C873] shadow-glow-yellow'
              : 'bg-[#11163A] text-[#A6ACDB] border-[#262E66] hover:border-[#F7C873]/60 hover:text-[#EEF0FF]'
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
              className="flex items-center gap-1.5 text-xs font-bold font-heading px-2.5 py-1.5 rounded-xl bg-[#D6903F]/15 text-[#D6903F] border border-[#D6903F]/60 hover:bg-[#D6903F]/25 transition-colors"
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
                className="absolute right-0 top-full mt-2 w-[min(22rem,90vw)] z-[60] rounded-2xl bg-[#0A0D22] border border-[#D6903F]/60 shadow-2xl p-4 text-left"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-heading font-black text-sm text-[#D6903F]">Thiết bị chưa có giọng đọc tiếng Việt</p>
                  <button onClick={() => setShowVoiceHelp(false)} className="text-[#A6ACDB] hover:text-white" aria-label="Đóng">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-[#A6ACDB] mb-2">
                  Giọng đọc câu hỏi đã được tạm tắt trên máy này để không đọc nhầm bằng tiếng Anh. Cài giọng tiếng Việt rồi tải lại trang:
                </p>
                <ul className="space-y-1.5 text-xs text-[#EEF0FF] list-disc pl-4">
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
              ? 'bg-[#11163A] text-[#F7C873] border-[#F7C873]/60 shadow-glow-yellow'
              : 'bg-[#11163A] text-[#6D75AD] border-[#262E66] hover:text-[#A6ACDB]'
          }`}
          title={bgmEnabled ? 'Nhạc nền: Đang BẬT (bấm để tắt)' : 'Nhạc nền: Đang TẮT (bấm để bật)'}
        >
          <Music size={17} className={`stroke-[2.5] ${bgmEnabled ? 'animate-pulse text-[#F7C873]' : 'text-[#6D75AD]'}`} />
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
              ? 'bg-[#B9C0EA]/20 text-[#B9C0EA] border-[#B9C0EA] shadow-glow-cyan'
              : 'bg-[#11163A] text-[#A6ACDB] hover:text-[#B9C0EA] hover:border-[#F7C873]/60 border-[#262E66] hover:shadow-glow-yellow'
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
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold font-heading px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#11163A] hover:bg-[#FF5D8F] text-[#FF5D8F] hover:text-white border border-[#FF5D8F]/50 hover:border-[#FF5D8F] transition-all active:scale-95 hover:shadow-glow-danger"
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
