import React, { useEffect, useRef, useState } from 'react';
import { downgradePerf, getPerfTier, onPerfTierChange, PerfTier } from '../utils/perf';

/**
 * Nền ngân hà nhiều lớp (đều nằm dưới nội dung, không bắt chuột):
 *  1. Nền vũ trụ + mây tinh vân tím/hồng/xanh băng (CSS gradient)
 *  2. Dải ngân hà chéo: quầng bụi sao vẽ một lần lên canvas
 *  3. Hàng nghìn sao xa li ti (vẽ một lần), dày hơn trong dải ngân hà
 *  4. Lớp động: sao lấp lánh, sao trôi qua màn hình, vài sao sáng có tia chữ thập, sao băng
 *  5. Lưới kỹ thuật mờ, vignette, hạt nhiễu phim
 *
 * Tối ưu cho máy yếu / điện thoại:
 *  - Có hai mức (xem utils/perf.ts). Mức 'low': độ phân giải 1x, ít sao hơn, 20 khung hình/giây,
 *    không vẽ quá khổ (không có lớp trôi), CSS tắt lớp xoay / thở / hạt nhiễu / kính mờ.
 *  - Sao sáng được vẽ sẵn thành ảnh (sprite), mỗi khung chỉ drawImage: không tạo gradient mới.
 *  - Sao được gom theo màu: mỗi khung chỉ đổi màu vài lần, độ sáng đổi bằng globalAlpha (không tạo chuỗi màu).
 *  - Tự đo: nếu đang mức 'high' mà máy không theo kịp thì tự hạ xuống 'low'.
 *  - Tạm dừng khi tab ẩn; đứng yên hoàn toàn nếu người dùng bật "giảm chuyển động".
 */

type RGB = [number, number, number];

const TINTS: { c: RGB; w: number }[] = [
  { c: [238, 240, 255], w: 40 }, // trắng
  { c: [170, 200, 255], w: 26 }, // trắng xanh
  { c: [255, 226, 170], w: 14 }, // vàng nhạt
  { c: [196, 170, 255], w: 12 }, // tím nhạt
  { c: [255, 175, 215], w: 8 }, // hồng nhạt
];
const TINT_TOTAL = TINTS.reduce((s, t) => s + t.w, 0);
const TINT_CSS = TINTS.map((t) => `rgb(${t.c[0]},${t.c[1]},${t.c[2]})`);

interface TierConfig {
  dprCap: number;
  /** Vẽ quá khổ để lớp trôi (CSS) không lộ mép. 1 = không quá khổ (mức nhẹ không có lớp trôi). */
  over: number;
  farStars: number;
  hazeBlobs: number;
  twinklers: number;
  drifters: number;
  brights: number;
  frameMs: number;
  shooterEvery: [number, number];
  maxShooters: number;
}

const CONFIG: Record<PerfTier, TierConfig> = {
  high: { dprCap: 1.5, over: 1.14, farStars: 3600, hazeBlobs: 90, twinklers: 420, drifters: 90, brights: 7, frameMs: 33, shooterEvery: [3, 7], maxShooters: 3 },
  low: { dprCap: 1, over: 1, farStars: 1800, hazeBlobs: 50, twinklers: 140, drifters: 32, brights: 3, frameMs: 50, shooterEvery: [6, 12], maxShooters: 1 },
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickTint(rand: () => number): number {
  let r = rand() * TINT_TOTAL;
  for (let i = 0; i < TINTS.length; i++) {
    r -= TINTS[i].w;
    if (r <= 0) return i;
  }
  return 0;
}

/** Khoảng cách chuẩn hóa tới trục dải ngân hà (0 = trên trục). */
function bandDistance(x: number, y: number, w: number, h: number): number {
  const angle = -0.5;
  const d = Math.abs((x - w * 0.5) * Math.sin(angle) - (y - h * 0.5) * Math.cos(angle));
  return d / (Math.min(w, h) * 0.2);
}

function fitCanvas(c: HTMLCanvasElement, w: number, h: number, dpr: number) {
  c.width = Math.round(w * dpr);
  c.height = Math.round(h * dpr);
  c.style.width = `${w}px`;
  c.style.height = `${h}px`;
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return ctx;
}

/** Quầng sáng mềm (dùng cho sao trôi to). */
function makeGlowSprite(rgb: RGB, size = 48): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`);
  g.addColorStop(0.2, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.4)`);
  g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/** Sao sáng: quầng + tia chữ thập, vẽ sẵn một lần. */
