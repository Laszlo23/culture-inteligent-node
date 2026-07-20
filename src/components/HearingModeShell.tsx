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

  const statusLabel = !micEnabled
    ? 'Mic muted'
    : phase === 'speaking'
      ? 'Speaking gently'
      : phase === 'listening'
        ? 'Listening with you'
        : 'Present';

  const hint = !micEnabled
    ? 'Microphone off — tap the mic to listen again.'
    : phase === 'listening'
      ? 'I am listening — take your time.'
      : phase === 'speaking'
        ? lastLine || 'Soft words for you…'
        : lastLine || 'Say Help — or Academy when you are ready.';

  const footerHint = !micEnabled
    ? 'Mic is off. The guide can still speak — unmute when you want to answer.'
    : 'Soft space. Speak when it feels easy — Help, Academy, or Passport.';

  return (
    <div
      className={`fixed left-1/2 z-[60] w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-2xl border px-4 py-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl bottom-[calc(6.75rem+env(safe-area-inset-bottom))] md:bottom-4 ${
        zenOn
          ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-[#0a0a0c]/96 to-cyan-950/50'
          : 'border-cyan-400/40 bg-[#0a0a0c]/96'
      }`}
      role="region"
      aria-label="Hearing Mode — listening space"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Steady glow from open — no dim→bright / scale flip when input starts */}
          <motion.div
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              !micEnabled
                ? 'border-rose-400/40 bg-rose-500/12 text-rose-200'
                : phase === 'speaking'
                  ? 'border-amber-400/50 bg-amber-500/16 text-amber-100'
                  : 'border-cyan-400/55 bg-cyan-500/20 text-cyan-100'
            }`}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {micEnabled && (
              <motion.span
                className={`absolute inset-0 rounded-xl ${
                  phase === 'speaking' ? 'bg-amber-400/14' : 'bg-cyan-400/16'
                }`}
                animate={{ opacity: [0.45, 0.7, 0.45] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden
              />
            )}
            <Ear className="relative h-4 w-4" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-cyan-300">
              Hearing{zenOn ? ' · Zen' : ''}
              {support.neural ? ' · Neural' : ''} · {statusLabel}
            </p>
            <p
              className="h-4 truncate text-xs text-slate-200/95 leading-snug"
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMicEnabled(!micEnabled);
              }}
              aria-pressed={!micEnabled}
              className={`rounded-lg border p-2 cursor-pointer transition-colors ${
                micEnabled
                  ? 'border-white/10 text-slate-400 hover:border-white/25 hover:text-white'
                  : 'border-rose-400/45 bg-rose-500/15 text-rose-200 hover:border-rose-400/60'
              }`}
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
      {/* Always mounted so listen/speak phase changes do not resize the shell */}
      <p
        className={`mt-2.5 min-h-[2.5rem] text-[10px] font-sans leading-relaxed ${
          !micEnabled ? 'text-rose-300/80' : 'text-slate-400'
        }`}
      >
        {footerHint}
      </p>
    </div>
  );
}
