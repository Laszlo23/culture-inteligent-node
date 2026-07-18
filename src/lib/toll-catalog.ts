/**
 * One-cent Attention Toll catalog — SPL USDC micropayments (6 decimals).
 * Free forever: first Academy pass, claim_daily, basic reactor loop.
 */

export const USDC_DECIMALS = 6;
/** 10_000 micro-USDC = $0.01 */
export const CENT_MICRO_USDC = 10_000;

/** Circle Devnet USDC (override with VITE_USDC_MINT). */
export const DEFAULT_DEVNET_USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

export type TollSkuId =
  | 'spark_refill'
  | 'academy_retake'
  | 'claim_turbo'
  | 'list_slot'
  | 'spark_pack_100';

export type TollSku = {
  id: TollSkuId;
  name: string;
  description: string;
  /** Price in US cents */
  priceCents: number;
  /** Raw SPL amount (micro-USDC) */
  priceMicroUsdc: number;
  /** Energy percent granted locally / via grant_energy when applicable */
  energyPercent?: number;
  /** Spark credits added to wallet inventory */
  sparkCredits?: number;
  /** Academy retake credits */
  academyRetakeCredits?: number;
  /** Miner list-slot credits */
  listSlotCredits?: number;
  /** Local claim-turbo cosmetic flag */
  claimTurbo?: boolean;
};

export const TOLL_SKUS: TollSku[] = [
  {
    id: 'spark_refill',
    name: 'Spark Refill',
    description: '+15% knowledge fuel — the classic 1¢ top-up when the reactor runs dry.',
    priceCents: 1,
    priceMicroUsdc: CENT_MICRO_USDC,
    energyPercent: 15,
  },
  {
    id: 'academy_retake',
    name: 'Academy Retake',
    description: 'Unlock another Neural Snap attempt after a fail. First pass stays free.',
    priceCents: 1,
    priceMicroUsdc: CENT_MICRO_USDC,
    academyRetakeCredits: 1,
  },
  {
    id: 'claim_turbo',
    name: 'Claim Turbo',
    description: '+5% energy cosmetic boost. Does not bypass on-chain claim_daily cooldown.',
    priceCents: 1,
    priceMicroUsdc: CENT_MICRO_USDC,
    energyPercent: 5,
    claimTurbo: true,
  },
  {
    id: 'list_slot',
    name: 'List Slot',
    description: 'Pay to list a miner on the marketplace when economy is live.',
    priceCents: 1,
    priceMicroUsdc: CENT_MICRO_USDC,
    listSlotCredits: 1,
  },
  {
    id: 'spark_pack_100',
    name: '100 Sparks Pack',
    description: '100 spark credits (~1¢ each). Spend for refills, retakes, or list slots.',
    priceCents: 99,
    priceMicroUsdc: 99 * CENT_MICRO_USDC,
    sparkCredits: 100,
  },
];

export function getTollSku(id: string): TollSku | undefined {
  return TOLL_SKUS.find((s) => s.id === id);
}

export function tollPriceMicroUsdc(sku: TollSku, quantity = 1): number {
  const q = Math.max(1, Math.floor(quantity));
  return sku.priceMicroUsdc * q;
}

export function centsFromMicroUsdc(micro: number): number {
  return Math.round(micro / CENT_MICRO_USDC);
}

/** Client + server: resolve mint / treasury from env (Vite or Node). */
export function resolveTollEnv(): {
  usdcMint: string;
  treasury: string | null;
  configured: boolean;
} {
  const nodeEnv =
    typeof process !== 'undefined' && process.env ? process.env : ({} as Record<string, string>);
  const viteEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string> }).env
      : undefined;
  const usdcMint =
    nodeEnv.VITE_USDC_MINT ||
    nodeEnv.USDC_MINT ||
    viteEnv?.VITE_USDC_MINT ||
    DEFAULT_DEVNET_USDC_MINT;
  const treasury =
    nodeEnv.VITE_TOLL_TREASURY ||
    nodeEnv.TOLL_TREASURY ||
    viteEnv?.VITE_TOLL_TREASURY ||
    null;
  return {
    usdcMint,
    treasury: treasury && treasury.length >= 32 ? treasury : null,
    configured: Boolean(treasury && treasury.length >= 32),
  };
}
