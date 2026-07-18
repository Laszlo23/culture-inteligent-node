/**
 * Header sound panel — UI SFX + transparent positive vibe (pad + soft affirmations).
 */

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useSound } from '../lib/sound/SoundContext';

export default function SoundControls() {
  const { sfxEnabled, vibeEnabled, setSfxEnabled, setVibeEnabled, unlock, play } = useSound();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const anyOn = sfxEnabled || vibeEnabled;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        title="Sound & positive vibe"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          void unlock();
          setOpen((v) => !v);
          play('soft');
        }}
        className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[10px] tracking-wider uppercase font-black transition-all cursor-pointer border ${
          anyOn
            ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
            : 'bg-white/5 border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300'
        }`}
      >
        {anyOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        <span className="hidden lg:inline">Sound</span>
      </button>

      {/* Mobile icon-only */}
      <button
        type="button"
        title="Sound & positive vibe"
        aria-expanded={open}
        onClick={() => {
          void unlock();
          setOpen((v) => !v);
          play('soft');
        }}
        className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
          anyOn
            ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
            : 'bg-white/5 border-white/10 text-slate-400'
        }`}
      >
        {anyOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Sound settings"
          className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-[#0a0a0c]/98 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.55)] p-3.5 z-50"
        >
          <p className="text-[9px] font-mono tracking-[0.22em] uppercase text-slate-500 mb-3">
            Node audio
          </p>

          <label className="flex items-start gap-3 p-2.5 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={sfxEnabled}
              onChange={(e) => setSfxEnabled(e.target.checked)}
              className="mt-0.5 accent-cyan-400"
            />
            <span>
              <span className="block text-xs font-bold text-white">UI sounds</span>
              <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">
                Soft chirps on hover, decode, and enter.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 p-2.5 rounded-xl border border-amber-500/15 bg-amber-950/10 hover:border-amber-500/30 cursor-pointer">
            <input
              type="checkbox"
              checked={vibeEnabled}
              onChange={(e) => setVibeEnabled(e.target.checked)}
              className="mt-0.5 accent-amber-400"
            />
            <span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Positive vibe
              </span>
              <span className="block text-[11px] text-slate-400 mt-0.5 leading-snug">
                Quiet warm pad + soft spoken affirmations. Opt-in only — never hidden.
                Hearing Mode adds its own gentle bed automatically.
              </span>
            </span>
          </label>

          <p className="mt-3 text-[10px] text-slate-600 leading-relaxed">
            Affirmations stay gentle and spaced. Hearing Mode pauses them so the guide can speak clearly.
          </p>
        </div>
      )}
    </div>
  );
}
