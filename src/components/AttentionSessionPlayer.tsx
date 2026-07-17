/**
 * Generic Attention Intelligence exercise renderer by exerciseType.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Check, Play, RotateCcw } from 'lucide-react';
import type { AttentionSession } from '../content/attention-intelligence';

interface AttentionSessionPlayerProps {
  session: AttentionSession;
  completed: boolean;
  onReadyChange: (ready: boolean, artifacts: string) => void;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

export default function AttentionSessionPlayer({
  session,
  completed,
  onReadyChange,
  addLog,
}: AttentionSessionPlayerProps) {
  const ex = session.exercise;

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
    if (ex.type === 'bias_quiz') {
      setBiasAnswers(ex.questions.map(() => null));
    }
    if (ex.type === 'growth_scale') {
      setGrowthRatings(ex.statements.map(() => 3));
    }
    if (ex.type === 'body_scan') {
      setScanLeft(ex.seconds);
    }
  }, [session.id]);

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
      default: {
        const _exhaustive: never = ex;
        void _exhaustive;
      }
    }

    onReadyChange(ready && !completed, artifacts);
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
    completed,
    onReadyChange,
  ]);

  const inputClass =
    'w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500/50';
  const labelClass = 'text-[10px] font-mono tracking-wider text-slate-500 uppercase mb-1.5 block';

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
        <p className="text-[10px] font-mono text-fuchsia-400 tracking-widest uppercase mb-2">Hook</p>
        <p className="text-slate-200 text-sm leading-relaxed italic">&ldquo;{session.hook}&rdquo;</p>
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase mb-2">Insight</p>
        <p className="text-slate-400 text-sm leading-relaxed">{session.insight}</p>
      </div>

      {ex.type === 'reps_track' && (
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

      {ex.type === 'bias_quiz' && (
        <div className="space-y-4">
          {ex.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-white/5 p-3 space-y-2">
              <p className="text-sm text-slate-200">{q.prompt}</p>
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
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${
                      biasAnswers[i] === oi
                        ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200'
                        : 'border-white/10 text-slate-400 hover:border-white/20'
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
          <div>
            <label className={labelClass}>{ex.journalPrompt}</label>
            <textarea
              className={inputClass + ' min-h-[80px]'}
              value={journal}
              disabled={completed}
              onChange={(e) => setJournal(e.target.value)}
            />
          </div>
        </div>
      )}

      {ex.type === 'grounding_breath' && (
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

      {ex.type === 'body_scan' && (
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

      {ex.type === 'growth_scale' && (
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

      {ex.type === 'mental_models' && (
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

      {ex.type === 'habit_stack' && (
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

      {ex.type === 'multiplier_audit' && (
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
  );
}
