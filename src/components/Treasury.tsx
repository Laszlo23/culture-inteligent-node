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
import { fetchMarketPulse, MarketPulseResponse } from '../lib/api';

interface TreasuryProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

export default function Treasury({ state, setState, addLog }: TreasuryProps) {
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

  const executeSwap = () => {
    const cpVal = Number(swapCpAmount);
    if (isNaN(cpVal) || cpVal <= 0) {
      addLog("SWAP REFUSED: Please enter a valid number of Credits (CP).", "warn");
      return;
    }
    if (state.credits < cpVal) {
      addLog(`SWAP REFUSED: Insufficient Credits balance. Need ${cpVal} CP, but you only have ${state.credits} CP.`, "warn");
      return;
    }

    setIsSwapping(true);
    setSwapStep("Drafting on-chain Token Mint instructions...");

    setTimeout(() => {
      setSwapStep("Requesting signature authorization from secure wallet...");

      setTimeout(() => {
        setSwapStep("Broadcasting liquidity exchange to COGNITIVE Token program...");

        setTimeout(() => {
          const cgtGained = Math.floor(cpVal / 5);
          setState(prev => ({
            ...prev,
            credits: prev.credits - cpVal,
            cognitiveTokens: (prev.cognitiveTokens || 0) + cgtGained
          }));
          setIsSwapping(false);
          setSwapStep('');
          addLog(`DEX [SIMULATED]: Local swap ${cpVal} CP → ${cgtGained} CGT. Not an on-chain SPL transfer.`, "success");
        }, 800);
      }, 800);
    }, 800);
  };

  const triggerDailyClaim = () => {
    if (claimedToday) {
      addLog("CLAIM BLOCKED: Daily streak reward already claimed for today.", "warn");
      return;
    }

    setIsSigning(true);
    setSigStep("1/3 [SIMULATED] Drafting local streak claim...");
    
    setTimeout(() => {
      setSigStep("2/3 [SIMULATED] Generating display-only hex (not a Solana sig)...");
      
      const characters = 'ABCDEFabcdef0123456789';
      let randomSig = 'sim_';
      for (let i = 0; i < 40; i++) {
        randomSig += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      setGeneratedSignature(randomSig);
      
      setTimeout(() => {
        setSigStep("3/3 [SIMULATED] Applying local facility credits...");
        
        setTimeout(() => {
          const reward = streak * 75;
          const nextStreak = streak >= 7 ? 1 : streak + 1;
          const now = Date.now().toString();

          localStorage.setItem('solana_daily_streak_v1', nextStreak.toString());
          localStorage.setItem('solana_daily_last_claim_v1', now);

          setState(prev => ({
            ...prev,
            credits: prev.credits + reward
          }));

          setStreak(nextStreak);
          setLastClaimTime(now);
          setClaimedToday(true);
          setIsSigning(false);
          setSigStep('');

          addLog(`STREAK [SIMULATED]: Local daily claim +${reward} CP for Day ${streak}. Not a Solana signature — use Academy attest for on-chain proof.`, "success");
        }, 800);
      }, 800);
    }, 800);
  };

  const overrideCooldown = () => {
    localStorage.removeItem('solana_daily_last_claim_v1');
    setClaimedToday(false);
    addLog("QA DIAGNOSTICS: Daily cooldown timer reset manually. You can claim again!", "system");
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
      addLog("CLAIM DENIED: Zero balances in the secure compiler buffer.", "warn");
      return;
    }

    const claimedVal = Math.floor(state.accumulatedRewards);
    setState(prev => ({
      ...prev,
      credits: prev.credits + claimedVal,
      ecosystemRewards: prev.ecosystemRewards + claimedVal,
      accumulatedRewards: parseFloat((prev.accumulatedRewards - claimedVal).toFixed(4))
    }));

    addLog(`TREASURY TRANSFERRED: claimed ${claimedVal} tokens into active asset balances. Core updated.`, "success");
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
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">ECOSYSTEM REWARDS VAULT</h3>
            </div>

            <p className="text-xs text-slate-400 font-sans mb-8 leading-relaxed">
              Your active cyber operations generate passive ecosystem rewards continuously. Claims can be made instantly into your credit balance to upgrade components or enlist AI assistants.
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

      {/* Daily Streak Signature Portal */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">DAILY STREAK SIGNATURE PORTAL</h3>
            </div>
            <span className="text-[9px] font-mono bg-amber-950/40 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-lg font-black tracking-widest uppercase">
              SMART CONTRACT SIGN-IN
            </span>
          </div>

          <p className="text-xs text-slate-400 font-sans mb-6 leading-relaxed">
            Consistently log in daily and verify your stasis node identity. Executing standard cryptographic signatures on the Solana Devnet verifies your consecutive streak to release scaling reward Credits (CP).
          </p>

          {/* Interactive Streak Grid tracker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
              const isCurrent = dayNum === streak;
              const isPassed = dayNum < streak;
              const bonusAmt = dayNum * 75;

              return (
                <div 
                  key={dayNum}
                  className={`p-3 rounded-xl border font-mono text-center flex flex-col justify-between relative transition-all ${
                    isCurrent 
                      ? 'bg-amber-950/10 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.08)]' 
                      : isPassed 
                        ? 'bg-[#050506]/80 border-amber-500/10 opacity-60' 
                        : 'bg-[#050506]/40 border-white/5 opacity-40'
                  }`}
                >
                  {isPassed && (
                    <div className="absolute top-1.5 right-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                  )}

                  <span className="text-[8px] text-slate-500 uppercase tracking-widest block">DAY {dayNum}</span>
                  <span className={`text-sm font-black my-1.5 block ${isCurrent ? 'text-amber-400 font-black' : 'text-slate-300'}`}>
                    +{bonusAmt}
                  </span>
                  <span className="text-[8px] text-slate-400 block font-bold">CP REWARD</span>

                  {isCurrent && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] bg-amber-500 text-slate-950 px-1 py-0.5 rounded font-black tracking-widest uppercase leading-none whitespace-nowrap">
                      ACTIVE
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Smart Contract Interaction Segment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Left: Interactive contract detail HUD */}
            <div className="md:col-span-2 bg-[#050506] border border-white/5 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[8px] text-slate-500 font-mono tracking-widest block uppercase mb-2">CRYPTOGRAPHIC LEDGER DATA</span>
                
                <div className="font-mono text-[10px] text-slate-400 space-y-1 bg-black/40 p-3 rounded-lg border border-white/[0.02]">
                  <div><span className="text-purple-400 font-bold">Program ID:</span> <span className="text-slate-300">StrkH4b1tD777777777777777777777777777777</span></div>
                  <div><span className="text-purple-400 font-bold">Instruction:</span> <span className="text-cyan-400">verify_consecutive_days_v1</span></div>
                  <div><span className="text-purple-400 font-bold">Accounts:</span> <span className="text-slate-300">Signer (You), NodeRegistry, TreasuryVault</span></div>
                  <div className="pt-2 border-t border-white/5 mt-2">
                    <span className="text-slate-500 block uppercase text-[8px] mb-1">SIGNATURE PAYLOAD</span>
                    <p className="text-[9px] text-amber-300/80 leading-relaxed italic break-all">
                      "I hereby certify consecutive operation check-in for Day {streak} at timestamp {lastClaimTime ? new Date(Number(lastClaimTime)).toLocaleDateString() : 'INITIAL'}. Release corresponding +{streak * 75} CP to operational reserve ledger."
                    </p>
                  </div>
                  {generatedSignature && (
                    <div className="pt-2 border-t border-white/5 mt-2">
                      <span className="text-emerald-400 block uppercase text-[8px] mb-0.5">TRANSACTION SIGNED:</span>
                      <span className="text-[9px] text-slate-400 break-all bg-emerald-950/10 px-1 py-0.5 rounded border border-emerald-500/10 block">{generatedSignature}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status / Step indicator */}
              {isSigning && (
                <div className="mt-3 bg-[#0a0a0c] border border-amber-500/20 p-2.5 rounded-lg font-mono text-[9px] space-y-1">
                  <div className="flex items-center gap-2 text-amber-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="font-black">CONTRACT BROADCAST ACTIVE:</span>
                  </div>
                  <span className="text-slate-300">{sigStep}</span>
                </div>
              )}
            </div>

            {/* Right: Interaction buttons & indicators */}
            <div className="bg-[#050506] border border-white/5 rounded-xl p-4 flex flex-col justify-between text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />

              <div>
                <span className="text-[8px] text-slate-500 font-mono tracking-widest block uppercase">STREAK STATUS</span>
                
                <div className="my-4 flex flex-col items-center justify-center">
                  {claimedToday ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-400 uppercase tracking-widest">
                        SECURED & ACTIVE
                      </span>
                      <span className="font-sans text-[10px] text-slate-400 mt-1 leading-normal px-2">
                        You claimed Day {streak === 1 ? 7 : streak - 1} reward! Cooldown lifts in:
                      </span>
                      <div className="mt-2 text-xs font-mono font-bold bg-white/5 border border-white/5 px-2.5 py-1 rounded text-slate-300 flex items-center gap-1.5 justify-center">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>NEXT DAILY CLAIM</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
                        <Unlock className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-black text-amber-400 uppercase tracking-widest animate-pulse">
                        CLAIM AVAILABLE
                      </span>
                      <span className="font-sans text-[10px] text-slate-400 mt-1 leading-normal px-2">
                        Verify Day {streak} on-chain check-in for <strong className="text-amber-400 font-bold">+{streak * 75} CP</strong>!
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={triggerDailyClaim}
                  disabled={claimedToday || isSigning}
                  className={`w-full py-2.5 rounded-lg font-mono text-xs font-black tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase ${
                    !claimedToday && !isSigning
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black shadow-lg shadow-amber-950/40'
                      : 'bg-white/[0.02] border border-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {isSigning ? 'SIGNING...' : claimedToday ? 'CLAIM SECURED' : 'SIGN & CLAIM'}
                </button>

                {/* QA Tester Manual Bypass button */}
                <button
                  onClick={overrideCooldown}
                  className="w-full py-1 text-[8px] font-mono font-bold border border-white/5 hover:border-red-500/20 hover:bg-red-950/10 text-slate-500 hover:text-red-400 rounded transition-colors uppercase tracking-widest cursor-pointer"
                  title="Testing help: Skip the daily claim cooldown immediately"
                >
                  QA Cooldown Reset
                </button>
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
                    <span className="text-[8px] text-cyan-500 block font-bold">YOU RECEIVE (ESTIMATED)</span>
                    <span className="text-sm font-black text-cyan-400 block mt-1">
                      {Math.max(0, Math.floor(Number(swapCpAmount) / 5)) || 0} CGT
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

      {/* Solana Web3 Connector portal */}
      <SolanaPortal state={state} setState={setState} addLog={addLog} />
    </div>
  );
}
