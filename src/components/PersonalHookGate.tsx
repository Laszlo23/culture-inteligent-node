/**
 * Personal hook choice — maps to soft growth path (curious / reflective / balanced).
 * Not class-select; changeable later.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Brain, Compass, Eye } from 'lucide-react';
import CinematicPanel from './fx/CinematicPanel';
import {
  PERSONAL_HOOKS,
  writeGrowthPath,
  type GrowthPathId,
  type PersonalHook,
} from '../lib/growth-path';

type Props = {
  /** Preselect when changing path */
  initialPath?: GrowthPathId | null;
  onChosen: (path: GrowthPathId) => void;
  /** Compact = no full cinematic shell (Academy change path) */
  compact?: boolean;
};

const ICONS: Record<string, React.ReactNode> = {
  mind: <Brain className="h-4 w-4" />,
  notice: <Eye className="h-4 w-4" />,
  both: <Compass className="h-4 w-4" />,
};

export default function PersonalHookGate({
  initialPath = null,
  onChosen,
  compact = false,
}: Props) {
  const initialHook =
    PERSONAL_HOOKS.find((h) => h.pathId === initialPath) ?? null;
  const [selected, setSelected] = useState<PersonalHook | null>(initialHook);

  const confirm = (path: GrowthPathId) => {
    writeGrowthPath(path);
    onChosen(path);
  };

  const body = (
    <div className={compact ? 'p-4' : 'p-5 sm:p-7 md:p-8'}>
      <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/90">
        Your hook
      </p>
      <h3 className="mt-2 font-display text-2xl font-bold italic leading-tight text-white sm:text-3xl">
        What pulls you here?
      </h3>
      <p className="mt-2 max-w-xl text-sm text-slate-300/95 leading-relaxed">
        Not a class. A soft path — we bias prompts and next sessions. You can change it anytime.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PERSONAL_HOOKS.map((hook) => {
          const on = selected?.id === hook.id;
          return (
            <button
              key={hook.id}
              type="button"
              onClick={() => setSelected(hook)}
              aria-pressed={on}
              className={`text-left rounded-xl border px-3.5 py-3.5 transition-colors cursor-pointer ${
                on
                  ? 'border-cyan-400/55 bg-cyan-500/15 text-cyan-50'
                  : 'border-white/12 bg-black/35 text-slate-200 hover:border-cyan-400/35'
              }`}
            >
              <span className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-cyan-300">
                {ICONS[hook.id]}
                {hook.pathId}
              </span>
              <span className="mt-2 block text-sm font-semibold text-white leading-snug">
                {hook.title}
              </span>
              <span className="mt-1.5 block text-[11px] text-slate-400 leading-snug">
                {hook.sub}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && confirm(selected.pathId)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-cyan-400 disabled:opacity-40 cursor-pointer disabled:cursor-default"
        >
          Continue on this path
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => confirm('balanced')}
          className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
        >
          Skip — keep both
        </button>
      </div>
    </div>
  );

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/12 bg-[#07080c]"
        role="group"
        aria-label="Personal growth path"
      >
        {body}
      </motion.div>
    );
  }

  const mood = selected?.mood ?? 'awakening';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <CinematicPanel mood={mood}>{body}</CinematicPanel>
    </motion.div>
  );
}
