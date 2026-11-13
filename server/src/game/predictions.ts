import {
  GAME_CONFIG,
  PREDICTION_CATEGORIES,
  PredictionCategoryId,
  PredictionState,
  RoundType,
} from '@olympia/shared';

/**
 * Bảng dự đoán của khán giả: mỗi khán giả có START_POINTS điểm, dự đoán từng hạng mục
 * (tối đa MAX_STAKE / hạng mục, không quá số điểm còn rảnh). Hạng mục bị khóa khi vòng tương ứng bắt đầu,
 * được chấm khi có kết quả: đúng +điểm đã dùng, sai -điểm đã dùng, không xác định được thì hoàn lại.
 */

const P = GAME_CONFIG.PREDICTIONS;
const CATEGORY_IDS = PREDICTION_CATEGORIES.map((c) => c.id);

export function createPredictionState(): PredictionState {
  const categories = {} as PredictionState['categories'];
  for (const id of CATEGORY_IDS) categories[id] = { status: 'open' };
  return { categories, bets: {}, balances: {} };
}

export function getBalance(state: PredictionState, viewerId: string): number {
  return state.balances[viewerId] ?? P.START_POINTS;
}

/** Điểm đang nằm trong các dự đoán chưa có kết quả. */
export function pendingStake(state: PredictionState, viewerId: string, except?: PredictionCategoryId): number {
  const bets = state.bets[viewerId] ?? {};
  let sum = 0;
  for (const [cat, bet] of Object.entries(bets)) {
    if (cat === except || !bet || bet.result) continue;
    sum += bet.stake;
  }
  return sum;
}

/** Điểm còn rảnh để dự đoán thêm. */
export function availablePoints(state: PredictionState, viewerId: string, except?: PredictionCategoryId): number {
  return Math.max(0, getBalance(state, viewerId) - pendingStake(state, viewerId, except));
}

export function isCategoryId(value: unknown): value is PredictionCategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as string[]).includes(value);
}

/** Các lựa chọn hợp lệ của một hạng mục với danh sách thí sinh hiện tại. */
export function validOptions(category: PredictionCategoryId, contestantIds: string[]): string[] {
  const def = PREDICTION_CATEGORIES.find((c) => c.id === category)!;
  if (def.options === 'yes_no') return ['yes', 'no'];
  return contestantIds;
}

/** Đặt / đổi / hủy (stake = 0) một dự đoán. */
export function placeBet(
  state: PredictionState,
  viewerId: string,
  category: PredictionCategoryId,
  option: string,
  stake: number,
  contestantIds: string[]
): { ok: boolean; error?: string } {
  const cat = state.categories[category];
  if (!cat || cat.status !== 'open') return { ok: false, error: 'Hạng mục này đã khóa, không dự đoán được nữa.' };
  if (!Number.isInteger(stake) || stake < 0) return { ok: false, error: 'Số điểm dự đoán không hợp lệ.' };

  const mine = (state.bets[viewerId] ??= {});
  if (stake === 0) {
    delete mine[category];
    return { ok: true };
  }
  if (stake < P.MIN_STAKE || stake > P.MAX_STAKE) {
    return { ok: false, error: `Mỗi hạng mục dự đoán từ ${P.MIN_STAKE} đến ${P.MAX_STAKE} điểm.` };
  }
  if (!validOptions(category, contestantIds).includes(option)) return { ok: false, error: 'Lựa chọn không hợp lệ.' };

  const free = availablePoints(state, viewerId, category);
  if (stake > free) return { ok: false, error: `Bạn chỉ còn ${free} điểm rảnh để dự đoán.` };

  state.balances[viewerId] = getBalance(state, viewerId);
  mine[category] = { option, stake };
  return { ok: true };
}

/** Vòng `round` bắt đầu: khóa các hạng mục khóa tại vòng đó. */
export function lockForRound(state: PredictionState, round: RoundType): void {
  for (const def of PREDICTION_CATEGORIES) {
    const cat = state.categories[def.id];
    if (def.lockAt === round && cat.status === 'open') cat.status = 'locked';
  }
}

/** Chấm một hạng mục. `winners` = các lựa chọn đúng (đồng hạng thì nhiều); null = không xác định được, hoàn lại. */
export function resolveCategory(state: PredictionState, category: PredictionCategoryId, winners: string[] | null): void {
  const cat = state.categories[category];
  if (!cat || cat.status === 'resolved' || cat.status === 'void') return;

  const isVoid = !winners || winners.length === 0;
  cat.status = isVoid ? 'void' : 'resolved';
  if (!isVoid) cat.winners = winners!;

  for (const [viewerId, bets] of Object.entries(state.bets)) {
    const bet = bets[category];
    if (!bet || bet.result) continue;
    const balance = getBalance(state, viewerId);
    if (isVoid) {
      bet.result = 'void';
    } else if (winners!.includes(bet.option)) {
      bet.result = 'win';
      state.balances[viewerId] = balance + bet.stake;
    } else {
      bet.result = 'lose';
      state.balances[viewerId] = balance - bet.stake;
    }
  }
}

/** Kết thúc trận: hạng mục nào chưa có kết quả (vòng không diễn ra...) thì hoàn lại. */
export function voidUnresolved(state: PredictionState): void {
  for (const id of CATEGORY_IDS) {
    const status = state.categories[id].status;
    if (status === 'open' || status === 'locked') resolveCategory(state, id, null);
  }
}

/** Bỏ dự đoán của những người không còn là khán giả (ví dụ chuyển sang ghế thí sinh trước khi bắt đầu). */
export function dropBetsOfNonViewers(state: PredictionState, viewerIds: Set<string>): void {
  for (const id of Object.keys(state.bets)) {
    if (!viewerIds.has(id)) {
      delete state.bets[id];
      delete state.balances[id];
    }
  }
}

/** Người có điểm cao nhất theo một tiêu chí (đồng điểm thì tất cả cùng đúng). */
export function topBy<T>(items: T[], score: (x: T) => number, id: (x: T) => string, lowest = false): string[] {
  if (items.length === 0) return [];
  const values = items.map(score);
  const best = lowest ? Math.min(...values) : Math.max(...values);
  return items.filter((_, i) => values[i] === best).map(id);
}

/** Xếp hạng khán giả đã tham gia dự đoán theo điểm (cao xuống thấp). */
export function predictionLeaderboard(state: PredictionState): { viewerId: string; points: number; wins: number }[] {
  return Object.keys(state.bets)
    .filter((id) => Object.keys(state.bets[id] ?? {}).length > 0)
    .map((viewerId) => ({
      viewerId,
      points: getBalance(state, viewerId),
      wins: Object.values(state.bets[viewerId] ?? {}).filter((b) => b?.result === 'win').length,
    }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins);
}
