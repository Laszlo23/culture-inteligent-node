/**
 * Facility schematic sector art — stills that sit under room cards
 * (same visual language as NFT gallery / Arena).
 */

import { NFT_POSTERS } from './nft-media';
import { ARENA_HERO } from './hardware-media';

export type SectorAccent = 'cyan' | 'fuchsia' | 'teal' | 'pink' | 'emerald' | 'amber';

export type SectorArt = {
  src: string;
  accent: SectorAccent;
  /** Short hook — makes you want to enter */
  hook: string;
};

export const SECTOR_ART: Record<string, SectorArt> = {
  reactor: {
    src: NFT_POSTERS.reactor,
    accent: 'cyan',
    hook: 'How long can you hold focus?',
  },
  workshop: {
    src: '/hardware/gpu.webp',
    accent: 'fuchsia',
    hook: 'What if hardware learned with you?',
  },
  lab: {
    src: NFT_POSTERS.helix,
    accent: 'teal',
    hook: 'Ready for your First Spark?',
  },
  ai: {
    src: '/hardware/chip.webp',
    accent: 'pink',
    hook: 'Who mines while you sleep?',
  },
  treasury: {
    src: '/hardware/battery.webp',
    accent: 'emerald',
    hook: 'What did attention earn today?',
  },
  guild: {
    src: ARENA_HERO,
    accent: 'amber',
    hook: 'Are you Apex material?',
  },
};

export function resolveSectorArt(roomId: string): SectorArt {
  return (
    SECTOR_ART[roomId] ?? {
      src: NFT_POSTERS.quantum,
      accent: 'cyan' as const,
      hook: 'What is this sector hiding?',
    }
  );
}

/** Glyph columns for the card matrix rain (CSS-driven). */
export const MATRIX_COLUMNS = [
  '010アカサタナハマヤラワ',
  '101イキシチニヒミリヰ',
  '011ウクスツヌフムユル',
  '110エケセテネヘメレヱ',
  '001オコソトノホモヨロヲ',
  '111ンヴヵヶ01アカサ',
  '0101010101010101',
  'アカサタナハマヤラワ01',
] as const;

export const SECTOR_ACCENT_CLASS: Record<
  SectorAccent,
  { glow: string; borderHover: string; sheen: string }
> = {
  cyan: {
    glow: 'group-hover:shadow-[0_0_32px_rgba(34,211,238,0.14)]',
    borderHover: 'hover:border-cyan-500/45',
    sheen: 'from-cyan-400/20 via-transparent to-transparent',
  },
  fuchsia: {
    glow: 'group-hover:shadow-[0_0_32px_rgba(217,70,239,0.14)]',
    borderHover: 'hover:border-fuchsia-500/45',
    sheen: 'from-fuchsia-400/20 via-transparent to-transparent',
  },
  teal: {
    glow: 'group-hover:shadow-[0_0_32px_rgba(45,212,191,0.14)]',
    borderHover: 'hover:border-teal-500/45',
    sheen: 'from-teal-400/20 via-transparent to-transparent',
  },
  pink: {
    glow: 'group-hover:shadow-[0_0_32px_rgba(244,114,182,0.14)]',
    borderHover: 'hover:border-pink-500/45',
    sheen: 'from-pink-400/20 via-transparent to-transparent',
  },
  emerald: {
    glow: 'group-hover:shadow-[0_0_32px_rgba(52,211,153,0.14)]',
    borderHover: 'hover:border-emerald-500/45',
    sheen: 'from-emerald-400/20 via-transparent to-transparent',
  },
  amber: {
    glow: 'group-hover:shadow-[0_0_32px_rgba(245,158,11,0.16)]',
    borderHover: 'hover:border-amber-400/50',
    sheen: 'from-amber-400/25 via-transparent to-transparent',
  },
};
