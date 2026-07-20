/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Attention Academy room: Verification Terminal + Attention Intelligence Module.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cpu,
  Brain,
  Send,
  Database,
  Sparkles,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import { GameState } from '../types';
import AttentionAcademy from './AttentionAcademy';
import SignalDesk from './SignalDesk';
import { isFirstRitualPending } from '../lib/first-run';
import { SLOGANS } from '../lib/brand-slogans';
import LivingAmbient from './fx/LivingAmbient';

interface ResearchLabProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onOpenRoadmap?: () => void;
  onFirstRitualComplete?: (detail?: { from: number; to: number }) => void;
  onAwarenessSessionComplete?: (sessionId: string) => void;
  onOpenTollShop?: (sku?: 'academy_retake' | 'spark_refill') => void;
  onOpenVoid?: (draft?: string) => void;
  onRequestFocus?: (on: boolean) => void;
  onZenDecision?: (decision: 'hold_knowledge' | 'convert_fuel') => void;
}

interface SavedSession {
  id: string;
  topic: string;
  category: string;
  duration: number;
  creditsEarned: number;
  timestamp: string;
}

export default function ResearchLab({
  state,
  setState,
  addLog,
  onOpenRoadmap,
  onFirstRitualComplete,
  onAwarenessSessionComplete,
  onOpenTollShop,
  onOpenVoid,
  onRequestFocus,
  onZenDecision,
}: ResearchLabProps) {
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Rust & Solana');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [successResult, setSuccessResult] = useState(false);
  const [activeTab, setActiveTab] = useState<'verify' | 'academy'>('academy');
  const ritualPending = isFirstRitualPending();

  const [history, setHistory] = useState<SavedSession[]>([
    {
      id: '1',
      topic: 'Smart Contract Rent Optimization',
      category: 'Rust & Solana',
      duration: 45,
      creditsEarned: 320,
      timestamp: '10:14 AM',
    },
    {
      id: '2',
      topic: 'Ethereum Layer-2 Block Compressors',
      category: 'AI & Data Science',
      duration: 30,
      creditsEarned: 240,
      timestamp: 'Yesterday',
    },
  ]);

  const scanLogs = [
    'INITIATING STUDY PROOF VERIFICATION...',
    'SCANNING CONTENT KEYWORDS AND CONCEPTS...',
    'CONFIRMING ACADEMIC ENGAGEMENT FACTORS...',
    'CORRELATING STUDY SESSION STUDY LENGTH...',
    'VALIDATING FOCUS PROOF ON DECENTRALIZED POOLS...',
    'SYNCING TO DEVNET LEDGER...',
  ];

  useEffect(() => {
    if (!scanning) return;
    if (scanStep < scanLogs.length) {
      const timer = setTimeout(() => setScanStep((prev) => prev + 1), 450);
      return () => clearTimeout(timer);
    }
    setScanning(false);
    setSuccessResult(true);
    const bonusCredits = 320;
    const energyAdd = 18;
    const efficiencyAdd = 0.2;
    setState((prev) => ({
      ...prev,
      energy: Math.min(100, prev.energy + energyAdd),
      efficiency: parseFloat((prev.efficiency + efficiencyAdd).toFixed(3)),
      credits: prev.credits + bonusCredits,
    }));
    setHistory((prev) => [
      {
        id: Date.now().toString(),
        topic: topic || 'Quantum Machine Learning',
        category,
        duration: Math.floor(Math.random() * 40) + 20,
        creditsEarned: bonusCredits,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);
    addLog(
      `LOCAL SCAN: "${topic || 'Quantum Machine Learning'}". +18 Energy, +320 CP (cosmetic ledger — Academy sessions use agent verify).`,
      'success'
    );
  }, [scanning, scanStep]);

  const handleStartInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    setScanStep(0);
    setScanning(true);
    setSuccessResult(false);
  };

  return (
    <div id="research-room" className="space-y-6">
      <header
        className={`relative overflow-hidden rounded-2xl border p-5 md:p-6 mb-2 ${
          ritualPending
            ? 'border-cyan-400/40 bg-gradient-to-br from-[#0a1218]/95 via-[#08060a] to-amber-950/30 shadow-[0_0_48px_rgba(34,211,238,0.12)]'
            : 'border-amber-400/25 bg-gradient-to-br from-[#141008]/95 via-[#08060a] to-cyan-950/35'
        }`}
      >
        <div className="absolute inset-0 bg-cyber-grid opacity-25" />
        <LivingAmbient intensity="soft" />
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute -left-10 bottom-0 w-44 h-44 rounded-full bg-cyan-500/15 blur-3xl" />
        {ritualPending && (
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 via-amber-400/80 to-transparent" />
        )}
        <div className="relative z-10">
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-amber-300/90">
            {ritualPending
              ? "We're here for attention · cold start"
              : 'Attention → Proof → Fuel → Node'}
          </p>
          <h2 className="font-display mt-2 text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
            {ritualPending ? 'First Spark' : 'Proof of Attention'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-300/90 max-w-xl leading-relaxed">
            {ritualPending
              ? `${SLOGANS.firstSpark} ${SLOGANS.firstSparkSupport} Bias check + one honest line — contribution becomes visible when Proof of Attention lands.`
              : 'Verified attention refills knowledge fuel. Complete sessions. Name your hooks. Zen-decide. Mining wakes when attention is live.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-wider">
            {ritualPending ? (
              <>
                <span className="px-2 py-1 rounded-md border border-cyan-400/30 bg-cyan-500/10 text-cyan-200">
                  Proof of Attention
                </span>
                <span className="px-2 py-1 rounded-md border border-white/12 bg-white/5 text-slate-300">
                  Not empty hashes
                </span>
                <span className="px-2 py-1 rounded-md border border-amber-400/25 bg-amber-500/10 text-amber-100">
                  ~2 min
                </span>
              </>
            ) : (
              <>
                <span className="px-2 py-1 rounded-md border border-amber-400/30 bg-amber-500/10 text-amber-100">
                  Academy
                </span>
                <span className="px-2 py-1 rounded-md border border-cyan-400/25 bg-cyan-500/10 text-cyan-200">
                  Mind ↔ Machine
                </span>
                <span className="px-2 py-1 rounded-md border border-white/12 bg-white/5 text-slate-300">
                  Fuel your node
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {!ritualPending && (
        <SignalDesk
          addLog={addLog}
          onOpenVoid={onOpenVoid}
          onOpenAcademy={() => setActiveTab('academy')}
        />
      )}

      {!ritualPending && (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('academy')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
            activeTab === 'academy'
              ? 'border-amber-400/55 bg-amber-500/20 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.18)]'
              : 'border-white/12 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          Academy
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('verify')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
            activeTab === 'verify'
              ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100'
              : 'border-white/12 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Quick scan
        </button>
      </div>
      )}

      <AnimatePresence mode="wait">
        {(ritualPending || activeTab === 'academy') ? (
          <motion.div
            key="academy-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AttentionAcademy
              state={state}
              setState={setState}
              addLog={addLog}
              onOpenRoadmap={onOpenRoadmap}
              onFirstRitualComplete={onFirstRitualComplete}
              onAwarenessSessionComplete={onAwarenessSessionComplete}
              onOpenTollShop={onOpenTollShop}
              onRequestFocus={onRequestFocus}
              onZenDecision={onZenDecision}
            />
          </motion.div>
        ) : (
          <motion.div
            key="verify-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-[#0c1018]/95 via-[#08060a] to-cyan-950/40 p-6 shadow-xl">
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-cyan-400/15 blur-3xl" />
              <div className="absolute left-1/4 -bottom-16 w-36 h-36 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="relative z-10">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-cyan-300/90 mb-2">
                  Local practice · not on-chain PoA
                </p>
                <h3 className="font-display text-xl md:text-2xl font-extrabold italic text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" /> Quick study scan
                </h3>
                <p className="text-sm text-slate-400 mt-1.5 mb-4 max-w-lg leading-relaxed">
                  Drop a short summary of what you studied. Real Proof of Attention — verify + Devnet seal — lives in Academy.
                </p>

                {successResult ? (
                  <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-6 text-center space-y-3">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="font-display text-lg italic font-bold text-emerald-100">Local scan recorded</p>
                    <button
                      type="button"
                      onClick={() => {
                        setTopic('');
                        setSummary('');
                        setSuccessResult(false);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> New entry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleStartInspection} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono text-amber-300/80 uppercase tracking-wider block mb-1.5">
                        1. Topic studied
                      </label>
                      <input
                        className="w-full bg-black/45 border border-white/12 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-amber-400/40 focus:outline-none"
                        placeholder="e.g. Solana Program Deserialization Hacks"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-amber-300/80 uppercase tracking-wider block mb-1.5">
                        2. Category
                      </label>
                      <select
                        className="w-full bg-black/45 border border-white/12 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:border-amber-400/40 focus:outline-none"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="Rust & Solana">Rust & Solana Protocol</option>
                        <option value="AI & Data Science">AI & Cognitive Science</option>
                        <option value="Zero Knowledge Proofs">Cryptography & ZKProofs</option>
                        <option value="Full Stack Dev">Hardware Assembly & IOT</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-amber-300/80 uppercase tracking-wider block mb-1.5">
                        3. Study brief
                      </label>
                      <textarea
                        className="w-full bg-black/45 border border-white/12 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 min-h-[100px] placeholder:text-slate-600 focus:border-amber-400/40 focus:outline-none"
                        placeholder="Provide a brief summary (at least 15 characters)"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        required
                        minLength={15}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={scanning || summary.trim().length < 15}
                      className="w-full py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_28px_rgba(251,191,36,0.28)]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {scanning
                        ? scanLogs[Math.min(scanStep, scanLogs.length - 1)]
                        : 'Scan study log'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#121018]/90 to-[#08060a] p-5 shadow-xl">
              <div className="absolute -left-8 top-0 w-28 h-28 rounded-full bg-rose-500/10 blur-3xl" />
              <h4 className="relative font-mono text-[10px] font-black uppercase tracking-[0.22em] text-amber-300/90 mb-4 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-cyan-400" />
                Recent scans
              </h4>
              <div className="relative space-y-2.5 max-h-[340px] overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono text-xs"
                  >
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{item.category}</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <h5 className="font-display text-sm italic font-semibold text-slate-100 mt-1 truncate">
                      {item.topic}
                    </h5>
                    <div className="flex justify-between mt-2.5 pt-2 border-t border-white/8 text-[10px]">
                      <span className="text-slate-400">{item.duration}m focus</span>
                      <span className="text-amber-300 font-bold">+{item.creditsEarned} CP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
