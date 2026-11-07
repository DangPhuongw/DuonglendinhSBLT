import React, { useMemo } from 'react';

interface Star {
  id: number;
  top: string;
  left: string;
  size: number;
  duration: string;
  delay: string;
  opacity: number;
  glow?: boolean;
}

export const GalaxyBackground: React.FC = () => {
  // Pre-computed fixed stars for deterministic rendering without re-calculation
  const stars: Star[] = useMemo(() => {
    const list: Star[] = [];
    const seed = [
      { t: 8, l: 15, s: 2, d: 3.2, y: 0.2, o: 0.8, g: true },
      { t: 12, l: 82, s: 1.5, d: 4.1, y: 1.1, o: 0.7 },
      { t: 18, l: 45, s: 2.5, d: 2.8, y: 0.5, o: 0.9, g: true },
      { t: 22, l: 92, s: 1, d: 5.0, y: 2.0, o: 0.6 },
      { t: 25, l: 28, s: 1.5, d: 3.7, y: 1.5, o: 0.75 },
      { t: 32, l: 74, s: 2, d: 4.5, y: 0.8, o: 0.85, g: true },
      { t: 38, l: 10, s: 1, d: 3.0, y: 2.2, o: 0.65 },
      { t: 42, l: 60, s: 2.5, d: 3.9, y: 0.4, o: 0.9, g: true },
      { t: 48, l: 88, s: 1.5, d: 4.8, y: 1.7, o: 0.7 },
      { t: 55, l: 20, s: 2, d: 3.5, y: 0.9, o: 0.8 },
      { t: 62, l: 35, s: 1, d: 4.2, y: 2.5, o: 0.6 },
      { t: 68, l: 80, s: 2.5, d: 3.1, y: 0.3, o: 0.9, g: true },
      { t: 72, l: 14, s: 1.5, d: 5.2, y: 1.2, o: 0.7 },
      { t: 78, l: 65, s: 2, d: 3.8, y: 1.8, o: 0.85 },
      { t: 85, l: 48, s: 1.5, d: 4.0, y: 0.6, o: 0.75 },
      { t: 90, l: 90, s: 2, d: 3.4, y: 1.4, o: 0.8, g: true },
      { t: 15, l: 32, s: 1, d: 4.6, y: 2.1, o: 0.6 },
      { t: 28, l: 6, s: 2, d: 3.3, y: 0.7, o: 0.85 },
      { t: 50, l: 3, s: 1.5, d: 4.4, y: 1.9, o: 0.7 },
      { t: 65, l: 96, s: 2, d: 3.6, y: 0.4, o: 0.85, g: true },
      { t: 82, l: 25, s: 1, d: 5.1, y: 1.6, o: 0.65 },
      { t: 95, l: 70, s: 1.5, d: 3.9, y: 2.3, o: 0.7 },
      { t: 5, l: 55, s: 2.5, d: 4.3, y: 1.0, o: 0.9, g: true },
      { t: 88, l: 8, s: 1.5, d: 3.5, y: 0.2, o: 0.7 },
      { t: 36, l: 95, s: 1, d: 4.7, y: 1.8, o: 0.6 },
    ];

    seed.forEach((item, idx) => {
      list.push({
        id: idx,
        top: `${item.t}%`,
        left: `${item.l}%`,
        size: item.s,
        duration: `${item.d}s`,
        delay: `${item.y}s`,
        opacity: item.o,
        glow: item.g,
      });
    });
    return list;
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10"
      style={{
        background: 'radial-gradient(ellipse 100% 80% at 50% 0%, #0d1527 0%, #080c18 60%, #05070e 100%)',
      }}
    >
      {/* 1. Nebula Glowing Clouds (Ambient drifting orbs) */}
      {/* Top-left Violet / Indigo Nebula */}
      <div
        className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full blur-[140px] opacity-40 animate-float-nebula-1"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(99, 102, 241, 0.25) 50%, transparent 75%)',
        }}
      />

      {/* Top-right Cyan / Electric Blue Nebula */}
      <div
        className="absolute -top-20 -right-28 w-[600px] h-[600px] rounded-full blur-[130px] opacity-35 animate-float-nebula-2"
        style={{
          background: 'radial-gradient(circle, rgba(0, 217, 255, 0.4) 0%, rgba(37, 99, 235, 0.2) 55%, transparent 75%)',
        }}
      />

      {/* Center Deep Cosmic Purple Highlight */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] rounded-full blur-[160px] opacity-25 animate-float-nebula-3"
        style={{
          background: 'radial-gradient(ellipse, rgba(124, 58, 237, 0.35) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 75%)',
        }}
      />

      {/* Bottom Olympia Golden Warmth Aura */}
      <div
        className="absolute -bottom-36 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full blur-[150px] opacity-25"
        style={{
          background: 'radial-gradient(ellipse, rgba(255, 212, 59, 0.3) 0%, rgba(249, 115, 22, 0.15) 45%, transparent 70%)',
        }}
      />

      {/* 2. Cyber Arena Floor Grid with Perspective Fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-[45vh] opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 217, 255, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 217, 255, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '45px 45px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          transform: 'perspective(500px) rotateX(45deg)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* 3. Twinkling Starfield */}
      {stars.map((star) => (
        <span
          key={star.id}
          className="absolute rounded-full"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: star.glow ? '#E0F2FE' : '#FFFFFF',
            boxShadow: star.glow
              ? '0 0 8px 2px rgba(0, 217, 255, 0.8), 0 0 16px 4px rgba(168, 85, 247, 0.5)'
              : '0 0 4px 1px rgba(255, 255, 255, 0.6)',
            animation: `twinkle ${star.duration} ease-in-out infinite`,
            animationDelay: star.delay,
            opacity: star.opacity,
          }}
        />
      ))}

      {/* 4. Elegant 4-point Sparkle Stars (Constellation accents) */}
      <div
        className="absolute top-[18%] left-[22%] opacity-60 animate-pulse"
        style={{ animationDuration: '4s' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
            fill="#00D9FF"
          />
        </svg>
      </div>

      <div
        className="absolute top-[35%] right-[16%] opacity-55 animate-pulse"
        style={{ animationDuration: '5s', animationDelay: '1.5s' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
            fill="#FFD43B"
          />
        </svg>
      </div>

      <div
        className="absolute top-[68%] left-[12%] opacity-45 animate-pulse"
        style={{ animationDuration: '6s', animationDelay: '2.5s' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z"
            fill="#A855F7"
          />
        </svg>
      </div>

      {/* 5. Shooting Star Animation (Cosmic Streak) */}
      <div className="absolute top-[15%] right-[25%] w-32 h-[1.5px] shooting-star-streak pointer-events-none opacity-0" />
      <div className="absolute top-[40%] left-[30%] w-24 h-[1px] shooting-star-streak-2 pointer-events-none opacity-0" />

      {/* 6. Subtle Vignette around edges to frame content */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 120px rgba(0, 0, 0, 0.65)',
        }}
      />
    </div>
  );
};