function makeFlareSprite(rgb: RGB, size = 64): HTMLCanvasElement {
  const c = makeGlowSprite(rgb, size);
  const ctx = c.getContext('2d')!;
  const m = size / 2;
  for (const vertical of [false, true]) {
    const g = vertical ? ctx.createLinearGradient(m, 0, m, size) : ctx.createLinearGradient(0, m, size, m);
    g.addColorStop(0, 'rgba(225,232,255,0)');
    g.addColorStop(0.5, 'rgba(240,244,255,0.85)');
    g.addColorStop(1, 'rgba(225,232,255,0)');
    ctx.fillStyle = g;
    if (vertical) ctx.fillRect(m - 0.5, 0, 1, size);
    else ctx.fillRect(0, m - 0.5, size, 1);
  }
  return c;
}

/** Sao lấp lánh / sao trôi: lưu dạng mảng số liền nhau, đã gom theo màu. */
interface StarBatch {
  tint: number;
  x: Float32Array;
  y: Float32Array;
  size: Float32Array;
  /** Lấp lánh: độ sáng nền / tốc độ / pha. Trôi: vx / vy / độ sáng. */
  a: Float32Array;
  b: Float32Array;
  c: Float32Array;
}

function makeBatches(count: number, tintOf: () => number): { batches: StarBatch[]; slot: (i: number) => [StarBatch, number] } {
  const tints = Array.from({ length: count }, tintOf);
  const batches: StarBatch[] = TINTS.map((_, tint) => {
    const n = tints.filter((x) => x === tint).length;
    return {
      tint,
      x: new Float32Array(n),
      y: new Float32Array(n),
      size: new Float32Array(n),
      a: new Float32Array(n),
      b: new Float32Array(n),
      c: new Float32Array(n),
    };
  });
  const fill = TINTS.map(() => 0);
  const order = tints.map((t) => [t, fill[t]++] as [number, number]);
  return { batches, slot: (i) => [batches[order[i][0]], order[i][1]] };
}

interface Bright {
  x: number;
  y: number;
  s: number;
  sprite: number;
  speed: number;
  phase: number;
}
interface Shooter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  len: number;
}

