import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { GAME_CONFIG } from '@olympia/shared';
import { ANTI_CHEAT_RULE } from '../utils/antiCheatRules';
import { InviteLink } from './InviteLink';
import { AvatarPicker } from './AvatarPicker';
import { PlayerAvatar } from './PlayerAvatar';
import { loadMyAvatar, saveMyAvatar } from '../utils/avatar';
import {
  ShieldAlert,
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
  const setMyAvatar = useGameStore((s) => s.setAvatar);
  const [avatar, setAvatar] = useState(loadMyAvatar);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const chooseAvatar = (seed: string) => {
    setAvatar(seed);
    saveMyAvatar(seed);
  };
  const myToken = useGameStore((s) => s.myToken);

  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem('olympia_last_name') || '';
    } catch {
      return '';
    }
  });
  // Mở bằng link mời (?room=ABC123): hiện màn vào phòng nhanh, chỉ cần nhập tên
  const [invitedCode] = useState(() => {
    const pathMatch = window.location.pathname.match(/\/r\/([A-Za-z0-9]{6})/);
    const code = (pathMatch ? pathMatch[1] : new URLSearchParams(window.location.search).get('room') || '').toUpperCase();
    return /^[A-Z0-9]{6}$/.test(code) ? code : '';
  });
  const [showFullForm, setShowFullForm] = useState(false);
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
  const [uploadOk, setUploadOk] = useState<boolean | null>(null);
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
      else rememberAfterEntering();
    };

    // Nhớ tên cho lần sau và bỏ ?room khỏi thanh địa chỉ (để rời phòng không bị mời lại phòng cũ)
    const rememberAfterEntering = () => {
      try {
        localStorage.setItem('olympia_last_name', name.trim());
      } catch {
        /* bộ nhớ trình duyệt bị chặn: bỏ qua */
      }
      if (window.location.search || /\/r\//.test(window.location.pathname)) {
        window.history.replaceState(null, '', '/');
      }
    };

    const handleJoin = async (e: React.FormEvent, code?: string) => {
      e.preventDefault();
      if (!name.trim()) return setErrorMsg('Vui lòng nhập tên người chơi.');
      if (!roomCodeInput.trim()) return setErrorMsg('Vui lòng nhập mã phòng (6 ký tự).');
      setIsJoining(true);
      setErrorMsg('');
      const res = await joinRoom(name.trim(), (code || roomCodeInput).trim().toUpperCase());
      setIsJoining(false);
      if (!res.ok) setErrorMsg(res.error || 'Vào phòng thất bại.');
      else rememberAfterEntering();
    };

    const handleInvitedJoin = (e: React.FormEvent) => handleJoin(e, invitedCode);

    if (invitedCode && !showFullForm) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4">
          <form
            onSubmit={handleInvitedJoin}
            className="w-full max-w-md bg-[#0A0D22]/95 backdrop-blur-xl border-2 border-[#262E66] rounded-3xl hud p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] text-[#EEF0FF]"
          >
            <div className="text-center mb-5">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gold-gradient tracking-[0.06em]">ĐẤU TRƯỜNG TRÍ TUỆ</h1>
              <p className="mt-2 text-sm text-[#A6ACDB] font-medium">Bạn được mời vào phòng thi</p>
              <div className="mt-2 inline-block font-digital text-3xl sm:text-4xl font-bold tracking-widest text-[#05060F] bg-[#F7C873] px-4 py-1 rounded-xl shadow-glow-yellow tabular-nums">
                {invitedCode}
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-[#FF5D8F]/15 border border-[#FF5D8F]/50 rounded-xl text-[#FF5D8F] text-xs sm:text-sm font-bold text-center" role="alert">
                {errorMsg}
              </div>
            )}

            <label className="block text-xs sm:text-sm font-heading font-bold uppercase tracking-wider mb-1.5" htmlFor="invite-name">
              Tên hiển thị của bạn
            </label>
            <input
              id="invite-name"
              type="text"
              autoFocus
              placeholder="Ví dụ: Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              className="w-full h-12 px-4 bg-[#05060F] border border-[#262E66] rounded-xl text-[#EEF0FF] font-bold placeholder-[#6D75AD] focus:outline-none focus:border-[#F7C873]/70 focus:shadow-glow-yellow transition-all text-base"
            />
            <div className="mt-4">
              <span className="block text-xs sm:text-sm font-heading font-bold uppercase tracking-wider mb-1.5">Ảnh đại diện</span>
              <AvatarPicker value={avatar} onChange={chooseAvatar} />
            </div>
            <button
              type="submit"
              disabled={isJoining}
              className="mt-3 w-full h-12 bg-[#F7C873] hover:bg-[#FBE0A8] disabled:opacity-60 text-[#05060F] font-heading font-extrabold rounded-xl border border-[#F7C873] shadow-glow-yellow active:scale-95 transition-all text-sm uppercase tracking-wider cursor-pointer"
            >
              {isJoining ? 'Đang vào phòng...' : 'Vào phòng ngay'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFullForm(true);
                setErrorMsg('');
              }}
              className="mt-3 w-full text-xs sm:text-sm text-[#A6ACDB] hover:text-[#B9C0EA] font-medium underline underline-offset-4 cursor-pointer"
            >
              Không phải phòng này? Tạo phòng mới hoặc nhập mã khác
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-md bg-[#0A0D22]/95 backdrop-blur-xl border-2 border-[#262E66] rounded-3xl hud p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] text-[#EEF0FF] relative">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-block relative mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gold-gradient tracking-[0.06em] relative z-10">
                ĐẤU TRƯỜNG TRÍ TUỆ
              </h1>
              <div className="absolute bottom-0 left-0 right-0 h-2.5 bg-[#F7C873]/30 blur-sm rounded" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#A6ACDB] leading-relaxed">
              Mô phỏng theo format chương trình Đường lên đỉnh Olympia
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-[#FF5D8F]/15 border border-[#FF5D8F]/50 rounded-xl text-[#FF5D8F] text-xs sm:text-sm font-bold shadow-glow-danger text-center">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-heading font-bold text-[#EEF0FF] uppercase tracking-wider mb-1.5">
                Tên hiển thị của bạn
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-full h-12 px-4 bg-[#05060F] border border-[#262E66] rounded-xl text-[#EEF0FF] font-bold placeholder-[#6D75AD] focus:outline-none focus:border-[#F7C873]/70 focus:shadow-glow-yellow transition-all text-sm sm:text-base"
              />
            </div>

            <div>
              <span className="block text-xs sm:text-sm font-heading font-bold text-[#EEF0FF] uppercase tracking-wider mb-1.5">Ảnh đại diện</span>
              <AvatarPicker value={avatar} onChange={chooseAvatar} />
            </div>

            <div className="pt-1">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full h-12 bg-[#F7C873] hover:bg-[#FBE0A8] text-[#05060F] font-heading font-extrabold rounded-xl border border-[#F7C873] shadow-glow-yellow hover:scale-[1.01] active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users size={18} className="stroke-[2.5]" />
                <span>{isCreating ? 'Đang tạo phòng...' : 'Tạo phòng mới'}</span>
              </button>
            </div>

            <div className="relative my-3 flex items-center justify-center">
              <div className="border-t border-[#262E66] w-full" />
              <span className="bg-[#0A0D22] px-3 text-xs text-[#6D75AD] uppercase font-heading font-bold absolute border border-[#262E66] rounded-md">
                HOẶC
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs sm:text-sm font-heading font-bold text-[#A6ACDB] uppercase tracking-wider mb-1.5">
                  Mã phòng thi
                </label>
                <input
                  type="text"
                  placeholder="Nhập 6 ký tự (Ví dụ: ABC123)"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full h-12 px-4 bg-[#05060F] border border-[#262E66] rounded-xl text-[#EEF0FF] uppercase font-digital font-bold tracking-widest placeholder-[#6D75AD] placeholder:font-sans placeholder:text-sm placeholder:font-medium placeholder:tracking-normal placeholder:normal-case focus:outline-none focus:border-[#F7C873]/70 focus:shadow-glow-yellow transition-all text-base text-center tabular-nums"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full h-12 bg-[#11163A] hover:bg-[#161B45] text-[#EEF0FF] font-heading font-extrabold rounded-xl border border-[#262E66] hover:border-[#F7C873]/60 hover:shadow-glow-yellow active:scale-95 transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
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

  const handleSeatClick = async (targetRole: 'player' | 'viewer', targetSeat: number) => {
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
    const input = e.target;
    const file = input.files?.[0];
    // Đặt lại ô chọn file để chọn lại đúng file đó (sau khi sửa trong Excel) vẫn có tác dụng
    input.value = '';
    if (!file) return;

    setUploadOk(null);
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
      // Lỗi từ máy chủ / proxy có thể không phải JSON
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (data?.ok) {
        setUploadOk(true);
        const filled: string[] = data.filled || [];
        setUploadStatus(
          `Đã nạp bộ đề "${data.questionSet.title}".` +
            (filled.length ? ` Phần file chưa có (${filled.join(', ')}) được lấy ngẫu nhiên từ kho câu hỏi.` : '')
        );
      } else {
        setUploadOk(false);
        setUploadStatus(
          data?.errors?.length
            ? `Bộ đề chưa hợp lệ:\n- ${data.errors.join('\n- ')}`
            : data?.error ||
              (res.status === 413
                ? 'File quá lớn (tối đa 25MB).'
                : `Không nạp được bộ đề (mã lỗi ${res.status}). Vui lòng thử lại.`)
        );
      }
    } catch (err: any) {
      setUploadOk(false);
      setUploadStatus(`Không kết nối được máy chủ: ${err.message}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between py-1.5 px-2 sm:px-3 max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto overflow-hidden">
      {/* Top Header Bar */}
      <div className="hud w-full bg-[#0A0D22] border border-[#262E66] rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-display font-bold text-[#EEF0FF] tracking-[0.04em]">
            SẢNH CHỜ TRẬN ĐẤU
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
            <span className="hidden sm:inline font-heading font-bold uppercase text-[#A6ACDB]">Mã phòng:</span>
            <span className="font-digital text-2xl sm:text-3xl lg:text-4xl font-bold tracking-widest text-[#05060F] bg-[#F7C873] px-3.5 py-0.5 rounded-xl border border-[#F7C873] shadow-glow-yellow tabular-nums">
              {room.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-[#11163A] text-[#EEF0FF] hover:text-[#B9C0EA] border border-[#262E66] transition-all cursor-pointer active:scale-95"
              title="Sao chép mã phòng"
            >
              {copied ? <Check size={16} className="text-[#43E6B5] stroke-[3]" /> : <Copy size={16} />}
            </button>
            <InviteLink roomCode={room.code} />
          </div>
        </div>

        {/* Quick Role & Tip Info */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <div className="hidden md:flex items-center gap-1.5 text-[#A6ACDB] text-xs sm:text-sm">
            <Info size={15} className="text-[#B9C0EA] shrink-0" />
            <span>Bấm ô trống để đổi ghế</span>
          </div>
          {myRole === 'viewer' ? (
            <span className="bg-[#B9C0EA]/15 text-[#B9C0EA] border border-[#B9C0EA]/40 px-3 py-1 rounded-full font-heading font-bold text-xs sm:text-sm shadow-glow-cyan">
              Bạn: Khán giả {isHost ? '(Chủ phòng)' : ''}
            </span>
          ) : (
            <span className="bg-[#F7C873]/15 text-[#F7C873] border border-[#F7C873]/40 px-3 py-1 rounded-full font-heading font-bold text-xs sm:text-sm shadow-glow-yellow">
              Bạn: Thí sinh
            </span>
          )}
        </div>
      </div>

      {seatNotice && (
        <div className="w-full my-1.5 p-2.5 bg-[#FF5D8F]/15 border border-[#FF5D8F]/50 rounded-xl text-[#FF5D8F] text-xs sm:text-sm font-bold shadow-glow-danger flex items-center justify-between shrink-0">
          <span>{seatNotice}</span>
          <button onClick={() => setSeatNotice('')} className="text-[#FF5D8F] hover:text-white">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Luật chống gian lận: nhắc trước khi trận đấu bắt đầu */}
      {GAME_CONFIG.ANTI_CHEAT.ENABLED && (
        <div
          role="note"
          className="w-full my-1.5 px-3 py-2 bg-[#FF5D8F]/10 border border-[#FF5D8F]/40 rounded-xl text-[#FFB6CF] text-xs sm:text-sm font-bold flex items-start gap-2 shrink-0"
        >
          <ShieldAlert size={16} className="text-[#FF5D8F] shrink-0 mt-0.5" />
          <span>
            <span className="text-[#FF5D8F] uppercase tracking-wide">Luật chống gian lận: </span>
            {ANTI_CHEAT_RULE} Cả phòng sẽ được thông báo mỗi lần vi phạm.
          </span>
        </div>
      )}

      {/* Center Seats Area: Fitted neatly in the canvas */}
      <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 sm:gap-4 my-2 w-full">
        {/* SECTION 1: 5 CONTESTANT SEATS */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs sm:text-sm lg:text-base uppercase font-heading font-black text-[#EEF0FF] tracking-wider flex items-center gap-2">
              <Trophy size={18} className="text-[#F7C873]" />
              <span>Bàn Thí Sinh (Thi đấu)</span>
              <span className="bg-[#F7C873] text-[#05060F] px-2.5 py-0.5 rounded-full font-heading font-black text-xs sm:text-sm shadow-glow-yellow">
                {contestants.length}/5
              </span>
            </h3>
            <span className="text-xs sm:text-sm text-[#A6ACDB]">Trực tiếp thi đấu & tính điểm</span>
          </div>
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3.5">
            {([1, 2, 3, 4, 5] as const).map((seatNum) => {
              const player = room.players.find((p) => (p.role || 'player') === 'player' && p.seat === seatNum);
              const isMe = player && player.id === myPlayer.id;

              return (
                <div
                  key={`player-${seatNum}`}
                  onClick={() => !player && handleSeatClick('player', seatNum)}
                  className={`hud relative p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-center h-[104px] sm:h-[118px] lg:h-[128px] transition-all group ${
                    player
                      ? isMe
                        ? 'bg-[#11163A] border-2 border-[#F7C873] shadow-glow-yellow scale-[1.02]'
                        : 'bg-[#0A0D22] border-[#262E66]'
                      : 'bg-[#05060F]/50 border-dashed border-[#262E66]/60 hover:border-[#F7C873] hover:bg-[#11163A]/70 hover:shadow-glow-yellow cursor-pointer'
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
                      className="absolute top-2 right-2 p-1 rounded-md bg-[#FF5D8F]/20 hover:bg-[#FF5D8F] text-[#FF5D8F] hover:text-white border border-[#FF5D8F]/50 transition-all z-10"
                    >
                      <X size={13} className="stroke-[2.5]" />
                    </button>
                  )}

                  {player ? (
                    <SeatAvatar player={player} isMe={!!isMe} seatLabel={String(seatNum)} onEdit={() => setAvatarModalOpen(true)} accent="yellow" />
                  ) : (
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center font-heading font-black text-sm sm:text-base lg:text-lg mb-1.5 border transition-all ${
                      player
                        ? isMe
                          ? 'bg-[#F7C873] text-[#05060F] border-[#F7C873] shadow-glow-yellow'
                          : 'bg-[#11163A] text-[#F7C873] border-[#F7C873]/40'
                        : 'bg-[#080B1E] text-[#6D75AD] border-[#262E66] group-hover:border-[#F7C873]/60 group-hover:text-[#F7C873]'
                    }`}
                  >
                    {seatNum}
                  </div>
                  )}

                  <span className="font-bold text-xs sm:text-sm md:text-base lg:text-lg text-center truncate max-w-full px-1 text-[#EEF0FF]">
                    {player ? player.name : 'Ghế trống'}
                  </span>

                  {player ? (
                    <span className="text-[11px] sm:text-xs font-medium flex items-center gap-1.5 mt-0.5">
                      {room.hostId === player.id && (
                        <span className="text-[#F7C873] font-heading font-bold">Host</span>
                      )}
                      {isMe && <span className="text-[#B9C0EA] font-heading font-bold">Bạn</span>}
                      {!player.connected && <span className="text-[#FF5D8F] font-bold">Offline</span>}
                    </span>
                  ) : (
                    <span className="text-xs text-[#F7C873] opacity-0 group-hover:opacity-100 font-bold transition-opacity mt-0.5">
                      + Chọn ghế
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: GHẾ KHÁN GIẢ (nhỏ, kém nổi bật hơn ghế thí sinh) */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <h3 className="text-[11px] sm:text-xs uppercase font-heading font-bold text-[#A6ACDB] tracking-wider flex items-center gap-1.5">
              <Eye size={14} className="text-[#B9C0EA]/80" />
              <span>Khán giả</span>
              <span className="text-[#B9C0EA] font-heading font-black">
                {viewers.length}/{GAME_CONFIG.MAX_VIEWERS}
              </span>
            </h3>
            <span className="text-[11px] sm:text-xs text-[#6D75AD]">Xem trực tiếp • Thả cảm xúc</span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {Array.from({ length: GAME_CONFIG.MAX_VIEWERS }, (_, i) => i + 1).map((seatNum) => {
              const player = room.players.find((p) => p.role === 'viewer' && p.seat === seatNum);
              const isMe = player && player.id === myPlayer.id;

              return (
                <div
                  key={`viewer-${seatNum}`}
                  onClick={() => !player && handleSeatClick('viewer', seatNum)}
                  className={`relative rounded-xl border flex flex-col items-center justify-center gap-0.5 h-[54px] sm:h-[60px] px-1 transition-all group ${
                    player
                      ? isMe
                        ? 'bg-[#1D1A38] border-[#B9C0EA]/80'
                        : 'bg-[#080B1E] border-[#262E66]/70'
                      : 'bg-[#05060F]/40 border-dashed border-[#262E66]/50 hover:border-[#F7C873]/60/70 cursor-pointer'
                  }`}
                  title={player ? (isMe ? 'Vị trí của bạn (khán giả)' : `${player.name} (khán giả)`) : `Ghế khán giả ${seatNum}: bấm để chuyển sang`}
                >
                  {isHost && player && !isMe && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        kickPlayer(player.id);
                      }}
                      title={`Mời ${player.name} ra khỏi phòng`}
                      className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-[#2A0F24] hover:bg-[#FF5D8F] text-[#FF5D8F] hover:text-white border border-[#FF5D8F]/60 transition-all z-10"
                    >
                      <X size={10} className="stroke-[3]" />
                    </button>
                  )}

                  {player ? (
                    <>
                      <button
                        type="button"
                        disabled={!isMe}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMe) setAvatarModalOpen(true);
                        }}
                        title={isMe ? 'Đổi ảnh đại diện' : undefined}
                        className={isMe ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
                      >
                        <PlayerAvatar player={player} size={24} dimmed={!player.connected} className={`ring-1 ${isMe ? 'ring-[#B9C0EA]' : 'ring-[#262E66]'} sm:!w-7 sm:!h-7`} />
                      </button>
                      <span className={`w-full text-center truncate text-[10px] sm:text-[11px] font-bold leading-tight ${isMe ? 'text-[#B9C0EA]' : player.connected ? 'text-[#CDD2F2]' : 'text-[#6D75AD]'}`}>
                        {player.name}
                        {room.hostId === player.id ? ' · Host' : ''}
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[11px] font-heading font-bold text-[#6D75AD] group-hover:text-[#B9C0EA]">
                      <Eye size={11} />
                      {seatNum}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Kết quả nạp bộ đề: hiện đầy đủ (nhiều dòng), không bị cắt */}
      {isHost && uploadStatus && (
        <div
          role="status"
          className={`w-full my-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold whitespace-pre-line max-h-32 overflow-y-auto shrink-0 flex items-start justify-between gap-2 ${
            uploadOk === false
              ? 'bg-[#FF5D8F]/10 border-[#FF5D8F]/50 text-[#FFB6CF]'
              : uploadOk
              ? 'bg-[#43E6B5]/10 border-[#43E6B5]/50 text-[#43E6B5]'
              : 'bg-[#F7C873]/10 border-[#F7C873]/40 text-[#F7C873]'
          }`}
        >
          <span className="min-w-0 break-words">{uploadStatus}</span>
          <button onClick={() => setUploadStatus('')} className="shrink-0 opacity-80 hover:opacity-100" aria-label="Đóng thông báo">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Bottom Host / Waiting Control Bar */}
      {isHost ? (
        <div className="w-full bg-[#0A0D22] border border-[#262E66] rounded-2xl px-4 py-2.5 sm:py-3 shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-heading font-bold text-[#EEF0FF]">
              <Shield size={16} className="text-[#F7C873]" />
              <span>Nạp đề:</span>
            </div>
            <a
              href="/api/question-template"
              download="olympia_bo_de_mau.xlsx"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#11163A] hover:bg-[#161B45] text-[#EEF0FF] text-xs font-heading font-bold rounded-xl border border-[#262E66] hover:border-[#F7C873]/60 transition-all cursor-pointer"
              title="Tải file mẫu Excel chuẩn"
            >
              <Download size={14} />
              <span>Excel mẫu</span>
            </a>
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-[#11163A] hover:bg-[#161B45] text-[#B9C0EA] text-xs font-heading font-bold rounded-xl border border-[#B9C0EA]/50 hover:border-[#F7C873]/60 transition-all">
              <Upload size={14} />
              <span>Nạp file (.xlsx / .json)</span>
              <input type="file" accept=".xlsx,.xls,.json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#A6ACDB]">
              Thí sinh:{' '}
              <strong className={connectedContestants.length >= 2 ? 'text-[#43E6B5]' : 'text-[#F7C873]'}>
                {connectedContestants.length}/{GAME_CONFIG.MIN_PLAYERS_FOR_TEST}
              </strong>
            </span>
            <button
              onClick={startGame}
              disabled={!canStart}
              className={`px-6 py-2.5 rounded-xl font-heading font-extrabold uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2 border transition-all ${
                canStart
                  ? 'bg-[#F7C873] hover:bg-[#FBE0A8] text-[#05060F] border-[#F7C873] shadow-glow-yellow hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-[#11163A] text-[#6D75AD] border-[#262E66] cursor-not-allowed'
              }`}
            >
              <Play size={16} fill="currentColor" />
              <span>Bắt đầu trận đấu</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full bg-[#0A0D22] border border-[#262E66] rounded-2xl px-4 py-2.5 text-center text-xs sm:text-sm font-heading font-bold text-[#A6ACDB] shadow-lg shrink-0 flex items-center justify-center gap-2">
          <span>Đang chờ chủ phòng bắt đầu trận đấu…</span>
          {myRole === 'viewer' && (
            <span className="text-[#B9C0EA] bg-[#B9C0EA]/10 px-2.5 py-0.5 rounded-md border border-[#B9C0EA]/30">
              (Bạn đang ở vị trí Người theo dõi)
            </span>
          )}
        </div>
      )}

      {avatarModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAvatarModalOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Đổi ảnh đại diện"
            className="w-full max-w-sm bg-[#0A0D22] border-2 border-[#262E66] rounded-3xl hud p-5 shadow-2xl text-[#EEF0FF]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-black uppercase tracking-wider text-sm">Đổi ảnh đại diện</h3>
              <button type="button" onClick={() => setAvatarModalOpen(false)} aria-label="Đóng" className="p-1 rounded-md hover:bg-[#11163A] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <AvatarPicker
              value={myPlayer.avatar || avatar}
              onChange={(seed) => {
                setAvatar(seed);
                setMyAvatar(seed);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/** Ảnh đại diện trong ô ghế ở Sảnh chờ, kèm số ghế; ảnh của chính mình bấm được để đổi. */
const SeatAvatar: React.FC<{
  player: { avatar?: string; name: string; connected: boolean };
  isMe: boolean;
  seatLabel: string;
  accent: 'yellow' | 'cyan';
  onEdit: () => void;
}> = ({ player, isMe, seatLabel, accent, onEdit }) => {
  const ring = accent === 'yellow' ? 'ring-[#F7C873]' : 'ring-[#B9C0EA]';
  const badge = accent === 'yellow' ? 'bg-[#F7C873]' : 'bg-[#B9C0EA]';
  const content = (
    <>
      <PlayerAvatar player={player} size={44} dimmed={!player.connected} className={`ring-2 ${isMe ? ring : 'ring-[#262E66]'} sm:!w-12 sm:!h-12 lg:!w-14 lg:!h-14`} />
      <span className={`absolute -bottom-1 -right-2 ${badge} text-[#05060F] text-[10px] font-heading font-black px-1.5 rounded-full leading-4 whitespace-nowrap`}>
        {seatLabel}
      </span>
    </>
  );
  if (!isMe) return <div className="relative mb-1.5">{content}</div>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      title="Đổi ảnh đại diện"
      className="relative mb-1.5 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
    >
      {content}
    </button>
  );
};
