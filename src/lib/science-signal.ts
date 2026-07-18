/**
 * Science & Tech Signal Desk — emerging news → knowledge → attention fuel.
 * Grounds Academy + Void in what's actually breaking in science/tech.
 */

import { getGeminiApiKey } from './gemini-key';
import { generateGeminiText, geminiFailureNote } from './gemini-generate';

export type ScienceSignal = {
  id: string;
  title: string;
  summary: string;
  domain: 'ai' | 'bio' | 'quantum' | 'space' | 'energy' | 'neuro' | 'other';
  sourceUrl?: string;
  sourceLabel?: string;
  /** Why this matters for attention / builders */
  attentionLens: string;
  /** Question you'd ask in The Void (nameless) */
  voidPrompt: string;
  /** One-line Academy exercise seed */
  academyHook: string;
  publishedAt?: string;
};

export type SignalDeskPayload = {
  available: boolean;
  fetchedAt: string;
  mode: 'live-research' | 'seeded-pulse';
  signals: ScienceSignal[];
  note: string;
};

/** Rotating seed from live science/tech pulse (refreshed when agent runs). */
const SEEDED: ScienceSignal[] = [
  {
    id: 'sig_kimi_k3',
    title: 'Moonshot unveils Kimi K3 — open-weight model near 3T parameters',
    summary:
      'China’s Moonshot AI showed Kimi K3 (~2.8T params) as an open-weight system aiming at frontier US models, with a planned open release window.',
    domain: 'ai',
    sourceUrl: 'https://www.bbc.co.uk/news/articles/cy9w4q8pgp0o',
    sourceLabel: 'BBC / tech press',
    attentionLens:
      'Open weights change who can audit, fork, and distract themselves — attention is the scarce resource when capability jumps overnight.',
    voidPrompt:
      'If open-weight frontier models keep closing the gap, what capability would you actually trust running on your own hardware — and what would you refuse to host?',
    academyHook: 'Audit one attention leak you feel when a new model drops (doomscroll vs deliberate eval).',
    publishedAt: '2026-07-17',
  },
  {
    id: 'sig_syntnpb',
    title: 'AI-designed SynTnpB enzymes expand the CRISPR toolbox',
    summary:
      'Structure- and evolution-guided AI designs of compact TnpB nucleases outperformed a natural reference in cells — toward editors nature never evolved.',
    domain: 'bio',
    sourceUrl: 'https://phys.org/news/2026-07-aidesigned-geneediting-enzymes-crispr-toolbox.html',
    sourceLabel: 'Phys.org / Science',
    attentionLens:
      'Generative biology compresses decades of trial-and-error — your job is noticing which claims deserve deep focus vs hype.',
    voidPrompt:
      'If AI can invent gene editors that never evolved, where is the line you’d draw for personal use — curiosity, therapy, or never?',
    academyHook: 'Write one bias check: hype headline vs what the paper actually measured.',
    publishedAt: '2026-07-17',
  },
  {
    id: 'sig_quantum_room_temp',
    title: 'Room-temperature quantum metacrystal transports light states',
    summary:
      'LSU physicists report a gold metacrystal that distinguishes and transports quantum states of light without cryogenic cooling.',
    domain: 'quantum',
    sourceUrl:
      'https://www.technologynetworks.com/tn/news/physicists-create-worlds-first-room-temperature-quantum-material-414763',
    sourceLabel: 'Technology Networks / Nature',
    attentionLens:
      'When “impossible until cooled” becomes room-temp, builders must update mental models — residue from old assumptions is attention debt.',
    voidPrompt:
      'What quantum or crypto assumption are you still carrying that might already be obsolete — and why haven’t you stress-tested it?',
    academyHook: 'Name one outdated mental model you still use when reading quantum/AI headlines.',
    publishedAt: '2026-07-17',
  },
  {
    id: 'sig_bci_speech',
    title: 'AI speech neuroprosthesis restores voice for ALS patient',
    summary:
      'Intracortical BCI + dual-stage AI decoding achieved real-time synthetic speech with very high word accuracy and conversational latency.',
    domain: 'neuro',
    sourceUrl: 'https://neurosciencenews.com/ai-speech-neuroprosthesis-als-31072/',
    sourceLabel: 'Neuroscience News',
    attentionLens:
      'Brain→speech interfaces make intention the interface — attention training is literally the control surface.',
    voidPrompt:
      'If a BCI could speak your inner draft before you edit it, what part of your mind would you want gated — and what would you never outsource?',
    academyHook: 'Practice a 60s intention→words delay: think, then speak only the cleaned line.',
    publishedAt: '2026-07-17',
  },
];

