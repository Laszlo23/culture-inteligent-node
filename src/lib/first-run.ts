/**
 * First-run onboarding flags — Knowledge → Energy → Node.
 */

export const STORY_DISMISSED_KEY = 'solana_onboarding_dismissed';
export const FIRST_RITUAL_KEY = 'culture_node_first_ritual_v1';

export type FirstRitualStatus = 'pending' | 'done';

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function isStoryDismissed(): boolean {
  return storage()?.getItem(STORY_DISMISSED_KEY) === 'true';
}

export function dismissStory(): void {
  storage()?.setItem(STORY_DISMISSED_KEY, 'true');
}

export function getFirstRitualStatus(): FirstRitualStatus | null {
  const v = storage()?.getItem(FIRST_RITUAL_KEY);
  if (v === 'pending' || v === 'done') return v;
  return null;
}

export function ensureFirstRitualPending(): void {
  const cur = getFirstRitualStatus();
  if (cur === 'done') return;
  // Returning operators who already finished Academy skip the coach.
  try {
    const raw = storage()?.getItem('kronos_academy_completed');
    const completed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(completed) && completed.length > 0) {
      storage()?.setItem(FIRST_RITUAL_KEY, 'done');
      return;
    }
  } catch {
    // ignore
  }
  storage()?.setItem(FIRST_RITUAL_KEY, 'pending');
}

export function completeFirstRitual(): void {
  storage()?.setItem(FIRST_RITUAL_KEY, 'done');
}

export function isFirstRitualPending(): boolean {
  return getFirstRitualStatus() === 'pending';
}
