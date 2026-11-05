import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '@olympia/shared';
import { Users, Upload, Play, CheckCircle2, Copy, Check, X } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-4">
        <div className="w-full max-w-md bg-white border-3 border-black rounded-3xl p-6 sm:p-8 shadow-neo-lg text-black relative">
          <div className="text-center mb-6">
            <div className="inline-block relative">
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight relative z-10">
                OLYMPIA NỘI BỘ
              </h1>
              <div className="absolute bottom-0.5 left-0 right-0 h-3 bg-[#E8FE36] z-0 -rotate-1 rounded" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-600 mt-2">
              Hệ thống thi đấu thời gian thực 4 vòng thi Olympia
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-100 border-2 border-black rounded-xl text-rose-950 text-xs font-bold shadow-neo-sm">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl text-black font-bold placeholder-slate-400 focus:outline-none focus:bg-[#FEFCE8] shadow-neo-sm focus:shadow-neo transition-all text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-3.5 bg-[#E8FE36] hover:bg-[#d6ec24] text-black font-black rounded-2xl border-2 border-black shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users size={18} className="stroke-[2.5]" />
                <span>{isCreating ? 'Đang tạo phòng...' : 'Tạo phòng mới'}</span>
              </button>
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t-2 border-black w-full" />
              <span className="bg-white px-3 text-xs text-black uppercase font-black absolute border border-black rounded-md shadow-[1px_1px_0px_#000]">
                HOẶC
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
                  Mã phòng thi
                </label>
                <input
                  type="text"
                  placeholder="Nhập 6 ký tự (Ví dụ: ABC123)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl text-black uppercase font-mono font-black tracking-widest placeholder-slate-400 focus:outline-none focus:bg-[#FEFCE8] shadow-neo-sm focus:shadow-neo transition-all text-sm text-center"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full py-3.5 bg-white hover:bg-slate-100 text-black font-black rounded-2xl border-2 border-black shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isJoining ? 'Đang vào phòng...' : 'Vào phòng thi'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inside Lobby
  const isHost = room.hostId === myPlayer.id;
  const connectedPlayers = room.players.filter((p) => p.connected);
  const canStart = isHost && connectedPlayers.length >= GAME_CONFIG.MIN_PLAYERS_FOR_TEST;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?room=${room.code}`;
    navigator.clipboard.writeText(url);
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
      <div className="w-full bg-white border-2 border-black rounded-3xl p-6 mb-6 text-center shadow-neo">
        <div className="inline-block relative">
          <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight relative z-10">
            SẢNH CHỜ TRẬN ĐẤU
          </h2>
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#E8FE36] z-0 -rotate-1 rounded" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs font-black uppercase text-slate-600">Mã phòng:</span>
          <span className="font-mono text-xl font-black tracking-widest text-black bg-[#E8FE36] px-3.5 py-1 rounded-xl border-2 border-black shadow-neo-sm">
            {room.code}
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs font-black bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl border-2 border-black text-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-700 stroke-[3]" /> : <Copy size={14} className="stroke-[2.5]" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép link'}</span>
          </button>
        </div>
      </div>

      {/* 5 Seats Grid */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs uppercase font-black text-black tracking-wider flex items-center gap-2">
            <span>Danh sách người chơi</span>
            <span className="bg-[#E8FE36] px-2 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000] text-[11px]">
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
                className={`relative p-4 rounded-2xl border-2 border-black flex flex-col items-center justify-center min-h-[130px] transition-all ${
                  player
                    ? isMe
                      ? 'bg-[#E8FE36] shadow-neo scale-[1.02]'
                      : 'bg-white shadow-neo hover:-translate-y-1 hover:shadow-neo-lg'
                    : 'bg-slate-100/70 border-dashed border-black/40 opacity-70'
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
                    className="absolute top-2 right-2 p-1 rounded-lg bg-rose-200 hover:bg-rose-400 text-black border-2 border-black shadow-neo-sm transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none z-10"
                  >
                    <X size={12} className="stroke-[2.5]" />
                  </button>
                )}

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm mb-2 border-2 border-black shadow-neo-sm ${
                    player
                      ? isMe
                        ? 'bg-black text-[#E8FE36]'
                        : 'bg-[#A5C9FF] text-black'
                      : 'bg-white text-slate-400'
                  }`}
                >
                  {seatNum}
                </div>

                <span className="font-black text-sm text-center truncate max-w-full px-1 text-black">
                  {player ? player.name : 'Ghế trống'}
                </span>

                {player && (
                  <span className="text-[10px] font-black mt-1 flex flex-col items-center gap-0.5">
                    {room.hostId === player.id && (
                      <span className="text-black bg-white px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">Chủ phòng</span>
                    )}
                    {isMe && <span className="text-black bg-black text-[#E8FE36] px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_#000]">Bạn</span>}
                    {!player.connected && (
                      <span className="text-rose-800 bg-rose-100 px-1 py-0.5 rounded border border-rose-400">Mất kết nối</span>
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
        <div className="w-full bg-white border-2 border-black rounded-3xl p-6 shadow-neo flex flex-col items-center gap-4">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 border-b-2 border-black pb-4">
            <div>
              <h4 className="font-black text-base text-black">Nạp bộ đề thi tùy chỉnh</h4>
              <p className="text-xs font-semibold text-slate-600">
                Mặc định dùng Bộ đề mẫu Olympia. Có thể nạp file Excel (6 sheet) hoặc JSON.
              </p>
            </div>
            <label className="cursor-pointer shrink-0 flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#A5C9FF] text-black text-xs font-black rounded-xl border-2 border-black shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
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
            <div className="w-full p-2.5 bg-[#E8FE36] border-2 border-black rounded-xl text-xs font-black text-black shadow-neo-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="text-black shrink-0 stroke-[2.5]" />
              <span>{uploadStatus}</span>
            </div>
          )}

          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs font-black text-slate-600">
              Yêu cầu tối thiểu {GAME_CONFIG.MIN_PLAYERS_FOR_TEST} người chơi để bắt đầu trận đấu.
            </span>
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 border-2 border-black transition-all ${
                canStart
                  ? 'bg-[#E8FE36] hover:bg-[#d6ec24] text-black shadow-neo hover:shadow-neo-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border-slate-400 cursor-not-allowed'
              }`}
            >
              <Play size={18} fill="currentColor" />
              <span>Bắt đầu trận đấu</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-white border-2 border-black rounded-2xl text-center text-xs font-black text-black shadow-neo-sm">
          ⏳ Đang chờ chủ phòng bắt đầu trận đấu...
        </div>
      )}
    </div>
  );
};
