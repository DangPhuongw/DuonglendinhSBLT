import React, { useState } from 'react';
import { GAME_CONFIG, PREDICTION_CATEGORIES, PredictionCategoryDef } from '@olympia/shared';
import { Lock, Check, X as XIcon, RotateCcw, Minus, Plus } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { PlayerAvatar } from './PlayerAvatar';
import { balanceOf, freePoints, optionLabel } from '../utils/predictions';

const P = GAME_CONFIG.PREDICTIONS;

/** Nội dung bảng dự đoán của khán giả (dự đoán từng hạng mục). */
export const PredictionPanel: React.FC = () => {
  const room = useGameStore((s) => s.room);
  const me = useGameStore((s) => s.player);
  if (!room || !me) return null;

  const state = room.predictions;
  const balance = balanceOf(state, me.id);
  const free = freePoints(state, me.id);
  const contestants = room.players.filter((p) => (p.role || 'player') === 'player').sort((a, b) => a.seat - b.seat);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-heading font-black uppercase tracking-wider text-[#F7C873]">Bảng dự đoán</span>
        <span className="text-xs font-bold text-[#A6ACDB]">
          <span className="font-digital text-sm text-[#F7C873]">{balance}</span> điểm · rảnh{' '}
          <span className="font-digital text-sm text-[#EEF0FF]">{free}</span>
        </span>
      </div>
      <p className="mb-2 text-[11px] text-[#6D75AD] leading-snug">
        Mỗi hạng mục dự đoán với {P.MIN_STAKE}–{P.MAX_STAKE} điểm. Đúng được cộng, sai bị trừ đúng số điểm đã dùng.
      </p>
      <div className="flex flex-col gap-2">
        {PREDICTION_CATEGORIES.map((def) => (
          <CategoryCard key={def.id} def={def} contestants={contestants} />
        ))}
      </div>
    </div>
  );
};

