/**
 * THE OUTER CIRCUIT — hidden mind-training quest above daily missions.
 * Cryptic, durable, one chapter at a time. Guides players through the whole facility.
 */

export type MetaQuestEvent =
  | 'first_spark'
  | 'academy_session'
  | 'kpi_proof'
  | 'claim_daily'
  | 'hardware_mount'
  | 'duality_swap'
  | 'daily_mission'
  | 'presence'
  | 'explore_room';

export type MetaChapter = {
  id: string;
  /** Cryptic whisper — never reads like a checklist until revealed */
  whisper: string;
  /** Clear reveal after chapter unlocks / completes */
  reveal: string;
  room: string;
  rewardBcc: number;
  rewardEnergy: number;
  /** Which events close this chapter */
  closesOn: MetaQuestEvent[];
};

export const OUTER_CIRCUIT: MetaChapter[] = [
  {
    id: 'ignition',
    whisper: 'Something waits where fuel is still zero…',
    reveal: 'Ignition — First Spark proved attention can move energy.',
    room: 'lab',
    rewardBcc: 40,
    rewardEnergy: 0,
    closesOn: ['first_spark'],
  },
  {
    id: 'second_breath',
    whisper: 'The mentor has a quieter lesson — not the first one.',
    reveal: 'Second Breath — another Academy pass deepened the channel.',
    room: 'lab',
    rewardBcc: 50,
    rewardEnergy: 5,
    closesOn: ['academy_session'],
  },
  {
    id: 'on_chain_pulse',
    whisper: 'The ledger listens when you prove or claim on Devnet.',
    reveal: 'On-Chain Pulse — KPI proof or daily claim sealed the loop.',
    room: 'treasury',
    rewardBcc: 75,
    rewardEnergy: 5,
    closesOn: ['kpi_proof', 'claim_daily'],
  },
  {
    id: 'forge_hand',
    whisper: 'Steel remembers the hands that mount it.',
    reveal: 'Forge Hand — hardware mounted; the node has a body.',
    room: 'workshop',
    rewardBcc: 60,
    rewardEnergy: 0,
    closesOn: ['hardware_mount'],
  },
  {
    id: 'duality_gate',
    whisper: 'Mind and Machine trade places in the vault.',
    reveal: 'Duality Gate — BCC ↔ CGT crystallize touched both poles.',
    room: 'treasury',
    rewardBcc: 80,
    rewardEnergy: 8,
    closesOn: ['duality_swap'],
  },
  {
    id: 'day_signal',
    whisper: 'A small daily signal keeps the circuit warm.',
    reveal: 'Day Signal — a mission completed; practice still counts.',
    room: 'missions',
    rewardBcc: 55,
    rewardEnergy: 5,
    closesOn: ['daily_mission'],
  },
  {
    id: 'named_presence',
    whisper: 'The arena and the profile both want a name.',
    reveal: 'Named Presence — you showed up where others can see you.',
    room: 'profile',
    rewardBcc: 70,
    rewardEnergy: 0,
    closesOn: ['presence'],
  },
];

const STORAGE_KEY = 'culture_outer_circuit_v1';

type Persisted = {
  completed: string[];
  /** Chapters whose completion reward was already granted */
  rewarded: string[];
  discovered: boolean;
  sealed: boolean;
  lastEventAt: number;
  /** Prevent First Spark fuel logs from also closing Second Breath */
  ignitionClosedAt: number;
};

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        completed: [],
        rewarded: [],
        discovered: false,
        sealed: false,
        lastEventAt: 0,
        ignitionClosedAt: 0,
      };
    }
    const p = JSON.parse(raw) as Persisted;
    return {
      completed: Array.isArray(p.completed) ? p.completed : [],
      rewarded: Array.isArray(p.rewarded) ? p.rewarded : [],
      discovered: !!p.discovered,
      sealed: !!p.sealed,
      lastEventAt: Number(p.lastEventAt) || 0,
      ignitionClosedAt: Number(p.ignitionClosedAt) || 0,
    };
  } catch {
    return {
      completed: [],
      rewarded: [],
      discovered: false,
      sealed: false,
      lastEventAt: 0,
      ignitionClosedAt: 0,
    };
  }
}