let cache: { at: number; payload: SignalDeskPayload; ttlMs: number } | null = null;
const CACHE_MS = 6 * 60 * 60 * 1000;
/** Retry sooner when Gemini quota/API fails */
const FAIL_CACHE_MS = 15 * 60 * 1000;

function seededPayload(note?: string): SignalDeskPayload {
  return {
    available: true,
    fetchedAt: new Date().toISOString(),
    mode: 'seeded-pulse',
    signals: SEEDED,
    note:
      note ||
      'Seeded science/tech pulse — Gemini enrich when GEMINI_API_KEY is set. Signals feed Academy + The Void.',
  };
}

export async function getScienceSignalDesk(opts?: { force?: boolean }): Promise<SignalDeskPayload> {
  if (!opts?.force && cache && Date.now() - cache.at < cache.ttlMs) {
    return cache.payload;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const payload = seededPayload();
    cache = { at: Date.now(), payload, ttlMs: CACHE_MS };
    return payload;
  }

  try {
    const seedTitles = SEEDED.map((s) => `- ${s.title}`).join('\n');
    const prompt = `You are Building Culture's Science Signal Desk.
Given these CURRENT science/tech headlines (July 2026 context), produce attention-training lenses for builders/learners.

Headlines:
${seedTitles}

Respond ONLY with JSON:
{
  "signals": [
    {
      "id": "short_snake_id",
      "title": string,
      "summary": string (2 sentences max),
      "domain": "ai"|"bio"|"quantum"|"space"|"energy"|"neuro"|"other",
      "attentionLens": "why this matters for attention/knowledge quality",
      "voidPrompt": "one courageous anonymous question a learner might ask",
      "academyHook": "one practical 1-line practice"
    }
  ],
  "note": string
}
Return 4 signals matching the headlines. No mysticism. Ground in the news.`;

    const { text, model } = await generateGeminiText(prompt);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      const payload = seededPayload('Gemini non-JSON; using seeded pulse.');
      cache = { at: Date.now(), payload, ttlMs: FAIL_CACHE_MS };
      return payload;
    }
    const raw = JSON.parse(match[0]);
    const enriched: ScienceSignal[] = SEEDED.map((seed, i) => {
      const g = Array.isArray(raw.signals) ? raw.signals[i] : null;
      if (!g) return seed;
      return {
        ...seed,
        summary: String(g.summary || seed.summary).slice(0, 500),
        attentionLens: String(g.attentionLens || seed.attentionLens).slice(0, 400),
        voidPrompt: String(g.voidPrompt || seed.voidPrompt).slice(0, 400),
        academyHook: String(g.academyHook || seed.academyHook).slice(0, 240),
        domain: seed.domain,
      };
    });
    const payload: SignalDeskPayload = {
      available: true,
      fetchedAt: new Date().toISOString(),
      mode: 'live-research',
      signals: enriched,
      note: String(
        raw.note || `Live research lenses (${model}) on current science/tech signals.`
      ),
    };
    cache = { at: Date.now(), payload, ttlMs: CACHE_MS };
    return payload;
  } catch (e: unknown) {
    const payload = seededPayload(`${geminiFailureNote(e)} Seeded pulse.`);
    cache = { at: Date.now(), payload, ttlMs: FAIL_CACHE_MS };
    return payload;
  }
}

/** For curriculum agent — compress desk into prompt context. */
export function signalDeskAsContext(desk: SignalDeskPayload): string {
  return desk.signals
    .map((s) => `[${s.domain}] ${s.title} — ${s.attentionLens}`)
    .join('\n');
}
