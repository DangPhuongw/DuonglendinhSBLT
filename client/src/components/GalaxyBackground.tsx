import React, { useEffect, useRef } from 'react';

/**
 * Nền ngân hà nhiều lớp (đều nằm dưới nội dung, không bắt chuột):
 *  1. Nền vũ trụ + mây tinh vân tím/hồng/xanh băng (CSS gradient)
 *  2. Dải ngân hà chéo: bụi sao + quầng sáng, vẽ một lần lên canvas, trôi rất chậm (parallax)
 *  3. ~3600 sao xa li ti, nhiều sao hơn trong dải ngân hà
 *  4. Sao trôi thật sự qua màn hình (lớp gần), nhánh tinh vân xoay chậm, mây thở nhẹ
 *  5. Sao lấp lánh (~420 sao nhấp nháy) + vài sao sáng có tia chữ thập + sao băng thỉnh thoảng
 *  6. Lưới kỹ thuật mờ, vignette và hạt nhiễu phim để bớt phẳng
 * Canvas động chỉ chạy ~30fps, tạm dừng khi tab ẩn, và đứng yên nếu người dùng tắt hiệu ứng chuyển động.
 */

type RGB = [number, number, number];

const STAR_TINTS: { c: RGB; w: number }[] = [
  { c: [238, 240, 255], w: 40 }, // trắng
  { c: [170, 200, 255], w: 26 }, // trắng xanh
  { c: [255, 226, 170], w: 14 }, // vàng nhạt
  { c: [196, 170, 255], w: 12 }, // tím nhạt
  { c: [255, 175, 215], w: 8 }, // hồng nhạt
];
const TINT_TOTAL = STAR_TINTS.reduce((s, t) => s + t.w, 0);

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

function pickTint(rand: () => number): RGB {
  let r = rand() * TINT_TOTAL;
  for (const t of STAR_TINTS) {
    r -= t.w;
    if (r <= 0) return t.c;
  }
  return STAR_TINTS[0].c;
}

/** Khoảng cách chuẩn hóa tới trục dải ngân hà (0 = trên trục). */
function bandDistance(x: number, y: number, w: number, h: number): number {
  const angle = -0.5; // radian, dải chéo từ trái-dưới lên phải-trên
  const cx = w * 0.5;
  const cy = h * 0.5;
  const d = Math.abs((x - cx) * Math.sin(angle) - (y - cy) * Math.cos(angle));
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

/** Sprite quầng sáng mềm cho sao sáng (vẽ một lần, dùng lại bằng drawImage). */
function makeGlowSprite(rgb: RGB, size = 64): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`);
  g.addColorStop(0.18, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.45)`);
  g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

interface Twinkler {
  x: number;
  y: number;
  r: number;
  rgb: RGB;
  base: number;
  speed: number;
  phase: number;
}
interface Bright {
  x: number;
  y: number;
  s: number;
  sprite: number;
  speed: number;
  phase: number;
}
interface Drifter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  rgb: RGB;
  a: number;
  glow: boolean;
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

