/**
 * Pure helpers for conversational proof beats (testable without React).
 */

export type ProofBeatDef = {
  id: string;
  prompt: string;
  minLen: number;
  placeholder?: string;
  label?: string;
};

/** First Contribution — space-joined turns for the eval API. */
export function formatFirstContributionJoined(answers: string[]): string {
  return answers.map((a) => a.trim()).filter(Boolean).join(' ');
}

/** Hook Mirror artifact shape expected by Academy verify. */
export function formatHookMirrorJoined(answers: string[]): string {
  return `Hook: ${(answers[0] || '').trim()}\nNotice: ${(answers[1] || '').trim()}\nWhy: ${(answers[2] || '').trim()}`;
}

/** Default dialogue join (newline). */
export function formatDialogueJoined(answers: string[]): string {
  return answers.map((a) => a.trim()).filter(Boolean).join('\n');
}

export function beatsReady(answers: string[], beats: ProofBeatDef[]): boolean {
  return beats.every((b, i) => (answers[i] || '').trim().length >= b.minLen);
}

export function canAdvanceBeat(
  answers: string[],
  beats: ProofBeatDef[],
  turnIndex: number
): boolean {
  const beat = beats[turnIndex];
  if (!beat) return false;
  return (answers[turnIndex] || '').trim().length >= beat.minLen;
}

export function signalStrengthPercent(answers: string[], beats: ProofBeatDef[]): number {
  const totalMin = beats.reduce((s, b) => s + b.minLen, 0);
  if (totalMin <= 0) return 0;
  const filled = answers.reduce((s, a, i) => {
    const need = beats[i]?.minLen || 1;
    return s + Math.min(need, (a || '').trim().length);
  }, 0);
  return Math.min(100, Math.round((filled / totalMin) * 100));
}

/** Phrases that advance a beat while dictation owns the mic. */
export function isDictationAdvancePhrase(transcript: string): boolean {
  const t = transcript.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return /\b(next|continue|go on|done|ready)\b/.test(t);
}

/** Global Hearing escapes that still work during dictation. */
export function isDictationEscapeCommand(
  cmd: string
): cmd is 'stop' | 'exit' | 'help' | 'repeat' {
  return cmd === 'stop' || cmd === 'exit' || cmd === 'help' || cmd === 'repeat';
}
