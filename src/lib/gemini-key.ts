/**
 * Resolve Gemini / Generative Language API key from env.
 * Supports GEMINI_API_KEY (docs) and GENERATIVE_AI_API_KEY (local alias).
 */

const PLACEHOLDERS = new Set(['', 'MY_GEMINI_API_KEY', 'replace-me', 'your-key-here']);

function readEnv(key: string): string {
  try {
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return String(process.env[key]).trim();
    }
  } catch {
    // ignore — browser has no process
  }
  try {
    const vite = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    if (vite?.[key]) return String(vite[key]).trim();
  } catch {
    // ignore
  }
  return '';
}

export function getGeminiApiKey(): string | null {
  const raw =
    readEnv('GEMINI_API_KEY') ||
    readEnv('GENERATIVE_AI_API_KEY') ||
    readEnv('GOOGLE_API_KEY') ||
    readEnv('VITE_GEMINI_API_KEY') ||
    '';
  if (!raw || PLACEHOLDERS.has(raw)) return null;
  return raw;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(getGeminiApiKey());
}
