/**
 * Full-bleed atmosphere — sparkling signal field (no soft video wash).
 * Canvas stars + sharp lattice + accent beams. Respects reduced motion.
 */

import React, { useEffect, useRef } from 'react';

export type AtmosphereVariant = 'hero' | 'auth' | 'facility' | 'ritual' | 'duality';

type Props = {
  variant?: AtmosphereVariant;
  className?: string;
  /** Extra dimming for busy UI (facility map) */
  dim?: boolean;
};

type Spark = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  hue: 'cyan' | 'amber' | 'white';
  size: number;
};

const PALETTE = {
  cyan: [34, 211, 238] as const,
  amber: [251, 191, 36] as const,
  white: [226, 232, 240] as const,
};

function accentFor(variant: AtmosphereVariant): { a: 'cyan' | 'amber'; b: 'cyan' | 'amber' } {
  if (variant === 'ritual') return { a: 'amber', b: 'cyan' };
  if (variant === 'duality') return { a: 'amber', b: 'cyan' };
  if (variant === 'hero' || variant === 'auth') return { a: 'cyan', b: 'amber' };
  return { a: 'cyan', b: 'cyan' };
}

function densityFor(variant: AtmosphereVariant): number {
  if (variant === 'ritual' || variant === 'duality') return 36;
  if (variant === 'hero') return 28;
  return 22;
}