export const GalaxyBackground: React.FC = React.memo(() => {
  const hazeRef = useRef<HTMLCanvasElement>(null);
  const farRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLCanvasElement>(null);
  const [tier, setTier] = useState<PerfTier>(getPerfTier);

  useEffect(() => onPerfTierChange(setTier), []);

  useEffect(() => {
    const haze = hazeRef.current;
    const far = farRef.current;
    const live = liveRef.current;
    if (!haze || !far || !live) return;

    const cfg = CONFIG[tier];
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let raf = 0;
    let resizeTimer = 0;
    let lw = 0; // kích thước CSS của canvas động
    let lh = 0;
    let dpr = 1;
    let twinkle: StarBatch[] = [];
    let drift: StarBatch[] = [];
    let brights: Bright[] = [];
    let shooters: Shooter[] = [];
    let nextShooter = 0;
    let last = 0;
    // Bộ đo hiệu năng (chỉ ở mức 'high')
    let costSum = 0;
    let costN = 0;
    let gapSum = 0;
    let gapN = 0;
    let warmup = 0;
    const flares = [makeFlareSprite([200, 215, 255]), makeFlareSprite([255, 226, 170]), makeFlareSprite([196, 170, 255])];
    const glow = makeGlowSprite([200, 215, 255]);

    const build = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const w = Math.round(width * cfg.over);
      const h = Math.round(height * cfg.over);
      dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
      lw = w;
      lh = h;
      const rand = mulberry32(20261113);

      // --- Quầng sáng dải ngân hà (vẽ một lần, độ phân giải thấp là đủ vì rất mờ)
      const hz = fitCanvas(haze, w, h, 1);
      hz.globalCompositeOperation = 'lighter';
      const hazeColors: RGB[] = [
        [120, 96, 255],
        [90, 140, 255],
        [200, 110, 255],
        [255, 120, 190],
        [90, 210, 230],
      ];
      for (let i = 0; i < cfg.hazeBlobs; i++) {
        const along = (rand() - 0.5) * Math.hypot(w, h) * 1.1;
        const spread = (rand() - 0.5) * Math.min(w, h) * 0.34;
        const angle = -0.5;
        const x = w / 2 + along * Math.cos(angle) - spread * Math.sin(angle);
        const y = h / 2 + along * Math.sin(angle) + spread * Math.cos(angle);
        const r = 90 + rand() * 260;
        const col = hazeColors[Math.floor(rand() * hazeColors.length)];
        const g = hz.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${(0.02 + rand() * 0.045).toFixed(3)})`);
        g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        hz.fillStyle = g;
        hz.fillRect(x - r, y - r, r * 2, r * 2);
      }

      // --- Sao xa li ti (vẽ một lần), gom theo màu
      const fx = fitCanvas(far, w, h, dpr);
      const area = (w * h) / (1440 * 900);
      const total = Math.round(cfg.farStars * Math.min(1.4, Math.max(0.55, area)));
      for (let t = 0; t < TINTS.length; t++) {
        fx.fillStyle = TINT_CSS[t];
        let drawn = 0;
        let guard = 0;
        const want = Math.round((total * TINTS[t].w) / TINT_TOTAL);
        while (drawn < want && guard++ < want * 12) {
          const x = rand() * w;
          const y = rand() * h;
          const bd = bandDistance(x, y, w, h);
          if (rand() > 0.28 + 0.72 * Math.exp(-(bd * bd))) continue;
          const size = rand() < 0.9 ? 0.6 + rand() * 0.55 : 1.15 + rand() * 0.9;
          fx.globalAlpha = 0.4 + rand() * 0.55;
          fx.fillRect(x, y, size, size);
          drawn++;
        }
      }
      fx.globalAlpha = 1;

      // --- Lớp động
      fitCanvas(live, w, h, dpr);

      const tw = makeBatches(cfg.twinklers, () => pickTint(rand));
      for (let i = 0; i < cfg.twinklers; i++) {
        let x = 0;
        let y = 0;
        for (let k = 0; k < 20; k++) {
          x = rand() * w;
          y = rand() * h;
          const bd = bandDistance(x, y, w, h);
          if (rand() <= 0.3 + 0.7 * Math.exp(-(bd * bd))) break;
        }
        const [b, j] = tw.slot(i);
        b.x[j] = x;
        b.y[j] = y;
        b.size[j] = 0.8 + rand() * 1.1;
        b.a[j] = 0.3 + rand() * 0.35; // độ sáng nền
        b.b[j] = 0.5 + rand() * 1.8; // tốc độ nhấp nháy
        b.c[j] = rand() * Math.PI * 2; // pha
      }
      twinkle = tw.batches;

      // Sao trôi: lớp gần, trôi qua màn hình (to hơn thì nhanh hơn: có chiều sâu)
      const dr = makeBatches(cfg.drifters, () => pickTint(rand));
      for (let i = 0; i < cfg.drifters; i++) {
        const depth = rand();
        const speed = 5 + depth * 20;
        const ang = Math.PI * (1.18 + rand() * 0.2);
        const [b, j] = dr.slot(i);
        b.x[j] = rand() * w;
        b.y[j] = rand() * h;
        b.size[j] = 0.9 + depth * 1.3;
        b.a[j] = Math.cos(ang) * speed; // vx
        b.b[j] = Math.sin(ang) * speed; // vy
        b.c[j] = 0.45 + depth * 0.5; // độ sáng
      }
      drift = dr.batches;

      brights = Array.from({ length: cfg.brights }, () => ({
        x: rand() * w,
        y: rand() * h,
        s: 7 + rand() * 8,
        sprite: Math.floor(rand() * flares.length),
        speed: 0.25 + rand() * 0.5,
        phase: rand() * Math.PI * 2,
      }));
      shooters = [];
    };

    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) {
        last = 0;
        return;
      }
      if (last && ts - last < cfg.frameMs) return;
      const gap = last ? ts - last : cfg.frameMs;
      const dt = Math.min(gap, 100) / 1000;
      last = ts;
      const t0 = performance.now();
      const t = ts / 1000;

      const ctx = live.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, lw, lh);

      // Sao lấp lánh: đổi màu theo từng nhóm, đổi độ sáng bằng globalAlpha
      for (const b of twinkle) {
        ctx.fillStyle = TINT_CSS[b.tint];
        for (let j = 0; j < b.x.length; j++) {
          ctx.globalAlpha = b.a[j] + (1 - b.a[j]) * (0.5 + 0.5 * Math.sin(t * b.b[j] + b.c[j]));
          ctx.fillRect(b.x[j], b.y[j], b.size[j], b.size[j]);
        }
      }

      // Sao trôi
      for (const b of drift) {
        ctx.fillStyle = TINT_CSS[b.tint];
        for (let j = 0; j < b.x.length; j++) {
          let x = b.x[j] + b.a[j] * dt;
          let y = b.y[j] + b.b[j] * dt;
          if (x < -8) x = lw + 8;
          else if (x > lw + 8) x = -8;
          if (y < -8) y = lh + 8;
          else if (y > lh + 8) y = -8;
          b.x[j] = x;
          b.y[j] = y;
          const s = b.size[j];
          if (s > 2) {
            ctx.globalAlpha = 0.22;
            ctx.drawImage(glow, x - s * 2, y - s * 2, s * 4, s * 4);
          }
          ctx.globalAlpha = b.c[j];
          ctx.fillRect(x, y, s, s);
        }
      }

      // Sao sáng có tia chữ thập (ảnh vẽ sẵn)
      for (const b of brights) {
        const k = 0.55 + 0.45 * Math.sin(t * b.speed + b.phase);
        ctx.globalAlpha = 0.2 + 0.35 * k;
        const s = b.s * (0.85 + 0.25 * k);
        ctx.drawImage(flares[b.sprite], b.x - s, b.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;

      // Sao băng
      if (t > nextShooter && shooters.length < cfg.maxShooters) {
        const speed = 520 + Math.random() * 380;
        const ang = Math.PI * (0.62 + Math.random() * 0.12);
        shooters.push({
          x: lw * (0.35 + Math.random() * 0.6),
          y: lh * Math.random() * 0.45,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 0,
          max: 0.9 + Math.random() * 0.5,
          len: 90 + Math.random() * 90,
        });
        const [a, b] = cfg.shooterEvery;
        nextShooter = t + a + Math.random() * (b - a);
      }
      if (shooters.length) {
        shooters = shooters.filter((s) => s.life < s.max);
        ctx.lineWidth = 1.2;
        for (const s of shooters) {
          s.life += dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          const k = Math.sin(Math.min(1, s.life / s.max) * Math.PI);
          const mag = Math.hypot(s.vx, s.vy);
          const tx = s.x - (s.vx / mag) * s.len;
          const ty = s.y - (s.vy / mag) * s.len;
          const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
          g.addColorStop(0, `rgba(235,240,255,${(0.9 * k).toFixed(2)})`);
          g.addColorStop(0.4, `rgba(150,170,255,${(0.35 * k).toFixed(2)})`);
          g.addColorStop(1, 'rgba(150,170,255,0)');
          ctx.strokeStyle = g;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }

      // Tự đo: bỏ qua 2 giây đầu; khoảng cách khung lớn bất thường (tab vừa quay lại) không tính
      if (tier === 'high') {
        warmup += gap;
        if (warmup > 2000) {
          costSum += performance.now() - t0;
          costN++;
          if (gap < 250) {
            gapSum += gap;
            gapN++;
          }
          if (costN >= 90) {
            const avgCost = costSum / costN;
            const avgGap = gapN ? gapSum / gapN : cfg.frameMs;
            // Một khung nền > 7ms, hoặc trình duyệt không giữ nổi ~20 khung/giây: hạ xuống mức nhẹ
            if (avgCost > 7 || avgGap > 50) downgradePerf();
            costSum = costN = gapSum = gapN = 0;
          }
        }
      }
    };

    const start = () => {
      build();
      cancelAnimationFrame(raf);
      if (reduceMotion) {
        // Đứng yên: vẽ một khung duy nhất
        const ctx = live.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const b of [...twinkle, ...drift]) {
          ctx.fillStyle = TINT_CSS[b.tint];
          ctx.globalAlpha = 0.6;
          for (let j = 0; j < b.x.length; j++) ctx.fillRect(b.x[j], b.y[j], b.size[j], b.size[j]);
        }
        ctx.globalAlpha = 1;
        return;
      }
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(start, 250);
    };

    start();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [tier]);

  const lite = tier === 'low';
  return (
    <div className="galaxy-bg fixed inset-0 pointer-events-none overflow-hidden select-none -z-10" aria-hidden="true">
      <div className="galaxy-nebula absolute inset-0" />
      {!lite && <div className="galaxy-arms" />}
      {/* Ba lớp trôi ngược hướng nhau với tốc độ khác nhau (chỉ ở mức đầy đủ) */}
      <div className={`absolute ${lite ? 'inset-0' : '-inset-[7%]'}`}>
        <div className="galaxy-layer galaxy-layer-haze absolute inset-0">
          <canvas ref={hazeRef} className="absolute left-0 top-0" />
        </div>
        <div className="galaxy-layer galaxy-layer-far absolute inset-0">
          <canvas ref={farRef} className="absolute left-0 top-0" />
        </div>
        <div className="galaxy-layer galaxy-layer-live absolute inset-0">
          <canvas ref={liveRef} className="absolute left-0 top-0" />
        </div>
      </div>
      <div className="galaxy-grid absolute inset-0" />
      <div className="galaxy-vignette absolute inset-0" />
      {!lite && <div className="galaxy-grain absolute inset-0" />}
    </div>
  );
});
GalaxyBackground.displayName = 'GalaxyBackground';
