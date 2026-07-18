/**
 * Science & Tech Signal Desk — emerging news → knowledge → attention → Void.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Atom, ExternalLink, EyeOff, RefreshCw, Sparkles, Radio } from 'lucide-react';
import type { ScienceSignalDeskResponse } from '../lib/api';
import { fetchScienceSignalDesk } from '../lib/api';
import { VOID_DRAFT_KEY } from '../lib/void-chamber';

type Props = {
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onOpenVoid?: (draft?: string) => void;
  onOpenAcademy?: () => void;
  compact?: boolean;
};

const DOMAIN_TONE: Record<ScienceSignalDeskResponse['signals'][number]['domain'], string> = {
  ai: 'text-cyan-300 border-cyan-400/30 bg-cyan-950/30',
  bio: 'text-emerald-300 border-emerald-400/30 bg-emerald-950/30',
  quantum: 'text-violet-300 border-violet-400/30 bg-violet-950/30',
  space: 'text-sky-300 border-sky-400/30 bg-sky-950/30',
  energy: 'text-amber-300 border-amber-400/30 bg-amber-950/30',
  neuro: 'text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-950/30',
  other: 'text-slate-300 border-white/15 bg-white/5',
};

export default function SignalDesk({ addLog, onOpenVoid, onOpenAcademy, compact }: Props) {
  const [desk, setDesk] = useState<ScienceSignalDeskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchScienceSignalDesk();
      setDesk(data);
      setActiveIdx(0);
    } catch (e: any) {
      addLog(`SIGNAL DESK: ${e?.message || 'unavailable'}`, 'warn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const signal = desk?.signals?.[activeIdx];

  const askInVoid = () => {
    if (!signal) return;
    try {
      localStorage.setItem(VOID_DRAFT_KEY, signal.voidPrompt);
    } catch {
      // ignore
    }
    addLog('SIGNAL → VOID: nameless draft armed from science/tech pulse.', 'success');
    onOpenVoid?.(signal.voidPrompt);
  };

  return (
    <div
      className={`rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#060a10] via-[#07070a] to-[#0a0812] overflow-hidden ${
        compact ? 'p-4' : 'p-5 md:p-6'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[9px] font-mono font-black tracking-[0.2em] uppercase text-cyan-300/90">
              Signal Desk · science & tech
            </span>
          </div>
          <h3 className="font-display text-lg md:text-xl font-extrabold italic text-white">
            News in → attention out
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-lg font-sans leading-relaxed">
            When new tech or science breaks, we turn it into knowledge fuel — Academy practice +
            nameless Void questions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 text-[9px] font-mono text-slate-500 hover:text-cyan-300 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {desk && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {desk.signals.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`px-2 py-1 rounded-lg text-[8px] font-mono font-bold uppercase tracking-wider border cursor-pointer transition-colors ${
                i === activeIdx
                  ? DOMAIN_TONE[s.domain]
                  : 'border-white/10 text-slate-500 hover:text-slate-300'
              }`}
            >
              {s.domain}
            </button>
          ))}
        </div>
      )}

      {loading && !signal && (
        <p className="text-xs text-slate-500 font-mono py-6 text-center">Tuning signal desk…</p>
      )}

      {signal && (
        <motion.div
          key={signal.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-start gap-2">
            <Atom className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white font-sans leading-snug">{signal.title}</h4>
              <p className="text-[12px] text-slate-400 mt-1.5 font-sans leading-relaxed">
                {signal.summary}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-black/35 px-3.5 py-3">
            <span className="text-[8px] font-mono font-black tracking-widest uppercase text-amber-300/90 block mb-1">
              Attention lens
            </span>
            <p className="text-[12px] text-slate-300 font-sans leading-relaxed">
              {signal.attentionLens}
            </p>
          </div>

          <div className="rounded-xl border border-violet-400/20 bg-violet-950/20 px-3.5 py-3">
            <span className="text-[8px] font-mono font-black tracking-widest uppercase text-violet-300/90 block mb-1">
              Academy hook
            </span>
            <p className="text-[12px] text-slate-300 font-sans leading-relaxed flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-300 shrink-0 mt-0.5" />
              {signal.academyHook}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {onOpenAcademy && (
              <button
                type="button"
                onClick={onOpenAcademy}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                Train on this in Academy
              </button>
            )}
            <button
              type="button"
              onClick={askInVoid}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/35 border border-violet-400/35 text-violet-100 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Ask in The Void
            </button>
            {signal.sourceUrl && (
              <a
                href={signal.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            )}
          </div>

          <p className="text-[8px] font-mono text-slate-600">
            {desk?.mode} · {desk?.note}
          </p>
        </motion.div>
      )}
    </div>
  );
}
