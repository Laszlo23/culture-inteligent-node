/**
 * Shared Gemini text generate with model fallback.
 * Free-tier often blocks gemini-2.0-flash (limit: 0) — try flash-latest / 2.5 first.
 */

import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey } from './gemini-key';

export const GEMINI_TEXT_MODELS = [
  process.env.GEMINI_TEXT_MODEL?.trim(),
  process.env.PASSPORT_GEMINI_MODEL?.trim(),
  process.env.ATTENTION_GEMINI_MODEL?.trim(),
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
].filter(Boolean) as string[];

export type GeminiTextResult = {
  text: string;
  model: string;
};

/** Short, UI-safe reason when all models fail (no raw JSON dumps). */
export function geminiFailureNote(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : (() => {
            try {
              return JSON.stringify(err);
            } catch {
              return 'error';
            }
          })();
  const lower = raw.toLowerCase();
  if (
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate-limit') ||
    lower.includes('rate limit') ||
    lower.includes('429')
  ) {
    return 'Gemini free-tier quota exhausted — retry later or enable billing; using offline fallback.';
  }
  if (lower.includes('api key') || lower.includes('permission') || lower.includes('401')) {
    return 'Gemini API key missing or invalid — using offline fallback.';
  }
  return `Gemini unavailable — using offline fallback.`;
}

/**
 * Try models in order until one returns text.
 * Throws last error if every model fails (caller should fall back).
 */
export async function generateGeminiText(contents: string): Promise<GeminiTextResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing');
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastErr: unknown;
  for (const model of GEMINI_TEXT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });
      const text = response.text || '';
      if (!text.trim()) {
        lastErr = new Error(`Empty response from ${model}`);
        continue;
      }
      return { text, model };
    } catch (err) {
      lastErr = err;
      console.warn(
        '[gemini] model failed',
        model,
        err instanceof Error ? err.message.slice(0, 160) : err
      );
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr || 'Gemini failed'));
}
