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

interface ResearchLabProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onOpenRoadmap?: () => void;
}

interface SavedSession {
  id: string;
  topic: string;
  category: string;
  duration: number;
  creditsEarned: number;
  timestamp: string;
}

export default function ResearchLab({ state, setState, addLog, onOpenRoadmap }: ResearchLabProps) {
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Rust & Solana');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [successResult, setSuccessResult] = useState(false);
  const [activeTab, setActiveTab] = useState<'verify' | 'academy'>('academy');

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
      <div className="flex border-b border-white/5 gap-6 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('academy')}
          className={`pb-3 px-1 transition-all relative cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${
            activeTab === 'academy'
              ? 'text-fuchsia-400 border-b-2 border-fuchsia-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Brain className="w-4 h-4 text-fuchsia-400" />
          ATTENTION INTELLIGENCE MODULE
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('verify')}
          className={`pb-3 px-1 transition-all relative cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${
            activeTab === 'verify'
              ? 'text-cyan-400 border-b-2 border-cyan-500'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          VERIFICATION TERMINAL
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'academy' ? (
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
            <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <p className="text-[10px] text-amber-500/80 font-mono mb-3">
                Local cosmetic scan — agent-verified PoA lives in Attention Intelligence Module.
              </p>
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> VERIFY COGNITIVE STUDY LOGS
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Submit a quick summary of what you studied. Prefer Academy sessions for real verify + Devnet attest.
              </p>

              {successResult ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-3">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-emerald-200 text-sm font-bold">Local scan recorded</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTopic('');
                      setSummary('');
                      setSuccessResult(false);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400"
                  >
                    <RotateCcw className="w-3 h-3" /> New entry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStartInspection} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                      1. Topic studied
                    </label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
                      placeholder="e.g. Solana Program Deserialization Hacks"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                      2. Category
                    </label>
                    <select
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200"
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
                    <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
                      3. Study brief
                    </label>
                    <textarea
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 min-h-[100px]"
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
                    className="w-full py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {scanning ? scanLogs[Math.min(scanStep, scanLogs.length - 1)] : 'SUBMIT FOR VERIFICATION'}
                  </button>
                </form>
              )}
            </div>

            <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl">
              <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-fuchsia-400" />
                VERIFIED STUDY HISTORY
              </h4>
              <div className="space-y-3 max-h-[340px] overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#050506] border border-white/5 p-3 rounded-xl font-mono text-xs"
                  >
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{item.category}</span>
                      <span>{item.timestamp}</span>
                    </div>
                    <h5 className="font-semibold text-slate-200 mt-1 truncate">{item.topic}</h5>
                    <div className="flex justify-between mt-2.5 pt-2 border-t border-white/5 text-[10px]">
                      <span className="text-slate-400">Duration: {item.duration}m</span>
                      <span className="text-emerald-400 font-bold">+{item.creditsEarned} CP</span>
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
