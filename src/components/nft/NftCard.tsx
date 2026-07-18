/**
 * NFT card: static poster when idle; looping mining feed when active.
 */

import React from 'react';
import { motion } from 'motion/react';
import { Zap, Pause } from 'lucide-react';
import { MinerNFT } from '../../types';
import { RARITY_TONE, resolveNftPoster } from '../../lib/nft-media';

export interface NftCardProps {
  nft: MinerNFT;
  miningActive: boolean;
  /** Intensify loop when overclock / boost */
  boosted?: boolean;
  compact?: boolean;
  footer?: React.ReactNode;
  onSelect?: () => void;
}

export default function NftCard({
  nft,
  miningActive,
  boosted = false,
  compact = false,
  footer,
  onSelect,
}: NftCardProps) {
  const poster = resolveNftPoster(nft.image);
  const tone = RARITY_TONE[nft.rarity] || RARITY_TONE.Common;
  const speed = boosted ? 0.55 : 1;

  return (
    <motion.article
      layout
      whileHover={onSelect ? { y: -3 } : undefined}
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl border bg-[#07080a] ${tone.ring} ${
        onSelect ? 'cursor-pointer' : ''
      } ${compact ? '' : 'shadow-[0_0_40px_rgba(34,211,238,0.06)]'}`}
    >
      <div className={`relative ${compact ? 'aspect-square' : 'aspect-[4/5]'} overflow-hidden`}>
        <img
          src={poster}
          alt={nft.name}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
            miningActive ? 'scale-105 brightness-110' : 'scale-100 brightness-90'
          }`}
          draggable={false}
        />

        {/* Idle film grain veil */}
        {!miningActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        )}

        {/* Mining loop — CSS “video” feed over static art */}
        {miningActive && (
          <div
            className="nft-mining-feed absolute inset-0 pointer-events-none"
            style={{ animationDuration: `${2.4 * speed}s` }}
            aria-hidden
          >
            <div className="nft-mining-scan" style={{ animationDuration: `${1.8 * speed}s` }} />
            <div className="nft-mining-ring" style={{ animationDuration: `${3.2 * speed}s` }} />
            <div className="nft-mining-particles" />
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/50 via-transparent to-amber-500/10" />
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-md border border-white/10 ${tone.label}`}>
            {nft.rarity}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border ${
              miningActive
                ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-100'
                : 'border-white/10 bg-black/50 text-slate-400'
            }`}
          >
            {miningActive ? (
              <>
                <Zap className="w-3 h-3" />
                {boosted ? 'Boost mining' : 'Mining'}
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" />
                Idle
              </>
            )}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
          <h3 className="text-sm font-bold text-white tracking-tight leading-snug">{nft.name}</h3>
          <p className="mt-1 text-[10px] font-mono text-cyan-300/90">
            {nft.hashrate.toFixed(0)} PH/s · LVL {nft.level}/{nft.maxLevel}
          </p>
          {!compact && (
            <p className="mt-1.5 text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{nft.description}</p>
          )}
        </div>
      </div>

      {footer && <div className="border-t border-white/5 p-3 bg-[#0a0b0e]">{footer}</div>}
    </motion.article>
  );
}
