/**
 * NFT Gallery — own rigs + marketplace with mining-active loops.
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Images,
  Zap,
  ShoppingBag,
  Cpu,
  ArrowRight,
  Info,
} from 'lucide-react';
import { GameState, MinerNFT } from '../../types';
import NftCard from './NftCard';

interface NftGalleryProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onOpenReactor?: () => void;
  onOpenProfile?: () => void;
  /** When true, owned rigs show mining feed (energy > 0) */
  miningLive?: boolean;
  boosted?: boolean;
}

export default function NftGallery({
  state,
  setState,
  addLog,
  onOpenReactor,
  onOpenProfile,
  miningLive,
  boosted = false,
}: NftGalleryProps) {
  const [filter, setFilter] = useState<'mine' | 'market' | 'all'>('mine');
  const energyMining = miningLive ?? state.energy > 0;

  const buyListed = async (nft: MinerNFT) => {
    if (nft.owner === 'Me' || !nft.isListed) return;
    if (!String(nft.id).startsWith('onchain_')) {
      addLog('GALLERY: Demo art is not tradable — only onchain_* MinerAssets settle.', 'warn');
      return;
    }
    if ((state.cognitiveTokens ?? 0) < nft.listingPrice) {
      addLog(`GALLERY: Need ${nft.listingPrice} CGT to buy ${nft.name}.`, 'warn');
      return;
    }

    const assetId = Number(nft.id.replace('onchain_', ''));
    if (Number.isNaN(assetId)) {
      addLog('GALLERY: Invalid on-chain asset id.', 'warn');
      return;
    }

    try {
      const { fetchEconomyStatus } = await import('../../lib/api');
      const {
        buyMinerOnChain,
        syncLedgerToState,
        syncMinersToState,
      } = await import('../../lib/economy-actions');
      const status = await fetchEconomyStatus();
      if (!status.ready) {
        addLog('GALLERY: Economy not configured — buy blocked (no local fake trade).', 'warn');
        return;
      }
      const seller = nft.owner;
      const sig = await buyMinerOnChain(assetId, seller);
      await syncLedgerToState(setState);
      await syncMinersToState(setState);
      addLog(
        `GALLERY ON-CHAIN: Bought ${nft.name}. https://solscan.io/tx/${sig}?cluster=devnet`,
        'success'
      );
    } catch (e: any) {
      addLog(`GALLERY: Chain buy failed (${e?.message || e}). No local fallback.`, 'warn');
    }
  };

  const mine = useMemo(
    () => (state.minerNFTs || []).filter((n) => n.owner === 'Me'),
    [state.minerNFTs]
  );
  const market = useMemo(
    () =>
      (state.minerNFTs || []).filter(
        (n) => n.owner !== 'Me' && n.isListed && String(n.id).startsWith('onchain_')
      ),
    [state.minerNFTs]
  );

  const list: MinerNFT[] =
    filter === 'mine' ? mine : filter === 'market' ? market : [...mine, ...market];

  const primary = mine[0];

  return (
    <div className="space-y-6" id="nft-gallery-room">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-[#08090c]">
        <div className="absolute inset-0 bg-cyber-grid opacity-40" />
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -left-16 bottom-0 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col lg:flex-row gap-6 lg:items-end justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-400 flex items-center gap-2">
              <Images className="w-3.5 h-3.5" />
              Rig gallery
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-black italic text-white tracking-tight">
              Your miners, alive
            </h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              On-chain MinerAssets (ids <span className="font-mono text-cyan-300">onchain_*</span>)
              are tradable (2.5% protocol fee on buy). Seed posters are demo art. Mining feed = on-device animation when fuel
              &gt; 0 — not an on-chain video NFT.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider">
              <span className="px-2.5 py-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                Fuel {Math.round(state.energy)}%
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-amber-400/25 bg-amber-500/10 text-amber-100">
                {state.miningPower.toFixed(1)} PH/s
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 text-slate-300">
                {mine.length} owned
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onOpenReactor && (
              <button
                type="button"
                onClick={onOpenReactor}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Open reactor
              </button>
            )}
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:border-cyan-400/40 text-slate-200 text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
              >
                Mint / trade
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {primary && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Featured rig · {energyMining ? 'live mining loop' : 'static (refuel to animate)'}
            </p>
            <NftCard
              nft={primary}
              miningActive={energyMining}
              boosted={boosted}
              footer={
                <div className="flex items-start gap-2 text-[11px] text-slate-400">
                  <Info className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                  <span>
                    Demo gallery — posters are real assets; mining loop is on-device animation (not an
                    on-chain video NFT). Trade/mint stays in Profile.
                  </span>
                </div>
              }
            />
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0a0b0e] p-5 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">How it works</p>
              <ol className="mt-3 space-y-3 text-sm text-slate-300 list-decimal list-inside leading-relaxed">
                <li>Own a rig (seed Obsidian or mint in Profile).</li>
                <li>Keep Knowledge Fuel above 0% via Academy.</li>
                <li>Watch the mining feed loop on your NFT.</li>
                <li>Boost in Reactor for a faster feed.</li>
              </ol>
            </div>
            <button
              type="button"
              onClick={() =>
                addLog(
                  energyMining
                    ? 'GALLERY: Mining feed live on owned rigs.'
                    : 'GALLERY: Fuel empty — complete Academy to wake NFT loops.',
                  energyMining ? 'success' : 'warn'
                )
              }
              className="mt-6 w-full py-2.5 rounded-xl border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider hover:bg-cyan-500/10 cursor-pointer"
            >
              {energyMining ? 'Feed status: LIVE' : 'Feed status: WAITING FOR FUEL'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/8">
          {(
            [
              ['mine', 'My rigs', Images],
              ['market', 'Market', ShoppingBag],
              ['all', 'All', Cpu],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                filter === id
                  ? 'bg-cyan-500 text-black font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          {list.length} shown
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center space-y-4">
          <p className="text-slate-500 text-sm">
            Nothing here yet.{' '}
            {filter === 'mine'
              ? 'Mint a rig in Profile to start the gallery loop.'
              : 'No listings on the market.'}
          </p>
          {filter === 'mine' && onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-black uppercase tracking-wider cursor-pointer"
            >
              Mint in Profile
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((nft) => (
            <NftCard
              key={nft.id}
              nft={nft}
              miningActive={nft.owner === 'Me' && energyMining}
              boosted={boosted && nft.owner === 'Me'}
              compact
              footer={
                nft.owner !== 'Me' && nft.isListed ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-amber-300">{nft.listingPrice} CGT</span>
                    <button
                      type="button"
                      onClick={() => buyListed(nft)}
                      disabled={(state.cognitiveTokens ?? 0) < nft.listingPrice}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider cursor-pointer ${
                        (state.cognitiveTokens ?? 0) >= nft.listingPrice
                          ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                          : 'bg-white/5 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      Buy
                    </button>
                  </div>
                ) : undefined
              }
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
