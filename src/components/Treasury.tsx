/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, TrendingUp, Sparkles, RefreshCw, Layers, 
  ShieldCheck, Download, Calendar, Trophy, Clock, 
  CheckCircle, Lock, Unlock, FileText, ShieldAlert, Activity
} from 'lucide-react';
import { GameState } from '../types';
import SolanaPortal from './SolanaPortal';
import AttentionTollShop from './AttentionTollShop';
import { fetchMarketPulse, MarketPulseResponse } from '../lib/api';

interface TreasuryProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  /** When claim_daily is unavailable, keep members in Academy fuel loop */
  onOpenAcademy?: () => void;
  /** Deep-link highlight for Attention Toll SKU */
  tollHighlightSku?: 'spark_refill' | 'academy_retake' | 'claim_turbo' | 'list_slot' | 'spark_pack_100' | null;
}

export default function Treasury({
  state,
  setState,
  addLog,
  onOpenAcademy,
  tollHighlightSku = null,
}: TreasuryProps) {
  const [ticker, setTicker] = useState(0);

  // Daily Streak Claim states
  const [streak, setStreak] = useState<number>(() => {
    return Number(localStorage.getItem('solana_daily_streak_v1') || '1');
  });
  const [lastClaimTime, setLastClaimTime] = useState<string | null>(() => {
    return localStorage.getItem('solana_daily_last_claim_v1');
  });
  const [claimedToday, setClaimedToday] = useState<boolean>(() => {
    const last = localStorage.getItem('solana_daily_last_claim_v1');
    if (!last) return false;
    const lastDate = new Date(Number(last)).toDateString();
    const currentDate = new Date().toDateString();
    return lastDate === currentDate;
  });
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [sigStep, setSigStep] = useState<string>('');
  const [generatedSignature, setGeneratedSignature] = useState<string>('');

  // COGNITIVE Token Swap States
  const [swapCpAmount, setSwapCpAmount] = useState<string>('250');
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapStep, setSwapStep] = useState<string>('');

  // OKX OnchainOS live Solana market pulse (mainnet context beside simulated DEX)
  const [marketPulse, setMarketPulse] = useState<MarketPulseResponse | null>(null);
  const [pulseLoading, setPulseLoading] = useState(true);

  const [economyReady, setEconomyReady] = useState(false);
  const [cooldownHint, setCooldownHint] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const pulse = await fetchMarketPulse();
        if (!cancelled) setMarketPulse(pulse);
      } catch {
        if (!cancelled) {
          setMarketPulse({
            available: false,
            reason: 'Failed to reach market pulse',
            source: 'okx-onchainos',
            fetchedAt: new Date().toISOString(),
          });
        }
      } finally {
        if (!cancelled) setPulseLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  // Sync claim_daily cooldown from Player PDA when economy is live
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { fetchEconomyStatus } = await import('../lib/api');
        const { resolveEconomyWallet } = await import('../lib/economy-wallet');
        const { fetchPlayer, getConnection } = await import('../lib/solana-economy');
        const { PublicKey } = await import('@solana/web3.js');
        const status = await fetchEconomyStatus();
        if (cancelled) return;
        setEconomyReady(!!status.ready);
        if (!status.ready) return;
        const ctx = resolveEconomyWallet();
        if (!ctx) return;
        const player = await fetchPlayer(new PublicKey(ctx.walletAddress), getConnection());
        if (!player || cancelled) return;
        setStreak(Math.max(1, player.streak || 1));
        if (player.lastDailyTs > 0) {
          const nextAt = player.lastDailyTs * 1000 + 20 * 3600 * 1000;
          const remaining = nextAt - Date.now();
          if (remaining > 0) {
            setClaimedToday(true);
            setLastClaimTime(String(player.lastDailyTs * 1000));
            const hrs = Math.ceil(remaining / 3600000);
            setCooldownHint(`Program cooldown ~${hrs}h remaining (20h window)`);
          } else {
            setClaimedToday(false);
            setCooldownHint('claim_daily available — 20h program cooldown');
          }
        } else {
          setClaimedToday(false);
          setCooldownHint('First claim_daily — +15% energy + 50 BCC on-chain');
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const executeSwap = async () => {
    const cpVal = Number(swapCpAmount);
    if (isNaN(cpVal) || cpVal <= 0) {
      addLog("SWAP REFUSED: Please enter a valid number of BCC to swap.", "warn");
      return;
    }
    if (state.credits < cpVal) {
      addLog(`SWAP REFUSED: Need ${cpVal} BCC, have ${state.credits}.`, "warn");
      return;
    }

    setIsSwapping(true);
    setSwapStep("Building swap_bcc_to_cgt…");
    try {
      const { swapBccToCgtOnChain, syncLedgerToState } = await import('../lib/economy-actions');
      const { fetchEconomyStatus } = await import('../lib/api');
      const status = await fetchEconomyStatus();
      if (!status.ready) {
        const { swapBccToCgt } = await import('../lib/economy-rewards');
        // Practice rate when not bootstrapped (not the on-chain 1:1)
        const cgtGained = swapBccToCgt(cpVal, 2000);
        setState((prev) => ({
          ...prev,
          credits: prev.credits - cpVal,
          cognitiveTokens: (prev.cognitiveTokens || 0) + cgtGained,
        }));
        addLog(
          `DEX [PRACTICE]: ${cpVal} BCC → ${cgtGained} CGT at practice rate (economy not configured).`,
          'warn'
        );
      } else {
        setSwapStep("Awaiting wallet signature…");
        const sig = await swapBccToCgtOnChain(cpVal);
        await syncLedgerToState(setState);
        addLog(
          `DEX ON-CHAIN: swap_bcc_to_cgt ${cpVal} BCC. https://solscan.io/tx/${sig}?cluster=devnet`,
          'success'
        );
      }
    } catch (e: any) {
      addLog(`SWAP FAILED: ${e?.message || e}`, 'warn');
    } finally {
      setIsSwapping(false);
      setSwapStep('');
    }
  };

  const triggerDailyClaim = async () => {
    if (claimedToday) {
      addLog('CLAIM BLOCKED: claim_daily still in 20h program cooldown.', 'warn');
      return;
    }

    setIsSigning(true);
    setSigStep('Building claim_daily…');
    try {
      const { fetchEconomyStatus } = await import('../lib/api');
      const { claimDailyOnChain, syncLedgerToState } = await import('../lib/economy-actions');
      const status = await fetchEconomyStatus();
      if (!status.ready) {
        addLog(
          'CLAIM BLOCKED: Economy not configured — no local fake drip. Bootstrap mints to enable claim_daily (+15% energy + 50 BCC, 20h cooldown).',
          'warn'
        );
        return;
      }
      setSigStep('Awaiting wallet signature…');
      const sig = await claimDailyOnChain();
      setGeneratedSignature(sig);
      await syncLedgerToState(setState);
      const now = Date.now().toString();
      localStorage.setItem('solana_daily_last_claim_v1', now);
      setLastClaimTime(now);
      setClaimedToday(true);
      setStreak((s) => s + 1);
      localStorage.setItem('solana_daily_streak_v1', String(streak + 1));
      setCooldownHint('Program cooldown ~20h — next claim_daily after window');
      addLog(
        `CLAIM ON-CHAIN: claim_daily (+15% energy + 50 BCC). https://solscan.io/tx/${sig}?cluster=devnet`,
        'success'
      );
    } catch (e: any) {
      addLog(`CLAIM FAILED: ${e?.message || e}`, 'warn');
    } finally {
      setIsSigning(false);
      setSigStep('');
    }
  };

  // Passive real-time rewards accumulation engine
  useEffect(() => {
    const timer = setInterval(() => {
      // Rewards generated depend directly on mining power, efficiency and energy level (depleted energy lowers output!)
      const energyMultiplier = state.energy / 100;
      const powerPower = state.miningPower;
      const eff = state.efficiency;

      // Accumulator increment
      const increment = parseFloat((powerPower * eff * energyMultiplier * 0.015).toFixed(4));
      
      setState(prev => {
        if (prev.energy <= 0) return prev; // No passive generation when fully depleted
        return {
          ...prev,
          accumulatedRewards: parseFloat((prev.accumulatedRewards + increment).toFixed(4))
        };
      });

      setTicker(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [state.miningPower, state.efficiency, state.energy]);

  const claimRewards = () => {
    if (state.accumulatedRewards <= 0) {
      addLog('CLAIM DENIED: Practice buffer empty.', 'warn');
      return;
    }

    const claimedVal = Math.floor(state.accumulatedRewards);
    setState((prev) => ({
      ...prev,
      credits: prev.credits + claimedVal,
      ecosystemRewards: prev.ecosystemRewards + claimedVal,
      accumulatedRewards: parseFloat((prev.accumulatedRewards - claimedVal).toFixed(4)),
    }));

    addLog(
      `PRACTICE BUFFER: +${claimedVal} local BCC (not claim_daily / not on-chain). Sole free drip is claim_daily below.`,
      'warn'
    );
  };

  // Projections
  const dailyProjection = (state.miningPower * state.efficiency * (state.energy / 100) * 0.015 * 60 * 60 * 24).toFixed(0);

  return (
    <div id="treasury-room" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-time Ticker Vault */}
        <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-emerald-400" />
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">
                PRACTICE YIELD BUFFER
              </h3>
              <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-amber-400/30 text-amber-300">
                Not settlement
              </span>
            </div>

            <p className="text-xs text-slate-400 font-sans mb-8 leading-relaxed">
              Simulated dashboard yield. The only free on-chain drip is{' '}
              <span className="text-cyan-300 font-mono">claim_daily</span> (20h program cooldown) —
              Lucky Wheel stays practice RNG.
            </p>

            {/* Huge ticking number display */}
            <div className="bg-[#050506] border border-white/5 p-8 rounded-2xl text-center relative overflow-hidden">
              <span className="text-[10px] font-mono text-slate-500 tracking-widest block uppercase">UNCLAIMED REWARDS BUFFER</span>
              
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-4xl lg:text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 tracking-tight">
                  {state.accumulatedRewards.toFixed(3)}
                </span>
                <span className="text-sm font-mono text-emerald-400 font-bold tracking-widest animate-pulse">SOL_M</span>
              </div>

              <p className="text-[10px] text-slate-500 font-mono mt-2 leading-relaxed">
                Ticking live • Current power factors: {(state.miningPower).toFixed(1)} PH/s at {state.energy}% Core Power
              </p>
            </div>
          </div>

          {/* Claim button */}
          <div className="mt-6">
            <button
              onClick={claimRewards}
              disabled={state.accumulatedRewards < 1.0}
              className={`w-full py-3.5 rounded-xl font-bold font-mono text-xs tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                state.accumulatedRewards >= 1.0
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-500 hover:to-teal-700 text-slate-950 shadow-lg shadow-emerald-950/40 font-bold'
                  : 'bg-[#050506] border border-white/5 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              CLAIM ACCUMULATED REWARDS (CP)
            </button>
          </div>
        </div>

        {/* Strategy and Projection sidebar */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              YIELD METRICS & PROJECTIONS
            </h4>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#050506] p-3.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block uppercase">24H ESTIMATED HARVEST</span>
                <span className="text-sm font-bold text-slate-100">{dailyProjection} CREDITS / DAY</span>
              </div>

              <div className="bg-[#050506] p-3.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block uppercase">TOTAL REWARDS HARVESTED</span>
                <span className="text-sm font-bold text-emerald-400">{state.ecosystemRewards} CREDITS</span>
              </div>

              <div className="bg-[#050506] p-3.5 rounded-xl border border-white/5">
                <span className="text-[9px] text-slate-500 block uppercase">VAULT SECURITY</span>
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-1 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SECURE COLD VAULT ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[9px] text-slate-500 font-mono text-center">
            * Dynamic Point yield fluctuates depending on active mining rate, multiplier, and core energy level.
          </div>
        </div>

      </div>

      {/* claim_daily — sole free on-chain drip */}
      <div className="bg-[#0a0a0c] border border-cyan-400/25 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cyan-400" />
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">
                CLAIM_DAILY · SOLE FREE DRIP
              </h3>
            </div>
            <span
              className={`text-[9px] font-mono px-2.5 py-0.5 rounded-lg font-black tracking-widest uppercase border ${
                economyReady
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-500/20 text-amber-400'
              }`}
            >
              {economyReady ? 'ON-CHAIN READY' : 'NEEDS BOOTSTRAP'}
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans mb-2 leading-relaxed">
            Program instruction <span className="text-cyan-300 font-mono">claim_daily</span>: +15%
            energy + 50 BCC, enforced ~20h cooldown on your Player PDA — not the browser. Fair for
            everyone; no fake local drip when economy is live.
          </p>
          {cooldownHint && (
            <p className="text-[10px] font-mono text-slate-500 mb-6">{cooldownHint}</p>
          )}
          {!cooldownHint && <div className="mb-6" />}

          <div className="rounded-xl border border-white/8 bg-[#050506] p-4 mb-6 font-mono text-[10px] text-slate-400 space-y-1">
            <div>
              <span className="text-cyan-400 font-bold">Program:</span>{' '}
              <span className="text-slate-300">AS7E1nsK…zbqpZ</span> (culture_economy)
            </div>
            <div>
              <span className="text-cyan-400 font-bold">Instruction:</span>{' '}
              <span className="text-emerald-300">claim_daily</span>
            </div>
            <div>
              <span className="text-cyan-400 font-bold">Reward:</span>{' '}
              <span className="text-slate-300">+1500 energy bps (+15%) · +50 BCC · streak++</span>
            </div>
            <div>
              <span className="text-cyan-400 font-bold">Cooldown:</span> streak {streak}
              {lastClaimTime
                ? ` · last ${new Date(Number(lastClaimTime)).toLocaleString()}`
                : ' · never claimed'}
            </div>
            {generatedSignature && (
              <div className="pt-2 border-t border-white/5 mt-2 break-all text-emerald-300/90">
                tx: {generatedSignature}
              </div>
            )}
            {isSigning && (
              <div className="flex items-center gap-2 text-amber-400 pt-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {sigStep}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className="md:col-span-2 bg-[#050506] border border-white/5 rounded-xl p-4 flex flex-col justify-center">
              <p className="text-xs text-slate-400 leading-relaxed">
                Cooldown is enforced by the program (~20 hours from{' '}
                <span className="font-mono text-slate-300">last_daily_ts</span>). Browser reset
                cannot bypass it when economy is live. Wheel / practice buffer ≠ this drip.
              </p>
            </div>

            <div className="bg-[#050506] border border-white/5 rounded-xl p-4 flex flex-col justify-between text-center relative overflow-hidden">
              <div>
                <span className="text-[8px] text-slate-500 font-mono tracking-widest block uppercase">
                  claim_daily status
                </span>
                <div className="my-4 flex flex-col items-center justify-center">
                  {!economyReady ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-black text-amber-300 uppercase tracking-widest">
                        Settlement offline
                      </span>
                      <span className="font-sans text-[10px] text-slate-400 mt-1 px-2">
                        claim_daily needs on-chain mode — Academy fuel still works
                      </span>
                    </>
                  ) : claimedToday ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-400 uppercase tracking-widest">
                        Cooldown active
                      </span>
                      <span className="font-sans text-[10px] text-slate-400 mt-1 px-2">
                        {cooldownHint || 'Wait for the 20h program window'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2 animate-pulse">
                        <Unlock className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-black text-cyan-400 uppercase tracking-widest">
                        Ready to claim
                      </span>
                      <span className="font-sans text-[10px] text-slate-400 mt-1 px-2">
                        +15% energy · +50 BCC on Devnet
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={triggerDailyClaim}
                  disabled={!economyReady || claimedToday || isSigning}
                  className={`w-full py-2.5 rounded-lg font-mono text-xs font-black tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase ${
                    economyReady && !claimedToday && !isSigning
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-slate-950 shadow-lg'
                      : 'bg-white/[0.02] border border-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isSigning
                    ? 'SIGNING…'
                    : !economyReady
                      ? 'UNAVAILABLE'
                      : claimedToday
                        ? 'COOLDOWN'
                        : 'CLAIM_DAILY'}
                </button>
                {!economyReady && onOpenAcademy && (
                  <button
                    type="button"
                    onClick={onOpenAcademy}
                    className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Get fuel in Academy →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Solana market pulse — OKX OnchainOS (mainnet); facility CP/CGT stays simulated */}
      <div className="bg-[#0a0a0c] border border-emerald-500/15 rounded-2xl p-5 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/5 relative">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">
              SOLANA MARKET PULSE
            </h3>
          </div>
          <span className="text-[9px] font-mono bg-emerald-950/50 border border-emerald-500/25 text-emerald-400 px-2.5 py-0.5 rounded-lg font-black tracking-widest uppercase">
            LIVE · OKX ONCHAINOS
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
          Mainnet Solana context from OKX OnchainOS. Facility CP ↔ CGT swap below remains a{' '}
          <span className="text-cyan-400/80 font-mono">simulated playground</span> — not an on-chain trade.
        </p>
        {pulseLoading && !marketPulse ? (
          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Fetching pulse…
          </div>
        ) : marketPulse?.available ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-4">
              <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 min-w-[140px]">
                <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase block">SOL / USD</span>
                <span className="text-xl font-black text-emerald-400 font-mono tabular-nums">
                  ${marketPulse.sol.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </span>
              </div>
              <span className="text-[9px] text-slate-600 font-mono self-center">
                updated {new Date(marketPulse.fetchedAt).toLocaleTimeString()}
              </span>
            </div>
            {marketPulse.hot.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                {marketPulse.hot.map((t) => (
                  <div
                    key={t.address}
                    className="bg-[#050506] border border-white/5 rounded-lg px-3 py-2"
                    title={t.address}
                  >
                    <span className="text-[10px] font-bold text-slate-200 font-mono block truncate">
                      {t.symbol}
                    </span>
                    {t.priceUsd != null ? (
                      <span className="text-[10px] text-emerald-400/90 font-mono tabular-nums">
                        ${t.priceUsd < 0.01 ? t.priceUsd.toExponential(2) : t.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-600 font-mono">—</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl px-3 py-2.5">
            <span className="text-[10px] text-amber-400/90 font-mono font-bold uppercase tracking-wider block mb-1">
              Pulse unavailable
            </span>
            <span className="text-[11px] text-slate-400 leading-relaxed block">
              {marketPulse && marketPulse.available === false
                ? marketPulse.reason
                : 'OKX OnchainOS market data is not reachable on this host.'}
            </span>
          </div>
        )}
      </div>

      {/* COGNITIVE SPL Token Exchange (DEX Swap) */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-cyan-400" />
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">CGT SWAP [SIMULATED PLAYGROUND]</h3>
            </div>
            <span className="text-[9px] font-mono bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-lg font-black tracking-widest uppercase">
              LOCAL LIQUIDITY POOL
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans mb-6 leading-relaxed">
            Mint and trade our platform's official utility token: <span className="text-cyan-400 font-bold font-mono">COGNITIVE (CGT)</span>. Convert your earned facility credits (CP) in our liquidity pool instantly at a fixed rate of <span className="text-amber-400 font-bold font-mono">5 CP = 1 CGT</span>. CGT is fully integrated on-chain to mint visual NFT miners and power hardware upgrades.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-4">
            {/* Input fields */}
            <div className="p-4 bg-[#050506] border border-white/5 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[8px] text-slate-500 font-mono tracking-widest block uppercase mb-1.5">CONVERSION RATE ENGINE</span>
                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-lg border border-white/[0.02]">
                  <div className="flex-1">
                    <span className="text-[8px] text-slate-500 block">YOU SPEND (CREDITS)</span>
                    <input 
                      type="number"
                      value={swapCpAmount}
                      onChange={(e) => setSwapCpAmount(e.target.value)}
                      disabled={isSwapping}
                      className="w-full bg-transparent text-sm font-bold text-slate-200 outline-none mt-1"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold">CP</span>
                </div>
              </div>

              <div className="flex justify-center py-1">
                <div className="w-8 h-8 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <RefreshCw className={`w-3.5 h-3.5 ${isSwapping ? 'animate-spin' : ''}`} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 bg-cyan-950/10 p-3 rounded-lg border border-cyan-500/10">
                  <div className="flex-1">
                    <span className="text-[8px] text-cyan-500 block font-bold">
                      YOU RECEIVE ({economyReady ? 'ON-CHAIN 1:1' : 'PRACTICE ~1:5'})
                    </span>
                    <span className="text-sm font-black text-cyan-400 block mt-1">
                      {economyReady
                        ? Math.max(0, Math.floor(Number(swapCpAmount) || 0))
                        : Math.max(0, Math.floor(Number(swapCpAmount) / 5) || 0)}{' '}
                      CGT
                    </span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-bold">CGT</span>
                </div>
              </div>
            </div>

            {/* Balances overview */}
            <div className="p-4 bg-[#050506] border border-white/5 rounded-xl flex flex-col justify-between">
              <div className="space-y-2 font-mono text-[11px]">
                <span className="text-[8px] text-slate-500 tracking-widest block uppercase mb-2">LIQUID WALLET STORES</span>
                
                <div className="flex justify-between bg-black/30 p-2 rounded border border-white/[0.01]">
                  <span className="text-slate-500">FACILITY CREDITS:</span>
                  <span className="text-slate-200 font-bold">{state.credits} CP</span>
                </div>

                <div className="flex justify-between bg-black/30 p-2 rounded border border-white/[0.01]">
                  <span className="text-cyan-500">COGNITIVE TOKEN:</span>
                  <span className="text-cyan-400 font-black">
                    {state.cognitiveTokens ?? 250} CGT
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 mt-4">
                <button
                  onClick={executeSwap}
                  disabled={isSwapping || Number(swapCpAmount) <= 0 || state.credits < Number(swapCpAmount)}
                  className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !isSwapping && Number(swapCpAmount) > 0 && state.credits >= Number(swapCpAmount)
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-950/20'
                      : 'bg-white/[0.02] border border-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSwapping ? 'animate-spin' : ''}`} />
                  {isSwapping ? 'SIMULATING…' : 'EXECUTE LOCAL SWAP'}
                </button>
              </div>
            </div>
          </div>

          {isSwapping && (
            <div className="bg-[#050506] border border-cyan-500/20 p-3 rounded-xl font-mono text-[9px] space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>LIQUIDITY ROUTE ESTABLISHED:</span>
              </div>
              <span className="text-slate-300 block">{swapStep}</span>
            </div>
          )}
        </div>
      </div>

      <AttentionTollShop
        state={state}
        setState={setState}
        addLog={addLog}
        highlightSku={tollHighlightSku}
      />

      {/* Solana Web3 Connector portal */}
      <SolanaPortal state={state} setState={setState} addLog={addLog} />
    </div>
  );
}
