import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '@olympia/shared';
import { Users, Upload, Play, CheckCircle2, Copy, Check, X, Sparkles, Download } from 'lucide-react';

export const Lobby: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const createRoom = useGameStore((s) => s.createRoom);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const startGame = useGameStore((s) => s.startGame);
  const kickPlayer = useGameStore((s) => s.kickPlayer);

  const [name, setName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState(() => {
    const pathMatch = window.location.pathname.match(/\/r\/([A-Za-z0-9]{6})/);
    const searchParams = new URLSearchParams(window.location.search);
    const fromUrl = pathMatch ? pathMatch[1] : searchParams.get('room');
    return (fromUrl || localStorage.getItem('olympia_room_code') || '').toUpperCase();
  });
  const [errorMsg, setErrorMsg] = useState('');
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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] p-4">
        <div className="w-full max-w-md bg-[#111827]/90 backdrop-blur-xl border border-[#303D52]/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] text-[#F8FAFC] relative">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-block relative mb-2">
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#F8FAFC] tracking-tight relative z-10">
                ĐẤU TRƯỜNG TRÍ TUỆ
              </h1>
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#FFD43B]/30 blur-sm rounded" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#94A3B8] mt-1 leading-relaxed">
              Mô phỏng theo format chương trình Đường lên đỉnh Olympia
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-[#FF496C]/15 border border-[#FF496C]/50 rounded-xl text-[#FF496C] text-xs font-bold shadow-glow-danger">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-heading font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-full h-12 px-4 bg-[#090D18] border border-[#303D52] rounded-xl text-[#F8FAFC] font-bold placeholder-[#64748B] focus:outline-none focus:border-[#00D9FF] focus:shadow-glow-cyan transition-all text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full h-12 bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] font-heading font-extrabold rounded-xl border border-[#FFD43B] shadow-glow-yellow hover:scale-[1.01] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users size={18} className="stroke-[2.5]" />
                <span>{isCreating ? 'Đang tạo phòng...' : 'Tạo phòng mới'}</span>
              </button>
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-[#303D52] w-full" />
              <span className="bg-[#111827] px-3 text-xs text-[#64748B] uppercase font-heading font-bold absolute border border-[#303D52] rounded">
                HOẶC
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-heading font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Mã phòng thi
                </label>
                <input
                  type="text"
                  placeholder="Nhập 6 ký tự (Ví dụ: ABC123)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full h-12 px-4 bg-[#090D18] border border-[#303D52] rounded-xl text-[#F8FAFC] uppercase font-digital font-bold tracking-widest placeholder-[#64748B] focus:outline-none focus:border-[#00D9FF] focus:shadow-glow-cyan transition-all text-sm text-center tabular-nums"
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
  const connectedPlayers = room.players.filter((p) => p.connected);
  const canStart = isHost && connectedPlayers.length >= GAME_CONFIG.MIN_PLAYERS_FOR_TEST;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Đang tải và xử lý bộ đề...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomCode', room.code);

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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 flex flex-col items-center">
      {/* Lobby Header */}
      <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl p-6 mb-6 text-center shadow-xl">
        <div className="inline-block relative">
          <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#F8FAFC] tracking-tight relative z-10">
            SẢNH CHỜ TRẬN ĐẤU
          </h2>
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#FFD43B]/30 blur-sm rounded" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs font-heading font-bold uppercase text-[#94A3B8]">Mã phòng:</span>
          <span className="font-digital text-2xl font-bold tracking-widest text-[#090D18] bg-[#FFD43B] px-4 py-0.5 rounded-lg border border-[#FFD43B] shadow-glow-yellow tabular-nums">
            {room.code}
          </span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs font-heading font-bold bg-[#1C2638] hover:bg-[#24324a] px-3.5 py-1.5 rounded-lg border border-[#303D52] hover:border-[#00D9FF] text-[#F8FAFC] transition-all cursor-pointer active:scale-95"
            title="Sao chép mã phòng"
          >
            {copied ? <Check size={14} className="text-[#20D6A0] stroke-[3]" /> : <Copy size={14} className="stroke-[2.5]" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>
        </div>
      </div>

      {/* 5 Seats Grid */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs uppercase font-heading font-bold text-[#94A3B8] tracking-wider flex items-center gap-2">
            <span>Danh sách người chơi</span>
            <span className="bg-[#FFD43B] text-[#090D18] px-2 py-0.5 rounded-full font-heading font-black text-[11px] shadow-glow-yellow">
              {connectedPlayers.length}/5
            </span>
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((seatNum) => {
            const player = room.players.find((p) => p.seat === seatNum);
            const isMe = player && player.id === myPlayer.id;

            return (
              <div
                key={seatNum}
                className={`relative p-4 rounded-xl border flex flex-col items-center justify-center min-h-[130px] transition-all ${
                  player
                    ? isMe
                      ? 'bg-[#1C2638] border-2 border-[#FFD43B] shadow-glow-yellow scale-[1.02]'
                      : 'bg-[#111827] border-[#303D52] hover:border-[#00D9FF] hover:shadow-glow-cyan'
                    : 'bg-[#090D18]/40 border-dashed border-[#303D52]/40 opacity-50'
                }`}
              >
                {/* Host kick button */}
                {isHost && player && !isMe && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      kickPlayer(player.id);
                    }}
                    title={`Mời ${player.name} ra khỏi phòng`}
                    className="absolute top-2 right-2 p-1 rounded-md bg-[#FF496C]/20 hover:bg-[#FF496C] text-[#FF496C] hover:text-white border border-[#FF496C]/50 transition-all active:scale-95 z-10"
                  >
                    <X size={12} className="stroke-[2.5]" />
                  </button>
                )}

                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-heading font-extrabold text-sm mb-2 border ${
                    player
                      ? isMe
                        ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B] shadow-glow-yellow'
                        : 'bg-[#1C2638] text-[#00D9FF] border-[#00D9FF]/50'
                      : 'bg-[#0E1524] text-[#64748B] border-[#303D52]'
                  }`}
                >
                  {seatNum}
                </div>

                <span className="font-bold text-sm text-center truncate max-w-full px-1 text-[#F8FAFC]">
                  {player ? player.name : 'Ghế trống'}
                </span>

                {player && (
                  <span className="text-[10px] font-medium mt-1 flex flex-col items-center gap-0.5">
                    {room.hostId === player.id && (
                      <span className="text-[#FFD43B] bg-[#FFD43B]/10 px-1.5 py-0.2 rounded border border-[#FFD43B]/30 font-heading font-bold">Chủ phòng</span>
                    )}
                    {isMe && <span className="text-[#00D9FF] bg-[#00D9FF]/10 px-1.5 py-0.2 rounded border border-[#00D9FF]/30 font-heading font-bold">Bạn</span>}
                    {!player.connected && (
                      <span className="text-[#FF496C] bg-[#FF496C]/10 px-1 py-0.2 rounded border border-[#FF496C]/30 font-bold">Mất kết nối</span>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Control Section */}
      {isHost ? (
        <div className="w-full bg-[#111827] border border-[#303D52] rounded-2xl p-6 shadow-xl flex flex-col items-center gap-4">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#303D52] pb-4">
            <div>
              <h4 className="font-heading font-extrabold text-base text-[#F8FAFC]">Nạp bộ đề thi tùy chỉnh</h4>
              <p className="text-xs text-[#94A3B8]">
                Mặc định dùng Bộ đề mẫu Đấu Trường Trí Tuệ. Có thể nạp file Excel (6 sheet) hoặc JSON.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <a
                href="/api/question-template"
                download="olympia_bo_de_mau.xlsx"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1C2638] hover:bg-[#24324a] text-[#F8FAFC] text-xs font-heading font-bold rounded-lg border border-[#303D52] hover:border-[#00D9FF] transition-all cursor-pointer"
                title="Tải file mẫu Excel chuẩn với đầy đủ 6 sheet"
              >
                <Download size={15} className="stroke-[2.5]" />
                <span>Tải file Excel mẫu</span>
              </a>

              <label className="cursor-pointer shrink-0 flex items-center gap-2 px-4 py-2 bg-[#1C2638] hover:bg-[#24324a] text-[#00D9FF] text-xs font-heading font-bold rounded-lg border border-[#00D9FF]/50 hover:border-[#00D9FF] hover:shadow-glow-cyan transition-all">
                <Upload size={15} className="stroke-[2.5]" />
                <span>Nạp file đề (.xlsx / .json)</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {uploadStatus && (
            <div className="w-full p-2.5 bg-[#FFD43B]/10 border border-[#FFD43B]/40 rounded-lg text-xs font-bold text-[#FFD43B] flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#FFD43B] shrink-0 stroke-[2.5]" />
              <span>{uploadStatus}</span>
            </div>
          )}

          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#94A3B8]">
              Yêu cầu tối thiểu {GAME_CONFIG.MIN_PLAYERS_FOR_TEST} người chơi để bắt đầu trận đấu.
            </span>
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading font-extrabold uppercase tracking-wider text-sm flex items-center justify-center gap-2 border transition-all ${
                canStart
                  ? 'bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] border-[#FFD43B] shadow-glow-yellow-lg hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-[#1C2638] text-[#64748B] border-[#303D52] cursor-not-allowed'
              }`}
            >
              <Play size={18} fill="currentColor" />
              <span>Bắt đầu trận đấu</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#111827] border border-[#303D52] rounded-xl text-center text-xs font-heading font-bold text-[#94A3B8] shadow-lg">
          ⏳ Đang chờ chủ phòng bắt đầu trận đấu...
        </div>
      )}
    </div>
  );
};
