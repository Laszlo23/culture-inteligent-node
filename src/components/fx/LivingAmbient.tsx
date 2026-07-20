/**
 * Living chrome — slow CSS drift + optional desktop cursor motes.
 * Respects prefers-reduced-motion; skips reactive path on touch / coarse pointers.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

type Props = {
  className?: string;
  /** Cursor motes — desktop hover devices only */
  reactive?: boolean;
  intensity?: 'soft' | 'medium';
};

function canUseReactivePointer(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  // Touch-first / coarse → skip mote churn
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return false;
  return true;
}

export default function LivingAmbient({
  className = '',
  reactive = false,
  intensity = 'soft',
}: Props) {
  const reduceMotion = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [motes, setMotes] = useState<{ x: number; y: number; id: number }[]>([]);
  const idRef = useRef(0);
  const rafRef = useRef(0);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (reduceMotion || !reactive || !canUseReactivePointer()) return;
    const host = hostRef.current;
    // Host is pointer-events-none — listen on parent so motes still track cursor
    const target = host?.parentElement;
    if (!target) return;

    let last = 0;
    const flush = () => {
      rafRef.current = 0;
      const p = pendingRef.current;
      pendingRef.current = null;
      if (!p) return;
      const id = (idRef.current += 1);
      setMotes((prev) => {
        const next = [...prev.slice(-6), { x: p.x, y: p.y, id }];
        return next;
      });
      window.setTimeout(() => {
        setMotes((prev) => prev.filter((m) => m.id !== id));
      }, 700);
    };

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      const rect = target.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }
      pendingRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
    };

    target.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      target.removeEventListener('pointermove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reactive, reduceMotion]);

  if (reduceMotion) {
    return (
      <div
        ref={hostRef}
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden
      />
    );
  }

  const opacity = intensity === 'medium' ? 0.55 : 0.35;

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="living-drift absolute -inset-[20%]" style={{ opacity }} />
      {motes.map((m) => (
        <span
          key={m.id}
          className="living-mote absolute w-1.5 h-1.5 rounded-full bg-cyan-300/80"
          style={{ left: m.x, top: m.y }}
        />
      ))}
    </div>
  );
}
