import { GAME_CONFIG, PredictionCategoryId, PredictionState } from '@olympia/shared';

/** Bản phía client của các phép tính trong server/src/game/predictions.ts (chỉ để hiển thị). */

export function balanceOf(state: PredictionState | undefined, viewerId: string): number {
  return state?.balances[viewerId] ?? GAME_CONFIG.PREDICTIONS.START_POINTS;
}

export function freePoints(state: PredictionState | undefined, viewerId: string, except?: PredictionCategoryId): number {
  const bets = state?.bets[viewerId] ?? {};
  let pending = 0;
  for (const [cat, bet] of Object.entries(bets)) {
    if (cat === except || !bet || bet.result) continue;
    pending += bet.stake;
  }
  return Math.max(0, balanceOf(state, viewerId) - pending);
}

export function leaderboardOf(state: PredictionState | undefined): { viewerId: string; points: number; wins: number }[] {
  if (!state) return [];
  return Object.keys(state.bets)
    .filter((id) => Object.keys(state.bets[id] ?? {}).length > 0)
    .map((viewerId) => ({
      viewerId,
      points: balanceOf(state, viewerId),
      wins: Object.values(state.bets[viewerId] ?? {}).filter((b) => b?.result === 'win').length,
    }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins);
}

export function optionLabel(option: string, nameOf: (id: string) => string | undefined): string {
  if (option === 'none') return 'Không ai';
  if (option === 'yes') return 'Có';
  if (option === 'no') return 'Không';
  return nameOf(option) ?? 'Thí sinh đã rời phòng';
}
