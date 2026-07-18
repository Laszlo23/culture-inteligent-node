/**
 * Mind ↔ Machine decision break — knowledge first, then fuel.
 * Breaks the human learning loop into one conscious choice.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Brain, Cpu, ArrowRight } from 'lucide-react';
import {
  ZEN_COPY,
  type LearningDecision,
} from '../lib/zen-duality';

interface ZenDecisionGateProps {
  sessionTitle: string;
  decision: LearningDecision | null;
  onDecide: (decision: LearningDecision) => void;
  zenMode?: boolean;
}

export default function ZenDecisionGate({
  sessionTitle,
  decision,
  onDecide,
  zenMode = false,
}: ZenDecisionGateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-5 rounded-2xl border p-4 ${
        zenMode
          ? 'border-amber-500/35 bg-gradient-to-br from-amber-950/50 via-[#0a0a0c]/90 to-cyan-950/30'
          : 'border-white/10 bg-black/40'
      }`}
      role="group"
      aria-label="Zen decision — Mind or Machine"
    >
      <p className="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-amber-400/90">
        {ZEN_COPY.eyebrow}
      </p>
      <h4 className="mt-1.5 text-base font-semibold text-white tracking-tight">
        {ZEN_COPY.title}
      </h4>
      <p className="mt-1 text-[12px] text-slate-400 leading-relaxed max-w-xl">
        {ZEN_COPY.body}
      </p>
      <p className="mt-2 text-[11px] text-slate-500 italic truncate" title={sessionTitle}>
        Session · {sessionTitle}
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onDecide('hold_knowledge')}
          aria-pressed={decision === 'hold_knowledge'}
          className={`text-left rounded-xl border px-3.5 py-3 transition-colors cursor-pointer ${
            decision === 'hold_knowledge'
              ? 'border-amber-400/55 bg-amber-500/15 text-amber-50'
              : 'border-amber-500/25 bg-amber-500/5 text-slate-200 hover:border-amber-400/40'
          }`}
        >
          <span className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-300">
            <Brain className="w-3.5 h-3.5" />
            {ZEN_COPY.mindLabel}
          </span>
          <span className="mt-1 block text-[11px] text-slate-400 leading-snug">
            {ZEN_COPY.mindSub}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDecide('convert_fuel')}
          aria-pressed={decision === 'convert_fuel'}
          className={`text-left rounded-xl border px-3.5 py-3 transition-colors cursor-pointer ${
            decision === 'convert_fuel'
              ? 'border-cyan-400/55 bg-cyan-500/15 text-cyan-50'
              : 'border-cyan-500/25 bg-cyan-500/5 text-slate-200 hover:border-cyan-400/40'
          }`}
        >
          <span className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-cyan-300">
            <Cpu className="w-3.5 h-3.5" />
            {ZEN_COPY.machineLabel}
          </span>
          <span className="mt-1 block text-[11px] text-slate-400 leading-snug">
            {ZEN_COPY.machineSub}
          </span>
        </button>
      </div>

      {decision === 'hold_knowledge' && (
        <div className="mt-3 space-y-2" aria-live="polite">
          <p className="text-[11px] text-amber-200/90 font-medium">{ZEN_COPY.heldNote}</p>
          <button
            type="button"
            onClick={() => onDecide('convert_fuel')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-400/35 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            {ZEN_COPY.readyConvertCta}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {decision === 'convert_fuel' && (
        <p className="mt-3 text-[11px] text-cyan-200/90 font-medium" aria-live="polite">
          {ZEN_COPY.convertedNote}
        </p>
      )}
    </motion.div>
  );
}
