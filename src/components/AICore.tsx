/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Cpu, Zap, ArrowUp, ShoppingCart, HelpCircle, Activity, Star, Tag, RefreshCw, Layers } from 'lucide-react';
import { GameState, AIWorker } from '../types';

interface AICoreProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

const BOT_IMAGES: Record<string, string> = {
  bot_research: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80', // Abstract geometric crystal node
  bot_builder: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80', // Heavy industrial tech node
  bot_teacher: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=80', // Matrix green digital flow
  bot_trader: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=500&auto=format&fit=crop&q=80'  // Luminous coin stream
};

interface MarketOffer {
  id: string;
  workerId: string;
  workerName: string;
  rarity: 'Common' | 'Epic' | 'Legendary';
  seller: string;
  price: number;
  multiplierBoost: number;
  powerBoost: number;
}

export default function AICore({ state, setState, addLog }: AICoreProps) {
  const [activeTab, setActiveTab] = useState<'requisition' | 'marketplace'>('requisition');
  const [tradeInProcess, setTradeInProcess] = useState<string | null>(null);

  // Secondary simulated marketplace offers for the tradable mechanic
  const [marketOffers, setMarketOffers] = useState<MarketOffer[]>([
    { id: 'off_1', workerId: 'bot_research', workerName: 'Research Bot NFT', rarity: 'Common', seller: '0xAlpha_Miner', price: 850, multiplierBoost: 4, powerBoost: 100 },
    { id: 'off_2', workerId: 'bot_builder', workerName: 'Builder Bot NFT', rarity: 'Epic', seller: 'CyberValkyrie', price: 1250, multiplierBoost: 8, powerBoost: 220 },
    { id: 'off_3', workerId: 'bot_teacher', workerName: 'Teacher Bot NFT', rarity: 'Epic', seller: 'SolanaSurfer', price: 1600, multiplierBoost: 10, powerBoost: 260 },
  ]);

  const buyWorker = (worker: AIWorker) => {
    if (state.credits < worker.cost) {
      addLog(`TRANSACTION ERROR: AI Cognitive unit requisition failed. Need ${worker.cost} credits. Current: ${state.credits}`, 'warn');
      return;
    }

    setState(prev => {
      const updatedWorkers = prev.workers.map(w => {
        if (w.id === worker.id) {
          return { ...w, unlocked: true, status: 'ACTIVE' as const };
        }
        return w;
      });

      // Calculate new cumulative mining power (base 4.8 + hardware + workers)
      const hardwarePower = prev.hardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusPower, 0);

      const workerPower = updatedWorkers
        .filter(w => w.unlocked)
        .reduce((sum, w) => sum + w.powerBonus, 0);

      const totalPower = 4.8 + hardwarePower + workerPower;

      // Combine efficiency boosts
      const hardwareEfficiency = prev.hardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusEfficiency, 0);

      const workerEfficiencyBoost = updatedWorkers
        .filter(w => w.unlocked)
        .reduce((sum, w) => sum + (w.efficiencyBoost / 100), 0);

      const totalEfficiency = 1.0 + hardwareEfficiency + workerEfficiencyBoost;

      return {
        ...prev,
        credits: prev.credits - worker.cost,
        workers: updatedWorkers,
        miningPower: totalPower,
        efficiency: totalEfficiency
      };
    });

    addLog(`COGNITIVE CORE ACTIVATED: deployed autonomous "${worker.name}" NFT. Unit initiated systems scan.`, 'success');
  };

  const levelUpWorker = (worker: AIWorker) => {
    const levelUpCost = Math.floor(worker.cost * 0.4);
    if (state.credits < levelUpCost) {
      addLog(`RECONFIG REJECTED: Insufficient assembly credits. Level Up costs ${levelUpCost} credits.`, 'warn');
      return;
    }

    setState(prev => {
      const updatedWorkers = prev.workers.map(w => {
        if (w.id === worker.id) {
          return {
            ...w,
            level: w.level + 1,
            powerBonus: Math.floor(w.powerBonus * 1.4),
            efficiencyBoost: parseFloat((w.efficiencyBoost * 1.3).toFixed(1)),
          };
        }
        return w;
      });

      // Recalculate
      const hardwarePower = prev.hardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusPower, 0);

      const workerPower = updatedWorkers
        .filter(w => w.unlocked)
        .reduce((sum, w) => sum + w.powerBonus, 0);

      const totalPower = 4.8 + hardwarePower + workerPower;

      const hardwareEfficiency = prev.hardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusEfficiency, 0);

      const workerEfficiencyBoost = updatedWorkers
        .filter(w => w.unlocked)
        .reduce((sum, w) => sum + (w.efficiencyBoost / 100), 0);

      const totalEfficiency = 1.0 + hardwareEfficiency + workerEfficiencyBoost;

      return {
        ...prev,
        credits: prev.credits - levelUpCost,
        workers: updatedWorkers,
        miningPower: totalPower,
        efficiency: totalEfficiency
      };
    });

    addLog(`COGNITIVE CORE RE-TUNED: upgraded "${worker.name}" to Level ${worker.level + 1}. Frequencies synchronized.`, 'success');
  };

  // Simulated peer secondary trade action
  const buyFromSecondaryMarket = (offer: MarketOffer) => {
    if (state.credits < offer.price) {
      addLog(`TRANSACTION ERROR: Peer market buy failed. Need ${offer.price} CP.`, 'warn');
      return;
    }

    // Check if they already own it
    const alreadyOwns = state.workers.find(w => w.id === offer.workerId)?.unlocked;
    if (alreadyOwns) {
      addLog(`REQUISITION REJECTED: Your node already houses an active "${offer.workerName}". Parallel thread limits reached.`, 'warn');
      return;
    }

    setTradeInProcess(offer.id);

    setTimeout(() => {
      setState(prev => {
        const updatedWorkers = prev.workers.map(w => {
          if (w.id === offer.workerId) {
            return { ...w, unlocked: true, status: 'ACTIVE' as const };
          }
          return w;
        });

        const hardwarePower = prev.hardware
          .filter(h => h.installed && h.unlocked)
          .reduce((sum, h) => sum + h.bonusPower, 0);

        const workerPower = updatedWorkers
          .filter(w => w.unlocked)
          .reduce((sum, w) => sum + w.powerBonus, 0);

        const totalPower = 4.8 + hardwarePower + workerPower;
        const hardwareEfficiency = prev.hardware
          .filter(h => h.installed && h.unlocked)
          .reduce((sum, h) => sum + h.bonusEfficiency, 0);

        const workerEfficiencyBoost = updatedWorkers
          .filter(w => w.unlocked)
          .reduce((sum, w) => sum + (w.efficiencyBoost / 100), 0);

        const totalEfficiency = 1.0 + hardwareEfficiency + workerEfficiencyBoost;

        return {
          ...prev,
          credits: prev.credits - offer.price,
          workers: updatedWorkers,
          miningPower: totalPower,
          efficiency: totalEfficiency
        };
      });

      setMarketOffers(prev => prev.filter(o => o.id !== offer.id));
      setTradeInProcess(null);
      addLog(`PEER TRADE EXECUTED: Bought "${offer.workerName}" from ${offer.seller} for ${offer.price} CP on secondary market.`, 'success');
    }, 1200);
  };

  const sellToSecondaryMarket = (workerId: string) => {
    const worker = state.workers.find(w => w.id === workerId);
    if (!worker || !worker.unlocked) return;

    // Sell back price is 80% of original price
    const sellValue = Math.floor(worker.cost * 0.8);

    setState(prev => {
      const updatedWorkers = prev.workers.map(w => {
        if (w.id === workerId) {
          return { ...w, unlocked: false, status: 'IDLE' as const };
        }
        return w;
      });

      const hardwarePower = prev.hardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusPower, 0);

      const workerPower = updatedWorkers
        .filter(w => w.unlocked)
        .reduce((sum, w) => sum + w.powerBonus, 0);

      const totalPower = 4.8 + hardwarePower + workerPower;
      const hardwareEfficiency = prev.hardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusEfficiency, 0);

      const workerEfficiencyBoost = updatedWorkers
        .filter(w => w.unlocked)
        .reduce((sum, w) => sum + (w.efficiencyBoost / 100), 0);

      const totalEfficiency = 1.0 + hardwareEfficiency + workerEfficiencyBoost;

      return {
        ...prev,
        credits: prev.credits + sellValue,
        workers: updatedWorkers,
        miningPower: totalPower,
        efficiency: totalEfficiency
      };
    });

    addLog(`LIQUIDATION APPROVED: Sold your "${worker.name}" NFT back to the pool for +${sellValue} CP. Node capacity freed.`, 'success');
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'bg-fuchsia-900/40 border-fuchsia-700 text-fuchsia-300';
      case 'Epic': return 'bg-cyan-900/40 border-cyan-700 text-cyan-300';
      default: return 'bg-emerald-900/40 border-emerald-700 text-emerald-300';
    }
  };

  const getStasisGlow = (worker: AIWorker) => {
    if (!worker.unlocked) return 'border-white/5 bg-[#0a0a0c]';
    switch (worker.rarity) {
      case 'Legendary': return 'border-fuchsia-500/50 bg-fuchsia-950/10 shadow-lg shadow-fuchsia-950/25';
      case 'Epic': return 'border-cyan-500/50 bg-cyan-950/10 shadow-lg shadow-cyan-950/25';
      default: return 'border-emerald-500/50 bg-emerald-950/10 shadow-lg shadow-emerald-950/25';
    }
  };

  return (
    <div id="ai-room" className="space-y-6">
      
      {/* Introduction Banner */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-fuchsia-500/15 flex items-center justify-center border border-fuchsia-500/40 text-fuchsia-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-slate-100 tracking-wider">NFT MINING RIGS & AUTOMATION DESK</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
              Physical node hardware units are fully represented as on-chain gamified NFTs. Acquire, level up, or liquidate them on secondary markets to fine-tune your cumulative mining footprint.
            </p>
          </div>
        </div>

        <div className="bg-[#050506] border border-white/5 px-4 py-2.5 rounded-xl font-mono text-xs flex gap-4">
          <div>
            <span className="text-[10px] text-slate-500 block">MINERS ACTIVE</span>
            <span className="text-sm font-bold text-fuchsia-400">{state.workers.filter(w => w.unlocked).length} RIGS</span>
          </div>
          <div className="w-[1px] bg-white/10" />
          <div>
            <span className="text-[10px] text-slate-500 block">WALLETS IN SYNC</span>
            <span className="text-sm font-bold text-cyan-400">SECURE</span>
          </div>
        </div>
      </div>

      {/* Tab Switcher for primary minting and trading markets */}
      <div className="flex border-b border-white/5 gap-6 font-mono text-xs font-bold">
        <button
          onClick={() => setActiveTab('requisition')}
          className={`pb-3 px-1 transition-all relative cursor-pointer tracking-wider flex items-center gap-1.5 ${
            activeTab === 'requisition' ? 'text-fuchsia-400 border-b-2 border-fuchsia-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4 text-fuchsia-400" />
          MINT DIRECT PRIMARY CONDUIT
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`pb-3 px-1 transition-all relative cursor-pointer tracking-wider flex items-center gap-1.5 ${
            activeTab === 'marketplace' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Tag className="w-4 h-4 text-cyan-400" />
          SECONDARY PEER TRADE DESK
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'requisition' ? (
          <motion.div
            key="requisition-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {state.workers.map(worker => {
              const stasisStyle = getStasisGlow(worker);
              return (
                <div
                  key={worker.id}
                  className={`border border-white/5 ${stasisStyle} rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between transition-all`}
                >
                  {/* Outer stasis tube scan line */}
                  {worker.unlocked && (
                    <motion.div
                      animate={{ y: [0, 180, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40 z-10"
                    />
                  )}

                  {/* Rarity label */}
                  <div className="absolute top-4 right-4 z-20">
                    <span className={`text-[9px] font-mono border px-2 py-0.5 rounded tracking-widest ${getRarityBadge(worker.rarity)}`}>
                      {worker.rarity.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 tracking-widest block">{worker.role.toUpperCase()} COLLECTIVE</span>
                    
                    <div className="flex items-center gap-2 mt-2 mb-4">
                      <h4 className="text-sm font-semibold text-slate-100 font-mono">
                        {worker.name}
                      </h4>
                      {worker.unlocked && (
                        <span className="bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 font-mono text-[9px] px-1.5 py-0.5 rounded-lg font-bold">
                          LV{worker.level}
                        </span>
                      )}
                    </div>

                    {/* NFT Graphic card wrapper */}
                    <div className="w-full h-36 rounded-xl overflow-hidden border border-white/5 relative mb-4 bg-black">
                      <img 
                        src={BOT_IMAGES[worker.id] || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&auto=format&fit=crop&q=80"}
                        alt={worker.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      
                      {/* Simulated NFT mint series number */}
                      <span className="absolute bottom-2 left-2.5 font-mono text-[8px] text-white/70 bg-black/60 border border-white/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        SERIES #0{worker.id.length * 4} / 500
                      </span>

                      {/* Stasis status overlay */}
                      <span className={`absolute bottom-2 right-2.5 font-mono text-[8px] font-black border px-1.5 py-0.5 rounded tracking-widest ${
                        worker.unlocked ? 'bg-green-950/80 border-green-700/50 text-green-400' : 'bg-red-950/80 border-red-700/50 text-red-400'
                      }`}>
                        {worker.unlocked ? '● SIGNED ONLINE' : '○ STASIS STANDBY'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 font-sans leading-relaxed">
                      {worker.description}
                    </p>

                    {/* Automation Details / Output stats */}
                    <div className="mt-4 p-2.5 bg-[#050506] border border-white/5 rounded-xl font-mono text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pb-1.5 border-b border-white/5">
                        <span>RIG CAPABILITIES</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          VERIFIED
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-[9px] text-slate-500 block">BASE OUTPUT</span>
                          <span className="text-slate-200 font-bold">+{worker.powerBonus} PH/s</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">MULTIPLIER BOOST</span>
                          <span className="text-emerald-400 font-bold">+{worker.efficiencyBoost}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action trigger footer */}
                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                    {!worker.unlocked ? (
                      // Locked buy block
                      <>
                        <div className="font-mono">
                          <span className="text-[9px] text-slate-500 block">MINT CAPABILITIES</span>
                          <span className="text-amber-400 font-bold">{worker.cost} CP</span>
                        </div>
                        <button
                          onClick={() => buyWorker(worker)}
                          className="bg-fuchsia-500 hover:bg-fuchsia-600 text-slate-950 font-mono text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          MINT NFT
                        </button>
                      </>
                    ) : (
                      // Upgrade Level up block & Sell option
                      <>
                        <div className="flex flex-col font-mono">
                          <span className="text-[9px] text-slate-500 block">UPGRADE CORE</span>
                          <span className="text-cyan-400 font-bold">{Math.floor(worker.cost * 0.4)} CP</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => sellToSecondaryMarket(worker.id)}
                            className="bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 text-red-400 font-mono text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                            title="Liquidate and sell NFT back to the pool at 80% valuation"
                          >
                            SELL (80%)
                          </button>
                          <button
                            onClick={() => levelUpWorker(worker)}
                            className="bg-[#050506] hover:bg-white/[0.03] border border-white/10 text-slate-300 font-mono text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                            TUNE-UP
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="marketplace-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4 font-mono text-xs"
          >
            <div className="bg-cyan-950/10 border border-cyan-500/20 p-4 rounded-xl text-slate-400">
              <span className="text-cyan-400 font-bold block mb-1">DECENTRALIZED PEER MARKETPLACE ACTIVE</span>
              Browse, trade, and buy miner configurations directly from other builders in our global consensus channel. Buying secondary units bypasses standard factory waitlists.
            </div>

            {marketOffers.length === 0 ? (
              <div className="text-center p-8 bg-[#0a0a0c] border border-white/5 rounded-2xl">
                <Layers className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <span className="text-slate-400 font-bold">NO SECONDARY OFFERS FOUND</span>
                <p className="text-[11px] text-slate-500 mt-1">Check back later once peer consensus updates or sell your own miner.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketOffers.map(offer => (
                  <div
                    key={offer.id}
                    className="bg-[#0a0a0c] border border-white/5 hover:border-cyan-500/30 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] relative transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[9px] text-slate-500 block uppercase font-bold">SELLER: {offer.seller}</span>
                          <h4 className="text-sm font-bold text-slate-200 mt-0.5">{offer.workerName}</h4>
                        </div>
                        <span className={`text-[8px] font-mono border px-1.5 py-0.5 rounded uppercase tracking-wider ${getRarityBadge(offer.rarity)}`}>
                          {offer.rarity}
                        </span>
                      </div>

                      <div className="w-full h-24 rounded-lg overflow-hidden border border-white/5 relative mb-3 bg-black">
                        <img 
                          src={BOT_IMAGES[offer.workerId] || "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&auto=format&fit=crop&q=80"}
                          alt={offer.workerName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-[#050506] p-2 rounded-lg text-[10px] mb-4">
                        <div>
                          <span className="text-slate-500 text-[8px] block">POWER ASSIST</span>
                          <span className="text-slate-300 font-bold">+{offer.powerBoost} PH/s</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8px] block">EFFICIENCY</span>
                          <span className="text-emerald-400 font-bold">+{offer.multiplierBoost}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-2">
                      <div>
                        <span className="text-[8px] text-slate-500 block">ASKING PRICE</span>
                        <span className="text-amber-400 font-bold">{offer.price} CP</span>
                      </div>

                      <button
                        onClick={() => buyFromSecondaryMarket(offer)}
                        disabled={tradeInProcess === offer.id}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-black font-mono text-[10px] rounded-lg tracking-wider cursor-pointer"
                      >
                        {tradeInProcess === offer.id ? "BUYING..." : "ACQUIRE NFT"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
