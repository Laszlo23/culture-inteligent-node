/**
 * Resolve Gemini / Generative Language API key from env.
 * Supports GEMINI_API_KEY (docs) and GENERATIVE_AI_API_KEY (local alias).
 */

const PLACEHOLDERS = new Set(['', 'MY_GEMINI_API_KEY', 'replace-me', 'your-key-here']);

export function getGeminiApiKey(): string | null {
  const raw =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    '';
  if (!raw || PLACEHOLDERS.has(raw)) return null;
  return raw;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(getGeminiApiKey());
}
