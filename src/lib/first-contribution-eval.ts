/**
 * Evaluate first-contribution reflection for curiosity / creativity / reflection.
 */

import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './gemini-key';
import type { ContributionDims } from './first-contribution';

export type FirstContributionEvalResult = {
  dims: ContributionDims;
  coachLine: string;
  model: string;
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Heuristic when Gemini is unavailable — length + reflective language. */
export function heuristicFirstContributionEval(answer: string): FirstContributionEvalResult {
  const text = answer.trim();
  const len = text.length;
  const words = text.split(/\s+/).filter(Boolean).length;

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

  return {
    dims: { curiosity, creativity, reflection },
    coachLine:
      len >= 80
        ? 'Clear signal — your curiosity shows. Keep proving what you learn.'
        : 'A start. Say more next time — depth raises your Human Value.',
    model: 'heuristic-v1',
  };
}

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
    };
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return heuristicFirstContributionEval(answer);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You score a Human Passport first contribution for Building Culture.
Prompt: ${input.prompt}
Answer:
${answer.slice(0, 3000)}

Score 0-100 for:
- curiosity: genuine desire to understand / learn
- creativity: original framing or making
- reflection: self-awareness and depth

Respond ONLY JSON:
{"curiosity":0-100,"creativity":0-100,"reflection":0-100,"coachLine":"one encouraging sentence under 120 chars"}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const text = response.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return heuristicFirstContributionEval(answer);
    const parsed = JSON.parse(match[0]) as {
      curiosity?: number;
      creativity?: number;
      reflection?: number;
      coachLine?: string;
    };
    return {
      dims: {
        curiosity: clamp(Number(parsed.curiosity) || 0),
        creativity: clamp(Number(parsed.creativity) || 0),
        reflection: clamp(Number(parsed.reflection) || 0),
      },
      coachLine:
        typeof parsed.coachLine === 'string' && parsed.coachLine.trim()
          ? parsed.coachLine.trim().slice(0, 160)
          : 'Measured. Your Human Passport is starting.',
      model: 'gemini-2.0-flash',
    };
  } catch {
    return heuristicFirstContributionEval(answer);
  }
}