function save(p: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function bootstrapMetaQuestFromWorld(world: {
  firstRitualDone: boolean;
  academyCompleted: string[];
  hasKpi: boolean;
  hasMountedHardware: boolean;
  hasClaimedDaily: boolean;
  missionsDone: number;
  hasPresence: boolean;
}): void {
  const p = load();
  if (p.sealed) return;
  const mark = (id: string) => {
    if (!p.completed.includes(id)) p.completed.push(id);
  };
  if (world.firstRitualDone || world.academyCompleted.includes('ai_first_spark')) {
    mark('ignition');
    p.discovered = true;
  }
  if (world.academyCompleted.filter((id) => id !== 'ai_first_spark').length >= 1) {
    mark('second_breath');
  }
  if (world.hasKpi || world.hasClaimedDaily) mark('on_chain_pulse');
  if (world.hasMountedHardware) mark('forge_hand');
  // Duality Gate closes only on real BCC↔CGT swap — never on claim alone
  if (world.missionsDone >= 1) mark('day_signal');
  if (world.hasPresence) mark('named_presence');
  if (OUTER_CIRCUIT.every((c) => p.completed.includes(c.id))) {
    p.sealed = true;
  }
  // Don't retro-pay chapters already earned before Outer Circuit existed
  for (const id of p.completed) {
    if (!p.rewarded.includes(id)) p.rewarded.push(id);
  }
  if (p.sealed && !p.rewarded.includes('__seal__')) p.rewarded.push('__seal__');
  save(p);
}

export type MetaQuestView = {
  discovered: boolean;
  sealed: boolean;
  completedCount: number;
  total: number;
  /** Current chapter (null if sealed) */
  current: MetaChapter | null;
  /** Just-closed chapter this tick (for reward UI) */
  justClosed: MetaChapter | null;
  /** Seal bonus pending grant */
  sealBonus: { bcc: number; energy: number; efficiency: number } | null;
  progress: number;
};

export function peekMetaQuest(): MetaQuestView {
  const p = load();
  const current = OUTER_CIRCUIT.find((c) => !p.completed.includes(c.id)) ?? null;
  return {
    discovered: p.discovered,
    sealed: p.sealed,
    completedCount: p.completed.length,
    total: OUTER_CIRCUIT.length,
    current,
    justClosed: null,
    sealBonus: null,
    progress: p.completed.length / OUTER_CIRCUIT.length,
  };
}

export function advanceMetaQuest(event: MetaQuestEvent): MetaQuestView {
  const p = load();
  // Wake the whisper only after real attention — keep the secret rare
  if (!p.discovered && (event === 'first_spark' || event === 'academy_session')) {
    p.discovered = true;
  }

  const current = OUTER_CIRCUIT.find((c) => !p.completed.includes(c.id)) ?? null;
  let justClosed: MetaChapter | null = null;
  let sealBonus: MetaQuestView['sealBonus'] = null;

  if (current && current.closesOn.includes(event)) {
    // First Spark settlement often emits academy_session logs too — wait for a real second session
    if (
      event === 'academy_session' &&
      current.id === 'second_breath' &&
      p.ignitionClosedAt &&
      Date.now() - p.ignitionClosedAt < 90_000
    ) {
      // skip
    } else {
      p.completed.push(current.id);
      justClosed = current;
      p.lastEventAt = Date.now();
      if (current.id === 'ignition') p.ignitionClosedAt = Date.now();
    }
  }

  if (!p.sealed && OUTER_CIRCUIT.every((c) => p.completed.includes(c.id))) {
    p.sealed = true;
    sealBonus = { bcc: 250, energy: 15, efficiency: 0.05 };
  }

  save(p);

  const next = OUTER_CIRCUIT.find((c) => !p.completed.includes(c.id)) ?? null;
  return {
    discovered: p.discovered,
    sealed: p.sealed,
    completedCount: p.completed.length,
    total: OUTER_CIRCUIT.length,
    current: next,
    justClosed,
    sealBonus,
    progress: p.completed.length / OUTER_CIRCUIT.length,
  };
}

/** Map success log lines → meta events (best-effort). */
export function classifyMetaEvent(message: string): MetaQuestEvent | null {
  const m = message.toUpperCase();
  if (
    m.includes('YOUR NODE HAS FUEL') ||
    m.includes('NEXT STEP IS ON THE MAP') ||
    (m.includes('FIRST SPARK') && m.includes('PROOF'))
  ) {
    return 'first_spark';
  }
  if (
    m.includes('CONFIDENTIAL PASS') ||
    m.includes('ACADEMY ON-CHAIN') ||
    m.includes('GRANT_ENERGY') ||
    m.includes('ON-CHAIN FUEL LANDED') ||
    m.includes('POA SEALED')
  ) {
    return 'academy_session';
  }
  if (m.includes('KPI') || m.includes('0.05 SOL')) {
    return 'kpi_proof';
  }
  if (
    m.includes('DAILY FUEL + POA') ||
    m.includes('CLAIM ON-CHAIN') ||
    m.includes('CLAIM_DAILY')
  ) {
    return 'claim_daily';
  }
  if (m.includes('HARDWARE DEPLOYED') || m.includes('FORGE SOLDER')) return 'hardware_mount';
  if (
    m.includes('DUALITY ON-CHAIN') ||
    m.includes('DUALITY') ||
    m.includes('CRYSTALL') ||
    m.includes('MIND → MACHINE') ||
    m.includes('MIND -> MACHINE')
  ) {
    return 'duality_swap';
  }
  if (m.includes('CLUB OATH ON DEVNET')) return 'presence';
  if (m.includes('DIRECTIVE COMPLETE') || m.includes('MISSION COMPLETE') || m.includes('QUEST COMPLETE')) {
    return 'daily_mission';
  }
  if (
    m.includes('PROFILE SYNCHRONIZED') ||
    m.includes('PROFILE FILLING') ||
    m.includes('SYNC SUCCESSFUL') ||
    m.includes('CORE RIG CALIBRATION')
  ) {
    return 'presence';
  }
  return null;
}

export function markChapterRewarded(chapterId: string): void {
  const p = load();
  if (!p.rewarded.includes(chapterId)) {
    p.rewarded.push(chapterId);
    save(p);
  }
}

export function wasChapterRewarded(chapterId: string): boolean {
  return load().rewarded.includes(chapterId);
}

export function markSealRewarded(): void {
  markChapterRewarded('__seal__');
}

export function wasSealRewarded(): boolean {
  return wasChapterRewarded('__seal__');
}
