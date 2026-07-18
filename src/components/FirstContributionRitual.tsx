/**
 * Magical first 5 minutes: Welcome → reflection → passport scores → share.
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { BRAND } from '../lib/brand-slogans';
import {
  ensureGuestId,
  pickFirstContributionPrompt,
  saveFirstContribution,
  seedFromFirstContribution,
  type FirstContributionRecord,
} from '../lib/first-contribution';
import { evaluateFirstContributionViaApi } from '../lib/first-contribution-eval';
import { track } from '../lib/attention-metrics';
import PassportShareCard from './PassportShareCard';
import { CinematicBackdrop, GlowPulse } from './fx';

type Phase = 'welcome' | 'challenge' | 'reveal';

type Props = {
  displayName?: string;
  walletAddress?: string | null;
  onComplete: (record: FirstContributionRecord) => void;
  onKeepPassport?: () => void;
  onContinueWorkspace?: () => void;
};

const MIN_ANSWER = 40;

export default function FirstContributionRitual({
  displayName,
  walletAddress,
  onComplete,
  onKeepPassport,
  onContinueWorkspace,
}: Props) {
  const prompt = useMemo(
    () => pickFirstContributionPrompt(walletAddress || ensureGuestId()),
    [walletAddress]
  );
  const [phase, setPhase] = useState<Phase>('welcome');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<FirstContributionRecord | null>(null);

  const name = (displayName || 'You').replace(/^@/, '');

  const submit = async () => {
    const trimmed = answer.trim();
    if (trimmed.length < MIN_ANSWER) {
      setError(`Write at least ${MIN_ANSWER} characters — give us something real.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Server-side Gemini — browser never sees GEMINI_API_KEY
      const evalResult = await evaluateFirstContributionViaApi({
        prompt,
        answer: trimmed,
      });
      const scores = seedFromFirstContribution(evalResult.dims);
      const next: FirstContributionRecord = {
        prompt,
        answer: trimmed,
        dims: evalResult.dims,
        coachLine: evalResult.coachLine,
        scores,
        at: new Date().toISOString(),
        guestId: walletAddress ? undefined : ensureGuestId(),
        walletAddress: walletAddress || undefined,
        model: evalResult.model,
        liveFeedback: evalResult.live,
      };
      saveFirstContribution(next);
      setRecord(next);
      track('first_contribution_complete', {
        knowledge: scores.knowledge,
        creativity: scores.creativity,
        contribution: scores.contribution,
        humanValue: scores.humanValue,
        live: evalResult.live,
        model: evalResult.model,
      });
      setPhase('reveal');
      onComplete(next);
    } catch {
      setError('Could not measure that — try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-300 relative overflow-hidden">
      <div className="absolute inset-0">
        <CinematicBackdrop variant="ritual" />
      </div>
      <GlowPulse energy={10} color="cyan" className="absolute -right-16 -top-16 w-56 h-56 z-0" />
      <div className="relative z-10 max-w-xl mx-auto px-5 py-14 md:py-20">
        <AnimatePresence mode="wait">
          {phase === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-8"
            >
              <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-amber-400/90">
                {BRAND.parent} · Human Reputation
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold italic text-white leading-[1.05]">
                Welcome.
              </h1>
              <p className="font-display text-2xl md:text-3xl font-bold italic text-slate-200">
                Let&apos;s measure your first contribution.
              </p>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Not empty scrolling. One short answer — we score curiosity, creativity, and
                reflection. Your Human Passport starts here.
              </p>
              <button
                type="button"
                onClick={() => setPhase('challenge')}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_32px_rgba(34,211,238,0.35)]"
              >
                Start Your Human Passport
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {phase === 'challenge' && (
            <motion.div
              key="challenge"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <p className="font-mono text-[9px] font-black tracking-[0.24em] uppercase text-cyan-400/90">
                2-minute challenge
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold italic text-white leading-snug">
                {prompt}
              </h2>
              <p className="text-[12px] text-slate-500 font-mono uppercase tracking-wider">
                AI evaluates · curiosity · creativity · reflection
              </p>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                placeholder="Write freely — what shifted for you?"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50 resize-y min-h-[140px]"
              />
              <div className="flex items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
                <span>
                  {answer.trim().length}/{MIN_ANSWER}+ characters
                </span>
                {error && <span className="text-rose-300">{error}</span>}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit()}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Measuring…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Measure my contribution
                  </>
                )}
              </button>
            </motion.div>
          )}

          {phase === 'reveal' && record && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <p className="font-mono text-[9px] font-black tracking-[0.24em] uppercase text-amber-400/90">
                  Your first score
                </p>
                <h2 className="mt-2 font-display text-3xl font-extrabold italic text-white">
                  Human Value: {record.scores.humanValue}
                </h2>
                <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3.5">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-cyan-300/90">
                    {record.liveFeedback ? 'Coach feedback' : 'Coach feedback · offline'}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-100 leading-relaxed">
                    {record.coachLine}
                  </p>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Interesting. Improve this with the next Proof of Attention.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Knowledge', v: record.scores.knowledge, tone: 'text-cyan-300' },
                  {
                    label: 'Creativity',
                    v: record.scores.creativity ?? record.scores.builder,
                    tone: 'text-amber-300',
                  },
                  { label: 'Contribution', v: record.scores.contribution, tone: 'text-rose-300' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-black/35 px-3 py-4 text-center"
                  >
                    <p className="font-mono text-[8px] uppercase tracking-wider text-slate-500">
                      {s.label}
                    </p>
                    <p className={`mt-1 font-display text-3xl font-bold italic ${s.tone}`}>
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                AI read · curiosity {record.dims.curiosity} · creativity {record.dims.creativity}{' '}
                · reflection {record.dims.reflection}
              </p>

              <PassportShareCard name={name} scores={record.scores} />

              <div className="flex flex-col sm:flex-row gap-2">
                {onKeepPassport && (
                  <button
                    type="button"
                    onClick={onKeepPassport}
                    className="flex-1 px-5 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Keep my passport
                  </button>
                )}
                {onContinueWorkspace && (
                  <button
                    type="button"
                    onClick={onContinueWorkspace}
                    className="flex-1 px-5 py-3.5 rounded-xl border border-white/15 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Continue — improve this
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                Next: one Proof of Attention. Knowledge first. Then decide.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
