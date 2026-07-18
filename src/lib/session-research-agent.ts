/**
 * Weekly Attention Intelligence research agent — Gemini drafts evidence-based sessions.
 */

import { GoogleGenAI } from '@google/genai';
import type { AttentionSession, ExerciseType } from '../content/attention-intelligence.ts';
import { CORE_ATTENTION_SESSIONS, isoWeekKey } from '../content/attention-intelligence.ts';
import crypto from 'crypto';
import { getGeminiApiKey } from './gemini-key';

const EXERCISE_TYPES: ExerciseType[] = [
  'reps_track',
  'bias_quiz',
  'grounding_breath',
  'body_scan',
  'growth_scale',
  'mental_models',
  'habit_stack',
  'multiplier_audit',
];

function heuristicDraft(existingTitles: string[]): AttentionSession {
  const week = isoWeekKey();
  const id = `ai_w_${week.replace('-', '').toLowerCase()}_${crypto.randomBytes(3).toString('hex')}`;
  const topics = [
    'Dopamine & Deep Work in the AI Feed',
    'Implementation Intentions for Focus',
    'Attention Residue After Task Switching',
    'Sleep Debt vs Cognitive Control',
  ];
  const title =
    topics.find((t) => !existingTitles.some((e) => e.toLowerCase().includes(t.slice(0, 12).toLowerCase()))) ||
    topics[0];

  return {
    id,
    week,
    seriesOrder: 100 + CORE_ATTENTION_SESSIONS.length,
    title,
    hook: 'Your attention is the ore. This weekly drop mines one evidence-backed lever most feeds never teach.',
    insight:
      'Heuristic draft (no GEMINI_API_KEY): task-switching leaves attention residue; batching and single-task blocks recover control. Cite primary literature before publishing.',
    durationMin: 5,
    exerciseType: 'habit_stack',
    exercise: {
      type: 'habit_stack',
      cuePrompt: 'Cue after which you usually open a feed…',
      actionPrompt: 'Tiny replacement action (e.g. 60s single-task start)…',
      minLen: 4,
    },
    quiz: [
      {
        question: 'Attention residue refers to…',
        options: [
          'Lingering cognitive load after switching tasks',
          'Permanent IQ loss from coffee',
          'Only physical eye strain',
        ],
        correctIdx: 0,
        explanation: 'Unfinished prior tasks tax working memory on the next block.',
      },
    ],
    nextHook: 'Approve this draft to ship as this week\'s Attention Intelligence drop.',
    rewards: { cp: 180, energy: 18, efficiency: 0.08 },
    status: 'draft',
    citations: [
      'Heuristic placeholder — add peer-reviewed sources on publish review',
      'Sophie Leroy — attention residue research (task switching)',
    ],
    researchNote: 'Generated without Gemini — review citations before approve.',
  };
}

