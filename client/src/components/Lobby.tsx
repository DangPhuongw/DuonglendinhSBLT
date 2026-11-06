import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '@olympia/shared';
import { Users, Upload, Play, CheckCircle2, Copy, Check, X, Sparkles } from 'lucide-react';

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
        <div className="w-full max-w-md bg-white border-3 border-[#171717] rounded-2xl p-6 sm:p-8 shadow-neo-lg text-[#171717] relative">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-block relative mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight relative z-10">
                ĐẤU TRƯỜNG TRÍ TUỆ
              </h1>
              <div className="absolute bottom-0.5 left-0 right-0 h-3 bg-[#FFE45C] z-0 -rotate-1 rounded" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#666666] mt-1 leading-relaxed">
              Mô phỏng theo format chương trình Đường lên đỉnh Olympia
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-[#FF9292]/20 border-2 border-[#171717] rounded-lg text-[#171717] text-xs font-bold shadow-neo-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#171717] uppercase tracking-wider mb-1.5">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-full h-12 px-4 bg-white border-2 border-[#171717] rounded-lg text-[#171717] font-bold placeholder-[#999999] focus:outline-none focus:bg-[#FFFDF7] shadow-neo-sm focus:shadow-neo transition-all text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full h-12 bg-[#FFE45C] hover:bg-[#fad836] text-[#171717] font-extrabold rounded-lg border-2 border-[#171717] shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users size={18} className="stroke-[2.5]" />
                <span>{isCreating ? 'Đang tạo phòng...' : 'Tạo phòng mới'}</span>
              </button>
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t-2 border-[#171717] w-full" />
              <span className="bg-white px-3 text-xs text-[#171717] uppercase font-black absolute border border-[#171717] rounded shadow-[1px_1px_0px_#171717]">
                HOẶC
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-extrabold text-[#171717] uppercase tracking-wider mb-1.5">
                  Mã phòng thi
                </label>
                <input
                  type="text"
                  placeholder="Nhập 6 ký tự (Ví dụ: ABC123)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full h-12 px-4 bg-white border-2 border-[#171717] rounded-lg text-[#171717] uppercase font-mono font-extrabold tracking-widest placeholder-[#999999] focus:outline-none focus:bg-[#FFFDF7] shadow-neo-sm focus:shadow-neo transition-all text-sm text-center tabular-nums"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full h-12 bg-white hover:bg-slate-50 text-[#171717] font-extrabold rounded-lg border-2 border-[#171717] shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
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

    try {
      const res = await fetch('/api/upload-questions', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setUploadStatus(`Đã nạp bộ đề thành công: ${data.questionSet.title}`);
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
      <div className="w-full bg-white border-2 border-[#171717] rounded-2xl p-6 mb-6 text-center shadow-neo">
        <div className="inline-block relative">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight relative z-10">
            SẢNH CHỜ TRẬN ĐẤU
          </h2>
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#FFE45C] z-0 -rotate-1 rounded" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs font-black uppercase text-[#666666]">Mã phòng:</span>
          <span className="font-mono text-xl font-extrabold tracking-widest text-[#171717] bg-[#FFE45C] px-3.5 py-1 rounded-lg border-2 border-[#171717] shadow-neo-sm tabular-nums">
            {room.code}
          </span>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-xs font-black bg-white hover:bg-slate-50 px-3.5 py-2 rounded-lg border-2 border-[#171717] text-[#171717] shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            title="Sao chép mã phòng"
          >
            {copied ? <Check size={14} className="text-[#171717] stroke-[3]" /> : <Copy size={14} className="stroke-[2.5]" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>
        </div>
      </div>

      {/* 5 Seats Grid */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs uppercase font-extrabold text-[#171717] tracking-wider flex items-center gap-2">
            <span>Danh sách người chơi</span>
            <span className="bg-[#FFE45C] px-2 py-0.5 rounded-full border border-[#171717] shadow-[1px_1px_0px_#171717] text-[11px] font-black">
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
                className={`relative p-4 rounded-xl border-2 border-[#171717] flex flex-col items-center justify-center min-h-[130px] transition-all ${
                  player
                    ? isMe
                      ? 'bg-[#FFE45C] shadow-neo scale-[1.02]'
                      : 'bg-white shadow-neo hover:-translate-y-1 hover:shadow-neo-lg'
                    : 'bg-[#FFFDF7] border-dashed border-[#171717]/40 opacity-70'
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
                    className="absolute top-2 right-2 p-1 rounded-md bg-[#FF9292] hover:bg-rose-300 text-[#171717] border border-[#171717] shadow-neo-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none z-10"
                  >
                    <X size={12} className="stroke-[2.5]" />
                  </button>
                )}

                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-sm mb-2 border-2 border-[#171717] shadow-neo-sm ${
                    player
                      ? isMe
                        ? 'bg-[#171717] text-[#FFE45C]'
                        : 'bg-[#66C7F2] text-[#171717]'
                      : 'bg-white text-[#999999]'
                  }`}
                >
                  {seatNum}
                </div>

                <span className="font-extrabold text-sm text-center truncate max-w-full px-1 text-[#171717]">
                  {player ? player.name : 'Ghế trống'}
                </span>

                {player && (
                  <span className="text-[10px] font-bold mt-1 flex flex-col items-center gap-0.5">
                    {room.hostId === player.id && (
                      <span className="text-[#171717] bg-white px-1.5 py-0.5 rounded border border-[#171717] shadow-[1px_1px_0px_#171717]">Chủ phòng</span>
                    )}
                    {isMe && <span className="text-[#FFE45C] bg-[#171717] px-1.5 py-0.5 rounded border border-[#171717] shadow-[1px_1px_0px_#171717]">Bạn</span>}
                    {!player.connected && (
                      <span className="text-[#171717] bg-[#FF9292] px-1 py-0.5 rounded border border-[#171717]">Mất kết nối</span>
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
        <div className="w-full bg-white border-2 border-[#171717] rounded-2xl p-6 shadow-neo flex flex-col items-center gap-4">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 border-b-2 border-[#171717] pb-4">
            <div>
              <h4 className="font-extrabold text-base text-[#171717]">Nạp bộ đề thi tùy chỉnh</h4>
              <p className="text-xs font-semibold text-[#666666]">
                Mặc định dùng Bộ đề mẫu Đấu Trường Trí Tuệ. Có thể nạp file Excel (6 sheet) hoặc JSON.
              </p>
            </div>
            <label className="cursor-pointer shrink-0 flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FFE45C] text-[#171717] text-xs font-extrabold rounded-lg border-2 border-[#171717] shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
              <Upload size={15} className="stroke-[2.5]" />
              <span>Chọn file đề (.xlsx / .json)</span>
              <input
                type="file"
                accept=".xlsx,.xls,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {uploadStatus && (
            <div className="w-full p-2.5 bg-[#FFE45C] border-2 border-[#171717] rounded-lg text-xs font-black text-[#171717] shadow-neo-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#171717] shrink-0 stroke-[2.5]" />
              <span>{uploadStatus}</span>
            </div>
          )}

          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs font-bold text-[#666666]">
              Yêu cầu tối thiểu {GAME_CONFIG.MIN_PLAYERS_FOR_TEST} người chơi để bắt đầu trận đấu.
            </span>
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold uppercase tracking-wider text-sm flex items-center justify-center gap-2 border-2 border-[#171717] transition-all ${
                canStart
                  ? 'bg-[#FFE45C] hover:bg-[#fad836] text-[#171717] shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border-slate-400 cursor-not-allowed'
              }`}
            >
              <Play size={18} fill="currentColor" />
              <span>Bắt đầu trận đấu</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white border-2 border-[#171717] rounded-xl text-center text-xs font-extrabold text-[#171717] shadow-neo-sm">
          ⏳ Đang chờ chủ phòng bắt đầu trận đấu...
        </div>
      )}
    </div>
  );
};
