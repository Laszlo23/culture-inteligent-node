/**
 * Attention Intelligence curriculum — typed catalog for Culture Node Academy.
 */

export type ExerciseType =
  | 'reps_track'
  | 'bias_quiz'
  | 'grounding_breath'
  | 'body_scan'
  | 'growth_scale'
  | 'mental_models'
  | 'habit_stack'
  | 'multiplier_audit'
  | 'hook_mirror';

export type SessionStatus = 'core' | 'draft' | 'published';

export interface SessionQuizItem {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

export interface SessionRewards {
  cp: number;
  energy: number;
  efficiency: number;
}

export interface RepsTrackExercise {
  type: 'reps_track';
  skillPrompt: string;
  skillPlaceholder: string;
  repsRequired: number;
  observationPrompt: string;
  minObservationLen: number;
}

export interface BiasQuizExercise {
  type: 'bias_quiz';
  questions: Array<{
    prompt: string;
    options: string[];
    correctIdx: number;
    reveal: string;
  }>;
  journalPrompt: string;
  minJournalLen: number;
}

export interface GroundingBreathExercise {
  type: 'grounding_breath';
  groundingLabels: [string, string, string, string, string];
  breathRounds: number;
  breathSeconds: number;
}

export interface BodyScanExercise {
  type: 'body_scan';
  seconds: number;
  summaryPrompt: string;
  minSummaryLen: number;
}

export interface GrowthScaleExercise {
  type: 'growth_scale';
  statements: Array<{ text: string; growthLean: boolean }>;
  reframePrompt: string;
  minReframeLen: number;
  practicePrompt: string;
}

export interface MentalModelsExercise {
  type: 'mental_models';
  models: Array<{ name: string; blurb: string }>;
  challengePrompt: string;
  minAnswerLen: number;
}

export interface HabitStackExercise {
  type: 'habit_stack';
  cuePrompt: string;
  actionPrompt: string;
  minLen: number;
}

export interface MultiplierAuditExercise {
  type: 'multiplier_audit';
  multipliers: string[];
  actionPrompt: string;
  minActionLen: number;
}

/** Proof of Hook Awareness — name the bait, the catch, why you stay. */
export interface HookMirrorExercise {
  type: 'hook_mirror';
  hookPrompt: string;
  noticePrompt: string;
  whyPrompt: string;
  minLen: number;
}

export type SessionExercise =
  | RepsTrackExercise
  | BiasQuizExercise
  | GroundingBreathExercise
  | BodyScanExercise
  | GrowthScaleExercise
  | MentalModelsExercise
  | HabitStackExercise
  | MultiplierAuditExercise
  | HookMirrorExercise;

/** Soft Academy lane — biases order via growth path; never drops a session. */
export type SessionLane = 'science' | 'reflection' | 'both';

export interface AttentionSession {
  id: string;
  week?: string;
  seriesOrder: number;
  title: string;
  hook: string;
  insight: string;
  durationMin: number;
  exerciseType: ExerciseType;
  exercise: SessionExercise;
  quiz: SessionQuizItem[];
  nextHook: string;
  rewards: SessionRewards;
  status: SessionStatus;
  /** Science vs reflection bias for personal growth paths */
  lane?: SessionLane;
  citations?: string[];
  researchNote?: string;
}

export function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * First Spark — short (~2 min) ritual for cold-start skeptics.
 * Not part of the numbered core series; prepended for first-timers.
 */
export const FIRST_SPARK_SESSION: AttentionSession = {
  id: 'ai_first_spark',
  seriesOrder: 0,
  title: 'First Spark — Prove Attention Moves Fuel',
  hook: 'We\'re here for attention — not empty hashes. Pass a short snap (~2 min) and watch knowledge become node fuel.',
  insight:
    'Proof of Attention is the product: focused questions + a short artifact beat empty hashes. Your score crosses a confidential threshold (Arcium mirror) — then energy lands on your node. Attention first. Everything else is optional depth.',
  durationMin: 2,
  lane: 'both',
  exerciseType: 'bias_quiz',
  exercise: {
    type: 'bias_quiz',
    questions: [
      {
        prompt: 'Empty hash mining asks machines to burn power. Culture Node asks you to…',
        options: [
          'Spend focused attention that becomes verifiable fuel',
          'Buy PH/s and hope the dashboard fills',
          'Skip learning and mint tokens first',
        ],
        correctIdx: 0,
        reveal: 'Attention in → energy out. That\'s the claim you\'re testing.',
      },
      {
        prompt: 'A Devnet demo means…',
        options: [
          'No mainnet money at risk — you\'re testing the loop',
          'Your energy is already real USD',
          'You must connect Phantom or nothing works',
        ],
        correctIdx: 0,
        reveal: 'Honesty first: prove the loop, then decide if it\'s real for you.',
      },
    ],
    journalPrompt: 'One line: what would convince you that focused attention (not empty hashes) really moves fuel?',
    minJournalLen: 8,
  },
  quiz: [
    {
      question: 'What fuels your Culture Node?',
      options: [
        'Proof of Attention from focused learning',
        'Empty GPU hashes alone',
        'Buying NFTs without learning',
      ],
      correctIdx: 0,
      explanation: 'Learning → verified attention → energy. That\'s the spark.',
    },
    {
      question: 'After this snap you should…',
      options: [
        'Watch energy surge, then explore the map',
        'Ignore fuel and open DEX first',
        'Reset the wallet immediately',
      ],
      correctIdx: 0,
      explanation: 'Proof accepted → node fueled → map unlocks.',
    },
  ],
  nextHook: 'Spark lit. Next: Hook Mirror — prove you see why you scroll again.',
  rewards: { cp: 40, energy: 18, efficiency: 0.03 },
  status: 'core',
};

/**
 * Hook Mirror — Proof of Hook Awareness (~3 min).
 * After First Spark: name what hooks you, what you notice when doomscrolling returns, why you keep going.
 */
export const HOOK_MIRROR_SESSION: AttentionSession = {
  id: 'ai_hook_mirror',
  seriesOrder: 0.5,
  title: 'Hook Mirror — Why You Scroll Again',
  hook: 'You already know the feed is a trap. The proof is what happens the second you notice — and keep going anyway.',
  insight:
    'Doomscrolling is not a mystery of willpower. It is a loop: bait → relief → return. The moment you catch yourself ("I\'m doing it again") is where attention becomes yours — or where the curve takes you. Name the bait. Name the notice. Name why you stay. That honesty is Proof of Hook Awareness. Then Zen: hold the knowledge, or convert it to fuel.',
  durationMin: 3,
  lane: 'reflection',
  exerciseType: 'hook_mirror',
  exercise: {
    type: 'hook_mirror',
    hookPrompt: 'What hooks you? Name the bait (app, vibe, fear, boredom — be specific).',
    noticePrompt:
      'When you catch yourself doomscrolling again, what do you notice first — body, excuse, or the next thumb swipe?',
    whyPrompt:
      'Why do you keep going even when you understand? One honest line. No performance.',
    minLen: 8,
  },
  quiz: [
    {
      question: 'Proof of Hook Awareness means…',
      options: [
        'You named the bait, the notice, and why you stay — then chose',
        'You deleted every app forever',
        'You mined empty hashes until the feed felt quiet',
      ],
      correctIdx: 0,
      explanation: 'Seeing the loop clearly is the proof. Choice comes after.',
    },
    {
      question: 'The failure curve wants you to…',
      options: [
        'Scroll without noticing, then feel ashamed without changing',
        'Sit with knowledge and decide Mind or Machine',
        'Buy more PH/s so you never feel the hook',
      ],
      correctIdx: 0,
      explanation: 'Their curve is optional. Notice → name → decide.',
    },
  ],
  nextHook: 'Mirror held. Core series mines deeper Attention Intelligence when you are ready.',
  rewards: { cp: 35, energy: 14, efficiency: 0.02 },
  status: 'core',
};

/** Core series — Sessions 1–8 (Mining Attention Intelligence). */
export const CORE_ATTENTION_SESSIONS: AttentionSession[] = [
  {
    id: 'ai_s01',
    seriesOrder: 1,
    title: 'Neuroplasticity — Your Brain Isn\'t Fixed',
    hook: 'What if everything you were told about "being smart" or "too old to change" was wrong? Your brain physically rewires itself with every deliberate choice — no cap on potential.',
    insight:
      'Neuroplasticity means repetition builds stronger neural pathways, while unused ones prune. London taxi drivers grew bigger memory-related brain areas from "The Knowledge." Adults learning juggling showed gray matter changes in months. Intelligence isn\'t set — it\'s like a muscle.',
    durationMin: 5,
    lane: 'science',
    exerciseType: 'reps_track',
    exercise: {
      type: 'reps_track',
      skillPrompt: 'Pick one small skill to mine (e.g. navigate without GPS, learn 5 new words).',
      skillPlaceholder: 'e.g. Navigate 5 blocks without GPS',
      repsRequired: 15,
      observationPrompt: 'Track one before/after observation after your reps.',
      minObservationLen: 8,
    },
    quiz: [
      {
        question: 'What does neuroplasticity refer to?',
        options: [
          'The brain\'s ability to reorganize and forge new pathways through learning',
          'A fixed IQ score set at birth',
          'Only childhood brain growth',
        ],
        correctIdx: 0,
        explanation: 'Repetition and deliberate practice physically rewire adult brains.',
      },
      {
        question: 'Unused neural pathways tend to…',
        options: ['Stay forever at full strength', 'Prune over time', 'Convert into muscle'],
        correctIdx: 1,
        explanation: 'Use it or lose it — pruning frees capacity for practiced skills.',
      },
    ],
    nextHook: 'Next: How to direct this rewiring for focus in distracted environments.',
    rewards: { cp: 100, energy: 10, efficiency: 0.05 },
    status: 'core',
  },
  {
    id: 'ai_s02',
    seriesOrder: 2,
    title: 'Cognitive Biases — Why Your Brain Lies to You',
    hook: 'You think you\'re rational. Most "smart" people overestimate themselves hardest (Dunning-Kruger). Mine your blind spots.',
    insight:
      'Biases like confirmation, anchoring, and optimism are built-in shortcuts. Awareness lets you mine better decisions. Schools skip this; it explains most poor choices.',
    durationMin: 6,
    lane: 'science',
    exerciseType: 'bias_quiz',
    exercise: {
      type: 'bias_quiz',
      questions: [
        {
          prompt: 'A bat and ball cost $1.10. The bat costs $1 more than the ball. How much is the ball?',
          options: ['10¢', '5¢', '15¢'],
          correctIdx: 1,
          reveal: 'Intuitive 10¢ is wrong. Ball = 5¢, bat = $1.05.',
        },
        {
          prompt: 'If 5 machines make 5 widgets in 5 minutes, how long for 100 machines to make 100 widgets?',
          options: ['100 min', '5 min', '20 min'],
          correctIdx: 1,
          reveal: 'Each machine still takes 5 minutes per widget — answer is 5 min.',
        },
        {
          prompt: 'Confirmation bias means you…',
          options: [
            'Only seek info that supports your view',
            'Always change opinions instantly',
            'Ignore all prior beliefs',
          ],
          correctIdx: 0,
          reveal: 'Seeking only confirming evidence is the classic trap.',
        },
      ],
      journalPrompt: 'Journal one bias you spotted today and one counter (e.g. seek disconfirming evidence).',
      minJournalLen: 8,
    },
    quiz: [
      {
        question: 'Dunning-Kruger roughly describes…',
        options: [
          'Overconfidence when skill is low',
          'Perfect calibration of self-knowledge',
          'Only financial risk bias',
        ],
        correctIdx: 0,
        explanation: 'Low skill + high confidence is a classic metacognitive blind spot.',
      },
    ],
    nextHook: 'Want more? Full bias labs or team quizzes for deeper mining.',
    rewards: { cp: 150, energy: 15, efficiency: 0.08 },
    status: 'core',
  },
  {
    id: 'ai_s03',
    seriesOrder: 3,
    title: 'Attention Control in the AI Age',
    hook: 'Social media trained your brain for ~47-second focus. AI amplifies it. Reclaim it, and you mine exponential value others lose.',
    insight:
      'Attention isn\'t infinite — it\'s the scarcest resource. Platforms exploit emotional triggers; you can train deliberate focus with batching and cognitive outsourcing (write intrusive thoughts down).',
    durationMin: 5,
    lane: 'reflection',
    exerciseType: 'grounding_breath',
    exercise: {
      type: 'grounding_breath',
      groundingLabels: [
        '5 things you see',
        '4 you feel',
        '3 you hear',
        '2 you smell',
        '1 you taste',
      ],
      breathRounds: 3,
      breathSeconds: 4,
    },
    quiz: [
      {
        question: 'Box breathing primarily helps by…',
        options: [
          'Stabilizing arousal so prefrontal control returns',
          'Increasing multitasking bandwidth',
          'Deleting long-term memories',
        ],
        correctIdx: 0,
        explanation: 'Equal-ratio breath downregulates fight-or-flight noise.',
      },
    ],
    nextHook: 'Token tip: use sessions to mine daily streaks — reward focus with community challenges.',
    rewards: { cp: 200, energy: 20, efficiency: 0.1 },
    status: 'core',
  },
  {
    id: 'ai_s04',
    seriesOrder: 4,
    title: 'Inner Look Without Woo — Practical Self-Awareness',
    hook: 'Looking inside isn\'t fluffy — it\'s high-ROI engineering for your mind. Most suffering comes from interpretation, not events.',
    insight:
      'Observer mode separates impulse from choice — gold for attention mining in noisy worlds. Name sensation/emotion, redirect once, repeat.',
    durationMin: 4,
    lane: 'reflection',
    exerciseType: 'body_scan',
    exercise: {
      type: 'body_scan',
      seconds: 60,
      summaryPrompt: 'Name one emotion/thought you noticed, then how you redirected once.',
      minSummaryLen: 8,
    },
    quiz: [
      {
        question: 'Practical self-awareness is most like…',
        options: [
          'Telemetry monitoring active processes',
          'Deleting all emotions permanently',
          'Ignoring body signals',
        ],
        correctIdx: 0,
        explanation: 'You observe without fusing with every impulse.',
      },
    ],
    nextHook: 'Next: Growth mindset — intelligence is trainable.',
    rewards: { cp: 250, energy: 25, efficiency: 0.12 },
    status: 'core',
  },
  {
    id: 'ai_s05',
    seriesOrder: 5,
    title: 'Growth Mindset — Intelligence Is Trainable',
    hook: 'Schools often sell the lie that talent is fixed at birth. Science proves the opposite: believing you can grow changes everything.',
    insight:
      'Carol Dweck\'s research: a growth mindset (skills improve with effort) builds resilience and learning. Neuroplasticity makes this literal — effort builds pathways.',
    durationMin: 5,
    lane: 'science',
    exerciseType: 'growth_scale',
    exercise: {
      type: 'growth_scale',
      statements: [
        { text: 'My intelligence is something very basic about me that I can\'t change much.', growthLean: false },
        { text: 'No matter how much intelligence I have, I can always change it quite a bit.', growthLean: true },
        { text: 'The harder I work at something, the better I\'ll be.', growthLean: true },
        { text: 'I like taking on challenges because they help me grow.', growthLean: true },
      ],
      reframePrompt: 'Spot a fixed thought today? Reframe it (e.g. "This is hard now, but effort rewires me.").',
      minReframeLen: 8,
      practicePrompt: 'Name one skill you\'re "not good at" to practice for 5 focused minutes.',
    },
    quiz: [
      {
        question: 'A growth mindset claims…',
        options: [
          'Abilities can improve with effort and strategy',
          'Talent is 100% genetic and frozen',
          'Practice never changes the brain',
        ],
        correctIdx: 0,
        explanation: 'Belief + deliberate practice compounds with plasticity.',
      },
    ],
    nextHook: 'Next: Mental models to turn awareness into sharper decisions.',
    rewards: { cp: 220, energy: 22, efficiency: 0.1 },
    status: 'core',
  },
  {
    id: 'ai_s06',
    seriesOrder: 6,
    title: 'Mental Models — Simple Tools for Better Mining',
    hook: 'Complex problems don\'t need complex solutions. A few mental models let you mine clearer thinking and avoid common traps.',
    insight:
      'First principles, inversion, and second-order thinking reduce errors. They\'re brain hacks that compound Attention Intelligence.',
    durationMin: 6,
    lane: 'science',
    exerciseType: 'mental_models',
    exercise: {
      type: 'mental_models',
      models: [
        {
          name: 'First Principles',
          blurb: 'Break to fundamentals. Ignore "best practices." Ask: What are the core truths here?',
        },
        {
          name: 'Inversion',
          blurb: 'Ask "What would guarantee failure?" then avoid it.',
        },
        {
          name: 'Second-Order Thinking',
          blurb: 'What happens after the first result? Short-term win vs long-term cost.',
        },
      ],
      challengePrompt:
        'Apply inversion to one current challenge (e.g. distraction during focus). List 3 failure modes and one prevention.',
      minAnswerLen: 20,
    },
    quiz: [
      {
        question: 'Inversion asks…',
        options: [
          'What would guarantee failure — then avoid it',
          'Only how to succeed faster with hype',
          'How to copy competitors blindly',
        ],
        correctIdx: 0,
        explanation: 'Avoiding failure modes is often clearer than chasing success slogans.',
      },
    ],
    nextHook: 'Want more? How repetition physically builds habits that make these automatic.',
    rewards: { cp: 240, energy: 24, efficiency: 0.11 },
    status: 'core',
  },
  {
    id: 'ai_s07',
    seriesOrder: 7,
    title: 'Habit Formation — Rewiring Through Repetition',
    hook: 'Habits aren\'t willpower wars. They\'re neural pathways your brain chunks for efficiency. Mine them deliberately.',
    insight:
      'Cue → craving/routine → reward. Repetition strengthens basal ganglia chunking. Small consistent actions beat motivation alone. Make good cues obvious, bad ones invisible.',
    durationMin: 5,
    lane: 'science',
    exerciseType: 'habit_stack',
    exercise: {
      type: 'habit_stack',
      cuePrompt: 'Existing habit cue (e.g. morning coffee)…',
      actionPrompt: 'Tiny new action after that cue (e.g. 1 min breath focus)…',
      minLen: 4,
    },
    quiz: [
      {
        question: 'Habit stacking means…',
        options: [
          'Attach a new tiny action to an existing cue',
          'Wait for perfect motivation every day',
          'Change 20 habits at once',
        ],
        correctIdx: 0,
        explanation: 'Existing cues make new loops stick faster.',
      },
    ],
    nextHook: 'Want more? Inner signals — how to read your own mind for sustained focus.',
    rewards: { cp: 230, energy: 23, efficiency: 0.1 },
    status: 'core',
  },
  {
    id: 'ai_s08',
    seriesOrder: 8,
    title: 'The 5 Big Multipliers — Where to Mine First',
    hook: 'Stop optimizing tiny decisions. Focus on the 5 multipliers that shape everything else.',
    insight:
      'Work, place/environment, habits, people, and inner conversations compound. Get these right via plasticity and models — Attention Intelligence at scale.',
    durationMin: 5,
    lane: 'science',
    exerciseType: 'multiplier_audit',
    exercise: {
      type: 'multiplier_audit',
      multipliers: [
        'Work you do (drains or energizes?)',
        'Place / environment (distractions or focus-enabling?)',
        'Habits you build',
        'People you spend time with',
        'Inner conversations (self-talk)',
      ],
      actionPrompt: 'Pick one multiplier. Rate 1–10 and write one small mining action.',
      minActionLen: 12,
    },
    quiz: [
      {
        question: 'Why prioritize multipliers?',
        options: [
          'They compound and reshape many downstream outcomes',
          'Tiny tweaks always beat structural change',
          'Environment never affects attention',
        ],
        correctIdx: 0,
        explanation: 'Leverage beats micro-optimization theater.',
      },
    ],
    nextHook: 'Series complete — unlock weekly research drops for fresh Attention Intelligence.',
    rewards: { cp: 300, energy: 30, efficiency: 0.15 },
    status: 'core',
  },
];

export function getCoreSessionIds(): string[] {
  return CORE_ATTENTION_SESSIONS.map((s) => s.id);
}

export function mergeCatalog(
  published: AttentionSession[] = []
): AttentionSession[] {
  const byId = new Map<string, AttentionSession>();
  byId.set(FIRST_SPARK_SESSION.id, FIRST_SPARK_SESSION);
  byId.set(HOOK_MIRROR_SESSION.id, HOOK_MIRROR_SESSION);
  for (const s of CORE_ATTENTION_SESSIONS) byId.set(s.id, s);
  for (const s of published) {
    if (s.status === 'published') byId.set(s.id, s);
  }
  return [...byId.values()].sort((a, b) => a.seriesOrder - b.seriesOrder);
}
