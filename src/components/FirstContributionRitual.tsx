/**
 * Magical first minutes: Welcome → conversational reflection → passport scores → share.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
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
import ConversationalProof from './ConversationalProof';
import type { ProofBeat } from '../hooks/useConversationalProof';
import { formatFirstContributionJoined } from '../lib/hearing/conversational-proof';
import { useHearing } from '../lib/hearing/context';
import { CinematicBackdrop, GlowPulse } from './fx';

type Phase = 'welcome' | 'challenge' | 'reveal';

type Props = {
  displayName?: string;
  walletAddress?: string | null;
  onComplete: (record: FirstContributionRecord) => void;
  onKeepPassport?: () => void;
  onContinueWorkspace?: () => void;
};

const MIN_JOINED = 40;

export default function FirstContributionRitual({
  displayName,
  walletAddress,
  onComplete,
  onKeepPassport,
  onContinueWorkspace,
}: Props) {
  const hearing = useHearing();
  const prompt = useMemo(
    () => pickFirstContributionPrompt(walletAddress || ensureGuestId()),
    [walletAddress]
  );
  const [phase, setPhase] = useState<Phase>('welcome');
  const [joinedAnswer, setJoinedAnswer] = useState('');
  const [convKey, setConvKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<FirstContributionRecord | null>(null);

  const name = (displayName || 'You').replace(/^@/, '');

  const beats: ProofBeat[] = useMemo(
    () => [
      {
        id: 'spark',
        label: 'Spark',
        prompt,
        minLen: 14,
        placeholder: 'Speak or type a short honest line…',
      },
      {
        id: 'shift',
        label: 'Shift',
        prompt: 'What shifted for you in that moment — even a little?',
        minLen: 14,
        placeholder: 'What changed in how you see it…',
      },
      {
        id: 'takeaway',
        label: 'Takeaway',
        prompt: 'One concrete takeaway you could act on this week?',
        minLen: 14,
        placeholder: 'One thing you could try…',
      },
    ],
    [prompt]
  );

  const onAnswersChange = useCallback((_answers: string[], _ready: boolean, joined: string) => {
    setJoinedAnswer(joined);
  }, []);

  const submit = async (answerOverride?: string) => {
    const trimmed = (answerOverride ?? joinedAnswer).trim();
    if (trimmed.length < MIN_JOINED) {
      setError(`Need a bit more signal — keep talking through the turns (${MIN_JOINED}+ chars).`);
      setConvKey((k) => k + 1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
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
      setConvKey((k) => k + 1);
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
      <div className="relative z-10 max-w-3xl mx-auto px-5 py-14 md:py-20">
        <AnimatePresence mode="wait">
          {phase === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-8 max-w-xl"
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
                Not a long essay. A short conversation — three turns. We score curiosity,
                creativity, and reflection. Your Human Passport starts here.
              </p>
              <button
                type="button"
                onClick={() => setPhase('challenge')}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_32px_rgba(34,211,238,0.35)]"
              >
                {SLOGANS.ctaPassport}
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
              <div className="max-w-xl">
                <p className="font-mono text-[9px] font-black tracking-[0.24em] uppercase text-cyan-400/90">
                  2-minute conversation
                </p>
                <h2 className="mt-2 font-display text-2xl md:text-3xl font-extrabold italic text-white leading-snug">
                  Three short turns. Grow the signal.
                </h2>
                <p className="mt-2 text-[12px] text-slate-500 font-mono uppercase tracking-wider">
                  AI evaluates · curiosity · creativity · reflection
                </p>
              </div>

              <ConversationalProof
                key={convKey}
                beats={beats}
                formatJoined={formatFirstContributionJoined}
                onAnswersChange={onAnswersChange}
                onComplete={(joined) => {
                  void submit(joined);
                }}
                hearingActive={Boolean(hearing?.active)}
                speakLine={hearing?.speakLine}
                completeLabel="Measure my contribution"
                disabled={busy}
              />

              {error && (
                <p className="text-[12px] text-rose-300 font-mono">{error}</p>
              )}

              {busy && (
                <p className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Measuring…
                </p>
              )}
            </motion.div>
          )}

          {phase === 'reveal' && record && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 max-w-xl"
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