export const GalaxyBackground: React.FC = () => {
  const hazeRef = useRef<HTMLCanvasElement>(null);
  const farRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const haze = hazeRef.current;
    const far = farRef.current;
    const live = liveRef.current;
    if (!haze || !far || !live) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let raf = 0;
    let resizeTimer = 0;
    let width = 0;
    let height = 0;
    let twinklers: Twinkler[] = [];
    let brights: Bright[] = [];
    let shooters: Shooter[] = [];
    let drifters: Drifter[] = [];
    let nextShooter = 0;
    let last = 0;
    const sprites = [makeGlowSprite([200, 215, 255]), makeGlowSprite([255, 226, 170]), makeGlowSprite([196, 170, 255])];

    const build = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      // Vẽ quá khổ 8% để lớp trôi chậm không lộ mép
      const w = Math.round(width * 1.14);
      const h = Math.round(height * 1.14);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rand = mulberry32(20261113);

      // --- Lớp 2: quầng sáng dải ngân hà
      const hz = fitCanvas(haze, w, h, 1); // quầng mờ không cần độ phân giải cao
      hz.globalCompositeOperation = 'lighter';
      const hazeColors: RGB[] = [
        [120, 96, 255],
        [90, 140, 255],
        [200, 110, 255],
        [255, 120, 190],
        [90, 210, 230],
      ];
      for (let i = 0; i < 90; i++) {
        const t = rand();
        const along = (t - 0.5) * Math.hypot(w, h) * 1.1;
        const spread = (rand() - 0.5) * Math.min(w, h) * 0.34;
        const angle = -0.5;
        const x = w / 2 + along * Math.cos(angle) - spread * Math.sin(angle);
        const y = h / 2 + along * Math.sin(angle) + spread * Math.cos(angle);
        const r = 90 + rand() * 260;
        const col = hazeColors[Math.floor(rand() * hazeColors.length)];
        const a = 0.02 + rand() * 0.045;
        const g = hz.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`);
        g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        hz.fillStyle = g;
        hz.fillRect(x - r, y - r, r * 2, r * 2);
      }

      // --- Lớp 3: sao xa li ti (nhiều hơn hẳn trong dải ngân hà)
      const fx = fitCanvas(far, w, h, dpr);
      const area = (w * h) / (1440 * 900);
      const total = Math.round(3600 * Math.max(0.6, area));
      let drawn = 0;
      let guard = 0;
      while (drawn < total && guard++ < total * 12) {
        const x = rand() * w;
        const y = rand() * h;
        const bd = bandDistance(x, y, w, h);
        const density = 0.28 + 0.72 * Math.exp(-(bd * bd));
        if (rand() > density) continue;
        const c = pickTint(rand);
        const size = rand() < 0.9 ? 0.6 + rand() * 0.55 : 1.15 + rand() * 0.9;
        const alpha = 0.4 + rand() * 0.55;
        fx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(2)})`;
        fx.fillRect(x, y, size, size);
        drawn++;
      }

      // --- Lớp 4: sao lấp lánh + sao sáng
      fitCanvas(live, w, h, dpr);
      twinklers = [];
      for (let i = 0; i < 420; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const bd = bandDistance(x, y, w, h);
        if (rand() > 0.3 + 0.7 * Math.exp(-(bd * bd))) {
          i--;
          continue;
        }
        twinklers.push({
          x,
          y,
          r: 0.8 + rand() * 1.1,
          rgb: pickTint(rand),
          base: 0.3 + rand() * 0.35,
          speed: 0.5 + rand() * 1.8,
          phase: rand() * Math.PI * 2,
        });
      }
      // Sao trôi: lớp gần, trôi thật sự qua màn hình (to hơn thì nhanh hơn: có chiều sâu)
      drifters = [];
      for (let i = 0; i < 90; i++) {
        const depth = rand();
        const speed = 5 + depth * 20;
        const ang = Math.PI * (1.18 + rand() * 0.2); // hướng lên-trái, hơi lệch
        drifters.push({
          x: rand() * w,
          y: rand() * h,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          s: 0.9 + depth * 1.3,
          rgb: pickTint(rand),
          a: 0.45 + depth * 0.5,
          glow: depth > 0.9,
        });
      }
      brights = [];
      for (let i = 0; i < 7; i++) {
        brights.push({
          x: rand() * w,
          y: rand() * h,
          s: 7 + rand() * 8,
          sprite: Math.floor(rand() * sprites.length),
          speed: 0.25 + rand() * 0.5,
          phase: rand() * Math.PI * 2,
        });
      }
    };

    const draw = (ts: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden) return;
      if (ts - last < 33) return; // ~30fps
      const dt = last ? (ts - last) / 1000 : 0.033;
      last = ts;
      const t = ts / 1000;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const ctx = live.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, live.width / dpr, live.height / dpr);

      for (const s of twinklers) {
        const k = s.base + (1 - s.base) * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.fillStyle = `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${k.toFixed(2)})`;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }

      {
        const cw = live.width / dpr;
        const ch = live.height / dpr;
        for (const d of drifters) {
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (d.x < -8) d.x = cw + 8;
          else if (d.x > cw + 8) d.x = -8;
          if (d.y < -8) d.y = ch + 8;
          else if (d.y > ch + 8) d.y = -8;
          if (d.glow) {
            ctx.globalAlpha = 0.22;
            ctx.drawImage(sprites[0], d.x - d.s * 2, d.y - d.s * 2, d.s * 4, d.s * 4);
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = `rgba(${d.rgb[0]},${d.rgb[1]},${d.rgb[2]},${d.a.toFixed(2)})`;
          ctx.fillRect(d.x, d.y, d.s, d.s);
        }
      }

      for (const b of brights) {
        const k = 0.55 + 0.45 * Math.sin(t * b.speed + b.phase);
        const spr = sprites[b.sprite];
        ctx.globalAlpha = 0.2 + 0.3 * k;
        ctx.drawImage(spr, b.x - b.s, b.y - b.s, b.s * 2, b.s * 2);
        // tia chữ thập
        ctx.globalAlpha = 0.15 + 0.35 * k;
        const arm = b.s * (0.8 + 0.4 * k);
        const grad = ctx.createLinearGradient(b.x - arm, b.y, b.x + arm, b.y);
        grad.addColorStop(0, 'rgba(220,230,255,0)');
        grad.addColorStop(0.5, 'rgba(235,240,255,0.9)');
        grad.addColorStop(1, 'rgba(220,230,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(b.x - arm, b.y - 0.4, arm * 2, 0.8);
        const gradV = ctx.createLinearGradient(b.x, b.y - arm, b.x, b.y + arm);
        gradV.addColorStop(0, 'rgba(220,230,255,0)');
        gradV.addColorStop(0.5, 'rgba(235,240,255,0.9)');
        gradV.addColorStop(1, 'rgba(220,230,255,0)');
        ctx.fillStyle = gradV;
        ctx.fillRect(b.x - 0.4, b.y - arm, 0.8, arm * 2);
        ctx.globalAlpha = 1;
      }

      // sao băng thường xuyên hơn (mỗi 3-7 giây, tối đa 3 cùng lúc)
      if (t > nextShooter && shooters.length < 3) {
        const rand = Math.random;
        const w = live.width / dpr;
        const h = live.height / dpr;
        const speed = 520 + rand() * 380;
        const ang = Math.PI * (0.62 + rand() * 0.12);
        shooters.push({
          x: w * (0.35 + rand() * 0.6),
          y: h * rand() * 0.45,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 0,
          max: 0.9 + rand() * 0.5,
          len: 90 + rand() * 90,
        });
        nextShooter = t + 3 + rand() * 4;
      }
      shooters = shooters.filter((s) => s.life < s.max);
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
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    };

    const start = () => {
      build();
      if (reduceMotion) {
        // Đứng yên: vẽ một khung duy nhất với độ sáng trung bình
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const ctx = live.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const s of twinklers) {
          ctx.fillStyle = `rgba(${s.rgb[0]},${s.rgb[1]},${s.rgb[2]},${(s.base + 0.25).toFixed(2)})`;
          ctx.fillRect(s.x, s.y, s.r, s.r);
        }
        return;
      }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(start, 200);
    };

    start();
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="galaxy-bg fixed inset-0 pointer-events-none overflow-hidden select-none -z-10" aria-hidden="true">
      <div className="galaxy-nebula absolute inset-0" />
      <div className="galaxy-arms" />
      {/* Ba lớp trôi ngược hướng nhau với tốc độ khác nhau: tạo cảm giác chiều sâu */}
      <div className="absolute -inset-[7%]">
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
      <div className="galaxy-grain absolute inset-0" />
    </div>
  );
};
