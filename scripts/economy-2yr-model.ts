/**
 * Auditable 2-year Culture Economy projection from program constants.
 * Usage: npx tsx scripts/economy-2yr-model.ts
 *
 * Not financial advice. Devnet facility ledger model only.
 */

import {
  DAILY_BCC_REWARD,
  DAILY_COOLDOWN_SECS,
  KPI_BCC_REWARD,
  MAX_DAILY_BCC_PER_USER_YEAR,
  MAX_DAILY_CLAIMS_PER_YEAR,
  MINER_MINT_COST_CGT,
  SWAP_RATE_BPS,
} from '../src/lib/economy-rewards';

export type ScenarioId = 'conservative' | 'base' | 'aggressive';

export type Scenario = {
  id: ScenarioId;
  label: string;
  mauY1: number;
  mauY2: number;
  /** Fraction of MAU that claim_daily on a typical day (~1 claim/day given 20h CD) */
  dailyClaimRate: number;
  /** Fraction of claim BCC eventually swapped → CGT */
  swapRate: number;
  /** Miners minted per MAU per year */
  minersPerMauYear: number;
  /** KPI proofs per MAU per year */
  kpiPerMauYear: number;
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'conservative',
    label: 'Conservative',
    mauY1: 200,
    mauY2: 450,
    dailyClaimRate: 0.25,
    swapRate: 0.6,
    minersPerMauYear: 0.15,
    kpiPerMauYear: 0.3,
  },
  {
    id: 'base',
    label: 'Base',
    mauY1: 1500,
    mauY2: 4000,
    dailyClaimRate: 0.35,
    swapRate: 0.7,
    minersPerMauYear: 0.35,
    kpiPerMauYear: 0.6,
  },
  {
    id: 'aggressive',
    label: 'Aggressive',
    mauY1: 8000,
    mauY2: 20000,
    dailyClaimRate: 0.45,
    swapRate: 0.8,
    minersPerMauYear: 0.55,
    kpiPerMauYear: 1.0,
  },
];

export type YearResult = {
  year: 1 | 2;
  mau: number;
  claims: number;
  bccFromDaily: number;
  bccFromKpi: number;
  bccMinted: number;
  cgtMinted: number;
  minersMinted: number;
  cgtBurned: number;
  netBccFloat: number;
  netCgtFloat: number;
};

export type ScenarioResult = {
  scenario: Scenario;
  y1: YearResult;
  y2: YearResult;
  cumulative: {
    bccMinted: number;
    cgtMinted: number;
    cgtBurned: number;
    minersMinted: number;
    netBccFloat: number;
    netCgtFloat: number;
  };
};

function projectYear(s: Scenario, year: 1 | 2): YearResult {
  const mau = year === 1 ? s.mauY1 : s.mauY2;
  // ~1 claim/day max in practice (20h cooldown ≈ daily cadence)
  const claims = Math.round(mau * s.dailyClaimRate * 365);
  const bccFromDaily = claims * DAILY_BCC_REWARD;
  const bccFromKpi = Math.round(mau * s.kpiPerMauYear * KPI_BCC_REWARD);
  const bccMinted = bccFromDaily + bccFromKpi;
  const cgtMinted = Math.floor((bccMinted * s.swapRate * SWAP_RATE_BPS) / 10_000);
  const minersMinted = Math.floor(mau * s.minersPerMauYear);
  const cgtBurned = minersMinted * MINER_MINT_COST_CGT;
  const netBccFloat = Math.floor(bccMinted * (1 - s.swapRate));
  const netCgtFloat = cgtMinted - cgtBurned;
  return {
    year,
    mau,
    claims,
    bccFromDaily,
    bccFromKpi,
    bccMinted,
    cgtMinted,
    minersMinted,
    cgtBurned,
    netBccFloat,
    netCgtFloat,
  };
}

export function runScenario(s: Scenario): ScenarioResult {
  const y1 = projectYear(s, 1);
  const y2 = projectYear(s, 2);
  return {
    scenario: s,
    y1,
    y2,
    cumulative: {
      bccMinted: y1.bccMinted + y2.bccMinted,
      cgtMinted: y1.cgtMinted + y2.cgtMinted,
      cgtBurned: y1.cgtBurned + y2.cgtBurned,
      minersMinted: y1.minersMinted + y2.minersMinted,
      netBccFloat: y1.netBccFloat + y2.netBccFloat,
      netCgtFloat: y1.netCgtFloat + y2.netCgtFloat,
    },
  };
}

export function runAll(): ScenarioResult[] {
  return SCENARIOS.map(runScenario);
}

const isMain =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].includes('economy-2yr-model');

if (isMain) {
  console.log('Culture Economy 2yr model (Devnet ledger units)');
  console.log(
    `Constants: daily=${DAILY_BCC_REWARD} BCC / ${DAILY_COOLDOWN_SECS}s · theoretical max claims/yr/user=${MAX_DAILY_CLAIMS_PER_YEAR} · theoretical max BCC/user/yr≈${MAX_DAILY_BCC_PER_USER_YEAR} · KPI=${KPI_BCC_REWARD} BCC · mint=${MINER_MINT_COST_CGT} CGT · swap=${SWAP_RATE_BPS}bps`
  );
  console.log(
    'Model: claims/year ≈ MAU × dailyClaimRate × 365 (≈1 claim/day ceiling given 20h CD)'
  );
  for (const r of runAll()) {
    console.log(`\n=== ${r.scenario.label} ===`);
    for (const y of [r.y1, r.y2]) {
      console.log(
        `Y${y.year}: MAU=${y.mau} claims=${y.claims} BCC=${y.bccMinted} (daily ${y.bccFromDaily} + KPI ${y.bccFromKpi}) CGT_mint=${y.cgtMinted} CGT_burn=${y.cgtBurned} miners=${y.minersMinted} netBCC=${y.netBccFloat} netCGT=${y.netCgtFloat}`
      );
    }
    console.log(
      `2yr cum: BCC=${r.cumulative.bccMinted} CGT_mint=${r.cumulative.cgtMinted} CGT_burn=${r.cumulative.cgtBurned} miners=${r.cumulative.minersMinted}`
    );
  }
}