export function CinematicBackdrop({
  variant = 'facility',
  className = '',
  dim = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accents = accentFor(variant);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduce = mq.matches;
    const onMq = () => {
      reduce = mq.matches;
    };
    mq.addEventListener?.('change', onMq);

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const sparks: Spark[] = [];
    let t = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      w = parent?.clientWidth || window.innerWidth;
      h = parent?.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (forceHue?: Spark['hue']) => {
      const hue =
        forceHue ||
        (Math.random() < 0.55 ? accents.a : Math.random() < 0.75 ? accents.b : 'white');
      sparks.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.04 - Math.random() * 0.18,
        life: 0,
        max: 120 + Math.random() * 200,
        hue,
        size: 0.45 + Math.random() * 1.1,
      });
    };

    const target = densityFor(variant);
    const seed = () => {
      sparks.length = 0;
      for (let i = 0; i < target; i++) spawn();
    };

    const drawLattice = () => {
      const horizon = h * 0.42;
      ctx.save();
      ctx.strokeStyle =
        variant === 'ritual' || variant === 'duality'
          ? 'rgba(251,191,36,0.12)'
          : 'rgba(34,211,238,0.1)';
      ctx.lineWidth = 1;

      // Horizon
      const g = ctx.createLinearGradient(0, horizon, w, horizon);
      g.addColorStop(0, 'transparent');
      g.addColorStop(0.5, variant === 'duality' ? 'rgba(251,191,36,0.45)' : 'rgba(34,211,238,0.4)');
      g.addColorStop(1, 'transparent');
      ctx.strokeStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(w, horizon);
      ctx.stroke();

      // Perspective floor
      ctx.strokeStyle = 'rgba(148,163,184,0.08)';
      const cols = 14;
      for (let i = -cols; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2 + i * (w * 0.04), horizon);
        ctx.lineTo(w / 2 + i * (w * 0.12), h);
        ctx.stroke();
      }
      for (let i = 1; i <= 6; i++) {
        const y = horizon + ((h - horizon) * i) / 6;
        const inset = (i / 6) * w * 0.08;
        ctx.beginPath();
        ctx.moveTo(inset, y);
        ctx.lineTo(w - inset, y);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawBeams = () => {
      ctx.save();
      if (variant === 'duality') {
        const la = ctx.createRadialGradient(w * 0.18, h * 0.35, 0, w * 0.18, h * 0.35, w * 0.45);
        la.addColorStop(0, 'rgba(251,191,36,0.16)');
        la.addColorStop(1, 'transparent');
        ctx.fillStyle = la;
        ctx.fillRect(0, 0, w, h);
        const lb = ctx.createRadialGradient(w * 0.82, h * 0.4, 0, w * 0.82, h * 0.4, w * 0.45);
        lb.addColorStop(0, 'rgba(34,211,238,0.14)');
        lb.addColorStop(1, 'transparent');
        ctx.fillStyle = lb;
        ctx.fillRect(0, 0, w, h);
      } else if (variant === 'ritual') {
        const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.4);
        g.addColorStop(0, 'rgba(251,191,36,0.14)');
        g.addColorStop(0.45, 'rgba(34,211,238,0.06)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      } else {
        const g = ctx.createRadialGradient(w * 0.55, h * 0.2, 0, w * 0.55, h * 0.2, w * 0.55);
        g.addColorStop(0, 'rgba(34,211,238,0.12)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // Moving accent beam
      if (!reduce) {
        const bx = ((Math.sin(t * 0.00035) + 1) / 2) * w;
        const beam = ctx.createLinearGradient(bx - 80, 0, bx + 80, 0);
        const [r, g, b] = PALETTE[accents.a];
        beam.addColorStop(0, 'transparent');
        beam.addColorStop(0.5, `rgba(${r},${g},${b},0.07)`);
        beam.addColorStop(1, 'transparent');
        ctx.fillStyle = beam;
        ctx.fillRect(0, 0, w, h);
      }
      ctx.restore();
    };

    const drawSparks = () => {
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life += 1;
        if (!reduce) {
          s.x += s.vx * s.z;
          s.y += s.vy * s.z;
        }
        if (s.life > s.max || s.y < -10 || s.x < -20 || s.x > w + 20) {
          sparks.splice(i, 1);
          spawn();
          continue;
        }
        const fade = 1 - s.life / s.max;
        const pulse = 0.55 + 0.45 * Math.sin(t * 0.006 + s.x);
        const alpha = fade * pulse * (dim ? 0.28 : 0.55);
        const [r, g, b] = PALETTE[s.hue];
        const rad = s.size * s.z * (1 + pulse * 0.2);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad * 3);
        glow.addColorStop(0, `rgba(${r},${g},${b},${0.55 * alpha})`);
        glow.addColorStop(0.4, `rgba(${r},${g},${b},${0.12 * alpha})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rad * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
        ctx.fill();

        // Rare cross sparkle
        if (s.size > 1.35 && alpha > 0.42 && Math.sin(t * 0.004 + s.y) > 0.92) {
          ctx.strokeStyle = `rgba(${r},${g},${b},${0.35 * alpha})`;
          ctx.lineWidth = 0.7;
          const arm = rad * 2.4;
          ctx.beginPath();
          ctx.moveTo(s.x - arm, s.y);
          ctx.lineTo(s.x + arm, s.y);
          ctx.moveTo(s.x, s.y - arm);
          ctx.lineTo(s.x, s.y + arm);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Rare shooting spark (~every ~8–12s)
      if (!reduce && Math.floor(t / 16) % 420 === 0) {
        const y0 = h * (0.2 + Math.random() * 0.35);
        const x0 = Math.random() * w * 0.55;
        const [r, g, b] = PALETTE[Math.random() < 0.5 ? accents.a : accents.b];
        const streak = ctx.createLinearGradient(x0, y0, x0 + 100, y0 + 32);
        streak.addColorStop(0, 'transparent');
        streak.addColorStop(0.4, `rgba(${r},${g},${b},0.4)`);
        streak.addColorStop(1, 'transparent');
        ctx.strokeStyle = streak;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + 110, y0 + 36);
        ctx.stroke();
      }
    };

    const frame = (now: number) => {
      t = now;
      ctx.clearRect(0, 0, w, h);
      drawBeams();
      drawLattice();
      drawSparks();
      while (sparks.length < target) spawn();
      raf = requestAnimationFrame(frame);
    };

    resize();
    seed();
    if (reduce) {
      // Static sparkle plate
      drawBeams();
      drawLattice();
      drawSparks();
    } else {
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      mq.removeEventListener?.('change', onMq);
    };
  }, [variant, dim, accents.a, accents.b]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-[#050608] ${className}`}
      aria-hidden
    >
      <div className={`absolute inset-0 atmosphere-base atmosphere-${variant}`} />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 atmosphere-vignette" />
      {dim && <div className="absolute inset-0 bg-black/45" />}
    </div>
  );
}

export default CinematicBackdrop;
