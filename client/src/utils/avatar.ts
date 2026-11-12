import multiavatar from '@multiavatar/multiavatar/esm';

const STORAGE_KEY = 'olympia_avatar';
const cache = new Map<string, string>();

/** Ảnh SVG Multiavatar dạng data URL, cache theo seed (mỗi seed chỉ vẽ một lần). */
export function avatarUrl(seed: string): string {
  let url = cache.get(seed);
  if (!url) {
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(multiavatar(seed || 'olympia'))}`;
    cache.set(seed, url);
  }
  return url;
}

/** Seed hiển thị của người chơi: avatar đã chọn, không có thì dùng tên. */
export function playerAvatarSeed(p: { avatar?: string; name: string }): string {
  return p.avatar || p.name;
}

export function randomAvatarSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function loadMyAvatar(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch {
    /* bộ nhớ trình duyệt bị chặn */
  }
  const seed = randomAvatarSeed();
  saveMyAvatar(seed);
  return seed;
}

export function saveMyAvatar(seed: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, seed);
  } catch {
    /* bỏ qua */
  }
}
