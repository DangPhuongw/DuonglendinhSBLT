import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '@olympia/shared';
import { Users, Upload, Play, CheckCircle2, Copy, Check } from 'lucide-react';

export const Lobby: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const createRoom = useGameStore((s) => s.createRoom);
  const joinRoom = useGameStore((s) => s.joinRoom);
  const startGame = useGameStore((s) => s.startGame);

  const [name, setName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
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
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
              OLYMPIA NỘI BỘ
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Hệ thống thi đấu thời gian thực 4 vòng thi Olympia
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Users size={18} />
                <span>{isCreating ? 'Đang tạo phòng...' : 'Tạo phòng mới'}</span>
              </button>
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase font-semibold absolute">
                HOẶC
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mã phòng thi
                </label>
                <input
                  type="text"
                  placeholder="Nhập 6 ký tự (Ví dụ: ABC123)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white uppercase font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm text-center"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-bold rounded-xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
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
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-6 text-center shadow-xl backdrop-blur">
        <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">
          SẢNH CHỜ TRẬN ĐẤU
        </h2>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-xs text-slate-400">Mã phòng:</span>
          <span className="font-mono text-xl font-black tracking-widest text-amber-400 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700">
            {room.code}
          </span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép link'}</span>
          </button>
        </div>
      </div>

      {/* 5 Seats Grid */}
      <div className="w-full mb-8">
        <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3 px-1">
          Danh sách người chơi ({connectedPlayers.length}/5)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((seatNum) => {
            const player = room.players.find((p) => p.seat === seatNum);
            const isMe = player && player.id === myPlayer.id;

            return (
              <div
                key={seatNum}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center min-h-[120px] transition-all ${
                  player
                    ? isMe
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-900/80 border-slate-800'
                    : 'bg-slate-950/30 border-dashed border-slate-800/60 opacity-60'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm mb-2 ${
                    player
                      ? isMe
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800/40 text-slate-600'
                  }`}
                >
                  {seatNum}
                </div>

                <span className="font-bold text-sm text-center truncate max-w-full px-1 text-slate-200">
                  {player ? player.name : 'Ghế trống'}
                </span>

                {player && (
                  <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    {room.hostId === player.id && (
                      <span className="text-amber-400 font-semibold">(Chủ phòng)</span>
                    )}
                    {isMe && <span className="text-indigo-400 font-semibold">(Bạn)</span>}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Control Section */}
      {isHost ? (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur flex flex-col items-center gap-4">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h4 className="font-bold text-sm text-slate-200">Nạp bộ đề thi tùy chỉnh</h4>
              <p className="text-xs text-slate-400">
                Mặc định dùng Bộ đề mẫu Olympia. Có thể nạp file Excel (6 sheet) hoặc JSON.
              </p>
            </div>
            <label className="cursor-pointer shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors">
              <Upload size={14} />
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
            <div className="w-full p-2.5 bg-slate-800/80 rounded-xl text-xs text-amber-300 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
              <span>{uploadStatus}</span>
            </div>
          )}

          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-400">
              Yêu cầu tối thiểu {GAME_CONFIG.MIN_PLAYERS_FOR_TEST} người chơi để bắt đầu trận đấu.
            </span>
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
                canStart
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Play size={18} fill="currentColor" />
              <span>Bắt đầu trận đấu</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
          Đang chờ chủ phòng bắt đầu trận đấu...
        </div>
      )}
    </div>
  );
};
