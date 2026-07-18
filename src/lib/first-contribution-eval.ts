/**
 * Evaluate first-contribution reflection for curiosity / creativity / reflection.
 */

import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './gemini-key';
import type { ContributionDims } from './first-contribution';

export type FirstContributionEvalResult = {
  dims: ContributionDims;
  /** Personalized feedback — should reference something specific they wrote */
  coachLine: string;
  model: string;
  /** true when Gemini (or server) scored; false for local heuristic */
  live: boolean;
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

const GEMINI_SCORE_MODELS = [
  process.env.PASSPORT_GEMINI_MODEL?.trim(),
  'gemini-flash-latest',
  'gemini-2.0-flash',
].filter(Boolean) as string[];

/** Pull a short quote from their answer for offline coach lines. */
function quoteSnippet(answer: string, max = 72): string {
  const clean = answer.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Heuristic when Gemini is unavailable — length + reflective language + quote. */
export function heuristicFirstContributionEval(answer: string): FirstContributionEvalResult {
  const text = answer.trim();
  const len = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;
  const snippet = quoteSnippet(text);

  const curiosityHints =
    /(why|how|wonder|curious|question|learn|discover|realize|perspective|changed)/i.test(text)
      ? 18
      : 0;
  const creativityHints =
    /(creat|build|design|idea|imagin|invent|make|wrote|art|novel)/i.test(text) ? 16 : 0;
  const reflectionHints =
    /(feel|notice|reflect|because|meant|understood|grew|before|after|honest)/i.test(text)
      ? 16
      : 0;

  const base = Math.min(55, 12 + Math.floor(len / 12) + Math.min(20, words));
  const curiosity = clamp(base + curiosityHints + (words >= 20 ? 8 : 0));
  const creativity = clamp(base * 0.85 + creativityHints);
  const reflection = clamp(base * 0.75 + reflectionHints + (len >= 80 ? 10 : 0));

  let focus = 'reflection';
  if (curiosity >= creativity && curiosity >= reflection) focus = 'curiosity';
  else if (creativity >= reflection) focus = 'creativity';

  const coachLine =
    len >= 80
      ? `You wrote about “${snippet}” — that reads as ${focus}. Push the other two axes next to lift Human Value.`
      : `A start around “${snippet}”. Say more — depth in curiosity, creativity, and reflection raises your score.`;

  return {
    dims: { curiosity, creativity, reflection },
    coachLine,
    model: 'heuristic-v1',
    live: false,
  };
}

/** Server-side Gemini score (Node only — never ship the key to the browser). */
export async function evaluateFirstContribution(input: {
  prompt: string;
  answer: string;
}): Promise<FirstContributionEvalResult> {
  const answer = input.answer.trim();
  if (answer.length < 40) {
    return {
      dims: { curiosity: 6, creativity: 4, reflection: 3 },
      coachLine: 'Write a bit more — we need a real contribution to measure.',
      model: 'heuristic-short',
      live: false,
    };
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return heuristicFirstContributionEval(answer);
  }

  const prompt = `You are the Building Culture Human Passport coach.
A person answered a first-contribution prompt. Score honestly and give SPECIFIC feedback.

Prompt: ${input.prompt}
Answer:
${answer.slice(0, 3000)}

Score 0-100 for:
- curiosity: genuine desire to understand / learn
- creativity: original framing, making, or novel connection
- reflection: self-awareness and depth about what changed

coachLine rules:
- 1–2 sentences, under 220 characters
- Quote or paraphrase one concrete detail from THEIR answer (not generic praise)
- Name what to strengthen next (curiosity, creativity, or reflection)
- Warm, direct, no emojis, no crypto jargon

Respond ONLY JSON:
{"curiosity":0-100,"creativity":0-100,"reflection":0-100,"coachLine":"..."}`;

  const ai = new GoogleGenAI({ apiKey });
  let lastErr: unknown;
  for (const model of GEMINI_SCORE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      const text = response.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) continue;
      const parsed = JSON.parse(match[0]) as {
        curiosity?: number;
        creativity?: number;
        reflection?: number;
        coachLine?: string;
      };
      const coach =
        typeof parsed.coachLine === 'string' && parsed.coachLine.trim()
          ? parsed.coachLine.trim().slice(0, 240)
          : 'Measured. Your Human Passport is starting.';
      return {
        dims: {
          curiosity: clamp(Number(parsed.curiosity) || 0),
          creativity: clamp(Number(parsed.creativity) || 0),
          reflection: clamp(Number(parsed.reflection) || 0),
        },
        coachLine: coach,
        model,
        live: true,
      };
    } catch (err) {
      lastErr = err;
      console.warn(
        '[first-contribution] gemini model failed',
        model,
        err instanceof Error ? err.message.slice(0, 180) : err
      );
    }
  }
  console.warn(
    '[first-contribution] falling back to heuristic',
    lastErr instanceof Error ? lastErr.message.slice(0, 180) : lastErr
  );
  return heuristicFirstContributionEval(answer);
}

/** Browser-safe: call server so Gemini key stays on the host. */
export async function evaluateFirstContributionViaApi(input: {
  prompt: string;
  answer: string;
}): Promise<FirstContributionEvalResult> {
  try {
    const response = await fetch('/api/passport/first-contribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: input.prompt,
        answer: input.answer,
      }),
    });
    if (!response.ok) {
      return heuristicFirstContributionEval(input.answer);
    }
    const data = (await response.json()) as Partial<FirstContributionEvalResult> & {
      error?: string;
    };
    if (
      !data.dims ||
      typeof data.dims.curiosity !== 'number' ||
      typeof data.coachLine !== 'string'
    ) {
      return heuristicFirstContributionEval(input.answer);
    }
    return {
      dims: {
        curiosity: clamp(data.dims.curiosity),
        creativity: clamp(data.dims.creativity),
        reflection: clamp(data.dims.reflection),
      },
      coachLine: data.coachLine.slice(0, 240),
      model: typeof data.model === 'string' ? data.model : 'server',
      live: data.live !== false && !String(data.model || '').startsWith('heuristic'),
    };
  } catch {
    return heuristicFirstContributionEval(input.answer);
  }
}
