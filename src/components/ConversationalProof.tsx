/**
 * Gamified multi-beat proof capture — conversation first, type to edit.
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check, Mic } from 'lucide-react';
import {
  useConversationalProof,
  type ProofBeat,
} from '../hooks/useConversationalProof';

type Props = {
  beats: ProofBeat[];
  disabled?: boolean;
  hearingActive?: boolean;
  speakLine?: (text: string) => Promise<void>;
  narrateBeats?: boolean;
  formatJoined?: (answers: string[], beats: ProofBeat[]) => string;
  onAnswersChange?: (answers: string[], ready: boolean, joined: string) => void;
  onComplete?: (joined: string) => void;
  /** Quest labels (Hook Mirror) vs default dialogue */
  variant?: 'dialogue' | 'quest';
  completeLabel?: string;
  className?: string;
};

export default function ConversationalProof({
  beats,
  disabled = false,
  hearingActive = false,
  speakLine,
  narrateBeats = true,
  formatJoined,
  onAnswersChange,
  onComplete,
  variant = 'dialogue',
  completeLabel = 'Ready',
  className = '',
}: Props) {
  const state = useConversationalProof(beats, {
    formatJoined,
    hearingActive,
    disabled,
    onAnswersChange,
    onComplete,
  });

  const {
    turnIndex,
    answers,
    currentAnswer,
    setCurrentAnswer,
    canAdvance,
    ready,
    allDone,
    advance,
    goTo,
    signalStrength,
    beat,
  } = state;

  const lastSpokenTurn = useRef<string | null>(null);

  useEffect(() => {
    if (!narrateBeats || !hearingActive || !speakLine || disabled || allDone) return;
    const key = `${beat.id}:${turnIndex}`;
    if (lastSpokenTurn.current === key) return;
    lastSpokenTurn.current = key;
    void speakLine(beat.prompt);
  }, [narrateBeats, hearingActive, speakLine, disabled, allDone, beat, turnIndex]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="md:grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] md:gap-5 md:items-start space-y-4 md:space-y-0">
        {/* Desktop companion — progress + guide */}
        <aside className="rounded-xl border border-white/10 bg-black/35 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-cyan-400/90">
              {variant === 'quest' ? 'Quest beats' : 'Conversation'}
            </p>
            <p className="font-mono text-[10px] text-slate-500">
              {Math.min(turnIndex + 1, beats.length)}/{beats.length}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {beats.map((b, i) => {
              const filled = (answers[i] || '').trim().length >= b.minLen;
              const active = i === turnIndex && !allDone;
              return (
                <button
                  key={b.id}
                  type="button"
                  disabled={disabled || i > turnIndex}
                  onClick={() => goTo(i)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                    filled
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                      : active
                        ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-100'
                        : 'border-white/10 text-slate-500'
                  } ${i <= turnIndex && !disabled ? 'cursor-pointer' : 'cursor-default'}`}
                  aria-current={active ? 'step' : undefined}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      filled ? 'bg-emerald-400' : active ? 'bg-cyan-400' : 'bg-slate-600'
                    }`}
                  />
                  {b.label || `Turn ${i + 1}`}
                  {filled && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                Signal strength
              </p>
              <p className="font-mono text-[10px] text-amber-300/90">{signalStrength}%</p>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500/80 to-amber-400/80"
                initial={false}
                animate={{ width: `${signalStrength}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
              Short honest turns — grow the signal. Not a long essay.
            </p>
          </div>

          {hearingActive && !disabled && !allDone && (
            <p className="flex items-start gap-2 text-[11px] text-slate-400 leading-snug">
              <Mic className="h-3.5 w-3.5 mt-0.5 shrink-0 text-cyan-300" />
              Speak your answer. Say <span className="text-slate-200">next</span> or{' '}
              <span className="text-slate-200">done</span> when ready — or type to edit.
            </p>
          )}
        </aside>

        {/* Chat turns */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3 min-h-[220px]">
          <AnimatePresence mode="wait">
            {!allDone ? (
              <motion.div
                key={beat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-3"
              >
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3.5 py-3">
                  {beat.label && (
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/80 mb-1.5">
                      {beat.label}
                    </p>
                  )}
                  <p className="text-sm text-slate-100 leading-relaxed">{beat.prompt}</p>
                </div>

                {answers.map((a, i) => {
                  if (i >= turnIndex || !a.trim()) return null;
                  return (
                    <div
                      key={`past-${beats[i].id}`}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 ml-4"
                    >
                      <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">
                        You · {beats[i].label || `Turn ${i + 1}`}
                      </p>
                      <p className="text-[13px] text-slate-300 leading-relaxed">{a.trim()}</p>
                    </div>
                  );
                })}

                <div>
                  <textarea
                    value={currentAnswer}
                    disabled={disabled}
                    rows={3}
                    placeholder={
                      beat.placeholder ||
                      (hearingActive ? 'Speak, or type a short line…' : 'A short honest line…')
                    }
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/45 resize-y min-h-[88px]"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                    <span>
                      {currentAnswer.trim().length}/{beat.minLen}+
                    </span>
                    {!hearingActive && (
                      <span className="text-slate-600">Mic off — type your reply</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={disabled || !canAdvance}
                  onClick={() => advance()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-mono text-[11px] font-black uppercase tracking-wider cursor-pointer disabled:cursor-not-allowed"
                >
                  {turnIndex >= beats.length - 1 ? completeLabel : 'Continue'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="flex items-center gap-2 text-emerald-300 text-sm font-medium">
                  <Check className="h-4 w-4" />
                  Conversation captured
                </p>
                {answers.map((a, i) => (
                  <div
                    key={beats[i].id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500 mb-1">
                      {beats[i].label || `Turn ${i + 1}`}
                    </p>
                    <p className="text-[13px] text-slate-300 leading-relaxed">{a.trim()}</p>
                  </div>
                ))}
                {ready && (
                  <p className="text-[11px] text-slate-500">
                    Signal locked. Next beat waits when you are ready.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
