/**
 * Generic Attention Intelligence exercise renderer by exerciseType.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Check, Play, RotateCcw } from 'lucide-react';
import type { AttentionSession } from '../content/attention-intelligence';
import type { DeckSlide } from '../lib/decks/types';
import { CinematicBackdrop } from './fx';
import InteractiveDeck from './fx/InteractiveDeck';
import { useHearing } from '../lib/hearing/context';
import { setHearingSessionHandler } from '../lib/hearing/session-bridge';
import type { HearingCommand } from '../lib/hearing/commands';
import ConversationalProof from './ConversationalProof';
import type { ProofBeat } from '../hooks/useConversationalProof';
import { formatHookMirrorJoined } from '../lib/hearing/conversational-proof';

interface AttentionSessionPlayerProps {
  session: AttentionSession;
  completed: boolean;
  onReadyChange: (ready: boolean, artifacts: string) => void;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

function optionLabel(i: number): string {
  return ['one', 'two', 'three'][i] || String(i + 1);
}

export default function AttentionSessionPlayer({
  session,
  completed,
  onReadyChange,
  addLog,
}: AttentionSessionPlayerProps) {
  const ex = session.exercise;
  const hearing = useHearing();
  const hearingActive = Boolean(hearing?.active);
  const speakLine = hearing?.speakLine;
  const narratedSessionRef = useRef<string | null>(null);
  const lastBreathCueRef = useRef('');
  const lastScanCueRef = useRef(0);

  // shared-ish state keyed by type
  const [skill, setSkill] = useState('');
  const [reps, setReps] = useState(0);
  const [observation, setObservation] = useState('');
  const [biasAnswers, setBiasAnswers] = useState<(number | null)[]>([]);
  const [journal, setJournal] = useState('');
  const [grounding, setGrounding] = useState(['', '', '', '', '']);
  const [breathState, setBreathState] = useState<
    'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'complete'
  >('idle');
  const [breathSec, setBreathSec] = useState(0);
  const [breathRounds, setBreathRounds] = useState(0);
  const [scanActive, setScanActive] = useState(false);
  const [scanLeft, setScanLeft] = useState(60);
  const [scanDone, setScanDone] = useState(false);
  const [summary, setSummary] = useState('');
  const [growthRatings, setGrowthRatings] = useState<number[]>([]);
  const [reframe, setReframe] = useState('');
  const [practice, setPractice] = useState('');
  const [modelAnswer, setModelAnswer] = useState('');
  const [cue, setCue] = useState('');
  const [habitAction, setHabitAction] = useState('');
  const [multiplierIdx, setMultiplierIdx] = useState(0);
  const [multiplierRating, setMultiplierRating] = useState(5);
  const [multiplierAction, setMultiplierAction] = useState('');
  const [hookBait, setHookBait] = useState('');
  const [hookNotice, setHookNotice] = useState('');
  const [hookWhy, setHookWhy] = useState('');
  const hookReadyAnnouncedRef = useRef(false);
  const exerciseNarratedRef = useRef<string | null>(null);
  /** Hook → insight deck before exercise (curriculum essays stay in content files). */
  const [briefDone, setBriefDone] = useState(completed);

  const briefSlides: DeckSlide[] = useMemo(
    () => [
      {
        id: `${session.id}-hook`,
        eyebrow: 'Hook · Mind',
        title: session.title,
        body: session.hook,
        mood: 'spark',
      },
      {
        id: `${session.id}-insight`,
        eyebrow: 'Insight · Machine',
        title: 'Hold this',
        body: session.insight,
        mood: 'facility',
      },
    ],
    [session.id, session.title, session.hook, session.insight]
  );

  const biasAllAnswered =
    ex.type === 'bias_quiz' &&
    biasAnswers.length === ex.questions.length &&
    biasAnswers.every((a) => a != null);

  const journalBeats: ProofBeat[] = useMemo(() => {
    if (ex.type !== 'bias_quiz') return [];
    return [
      {
        id: `${session.id}-journal`,
        label: 'Reflect',
        prompt: ex.journalPrompt,
        minLen: ex.minJournalLen,
        placeholder: 'Speak or type one honest line…',
      },
    ];
  }, [ex, session.id]);

  const hookBeats: ProofBeat[] = useMemo(() => {
    if (ex.type !== 'hook_mirror') return [];
    return [
      {
        id: `${session.id}-bait`,
        label: 'Bait',
        prompt: ex.hookPrompt,
        minLen: ex.minLen,
        placeholder: 'What pulls you in…',
      },
      {
        id: `${session.id}-notice`,
        label: 'Notice',
        prompt: ex.noticePrompt,
        minLen: ex.minLen,
        placeholder: 'What you notice when you catch yourself…',
      },
      {
        id: `${session.id}-why`,
        label: 'Why',
        prompt: ex.whyPrompt,
        minLen: ex.minLen,
        placeholder: 'Why you keep going anyway…',
      },
    ];
  }, [ex, session.id]);

  const onJournalChange = useCallback((answers: string[]) => {
    setJournal(answers[0] || '');
  }, []);

  const onHookChange = useCallback((answers: string[]) => {
    setHookBait(answers[0] || '');
    setHookNotice(answers[1] || '');
    setHookWhy(answers[2] || '');
  }, []);

  useEffect(() => {
    // reset when session changes
    setSkill('');
    setReps(0);
    setObservation('');
    setBiasAnswers([]);
    setJournal('');
    setGrounding(['', '', '', '', '']);
    setBreathState('idle');
    setBreathRounds(0);
    setScanActive(false);
    setScanDone(false);
    setSummary('');
    setGrowthRatings([]);
    setReframe('');
    setPractice('');
    setModelAnswer('');
    setCue('');
    setHabitAction('');
    setMultiplierIdx(0);
    setMultiplierRating(5);
    setMultiplierAction('');
    setHookBait('');
    setHookNotice('');
    setHookWhy('');
    hookReadyAnnouncedRef.current = false;
    exerciseNarratedRef.current = null;
    setBriefDone(completed);
    if (ex.type === 'bias_quiz') {
      setBiasAnswers(ex.questions.map(() => null));
    }
    if (ex.type === 'growth_scale') {
      setGrowthRatings(ex.statements.map(() => 3));
    }
    if (ex.type === 'body_scan') {
      setScanLeft(ex.seconds);
    }
  }, [session.id, completed, ex]);

  // breathing loop
  useEffect(() => {
    if (ex.type !== 'grounding_breath') return;
    if (breathState === 'idle' || breathState === 'complete') return;
    const interval = setInterval(() => {
      setBreathSec((prev) => {
        if (prev > 1) return prev - 1;
        if (breathState === 'inhale') {
          setBreathState('hold1');
          return ex.breathSeconds;
        }
        if (breathState === 'hold1') {
          setBreathState('exhale');
          return ex.breathSeconds;
        }
        if (breathState === 'exhale') {
          setBreathState('hold2');
          return ex.breathSeconds;
        }
        const next = breathRounds + 1;
        setBreathRounds(next);
        if (next >= ex.breathRounds) {
          setBreathState('complete');
          addLog('Box breathing complete — focus systems calibrated.', 'success');
          return 0;
        }
        setBreathState('inhale');
        return ex.breathSeconds;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [breathState, breathRounds, ex, addLog]);

  // body scan timer
  useEffect(() => {
    if (ex.type !== 'body_scan' || !scanActive) return;
    const interval = setInterval(() => {
      setScanLeft((prev) => {
        if (prev <= 1) {
          setScanActive(false);
          setScanDone(true);
          addLog('60s landing scan complete.', 'success');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [scanActive, ex, addLog]);

  // Hearing Mode: narrate hook while brief deck is open
  useEffect(() => {
    if (!hearingActive || !speakLine || completed) return;
    if (narratedSessionRef.current === session.id) return;
    narratedSessionRef.current = session.id;
    void speakLine(
      `${session.title}. ${session.hook} Duration about ${session.durationMin} minutes. Swipe the deck for the insight, then start the exercise.`
    );
  }, [
    hearingActive,
    speakLine,
    session.id,
    session.title,
    session.hook,
    session.durationMin,
    completed,
  ]);

  // Hearing Mode: narrate exercise prompts only after brief deck finishes
  useEffect(() => {
    if (!hearingActive || !speakLine || completed || !briefDone) return;
    if (exerciseNarratedRef.current === session.id) return;
    exerciseNarratedRef.current = session.id;

    void (async () => {
      if (ex.type === 'bias_quiz') {
        const q = ex.questions[0];
        const opts = q.options
          .map((o, i) => `Option ${optionLabel(i)}: ${o}`)
          .join('. ');
        await speakLine(`Question one. ${q.prompt}. ${opts}. Say one, two, or three.`);
      } else if (ex.type === 'grounding_breath') {
        await speakLine(
          `Grounding first. Fill five senses, then say start for box breathing. ${ex.breathRounds} rounds.`
        );
      } else if (ex.type === 'body_scan') {
        await speakLine(`Body scan. Say start for a ${ex.seconds} second landing.`);
      } else if (ex.type === 'reps_track') {
        await speakLine(`${ex.skillPrompt} Type your skill on screen, then discharge reps.`);
      } else if (ex.type === 'hook_mirror') {
        await speakLine(
          'Hook Mirror. Proof of Hook Awareness. Three short turns — speak or type. Say next when each turn feels honest.'
        );
      } else {
        await speakLine('Follow the on-screen prompts. Say help anytime.');
      }
    })();
  }, [hearingActive, speakLine, session.id, ex, completed, briefDone]);
  // Hearing Mode: breath phase cues
  useEffect(() => {
    if (!hearingActive || !speakLine || ex.type !== 'grounding_breath') return;
    if (breathState === 'idle') return;
    const cue =
      breathState === 'complete'
        ? 'Breathing complete. Calibrated.'
        : breathState === 'inhale'
          ? 'Inhale'
          : breathState === 'hold1' || breathState === 'hold2'
            ? 'Hold'
            : 'Exhale';
    if (lastBreathCueRef.current === `${breathState}-${breathRounds}`) return;
    lastBreathCueRef.current = `${breathState}-${breathRounds}`;
    void speakLine(cue);
  }, [hearingActive, speakLine, breathState, breathRounds, ex]);

  // Hearing Mode: body scan milestones
  useEffect(() => {
    if (!hearingActive || !speakLine || ex.type !== 'body_scan' || !scanActive) return;
    if (scanLeft === 30 || scanLeft === 10) {
      if (lastScanCueRef.current === scanLeft) return;
      lastScanCueRef.current = scanLeft;
      void speakLine(`${scanLeft} seconds left.`);
    }
  }, [hearingActive, speakLine, scanActive, scanLeft, ex]);

  useEffect(() => {
    if (!hearingActive || !speakLine || ex.type !== 'body_scan' || !scanDone) return;
    if (lastScanCueRef.current === -1) return;
    lastScanCueRef.current = -1;
    void speakLine('Landing complete. Add a short summary on screen.');
  }, [hearingActive, speakLine, scanDone, ex]);

  // Hearing Mode: voice answers while session is open
  useEffect(() => {
    if (!hearingActive) {
      setHearingSessionHandler(null);
      return;
    }

    setHearingSessionHandler(async (cmd: HearingCommand) => {
      if (completed) return false;

      if (cmd === 'start') {
        if (ex.type === 'grounding_breath' && breathState === 'idle') {
          setBreathRounds(0);
          setBreathSec(ex.breathSeconds);
          setBreathState('inhale');
          if (speakLine) await speakLine('Box breathing started. Inhale.');
          return true;
        }
        if (ex.type === 'body_scan' && !scanActive && !scanDone) {
          setScanLeft(ex.seconds);
          setScanActive(true);
          if (speakLine) await speakLine(`Landing started. ${ex.seconds} seconds.`);
          return true;
        }
        return false;
      }

      if (ex.type === 'bias_quiz' && (cmd === 'option_1' || cmd === 'option_2' || cmd === 'option_3')) {
        const idx = cmd === 'option_1' ? 0 : cmd === 'option_2' ? 1 : 2;
        const qi = biasAnswers.findIndex((a) => a == null);
        const questionIndex = qi === -1 ? ex.questions.length - 1 : qi;
        const q = ex.questions[questionIndex];
        if (!q || idx >= q.options.length) {
          if (speakLine) await speakLine('That option is not available.');
          return true;
        }
        const next = [...biasAnswers];
        while (next.length < ex.questions.length) next.push(null);
        next[questionIndex] = idx;
        setBiasAnswers(next);
        if (speakLine) {
          await speakLine(`Selected ${optionLabel(idx)}. ${q.reveal}`);
          const unanswered = next.findIndex((a) => a == null);
          if (unanswered >= 0) {
            const nq = ex.questions[unanswered];
            const opts = nq.options
              .map((o, i) => `Option ${optionLabel(i)}: ${o}`)
              .join('. ');
            await speakLine(`Question ${unanswered + 1}. ${nq.prompt}. ${opts}`);
          } else {
            await speakLine(
              `${ex.journalPrompt} Speak a short reflection, then say next when ready.`
            );
          }
        }
        return true;
      }

      if (cmd === 'next' && ex.type === 'bias_quiz') {
        const unanswered = biasAnswers.findIndex((a) => a == null);
        if (unanswered >= 0 && speakLine) {
          const nq = ex.questions[unanswered];
          const opts = nq.options
            .map((o, i) => `Option ${optionLabel(i)}: ${o}`)
            .join('. ');
          await speakLine(`Question ${unanswered + 1}. ${nq.prompt}. ${opts}`);
          return true;
        }
        if (speakLine) {
          await speakLine(
            `${ex.journalPrompt} Speak your line, then say next or done.`
          );
        }
        return true;
      }

      return false;
    });

    return () => setHearingSessionHandler(null);
  }, [
    hearingActive,
    speakLine,
    completed,
    ex,
    biasAnswers,
    breathState,
    scanActive,
    scanDone,
  ]);

  useEffect(() => {
    let ready = false;
    let artifacts = '';

    switch (ex.type) {
      case 'reps_track': {
        ready =
          skill.trim().length >= 3 &&
          reps >= ex.repsRequired &&
          observation.trim().length >= ex.minObservationLen;
        artifacts = `Skill: ${skill}\nReps: ${reps}/${ex.repsRequired}\nObservation: ${observation}`;
        break;
      }
      case 'bias_quiz': {
        const allAnswered = biasAnswers.length === ex.questions.length && biasAnswers.every((a) => a != null);
        ready = allAnswered && journal.trim().length >= ex.minJournalLen;
        artifacts = `Bias answers: ${JSON.stringify(biasAnswers)}\nJournal: ${journal}`;
        break;
      }
      case 'grounding_breath': {
        const grounded = grounding.every((g) => g.trim().length >= 1);
        ready = grounded && breathState === 'complete';
        artifacts = `Grounding: ${JSON.stringify(grounding)}\nBreath rounds: ${breathRounds}`;
        break;
      }
      case 'body_scan': {
        ready = scanDone && summary.trim().length >= ex.minSummaryLen;
        artifacts = `Body scan done. Summary: ${summary}`;
        break;
      }
      case 'growth_scale': {
        ready =
          growthRatings.length === ex.statements.length &&
          reframe.trim().length >= ex.minReframeLen &&
          practice.trim().length >= 3;
        artifacts = `Ratings: ${JSON.stringify(growthRatings)}\nReframe: ${reframe}\nPractice: ${practice}`;
        break;
      }
      case 'mental_models': {
        ready = modelAnswer.trim().length >= ex.minAnswerLen;
        artifacts = `Inversion exercise: ${modelAnswer}`;
        break;
      }
      case 'habit_stack': {
        ready = cue.trim().length >= ex.minLen && habitAction.trim().length >= ex.minLen;
        artifacts = `After [${cue}] I will [${habitAction}]`;
        break;
      }
      case 'multiplier_audit': {
        ready = multiplierAction.trim().length >= ex.minActionLen;
        artifacts = `Multiplier: ${ex.multipliers[multiplierIdx]} | Rating ${multiplierRating}/10 | Action: ${multiplierAction}`;
        break;
      }
      case 'hook_mirror': {
        ready =
          hookBait.trim().length >= ex.minLen &&
          hookNotice.trim().length >= ex.minLen &&
          hookWhy.trim().length >= ex.minLen;
        artifacts = `Hook: ${hookBait.trim()}\nNotice: ${hookNotice.trim()}\nWhy: ${hookWhy.trim()}`;
        break;
      }
      default: {
        const _exhaustive: never = ex;
        void _exhaustive;
      }
    }

    onReadyChange(ready && !completed && briefDone, artifacts);
  }, [
    ex,
    skill,
    reps,
    observation,
    biasAnswers,
    journal,
    grounding,
    breathState,
    breathRounds,
    scanDone,
    summary,
    growthRatings,
    reframe,
    practice,
    modelAnswer,
    cue,
    habitAction,
    multiplierIdx,
    multiplierRating,
    multiplierAction,
    hookBait,
    hookNotice,
    hookWhy,
    completed,
    briefDone,
    onReadyChange,
  ]);
  // Hearing: announce when Hook Mirror is ready for Zen
  useEffect(() => {
    if (!hearingActive || !speakLine || completed || ex.type !== 'hook_mirror') return;
    const ready =
      hookBait.trim().length >= ex.minLen &&
      hookNotice.trim().length >= ex.minLen &&
      hookWhy.trim().length >= ex.minLen;
    if (!ready || hookReadyAnnouncedRef.current) return;
    hookReadyAnnouncedRef.current = true;
    void speakLine(
      'Hook Mirror ready. You named the bait, the notice, and why you stay. Zen break — say Mind or Machine.'
    );
  }, [hearingActive, speakLine, completed, ex, hookBait, hookNotice, hookWhy]);

  const inputClass =
    'w-full bg-black/45 border border-white/12 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-400/45';
  const labelClass =
    'text-[10px] font-mono font-black tracking-[0.18em] text-amber-300/80 uppercase mb-1.5 block';

  return (
    <div className="relative space-y-5 rounded-xl overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-50 rounded-xl overflow-hidden">
        <CinematicBackdrop variant="duality" />
      </div>
      <div className="relative z-[1] space-y-5">
      {!briefDone ? (
        <InteractiveDeck
          slides={briefSlides}
          mood="spark"
          finishLabel="Start exercise"
          onFinish={() => setBriefDone(true)}
        />
      ) : (
        <p className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 font-display text-sm italic leading-relaxed text-slate-200">
          &ldquo;{session.hook}&rdquo;
        </p>
      )}

      {briefDone && ex.type === 'reps_track' && (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{ex.skillPrompt}</label>
            <input
              className={inputClass}
              value={skill}
              disabled={completed}
              placeholder={ex.skillPlaceholder}
              onChange={(e) => setSkill(e.target.value)}
            />
          </div>
          {skill && (
            <button
              type="button"
              disabled={completed || reps >= ex.repsRequired}
              onClick={() => setReps((r) => Math.min(ex.repsRequired, r + 1))}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 font-mono text-xs font-bold disabled:opacity-40"
            >
              <Zap className="w-3.5 h-3.5" />
              {reps >= ex.repsRequired
                ? 'CONNECTIONS STABILIZED'
                : `DISCHARGE NEURON REPS (${reps}/${ex.repsRequired})`}
            </button>
          )}
          <div>
            <label className={labelClass}>{ex.observationPrompt}</label>
            <textarea
              className={inputClass + ' min-h-[80px]'}
              value={observation}
              disabled={completed}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>
        </div>
      )}

      {briefDone && ex.type === 'bias_quiz' && (
        <div className="space-y-4">
          {/* Desktop progress orbs: Q1…Qn → Reflect → Ready */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 mr-1">
              Path
            </p>
            {ex.questions.map((_, i) => {
              const done = biasAnswers[i] != null;
              const active = !done && biasAnswers.findIndex((a) => a == null) === i;
              return (
                <span
                  key={`q-orb-${i}`}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                    done
                      ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                      : active
                        ? 'border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-100'
                        : 'border-white/10 text-slate-500'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      done ? 'bg-emerald-400' : active ? 'bg-fuchsia-400' : 'bg-slate-600'
                    }`}
                  />
                  Q{i + 1}
                  {done && <Check className="h-3 w-3" />}
                </span>
              );
            })}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                journal.trim().length >= ex.minJournalLen
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
                  : biasAllAnswered
                    ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-100'
                    : 'border-white/10 text-slate-500'
              }`}
            >
              Reflect
              {journal.trim().length >= ex.minJournalLen && <Check className="h-3 w-3" />}
            </span>
            {biasAllAnswered && journal.trim().length >= ex.minJournalLen && !completed && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border border-amber-400/40 bg-amber-500/15 text-amber-200">
                Ready
              </span>
            )}
          </div>

          {ex.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
              <p className="font-display text-sm italic font-semibold text-slate-100">{q.prompt}</p>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    type="button"
                    disabled={completed}
                    onClick={() => {
                      const next = [...biasAnswers];
                      next[i] = oi;
                      setBiasAnswers(next);
                    }}
                    className={`w-full text-left text-sm px-3.5 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                      biasAnswers[i] === oi
                        ? 'border-amber-400/50 bg-amber-500/15 text-amber-50'
                        : 'border-white/10 text-slate-400 hover:border-amber-400/30 hover:bg-amber-500/5'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {biasAnswers[i] != null && (
                <p className="text-[11px] text-emerald-400/90">{q.reveal}</p>
              )}
            </div>
          ))}

          {biasAllAnswered && (
            <ConversationalProof
              beats={journalBeats}
              disabled={completed}
              hearingActive={hearingActive}
              speakLine={speakLine}
              narrateBeats={hearingActive}
              onAnswersChange={(answers) => onJournalChange(answers)}
              completeLabel="Lock reflection"
              variant="dialogue"
            />
          )}
        </div>
      )}

      {briefDone && ex.type === 'grounding_breath' && (
        <div className="space-y-4">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">5-4-3-2-1 Grounding</p>
          {ex.groundingLabels.map((label, i) => (
            <div key={label}>
              <label className={labelClass}>{label}</label>
              <input
                className={inputClass}
                value={grounding[i]}
                disabled={completed}
                onChange={(e) => {
                  const next = [...grounding];
                  next[i] = e.target.value;
                  setGrounding(next);
                }}
              />
            </div>
          ))}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-center">
            <p className="text-[10px] font-mono text-cyan-400 mb-2">BOX BREATH × {ex.breathRounds}</p>
            {breathState === 'idle' && (
              <button
                type="button"
                disabled={completed}
                onClick={() => {
                  setBreathRounds(0);
                  setBreathSec(ex.breathSeconds);
                  setBreathState('inhale');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold"
              >
                <Play className="w-3.5 h-3.5" /> START
              </button>
            )}
            {breathState !== 'idle' && breathState !== 'complete' && (
              <div>
                <p className="text-3xl font-mono text-white mb-1">{breathSec}</p>
                <p className="text-xs uppercase tracking-widest text-cyan-300">{breathState}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Round {Math.min(breathRounds + 1, ex.breathRounds)} / {ex.breathRounds}
                </p>
              </div>
            )}
            {breathState === 'complete' && (
              <p className="text-emerald-400 text-sm font-mono flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> CALIBRATED
              </p>
            )}
          </div>
        </div>
      )}

      {briefDone && ex.type === 'body_scan' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
            {!scanDone && !scanActive && (
              <button
                type="button"
                disabled={completed}
                onClick={() => {
                  setScanLeft(ex.seconds);
                  setScanActive(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-400/40 text-violet-200 text-xs font-bold"
              >
                <Play className="w-3.5 h-3.5" /> START {ex.seconds}s LANDING
              </button>
            )}
            {scanActive && (
              <motion.p
                key={scanLeft}
                initial={{ scale: 1.1, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-mono text-white"
              >
                {scanLeft}
              </motion.p>
            )}
            {scanDone && (
              <p className="text-emerald-400 font-mono text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> LANDING COMPLETE
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>{ex.summaryPrompt}</label>
            <textarea
              className={inputClass + ' min-h-[80px]'}
              value={summary}
              disabled={completed}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
        </div>
      )}

      {briefDone && ex.type === 'growth_scale' && (
        <div className="space-y-4">
          <p className="text-[10px] font-mono text-slate-500">Rate 1–5 (disagree → agree)</p>
          {ex.statements.map((st, i) => (
            <div key={i} className="rounded-xl border border-white/5 p-3">
              <p className="text-sm text-slate-300 mb-2">{st.text}</p>
              <input
                type="range"
                min={1}
                max={5}
                disabled={completed}
                value={growthRatings[i] ?? 3}
                onChange={(e) => {
                  const next = [...growthRatings];
                  next[i] = Number(e.target.value);
                  setGrowthRatings(next);
                }}
                className="w-full"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {growthRatings[i] ?? 3} · {st.growthLean ? 'growth-lean if high' : 'fixed-lean if high'}
              </p>
            </div>
          ))}
          <div>
            <label className={labelClass}>{ex.reframePrompt}</label>
            <textarea
              className={inputClass + ' min-h-[70px]'}
              value={reframe}
              disabled={completed}
              onChange={(e) => setReframe(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{ex.practicePrompt}</label>
            <input
              className={inputClass}
              value={practice}
              disabled={completed}
              onChange={(e) => setPractice(e.target.value)}
            />
          </div>
        </div>
      )}

      {briefDone && ex.type === 'mental_models' && (
        <div className="space-y-4">
          <div className="grid gap-2">
            {ex.models.map((m) => (
              <div key={m.name} className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                <p className="text-xs font-bold text-emerald-300 mb-1">{m.name}</p>
                <p className="text-[12px] text-slate-400">{m.blurb}</p>
              </div>
            ))}
          </div>
          <div>
            <label className={labelClass}>{ex.challengePrompt}</label>
            <textarea
              className={inputClass + ' min-h-[100px]'}
              value={modelAnswer}
              disabled={completed}
              onChange={(e) => setModelAnswer(e.target.value)}
            />
          </div>
        </div>
      )}

      {briefDone && ex.type === 'habit_stack' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/5 p-3 text-xs text-slate-400 font-mono">
            After [existing habit], I will [new tiny action].
          </div>
          <div>
            <label className={labelClass}>{ex.cuePrompt}</label>
            <input className={inputClass} value={cue} disabled={completed} onChange={(e) => setCue(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>{ex.actionPrompt}</label>
            <input
              className={inputClass}
              value={habitAction}
              disabled={completed}
              onChange={(e) => setHabitAction(e.target.value)}
            />
          </div>
          {(cue || habitAction) && (
            <p className="text-sm text-cyan-300">
              After <strong>{cue || '…'}</strong>, I will <strong>{habitAction || '…'}</strong>.
            </p>
          )}
        </div>
      )}

      {briefDone && ex.type === 'multiplier_audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ex.multipliers.map((m, i) => (
              <button
                key={m}
                type="button"
                disabled={completed}
                onClick={() => setMultiplierIdx(i)}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border ${
                  multiplierIdx === i
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                    : 'border-white/10 text-slate-400'
                }`}
              >
                {i + 1}. {m.split('(')[0].trim()}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">{ex.multipliers[multiplierIdx]}</p>
          <div>
            <label className={labelClass}>Rating 1–10</label>
            <input
              type="range"
              min={1}
              max={10}
              disabled={completed}
              value={multiplierRating}
              onChange={(e) => setMultiplierRating(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs font-mono text-amber-300">{multiplierRating}/10</p>
          </div>
          <div>
            <label className={labelClass}>{ex.actionPrompt}</label>
            <textarea
              className={inputClass + ' min-h-[80px]'}
              value={multiplierAction}
              disabled={completed}
              onChange={(e) => setMultiplierAction(e.target.value)}
            />
          </div>
        </div>
      )}

      {briefDone && ex.type === 'hook_mirror' && (
        <div className="space-y-4">
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-amber-400/90">
            Proof of Hook Awareness · three honest turns
          </p>
          <ConversationalProof
            beats={hookBeats}
            disabled={completed}
            hearingActive={hearingActive}
            speakLine={speakLine}
            narrateBeats={hearingActive}
            formatJoined={formatHookMirrorJoined}
            onAnswersChange={(answers) => onHookChange(answers)}
            variant="quest"
            completeLabel="Lock mirror"
          />
          {hookBait.trim().length >= ex.minLen &&
            hookNotice.trim().length >= ex.minLen &&
            hookWhy.trim().length >= ex.minLen &&
            !completed && (
              <p className="text-[11px] text-emerald-400/90 font-medium">
                Mirror ready. Zen break next — Mind to hold, Machine to fuel.
              </p>
            )}
        </div>
      )}

      {completed && (
        <p className="text-xs font-mono text-emerald-400 flex items-center gap-2">
          <Check className="w-3.5 h-3.5" /> SESSION INTEGRATED
        </p>
      )}

      {!completed && breathState === 'complete' && ex.type === 'grounding_breath' && (
        <button
          type="button"
          onClick={() => {
            setBreathState('idle');
            setBreathRounds(0);
          }}
          className="text-[10px] text-slate-500 flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" /> Reset breath
        </button>
      )}
      </div>
    </div>
  );
}
