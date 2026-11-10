import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '@olympia/shared';
import {
  Users,
  Upload,
  Play,
  CheckCircle2,
  Copy,
  Check,
  X,
  Sparkles,
  Download,
  Eye,
  Trophy,
  Shield,
  Info,
} from 'lucide-react';

export const Lobby: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const createRoom = useGameStore((s) => s.createRoom);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const switchSeat = useGameStore((s) => s.switchSeat);
  const startGame = useGameStore((s) => s.startGame);
  const kickPlayer = useGameStore((s) => s.kickPlayer);
  const myToken = useGameStore((s) => s.myToken);

  const [name, setName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState(() => {
    const pathMatch = window.location.pathname.match(/\/r\/([A-Za-z0-9]{6})/);
    const searchParams = new URLSearchParams(window.location.search);
    const fromUrl = pathMatch ? pathMatch[1] : searchParams.get('room');
    return (fromUrl || localStorage.getItem('olympia_room_code') || '').toUpperCase();
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [seatNotice, setSeatNotice] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // If not joined yet:
  if (!room || !myPlayer) {
    const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return setErrorMsg('Vui lòng nhập tên người chơi.');
      setIsCreating(true);
      setErrorMsg('');
      const res = await createRoom(name.trim());
      setIsCreating(false);
      if (!res.ok) setErrorMsg(res.error || 'Tạo phòng thất bại.');
    };

    const handleJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return setErrorMsg('Vui lòng nhập tên người chơi.');
      if (!roomCodeInput.trim()) return setErrorMsg('Vui lòng nhập mã phòng (6 ký tự).');
      setIsJoining(true);
      setErrorMsg('');
      const res = await joinRoom(name.trim(), roomCodeInput.trim().toUpperCase());
      setIsJoining(false);
      if (!res.ok) setErrorMsg(res.error || 'Vào phòng thất bại.');
    };

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-md bg-[#111827]/95 backdrop-blur-xl border-2 border-[#303D52] rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] text-[#F8FAFC] relative">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-block relative mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-[#F8FAFC] tracking-tight relative z-10">
                ĐẤU TRƯỜNG TRÍ TUỆ
              </h1>
              <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-[#FFD43B]/30 blur-sm rounded" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#94A3B8] leading-relaxed">
              Mô phỏng theo format chương trình Đường lên đỉnh Olympia
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-[#FF496C]/15 border border-[#FF496C]/50 rounded-xl text-[#FF496C] text-xs sm:text-sm font-bold shadow-glow-danger text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-heading font-bold text-[#F8FAFC] uppercase tracking-wider mb-1.5">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-full h-12 px-4 bg-[#090D18] border border-[#303D52] rounded-xl text-[#F8FAFC] font-bold placeholder-[#64748B] focus:outline-none focus:border-[#00D9FF] focus:shadow-glow-cyan transition-all text-sm sm:text-base"
              />
            </div>

            <div className="pt-1">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full h-12 bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] font-heading font-extrabold rounded-xl border border-[#FFD43B] shadow-glow-yellow hover:scale-[1.01] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users size={18} className="stroke-[2.5]" />
                <span>{isCreating ? 'Đang tạo phòng...' : 'Tạo phòng mới'}</span>
              </button>
            </div>

            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-[#303D52] w-full" />
              <span className="bg-[#111827] px-3 text-xs text-[#64748B] uppercase font-heading font-bold absolute border border-[#303D52] rounded-md">
                HOẶC
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs sm:text-sm font-heading font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Mã phòng thi
                </label>
                <input
                  type="text"
                  placeholder="Nhập 6 ký tự (Ví dụ: ABC123)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full h-12 px-4 bg-[#090D18] border border-[#303D52] rounded-xl text-[#F8FAFC] uppercase font-digital font-bold tracking-widest placeholder-[#64748B] focus:outline-none focus:border-[#00D9FF] focus:shadow-glow-cyan transition-all text-base text-center tabular-nums"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full h-12 bg-[#1C2638] hover:bg-[#24324a] text-[#F8FAFC] font-heading font-extrabold rounded-xl border border-[#303D52] hover:border-[#00D9FF] hover:shadow-glow-cyan active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isJoining ? 'Đang vào phòng...' : 'Vào phòng thi'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inside Lobby (Waiting Room)
  const isHost = room.hostId === myPlayer.id;
  const myRole = myPlayer.role || 'player';
  const contestants = room.players.filter((p) => (p.role || 'player') === 'player');
  const viewers = room.players.filter((p) => p.role === 'viewer');
  const connectedContestants = contestants.filter((p) => p.connected);
  const canStart = isHost && connectedContestants.length >= GAME_CONFIG.MIN_PLAYERS_FOR_TEST;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSeatClick = async (targetRole: 'player' | 'viewer', targetSeat: 1 | 2 | 3 | 4 | 5) => {
    if (myPlayer.seat === targetSeat && myRole === targetRole) {
      return;
    }

    const isTaken = room.players.some(
      (p) => (p.role || 'player') === targetRole && p.seat === targetSeat && p.id !== myPlayer.id
    );
    if (isTaken) {
      setSeatNotice('Vị trí ghế này đã có người ngồi, vui lòng chọn ghế trống khác.');
      setTimeout(() => setSeatNotice(''), 3000);
      return;
    }

    setSeatNotice('');
    // Instant optimistic role/seat switch
    const res = await switchSeat(targetRole, targetSeat);
    if (!res.ok && res.error) {
      setSeatNotice(res.error);
      setTimeout(() => setSeatNotice(''), 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Đang tải và xử lý bộ đề...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomCode', room.code);
    formData.append('hostToken', myToken || '');

    try {
      const res = await fetch('/api/upload-questions', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setUploadStatus(`Đã nạp và áp dụng thành công bộ đề: ${data.questionSet.title}`);
      } else {
        setUploadStatus(`Lỗi: ${data.error}`);
      }
    } catch (err: any) {
      setUploadStatus(`Lỗi khi nạp file: ${err.message}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between py-1.5 px-2 sm:px-3 max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto overflow-hidden">
      {/* Top Header Bar */}
      <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-heading font-black text-[#F8FAFC] tracking-tight">
            SẢNH CHỜ TRẬN ĐẤU
          </h2>
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <span className="font-heading font-bold uppercase text-[#94A3B8]">Mã phòng:</span>
            <span className="font-digital text-2xl sm:text-3xl lg:text-4xl font-bold tracking-widest text-[#090D18] bg-[#FFD43B] px-3.5 py-0.5 rounded-xl border border-[#FFD43B] shadow-glow-yellow tabular-nums">
              {room.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-[#1C2638] text-[#F8FAFC] hover:text-[#00D9FF] border border-[#303D52] transition-all cursor-pointer active:scale-95"
              title="Sao chép mã phòng"
            >
              {copied ? <Check size={16} className="text-[#20D6A0] stroke-[3]" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Quick Role & Tip Info */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <div className="hidden md:flex items-center gap-1.5 text-[#94A3B8] text-xs sm:text-sm">
            <Info size={15} className="text-[#00D9FF] shrink-0" />
            <span>Bấm ô trống để đổi ghế</span>
          </div>
          {myRole === 'viewer' ? (
            <span className="bg-[#00D9FF]/15 text-[#00D9FF] border border-[#00D9FF]/40 px-3 py-1 rounded-full font-heading font-bold text-xs sm:text-sm shadow-glow-cyan">
              👁️ Bạn: Khán giả {isHost ? '(Chủ phòng)' : ''}
            </span>
          ) : (
            <span className="bg-[#FFD43B]/15 text-[#FFD43B] border border-[#FFD43B]/40 px-3 py-1 rounded-full font-heading font-bold text-xs sm:text-sm shadow-glow-yellow">
              🏆 Bạn: Thí sinh
            </span>
          )}
        </div>
      </div>

      {seatNotice && (
        <div className="w-full my-1.5 p-2.5 bg-[#FF496C]/15 border border-[#FF496C]/50 rounded-xl text-[#FF496C] text-xs sm:text-sm font-bold shadow-glow-danger flex items-center justify-between shrink-0">
          <span>{seatNotice}</span>
          <button onClick={() => setSeatNotice('')} className="text-[#FF496C] hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Center Seats Area: Fitted neatly in the canvas */}
      <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 sm:gap-4 my-2 w-full">
        {/* SECTION 1: 5 CONTESTANT SEATS */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs sm:text-sm lg:text-base uppercase font-heading font-black text-[#F8FAFC] tracking-wider flex items-center gap-2">
              <Trophy size={18} className="text-[#FFD43B]" />
              <span>Bàn Thí Sinh (Thi đấu)</span>
              <span className="bg-[#FFD43B] text-[#090D18] px-2.5 py-0.5 rounded-full font-heading font-black text-xs sm:text-sm shadow-glow-yellow">
                {contestants.length}/5
              </span>
            </h3>
            <span className="text-xs sm:text-sm text-[#94A3B8]">Trực tiếp thi đấu & tính điểm</span>
          </div>
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5">
            {([1, 2, 3, 4, 5] as const).map((seatNum) => {
              const player = room.players.find((p) => (p.role || 'player') === 'player' && p.seat === seatNum);
              const isMe = player && player.id === myPlayer.id;

              return (
                <div
                  key={`player-${seatNum}`}
                  onClick={() => !player && handleSeatClick('player', seatNum)}
                  className={`relative p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center h-[104px] sm:h-[118px] lg:h-[128px] transition-all group ${
                    player
                      ? isMe
                        ? 'bg-[#1C2638] border-2 border-[#FFD43B] shadow-glow-yellow scale-[1.02]'
                        : 'bg-[#111827] border-[#303D52]'
                      : 'bg-[#090D18]/50 border-dashed border-[#303D52]/60 hover:border-[#FFD43B] hover:bg-[#1C2638]/70 hover:shadow-glow-yellow cursor-pointer'
                  }`}
                  title={player ? (isMe ? 'Vị trí của bạn' : player.name) : 'Bấm để đổi sang ghế thí sinh này'}
                >
                  {/* Host kick button */}
                  {isHost && player && !isMe && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        kickPlayer(player.id);
                      }}
                      title={`Mời ${player.name} ra khỏi phòng`}
                      className="absolute top-2 right-2 p-1 rounded-md bg-[#FF496C]/20 hover:bg-[#FF496C] text-[#FF496C] hover:text-white border border-[#FF496C]/50 transition-all z-10"
                    >
                      <X size={13} className="stroke-[2.5]" />
                    </button>
                  )}

                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center font-heading font-black text-sm sm:text-base lg:text-lg mb-1.5 border transition-all ${
                      player
                        ? isMe
                          ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] shadow-glow-yellow'
                          : 'bg-[#1C2638] text-[#FFD43B] border-[#FFD43B]/40'
                        : 'bg-[#0E1524] text-[#64748B] border-[#303D52] group-hover:border-[#FFD43B]/60 group-hover:text-[#FFD43B]'
                    }`}
                  >
                    {seatNum}
                  </div>

                  <span className="font-bold text-xs sm:text-sm md:text-base lg:text-lg text-center truncate max-w-full px-1 text-[#F8FAFC]">
                    {player ? player.name : 'Ghế trống'}
                  </span>

                  {player ? (
                    <span className="text-[11px] sm:text-xs font-medium flex items-center gap-1.5 mt-0.5">
                      {room.hostId === player.id && (
                        <span className="text-[#FFD43B] font-heading font-bold">Host</span>
                      )}
                      {isMe && <span className="text-[#00D9FF] font-heading font-bold">Bạn</span>}
                      {!player.connected && <span className="text-[#FF496C] font-bold">Offline</span>}
                    </span>
                  ) : (
                    <span className="text-xs text-[#FFD43B] opacity-0 group-hover:opacity-100 font-bold transition-opacity mt-0.5">
                      + Chọn ghế
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: 5 VIEWER SEATS */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs sm:text-sm lg:text-base uppercase font-heading font-black text-[#F8FAFC] tracking-wider flex items-center gap-2">
              <Eye size={18} className="text-[#00D9FF]" />
              <span>Khu Vực Người Theo Dõi (Khán giả)</span>
              <span className="bg-[#00D9FF] text-[#090D18] px-2.5 py-0.5 rounded-full font-heading font-black text-xs sm:text-sm shadow-glow-cyan">
                {viewers.length}/5
              </span>
            </h3>
            <span className="text-xs sm:text-sm text-[#94A3B8]">Chỉ xem trực tiếp • Không thi đấu</span>
          </div>
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5">
            {([1, 2, 3, 4, 5] as const).map((seatNum) => {
              const player = room.players.find((p) => p.role === 'viewer' && p.seat === seatNum);
              const isMe = player && player.id === myPlayer.id;

              return (
                <div
                  key={`viewer-${seatNum}`}
                  onClick={() => !player && handleSeatClick('viewer', seatNum)}
                  className={`relative p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center h-[104px] sm:h-[118px] lg:h-[128px] transition-all group ${
                    player
                      ? isMe
                        ? 'bg-[#1C2638] border-2 border-[#00D9FF] shadow-glow-cyan scale-[1.02]'
                        : 'bg-[#111827] border-[#303D52]'
                      : 'bg-[#090D18]/50 border-dashed border-[#303D52]/60 hover:border-[#00D9FF] hover:bg-[#1C2638]/70 hover:shadow-glow-cyan cursor-pointer'
                  }`}
                  title={player ? (isMe ? 'Vị trí của bạn' : player.name) : 'Bấm để đổi sang ghế khán giả này'}
                >
                  {/* Host kick button */}
                  {isHost && player && !isMe && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        kickPlayer(player.id);
                      }}
                      title={`Mời ${player.name} ra khỏi phòng`}
                      className="absolute top-2 right-2 p-1 rounded-md bg-[#FF496C]/20 hover:bg-[#FF496C] text-[#FF496C] hover:text-white border border-[#FF496C]/50 transition-all z-10"
                    >
                      <X size={13} className="stroke-[2.5]" />
                    </button>
                  )}

                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center font-heading font-black text-sm sm:text-base lg:text-lg mb-1.5 border transition-all ${
                      player
                        ? isMe
                          ? 'bg-[#00D9FF] text-[#090D18] border-[#00D9FF] shadow-glow-cyan'
                          : 'bg-[#1C2638] text-[#00D9FF] border-[#00D9FF]/40'
                        : 'bg-[#0E1524] text-[#64748B] border-[#303D52] group-hover:border-[#00D9FF]/60 group-hover:text-[#00D9FF]'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Eye size={15} className="opacity-80" />
                      <span>{seatNum}</span>
                    </div>
                  </div>

                  <span className="font-bold text-xs sm:text-sm md:text-base lg:text-lg text-center truncate max-w-full px-1 text-[#F8FAFC]">
                    {player ? player.name : 'Ghế trống'}
                  </span>

                  {player ? (
                    <span className="text-[11px] sm:text-xs font-medium flex items-center gap-1.5 mt-0.5">
                      {room.hostId === player.id && (
                        <span className="text-[#FFD43B] font-heading font-bold">Host</span>
                      )}
                      {isMe && <span className="text-[#00D9FF] font-heading font-bold">Bạn</span>}
                      {!player.connected && <span className="text-[#FF496C] font-bold">Offline</span>}
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-xs text-[#00D9FF] opacity-0 group-hover:opacity-100 font-bold transition-opacity mt-0.5">
                      + Khán giả
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Host / Waiting Control Bar */}
      {isHost ? (
        <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl px-4 py-2.5 sm:py-3 shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-heading font-bold text-[#F8FAFC]">
              <Shield size={16} className="text-[#FFD43B]" />
              <span>Nạp đề:</span>
            </div>
            <a
              href="/api/question-template"
              download="olympia_bo_de_mau.xlsx"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2638] hover:bg-[#24324a] text-[#F8FAFC] text-xs font-heading font-bold rounded-xl border border-[#303D52] hover:border-[#00D9FF] transition-all cursor-pointer"
              title="Tải file mẫu Excel chuẩn"
            >
              <Download size={14} />
              <span>Excel mẫu</span>
            </a>
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-[#1C2638] hover:bg-[#24324a] text-[#00D9FF] text-xs font-heading font-bold rounded-xl border border-[#00D9FF]/50 hover:border-[#00D9FF] transition-all">
              <Upload size={14} />
              <span>Nạp file (.xlsx / .json)</span>
              <input type="file" accept=".xlsx,.xls,.json" onChange={handleFileUpload} className="hidden" />
            </label>
            {uploadStatus && (
              <span className="text-xs font-bold text-[#FFD43B] truncate max-w-xs">{uploadStatus}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8]">
              Thí sinh:{' '}
              <strong className={connectedContestants.length >= 2 ? 'text-[#20D6A0]' : 'text-[#FFD43B]'}>
                {connectedContestants.length}/{GAME_CONFIG.MIN_PLAYERS_FOR_TEST}
              </strong>
            </span>
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`px-6 py-2.5 rounded-xl font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2 border transition-all ${
                canStart
                  ? 'bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] border-[#FFD43B] shadow-glow-yellow hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-[#1C2638] text-[#64748B] border-[#303D52] cursor-not-allowed'
              }`}
            >
              <Play size={16} fill="currentColor" />
              <span>Bắt đầu trận đấu</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl px-4 py-2.5 text-center text-xs sm:text-sm font-heading font-bold text-[#94A3B8] shadow-lg shrink-0 flex items-center justify-center gap-2">
          <span>⏳ Đang chờ chủ phòng bắt đầu trận đấu...</span>
          {myRole === 'viewer' && (
            <span className="text-[#00D9FF] bg-[#00D9FF]/10 px-2.5 py-0.5 rounded-md border border-[#00D9FF]/30">
              (Bạn đang ở vị trí Người theo dõi)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