function normalizeDraft(raw: any, existingTitles: string[]): AttentionSession {
  const week = isoWeekKey();
  const exerciseType = EXERCISE_TYPES.includes(raw.exerciseType)
    ? (raw.exerciseType as ExerciseType)
    : 'habit_stack';

  let exercise = raw.exercise;
  if (!exercise || exercise.type !== exerciseType) {
    exercise = heuristicDraft(existingTitles).exercise;
    exercise.type = exerciseType;
  }

  const quiz = Array.isArray(raw.quiz) && raw.quiz.length
    ? raw.quiz.slice(0, 4).map((q: any) => ({
        question: String(q.question || 'What is the core insight?'),
        options: Array.isArray(q.options) && q.options.length >= 2
          ? q.options.slice(0, 4).map(String)
          : ['Option A', 'Option B', 'Option C'],
        correctIdx: Number.isFinite(q.correctIdx) ? Number(q.correctIdx) : 0,
        explanation: String(q.explanation || 'Review the session insight.'),
      }))
    : heuristicDraft(existingTitles).quiz;

  return {
    id: `ai_w_${week.replace('-', '').toLowerCase()}_${crypto.randomBytes(3).toString('hex')}`,
    week,
    seriesOrder: 100 + Math.floor(Math.random() * 50),
    title: String(raw.title || 'Weekly Attention Drop').slice(0, 120),
    hook: String(raw.hook || '').slice(0, 500) || heuristicDraft(existingTitles).hook,
    insight: String(raw.insight || '').slice(0, 1200) || heuristicDraft(existingTitles).insight,
    durationMin: Math.min(7, Math.max(4, Number(raw.durationMin) || 5)),
    exerciseType,
    exercise,
    quiz,
    nextHook: String(raw.nextHook || 'Want more? Next week\'s research drop unlocks after approval.'),
    rewards: {
      cp: Number(raw.rewards?.cp) || 180,
      energy: Number(raw.rewards?.energy) || 18,
      efficiency: Number(raw.rewards?.efficiency) || 0.08,
    },
    status: 'draft',
    citations: Array.isArray(raw.citations)
      ? raw.citations.map(String).slice(0, 8)
      : ['Research-assisted draft — verify primary sources'],
    researchNote:
      String(raw.researchNote || 'Research-assisted by Gemini. Human must approve before publish.'),
  };
}

export async function researchWeeklySession(opts?: {
  existingTitles?: string[];
  scienceContext?: string;
}): Promise<AttentionSession> {
  const existingTitles = [
    ...CORE_ATTENTION_SESSIONS.map((s) => s.title),
    ...(opts?.existingTitles || []),
  ];

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return heuristicDraft(existingTitles);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const signalBlock = opts?.scienceContext
      ? `\nCurrent science/tech signals to optionally ground the session (pick ONE as the real-world hook):\n${opts.scienceContext}\n`
      : '';
    const prompt = `You are the Building Culture Attention Intelligence research agent.
Create ONE new 4-7 minute practical, non-spiritual session on attention, neuroplasticity, cognitive control, habits, or decision quality.
Must NOT duplicate these existing titles: ${existingTitles.join(' | ')}
Ground claims in well-known cognitive science (you may cite classic papers/authors by name). No mysticism.
When useful, tie the exercise to one CURRENT science/tech signal so learners practice attention on real emerging knowledge — not abstract only.
${signalBlock}

Respond ONLY with JSON matching:
{
  "title": string,
  "hook": string,
  "insight": string,
  "durationMin": 4-7,
  "exerciseType": one of ${EXERCISE_TYPES.join(', ')},
  "exercise": object with "type" equal to exerciseType and fields appropriate to that type
    (reps_track: skillPrompt,skillPlaceholder,repsRequired,observationPrompt,minObservationLen;
     bias_quiz: questions[{prompt,options,correctIdx,reveal}],journalPrompt,minJournalLen;
     grounding_breath: groundingLabels[5],breathRounds,breathSeconds;
     body_scan: seconds,summaryPrompt,minSummaryLen;
     growth_scale: statements[{text,growthLean}],reframePrompt,minReframeLen,practicePrompt;
     mental_models: models[{name,blurb}],challengePrompt,minAnswerLen;
     habit_stack: cuePrompt,actionPrompt,minLen;
     multiplier_audit: multipliers[5 strings],actionPrompt,minActionLen),
  "quiz": [{question,options[3],correctIdx,explanation}],
  "nextHook": string,
  "rewards": {"cp":number,"energy":number,"efficiency":number},
  "citations": string[],
  "researchNote": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return {
        ...heuristicDraft(existingTitles),
        researchNote: 'Gemini non-JSON; heuristic draft used.',
      };
    }
    const raw = JSON.parse(match[0]);
    return normalizeDraft(raw, existingTitles);
  } catch (err: any) {
    const draft = heuristicDraft(existingTitles);
    draft.researchNote = `Gemini error (${err?.message || 'failed'}); heuristic draft.`;
    return draft;
  }
}
