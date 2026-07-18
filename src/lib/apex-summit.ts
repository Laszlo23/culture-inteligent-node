/**
 * Apex Summit — monthly closed circle for the top of the top.
 */

export type ApexSeat = {
  rank: number;
  handle: string;
  title: string;
  faction: string;
  score: number;
  isYou?: boolean;
};

export type ApexMonth = {
  id: string;
  label: string;
  theme: string;
  tagline: string;
  closesAt: Date;
  prizeLine: string;
};

export type ApexQualification = {
  tier: 'spectator' | 'contender' | 'apex';
  score: number;
  reasons: string[];
  nextHint: string;
};

const CLAIM_KEY = 'culture_apex_seat_v1';

export function currentApexMonth(now = new Date()): ApexMonth {
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const closesAt = new Date(y, m + 1, 1, 0, 0, 0, 0); // first of next month
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const themes: Record<number, { theme: string; tagline: string }> = {
    6: {
      theme: 'Cognitive Duality',
      tagline: 'Mind ↔ Machine. Only operators who proved attention keep a seat.',
    },
    7: {
      theme: 'Signal Sovereignty',
      tagline: 'Science drops fast. Apex keeps the ones who stayed focused.',
    },
    8: {
      theme: 'Deep Circuit',
      tagline: 'Outer Circuit seals and faction wars decide who enters the chamber.',
    },
  };
  const t = themes[m] || {
    theme: 'Attention Apex',
    tagline: 'Monthly chamber for the sharpest nodes in Culture.',
  };
  return {
    id: `apex_${y}_${String(m + 1).padStart(2, '0')}`,
    label: monthName,
    theme: t.theme,
    tagline: t.tagline,
    closesAt,
    prizeLine: 'Apex badge · +efficiency crumb · faction glory · Void salon access',
  };
}

export function qualifyForApex(input: {
  energy: number;
  miningPower: number;
  efficiency: number;
  academyCompleted: number;
  guildSelected: boolean;
  outerSealed?: boolean;
}): ApexQualification {
  let score = 0;
  const reasons: string[] = [];

  score += Math.min(35, Math.round(input.energy * 0.35));
  if (input.energy >= 50) reasons.push('Knowledge fuel above 50%');

  score += Math.min(25, Math.round(input.miningPower / 40));
  if (input.miningPower >= 200) reasons.push('Node output in contender range');

  score += Math.min(20, Math.round((input.efficiency - 1) * 40));
  if (input.efficiency >= 1.15) reasons.push('Efficiency edge');

  score += Math.min(30, input.academyCompleted * 8);
  if (input.academyCompleted >= 2) reasons.push(`${input.academyCompleted} Academy proofs`);

  if (input.guildSelected) {
    score += 10;
    reasons.push('Faction enlisted');
  }
  if (input.outerSealed) {
    score += 25;
    reasons.push('Outer Circuit sealed');
  }

  score = Math.min(100, score);

  let tier: ApexQualification['tier'] = 'spectator';
  if (score >= 72) tier = 'apex';
  else if (score >= 40) tier = 'contender';

  const nextHint =
    tier === 'apex'
      ? 'You cleared the bar — claim a Summit seat before the month closes.'
      : tier === 'contender'
        ? 'Climb: another Academy pass + keep fuel warm to break into Apex.'
        : 'Ignite Academy, enlist a faction, and push fuel — spectators watch the Summit.';

  return { tier, score, reasons: reasons.slice(0, 4), nextHint };
}

/** Rotating elite circle — user injects into rank if claimed / apex-qualified. */
export function buildApexCircle(
  monthId: string,
  you?: { handle: string; score: number; faction: string; seated: boolean }
): ApexSeat[] {
  const base: Omit<ApexSeat, 'rank'>[] = [
    { handle: '0xAlpha_Miner', title: 'Summit Chair', faction: 'Web3 Builders', score: 98 },
    { handle: 'CyberValkyrie', title: 'Signal Oracle', faction: 'Quant Researchers', score: 94 },
    { handle: 'SolanaSurfer', title: 'Proof Architect', faction: 'Rust Core Developers', score: 91 },
    { handle: 'NodeMaster9', title: 'Reactor Sage', faction: 'Web3 Builders', score: 88 },
    { handle: 'ZK_Oracle', title: 'Circuit Witness', faction: 'Quant Researchers', score: 85 },
    { handle: 'CryptoNomad', title: 'Edge Cartographer', faction: 'Rust Core Developers', score: 82 },
    { handle: 'AttentionMonk', title: 'Deep Work Lead', faction: 'Web3 Builders', score: 80 },
    { handle: 'FableRelay', title: 'Model Auditor', faction: 'Quant Researchers', score: 78 },
    { handle: 'DevnetFox', title: 'Faction Runner', faction: 'Rust Core Developers', score: 76 },
    { handle: 'LensCutter', title: 'Bias Breaker', faction: 'Web3 Builders', score: 74 },
    { handle: 'VoidWhisper', title: 'Nameless Host', faction: 'Quant Researchers', score: 73 },
    { handle: 'DualityLock', title: 'Mind↔Machine', faction: 'Rust Core Developers', score: 72 },
  ];

  // Stable shuffle salt from month id so circle feels fresh monthly
  const salt = monthId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rotated = [...base.slice(salt % 5), ...base.slice(0, salt % 5)];

  let seats: ApexSeat[] = rotated.map((s, i) => ({ ...s, rank: i + 1 }));

  if (you?.seated && you.score >= 72) {
    // Insert you near your score band, bump last out
    const insertAt = Math.max(
      0,
      seats.findIndex((s) => s.score <= you.score)
    );
    const youSeat: ApexSeat = {
      rank: 0,
      handle: you.handle,
      title: 'Apex Operator',
      faction: you.faction || 'Independent',
      score: you.score,
      isYou: true,
    };
    seats = [...seats.slice(0, insertAt === -1 ? 3 : insertAt), youSeat, ...seats].slice(0, 12);
    seats = seats.map((s, i) => ({ ...s, rank: i + 1 }));
  }

  return seats;
}

export function readApexClaim(monthId: string): boolean {
  try {
    const raw = localStorage.getItem(CLAIM_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw) as { monthId: string; seated: boolean };
    return p.monthId === monthId && !!p.seated;
  } catch {
    return false;
  }
}

export function writeApexClaim(monthId: string) {
  localStorage.setItem(CLAIM_KEY, JSON.stringify({ monthId, seated: true, at: Date.now() }));
}

export function msUntil(date: Date): { days: number; hours: number; mins: number; secs: number } {
  const diff = Math.max(0, date.getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}
