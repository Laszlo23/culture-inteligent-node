/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, Sparkles, Zap } from 'lucide-react';
import { ECOSYSTEM_ALLIES, EcosystemAlly } from '../lib/ecosystem-allies';

interface EcosystemSliderProps {
  className?: string;
  onSelect?: (ally: EcosystemAlly) => void;
}

export default function EcosystemSlider({ className = '', onSelect }: EcosystemSliderProps) {
  const [activeId, setActiveId] = useState<string>(ECOSYSTEM_ALLIES[0]?.id ?? 'solana');
  const active = ECOSYSTEM_ALLIES.find((a) => a.id === activeId) ?? ECOSYSTEM_ALLIES[0];
  const loop = [...ECOSYSTEM_ALLIES, ...ECOSYSTEM_ALLIES];

  const select = (ally: EcosystemAlly) => {
    setActiveId(ally.id);
    onSelect?.(ally);
  };

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#07070a] shadow-2xl ${className}`}
      aria-label="Solana ecosystem allies"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,241,149,0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(153,69,255,0.1),_transparent_50%)]" />

      <div className="relative z-10 space-y-5 p-5 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">
              <Sparkles className="h-3 w-3" />
              Solana Ecosystem Rail
            </span>
            <h3 className="font-mono text-sm font-black uppercase tracking-wider text-slate-100 md:text-base">
              The stack behind Culture Node
            </h3>
            <p className="max-w-xl font-sans text-[11px] leading-relaxed text-slate-400 md:text-xs">
              Tap a mark for the one fact that usually surprises people — then open the official site.
            </p>
          </div>
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-cyan-300"
          >
            Visit {active.name}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Infinite logo rail */}
        <div className="eco-marquee group relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 py-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#07070a] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#07070a] to-transparent" />

          <div className="eco-marquee-track flex w-max gap-3 px-3 group-hover:[animation-play-state:paused]">
            {loop.map((ally, idx) => {
              const isActive = ally.id === activeId;
              return (
                <button
                  key={`${ally.id}-${idx}`}
                  type="button"
                  onClick={() => select(ally)}
                  className={`flex shrink-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all ${
                    isActive
                      ? 'border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_24px_rgba(34,211,238,0.15)]'
                      : 'border-white/5 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                  aria-pressed={isActive}
                  aria-label={`${ally.name} — ${ally.role}`}
                >
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-black/50 ring-1 ring-white/10">
                    <img
                      src={ally.logo}
                      alt=""
                      className="h-9 w-9 object-contain"
                      draggable={false}
                    />
                  </span>
                  <span className="text-left">
                    <span className="block font-mono text-[11px] font-black uppercase tracking-wide text-slate-100">
                      {ally.name}
                    </span>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-500">
                      {ally.role}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wow panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${active.accent} p-5 md:p-6`}
          >
            <div className="absolute inset-0 bg-[#050508]/75 backdrop-blur-[2px]" />
            <div className="relative z-10 grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-black/50 shadow-lg transition-transform hover:scale-[1.03] md:mx-0"
              >
                <img src={active.logo} alt={`${active.name} logo`} className="h-14 w-14 object-contain" />
              </a>

              <div className="space-y-3 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <h4 className="font-mono text-lg font-black uppercase tracking-tight text-white">
                    {active.name}
                  </h4>
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-300">
                    {active.role}
                  </span>
                </div>

                <p className="font-sans text-xs text-slate-300 md:text-sm">{active.tagline}</p>

                <div className="flex gap-2 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3 text-left">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                  <p className="font-sans text-[12px] leading-relaxed text-cyan-50 md:text-sm">
                    <span className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-cyan-400">
                      Surprising fact ·{' '}
                    </span>
                    {active.wow}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {active.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/5 bg-black/40 px-2 py-2.5 text-center"
                    >
                      <div className="font-mono text-[8px] uppercase tracking-widest text-slate-500">
                        {stat.label}
                      </div>
                      <div className="mt-1 font-mono text-[11px] font-bold text-slate-100">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-wider text-black transition-colors hover:bg-cyan-300"
                >
                  Open {active.name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
