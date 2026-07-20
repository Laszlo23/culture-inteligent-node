/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, ShieldAlert, Thermometer, Wind, RefreshCw, Cpu, Database, Activity, 
  Award, Brain, BookOpen, Check, Lock, Play, CheckCircle, Flame, Clock, Sparkles,
  Smartphone, User, Edit3, ShoppingBag, Trophy
} from 'lucide-react';
import { GameState, HardwareModule } from '../types';
import { GlowPulse, EnergyFlow, consumeEnergySurge } from './fx';
import NftCard from './nft/NftCard';

interface MainReactorProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  logs: { timestamp: string; message: string; type: 'info' | 'success' | 'warn' | 'system' }[];
  /** Open Penny Protocol Spark Refill in Treasury */
  onOpenTollShop?: () => void;
}

export default function MainReactor({ state, setState, addLog, logs, onOpenTollShop }: MainReactorProps) {
  const [isOverclocked, setIsOverclocked] = useState(false);
  const [temperature, setTemperature] = useState(42); // in celsius
  const [venting, setVenting] = useState(false);
  const [rgbTheme, setRgbTheme] = useState<'cyan' | 'magenta' | 'emerald' | 'amber'>('cyan');
  const [activeLeftTab, setActiveLeftTab] = useState<'living-miner' | 'schematic' | 'coresync' | 'academy'>('living-miner');
  const [showMobileDashboard, setShowMobileDashboard] = useState(false);
  const [energySurge, setEnergySurge] = useState(false);

  // Zen Breathing Game States
  const [showBreathGame, setShowBreathGame] = useState(false);
  const [breathActive, setBreathActive] = useState(false);
  const [breathTimer, setBreathTimer] = useState(15);
  const [userVal, setUserVal] = useState(50); // user pressure (0 - 100)
  const [breathTarget, setBreathTarget] = useState(50); // oscillating target (0 - 100)
  const [phaseTime, setPhaseTime] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [ticksInTarget, setTicksInTarget] = useState(0);
  const [totalTicks, setTotalTicks] = useState(0);
  const [breathResult, setBreathResult] = useState<'success' | 'failed' | null>(null);
  const [breathScore, setBreathScore] = useState(100);

  // MINER_X1-QUANTUM Custom Recalibration States
  const [showRecalibrate, setShowRecalibrate] = useState(false);
  const [recalibrateProgress, setRecalibrateProgress] = useState(0);
  const [recalibrateState, setRecalibrateState] = useState<'idle' | 'inhale' | 'exhale' | 'success'>('idle');
  const [recalibrateCircleSize, setRecalibrateCircleSize] = useState(0.6);
  const [recalibrateBreathsDone, setRecalibrateBreathsDone] = useState(0);
  const [isPressingRecalibrate, setIsPressingRecalibrate] = useState(false);
  const [recalibrateFeedback, setRecalibrateFeedback] = useState('Standby');

  // Quantum Core Lab Lessons States
  const [showLessons, setShowLessons] = useState(false);
  const [activeLessonIdx, setActiveLessonIdx] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [lessonSimState, setLessonSimState] = useState<'idle' | 'running' | 'success'>('idle');
  const [spinDirections, setSpinDirections] = useState<boolean[]>([true, false, true, false]); // For Lesson 2 alignment
  const [hashProgress, setHashProgress] = useState(0); // For Lesson 3 hashing

  const featuredNft = (state.minerNFTs || []).find((n) => n.owner === 'Me');
  const miningLive = state.energy > 0;
  const minerPulseFired = useRef(false);

  useEffect(() => {
    if (!miningLive || minerPulseFired.current) return;
    minerPulseFired.current = true;
    void import('../lib/achievements').then(({ isAchievementUnlocked }) => {
      if (isAchievementUnlocked('miner_pulse')) return;
      void import('../lib/reward-bus').then(({ rewardAction }) => {
        rewardAction('miner_pulse');
      });
    });
  }, [miningLive]);

  // Find installed modules for custom visual highlights
  const hasGpu = state.hardware.some(h => h.type === 'gpu' && h.installed);
  const hasMemory = state.hardware.some(h => h.type === 'memory' && h.installed);
  const hasAccel = state.hardware.some(h => h.type === 'accelerator' && h.installed);
  const hasBattery = state.hardware.some(h => h.type === 'battery' && h.installed);
  const hasCooler = state.hardware.some(h => h.type === 'cooler' && h.installed);
  const hasDock = state.hardware.some(h => h.type === 'dock' && h.installed);
  const hasChip = state.hardware.some(h => h.type === 'chip' && h.installed);

  // Core background system simulation
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate temperature fluctuations
      setTemperature(prev => {
        let target = 35;
        if (isOverclocked) target = 82;
        else if (hasCooler) target = 28;
        
        if (venting) {
          return Math.max(18, prev - 8);
        }
        
        if (prev < target) return Math.min(target, prev + 1.5);
        if (prev > target) return Math.max(target, prev - 1.2);
        return prev;
      });

      // Passive energy decay — when settlement is ready, flush drain_energy to Player PDA
      setState((prev) => {
        if (prev.energy <= 0) return prev;
        const decayRate = isOverclocked ? 1.5 : 0.2;
        const nextEnergy = Math.max(0, prev.energy - decayRate);
        const drained = prev.energy - nextEnergy;

        if (drained > 0) {
          void import('../lib/economy-actions')
            .then(({ queueEnergyDrainPercent }) => queueEnergyDrainPercent(drained))
            .catch(() => undefined);
        }

        if (nextEnergy === 0 && prev.energy > 0) {
          addLog(
            'CRITICAL FAILURE: Energy depleted! Facility has entered SAFE MODE. Operations halted.',
            'warn'
          );
        }
        return {
          ...prev,
          energy: parseFloat(nextEnergy.toFixed(1)),
        };
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isOverclocked, venting, hasCooler]);

  // MINER_X1-QUANTUM Zen Recalibration Loops
  useEffect(() => {
    if (!showRecalibrate || recalibrateState === 'success' || recalibrateState === 'idle') return;

    const interval = setInterval(() => {
      if (recalibrateState === 'inhale') {
        if (isPressingRecalibrate) {
          setRecalibrateCircleSize(prev => {
            const next = parseFloat((prev + 0.04).toFixed(3));
            if (next >= 1.2) {
              setRecalibrateFeedback('HOLD! TARGET ALIGNED');
            } else {
              setRecalibrateFeedback('Inhaling... keep holding');
            }
            return Math.min(1.5, next);
          });
        } else {
          // Slowly shrink if they let go
          setRecalibrateCircleSize(prev => {
            setRecalibrateFeedback('Released too early! Try holding.');
            return Math.max(0.6, parseFloat((prev - 0.05).toFixed(3)));
          });
        }
      } else if (recalibrateState === 'exhale') {
        if (!isPressingRecalibrate) {
          setRecalibrateCircleSize(prev => {
            const next = parseFloat((prev - 0.04).toFixed(3));
            if (next <= 0.7) {
              setRecalibrateFeedback('CALIBRATED! GET READY FOR INHALE');
            } else {
              setRecalibrateFeedback('Exhaling... stay released');
            }
            return Math.max(0.5, next);
          });
        } else {
          // Slowly grow if they hold during exhale
          setRecalibrateCircleSize(prev => {
            setRecalibrateFeedback('Let go to exhale fully.');
            return Math.min(1.5, parseFloat((prev + 0.05).toFixed(3)));
          });
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [showRecalibrate, recalibrateState, isPressingRecalibrate]);

  useEffect(() => {
    if (!showRecalibrate || recalibrateState === 'success' || recalibrateState === 'idle') return;

    if (recalibrateState === 'inhale' && recalibrateCircleSize >= 1.2) {
      setRecalibrateState('exhale');
      setRecalibrateFeedback('PERFECT INHALE! Now RELEASE button to exhale...');
      return;
    }

    if (recalibrateState === 'exhale' && recalibrateCircleSize <= 0.7) {
      const nextBreaths = recalibrateBreathsDone + 1;
      setRecalibrateBreathsDone(nextBreaths);
      setRecalibrateProgress(Math.round((nextBreaths / 3) * 100));
      
      if (nextBreaths >= 3) {
        setRecalibrateState('success');
        setRecalibrateFeedback('AI INSPECTION PASSED: Machine fully calibrated!');
      } else {
        setRecalibrateState('inhale');
        setRecalibrateFeedback('PERFECT EXHALE! Now HOLD button to inhale again...');
      }
      return;
    }
  }, [recalibrateCircleSize, recalibrateState, recalibrateBreathsDone, showRecalibrate]);

  // Game ticks loop for Box Breathing core alignment (ticks every 50ms)
  useEffect(() => {
    if (!breathActive) return;

    let subSecondTickCount = 0;
    const interval = setInterval(() => {
      // 1. Oscillate target in a smooth, rhythmic sine-wave mimicking breathing (approx. 6s full cycles)
      setPhaseTime(prev => {
        const nextPhase = prev + 0.05;
        const targetValue = 50 + 42 * Math.sin(nextPhase);
        setBreathTarget(targetValue);
        return nextPhase;
      });

      // 2. Adjust user pressure value based on action state
      setUserVal(prev => {
        if (isPressing) {
          return Math.min(100, prev + 3.5);
        } else {
          return Math.max(0, prev - 3.0);
        }
      });

      // 3. Score calculations based on alignment proximity (tolerance +/- 15)
      setTotalTicks(prev => {
        const nextTotal = prev + 1;
        setTicksInTarget(prevTicks => {
          // Calculate diff immediately using newest values in the tick cycle
          setUserVal(currentUser => {
            setBreathTarget(currentTarget => {
              const diff = Math.abs(currentUser - currentTarget);
              if (diff <= 16) {
                // User is in alignment
                setTicksInTarget(t => t + 1);
              }
              return currentTarget;
            });
            return currentUser;
          });
          return prevTicks;
        });
        return nextTotal;
      });

      // 4. Update the visual synchronicity score
      setTotalTicks(tVal => {
        setTicksInTarget(ticksVal => {
          const score = tVal > 0 ? (ticksVal / tVal) * 100 : 100;
          setBreathScore(Math.round(score));
          return ticksVal;
        });
        return tVal;
      });

      // 5. Secondary loop for actual seconds counting
      subSecondTickCount += 1;
      if (subSecondTickCount >= 20) {
        subSecondTickCount = 0;
        setBreathTimer(prevSec => {
          if (prevSec <= 1) {
            // Game over! Clean up immediately
            setBreathActive(false);
            clearInterval(interval);
            
            // Check success metrics
            setBreathScore(finalScore => {
              if (finalScore >= 72) {
                setBreathResult('success');
                // Apply generous core energy / mining power rewards
                setTemperature(16);
                setState(prev => {
                  const bonusEnergy = 30; // +30% core energy
                  const bonusCP = 250;
                  const newEnergy = Math.min(100, prev.energy + bonusEnergy);
                  const newCredits = prev.credits + bonusCP;
                  const newEfficiency = parseFloat((prev.efficiency + 0.12).toFixed(3)); // temporary active boost
                  return {
                    ...prev,
                    energy: newEnergy,
                    credits: newCredits,
                    efficiency: newEfficiency
                  };
                });
                addLog(`QUANTUM CORESYNC SUCCESSFUL: Core aligned at ${Math.round(finalScore)}% coherence. Saturated reactor reserves. -30°C temperature purge, +30% Core Energy, +250 CP, +0.12x Efficiency boost!`, 'success');
              } else {
                setBreathResult('failed');
                addLog(`QUANTUM CORESYNC DE-COHERED: Coherence dropped to ${Math.round(finalScore)}%. System rejects noise. Cleanse mind and retry.`, 'warn');
              }
              return finalScore;
            });
            return 0;
          }
          return prevSec - 1;
        });
      }

    }, 50);

    return () => clearInterval(interval);
  }, [breathActive, isPressing]);

  // Lessons Action Handlers
  const handleStartLessonSimulation = (lessonId: string) => {
    if (lessonSimState === 'running') return;
    setLessonSimState('running');
    
    if (lessonId === 'l2') {
      // Randomize spin arrow directions for alignment puzzle
      setSpinDirections([Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5]);
    } else if (lessonId === 'l3') {
      setHashProgress(0);
    }

    // Run simulated delay
    setTimeout(() => {
      if (lessonId === 'l1') {
        setLessonSimState('success');
        if (!completedLessons.includes(lessonId)) {
          setCompletedLessons(prev => [...prev, lessonId]);
          setState(s => ({ ...s, credits: s.credits + 100 }));
          addLog("QUANTUM ACADEMY: Completed Lesson on Decoherence Shielding. Core shielded. Secured +100 CP.", "success");
        }
      }
    }, 2000);
  };

  // Lesson 2 custom mechanics: flip spin directions to align all pointing true
  const flipSpin = (idx: number) => {
    if (lessonSimState !== 'running') return;
    setSpinDirections(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      
      // Check if all are pointing true (Up / aligned)
      const allAligned = next.every(v => v === true);
      if (allAligned) {
        setLessonSimState('success');
        if (!completedLessons.includes('l2')) {
          setCompletedLessons(cl => [...cl, 'l2']);
          setState(s => ({ ...s, credits: s.credits + 100 }));
          addLog("QUANTUM ACADEMY: Entangled habit loops stabilized in Spin-UP phase. Efficiency enhanced. Secured +100 CP.", "success");
        }
      }
      return next;
    });
  };

  // Lesson 3 custom hashing simulation ticks
  useEffect(() => {
    if (activeLessonIdx !== 2 || lessonSimState !== 'running') return;

    const t = setInterval(() => {
      setHashProgress(prev => {
        if (prev >= 100) {
          clearInterval(t);
          setLessonSimState('success');
          if (!completedLessons.includes('l3')) {
            setCompletedLessons(cl => [...cl, 'l3']);
            setState(s => ({ ...s, credits: s.credits + 100 }));
            addLog("QUANTUM ACADEMY: Zero-Knowledge Cognitive proof compiled. Sovereignty intact. Secured +100 CP.", "success");
          }
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    return () => clearInterval(t);
  }, [lessonSimState, activeLessonIdx]);

  const QUANTUM_LESSONS = [
    {
      id: 'l1',
      title: 'Quantum Decoherence & Focus Scatter',
      synopsis: 'Multitasking acts as a disruptive quantum observation. Looking back and forth collapses beautiful cognitive superpositions into low-energy noise. Create high-vacuum focal spaces to shield complex engineering loops.',
      perk: 'Unlocks advanced structural resilience templates.'
    },
    {
      id: 'l2',
      title: 'Entangled Habit Loops (Spin Coherence)',
      synopsis: 'The quantum state of early morning operations dictates downstream choice probability fields. Aligning early sequences (like deep breathing or logging metrics) entangles your day in a productive state vector.',
      perk: 'Increases facility efficiency and stabilizes system energy.'
    },
    {
      id: 'l3',
      title: 'Zero-Knowledge Cognitive Proofs (Sovereignty)',
      synopsis: 'Secure cognitive autonomy by proving academic attention directly on-chain without disclosing personal journal reflections. Maintain absolute mental privacy while maintaining high external reputation standards.',
      perk: 'Shields private mental assets and unlocks ledger security nodes.'
    }
  ];

  const handleOverclockToggle = () => {
    if (state.energy <= 10) {
      addLog("OVERCLOCK INSUFFICIENT ENERGY: System cannot breach threshold below 10% reactor reserves.", "warn");
      return;
    }
    const nextState = !isOverclocked;
    setIsOverclocked(nextState);
    if (nextState) {
      addLog("SYSTEM NOTICE: Overclock matrix activated. Boost output online. Temperature warning engaged.", "warn");
    } else {
      addLog("SYSTEM NOTICE: Overclock deactivated. Recalibrating reactor grid to nominal standards.", "info");
    }
  };

  const handleVentHeat = () => {
    if (venting) return;
    setVenting(true);
    addLog("VENT CYCLE DEPLOYED: Liquid Nitrogen purge active. Injecting cooling sub-routine.", "success");
    setTimeout(() => {
      setVenting(false);
      addLog("VENT CYCLE COMPLETE: Discharging exhaust stream. Core stabilized.", "info");
    }, 4000);
  };

  // Dynamic values calculated based on state
  const activeMiningPower = isOverclocked 
    ? (state.miningPower * 1.5).toFixed(1) 
    : state.miningPower.toFixed(1);

  const reactorLevel = state.rooms.find((r) => r.id === 'reactor')?.level ?? 1;
  const energyNorm = Math.max(0, Math.min(100, state.energy)) / 100;
  // Presentation-only telemetry derived from existing energy (no new economy)
  const coolantPressure = Math.round(40 + energyNorm * 55);
  const coreHeatIndex = Math.round(
    temperature * (isOverclocked ? 1.15 : 1) * (1.1 - energyNorm * 0.25)
  );
  const pulseDuration = state.energy < 25 ? 3.4 : isOverclocked ? 0.55 : state.energy > 70 ? 1.3 : 2.4;
  const coreScale = 1 + reactorLevel * 0.04 + (isOverclocked ? 0.08 : 0);
  const ringCount = Math.min(5, 1 + reactorLevel);

  useEffect(() => {
    if (consumeEnergySurge()) {
      setEnergySurge(true);
      addLog('ENERGY SURGE: Knowledge fuel routed into the reactor core.', 'success');
      const t = window.setTimeout(() => setEnergySurge(false), 3200);
      return () => window.clearTimeout(t);
    }
  }, []);

  const energyStatusText = () => {
    if (state.energy < 20) return { text: "CRITICAL LOW", color: "text-red-500 animate-pulse" };
    if (state.energy < 50) return { text: "REACTOR LOW", color: "text-amber-500" };
    return { text: "REACTOR STABLE", color: "text-emerald-500" };
  };

  const activeColorClass = {
    cyan: 'stroke-cyan-500 shadow-cyan-500/50',
    magenta: 'stroke-fuchsia-500 shadow-fuchsia-500/50',
    emerald: 'stroke-emerald-500 shadow-emerald-500/50',
    amber: 'stroke-amber-500 shadow-amber-500/50',
  }[rgbTheme];

  const activeFillClass = {
    cyan: 'fill-cyan-500/20',
    magenta: 'fill-fuchsia-500/20',
    emerald: 'fill-emerald-500/20',
    amber: 'fill-amber-500/20',
  }[rgbTheme];

  const activeTextClass = {
    cyan: 'text-cyan-400',
    magenta: 'text-fuchsia-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
  }[rgbTheme];

  return (
    <div id="reactor-room" className={`space-y-4 relative ${energySurge ? 'reactor-surge' : ''}`}>
      {energySurge && (
        <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl border-2 border-emerald-400/40 shadow-[0_0_60px_rgba(52,211,153,0.35)] animate-pulse" />
      )}
      {/* Knowledge fuel + heat presentation strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-[#0a0a0c]/90 border border-white/5 rounded-xl px-3 py-2 relative overflow-hidden">
          <GlowPulse energy={state.energy} className="absolute -right-4 -top-4 w-16 h-16" color={state.energy < 30 ? 'orange' : 'cyan'} />
          <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase relative">Knowledge fuel</span>
          <div className="flex items-baseline gap-2 relative mt-0.5">
            <span className={`text-lg font-black font-mono ${state.energy < 40 ? 'text-orange-400' : 'text-cyan-300'}`}>{state.energy}%</span>
          </div>
          <EnergyFlow energy={state.energy} className="mt-1.5 relative" />
        </div>
        <div className="bg-[#0a0a0c]/90 border border-white/5 rounded-xl px-3 py-2">
          <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Coolant pressure</span>
          <p className="text-lg font-black font-mono text-emerald-300 mt-0.5">{coolantPressure}<span className="text-[10px] text-slate-500 font-normal"> PSI</span></p>
        </div>
        <div className="bg-[#0a0a0c]/90 border border-white/5 rounded-xl px-3 py-2">
          <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Core heat index</span>
          <p className={`text-lg font-black font-mono mt-0.5 ${coreHeatIndex > 70 ? 'text-orange-400' : 'text-slate-200'}`}>{coreHeatIndex}°</p>
        </div>
        <div className="bg-[#0a0a0c]/90 border border-white/5 rounded-xl px-3 py-2">
          <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase">Reactor tier</span>
          <p className="text-lg font-black font-mono text-fuchsia-300 mt-0.5">L{reactorLevel}<span className="text-[10px] text-slate-500 font-normal"> / 5</span></p>
        </div>
      </div>

      {/* Mobile Operator Console Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a0a0c] border border-white/5 p-4 rounded-2xl gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 font-mono tracking-wide">OPERATOR CONSOLE SWITCHER</h4>
            <span className="text-[9px] text-slate-500 font-mono block">TAP TO ACCELERATE DAILY CHORES IN COMPACT MODE</span>
          </div>
        </div>
        <button
          onClick={() => setShowMobileDashboard(!showMobileDashboard)}
          className={`px-3 py-1.5 rounded-xl font-mono text-[9px] font-black tracking-widest transition-all flex items-center gap-1.5 uppercase cursor-pointer ${
            showMobileDashboard 
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.15)]' 
              : 'bg-[#050506] text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          {showMobileDashboard ? 'Dismiss Operator Deck' : 'Launch Operator Deck'}
        </button>
      </div>

      {showMobileDashboard ? (
        /* Operator Compact Mobile Card Deck */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
          {/* Node Profile Compact Card */}
          <div className="bg-[#0a0a0c] border border-teal-500/15 rounded-2xl p-4 space-y-4 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute inset-0 bg-cyber-grid bg-[size:16px_16px] opacity-10 pointer-events-none" />
            
            <div className="flex justify-between items-start z-10">
              <div>
                <span className="text-[8px] text-slate-500 uppercase block tracking-wider">NODE IDENTITY SPEC</span>
                <h4 className="text-xs font-black text-slate-200 mt-0.5">{state.nodeName || 'NODE #48392'}</h4>
              </div>
              <div className="bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest">
                LVL {state.nodeLevel || 1}
              </div>
            </div>

            <div className="flex items-center gap-4 py-3 border-y border-white/5 z-10">
              <div className="w-12 h-12 rounded-xl bg-teal-950/20 border border-teal-500/30 flex items-center justify-center relative">
                <Brain className="w-5 h-5 text-teal-400" />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0a0a0c] flex items-center justify-center text-[7px] text-black font-black">✓</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>TRAIT:</span>
                  <span className="text-teal-400 font-bold">{state.nodePersonality || 'Scholar AI'}</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>ACCUMULATED:</span>
                  <span className="text-slate-200">{(state.nodeExperience || 12420).toLocaleString()} XP</span>
                </div>
              </div>
            </div>

            <div className="pt-1 z-10">
              <button
                onClick={() => {
                  const cost = (state.nodeLevel || 1) * 200;
                  if (state.credits < cost) {
                    addLog(`EVOLUTION REJECTED: Need ${cost} BCC to evolve.`, 'warn');
                    return;
                  }
                  setState(prev => ({
                    ...prev,
                    credits: prev.credits - cost,
                    nodeLevel: (prev.nodeLevel || 1) + 1,
                    miningPower: prev.miningPower + 15,
                    nodeExperience: (prev.nodeExperience || 0) + 250
                  }));
                  addLog(`MOBILE DECK: Evolved Node to Level ${(state.nodeLevel || 1) + 1}!`, 'success');
                }}
                className="w-full py-2.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 text-[10px] rounded-xl font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                EVOLVE NODE ({(state.nodeLevel || 1) * 200} BCC)
              </button>
            </div>
          </div>

          {/* Quick Maintenance Card */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-4 space-y-4 flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] text-slate-500 uppercase block tracking-wider">CORE MAINTENANCE STATUS</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-bold text-slate-200">{temperature.toFixed(1)}°C</span>
                  <span className="text-[8px] text-emerald-400">NOMINAL</span>
                </div>
              </div>
              <Wind className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-2 py-3 border-y border-white/5">
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>CORE ENERGY MATRIX:</span>
                <span className="font-bold text-cyan-400">{state.energy}%</span>
              </div>
              <div className="h-1.5 bg-[#050506] border border-white/5 p-0.5 rounded-full overflow-hidden">
                <div style={{ width: `${state.energy}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setVenting(true);
                  setTemperature(35);
                  addLog("MOBILE DECK: Venting thermal core. Temperature dropped to 35°C.", "success");
                  setTimeout(() => setVenting(false), 2000);
                }}
                disabled={venting}
                className="py-2.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] rounded-xl font-bold uppercase tracking-wider cursor-pointer"
              >
                {venting ? "COOLING..." : "VENT RIG"}
              </button>
              <button
                onClick={() => {
                  if (state.energy >= 100) {
                    addLog("MOBILE DECK: Core already at maximum capacity.", "info");
                    return;
                  }
                  if (onOpenTollShop) {
                    addLog("PENNY PROTOCOL: 1¢ Spark Refill — opening Treasury toll shop.", "info");
                    onOpenTollShop();
                    return;
                  }
                  setState(prev => ({
                    ...prev,
                    energy: Math.min(100, prev.energy + 30)
                  }));
                  addLog("MOBILE DECK: Refuel secured (+30% Energy).", "success");
                }}
                className="py-2.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] rounded-xl font-bold uppercase tracking-wider cursor-pointer"
              >
                1¢ SPARK REFUEL
              </button>
            </div>
            {state.energy < 20 && onOpenTollShop && (
              <button
                type="button"
                onClick={() => onOpenTollShop()}
                className="w-full mt-2 py-2 rounded-xl bg-amber-400 text-slate-950 text-[10px] font-black font-mono uppercase tracking-wider cursor-pointer"
              >
                Critical fuel — buy 1¢ Spark Refill
              </button>
            )}
          </div>

          {/* Dynamic Check-in Rewards Card */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-4 space-y-4 flex flex-col justify-between md:col-span-2 min-h-[160px]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] text-slate-500 uppercase block tracking-wider">DAILY CHECK-IN GATEWAY</span>
                <h4 className="text-xs font-black text-slate-200 mt-0.5">SYNCHRONIZE DAILY NETWORK STATE</h4>
              </div>
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Perform simple daily attention check-ins to secure your neural data states. Instantly claims morning, lunch, and evening yields of BCC and Node XP.
            </p>

            <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center justify-between text-[11px]">
              <div>
                <span className="text-slate-500 text-[8px] block uppercase">SHIFT BONUS YIELD</span>
                <span className="text-amber-300 font-bold font-mono">+25 BCC & +50 XP</span>
              </div>
              <button
                onClick={() => {
                  setState(prev => ({
                    ...prev,
                    credits: prev.credits + 25,
                    nodeExperience: (prev.nodeExperience || 12420) + 50
                  }));
                  addLog("DAILY CHECK-IN: Synchronized attention yield on Solana network (+25 BCC, +50 XP).", "success");
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] tracking-wider rounded-xl uppercase cursor-pointer"
              >
                Claim Shift Yield
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Visual Miner Rig Box */}
          <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[580px]">
        {/* Futuristic Grid Overlays */}
        <div className="absolute inset-0 bg-cyber-grid bg-[size:24px_24px] opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40" />

        {/* Top Header Controls and Tab Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] font-mono text-slate-500 tracking-widest block">FACILITY RESEARCH & POWER UNIT</span>
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
                MINER_X1-QUANTUM
              </h3>
              <span className="text-[9px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded uppercase">
                CORESYNC v3.8
              </span>
              <button
                onClick={() => {
                  setShowRecalibrate(true);
                  setRecalibrateProgress(0);
                  setRecalibrateState('idle');
                  setRecalibrateCircleSize(0.6);
                  setRecalibrateBreathsDone(0);
                  setRecalibrateFeedback('Ready to recalibrate');
                }}
                className="text-[10px] font-mono bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 px-2.5 py-1 rounded-lg uppercase transition-all flex items-center gap-1.5 animate-pulse cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                RECALIBRATE MACHINE
              </button>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex bg-[#050506] border border-white/10 rounded-xl p-1 font-mono text-[10px] flex-wrap gap-0.5">
            <button
              onClick={() => setActiveLeftTab('living-miner')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeLeftTab === 'living-miner'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" /> LIVING MINER
            </button>
            <button
              onClick={() => setActiveLeftTab('schematic')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeLeftTab === 'schematic'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              DIAGNOSTIC
            </button>
            <button
              onClick={() => {
                setActiveLeftTab('coresync');
                // Auto-stop game on tab swap
                setBreathActive(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeLeftTab === 'coresync'
                  ? 'bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-fuchsia-400" /> BREATH
            </button>
            <button
              onClick={() => setActiveLeftTab('academy')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                activeLeftTab === 'academy'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> ACADEMY
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-[9px] font-mono text-slate-500 uppercase">RIG LED:</span>
            <div className="flex gap-1.5">
              {(['cyan', 'magenta', 'emerald', 'amber'] as const).map(color => (
                <button
                  key={color}
                  onClick={() => setRgbTheme(color)}
                  className={`w-3 h-3 rounded-full border transition-all ${
                    color === 'cyan' ? 'bg-cyan-500 border-cyan-400' :
                    color === 'magenta' ? 'bg-fuchsia-500 border-fuchsia-400' :
                    color === 'emerald' ? 'bg-emerald-500 border-emerald-400' :
                    'bg-amber-500 border-amber-400'
                  } ${rgbTheme === color ? 'ring-2 ring-white scale-110' : 'opacity-40 hover:opacity-80'}`}
                  title={`Change Rig Lighting: ${color.toUpperCase()}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Core Schematic View */}
        {activeLeftTab === 'schematic' && (
          <div className="my-8 flex justify-center items-center relative min-h-[340px]">
            {/* Steam / Vent visual effect */}
            {venting && (
              <div className="absolute inset-0 flex justify-around pointer-events-none z-20">
                <motion.div 
                  initial={{ opacity: 0, y: 150, scale: 0.8 }}
                  animate={{ opacity: [0, 0.6, 0], y: [-50, -250], scale: [1, 2.5], x: [0, -40] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                  className="w-16 h-16 rounded-full bg-slate-100/10 blur-xl"
                />
                <motion.div 
                  initial={{ opacity: 0, y: 150, scale: 0.8 }}
                  animate={{ opacity: [0, 0.7, 0], y: [-70, -280], scale: [1.2, 3], x: [0, 40] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                  className="w-20 h-20 rounded-full bg-slate-100/15 blur-2xl"
                />
              </div>
            )}

            {/* Core SVG Schematic */}
            <svg viewBox="0 0 400 340" className="w-full max-w-[420px] h-auto select-none z-10 overflow-visible">
              {/* Ambient Outer Ring */}
              <circle cx="200" cy="170" r="145" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4,8" />
              
              {/* Spinning cooling ring if Cooler is installed */}
              {hasCooler && (
                <motion.circle 
                  cx="200" 
                  cy="170" 
                  r="135" 
                  fill="none" 
                  stroke="#06b6d4" 
                  strokeWidth="1.5" 
                  strokeDasharray="40 10 20 50" 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* Drone orbiting the rig if Drone Dock is active */}
              {hasDock && (
                <g>
                  <circle cx="200" cy="170" r="155" fill="none" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="3,12" />
                  <motion.g
                    animate={{
                      x: [Math.cos(0)*155, Math.cos(Math.PI*0.5)*155, Math.cos(Math.PI)*155, Math.cos(Math.PI*1.5)*155, Math.cos(Math.PI*2)*155],
                      y: [Math.sin(0)*155, Math.sin(Math.PI*0.5)*155, Math.sin(Math.PI)*155, Math.sin(Math.PI*1.5)*155, Math.sin(Math.PI*2)*155]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    style={{ transformOrigin: '200px 170px' }}
                  >
                    <circle cx="200" cy="170" r="8" className="fill-fuchsia-500 shadow-lg animate-pulse" />
                    <path d="M196 170 H204 M200 166 V174" stroke="#ffffff" strokeWidth="1" />
                  </motion.g>
                </g>
              )}

              {/* Core Reactor Chamber Shield */}
              <rect x="130" y="80" width="140" height="180" rx="16" fill="#050506" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
              <rect x="126" y="76" width="148" height="188" rx="20" fill="none" className={`${activeColorClass}`} strokeWidth="1" opacity="0.3" />

              {/* Connector Lines (Circuits) */}
              <path d="M70 170 H130" stroke="#334155" strokeWidth="1.5" />
              <path d="M330 170 H270" stroke="#334155" strokeWidth="1.5" />
              <path d="M200 40 V80" stroke="#334155" strokeWidth="1.5" />
              <path d="M200 300 V260" stroke="#334155" strokeWidth="1.5" />

              {/* LEFT COMPONENT SLOT: GPU Module */}
              <g transform="translate(40, 140)">
                <rect width="60" height="60" rx="8" fill={hasGpu ? "#022c22" : "#0f172a"} stroke={hasGpu ? "#10b981" : "#1e293b"} strokeWidth="1.5" />
                {hasGpu ? (
                  <>
                    <rect x="6" y="6" width="48" height="48" rx="4" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3,1" />
                    <motion.path 
                      d="M12 30 H48 M20 15 L30 45" 
                      stroke="#059669" 
                      strokeWidth="2"
                      animate={{ strokeDashoffset: [0, -10] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                    {/* Glowing fan spinners */}
                    <motion.g animate={{ rotate: 360 }} style={{ transformOrigin: '30px 30px' }}>
                      <circle cx="30" cy="30" r="12" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="6,4" />
                    </motion.g>
                    <text x="30" y="52" fill="#10b981" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">GPU ON</text>
                  </>
                ) : (
                  <>
                    <path d="M20 20 H40 V40 H20 Z" fill="none" stroke="#334155" strokeWidth="1.5" />
                    <text x="30" y="48" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">GPU EMPTY</text>
                  </>
                )}
              </g>

              {/* RIGHT COMPONENT SLOT: AI Memory */}
              <g transform="translate(300, 140)">
                <rect width="60" height="60" rx="8" fill={hasMemory ? "#064e3b" : "#0f172a"} stroke={hasMemory ? "#06b6d4" : "#1e293b"} strokeWidth="1.5" />
                {hasMemory ? (
                  <>
                    <circle cx="30" cy="30" r="16" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
                    <motion.g animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <circle cx="30" cy="30" r="10" className="fill-cyan-500/30" />
                    </motion.g>
                    {/* Firing memory packet nodes */}
                    <circle cx="30" cy="18" r="2.5" fill="#22d3ee" />
                    <circle cx="18" cy="30" r="2.5" fill="#22d3ee" />
                    <circle cx="42" cy="30" r="2.5" fill="#22d3ee" />
                    <circle cx="30" cy="42" r="2.5" fill="#22d3ee" />
                    <text x="30" y="52" fill="#06b6d4" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MEM RDY</text>
                  </>
                ) : (
                  <>
                    <rect x="22" y="18" width="16" height="24" rx="2" fill="none" stroke="#334155" strokeWidth="1.5" />
                    <text x="30" y="48" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">MEM EMPTY</text>
                  </>
                )}
              </g>

              {/* TOP COMPONENT SLOT: Neural Accelerator / Automation Chip */}
              <g transform="translate(170, 10)">
                <rect width="60" height="36" rx="6" fill={hasAccel || hasChip ? "#1e1b4b" : "#0f172a"} stroke={hasAccel ? "#ec4899" : hasChip ? "#8b5cf6" : "#1e293b"} strokeWidth="1.5" />
                {hasAccel || hasChip ? (
                  <>
                    <path d="M10 18 H50 M20 8 V28 M40 8 V28" stroke={hasAccel ? "#ec4899" : "#8b5cf6"} strokeWidth="1.5" opacity="0.6" />
                    <circle cx="30" cy="18" r="6" fill="none" stroke={hasAccel ? "#f472b6" : "#a78bfa"} strokeWidth="1.5" />
                    <text x="30" y="30" fill={hasAccel ? "#ec4899" : "#8b5cf6"} fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ACCEL</text>
                  </>
                ) : (
                  <>
                    <text x="30" y="22" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">SLOT_A</text>
                  </>
                )}
              </g>

              {/* BOTTOM COMPONENT SLOT: Fusion Battery */}
              <g transform="translate(170, 290)">
                <rect width="60" height="36" rx="6" fill={hasBattery ? "#311005" : "#0f172a"} stroke={hasBattery ? "#f97316" : "#1e293b"} strokeWidth="1.5" />
                {hasBattery ? (
                  <>
                    <path d="M15 18 H45" stroke="#f97316" strokeWidth="2.5" />
                    <motion.path 
                      d="M30 8 L24 18 H36 L30 28" 
                      fill="none" 
                      stroke="#fdba74" 
                      strokeWidth="1.5"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                    <text x="30" y="32" fill="#f97316" fontSize="7" fontFamily="monospace" textAnchor="middle" fontWeight="bold">BATTERY</text>
                  </>
                ) : (
                  <>
                    <text x="30" y="22" fill="#475569" fontSize="7" fontFamily="monospace" textAnchor="middle">SLOT_B</text>
                  </>
                )}
              </g>

              {/* Core Plasma Chamber Reactor (The Center Fusion Node) */}
              <g transform="translate(155, 125)">
                {/* Warning rim when fuel critical */}
                {state.energy < 30 && (
                  <motion.circle
                    cx="45"
                    cy="45"
                    r={48}
                    fill="none"
                    stroke="rgba(249,115,22,0.55)"
                    strokeWidth="2"
                    animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.04, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                {/* Extra rings at higher reactor levels */}
                {Array.from({ length: ringCount }).map((_, i) => (
                  <motion.circle
                    key={`ring-${i}`}
                    cx="45"
                    cy="45"
                    r={38 + i * 5}
                    fill="none"
                    stroke={state.energy < 30 ? 'rgba(249,115,22,0.25)' : 'rgba(34,211,238,0.2)'}
                    strokeWidth="0.8"
                    strokeDasharray={`${4 + i * 2} ${6 + i}`}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: pulseDuration * (3 + i) * (state.energy < 25 ? 1.4 : 1), repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '45px 45px', opacity: 0.35 + energyNorm * 0.4 }}
                  />
                ))}
                <circle cx="45" cy="45" r="35" fill="#050506" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                
                {/* Glowing core graphics inside reactor */}
                <motion.circle 
                  cx="45" 
                  cy="45" 
                  r={26 * coreScale} 
                  className={`fill-none stroke-2 ${state.energy < 30 ? 'stroke-orange-500' : activeColorClass}`}
                  animate={{ 
                    scale: isOverclocked ? [1, 1.15, 1] : [1, 1.05 + energyNorm * 0.06, 1],
                    opacity: state.energy < 25
                      ? [0.25, 0.5, 0.25]
                      : isOverclocked
                        ? [0.8, 1, 0.8]
                        : [0.4 + energyNorm * 0.3, 0.75 + energyNorm * 0.2, 0.4 + energyNorm * 0.3]
                  }} 
                  transition={{ 
                    duration: pulseDuration, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }} 
                />

                {/* Plasma nodes pulsing */}
                <motion.circle 
                  cx="45" 
                  cy="45" 
                  r={isOverclocked ? 14 : 8 + energyNorm * 6} 
                  className={`${activeFillClass} stroke-1 ${state.energy < 30 ? 'stroke-orange-400' : activeColorClass}`}
                  animate={{ rotate: 360 }}
                  transition={{ duration: isOverclocked ? 1.5 : pulseDuration * 2, repeat: Infinity, ease: "linear" }}
                  strokeDasharray="12,4"
                />

                {/* Core fusion particle center */}
                <circle
                  cx="45"
                  cy="45"
                  r={4 + energyNorm * 3}
                  fill={state.energy < 30 ? '#fb923c' : '#ffffff'}
                  className="shadow-lg shadow-white/50 animate-ping"
                  style={{ opacity: 0.4 + energyNorm * 0.5 }}
                />
                <circle cx="45" cy="45" r="3" fill="#ffffff" />
              </g>

              {/* Glowing Pipeline streams feeding from side ports */}
              <motion.path 
                d="M100 170 H155" 
                fill="none" 
                stroke={hasGpu ? "#10b981" : "#1e293b"} 
                strokeWidth="2" 
                strokeDasharray="6,6"
                animate={{ strokeDashoffset: hasGpu ? [0, -12] : 0 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
              <motion.path 
                d="M300 170 H245" 
                fill="none" 
                stroke={hasMemory ? "#06b6d4" : "#1e293b"} 
                strokeWidth="2" 
                strokeDasharray="6,6"
                animate={{ strokeDashoffset: hasMemory ? [0, 12] : 0 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            </svg>
          </div>
        )}

        {/* Living NFT Character Profile & Evolution View */}
        {activeLeftTab === 'living-miner' && (
          <div className="my-6 flex-1 flex flex-col justify-between font-mono p-4 md:p-6 bg-[#050507] border border-teal-500/10 rounded-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1">
              {/* Featured miner NFT — static idle / looping when fuel is live */}
              <div className="md:col-span-5 flex flex-col gap-3 min-h-[300px]">
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono uppercase tracking-wider px-0.5">
                  <span>Featured rig NFT</span>
                  <span>
                    {miningLive
                      ? isOverclocked
                        ? 'Boost mining loop'
                        : 'Mining loop'
                      : 'Idle · refuel to animate'}
                  </span>
                </div>
                {featuredNft ? (
                  <NftCard
                    nft={featuredNft}
                    miningActive={miningLive}
                    boosted={isOverclocked}
                    footer={
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                        <span className="text-slate-400">
                          Node LVL {state.nodeLevel || 1} · {state.activeSkin || 'Genesis Slate'}
                        </span>
                        <span className={miningLive ? 'text-cyan-400' : 'text-amber-400'}>
                          Fuel {Math.round(state.energy)}%
                        </span>
                      </div>
                    }
                  />
                ) : (
                  <div className="flex-1 rounded-2xl border border-dashed border-white/15 bg-[#0a0a0f] p-6 flex flex-col items-center justify-center text-center">
                    <Cpu className="w-8 h-8 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">No owned miner NFT yet.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Mint one in Profile to see the mining feed here.</p>
                  </div>
                )}
              </div>

              {/* Character Attributes Panel */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                {/* Node Identity card */}
                <div className="space-y-3 bg-[#0a0a0f] border border-white/5 p-4 rounded-xl font-mono text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[9px] text-slate-500 block">EDIT NODE CALLSIGN:</span>
                      <input
                        type="text"
                        maxLength={15}
                        value={state.nodeName || 'NODE #48392'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setState(prev => ({ ...prev, nodeName: val }));
                        }}
                        className="bg-[#050506] border border-white/10 px-2.5 py-1 rounded-lg text-xs text-teal-400 font-bold focus:border-teal-500 focus:outline-none max-w-[150px]"
                      />
                    </div>
                    
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block">KNOWLEDGE PROGRESS:</span>
                      <span className="font-bold text-slate-200">{(state.nodeExperience || 12420).toLocaleString()} XP</span>
                    </div>
                  </div>

                  {/* Level Up Button */}
                  <div className="bg-[#050506] border border-white/5 p-3 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">EVOLVE REACTOR CORE</span>
                      <span className="text-amber-400 font-bold">{(state.nodeLevel || 1) * 200} BCC REQUIRED</span>
                    </div>
                    <button
                      onClick={() => {
                        const cost = (state.nodeLevel || 1) * 200;
                        if (state.credits < cost) {
                          addLog(`EVOLUTION REJECTED: Insufficient BCC. Need ${cost} BCC for next phase.`, 'warn');
                          return;
                        }
                        setState(prev => ({
                          ...prev,
                          credits: prev.credits - cost,
                          nodeLevel: (prev.nodeLevel || 1) + 1,
                          miningPower: prev.miningPower + 15,
                          nodeExperience: (prev.nodeExperience || 0) + 250
                        }));
                        addLog(`CONGRATULATIONS: Node evolved to Level ${(state.nodeLevel || 1) + 1}! Baseline Output expanded (+15 PH/s).`, 'success');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-black font-black text-[10px] tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-teal-500/10 uppercase"
                    >
                      Evolve Level
                    </button>
                  </div>
                </div>

                {/* AI Node Personality selection */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 block font-bold tracking-widest uppercase">AI COGNITIVE PERSONALITY LAYER:</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { id: 'Scholar AI' as const, icon: '🧠', desc: '+15% Learning Efficiency' },
                      { id: 'Rogue Agent' as const, icon: '🥷', desc: '+10% PH/s Output Power' },
                      { id: 'Zen Master' as const, icon: '☯', desc: '+20% Breathing Range' },
                      { id: 'Industrial Matrix' as const, icon: '🦾', desc: '+15% Hardware Multipliers' }
                    ].map((p) => {
                      const isActive = state.nodePersonality === p.id || (!state.nodePersonality && p.id === 'Scholar AI');
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setState(prev => ({ ...prev, nodePersonality: p.id }));
                            addLog(`COGNITIVE RECONFIGURED: Personality layer adapted to "${p.id}". Core traits loaded.`, 'success');
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isActive 
                              ? 'bg-teal-950/20 border-teal-500/50 text-teal-300' 
                              : 'bg-black border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{p.icon}</span>
                            <span>{p.id}</span>
                          </div>
                          <span className="text-[8px] text-slate-400 block mt-1">{p.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* NFT Skins Gallery */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 block font-bold tracking-widest uppercase">CORESYNC NFT SKINS HARBOUR:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    {[
                      { id: 'Genesis Slate', price: 0 },
                      { id: 'Obsidian Gold', price: 300 },
                      { id: 'Holographic Fusion', price: 500 },
                      { id: 'Cosmic Stardust', price: 800 }
                    ].map((s) => {
                      const unlocked = (state.unlockedSkins || ['Genesis Slate']).includes(s.id);
                      const isActive = state.activeSkin === s.id || (!state.activeSkin && s.id === 'Genesis Slate');
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            if (!unlocked) {
                              // Trigger purchase
                              if (state.credits < s.price) {
                                addLog(`TRANSACTION LOCKED: Insufficient BCC to buy "${s.id}". Need ${s.price} BCC.`, 'warn');
                                return;
                              }
                              setState(prev => ({
                                ...prev,
                                credits: prev.credits - s.price,
                                unlockedSkins: [...(prev.unlockedSkins || ['Genesis Slate']), s.id],
                                activeSkin: s.id
                              }));
                              addLog(`SKIN UNLOCKED: Acquired and activated "${s.id}"! Ledger updated.`, 'success');
                            } else {
                              setState(prev => ({ ...prev, activeSkin: s.id }));
                              addLog(`LEDGER SYNC: Selected core skin changed to "${s.id}".`, 'info');
                            }
                          }}
                          className={`p-2 rounded-xl border flex flex-col justify-between min-h-[64px] transition-all text-center ${
                            isActive 
                              ? 'bg-teal-950/25 border-teal-500/60 text-teal-400 font-bold' 
                              : unlocked 
                                ? 'bg-[#0a0a0f] border-white/10 text-slate-300 hover:border-white/20' 
                                : 'bg-[#050506] border-white/5 text-slate-500 hover:border-white/10'
                          }`}
                        >
                          <span className="text-[8px] block uppercase truncate">{s.id}</span>
                          <span className="text-[9px] font-bold mt-1.5 font-mono">
                            {isActive ? 'ACTIVE' : unlocked ? 'EQUIP' : `${s.price} BCC`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
            
            <div className="border-t border-white/5 pt-3.5 mt-5 text-[9px] text-slate-500 text-center uppercase tracking-widest">
              Living NFT Node evolution operates securely under Solana metadata pipeline.
            </div>
          </div>
        )}

        {/* CoreSync Zen Breath Game View */}
        {activeLeftTab === 'coresync' && (
          <div className="my-6 flex-1 flex flex-col justify-between font-mono p-4 bg-[#050507] border border-fuchsia-500/10 rounded-2xl relative">
            {/* Ambient breathing circles overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <div className="w-80 h-80 rounded-full border border-fuchsia-400 animate-pulse" />
              <div className="absolute w-60 h-60 rounded-full border border-cyan-400 animate-ping" style={{ animationDuration: '6s' }} />
            </div>

            <div className="space-y-4 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-fuchsia-400 flex items-center gap-1.5 uppercase">
                    <Flame className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                    COGNITIVE SYNCHRONICITY TUNER
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-md">
                    Synchronize neural focus vectors by aligning your pressure node with the cosmic sine-wave oscillation.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase">COHERENCE</span>
                  <span className={`text-lg font-bold ${breathScore >= 72 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                    {breathScore}%
                  </span>
                </div>
              </div>

              {/* Rhythmic Breathing Prompt Banner */}
              <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-fuchsia-500/10 flex items-center justify-center">
                    <Sparkles className={`w-4 h-4 text-fuchsia-400 ${breathActive ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">TUNING DIRECTIVE</span>
                    <span className="font-bold text-slate-200">
                      {!breathActive 
                        ? 'TUNE_CORE: READY TO INITIATE SEQUENCE' 
                        : (breathTarget > 50 ? '▲ INHALE STAGE: BUILD PRESSURE' : '▼ EXHALE STAGE: RELEASE VALVE')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-cyan-300">{breathTimer}S REMAINING</span>
                </div>
              </div>

              {/* Oscillating target alignment container */}
              <div className="relative h-28 bg-[#020204] border border-white/10 rounded-2xl flex flex-col justify-center p-4 overflow-hidden">
                {/* Horizontal reference grid lines */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/5" />
                <div className="absolute inset-x-0 top-1/4 h-[1px] bg-white/5" />
                <div className="absolute inset-x-0 bottom-1/4 h-[1px] bg-white/5" />

                {/* Oscillating target bar */}
                <div 
                  style={{ left: `${breathTarget}%` }}
                  className="absolute top-4 bottom-4 w-10 -ml-5 bg-fuchsia-500/10 border-l border-r border-fuchsia-500/30 flex items-center justify-center transition-all duration-75"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_12px_#ec4899] animate-ping" />
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="absolute bottom-1 text-[8px] text-fuchsia-400 font-bold uppercase">TARGET</span>
                </div>

                {/* User pressure node */}
                <div 
                  style={{ left: `${userVal}%` }}
                  className="absolute top-4 bottom-4 w-8 -ml-4 flex items-center justify-center transition-all duration-75 z-20"
                >
                  <div className="w-4 h-4 rounded-full bg-cyan-400 border border-white shadow-[0_0_15px_#22d3ee] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  </div>
                  <span className="absolute top-1 text-[8px] text-cyan-400 font-bold uppercase">YOU</span>
                </div>

                {/* Coherence range brackets overlay */}
                <div className="absolute top-2 left-4 text-[8px] text-slate-500 uppercase tracking-widest">
                  MIN [0%]
                </div>
                <div className="absolute top-2 right-4 text-[8px] text-slate-500 uppercase tracking-widest">
                  MAX [100%]
                </div>
              </div>
            </div>

            {/* Action buttons and calibration instructions */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4 z-10">
              {!breathActive ? (
                <button
                  onClick={() => {
                    setBreathTimer(15);
                    setBreathScore(100);
                    setUserVal(50);
                    setBreathTarget(50);
                    setPhaseTime(0);
                    setTicksInTarget(0);
                    setTotalTicks(0);
                    setBreathResult(null);
                    setBreathActive(true);
                    addLog("CORESYNC INTERFACE INITIALIZED: Initiating rhythm oscillation diagnostics.", "system");
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-600 hover:from-fuchsia-400 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-fuchsia-500/20"
                >
                  <Play className="w-4 h-4 fill-white" />
                  START CORESYNC GAME
                </button>
              ) : (
                <button
                  onMouseDown={() => setIsPressing(true)}
                  onMouseUp={() => setIsPressing(false)}
                  onMouseLeave={() => setIsPressing(false)}
                  onTouchStart={() => setIsPressing(true)}
                  onTouchEnd={() => setIsPressing(false)}
                  className={`w-full sm:w-auto px-10 py-4 rounded-xl text-black font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 select-none active:scale-95 transition-all cursor-pointer ${
                    isPressing 
                      ? 'bg-amber-300 shadow-[0_0_20px_rgba(252,211,77,0.6)]' 
                      : 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isPressing ? 'animate-bounce text-amber-900' : 'text-cyan-900'}`} />
                  {isPressing ? 'HOLDING PRESSURE (INCREASING)' : 'PRESS AND HOLD (VALVE OPEN)'}
                </button>
              )}

              <div className="flex-1 text-[10px] text-slate-500 leading-relaxed">
                {breathResult === 'success' && (
                  <span className="text-emerald-400 font-bold block animate-pulse">
                    COHERENT STABILIZATION SECURED! +30% Core Energy, +250 CP rewarded.
                  </span>
                )}
                {breathResult === 'failed' && (
                  <span className="text-rose-400 font-bold block">
                    COHERENT SEQUENCE CRASHED. Core alignment too low. Try again!
                  </span>
                )}
                {!breathResult && (
                  <span>
                    * INSTRUCTIONS: Hold the button down to increase your pressure meter (blue cursor) towards the right, or release to let it slide left. Keep it aligned with the oscillating target (pink zone) to raise coherence level above 72% before time runs out.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quantum Academy View */}
        {activeLeftTab === 'academy' && (
          <div className="my-4 flex-1 flex flex-col justify-between font-mono p-4 bg-[#050507] border border-amber-500/10 rounded-2xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    QUANTUM COGNITIVE ACADEMY
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Synthesize critical learning vectors to expand quantum facility performance metrics.
                  </p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] px-2.5 py-1 rounded-lg">
                  {completedLessons.length} / 3 GRADUATED
                </div>
              </div>

              {/* Main lessons split layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {QUANTUM_LESSONS.map((lesson, idx) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  const isActive = activeLessonIdx === idx;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setActiveLessonIdx(idx);
                        setLessonSimState('idle');
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between h-28 ${
                        isActive 
                          ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                          : 'bg-[#09090b] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center text-[8px] text-slate-500 mb-1">
                          <span>MODULE L-0{idx + 1}</span>
                          {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <h5 className={`text-[11px] font-bold tracking-tight leading-tight ${isActive ? 'text-amber-300' : 'text-slate-200'}`}>
                          {lesson.title}
                        </h5>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-2 truncate">
                        {lesson.perk}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Lesson details & interactive "proof of work" exercise simulation */}
              {activeLessonIdx !== null ? (
                <div className="bg-[#09090c] border border-white/10 rounded-xl p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[9px] text-slate-600">
                    STATUS: {completedLessons.includes(QUANTUM_LESSONS[activeLessonIdx].id) ? 'SECURED_ON_CHAIN' : 'PENDING_COGNITIVE_PROOF'}
                  </div>
                  
                  <h5 className="text-xs font-bold text-slate-200">
                    {QUANTUM_LESSONS[activeLessonIdx].title}
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {QUANTUM_LESSONS[activeLessonIdx].synopsis}
                  </p>

                  <div className="border-t border-white/5 pt-3 mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[9px] text-slate-500 uppercase block">LESSON PERK UNLOCKED:</span>
                      <span className="text-[10px] text-amber-300 font-bold">{QUANTUM_LESSONS[activeLessonIdx].perk}</span>
                    </div>

                    {/* Interactive Proof Of Work Mechanics */}
                    <div className="flex items-center gap-3">
                      {/* Lesson 1: Progress simulation */}
                      {QUANTUM_LESSONS[activeLessonIdx].id === 'l1' && (
                        <div>
                          {lessonSimState === 'idle' && (
                            <button
                              onClick={() => handleStartLessonSimulation('l1')}
                              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                            >
                              DEPLOY COHERENCE SHIELD
                            </button>
                          )}
                          {lessonSimState === 'running' && (
                            <span className="text-[10px] text-amber-400 flex items-center gap-2 animate-pulse uppercase font-bold">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> SHIELDING COGNITIVE SPACE...
                            </span>
                          )}
                          {lessonSimState === 'success' && (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
                              <CheckCircle className="w-4 h-4" /> superpositions stabilized!
                            </span>
                          )}
                        </div>
                      )}

                      {/* Lesson 2: Spin coherence Alignment puzzle */}
                      {QUANTUM_LESSONS[activeLessonIdx].id === 'l2' && (
                        <div className="flex items-center gap-3">
                          {lessonSimState === 'idle' && (
                            <button
                              onClick={() => handleStartLessonSimulation('l2')}
                              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                            >
                              CALIBRATE COHERENT SPINS
                            </button>
                          )}
                          {lessonSimState === 'running' && (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="text-[9px] text-amber-400 block uppercase font-bold">FLIP TO SPIN COHERENCE UP (▲):</span>
                              <div className="flex gap-2">
                                {spinDirections.map((dir, i) => (
                                  <button
                                    key={i}
                                    onClick={() => flipSpin(i)}
                                    className={`w-7 h-7 rounded border font-bold text-[10px] flex items-center justify-center transition-all ${
                                      dir ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' : 'bg-rose-950/40 border-rose-500/50 text-rose-400'
                                    }`}
                                  >
                                    {dir ? '▲' : '▼'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {lessonSimState === 'success' && (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
                              <CheckCircle className="w-4 h-4" /> ALL SPINS ALIGNED UP!
                            </span>
                          )}
                        </div>
                      )}

                      {/* Lesson 3: ZK Hashing simulator */}
                      {QUANTUM_LESSONS[activeLessonIdx].id === 'l3' && (
                        <div>
                          {lessonSimState === 'idle' && (
                            <button
                              onClick={() => handleStartLessonSimulation('l3')}
                              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                            >
                              COMPILE ZK PROOF
                            </button>
                          )}
                          {lessonSimState === 'running' && (
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[8px] text-slate-500">
                                <span>COMPILING COGNITIVE HASH</span>
                                <span>{hashProgress}%</span>
                              </div>
                              <div className="h-2.5 bg-[#020204] border border-white/5 rounded-full overflow-hidden p-0.5">
                                <div style={{ width: `${hashProgress}%` }} className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-150" />
                              </div>
                            </div>
                          )}
                          {lessonSimState === 'success' && (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 uppercase">
                              <CheckCircle className="w-4 h-4" /> proof published securely!
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#09090c] border border-white/5 rounded-xl p-6 text-center text-slate-500 text-[10px] uppercase tracking-wider">
                  Select a learning module above to calibrate your cognitive superpositions.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnostic Status Footer Panel inside visualization */}
        <div className="border-t border-slate-800/80 pt-4 mt-2 flex flex-wrap justify-between items-center gap-4 z-10 text-xs font-mono">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Thermometer className={`w-4 h-4 ${temperature > 75 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-slate-400">CORE TEMP:</span>
              <span className={`font-semibold ${temperature > 75 ? 'text-red-400' : temperature > 55 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {temperature.toFixed(1)}°C
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">VENTING:</span>
              <span className={venting ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}>
                {venting ? 'ACTIVE' : 'READY'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#050506] px-2.5 py-1 rounded-lg border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] text-slate-400 tracking-wider">DIAGNOSTICS NOMINAL</span>
          </div>
        </div>
      </div>

      {/* Control Panel Sidebar */}
      <div className="flex flex-col gap-6">
        {/* Overclock Controller Module */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <h4 className="text-xs font-mono font-bold tracking-widest text-cyan-400 mb-3.5 flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            NODE POWER MATRIX
          </h4>

          <div className="space-y-4 font-mono">
            {/* Status readouts */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#050506] p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-500 block">TOTAL OUTPUT</span>
                <span className="text-sm font-bold text-slate-100">{activeMiningPower} PH/s</span>
              </div>
              <div className="bg-[#050506] p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-500 block">EFFICIENCY</span>
                <span className="text-sm font-bold text-emerald-400">
                  x{(state.efficiency * (isOverclocked ? 1.5 : 1.0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Overclock trigger */}
            <button
              onClick={handleOverclockToggle}
              className={`w-full py-3 rounded-xl font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isOverclocked
                  ? 'bg-red-950/40 hover:bg-red-900/30 border border-red-500/50 text-red-200'
                  : 'bg-cyan-950/40 hover:bg-cyan-900/30 border border-cyan-500/30 text-cyan-200'
              }`}
            >
              <Zap className={`w-4 h-4 ${isOverclocked ? 'animate-pulse' : ''}`} />
              {isOverclocked ? 'DISABLE BOOST MODE (1.5x)' : 'ENABLE BOOST MODE (1.5x)'}
            </button>

            {/* Vent thermal system */}
            <button
              onClick={handleVentHeat}
              disabled={venting}
              className={`w-full py-3 rounded-xl font-mono text-xs font-bold tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                venting
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                  : 'bg-[#050506] hover:bg-white/[0.03] border-white/10 text-slate-300'
              }`}
            >
              <Wind className={`w-4 h-4 ${venting ? 'animate-spin' : ''}`} />
              {venting ? 'COOLING DOWN SYSTEM...' : 'VENT REACTOR (COOL RIG)'}
            </button>

            <div className="text-[10px] text-slate-500 leading-relaxed text-center px-1">
              * Boost mode increases your mining rate by 50% but burns core energy faster. Vent the reactor regularly to maintain stable temperatures.
            </div>
          </div>
        </div>

        {/* Live System Log Box */}
        <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-lg flex-1 flex flex-col justify-between max-h-[360px] lg:max-h-[none]">
          <div>
            <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              NODE STATE SYSTEM LOGS
            </h4>

            {/* Log rolling elements */}
            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1.5 font-mono text-[11px] scrollbar-thin">
              {logs.slice(-6).map((log, i) => (
                <div key={i} className="border-l-2 border-white/10 pl-2 py-0.5">
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>{log.timestamp}</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-500' :
                      log.type === 'warn' ? 'text-amber-500 animate-pulse' :
                      log.type === 'system' ? 'text-cyan-500' : 'text-slate-400'
                    }>[{log.type.toUpperCase()}]</span>
                  </div>
                  <div className="text-slate-300 leading-tight mt-0.5">{log.message}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-4 text-[10px] text-slate-500 font-mono text-center flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            SECURED REAL-TIME SYNC PROTOCOL
          </div>
        </div>
      </div>
      </div>
      )}

      {/* MINER_X1-QUANTUM ZEN RECALIBRATION MODAL */}
      <AnimatePresence>
        {showRecalibrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#020204]/95 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0a0a0c] border-2 border-amber-500/30 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)]"
            >
              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-cyber-grid bg-[size:16px_16px] opacity-10 pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

              <div className="flex justify-between items-center border-b border-white/5 pb-4 relative z-10 font-mono">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-400 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                      MINER_X1 CALIBRATOR
                    </h3>
                    <span className="text-[10px] text-amber-500 font-bold block uppercase tracking-widest">
                      ZEN-BREATH ALIGNMENT OVERRIDE
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowRecalibrate(false)}
                  className="text-slate-500 hover:text-slate-300 transition-colors font-bold text-xs hover:bg-white/5 px-2 py-1 rounded cursor-pointer"
                >
                  CLOSE
                </button>
              </div>

              {recalibrateState === 'idle' ? (
                <div className="space-y-6 relative z-10 text-center font-mono py-4">
                  <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
                    <RefreshCw className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-200">MACHINE RECALIBRATION REQUIRED</h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto font-sans">
                      The MINER_X1-QUANTUM core thermal balance has drifted out of zen harmonics. Calibrate the focus vector arrays by executing 3 synchronous breathing and pressure loops.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setRecalibrateState('inhale');
                      setRecalibrateCircleSize(0.6);
                      setRecalibrateBreathsDone(0);
                      setRecalibrateProgress(0);
                      setRecalibrateFeedback('HOLD button to INHALE & expand...');
                    }}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl tracking-widest uppercase transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    INITIATE ZEN CALIBRATION
                  </button>
                </div>
              ) : recalibrateState === 'success' ? (
                <div className="space-y-6 relative z-10 text-center font-mono py-4">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">AI INSPECTION COMPLETE</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto font-sans">
                      Quantum core aligned successfully. Thermal sensors locked to absolute zero. Mining and processing protocols have been authorized.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#050506] border border-white/5 p-3 rounded-xl max-w-xs mx-auto text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[9px]">ENERGY</span>
                      <span className="text-emerald-400 font-bold font-mono">+20%</span>
                    </div>
                    <div className="border-x border-white/5">
                      <span className="text-slate-500 block text-[9px]">REWARDS</span>
                      <span className="text-amber-400 font-bold font-mono">+150 CP</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">EFFICIENCY</span>
                      <span className="text-cyan-400 font-bold font-mono">+0.05x</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // Apply actual rewards!
                      setState(prev => ({
                        ...prev,
                        energy: Math.min(100, prev.energy + 20),
                        credits: prev.credits + 150,
                        efficiency: parseFloat((prev.efficiency + 0.05).toFixed(3))
                      }));
                      addLog("AI Inspection Complete", "success");
                      addLog("Mining Approved: MINER_X1-QUANTUM core harmonics locked to 432Hz.", "success");
                      setShowRecalibrate(false);
                    }}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl tracking-widest uppercase transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    APPLY LEDGER CALIBRATION
                  </button>
                </div>
              ) : (
                <div className="space-y-6 relative z-10 font-mono">
                  {/* Visual Progress Header */}
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>PROGRESS: {recalibrateProgress}%</span>
                    <span className="text-amber-400 uppercase font-black">
                      CYCLES: {recalibrateBreathsDone} / 3
                    </span>
                  </div>
                  <div className="h-2 bg-[#050506] rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                      animate={{ width: `${recalibrateProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Big Interactive Calibration Stage */}
                  <div className="h-60 bg-[#050506] border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    {/* Visual Target Area (80% - 120%) */}
                    <div 
                      className={`absolute w-36 h-36 rounded-full border-2 border-dashed transition-all duration-300 flex items-center justify-center ${
                        recalibrateState === 'inhale' 
                          ? 'border-cyan-500/30 bg-cyan-500/[0.02]' 
                          : 'border-amber-500/30 bg-amber-500/[0.02]'
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 uppercase">
                        {recalibrateState === 'inhale' ? 'Inhale target' : 'Exhale target'}
                      </span>
                    </div>

                    {/* Outer alignment rings */}
                    <div className="absolute w-44 h-44 rounded-full border border-white/5 animate-ping opacity-25" />

                    {/* Expanding/Contracting Zen Core */}
                    <motion.div
                      style={{ scale: recalibrateCircleSize }}
                      className={`w-28 h-28 rounded-full flex items-center justify-center relative ${
                        recalibrateState === 'inhale'
                          ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-[0_0_30px_rgba(6,182,212,0.4)]'
                          : 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                      }`}
                      animate={{
                        boxShadow: isPressingRecalibrate
                          ? '0 0 50px rgba(6,182,212,0.6)'
                          : '0 0 20px rgba(245,158,11,0.2)'
                      }}
                      transition={{ duration: 0.1 }}
                    >
                      <span className="text-[10px] text-slate-950 font-black tracking-widest text-center px-2">
                        {Math.round(recalibrateCircleSize * 100)}%
                      </span>
                    </motion.div>
                  </div>

                  {/* Subtitle status readout */}
                  <div className="text-center">
                    <span className="text-[11px] text-slate-300 uppercase tracking-wider block font-bold">
                      {recalibrateFeedback}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase block mt-1">
                      {recalibrateState === 'inhale' 
                        ? 'Hold button to expand central core to target size'
                        : 'Release button to contract core back to standby size'}
                    </span>
                  </div>

                  {/* Interactive Input Trigger */}
                  <div className="pt-2">
                    <button
                      onMouseDown={() => setIsPressingRecalibrate(true)}
                      onMouseUp={() => setIsPressingRecalibrate(false)}
                      onMouseLeave={() => setIsPressingRecalibrate(false)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        setIsPressingRecalibrate(true);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        setIsPressingRecalibrate(false);
                      }}
                      className={`w-full py-4 rounded-xl font-mono text-xs font-black tracking-widest transition-all select-none cursor-pointer ${
                        isPressingRecalibrate
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                          : 'bg-[#050506] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                      }`}
                    >
                      {recalibrateState === 'inhale' ? 'HOLD TO INHALE (EXPAND CORE)' : 'RELEASE TO EXHALE (CONTRACT CORE)'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