const CategoryCard: React.FC<{
  def: PredictionCategoryDef;
  contestants: { id: string; name: string; avatar?: string }[];
}> = ({ def, contestants }) => {
  const room = useGameStore((s) => s.room)!;
  const me = useGameStore((s) => s.player)!;
  const placePrediction = useGameStore((s) => s.placePrediction);
  const state = room.predictions;
  const cat = state?.categories[def.id] ?? { status: 'open' as const };
  const myBet = state?.bets[me.id]?.[def.id];
  const nameOf = (id: string) => room.players.find((p) => p.id === id)?.name;

  const [option, setOption] = useState<string | null>(myBet?.option ?? null);
  const [stake, setStake] = useState<number>(myBet?.stake ?? 50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const maxForThis = Math.min(P.MAX_STAKE, freePoints(state, me.id, def.id));
  const options =
    def.options === 'yes_no'
      ? [{ id: 'yes' }, { id: 'no' }]
      : contestants.map((c) => ({ id: c.id }));

  const submit = async (nextStake: number) => {
    if (nextStake > 0 && !option) return setError('Chọn một đáp án trước nhé.');
    setBusy(true);
    setError('');
    const res = await placePrediction(def.id, option ?? '', nextStake);
    setBusy(false);
    if (!res.ok) setError(res.error || 'Không gửi được dự đoán.');
  };

  const clampStake = (v: number) => Math.max(P.MIN_STAKE, Math.min(maxForThis, Math.round(v / P.STAKE_STEP) * P.STAKE_STEP));
  const changed = !myBet || myBet.option !== option || myBet.stake !== stake;

  // ---- Đã có kết quả / đã khóa
  if (cat.status !== 'open') {
    const winners = (cat.winners ?? []).map((w) => optionLabel(w, nameOf)).join(', ');
    return (
      <div className="rounded-xl bg-[#0D1130] border border-[#262E66] px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs sm:text-sm font-bold text-[#CDD2F2] leading-snug">{def.label}</span>
          <StatusChip status={cat.status} result={myBet?.result} stake={myBet?.stake} />
        </div>
        <div className="mt-1 text-[11px] sm:text-xs text-[#A6ACDB]">
          {myBet ? (
            <>
              Bạn dự đoán{' '}
              <span className="font-bold text-[#EEF0FF]">{optionLabel(myBet.option, nameOf)}</span> với{' '}
              <span className="font-bold text-[#EEF0FF]">{myBet.stake}</span> điểm
            </>
          ) : (
            'Bạn không dự đoán hạng mục này'
          )}
          {cat.status === 'resolved' && winners && (
            <>
              {' · '}Kết quả: <span className="font-bold text-[#F7C873]">{winners}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- Đang mở: chọn đáp án + số điểm
  return (
    <div className={`rounded-xl border px-3 py-2 ${myBet ? 'bg-[#1D1A38] border-[#F7C873]/50' : 'bg-[#0D1130] border-[#262E66]'}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs sm:text-sm font-bold text-[#EEF0FF] leading-snug">{def.label}</span>
        <span className="shrink-0 text-[10px] text-[#6D75AD] font-medium">{def.lockLabel}</span>
      </div>

      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const player = contestants.find((c) => c.id === o.id);
          const selected = option === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setOption(o.id)}
              className={`flex items-center gap-1 rounded-full border pl-1 pr-2.5 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                selected ? 'bg-[#F7C873] text-[#05060F] border-[#F7C873]' : 'bg-[#0A0D22] text-[#CDD2F2] border-[#262E66] hover:border-[#F7C873]/60'
              } ${player ? '' : 'pl-2.5'}`}
            >
              {player && <PlayerAvatar player={player} size={18} />}
              <span className="max-w-[90px] truncate">{optionLabel(o.id, (id) => contestants.find((c) => c.id === id)?.name)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setStake((v) => clampStake(v - P.STAKE_STEP))}
          className="w-7 h-7 rounded-lg bg-[#0A0D22] border border-[#262E66] text-[#CDD2F2] flex items-center justify-center cursor-pointer disabled:opacity-40"
          disabled={stake <= P.MIN_STAKE}
          aria-label="Giảm điểm dự đoán"
        >
          <Minus size={13} />
        </button>
        <span className="w-12 text-center font-digital font-bold text-[#F7C873] tabular-nums">{stake}</span>
        <button
          type="button"
          onClick={() => setStake((v) => clampStake(v + P.STAKE_STEP))}
          className="w-7 h-7 rounded-lg bg-[#0A0D22] border border-[#262E66] text-[#CDD2F2] flex items-center justify-center cursor-pointer disabled:opacity-40"
          disabled={stake >= maxForThis}
          aria-label="Tăng điểm dự đoán"
        >
          <Plus size={13} />
        </button>
        <button
          type="button"
          onClick={() => setStake(clampStake(maxForThis))}
          className="px-2 h-7 rounded-lg bg-[#0A0D22] border border-[#262E66] text-[10px] font-heading font-black text-[#A6ACDB] hover:text-[#F7C873] cursor-pointer"
        >
          TỐI ĐA
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          {myBet && (
            <button
              type="button"
              onClick={() => submit(0)}
              disabled={busy}
              className="h-7 px-2 rounded-lg text-[11px] font-bold text-[#A6ACDB] hover:text-[#FF5D8F] cursor-pointer"
              title="Hủy dự đoán hạng mục này"
            >
              Hủy
            </button>
          )}
          <button
            type="button"
            onClick={() => submit(stake)}
            disabled={busy || !changed || maxForThis < P.MIN_STAKE}
            className="h-7 px-3 rounded-lg bg-[#F7C873] hover:bg-[#FBE0A8] text-[#05060F] text-xs font-heading font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {myBet ? (changed ? 'Đổi dự đoán' : 'Đã dự đoán') : 'Dự đoán'}
          </button>
        </div>
      </div>
      {maxForThis < P.MIN_STAKE && !myBet && <p className="mt-1 text-[11px] text-[#A6ACDB]">Bạn đã dùng hết điểm rảnh.</p>}
      {error && <p className="mt-1 text-[11px] font-bold text-[#FF5D8F]" role="alert">{error}</p>}
    </div>
  );
};

const StatusChip: React.FC<{ status: string; result?: 'win' | 'lose' | 'void'; stake?: number }> = ({ status, result, stake }) => {
  const base = 'shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-heading font-black';
  if (result === 'win') return <span className={`${base} bg-[#43E6B5]/15 text-[#43E6B5]`}><Check size={11} />+{stake}</span>;
  if (result === 'lose') return <span className={`${base} bg-[#FF5D8F]/15 text-[#FF5D8F]`}><XIcon size={11} />−{stake}</span>;
  if (result === 'void' || status === 'void') return <span className={`${base} bg-[#262E66]/60 text-[#A6ACDB]`}><RotateCcw size={11} />Hoàn lại</span>;
  if (status === 'resolved') return <span className={`${base} bg-[#262E66]/60 text-[#A6ACDB]`}>Đã có kết quả</span>;
  return <span className={`${base} bg-[#262E66]/60 text-[#A6ACDB]`}><Lock size={11} />Đã khóa</span>;
};
