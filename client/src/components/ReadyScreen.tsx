import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CountdownTimer } from './CountdownTimer';
import { CheckCircle2, AlertCircle, UserX } from 'lucide-react';

export const ReadyScreen: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const myPlayer = useGameStore((s) => s.player);
  const setReady = useGameStore((s) => s.setReady);
  const skipAbsent = useGameStore((s) => s.skipAbsent);

  if (!room || !myPlayer) return null;

  const isHost = room.hostId === myPlayer.id;
  const targetRound = room.state.targetRound || 'KD_RIENG';
  const isCountdown = room.state.subPhase === 'COUNTDOWN';

  const roundNames: Record<string, string> = {
    KD_RIENG: 'VÒNG 1: KHỞI ĐỘNG',
    VCNV: 'VÒNG 2: VƯỢT CHƯỚNG NGẠI VẬT',
    TANG_TOC: 'VÒNG 3: TĂNG TỐC',
    VE_DICH: 'VÒNG 4: VỀ ĐÍCH',
  };

  const currentRoundTitle = roundNames[targetRound] || 'VÒNG TIẾP THEO';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur text-center flex flex-col items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">
          Chuẩn bị bước vào
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200 mb-6">
          {currentRoundTitle}
        </h2>

        {isCountdown ? (
          <div className="my-6 flex flex-col items-center">
            <span className="text-xs uppercase font-bold text-slate-400 mb-2">Trận đấu bắt đầu sau</span>
            <CountdownTimer deadline={room.state.deadline} totalDurationSeconds={3} />
          </div>
        ) : (
          <div className="w-full space-y-4 mb-6">
            <p className="text-xs sm:text-sm text-slate-300">
              Vui lòng bấm nút <b>Sẵn sàng</b> để xác nhận và nạp phương tiện cho vòng đấu.
            </p>

            <button
              onClick={() => setReady(true)}
              disabled={myPlayer.ready}
              className={`w-full max-w-xs mx-auto py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all ${
                myPlayer.ready
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer'
              }`}
            >
              <CheckCircle2 size={18} />
              <span>{myPlayer.ready ? 'Bạn đã sẵn sàng' : 'Tôi đã sẵn sàng'}</span>
            </button>
          </div>
        )}

        {/* Players Readiness List */}
        <div className="w-full border-t border-slate-800/80 pt-4 mt-2">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-3 text-left">
            Trạng thái sẵn sàng của các thí sinh:
          </h4>
          <div className="space-y-2">
            {room.players.map((p) => {
              const isAbsent = !p.connected && p.disconnectedAt && Date.now() - p.disconnectedAt > 60000;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">G{p.seat}</span>
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    {!p.connected && (
                      <span className="flex items-center gap-1 text-[10px] text-rose-400">
                        <AlertCircle size={10} /> Mất kết nối
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        p.ready
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      }`}
                    >
                      {p.ready ? 'Sẵn sàng' : 'Chưa sẵn sàng'}
                    </span>

                    {/* Host skip absent button if disconnected > 60s */}
                    {isHost && isAbsent && !p.ready && (
                      <button
                        onClick={() => skipAbsent(p.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-semibold transition-colors"
                        title="Bỏ qua thí sinh mất kết nối quá 60s"
                      >
                        <UserX size={10} />
                        <span>Bỏ qua</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
