/**
 * Mức hiệu ứng theo sức máy.
 *  - 'high': máy tính khỏe → nền ngân hà đầy đủ.
 *  - 'low' : máy yếu, điện thoại, bật tiết kiệm dữ liệu hoặc "giảm chuyển động" → ít sao hơn, không mờ kính,
 *            không lớp trôi/xoay, khung hình thấp hơn.
 * Mức được gắn vào <html data-perf="..."> để CSS cũng dùng được. Nếu đang 'high' mà máy không theo kịp
 * (GalaxyBackground đo được), tự hạ xuống 'low' cho hết phiên.
 *
 * Ép mức bằng tay (để thử): localStorage.setItem('olympia_perf', 'low' | 'high') rồi tải lại trang.
 */

export type PerfTier = 'high' | 'low';

const FORCE_KEY = 'olympia_perf';
const AUTO_KEY = 'olympia_perf_auto';

type NavigatorWithHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

const matches = (query: string) => {
  try {
    return window.matchMedia?.(query).matches ?? false;
  } catch {
    return false;
  }
};

export function detectPerfTier(): PerfTier {
  try {
    const forced = localStorage.getItem(FORCE_KEY);
    if (forced === 'high' || forced === 'low') return forced;
  } catch {
    /* bộ nhớ trình duyệt bị chặn: bỏ qua */
  }
  try {
    if (sessionStorage.getItem(AUTO_KEY) === 'low') return 'low';
  } catch {
    /* bỏ qua */
  }

  const nav = navigator as NavigatorWithHints;
  if (matches('(prefers-reduced-motion: reduce)')) return 'low';
  if (nav.connection?.saveData) return 'low';
  if ((nav.hardwareConcurrency ?? 8) <= 4) return 'low';
  if ((nav.deviceMemory ?? 8) <= 4) return 'low';
  // Điện thoại / máy tính bảng: ưu tiên mát máy và đỡ tốn pin
  if (matches('(pointer: coarse)') && Math.min(window.screen.width, window.screen.height) < 900) return 'low';
  return 'high';
}

let current: PerfTier = 'high';
const listeners = new Set<(tier: PerfTier) => void>();

export function getPerfTier(): PerfTier {
  return current;
}

export function applyPerfTier(tier: PerfTier): void {
  current = tier;
  document.documentElement.dataset.perf = tier;
  listeners.forEach((fn) => fn(tier));
}

/** Máy không theo kịp hiệu ứng đầy đủ: hạ xuống 'low' và nhớ cho tới khi đóng tab. */
export function downgradePerf(): void {
  if (current === 'low') return;
  try {
    sessionStorage.setItem(AUTO_KEY, 'low');
  } catch {
    /* bỏ qua */
  }
  applyPerfTier('low');
}

export function onPerfTierChange(fn: (tier: PerfTier) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
