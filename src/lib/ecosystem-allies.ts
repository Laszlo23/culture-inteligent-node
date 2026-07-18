/**
 * Solana-native ecosystem allies shown in the Ecosystem Hub slider.
 * Logos live under /public/ecosystem — keep facts punchy and verifiable-in-spirit.
 */

export interface EcosystemAlly {
  id: string;
  name: string;
  logo: string;
  url: string;
  role: string;
  tagline: string;
  /** One-liner that makes people stop scrolling */
  wow: string;
  stats: Array<{ label: string; value: string }>;
  accent: string;
}

export const ECOSYSTEM_ALLIES: EcosystemAlly[] = [
  {
    id: 'solana',
    name: 'Solana',
    logo: '/ecosystem/solana-mark.svg',
    url: 'https://solana.com/',
    role: 'Settlement Layer',
    tagline: 'The global state machine Culture Node settles on.',
    wow: 'Blocks land in ~400ms. One shared ledger — no L2 maze — so Proof of Attention can feel instant.',
    stats: [
      { label: 'Finality', value: '~400ms' },
      { label: 'Cluster', value: 'Devnet live' },
      { label: 'Why us', value: 'Cheap attestations' },
    ],
    accent: 'from-emerald-400/25 via-cyan-400/15 to-fuchsia-500/20',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    logo: '/ecosystem/jupiter.svg',
    url: 'https://jup.ag/',
    role: 'Liquidity Meta-Router',
    tagline: 'The swap brain of Solana — every major DEX in one quote.',
    wow: 'Jupiter aggregates Solana liquidity so a single route can beat any single venue — the default swap UX for the chain.',
    stats: [
      { label: 'Role', value: 'Meta-DEX' },
      { label: 'Surface', value: 'All major DEXes' },
      { label: 'Why us', value: 'Yield → liquidity' },
    ],
    accent: 'from-lime-400/25 via-emerald-400/15 to-cyan-400/20',
  },
  {
    id: 'phantom',
    name: 'Phantom',
    logo: '/ecosystem/phantom.svg',
    url: 'https://phantom.app/',
    role: 'Wallet Gateway',
    tagline: 'The front door most Solana builders already have open.',
    wow: 'Phantom is the muscle-memory wallet of Solana — one tap and Culture Node has a signed identity, not a password form.',
    stats: [
      { label: 'Platforms', value: 'Ext + mobile' },
      { label: 'Chain', value: 'Solana-first' },
      { label: 'Why us', value: 'One-tap login' },
    ],
    accent: 'from-violet-400/30 via-purple-500/15 to-fuchsia-400/20',
  },
  {
    id: 'okx',
    name: 'OKX',
    logo: '/ecosystem/okx-mark.svg',
    url: 'https://www.okx.com/web3',
    role: 'OnchainOS + Market Pulse',
    tagline: 'Exchange-grade rails meeting Solana on-chain intelligence.',
    wow: 'OKX OnchainOS feeds live Solana market context into the vault — mainnet signal beside Devnet practice settlement.',
    stats: [
      { label: 'Surface', value: 'Web3 wallet' },
      { label: 'Signal', value: 'OnchainOS' },
      { label: 'Why us', value: 'Live market pulse' },
    ],
    accent: 'from-slate-200/20 via-white/5 to-slate-400/15',
  },
  {
    id: 'superteam',
    name: 'Superteam',
    logo: '/ecosystem/superteam.svg',
    url: 'https://superteam.fun/',
    role: 'Builder Network',
    tagline: 'The Solana talent + Earn layer that ships products, not slides.',
    wow: 'Superteam Earn turns global Solana talent into shipped bounties — the same builder culture Culture Node mines attention for.',
    stats: [
      { label: 'Focus', value: 'Earn + talent' },
      { label: 'Scope', value: 'Global hubs' },
      { label: 'Why us', value: 'Builder distribution' },
    ],
    accent: 'from-emerald-400/25 via-green-500/10 to-violet-500/20',
  },
  {
    id: 'rust',
    name: 'Rust',
    logo: '/ecosystem/rust-mark.svg',
    url: 'https://www.rust-lang.org/',
    role: 'Program Language',
    tagline: 'Memory-safe systems language powering Solana programs.',
    wow: 'Solana programs are Rust — the same language that made “fearless concurrency” mainstream now underwrites on-chain attention proofs.',
    stats: [
      { label: 'Domain', value: 'Systems + WASM' },
      { label: 'Solana', value: 'Native programs' },
      { label: 'Why us', value: 'Protocol DNA' },
    ],
    accent: 'from-orange-300/25 via-amber-500/10 to-stone-400/15',
  },
  {
    id: 'farcaster',
    name: 'Farcaster',
    logo: '/ecosystem/farcaster.svg',
    url: 'https://www.farcaster.xyz/',
    role: 'Social Protocol',
    tagline: 'Onchain social where Mini Apps meet real attention loops.',
    wow: 'Farcaster Mini Apps put Culture Node inside the feed — Hearing Mode and Spreads where builders already hang out.',
    stats: [
      { label: 'Surface', value: 'Mini Apps' },
      { label: 'Primitive', value: 'Frames / casts' },
      { label: 'Why us', value: 'Growth loop' },
    ],
    accent: 'from-violet-400/30 via-purple-400/15 to-indigo-400/20',
  },
];

export function mergePartnerSeeds<T extends { id: string; active?: boolean }>(
  saved: T[] | undefined,
  seeds: T[]
): T[] {
  if (!saved?.length) return seeds;
  return seeds.map((seed) => {
    const prev = saved.find((p) => p.id === seed.id);
    return prev ? { ...seed, active: Boolean(prev.active) } : seed;
  });
}
