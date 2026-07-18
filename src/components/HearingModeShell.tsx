/**
 * Hearing Mode chrome — calm listening companion UI.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Ear, Mic, MicOff, X } from 'lucide-react';
import { useHearing } from '../lib/hearing/context';
import { isZenMode } from '../lib/zen-duality';

export default function HearingModeShell() {
  const hearing = useHearing();
  const [zenOn, setZenOn] = useState(() => isZenMode());

  useEffect(() => {
    const tick = () => setZenOn(isZenMode());
    tick();
    const id = window.setInterval(tick, 800);
    return () => window.clearInterval(id);
  }, [hearing?.active, hearing?.lastLine]);

  if (!hearing?.active) return null;

  const { phase, lastLine, micEnabled, setMicEnabled, disable, support } = hearing;

  const statusLabel =
    phase === 'speaking'
      ? 'Speaking gently'
      : phase === 'listening'
        ? 'Listening with you'
        : 'Present';

  const hint =
    phase === 'listening'
      ? 'I am listening — take your time.'
      : phase === 'speaking'
        ? lastLine || 'Soft words for you…'
        : lastLine || 'Say Help — or Academy when you are ready.';

  return (
    <div
      className={`fixed left-1/2 z-[60] w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-2xl border px-4 py-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl bottom-[calc(6.75rem+env(safe-area-inset-bottom))] md:bottom-4 ${
        zenOn
          ? 'border-amber-500/35 bg-gradient-to-r from-amber-950/75 via-[#0a0a0c]/94 to-cyan-950/45'
          : 'border-cyan-500/30 bg-[#0a0a0c]/94'
      }`}
      role="region"
      aria-label="Hearing Mode — listening space"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              phase === 'listening'
                ? 'border-cyan-400/55 bg-cyan-500/18 text-cyan-200'
                : phase === 'speaking'
                  ? 'border-amber-400/45 bg-amber-500/14 text-amber-200'
                  : 'border-white/10 bg-white/5 text-slate-400'
            }`}
            animate={
              phase === 'listening'
                ? { scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }
                : phase === 'speaking'
                  ? { scale: [1, 1.03, 1] }
                  : { scale: 1, opacity: 1 }
            }
            transition={
              phase === 'listening' || phase === 'speaking'
                ? { duration: phase === 'listening' ? 2.8 : 2.2, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.3 }
            }
          >
            {(phase === 'listening' || phase === 'speaking') && (
              <motion.span
                className={`absolute inset-0 rounded-xl ${
                  phase === 'listening' ? 'bg-cyan-400/15' : 'bg-amber-400/12'
                }`}
                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
            )}
            <Ear className="relative h-4 w-4" />
          </motion.div>
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-cyan-400/95">
              Hearing{zenOn ? ' · Zen' : ''}
              {support.neural ? ' · Neural' : ''} · {statusLabel}
            </p>
            <p
              className="truncate text-xs text-slate-300/95 leading-snug"
              aria-live="assertive"
              aria-atomic="true"
            >
              {hint}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {support.stt && (
            <button
              type="button"
              title={micEnabled ? 'Mute mic' : 'Unmute mic'}
              onClick={() => setMicEnabled(!micEnabled)}
              className="rounded-lg border border-white/10 p-2 text-slate-400 hover:border-white/25 hover:text-white cursor-pointer"
              aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            title="Exit Hearing Mode"
            onClick={() => disable()}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-2 text-slate-400 hover:border-rose-400/40 hover:text-rose-300 cursor-pointer font-mono text-[9px] font-black uppercase tracking-wider"
            aria-label="Exit Hearing Mode"
          >
            <X className="h-3.5 w-3.5" />
            Exit
          </button>
        </div>
      </div>
      {phase === 'listening' && (
        <p className="mt-2.5 text-[10px] text-slate-500 font-sans leading-relaxed">
          Soft space. Speak when it feels easy — Help, Academy, or Passport.
        </p>
      )}
    </div>
  );
}
