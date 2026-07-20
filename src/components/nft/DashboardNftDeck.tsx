/**
 * Dashboard NFT deck — living rig cards on the home map.
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Images, Sparkles, Zap } from 'lucide-react';
import type { GameState, MinerNFT } from '../../types';
import type { NftSkinKey } from '../../lib/nft-media';
import { MoodArt } from '../onboarding/StoryChapterArt';
import NftCard from './NftCard';

const SHOWCASE_SKINS: Array<{
  key: NftSkinKey;
  name: string;
  rarity: MinerNFT['rarity'];
  hashrate: number;
}> = [
  { key: 'obsidian', name: 'Obsidian Pulse-Core', rarity: 'Common', hashrate: 150 },
  { key: 'helix', name: 'Helix Fusion-Cell', rarity: 'Epic', hashrate: 450 },
  { key: 'reactor', name: 'Reactor Heartline', rarity: 'Rare', hashrate: 320 },
  { key: 'quantum', name: 'Quantum Nexus-Shard', rarity: 'Mythic', hashrate: 1200 },
];

type Props = {
  state: GameState;
  username?: string | null;
  compact?: boolean;
  onOpenGallery: () => void;
  onOpenReactor?: () => void;
};

function asShowcaseNft(skin: (typeof SHOWCASE_SKINS)[number]): MinerNFT {
  return {
    id: `showcase_${skin.key}`,
    name: skin.name,
    image: skin.key,
    hashrate: skin.hashrate,
    level: 1,
    maxLevel: 5,
    rarity: skin.rarity,
    isListed: false,
    listingPrice: 0,
    upgradeCost: 0,
    mintAddress: '',
    owner: 'Showcase',
    description: 'Rig skin — mint or claim from the gallery to make it yours.',
  };
}

export default function DashboardNftDeck({
  state,
  username,
  compact = false,
  onOpenGallery,
  onOpenReactor,
}: Props) {
  const miningLive = state.energy > 0;
  const handle = username?.replace(/^@/, '') || null;

  const owned = useMemo(
    () => (state.minerNFTs || []).filter((n) => n.owner === 'Me'),
    [state.minerNFTs]
  );

  const deck: MinerNFT[] = useMemo(() => {
    if (owned.length > 0) return owned.slice(0, compact ? 3 : 6);
    return SHOWCASE_SKINS.map(asShowcaseNft).slice(0, compact ? 3 : 4);
  }, [owned, compact]);

  const showingOwned = owned.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border border-white/12 bg-[#07080c] shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${
        compact ? 'p-4' : 'p-5 md:p-6'
      }`}
    >
      <MoodArt
        wash="from-[#050608]/25 via-[#050608]/70 to-[#050608]/95"
        accent={miningLive ? 'cyan' : 'amber'}
        form={miningLive ? 'spark' : 'orbit'}
        compact
        plate="signal"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050608]/80 via-[#050608]/30 to-transparent" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] text-cyan-300/95">
              <Images className="h-3.5 w-3.5" />
              {handle ? `@${handle} · rig deck` : 'Rig deck'}
              {miningLive ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-cyan-400/40 bg-cyan-500/15 px-1.5 py-0.5 text-cyan-100">
                  <Zap className="h-3 w-3" />
                  Feeds live
                </span>
              ) : (
                <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-amber-100/90">
                  Idle art
                </span>
              )}
            </p>
            <h2
              className={`mt-1.5 font-display font-extrabold italic tracking-tight text-white ${
                compact ? 'text-lg' : 'text-xl md:text-2xl'
              }`}
            >
              {showingOwned ? (
                <>
                  Your miners,{' '}
                  <span className="bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent">
                    {miningLive ? 'awake' : 'waiting on fuel'}
                  </span>
                </>
              ) : (
                <>
                  Rig skins ready —{' '}
                  <span className="bg-gradient-to-r from-cyan-300 to-amber-300 bg-clip-text text-transparent">
                    claim the gallery
                  </span>
                </>
              )}
            </h2>
            {!compact && (
              <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-slate-400">
                {showingOwned
                  ? 'Owned posters loop their mining feed while Impact Score lasts. Open the gallery to trade or mint.'
                  : 'Preview the four core skins. Mint or buy from the gallery — Academy fuel wakes the loops.'}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {onOpenReactor && (
              <button
                type="button"
                onClick={onOpenReactor}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Reactor
              </button>
            )}
            <button
              type="button"
              onClick={onOpenGallery}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-black hover:bg-amber-400 cursor-pointer"
            >
              <Images className="h-3.5 w-3.5" />
              Gallery
            </button>
          </div>
        </div>

        <div
          className={`grid gap-3 ${
            compact
              ? 'grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          }`}
        >
          {deck.map((nft, i) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={i === 0 && !compact ? 'sm:col-span-1' : undefined}
            >
              <NftCard
                nft={nft}
                miningActive={miningLive && (showingOwned || i === 0)}
                boosted={miningLive && showingOwned && state.energy >= 70}
                compact
                onSelect={onOpenGallery}
              />
            </motion.div>
          ))}
        </div>

        {!showingOwned && (
          <p className="text-center font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
            Showcase skins · not owned yet
          </p>
        )}
      </div>
    </motion.section>
  );
}
