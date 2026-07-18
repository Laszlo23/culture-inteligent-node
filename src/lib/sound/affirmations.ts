/**
 * Transparent positive affirmations for the optional vibe layer.
 * Spoken softly via speechSynthesis — never hidden; user must opt in.
 */

export const POSITIVE_AFFIRMATIONS = [
  'You choose knowledge first.',
  'Your attention is a gift.',
  'Calm focus feels good.',
  'You are learning with ease.',
  'Curiosity opens the door.',
  'Rest and return stronger.',
  'You belong in this circle.',
  'Small sparks become light.',
  'Mind and machine can be friends.',
  'Today you notice what matters.',
] as const;

export function nextAffirmation(previous?: string): string {
  const pool = POSITIVE_AFFIRMATIONS as readonly string[];
  if (pool.length === 0) return 'You are present.';
  let pick = pool[Math.floor(Math.random() * pool.length)] ?? 'You are present.';
  if (previous && pool.length > 1) {
    let guard = 0;
    while (pick === previous && guard < 6) {
      pick = pool[Math.floor(Math.random() * pool.length)] ?? pick;
      guard += 1;
    }
  }
  return pick;
}
