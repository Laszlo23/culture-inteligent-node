/**
 * Global reward toast stack + level/moment fanfares.
 * Mount once in App. Tuned to avoid sound spam and timer churn.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Award, Flame, Sparkles, Zap } from 'lucide-react';
import {
  emitReward,
  rarityGlow,
  subscribeRewards,
  type RewardEvent,
  type RewardSound,
} from '../lib/reward-bus';
import { useSound } from '../lib/sound/SoundContext';
import type { UiSound } from '../lib/sound/engine';
import LevelUpFanfare from './LevelUpFanfare';
import SpectacleBurst from './fx/SpectacleBurst';

type Toast = RewardEvent & { expiresAt: number };

const SOUND_GAP_MS = 90;
const TOAST_TTL_MS = 3000;
const MAX_TOASTS = 3;

function soundToUi(s?: RewardSound): UiSound | null {
  if (!s) return null;
  if (s === 'xpTick' || s === 'levelUp' || s === 'rareDrop' || s === 'success' || s === 'soft') {
    return s;
  }
  return 'success';
}

function ToastIcon({ kind }: { kind: RewardEvent['kind'] }) {
  if (kind === 'level') return <Sparkles className="w-4 h-4 text-amber-300" />;
  if (kind === 'badge' || kind === 'discovery') return <Award className="w-4 h-4 text-cyan-300" />;
  if (kind === 'streak') return <Flame className="w-4 h-4 text-rose-300" />;
  return <Zap className="w-4 h-4 text-amber-200" />;
}

function fanfarePriority(kind: RewardEvent['kind']): number {
  if (kind === 'level') return 3;
  if (kind === 'moment') return 2;
  return 0;
}

export default function RewardToastHost() {
  const { play } = useSound();
  const reduceMotion = useReducedMotion();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [fanfareQueue, setFanfareQueue] = useState<
    { title: string; subtitle?: string; level?: number; priority: number }[]
  >([]);
  const fanfare = fanfareQueue[0] ?? null;
  const lastSoundAt = useRef(0);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, ttl: number) => {
      const existing = timers.current.get(id);
      if (existing) window.clearTimeout(existing);
      const handle = window.setTimeout(() => dismiss(id), ttl);
      timers.current.set(id, handle);
    },
    [dismiss]
  );

  const pushFanfare = useCallback(
    (item: { title: string; subtitle?: string; level?: number; priority: number }) => {
      setFanfareQueue((q) => {
        // Coalesce: keep highest-priority fanfare in the next slot; drop lower dupes
        if (q.length === 0) return [item];
        const [head, ...rest] = q;
        if (item.priority > head.priority) return [item, ...rest].slice(0, 3);
        if (item.priority === head.priority) return q;
        return [...q, item].slice(0, 3);
      });
    },
    []
  );

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  useEffect(() => {
    return subscribeRewards((event) => {
      const uiSound = soundToUi(event.sound);
      if (uiSound) {
        const now = performance.now();
        // Prefer levelUp / rareDrop over softer chirps in a burst
        const important = uiSound === 'levelUp' || uiSound === 'rareDrop';
        if (important || now - lastSoundAt.current >= SOUND_GAP_MS) {
          play(uiSound);
          lastSoundAt.current = now;
        }
      }

      const prio = fanfarePriority(event.kind);
      if (event.kind === 'level') {
        pushFanfare({
          title: event.label,
          subtitle: 'You leveled up. Your identity grew.',
          level: event.level ?? event.amount,
          priority: prio,
        });
      } else if (event.kind === 'moment') {
        pushFanfare({
          title: event.label,
          subtitle: 'A moment worth remembering.',
          priority: prio,
        });
        return;
      }

      // Skip toast for level — fanfare is the celebration
      if (event.kind === 'level') return;

      const toast: Toast = { ...event, expiresAt: Date.now() + TOAST_TTL_MS };
      setToasts((prev) => {
        const next = [...prev.slice(-(MAX_TOASTS - 1)), toast];
        return next;
      });
      scheduleDismiss(toast.id, TOAST_TTL_MS);
    });
  }, [play, pushFanfare, scheduleDismiss]);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 bottom-24 sm:bottom-8 z-[85] flex flex-col items-center gap-2 px-3"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => dismiss(t.id)}
              layout={!reduceMotion}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 1.04 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className={`pointer-events-auto relative w-full max-w-sm cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-br from-[#16120a]/95 via-[#0c0c12]/94 to-[#061018]/95 backdrop-blur-md px-4 py-3 text-left toast-xp-glow ${rarityGlow(t.rarity)}`}
            >
              <div className="pointer-events-none absolute inset-0 holo-sheen opacity-50" />
              {t.kind === 'xp' && (
                <SpectacleBurst active={!reduceMotion} tone="amber" density="lite" className="opacity-80" />
              )}
              {(t.kind === 'badge' || t.kind === 'discovery') && (
                <SpectacleBurst active={!reduceMotion} tone="cyan" density="lite" className="opacity-70" />
              )}
              {t.kind === 'streak' && (
                <SpectacleBurst active={!reduceMotion} tone="rose" density="lite" className="opacity-70" />
              )}
              <div className="relative flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl border border-amber-400/30 bg-black/50 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(251,191,36,0.25)]">
                  <ToastIcon kind={t.kind} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-amber-200/70">
                    {t.kind === 'xp'
                      ? 'XP gain'
                      : t.kind === 'badge'
                        ? 'Achievement'
                        : t.kind === 'streak'
                          ? 'Streak'
                          : 'Reward'}
                  </p>
                  <p className="font-display text-base font-bold italic text-white truncate">
                    {t.kind === 'xp' && t.amount != null ? `+${t.amount} XP` : t.label}
                  </p>
                  {t.kind === 'xp' && (
                    <p className="text-[11px] text-slate-400 truncate">{t.label}</p>
                  )}
                  {t.shareHint && (
                    <p className="text-[11px] text-cyan-200/80 truncate">{t.shareHint}</p>
                  )}
                </div>
                {t.kind === 'xp' && t.amount != null && <CountUp value={t.amount} />}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <LevelUpFanfare
        open={Boolean(fanfare)}
        title={fanfare?.title || ''}
        subtitle={fanfare?.subtitle}
        level={fanfare?.level}
        onDone={() => setFanfareQueue((q) => q.slice(1))}
      />
    </>
  );
}

function CountUp({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const [n, setN] = useState(reduceMotion ? value : 0);
  useEffect(() => {
    if (reduceMotion) {
      setN(value);
      return;
    }
    let frame = 0;
    const frames = 10;
    let raf = 0;
    const tick = () => {
      frame += 1;
      setN(Math.round((value * frame) / frames));
      if (frame < frames) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduceMotion]);
  return (
    <span className="font-display text-xl font-extrabold italic text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 shrink-0 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
      +{n}
    </span>
  );
}

/** Dev / manual probe — emit a sample reward */
export function debugEmitXp(amount = 5) {
  emitReward({ kind: 'xp', label: 'Debug', amount, sound: 'xpTick' });
}
