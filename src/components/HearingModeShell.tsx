/**
 * Minimal always-on Hearing Mode chrome — listening / speaking, mic, exit.
 */

import React, { useEffect, useState } from 'react';
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
    phase === 'speaking' ? 'Speaking' : phase === 'listening' ? 'Listening' : 'Ready';

  return (
    <div
      className={`fixed left-1/2 z-[60] w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-2xl border px-4 py-3 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl bottom-[calc(6.75rem+env(safe-area-inset-bottom))] md:bottom-4 ${
        zenOn
          ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-[#0a0a0c]/92 to-cyan-950/50'
          : 'border-cyan-500/35 bg-[#0a0a0c]/92'
      }`}
      role="region"
      aria-label="Hearing Mode"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
              phase === 'listening'
                ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-300'
                : phase === 'speaking'
                  ? 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                  : 'border-white/10 bg-white/5 text-slate-400'
            }`}
          >
            <Ear className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-cyan-400">
              Hearing{zenOn ? ' · Zen' : ''} · {statusLabel}
            </p>
            <p
              className="truncate text-xs text-slate-300"
              aria-live="assertive"
              aria-atomic="true"
            >
              {lastLine || 'Say help — or Academy.'}
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
    </div>
  );
}
