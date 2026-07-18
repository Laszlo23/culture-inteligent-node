/**
 * NFT media keys → static posters. Mining loop is CSS/canvas over the poster.
 */

export type NftSkinKey = 'obsidian' | 'helix' | 'reactor' | 'quantum';

export const NFT_POSTERS: Record<NftSkinKey, string> = {
  obsidian: '/nft/obsidian.png',
  helix: '/nft/helix.png',
  reactor: '/nft/reactor.png',
  quantum: '/nft/quantum.png',
};

export function resolveNftPoster(imageKey: string): string {
  if (imageKey in NFT_POSTERS) return NFT_POSTERS[imageKey as NftSkinKey];
  return NFT_POSTERS.quantum;
}

export const RARITY_TONE: Record<
  string,
  { accent: string; ring: string; label: string }
> = {
  Common: { accent: 'text-slate-300', ring: 'border-slate-500/40', label: 'bg-slate-500/20 text-slate-200' },
  Rare: { accent: 'text-sky-300', ring: 'border-sky-400/45', label: 'bg-sky-500/20 text-sky-200' },
  Epic: { accent: 'text-teal-300', ring: 'border-teal-400/45', label: 'bg-teal-500/20 text-teal-100' },
  Legendary: { accent: 'text-amber-300', ring: 'border-amber-400/50', label: 'bg-amber-500/20 text-amber-100' },
  Mythic: { accent: 'text-rose-300', ring: 'border-rose-400/50', label: 'bg-rose-500/20 text-rose-100' },
};
