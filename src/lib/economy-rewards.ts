/**
 * Single source of truth for Culture Economy reward / sink constants.
 * Keep aligned with culture-economy/programs/culture_economy/src/lib.rs
 */

/** Program DEFAULT_SWAP_RATE_BPS — 10000 = 1 BCC → 1 CGT */
export const SWAP_RATE_BPS = 10_000;

/** Program MINER_MINT_COST_CGT */
export const MINER_MINT_COST_CGT = 100;

/** Program DEFAULT_MARKETPLACE_FEE_BPS (2.5% protocol cut on buy_miner) */
export const MARKETPLACE_FEE_BPS = 250;

/** Program DAILY_BCC_REWARD */
export const DAILY_BCC_REWARD = 50;

/** Program DAILY_ENERGY_BPS (+15% fuel on claim_daily) */
export const DAILY_ENERGY_BPS = 1_500;

/** Energy scale: UI percent 0–100 ↔ on-chain bps 0–10000 */
export const ENERGY_MAX_BPS = 10_000;

/** KPI contribution (Devnet SOL) — UI + SolanaPortal */
export const KPI_CONTRIBUTION_SOL = 0.05;

/** KPI on-chain mint via /api/kpi/verify → buildRewardTransaction */
export const KPI_BCC_REWARD = 500;

/** KPI energy grant (2500 bps = +25% fuel) */
export const KPI_ENERGY_BPS = 2_500;

/** UI convenience: energy percent from bps */
export const KPI_ENERGY_PERCENT = KPI_ENERGY_BPS / 100;

/** Local-only efficiency bump after KPI (not on-chain) */
export const KPI_EFFICIENCY_BOOST = 0.15;

/** claim_daily cooldown (seconds) — program uses 20h */
export const DAILY_COOLDOWN_SECS = 20 * 3600;

/** Max claim cycles per year if perfect attendance */
export const MAX_DAILY_CLAIMS_PER_YEAR = Math.floor((365 * 24 * 3600) / DAILY_COOLDOWN_SECS);

/** Perfect-attendance BCC/year from claim_daily alone */
export const MAX_DAILY_BCC_PER_USER_YEAR = MAX_DAILY_CLAIMS_PER_YEAR * DAILY_BCC_REWARD;

export function energyPercentToBps(percent: number): number {
  return Math.max(0, Math.min(ENERGY_MAX_BPS, Math.round(percent * 100)));
}

export function energyBpsToPercent(bps: number): number {
  return Math.max(0, Math.min(100, bps / 100));
}

/** CGT out for BCC in at configured swap rate */
export function swapBccToCgt(bccAmount: number, swapRateBps: number = SWAP_RATE_BPS): number {
  return Math.floor((bccAmount * swapRateBps) / 10_000);
}
