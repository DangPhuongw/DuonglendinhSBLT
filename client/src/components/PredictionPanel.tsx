import React, { useState } from 'react';
import { GAME_CONFIG, PREDICTION_CATEGORIES, PredictionCategoryDef } from '@olympia/shared';
import { Lock, Check, X as XIcon, RotateCcw, Minus, Plus } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { PlayerAvatar } from './PlayerAvatar';
import { balanceOf, freePoints, optionLabel } from '../utils/predictions';

const P = GAME_CONFIG.PREDICTIONS;

/** Nội dung bảng dự đoán của khán giả (đặt cược từng hạng mục). */
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
        <span className="text-xs font-heading font-black uppercase tracking-wider text-[#FFD43B]">Bảng dự đoán</span>
        <span className="text-xs font-bold text-[#94A3B8]">
          <span className="font-digital text-sm text-[#FFD43B]">{balance}</span> điểm · rảnh{' '}
          <span className="font-digital text-sm text-[#F8FAFC]">{free}</span>
        </span>
      </div>
      <p className="mb-2 text-[11px] text-[#64748B] leading-snug">
        Mỗi hạng mục cược {P.MIN_STAKE}–{P.MAX_STAKE} điểm. Đúng được cộng, sai bị trừ đúng số đã cược.
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
    if (!res.ok) setError(res.error || 'Không đặt được cược.');
  };

  const clampStake = (v: number) => Math.max(P.MIN_STAKE, Math.min(maxForThis, Math.round(v / P.STAKE_STEP) * P.STAKE_STEP));
  const changed = !myBet || myBet.option !== option || myBet.stake !== stake;

  // ---- Đã có kết quả / đã khóa
  if (cat.status !== 'open') {
    const winners = (cat.winners ?? []).map((w) => optionLabel(w, nameOf)).join(', ');
    return (
      <div className="rounded-xl bg-[#0E1524] border border-[#303D52] px-3 py-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs sm:text-sm font-bold text-[#CBD5E1] leading-snug">{def.label}</span>
          <StatusChip status={cat.status} result={myBet?.result} stake={myBet?.stake} />
        </div>
        <div className="mt-1 text-[11px] sm:text-xs text-[#94A3B8]">
          {myBet ? (
            <>
              Bạn cược <span className="font-bold text-[#F8FAFC]">{myBet.stake}</span> vào{' '}
              <span className="font-bold text-[#F8FAFC]">{optionLabel(myBet.option, nameOf)}</span>
            </>
          ) : (
            'Bạn không cược hạng mục này'
          )}
          {cat.status === 'resolved' && winners && (
            <>
              {' · '}Kết quả: <span className="font-bold text-[#FFD43B]">{winners}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- Đang mở: chọn đáp án + số điểm
  return (
    <div className={`rounded-xl border px-3 py-2 ${myBet ? 'bg-[#1A1A0E] border-[#FFD43B]/50' : 'bg-[#0E1524] border-[#303D52]'}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs sm:text-sm font-bold text-[#F8FAFC] leading-snug">{def.label}</span>
        <span className="shrink-0 text-[10px] text-[#64748B] font-medium">{def.lockLabel}</span>
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
                selected ? 'bg-[#FFD43B] text-[#090D18] border-[#FFD43B]' : 'bg-[#111827] text-[#CBD5E1] border-[#303D52] hover:border-[#FFD43B]/60'
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
          className="w-7 h-7 rounded-lg bg-[#111827] border border-[#303D52] text-[#CBD5E1] flex items-center justify-center cursor-pointer disabled:opacity-40"
          disabled={stake <= P.MIN_STAKE}
          aria-label="Giảm điểm cược"
        >
          <Minus size={13} />
        </button>
        <span className="w-12 text-center font-digital font-bold text-[#FFD43B] tabular-nums">{stake}</span>
        <button
          type="button"
          onClick={() => setStake((v) => clampStake(v + P.STAKE_STEP))}
          className="w-7 h-7 rounded-lg bg-[#111827] border border-[#303D52] text-[#CBD5E1] flex items-center justify-center cursor-pointer disabled:opacity-40"
          disabled={stake >= maxForThis}
          aria-label="Tăng điểm cược"
        >
          <Plus size={13} />
        </button>
        <button
          type="button"
          onClick={() => setStake(clampStake(maxForThis))}
          className="px-2 h-7 rounded-lg bg-[#111827] border border-[#303D52] text-[10px] font-heading font-black text-[#94A3B8] hover:text-[#FFD43B] cursor-pointer"
        >
          TỐI ĐA
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          {myBet && (
            <button
              type="button"
              onClick={() => submit(0)}
              disabled={busy}
              className="h-7 px-2 rounded-lg text-[11px] font-bold text-[#94A3B8] hover:text-[#FF496C] cursor-pointer"
              title="Hủy cược hạng mục này"
            >
              Hủy
            </button>
          )}
          <button
            type="button"
            onClick={() => submit(stake)}
            disabled={busy || !changed || maxForThis < P.MIN_STAKE}
            className="h-7 px-3 rounded-lg bg-[#FFD43B] hover:bg-[#ffe066] text-[#090D18] text-xs font-heading font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {myBet ? (changed ? 'Đổi cược' : 'Đã cược') : 'Đặt cược'}
          </button>
        </div>
      </div>
      {maxForThis < P.MIN_STAKE && !myBet && <p className="mt-1 text-[11px] text-[#94A3B8]">Bạn đã dùng hết điểm rảnh.</p>}
      {error && <p className="mt-1 text-[11px] font-bold text-[#FF496C]" role="alert">{error}</p>}
    </div>
  );
};

const StatusChip: React.FC<{ status: string; result?: 'win' | 'lose' | 'void'; stake?: number }> = ({ status, result, stake }) => {
  const base = 'shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-heading font-black';
  if (result === 'win') return <span className={`${base} bg-[#20D6A0]/15 text-[#20D6A0]`}><Check size={11} />+{stake}</span>;
  if (result === 'lose') return <span className={`${base} bg-[#FF496C]/15 text-[#FF496C]`}><XIcon size={11} />−{stake}</span>;
  if (result === 'void' || status === 'void') return <span className={`${base} bg-[#303D52]/60 text-[#94A3B8]`}><RotateCcw size={11} />Hoàn lại</span>;
  if (status === 'resolved') return <span className={`${base} bg-[#303D52]/60 text-[#94A3B8]`}>Đã có kết quả</span>;
  return <span className={`${base} bg-[#303D52]/60 text-[#94A3B8]`}><Lock size={11} />Đã khóa</span>;
};
