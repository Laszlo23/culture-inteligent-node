/**
 * Attention metrics — local event stream for Culture Node.
 * Angel / partner measurement without third-party trackers.
 * Privacy: stays in the browser unless the operator exports a snapshot.
 */

export const ATTENTION_METRICS_KEY = 'culture_attention_metrics_v1';
export const FOCUS_MODE_KEY = 'culture_focus_v1';

const MAX_EVENTS = 500;

export type AttentionEventName =
  | 'hearing_open'
  | 'hearing_exit'
  | 'hearing_command'
  | 'academy_start'
  | 'zen_decision'
  | 'zen_mode_toggle'
  | 'first_spark_complete'
  | 'session_complete'
  | 'spread_copy'
  | 'broadcast_share'
  | 'broadcast_dismiss'
  | 'focus_enter'
  | 'focus_exit'
  | 'neural_snap_start'
  | 'neural_snap_pass'
  | 'neural_snap_fail'
  | 'hook_mirror_complete'
  | 'field_card_claim'
  | 'field_card_trade_intent';

export type AttentionEvent = {
  name: AttentionEventName;
  at: number;
  props?: Record<string, string | number | boolean | null | undefined>;
};

export type AttentionSnapshot = {
  hearingOpens: number;
  hearingCommands: number;
  academyStarts: number;
  zenDecisions: number;
  zenMind: number;
  zenMachine: number;
  firstSparkCompletes: number;
  sessionCompletes: number;
  spreads: number;
  broadcastShares: number;
  focusEnters: number;
  focusMinutesApprox: number;
  neuralSnapPasses: number;
  neuralSnapFails: number;
  hookMirrors: number;
  fieldCardClaims: number;
  fieldCardTradeIntents: number;
  eventsLast7d: number;
  uniqueDaysActive: number;
};

type Store = {
  events: AttentionEvent[];
  focusEnteredAt: number | null;
};

type Listener = () => void;
const listeners = new Set<Listener>();

function emptyStore(): Store {
  return { events: [], focusEnteredAt: null };
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(ATTENTION_METRICS_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      focusEnteredAt:
        typeof parsed.focusEnteredAt === 'number' ? parsed.focusEnteredAt : null,
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store): void {
  try {
    localStorage.setItem(
      ATTENTION_METRICS_KEY,
      JSON.stringify({
        ...store,
        events: store.events.slice(-MAX_EVENTS),
      })
    );
  } catch {
    // ignore quota
  }
}

function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribeAttentionMetrics(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function track(
  name: AttentionEventName,
  props?: AttentionEvent['props']
): void {
  if (typeof window === 'undefined') return;
  const store = readStore();

  if (name === 'focus_enter') {
    store.focusEnteredAt = Date.now();
    store.events.push({ name, at: Date.now(), props });
  } else if (name === 'focus_exit') {
    let minutes = 0;
    if (store.focusEnteredAt) {
      minutes = Math.max(0, (Date.now() - store.focusEnteredAt) / 60_000);
      store.focusEnteredAt = null;
    }
    store.events.push({
      name,
      at: Date.now(),
      props: { ...props, minutes: Math.round(minutes * 10) / 10 },
    });
  } else {
    store.events.push({ name, at: Date.now(), props });
  }

  writeStore(store);
  emit();
}

export function isFocusModeStored(): boolean {
  try {
    return localStorage.getItem(FOCUS_MODE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setFocusModeStored(on: boolean): void {
  try {
    localStorage.setItem(FOCUS_MODE_KEY, on ? '1' : '0');
  } catch {
    // ignore
  }
}

export function getAttentionEvents(sinceMs?: number): AttentionEvent[] {
  const store = readStore();
  if (sinceMs == null) return store.events.slice();
  return store.events.filter((e) => e.at >= sinceMs);
}

export function buildAttentionSnapshot(days = 7): AttentionSnapshot {
  const since = Date.now() - days * 86_400_000;
  const events = getAttentionEvents(since);
  const dayKeys = new Set(
    events.map((e) => new Date(e.at).toISOString().slice(0, 10))
  );

  let focusMinutesApprox = 0;
  for (const e of events) {
    if (e.name === 'focus_exit' && typeof e.props?.minutes === 'number') {
      focusMinutesApprox += e.props.minutes;
    }
  }

  const count = (n: AttentionEventName) => events.filter((e) => e.name === n).length;

  return {
    hearingOpens: count('hearing_open'),
    hearingCommands: count('hearing_command'),
    academyStarts: count('academy_start'),
    zenDecisions: count('zen_decision'),
    zenMind: events.filter(
      (e) => e.name === 'zen_decision' && e.props?.decision === 'hold_knowledge'
    ).length,
    zenMachine: events.filter(
      (e) => e.name === 'zen_decision' && e.props?.decision === 'convert_fuel'
    ).length,
    firstSparkCompletes: count('first_spark_complete'),
    sessionCompletes: count('session_complete'),
    spreads: count('spread_copy'),
    broadcastShares: count('broadcast_share'),
    focusEnters: count('focus_enter'),
    focusMinutesApprox: Math.round(focusMinutesApprox * 10) / 10,
    neuralSnapPasses: count('neural_snap_pass'),
    neuralSnapFails: count('neural_snap_fail'),
    hookMirrors: count('hook_mirror_complete'),
    fieldCardClaims: count('field_card_claim'),
    fieldCardTradeIntents: count('field_card_trade_intent'),
    eventsLast7d: events.length,
    uniqueDaysActive: dayKeys.size,
  };
}

export function formatWeeklySnapshot(
  s: AttentionSnapshot = buildAttentionSnapshot(7)
): string {
  return [
    'Culture Node — Attention snapshot (7d, this browser)',
    '',
    `Active days: ${s.uniqueDaysActive}`,
    `Hearing opens: ${s.hearingOpens} · commands: ${s.hearingCommands}`,
    `Academy starts: ${s.academyStarts}`,
    `Zen decisions: ${s.zenDecisions} (Mind ${s.zenMind} / Machine ${s.zenMachine})`,
    `First Spark completes: ${s.firstSparkCompletes}`,
    `Sessions complete: ${s.sessionCompletes}`,
    `Neural Snap pass/fail: ${s.neuralSnapPasses}/${s.neuralSnapFails}`,
    `Hook Mirrors (Proof of Hook Awareness): ${s.hookMirrors}`,
    `Field Deck claims: ${s.fieldCardClaims} · trade intents: ${s.fieldCardTradeIntents}`,
    `Spreads: ${s.spreads} · Broadcast shares: ${s.broadcastShares}`,
    `Focus enters: ${s.focusEnters} · ~${s.focusMinutesApprox} focus minutes`,
    `Events logged: ${s.eventsLast7d}`,
    '',
    'Privacy: local only. Export when sharing with partners/angels.',
  ].join('\n');
}

export function exportAttentionJson(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      snapshot7d: buildAttentionSnapshot(7),
      snapshot30d: buildAttentionSnapshot(30),
      events: getAttentionEvents(),
    },
    null,
    2
  );
}
