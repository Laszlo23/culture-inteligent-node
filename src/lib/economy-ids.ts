/**
 * Culture economy program + mint addresses (Devnet).
 * Bootstrap via: npx tsx scripts/devnet-bootstrap.ts
 */

export const SKIN_KEYS = ['obsidian', 'helix', 'reactor', 'quantum'] as const;
export type SkinKey = (typeof SKIN_KEYS)[number];

export const RARITY_KEYS = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const;

function env(key: string): string {
  try {
    const vite =
      typeof import.meta !== 'undefined'
        ? (import.meta as ImportMeta & { env?: Record<string, string> }).env?.[key]
        : undefined;
    if (vite) return vite;
  } catch {
    /* ignore */
  }
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key] as string;
  // Server may use non-VITE_ names
  if (typeof process !== 'undefined' && key.startsWith('VITE_')) {
    const bare = key.slice(5);
    if (process.env?.[bare]) return process.env[bare] as string;
  }
  return '';
}

/** Lazy reads — server loads dotenv after ESM import graph evaluates. */
export function getEconomyProgramIdString(): string {
  return env('VITE_ECONOMY_PROGRAM_ID') || 'AS7E1nsKf3VJGfQPyU5Ekz9iJBNGzZ5sT8P6mGqzbqpZ';
}

export function getBccMintString(): string {
  return env('VITE_BCC_MINT');
}

export function getCgtMintString(): string {
  return env('VITE_CGT_MINT');
}

/** @deprecated Prefer getters — kept for client bundles that bake Vite env at build. */
export const ECONOMY_PROGRAM_ID = getEconomyProgramIdString();
export const BCC_MINT = getBccMintString();
export const CGT_MINT = getCgtMintString();
export function skinToByte(skin: string): number {
  const i = SKIN_KEYS.indexOf(skin as SkinKey);
  return i >= 0 ? i : 0;
}

export function skinFromByte(n: number): SkinKey {
  return SKIN_KEYS[n] ?? 'obsidian';
}

export function rarityToByte(rarity: string): number {
  const i = RARITY_KEYS.indexOf(rarity as (typeof RARITY_KEYS)[number]);
  return i >= 0 ? i : 0;
}

export function rarityFromByte(n: number): (typeof RARITY_KEYS)[number] {
  return RARITY_KEYS[n] ?? 'Common';
}

export const MINER_MINT_COST_CGT = 100;
export const ENERGY_MAX_BPS = 10_000;
