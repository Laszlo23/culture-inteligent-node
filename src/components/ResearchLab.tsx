/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  BookOpen,
  Send,
  ShieldAlert,
  Cpu,
  Sparkles,
  CheckCircle,
  Database,
  Brain,
  Play,
  RotateCcw,
  Award,
  Check,
  Eye,
  HelpCircle,
  Lock,
  Flame,
  AlertCircle,
  ArrowRight,
  Activity,
  Zap,
  Clock,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { GameState } from '../types';

interface ResearchLabProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

interface SavedSession {
  id: string;
  topic: string;
  category: string;
  duration: number;
  creditsEarned: number;
  timestamp: string;
}

interface NeuralSnapQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

const NEURAL_SNAP_QUESTIONS: NeuralSnapQuestion[] = [
  {
    question: "What does the term 'Neuroplasticity' refer to in cognitive science?",
    options: [
      "The brain's ability to physically reorganize and forge new pathways in response to learning.",
      "The artificial synthesis of plastic-based neurotransmitters in neural interfaces.",
      "The static storage capacity limit of the prefrontal cortex."
    ],
    correctIdx: 0,
    explanation: "Neuroplasticity is the brain's physical ability to grow and rewire itself through conscious action and focused practice."
  },
  {
    question: "How does multitasking affect cognitive superpositions (attention focus)?",
    options: [
      "It multiplies cognitive efficiency by spreading resources evenly.",
      "It acts as a disruptive quantum-like observation, collapsing focus into shallow noise.",
      "It has no measurable impact on working memory reserves."
    ],
    correctIdx: 1,
    explanation: "Attention shifting creates cognitive switching costs, fragmenting attention reserves and degrading deep focus."
  },
  {
    question: "Which of these is a common cognitive bias leading to logical memory leaks in decision-making?",
    options: [
      "The Confirmation Bias (seeking only data that supports your pre-existing view).",
      "The Quantum Tunneling Effect.",
      "The Synaptic Shunt."
    ],
    correctIdx: 0,
    explanation: "Confirmation bias filters out contradicting evidence, creating cognitive memory leaks and biased outcomes."
  },
  {
    question: "What is the primary function of Box Breathing in Attention Control?",
    options: [
      "To increase carbon dioxide reserves to induce sleep.",
      "To stabilize heart rate variability and downregulate the sympathetic fight-or-flight response.",
      "To bypass the brain's physical memory storage limits."
    ],
    correctIdx: 1,
    explanation: "Equal-ratio breathing downregulates anxiety, restoring cognitive prefrontal control from stress triggers."
  },
  {
    question: "Self-awareness can be compared to which structural developer tool?",
    options: [
      "A telemetry monitor checking running background processes and system resources.",
      "An automated compiler unit removing dead code snippets.",
      "A database index that duplicates data entries for durability."
    ],
    correctIdx: 0,
    explanation: "Practical self-awareness acts as real-time cognitive telemetry, monitoring active focus and emotional noise."
  },
  {
    question: "When calibrating the MINER_X1-QUANTUM, what condition initiates a successful AI Inspection sweep?",
    options: [
      "Inducing extreme thermodynamic overdrive to burn off cooling liquids.",
      "Achieving stable brain-frequency resonance through a conscious breathing/attention sync process.",
      "Re-wiring the physical silicon nodes to run legacy proof-of-work hash calculations."
    ],
    correctIdx: 1,
    explanation: "Mining approval is granted when the human operator registers a verified, coherent attention profile via real-time focus calibration."
  }
];

const ATTENTION_SESSIONS = [
  {
    id: 's1',
    title: 'Synaptic Core Upgrade (Neuroplasticity)',
    duration: '5 min',
    hook: 'Initiating physical neural rewiring. Your brain is not a static processor—it is a reconfigurable silicon substrate that physically adapts to deliberate high-load operations. Forge new pathways now.',
    rewards: { cp: 100, energy: 10, efficiency: 0.05 }
  },
  {
    id: 's2',
    title: 'Cognitive Firewall Patches (Bias Deflection)',
    duration: '6 min',
    hook: 'Filtering algorithmic illusions. The human brain is prone to intuitive shortcuts and logical memory leaks (Confirmation Bias, Dunning-Kruger). Deploy security patches to calibrate objective decision-making.',
    rewards: { cp: 150, energy: 15, efficiency: 0.08 }
  },
  {
    id: 's3',
    title: 'Attention Bandwidth Expansion (Focus Control)',
    duration: '5 min',
    hook: 'Calibrating cognitive focus arrays. Modern digital networks are engineered to fragment your attentional resource. Expanding your primary bandwidth allows you to mine exponential value.',
    rewards: { cp: 200, energy: 20, efficiency: 0.10 }
  },
  {
    id: 's4',
    title: 'Neural Noise Filter (Self-Awareness)',
    duration: '4 min',
    hook: 'Running conscious process manager. Practical self-awareness is the ultimate high-performance mental telemetry tool, separating systemic noise from high-value actions. Purge mental RAM now.',
    rewards: { cp: 250, energy: 25, efficiency: 0.12 }
  },
  {
    id: 's5',
    title: 'AI Inspection Tuning (Machine Calibration)',
    duration: '3 min',
    hook: 'Calibrating neural hash alignments for MINER_X1-QUANTUM. Mining operations require steady brain-frequency resonance. Align your focus vectors to pass the inspection sweep and authorize active power conduits.',
    rewards: { cp: 300, energy: 30, efficiency: 0.15 }
  }
];

export default function ResearchLab({ state, setState, addLog }: ResearchLabProps) {
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Rust & Solana');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [successResult, setSuccessResult] = useState<boolean>(false);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'verify' | 'academy'>('verify');

  // Verification Terminal & Neural Snap Quiz States
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<NeuralSnapQuestion[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizState, setQuizState] = useState<'idle' | 'quiz' | 'passed' | 'failed'>('idle');
  const [isScanningOverlay, setIsScanningOverlay] = useState(false);
  const [pendingSessionIdx, setPendingSessionIdx] = useState<number | null>(null);

  // Attention Academy Progress loaded from LocalStorage
  const [completedSessions, setCompletedSessions] = useState<string[]>(() => {
    const saved = localStorage.getItem('kronos_academy_completed');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSessionIdx, setActiveSessionIdx] = useState<number>(0);
  const [justUpgraded, setJustUpgraded] = useState(false);

  // Academy Interactive States
  // Session 1: Neuroplasticity
  const [s1Skill, setS1Skill] = useState('');
  const [s1Reps, setS1Reps] = useState(0);
  const [s1Observation, setS1Observation] = useState('');
  const [s1AnimationTrigger, setS1AnimationTrigger] = useState(false);

  // Session 2: Cognitive Biases
  const [s2Q1Answer, setS2Q1Answer] = useState<string | null>(null);
  const [s2Q2Answer, setS2Q2Answer] = useState<string | null>(null);
  const [s2Q3Answer, setS2Q3Answer] = useState<string | null>(null);
  const [s2Journal, setS2Journal] = useState('');

  // Session 3: Attention Control
  const [s3Grounding, setS3Grounding] = useState({ see: '', feel: '', hear: '', smell: '', taste: '' });
  const [s3BreathingState, setS3BreathingState] = useState<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2' | 'complete'>('idle');
  const [s3SecondsLeft, setS3SecondsLeft] = useState(0);
  const [s3Rounds, setS3Rounds] = useState(0);

  // Session 4: Self Awareness
  const [s4TimerActive, setS4TimerActive] = useState(false);
  const [s4SecondsLeft, setS4SecondsLeft] = useState(60);
  const [s4Summary, setS4Summary] = useState('');
  const [s4Finished, setS4Finished] = useState(false);

  // Session 5: Quantum Core Alignment
  const [s5LockedNodes, setS5LockedNodes] = useState<boolean[]>([false, false, false]);
  const [s5Frequency, setS5Frequency] = useState(410);
  const [s5ActiveNode, setS5ActiveNode] = useState(0);
  const [s5FrictionNote, setS5FrictionNote] = useState('');

  // Local ledger of verified activities
  const [history, setHistory] = useState<SavedSession[]>([
    { id: '1', topic: 'Smart Contract Rent Optimization', category: 'Rust & Solana', duration: 45, creditsEarned: 320, timestamp: '10:14 AM' },
    { id: '2', topic: 'Ethereum Layer-2 Block Compressors', category: 'AI & Data Science', duration: 30, creditsEarned: 240, timestamp: 'Yesterday' }
  ]);

  const scanLogs = [
    "INITIATING STUDY PROOF VERIFICATION...",
    "SCANNING CONTENT KEYWORDS AND CONCEPTS...",
    "CONFIRMING ACADEMIC ENGAGEMENT FACTORS...",
    "CORRELATING STUDY SESSION STUDY LENGTH...",
    "VALIDATING FOCUS PROOF ON DECENTRALIZED POOLS...",
    "SYNCING TO MAINNET LEDGER...",
  ];

  // Save Academy State
  useEffect(() => {
    localStorage.setItem('kronos_academy_completed', JSON.stringify(completedSessions));
  }, [completedSessions]);

  // Sync index to next incomplete session if active is locked
  useEffect(() => {
    const nextIncompleteIdx = ATTENTION_SESSIONS.findIndex(s => !completedSessions.includes(s.id));
    if (nextIncompleteIdx !== -1 && nextIncompleteIdx !== activeSessionIdx) {
      // If currently selected index is locked, move to next incomplete
      const isCurrentLocked = activeSessionIdx > 0 && !completedSessions.includes(ATTENTION_SESSIONS[activeSessionIdx - 1].id);
      if (isCurrentLocked) {
        setActiveSessionIdx(nextIncompleteIdx);
      }
    }
  }, [completedSessions]);

  // Session 3 Breathing loop
  useEffect(() => {
    if (s3BreathingState === 'idle' || s3BreathingState === 'complete') return;

    const interval = setInterval(() => {
      setS3SecondsLeft(prev => {
        if (prev <= 1) {
          // Switch breathing states
          if (s3BreathingState === 'inhale') {
            setS3BreathingState('hold1');
            return 4;
          } else if (s3BreathingState === 'hold1') {
            setS3BreathingState('exhale');
            return 4;
          } else if (s3BreathingState === 'exhale') {
            setS3BreathingState('hold2');
            return 4;
          } else if (s3BreathingState === 'hold2') {
            const nextRound = s3Rounds + 1;
            setS3Rounds(nextRound);
            if (nextRound >= 3) {
              setS3BreathingState('complete');
              addLog("COGNITIVE METRICS: Interactive Box Breathing completed. Focus systems calibrated.", "success");
              return 0;
            } else {
              setS3BreathingState('inhale');
              return 4;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [s3BreathingState, s3Rounds]);

  // Session 4 meditation loop
  useEffect(() => {
    if (!s4TimerActive) return;

    const interval = setInterval(() => {
      setS4SecondsLeft(prev => {
        if (prev <= 1) {
          setS4TimerActive(false);
          setS4Finished(true);
          addLog("COGNITIVE METRICS: 60-Second mental landing scan successful.", "success");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [s4TimerActive]);

  // Session 5 frequency oscillation loop
  useEffect(() => {
    if (activeSessionIdx !== 4 || completedSessions.includes('s5')) return;

    let time = 0;
    const interval = setInterval(() => {
      time += 0.25;
      // Oscillate between 405 and 455 using sine wave
      const wave = Math.sin(time) * 25 + 430;
      // Add a tiny bit of random noise for realism
      const noise = (Math.random() - 0.5) * 2;
      setS5Frequency(Math.round(wave + noise));
    }, 100);

    return () => clearInterval(interval);
  }, [activeSessionIdx, completedSessions]);

  useEffect(() => {
    if (!scanning) return;

    if (scanStep < scanLogs.length) {
      const timer = setTimeout(() => {
        setScanStep(prev => prev + 1);
      }, 450);
      return () => clearTimeout(timer);
    } else {
      // Inspection finished! Apply real awards
      setScanning(false);
      setSuccessResult(true);

      const bonusCredits = 320;
      const energyAdd = 18;
      const efficiencyAdd = 0.2;

      setState(prev => {
        const nextEnergy = Math.min(100, prev.energy + energyAdd);
        const nextEfficiency = parseFloat((prev.efficiency + efficiencyAdd).toFixed(3));
        const nextCredits = prev.credits + bonusCredits;
        
        return {
          ...prev,
          energy: nextEnergy,
          efficiency: nextEfficiency,
          credits: nextCredits
        };
      });

      // Save to local ledger
      const newSession: SavedSession = {
        id: Date.now().toString(),
        topic: topic || "Quantum Machine Learning",
        category,
        duration: Math.floor(Math.random() * 40) + 20,
        creditsEarned: bonusCredits,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory(prev => [newSession, ...prev]);

      addLog(`AI INSPECTION COMPLETE: Verified session topic: "${topic || "Quantum Machine Learning"}". +18 Energy, +320 CP, +0.2 Efficiency.`, 'success');
    }
  }, [scanning, scanStep]);

  const handleStartInspection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    setScanStep(0);
    setScanning(true);
    setSuccessResult(false);
  };

  const clearForm = () => {
    setTopic('');
    setSummary('');
    setSuccessResult(false);
  };

  const applyPendingRewards = (index: number) => {
    const session = ATTENTION_SESSIONS[index];
    if (completedSessions.includes(session.id)) return;

    // Trigger glowing/upgrading visual hardware representation
    setJustUpgraded(true);
    setTimeout(() => {
      setJustUpgraded(false);
    }, 4000);

    // Award CP, Energy, Efficiency
    setState(prev => {
      const nextEnergy = Math.min(100, prev.energy + session.rewards.energy);
      const nextEfficiency = parseFloat((prev.efficiency + session.rewards.efficiency).toFixed(3));
      const nextCredits = prev.credits + session.rewards.cp;
      return {
        ...prev,
        energy: nextEnergy,
        efficiency: nextEfficiency,
        credits: nextCredits
      };
    });

    setCompletedSessions(prev => {
      const updated = [...prev, session.id];
      localStorage.setItem('kronos_academy_completed', JSON.stringify(updated));
      return updated;
    });

    // Save to local ledger
    const newSession: SavedSession = {
      id: Date.now().toString(),
      topic: `Session ${index + 1}: ${session.title}`,
      category: 'AI & Data Science',
      duration: parseInt(session.duration),
      creditsEarned: session.rewards.cp,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHistory(prev => [newSession, ...prev]);

    addLog(`ATTENTION VERIFIED: Passed Neural Snap quiz for ${session.title}! SECURED +${session.rewards.cp} CP, +${session.rewards.energy}% Energy, +${session.rewards.efficiency}x Efficiency.`, 'success');

    // Automatically transition to next session if there is one
    if (index < ATTENTION_SESSIONS.length - 1) {
      setActiveSessionIdx(index + 1);
    }
    setPendingSessionIdx(null);
  };

  const claimSessionRewards = (index: number) => {
    const session = ATTENTION_SESSIONS[index];
    if (completedSessions.includes(session.id)) return;

    // Pick 1 to 3 random questions from the pool
    const shuffled = [...NEURAL_SNAP_QUESTIONS].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 3) + 1; // 1 to 3 questions
    const selectedQuestions = shuffled.slice(0, count);

    setPendingSessionIdx(index);
    setActiveQuizQuestions(selectedQuestions);
    setCurrentQuizIdx(0);
    setSelectedQuizAnswer(null);
    setQuizScore(0);
    setQuizState('quiz');

    addLog(`VERIFICATION TERMINAL: Initiated Neural Snap quiz (${count} questions) for module "${session.title}".`, 'info');
  };

  const isMaster = completedSessions.length === ATTENTION_SESSIONS.length;

  return (
    <div id="research-room" className="space-y-6">
      
      {/* Academy and Verifier Tab Switcher */}
      <div className="flex border-b border-white/5 gap-6 font-mono text-xs">
        <button
          onClick={() => setActiveTab('verify')}
          className={`pb-3 px-1 transition-all relative cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${
            activeTab === 'verify' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          VERIFICATION TERMINAL
        </button>
        <button
          onClick={() => setActiveTab('academy')}
          className={`pb-3 px-1 transition-all relative cursor-pointer font-bold tracking-wider flex items-center gap-1.5 ${
            activeTab === 'academy' ? 'text-fuchsia-400 border-b-2 border-fuchsia-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Brain className="w-4 h-4 text-fuchsia-400" />
          ATTENTION INTELLIGENCE MODULE
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'verify' ? (
          <motion.div
            key="verify-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Interactive Verification Console */}
            <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
              {scanning && (
                <motion.div 
                  initial={{ y: -20 }}
                  animate={{ y: [0, 420, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 shadow-lg shadow-cyan-500/50 z-30"
                />
              )}

              <div className="z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-fuchsia-500" />
                  <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">VERIFY COGNITIVE STUDY LOGS</h3>
                </div>

                <p className="text-xs text-slate-400 mb-6 font-sans leading-relaxed">
                  Submit a quick summary of what you studied, read, or built today. Our verifier checks focus engagement parameters to add core energy and earn rewards.
                </p>

                <AnimatePresence mode="wait">
                  {!scanning && !successResult ? (
                    <motion.form
                      key="verification-form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleStartInspection}
                      className="space-y-4 font-mono text-xs"
                    >
                      <div>
                        <label className="text-slate-400 tracking-wider block mb-1.5 uppercase">1. TOPIC STUDIED</label>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          required
                          placeholder="e.g. Solana Program Deserialization Hacks"
                          className="w-full bg-[#050506] border border-white/10 focus:border-cyan-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-slate-200"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-slate-400 tracking-wider block mb-1.5 uppercase">2. CATEGORY</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-[#050506] border border-white/10 focus:border-cyan-500 focus:outline-none rounded-xl px-3 py-2.5 text-slate-300"
                          >
                            <option value="Rust & Solana">Rust & Solana Protocol</option>
                            <option value="AI & Data Science">AI & Cognitive Science</option>
                            <option value="Zero Knowledge Proofs">Cryptography & ZKProofs</option>
                            <option value="Full Stack Dev">Hardware Assembly & IOT</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 tracking-wider block mb-1.5 uppercase">3. PROOF PROTOCOL</label>
                          <div className="bg-[#050506] border border-white/10 px-3.5 py-2.5 rounded-xl text-slate-500">
                            PROOF OF LEARNING (POL)
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 tracking-wider block mb-1.5 uppercase">4. EXPLAIN WHAT YOU LEARNED (STUDY BRIEF)</label>
                        <textarea
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          required
                          rows={4}
                          placeholder="Provide a brief summary explaining what you learned or built. (At least 15 characters)"
                          className="w-full bg-[#050506] border border-white/10 focus:border-cyan-500 focus:outline-none rounded-xl px-3.5 py-2.5 text-slate-200 resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={summary.trim().length < 15}
                        className={`w-full py-3.5 rounded-xl font-bold tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          summary.trim().length >= 15
                            ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-600 hover:to-fuchsia-700 text-white shadow-lg shadow-fuchsia-950/30'
                            : 'bg-[#050506] border border-white/5 text-slate-600 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-4 h-4" />
                        SUBMIT FOR VERIFICATION
                      </button>
                    </motion.form>
                  ) : scanning ? (
                    <motion.div
                      key="scan-matrix"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-[#050506] p-5 rounded-xl border border-cyan-500/30 font-mono text-xs min-h-[290px] flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-cyan-950 pb-2 mb-3">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 animate-spin" />
                            VERIFYING_ATTENTION_PROOF
                          </span>
                          <span className="animate-pulse">ANALYZING...</span>
                        </div>

                        <div className="space-y-1 select-none">
                          {scanLogs.map((log, index) => (
                            <p
                              key={index}
                              className={`transition-all duration-300 ${
                                index < scanStep ? 'text-cyan-400 opacity-100' :
                                index === scanStep ? 'text-fuchsia-400 font-bold animate-pulse' :
                                'text-slate-800'
                              }`}
                            >
                              {index < scanStep ? '✔' : index === scanStep ? '▶' : '⚙'} {log}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-600 pt-4 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 animate-bounce text-cyan-500" />
                        DO NOT CLOSE TAB DURING VALIDATION
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success-card"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-[#0a0a0c] border-2 border-emerald-500/40 p-6 rounded-2xl text-center space-y-5 relative"
                    >
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-6 h-6 animate-pulse" />
                      </div>

                      <div className="font-mono">
                        <span className="text-[11px] text-emerald-400 font-bold tracking-widest block uppercase">Verification Complete</span>
                        <h4 className="text-base font-bold text-slate-100 mt-1">LOG APPROVED</h4>
                      </div>

                      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto font-mono text-xs bg-[#050506] p-3 rounded-xl border border-white/5">
                        <div className="border-r border-white/5">
                          <span className="text-[10px] text-slate-500 block">ENERGY</span>
                          <span className="text-emerald-400 font-bold font-mono">+18%</span>
                        </div>
                        <div className="border-r border-white/5">
                          <span className="text-[10px] text-slate-500 block">REWARDS</span>
                          <span className="text-amber-400 font-bold font-mono">+320 CP</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">EFFICIENCY</span>
                          <span className="text-cyan-400 font-bold font-mono">+0.20x</span>
                        </div>
                      </div>

                      <button
                        onClick={clearForm}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-mono text-xs font-bold px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        DISMISS & RESUME MINING
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Verified Research ledger */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-fuchsia-400" />
                  VERIFIED STUDY HISTORY
                </h4>

                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {history.map(item => (
                    <div key={item.id} className="bg-[#050506] border border-white/5 p-3 rounded-xl font-mono text-xs hover:border-fuchsia-900 transition-all">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>{item.category}</span>
                        <span>{item.timestamp}</span>
                      </div>
                      <h5 className="font-semibold text-slate-200 mt-1 truncate">{item.topic}</h5>
                      
                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-white/5 text-[10px]">
                        <span className="text-slate-400">Duration: {item.duration}m</span>
                        <span className="text-emerald-400 font-bold">+{item.creditsEarned} CP SECURED</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/5 pt-3 mt-4 text-[9px] text-slate-500 font-mono text-center">
                * Ledger balances sync to decentralized consensus pools instantly.
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="academy-pane"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 animate-fade-in"
          >
            {/* NEURAL UPGRADE PROGRESS DASHBOARD */}
            <div className="bg-[#050507] border border-fuchsia-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-[80px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-xl">
                    <Brain className="w-6 h-6 text-fuchsia-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">COGNITIVE SYNC BOARD</h4>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                      NEURAL REWIRE COMPLETED: <span className="text-fuchsia-400">{Math.round((completedSessions.length / ATTENTION_SESSIONS.length) * 100)}%</span>
                    </h3>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center bg-[#0a0a0c]/80 border border-white/5 p-3 rounded-xl w-full md:w-auto justify-around md:justify-start">
                  <div className="text-center px-3 border-r border-white/5">
                    <span className="text-[9px] text-slate-500 block uppercase">EFFICIENCY MULTIPLIER</span>
                    <span className="text-xs font-black text-cyan-400">
                      +{completedSessions.reduce((acc, id) => {
                        const sess = ATTENTION_SESSIONS.find(s => s.id === id);
                        return acc + (sess?.rewards.efficiency || 0);
                      }, 0).toFixed(2)}x
                    </span>
                  </div>
                  <div className="text-center px-3 border-r border-white/5">
                    <span className="text-[9px] text-slate-500 block uppercase">CORE ENERGY BOOST</span>
                    <span className="text-xs font-black text-emerald-400">
                      +{completedSessions.reduce((acc, id) => {
                        const sess = ATTENTION_SESSIONS.find(s => s.id === id);
                        return acc + (sess?.rewards.energy || 0);
                      }, 0)}%
                    </span>
                  </div>
                  <div className="text-center px-3">
                    <span className="text-[9px] text-slate-500 block uppercase">REWARDS HARVESTED</span>
                    <span className="text-xs font-black text-amber-400">
                      {completedSessions.reduce((acc, id) => {
                        const sess = ATTENTION_SESSIONS.find(s => s.id === id);
                        return acc + (sess?.rewards.cp || 0);
                      }, 0)} CP
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Visual wiring progress indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4">
                {ATTENTION_SESSIONS.map((session, idx) => {
                  const isCompleted = completedSessions.includes(session.id);
                  return (
                    <div key={session.id} className="space-y-1 text-center font-mono">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]' 
                            : 'bg-white/5'
                        }`}
                      />
                      <span className={`text-[8px] font-bold block truncate uppercase ${isCompleted ? 'text-fuchsia-400' : 'text-slate-600'}`}>
                        {session.title.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CONTINUOUS NEURAL HARDWARE PROGRESS BAR */}
              <div className="mt-6 border-t border-white/5 pt-5">
                <div className="flex justify-between items-center font-mono text-[9px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full animate-pulse" />
                    NEURAL HARDWARE CORE SYNC
                  </span>
                  <span className="text-fuchsia-400 font-bold uppercase">
                    {completedSessions.length} / {ATTENTION_SESSIONS.length} INTEGRATIONS ENGAGED
                  </span>
                </div>
                
                {/* Main Progress Track */}
                <div className="h-5 bg-[#020204]/90 border border-white/10 rounded-xl overflow-hidden p-0.5 relative flex items-center shadow-2xl">
                  {/* Dynamic background glow reflection */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 transition-opacity duration-1000 ${
                      justUpgraded ? 'opacity-100' : 'opacity-40'
                    }`} 
                  />
                  
                  {/* Fills Up with CSS Transitions and interactive glows */}
                  <div 
                    style={{ width: `${Math.max(4, (completedSessions.length / ATTENTION_SESSIONS.length) * 100)}%` }}
                    className={`h-full rounded-lg transition-all duration-1000 ease-out relative overflow-hidden ${
                      justUpgraded 
                        ? 'bg-gradient-to-r from-fuchsia-400 via-amber-300 to-cyan-400 shadow-[0_0_25px_rgba(232,121,249,0.8),0_0_15px_rgba(34,211,238,0.8)]' 
                        : completedSessions.length > 0
                        ? 'bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]'
                        : 'bg-white/5'
                    }`}
                  >
                    {/* Laser Light Sweeper Indicator */}
                    <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-r from-transparent to-white/40 blur-sm animate-[pulse_1.5s_infinite]" />
                    <div className="absolute inset-y-0 right-0 w-1 bg-white shadow-[0_0_8px_#fff]" />
                  </div>
                  
                  {/* Grid calibration tick marks overlay */}
                  <div className="absolute inset-0 flex justify-between pointer-events-none px-6">
                    <div className="w-[1px] h-full bg-white/10" />
                    <div className="w-[1px] h-full bg-white/10" />
                    <div className="w-[1px] h-full bg-white/10" />
                    <div className="w-[1px] h-full bg-white/10" />
                  </div>
                </div>

                {/* Animated status banner on upgrades */}
                <AnimatePresence>
                  {justUpgraded && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="mt-3 font-mono text-[9px] text-amber-300 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-center flex items-center justify-center gap-2 animate-pulse"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                      <span>HARDWARE UPGRADE IN PROGRESS: RECONSTRUCTING NEURAL GRID INTEGRITY MODULES</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Academy Dynamic Session Details Block */}
              <div className="lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
              <div className="z-10 space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-fuchsia-500" />
                    <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">
                      SESSION 0{activeSessionIdx + 1}: {ATTENTION_SESSIONS[activeSessionIdx].title.toUpperCase()}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono bg-fuchsia-950/40 text-fuchsia-400 px-2.5 py-1 rounded-lg border border-fuchsia-500/20">
                    EST: {ATTENTION_SESSIONS[activeSessionIdx].duration} READ/EXERCISE
                  </span>
                </div>

                {/* Session 1: Neuroplasticity */}
                {activeSessionIdx === 0 && (
                  <div className="space-y-4 font-sans text-xs text-slate-300 leading-relaxed">
                    <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl">
                      <h4 className="text-cyan-400 font-bold mb-1 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                        <Flame className="w-4 h-4" /> THE HOOK
                      </h4>
                      <p className="italic text-slate-200">
                        "{ATTENTION_SESSIONS[0].hook}"
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                      <h4 className="text-slate-200 font-bold font-mono uppercase tracking-wider">THE CORE INSIGHT (TV WON'T TELL YOU THIS)</h4>
                      <p>
                        <strong>Neuroplasticity</strong> means repetition builds stronger neural pathways, while unused ones are pruned away. London taxi drivers physically grew bigger memory-related brain areas (hippocampus) just from mastering "The Knowledge" taxi test. Adults learning to juggle showed visible gray matter density changes in only months. Intelligence isn't set in stone — <em>it's like a muscle</em>.
                      </p>
                    </div>

                    <div className="border border-white/10 p-5 rounded-2xl bg-[#050506] space-y-4">
                      <h4 className="text-fuchsia-400 font-bold font-mono tracking-wider uppercase flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-fuchsia-400" /> SYNAPSE PATHWAY CALIBRATION (2-3 MIN)
                      </h4>
                      <p className="text-slate-400">
                        Define a micro-skill (cognitive array) you want your brain to hard-code (e.g. Navigating spatial sectors without map assists, mastering low-level Rust assembly, or speed-reading system code). Commit to daily conscious repetition.
                      </p>

                      <div className="space-y-3 font-mono">
                        <div>
                          <label className="text-slate-400 text-[10px] block mb-1 uppercase">1. IDENTIFY THE TARGET COGNITIVE CAPABILITY</label>
                          <input
                            type="text"
                            value={s1Skill}
                            onChange={(e) => setS1Skill(e.target.value)}
                            disabled={completedSessions.includes('s1')}
                            placeholder="e.g. Low-level Rust compiler optimization / Non-dominant physical balance"
                            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                          />
                        </div>

                        {s1Skill && (
                          <div className="space-y-2">
                            <label className="text-slate-400 text-[10px] block uppercase">2. DELIBERATE AXONAL STIMULATION (TAP TO DISCHARGE REPETITIONS)</label>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                disabled={s1Reps >= 15 || completedSessions.includes('s1')}
                                onClick={() => {
                                  setS1Reps(prev => prev + 1);
                                  setS1AnimationTrigger(true);
                                  setTimeout(() => setS1AnimationTrigger(false), 200);
                                }}
                                className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                                  s1Reps >= 15 
                                    ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                                    : 'bg-fuchsia-950/40 border border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-900/30'
                                }`}
                              >
                                <Zap className={`w-3.5 h-3.5 ${s1AnimationTrigger ? 'scale-150 text-amber-400' : ''}`} />
                                {s1Reps >= 15 ? 'CONNECTIONS STABILIZED' : `DISCHARGE NEURON REPS (${s1Reps}/15)`}
                              </button>

                              <div className="flex-1 h-2.5 bg-[#0a0a0c] border border-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 transition-all duration-300"
                                  style={{ width: `${(s1Reps / 15) * 100}%` }}
                                />
                              </div>
                            </div>
                            {s1Reps > 0 && s1Reps < 15 && (
                              <span className="text-[10px] text-fuchsia-400 animate-pulse block">FORGING CONSCIOUS CONNECTION... CLICK {15 - s1Reps} MORE TIMES</span>
                            )}
                          </div>
                        )}

                        {s1Reps >= 15 && (
                          <div className="space-y-1">
                            <label className="text-slate-400 text-[10px] block uppercase">3. RECORD TELEMETRY: COGNITIVE FRICTION (BEFORE VS FLUID STATE)</label>
                            <textarea
                              rows={3}
                              value={s1Observation}
                              onChange={(e) => setS1Observation(e.target.value)}
                              disabled={completedSessions.includes('s1')}
                              placeholder="Describe the initial resistance or lag, vs the fluid state once muscle memory activates. Track the contrast."
                              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs resize-none"
                            />
                          </div>
                        )}
                      </div>

                      {!completedSessions.includes('s1') ? (
                        <button
                          type="button"
                          disabled={!s1Skill || s1Reps < 15 || s1Observation.trim().length < 8}
                          onClick={() => claimSessionRewards(0)}
                          className={`w-full py-2.5 rounded-xl font-bold tracking-wider font-mono text-xs flex items-center justify-center gap-1.5 transition-all ${
                            s1Skill && s1Reps >= 15 && s1Observation.trim().length >= 8
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold cursor-pointer shadow-lg shadow-emerald-950/20'
                              : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Award className="w-4 h-4" /> SUBMIT FORGING METRICS (+100 CP)
                        </button>
                      ) : (
                        <div className="bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center text-[10px] font-mono font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> NEURAL PATHWAY REGISTERED IN LEDGER // SECURED
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Session 2: Cognitive Biases */}
                {activeSessionIdx === 1 && (
                  <div className="space-y-4 font-sans text-xs text-slate-300 leading-relaxed">
                    <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl">
                      <h4 className="text-cyan-400 font-bold mb-1 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                        <Flame className="w-4 h-4" /> THE HOOK
                      </h4>
                      <p className="italic text-slate-200">
                        "{ATTENTION_SESSIONS[1].hook}"
                      </p>
                    </div>

                    <div className="border border-white/10 p-5 rounded-2xl bg-[#050506] space-y-4">
                      <h4 className="text-cyan-400 font-bold font-mono tracking-wider uppercase flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" /> COGNITIVE REFLECTION QUIZ
                      </h4>

                      {/* Q1 */}
                      <div className="space-y-2 font-mono">
                        <p className="text-slate-300 text-xs">
                          <strong>Q1:</strong> A bat and ball cost $1.10. The bat costs $1.00 more than the ball. How much does the ball cost?
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {['10¢', '5¢', '50¢'].map(opt => (
                            <button
                              key={opt}
                              type="button"
                              disabled={completedSessions.includes('s2')}
                              onClick={() => setS2Q1Answer(opt)}
                              className={`py-2 px-3 border rounded-xl text-center text-xs transition-all cursor-pointer ${
                                s2Q1Answer === opt 
                                  ? opt === '5¢' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold' : 'bg-red-950/40 border-red-500 text-red-300 font-bold'
                                  : 'bg-[#0a0a0c] border-white/5 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                        {s2Q1Answer && (
                          <div className="text-[10px] p-2 rounded-xl bg-white/[0.01] border border-white/5 text-slate-400">
                            {s2Q1Answer === '5¢' 
                              ? "✔ Correct! Your analytical system overrode the intuitive shortcut. If the ball is 5¢, the bat is $1.05, totaling $1.10." 
                              : "❌ Incorrect! Intuition screamed 10¢. But if the ball is 10¢, the bat is $1.10 (since it costs $1 more), totaling $1.20! Correct is 5¢."}
                          </div>
                        )}
                      </div>

                      {/* Q2 */}
                      {s2Q1Answer && (
                        <div className="space-y-2 font-mono">
                          <p className="text-slate-300 text-xs">
                            <strong>Q2:</strong> If 5 machines make 5 widgets in 5 minutes, how long would it take 100 machines to make 100 widgets?
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {['100 minutes', '5 minutes', '20 minutes'].map(opt => (
                              <button
                                key={opt}
                                type="button"
                                disabled={completedSessions.includes('s2')}
                                onClick={() => setS2Q2Answer(opt)}
                                className={`py-2 px-3 border rounded-xl text-center text-xs transition-all cursor-pointer ${
                                  s2Q2Answer === opt 
                                    ? opt === '5 minutes' ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold' : 'bg-red-950/40 border-red-500 text-red-300 font-bold'
                                    : 'bg-[#0a0a0c] border-white/5 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {s2Q2Answer && (
                            <div className="text-[10px] p-2 rounded-xl bg-white/[0.01] border border-white/5 text-slate-400">
                              {s2Q2Answer === '5 minutes' 
                                ? "✔ Correct! Each machine takes 5 minutes to make 1 widget. So 100 machines working in parallel take exactly 5 minutes." 
                                : "❌ Incorrect! Intuitive error. If each machine takes 5 minutes to make 1 widget, 100 machines in parallel still take exactly 5 minutes."}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Q3 */}
                      {s2Q2Answer && (
                        <div className="space-y-2 font-mono">
                          <p className="text-slate-300 text-xs">
                            <strong>Q3:</strong> Confirmation Bias check: When was the last time you only sought info supporting your existing view on news, habits, or money?
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {['Daily (Often)', 'Weekly (Sometimes)', 'Rarely', 'Never (Objective)'].map(opt => (
                              <button
                                key={opt}
                                type="button"
                                disabled={completedSessions.includes('s2')}
                                onClick={() => setS2Q3Answer(opt)}
                                className={`py-2 px-3 border rounded-xl text-center text-[10px] transition-all cursor-pointer ${
                                  s2Q3Answer === opt 
                                    ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                                    : 'bg-[#0a0a0c] border-white/5 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {s2Q3Answer && (
                            <div className="text-[10px] p-2.5 rounded-xl bg-cyan-950/10 border border-cyan-500/20 text-slate-400 space-y-1.5">
                              <span className="text-cyan-400 font-bold uppercase tracking-wider block">THE DEEPER TRUTH</span>
                              <p>
                                {s2Q3Answer === 'Never (Objective)' 
                                  ? "Dunning-Kruger Warning: Overestimating our objectivity is the ultimate bias! Our brains are biologically wired to take easy shortcuts." 
                                  : "Excellent self-awareness! Recognizing when your brain filters information to fit its narrative is the first step of cognitive mining."}
                              </p>
                              <p>
                                Biases like confirmation, anchoring, and optimism are built-in shortcuts. Awareness lets you "mine" better decisions. Schools skip this; it explains most poor choices.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Journal Action Hook */}
                      {s2Q3Answer && (
                        <div className="space-y-3 font-mono">
                          <div className="space-y-1">
                            <label className="text-slate-400 text-[10px] block uppercase">ACTION HOOK: JOURNAL ONE BIAS SPOTTED TODAY & COUNTER-STRATEGY</label>
                            <textarea
                              rows={3}
                              value={s2Journal}
                              onChange={(e) => setS2Journal(e.target.value)}
                              disabled={completedSessions.includes('s2')}
                              placeholder="e.g. Spot: Over-optimistic about project timelines. Counter: Multiply estimates by x1.5 based on historical rates."
                              className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {s2Q3Answer && (
                        <>
                          {!completedSessions.includes('s2') ? (
                            <button
                              type="button"
                              disabled={!s2Q1Answer || !s2Q2Answer || !s2Q3Answer || s2Journal.trim().length < 8}
                              onClick={() => claimSessionRewards(1)}
                              className={`w-full py-2.5 rounded-xl font-bold tracking-wider font-mono text-xs flex items-center justify-center gap-1.5 transition-all ${
                                s2Q1Answer && s2Q2Answer && s2Q3Answer && s2Journal.trim().length >= 8
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold cursor-pointer shadow-lg shadow-emerald-950/20'
                                  : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <Award className="w-4 h-4" /> SUBMIT BIAS RECONGITION (+150 CP)
                            </button>
                          ) : (
                            <div className="bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center text-[10px] font-mono font-bold flex items-center justify-center gap-1.5">
                              <CheckCircle className="w-4 h-4" /> BIAS OVERRIDE TELEMETRY RECORDED // SECURED
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Session 3: Attention Control */}
                {activeSessionIdx === 2 && (
                  <div className="space-y-4 font-sans text-xs text-slate-300 leading-relaxed">
                    <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl">
                      <h4 className="text-cyan-400 font-bold mb-1 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                        <Flame className="w-4 h-4" /> THE HOOK
                      </h4>
                      <p className="italic text-slate-200">
                        "{ATTENTION_SESSIONS[2].hook}"
                      </p>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
                      <h4 className="text-slate-200 font-bold font-mono uppercase tracking-wider">THE SCARCEST SOURCE</h4>
                      <p>
                        Attention isn't infinite — it's the absolute scarcest resource. Platforms exploit emotional triggers to harvest yours; but you can retrain deliberate focus. Techniques like task batching or <strong>"cognitive outsourcing"</strong> (writing intrusive thoughts down) drastically reduce attention residue from task switching.
                      </p>
                    </div>

                    <div className="border border-white/10 p-5 rounded-2xl bg-[#050506] space-y-4">
                      <h4 className="text-fuchsia-400 font-bold font-mono tracking-wider uppercase flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-fuchsia-400" /> DUAL COGNITIVE RESET
                      </h4>

                      {/* Step 1 Grounding */}
                      <div className="space-y-3 font-mono">
                        <span className="text-[10px] text-slate-400 block uppercase">PHASE 1: 5-4-3-2-1 GROUNDING TECHNIQUE (CALIBRATES FOCUS SENSORS)</span>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Calibrate your neural senses right now. Type one quick thing you experience in each of these sensory zones:
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <label className="text-slate-500 text-[9px] block">5. SEE (Visual cue)</label>
                            <input
                              type="text"
                              value={s3Grounding.see}
                              onChange={(e) => setS3Grounding(prev => ({ ...prev, see: e.target.value }))}
                              disabled={completedSessions.includes('s3')}
                              placeholder="e.g. Glowing neon layout"
                              className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 text-[9px] block">4. FEEL (Tactile support)</label>
                            <input
                              type="text"
                              value={s3Grounding.feel}
                              onChange={(e) => setS3Grounding(prev => ({ ...prev, feel: e.target.value }))}
                              disabled={completedSessions.includes('s3')}
                              placeholder="e.g. Keys typing smoothly"
                              className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 text-[9px] block">3. HEAR (Acoustic background)</label>
                            <input
                              type="text"
                              value={s3Grounding.hear}
                              onChange={(e) => setS3Grounding(prev => ({ ...prev, hear: e.target.value }))}
                              disabled={completedSessions.includes('s3')}
                              placeholder="e.g. Mild computer hum"
                              className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 text-[9px] block">2. SMELL (Olfactory essence)</label>
                            <input
                              type="text"
                              value={s3Grounding.smell}
                              onChange={(e) => setS3Grounding(prev => ({ ...prev, smell: e.target.value }))}
                              disabled={completedSessions.includes('s3')}
                              placeholder="e.g. Coffee / Morning air"
                              className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-slate-500 text-[9px] block">1. TASTE (Gustatory note)</label>
                            <input
                              type="text"
                              value={s3Grounding.taste}
                              onChange={(e) => setS3Grounding(prev => ({ ...prev, taste: e.target.value }))}
                              disabled={completedSessions.includes('s3')}
                              placeholder="e.g. Refreshing water / Mint"
                              className="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Step 2 Box Breathing */}
                      {s3Grounding.see && s3Grounding.feel && s3Grounding.hear && s3Grounding.smell && s3Grounding.taste && (
                        <div className="space-y-4 font-mono border-t border-white/5 pt-4">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">PHASE 2: BOX BREATHING LAB (REGULATES AUTONOMIC STABILITY)</span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Breathe with the visual node. 4s Inhale, 4s Hold, 4s Exhale, 4s Hold. Calibrates vagal tone for deep focus.
                          </p>

                          <div className="flex flex-col items-center justify-center p-6 bg-[#0a0a0c] border border-white/5 rounded-2xl relative overflow-hidden">
                            {/* Visual breathing orb */}
                            <div className="relative w-28 h-28 flex items-center justify-center">
                              <motion.div
                                animate={{
                                  scale: s3BreathingState === 'inhale' ? [1, 1.4] :
                                         s3BreathingState === 'hold1' ? 1.4 :
                                         s3BreathingState === 'exhale' ? [1.4, 1] : 1,
                                  opacity: s3BreathingState === 'idle' ? 0.15 : 0.6
                                }}
                                transition={{ duration: 4, ease: "easeInOut" }}
                                className={`absolute inset-0 rounded-full border-2 ${
                                  s3BreathingState === 'inhale' ? 'border-cyan-500' :
                                  s3BreathingState === 'hold1' ? 'border-fuchsia-500' :
                                  s3BreathingState === 'exhale' ? 'border-indigo-500' :
                                  s3BreathingState === 'hold2' ? 'border-amber-500' : 'border-slate-800'
                                }`}
                              />

                              <motion.div
                                animate={{
                                  scale: s3BreathingState === 'inhale' ? [1, 1.3] :
                                         s3BreathingState === 'hold1' ? 1.3 :
                                         s3BreathingState === 'exhale' ? [1.3, 1] : 1,
                                }}
                                transition={{ duration: 4, ease: "easeInOut" }}
                                className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-[10px] font-black tracking-widest text-black ${
                                  s3BreathingState === 'inhale' ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' :
                                  s3BreathingState === 'hold1' ? 'bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.4)]' :
                                  s3BreathingState === 'exhale' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' :
                                  s3BreathingState === 'hold2' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {s3BreathingState === 'idle' ? 'IDLE' : s3SecondsLeft}
                              </motion.div>
                            </div>

                            <div className="mt-4 text-center">
                              <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
                                {s3BreathingState === 'idle' ? 'READY TO START' :
                                 s3BreathingState === 'inhale' ? '↑ INHALE SLOWLY...' :
                                 s3BreathingState === 'hold1' ? '● HOLD BREATH...' :
                                 s3BreathingState === 'exhale' ? '↓ EXHALE FULLY...' :
                                 s3BreathingState === 'hold2' ? '● HOLD OUT...' : '✓ EXERCISE COMPLETE'}
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-1 uppercase">
                                {s3BreathingState === 'idle' ? '3 Rounds total (approx. 48s)' :
                                 s3BreathingState === 'complete' ? 'Calibrated successfully' :
                                 `Round ${s3Rounds + 1} of 3`}
                              </span>
                            </div>

                            {s3BreathingState === 'idle' && !completedSessions.includes('s3') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setS3BreathingState('inhale');
                                  setS3SecondsLeft(4);
                                  setS3Rounds(0);
                                }}
                                className="mt-4 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-[10px] rounded-lg tracking-widest flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-current" /> START BOX BREATHING
                              </button>
                            )}

                            {s3BreathingState !== 'idle' && s3BreathingState !== 'complete' && (
                              <button
                                type="button"
                                onClick={() => setS3BreathingState('idle')}
                                className="mt-4 px-3 py-1 border border-red-500/30 text-red-400 font-bold text-[9px] rounded-lg hover:bg-red-950/20 transition-all cursor-pointer"
                              >
                                ABORT
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Submit footer */}
                      {completedSessions.includes('s3') ? (
                        <div className="bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center text-[10px] font-mono font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> ATTENTION CALIBRATION RECONGITION SECURED
                        </div>
                      ) : (
                        s3BreathingState === 'complete' && (
                          <button
                            type="button"
                            onClick={() => claimSessionRewards(2)}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/20"
                          >
                            <Award className="w-4 h-4" /> SUBMIT ATTENTION METRICS (+200 CP)
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Session 4: Self Awareness */}
                {activeSessionIdx === 3 && (
                  <div className="space-y-4 font-sans text-xs text-slate-300 leading-relaxed">
                    <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl">
                      <h4 className="text-cyan-400 font-bold mb-1 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                        <Flame className="w-4 h-4" /> THE HOOK
                      </h4>
                      <p className="italic text-slate-200">
                        "{ATTENTION_SESSIONS[3].hook}"
                      </p>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
                      <h4 className="text-slate-200 font-bold font-mono uppercase tracking-wider">THE OBSERVER ADVANTAGE</h4>
                      <p>
                        Building the "observer" mode separates impulse from choice — this is absolute gold for attention mining in noisy, hyper-distracted worlds. This practical, non-spiritual self-awareness practice is highly optimized to lower neural reactivity and clear system RAM in your brain.
                      </p>
                    </div>

                    <div className="border border-white/10 p-5 rounded-2xl bg-[#050506] space-y-4">
                      <h4 className="text-fuchsia-400 font-bold font-mono tracking-wider uppercase flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-fuchsia-400" /> 60-SECOND NEURAL LANDING
                      </h4>
                      <p className="text-slate-400 leading-relaxed">
                        Let's trigger a 60-second absolute focus scan. No switching tabs, no typing. Just observe the guided prompts on the central node.
                      </p>

                      <div className="flex flex-col items-center justify-center p-6 bg-[#0a0a0c] border border-white/5 rounded-2xl relative overflow-hidden min-h-[140px]">
                        {s4TimerActive ? (
                          <div className="text-center space-y-3 font-mono">
                            <div className="w-16 h-16 rounded-full border-4 border-fuchsia-500/20 border-t-fuchsia-500 animate-spin mx-auto flex items-center justify-center">
                              <span className="text-xs font-bold text-slate-200 transform rotate-[-360deg] animate-none">{s4SecondsLeft}s</span>
                            </div>
                            
                            <p className="text-xs font-bold text-cyan-400 animate-pulse min-h-[36px] max-w-xs mx-auto leading-normal">
                              {s4SecondsLeft > 45 ? "Feel your feet firmly on the floor. Take a steady, deep posture..." :
                               s4SecondsLeft > 30 ? "Observe your breathing cycles. Notice any muscle tension..." :
                               s4SecondsLeft > 15 ? "Let passing thoughts drift by like background system tasks..." :
                               "Excellent. Simply rest in pure observational stance..."}
                            </p>
                          </div>
                        ) : s4Finished ? (
                          <div className="text-center space-y-2 font-mono">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30">
                              <Check className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold text-emerald-400 block uppercase font-bold">60S SCAN COMPLETED SUCCESSFULLY</span>
                            <span className="text-[10px] text-slate-500 block">System RAM cleared. Cognitive clarity restored.</span>
                          </div>
                        ) : (
                          <div className="text-center space-y-3 font-mono">
                            <p className="text-[10px] text-slate-500">Ready to initiate the landing module?</p>
                            <button
                              type="button"
                              disabled={completedSessions.includes('s4')}
                              onClick={() => {
                                setS4TimerActive(true);
                                setS4SecondsLeft(60);
                                setS4Finished(false);
                              }}
                              className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs rounded-xl tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-fuchsia-950/20"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> INITIALIZE 60S SCAN
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Summary Reflection */}
                      {(s4Finished || completedSessions.includes('s4')) && (
                        <div className="space-y-3 font-mono">
                          <label className="text-slate-400 text-[10px] block uppercase font-bold">COGNITIVE INDEX: DEFINE YOUR CURRENT MENTAL STATE IN ONE WORD</label>
                          <input
                            type="text"
                            value={s4Summary}
                            onChange={(e) => setS4Summary(e.target.value)}
                            disabled={completedSessions.includes('s4')}
                            placeholder="e.g. Centered / Calm / Energized"
                            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                          />
                        </div>
                      )}

                      {/* Claim Button */}
                      {(s4Finished || completedSessions.includes('s4')) && (
                        <>
                          {!completedSessions.includes('s4') ? (
                            <button
                              type="button"
                              disabled={s4Summary.trim().length === 0}
                              onClick={() => claimSessionRewards(3)}
                              className={`w-full py-2.5 rounded-xl font-bold tracking-wider font-mono text-xs flex items-center justify-center gap-1.5 transition-all ${
                                s4Summary.trim().length > 0
                                  ? 'bg-gradient-to-r from-fuchsia-500 via-indigo-600 to-cyan-500 hover:opacity-90 text-white font-bold cursor-pointer shadow-lg shadow-fuchsia-950/30'
                                  : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <Award className="w-4 h-4" /> SECURE ATTENTION INTELLIGENCE MASTER BADGE (+250 CP)
                            </button>
                          ) : (
                            <div className="bg-gradient-to-r from-fuchsia-950/30 to-cyan-950/30 border border-fuchsia-500/30 text-fuchsia-300 p-4 rounded-xl font-mono text-center space-y-2">
                              <div className="flex items-center justify-center gap-2">
                                <Award className="w-5 h-5 text-fuchsia-400 animate-bounce" />
                                <span className="text-xs font-black tracking-widest uppercase">ATTENTION INTELLIGENCE MASTER STATUS: ACTIVE</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-normal">
                                Permanent perk activated: Global facilities processing focus efficiency with full attention stability core.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Session 5: AI Inspection Tuning (Quantum Core Alignment) */}
                {activeSessionIdx === 4 && (
                  <div className="space-y-4 font-sans text-xs text-slate-300 leading-relaxed">
                    <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl">
                      <h4 className="text-cyan-400 font-bold mb-1 font-mono tracking-wider flex items-center gap-1.5 uppercase">
                        <Flame className="w-4 h-4" /> THE HOOK
                      </h4>
                      <p className="italic text-slate-200">
                        "{ATTENTION_SESSIONS[4].hook}"
                      </p>
                    </div>

                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
                      <h4 className="text-slate-200 font-bold font-mono uppercase tracking-wider">RESONANCE HARMONIZATION</h4>
                      <p>
                        Conscious attention alignment isn't just internal — it can modulate quantum coherence in active silicon components. Calibrating the three core nodes (Alpha, Theta, Gamma) to Zen harmonics (425Hz - 440Hz) locks the machine in stable efficiency.
                      </p>
                    </div>

                    <div className="border border-white/10 p-5 rounded-2xl bg-[#050506] space-y-4 font-mono">
                      <h4 className="text-fuchsia-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-fuchsia-400" /> RESONANT NODAL SYNCHRONIZER
                      </h4>

                      <div className="grid grid-cols-3 gap-3">
                        {['Alpha Node', 'Theta Node', 'Gamma Node'].map((nodeName, idx) => {
                          const isLocked = s5LockedNodes[idx];
                          const isActive = s5ActiveNode === idx && !completedSessions.includes('s5');
                          return (
                            <div 
                              key={nodeName} 
                              className={`p-3 rounded-xl border text-center relative overflow-hidden transition-all ${
                                isLocked 
                                  ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-300' 
                                  : isActive 
                                  ? 'bg-fuchsia-950/20 border-fuchsia-500/50 text-fuchsia-300 animate-pulse'
                                  : 'bg-[#0a0a0c] border-white/5 text-slate-600'
                              }`}
                            >
                              <span className="text-[9px] block text-slate-500 uppercase">NODE 0{idx + 1}</span>
                              <span className="text-xs font-bold block mt-1">{nodeName}</span>
                              <span className="text-[10px] font-bold block mt-2 font-mono">
                                {isLocked ? '✓ LOCKED (432Hz)' : isActive ? '● ALIGNING' : '☉ STANDBY'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Calibrate frequency sweep visual */}
                      {!completedSessions.includes('s5') && s5ActiveNode < 3 && !s5LockedNodes.every(Boolean) && (
                        <div className="bg-[#0a0a0c] p-4 rounded-xl border border-white/5 space-y-4">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">ACTIVE: {['ALPHA', 'THETA', 'GAMMA'][s5ActiveNode]} NODE</span>
                            <span className={`font-black font-mono text-sm tracking-wider ${
                              s5Frequency >= 425 && s5Frequency <= 440 ? 'text-emerald-400 animate-pulse' : 'text-fuchsia-400'
                            }`}>
                              {s5Frequency} Hz {s5Frequency >= 425 && s5Frequency <= 440 ? '• ZEN HOTSPOT' : ''}
                            </span>
                          </div>

                          {/* Frequency slider representation */}
                          <div className="h-6 bg-[#050506] rounded-lg border border-white/10 relative overflow-hidden flex items-center px-1">
                            {/* Sweeper marker */}
                            <motion.div 
                              className={`w-2 h-full rounded absolute ${
                                s5Frequency >= 425 && s5Frequency <= 440 ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]' : 'bg-fuchsia-500'
                              }`}
                              animate={{ left: `${((s5Frequency - 400) / 60) * 100}%` }}
                              transition={{ type: 'spring', stiffness: 120, damping: 15 }}
                            />
                            {/* Sweet-spot outline */}
                            <div className="absolute left-[41%] w-[25%] h-full border-x border-emerald-500/30 bg-emerald-500/10 pointer-events-none flex items-center justify-center">
                              <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest scale-75">ZEN ZONE</span>
                            </div>
                          </div>

                          {/* Trigger Lock Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (s5Frequency >= 425 && s5Frequency <= 440) {
                                // Lock active node!
                                const updated = [...s5LockedNodes];
                                updated[s5ActiveNode] = true;
                                setS5LockedNodes(updated);
                                if (s5ActiveNode < 2) {
                                  setS5ActiveNode(prev => prev + 1);
                                  addLog(`FREQUENCY CALIBRATION: Node ${s5ActiveNode + 1} synchronized to 432Hz resonance harmonics!`, 'success');
                                } else {
                                  addLog('FREQUENCY CALIBRATION COMPLETE: All nodes fully synchronized!', 'success');
                                }
                              } else {
                                addLog(`CALIBRATION FAILED: Attempted grid lock at ${s5Frequency}Hz. Resonance must be between 425Hz and 440Hz.`, 'warn');
                              }
                            }}
                            className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-lg shadow-fuchsia-950/20 cursor-pointer"
                          >
                            LOCK RESONANCE FREQUENCY
                          </button>
                        </div>
                      )}

                      {/* Observation logger once locked */}
                      {(s5LockedNodes.every(Boolean) || completedSessions.includes('s5')) && (
                        <div className="space-y-3">
                          <label className="text-slate-400 text-[10px] block uppercase font-bold">CALIBRATION NOTES: EXPLAIN HOW ATTENTION SYNC INFLUENCES STABILITY</label>
                          <textarea
                            rows={3}
                            value={s5FrictionNote}
                            onChange={(e) => setS5FrictionNote(e.target.value)}
                            disabled={completedSessions.includes('s5')}
                            placeholder="Write your observation on how focus resonance grounds fluctuating hardware nodes (at least 8 characters)."
                            className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs resize-none font-sans"
                          />
                        </div>
                      )}

                      {/* Claim Button */}
                      {(s5LockedNodes.every(Boolean) || completedSessions.includes('s5')) && (
                        <>
                          {!completedSessions.includes('s5') ? (
                            <button
                              type="button"
                              disabled={s5FrictionNote.trim().length < 8}
                              onClick={() => claimSessionRewards(4)}
                              className={`w-full py-2.5 rounded-xl font-bold tracking-wider font-mono text-xs flex items-center justify-center gap-1.5 transition-all ${
                                s5FrictionNote.trim().length >= 8
                                  ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-fuchsia-500 hover:opacity-90 text-slate-950 font-bold cursor-pointer shadow-lg shadow-amber-950/30'
                                  : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <Award className="w-4 h-4" /> AUTHORIZE MINER GRIDS (+300 CP)
                            </button>
                          ) : (
                            <div className="bg-gradient-to-r from-emerald-950/30 to-cyan-950/30 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl font-mono text-center space-y-1">
                              <div className="flex items-center justify-center gap-2">
                                <Award className="w-5 h-5 text-emerald-400 animate-bounce" />
                                <span className="text-xs font-black tracking-widest uppercase">MINER CALIBRATION SYNCED & APPROVED</span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-normal">
                                Ledger approval authorized: MINER_X1-QUANTUM core operating in permanent zen focus.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Neural Hardware Sidebar Upgrades Track */}
            <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-fuchsia-400" />
                  NEURAL UPGRADE SEQUENCES
                </h4>

                <div className="space-y-3">
                  {ATTENTION_SESSIONS.map((session, idx) => {
                    const isCompleted = completedSessions.includes(session.id);
                    const isLocked = idx > 0 && !completedSessions.includes(ATTENTION_SESSIONS[idx - 1].id);
                    const isActive = idx === activeSessionIdx;

                    return (
                      <div
                        key={session.id}
                        onClick={() => {
                          if (!isLocked) {
                            setActiveSessionIdx(idx);
                          }
                        }}
                        className={`p-3 rounded-xl font-mono text-xs border transition-all ${
                          isActive 
                            ? 'bg-fuchsia-950/10 border-fuchsia-500 text-slate-200 font-semibold' 
                            : isLocked 
                            ? 'opacity-40 bg-[#050506]/30 border-white/5 cursor-not-allowed'
                            : 'bg-[#050506] border-white/5 text-slate-400 hover:border-white/10 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-[9px] text-slate-500 uppercase font-mono">CORE_NODE_0{idx + 1} • {session.duration}</span>
                          {isCompleted ? (
                            <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-1 font-mono">
                              <Check className="w-3 h-3" /> UPGRADED
                            </span>
                          ) : isLocked ? (
                            <span className="text-slate-600 font-bold text-[9px] flex items-center gap-1 font-mono">
                              <Lock className="w-3 h-3" /> LOCKED
                            </span>
                          ) : (
                            <span className="text-cyan-400 font-bold text-[9px] flex items-center gap-1 animate-pulse font-mono">
                              <Play className="w-2.5 h-2.5 fill-current" /> READY
                            </span>
                          )}
                        </div>
                        <h5 className="font-semibold text-slate-200 mt-1 truncate">{session.title}</h5>
                        
                        <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-white/5 text-[9px] font-mono">
                          <span className="text-slate-500">BOOST: +{session.rewards.efficiency}x</span>
                          <span className="text-amber-400 font-bold font-mono">+{session.rewards.cp} CP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Holographic Neural Core Master Badge */}
              <div className="border-t border-white/5 pt-3 mt-4">
                {isMaster ? (
                  <div className="bg-gradient-to-r from-fuchsia-950/20 via-cyan-950/20 to-fuchsia-950/20 p-4 border border-fuchsia-500/30 rounded-2xl text-center space-y-1.5 shadow-lg shadow-fuchsia-950/25 relative overflow-hidden">
                    <div className="absolute inset-0 bg-cyber-grid bg-[size:16px_16px] opacity-10 pointer-events-none" />
                    <Award className="w-10 h-10 text-fuchsia-400 mx-auto animate-pulse" />
                    <h5 className="text-[11px] font-black tracking-widest text-white uppercase font-mono">COGNITIVE_MASTER</h5>
                    <p className="text-[9px] text-slate-400 leading-normal font-sans">
                      All core neural upgrades loaded. System operations stabilized with full attention coherence.
                    </p>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 font-mono text-center py-2 flex items-center justify-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-slate-500" />
                    <span>{completedSessions.length}/{ATTENTION_SESSIONS.length} COGNITIVE INTEGRATIONS ONLINE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* VERIFICATION TERMINAL - NEURAL SNAP QUIZ MODAL */}
      <AnimatePresence>
        {quizState !== 'idle' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020204]/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-[#070709] border border-fuchsia-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.15)] flex flex-col font-mono"
            >
              {/* Header */}
              <div className="bg-[#0b0b0e] border-b border-white/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                  <span className="text-xs font-black tracking-wider text-slate-100 uppercase">
                    NEURAL VERIFICATION TERMINAL v1.2
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-ping" />
                  <span className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-widest">
                    SECURE CHANNELS ACTIVE
                  </span>
                </div>
              </div>

              {/* Quiz Mode */}
              {quizState === 'quiz' && activeQuizQuestions.length > 0 && (
                <div className="p-6 space-y-6">
                  {/* Progress indicator */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="uppercase">Proof-of-Attention Verification</span>
                    <span className="text-fuchsia-400 font-bold">
                      QUESTION {currentQuizIdx + 1} OF {activeQuizQuestions.length}
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="h-1.5 bg-[#020203] border border-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 transition-all duration-300"
                      style={{ width: `${((currentQuizIdx + 1) / activeQuizQuestions.length) * 100}%` }}
                    />
                  </div>

                  {/* Question Box */}
                  <div className="bg-[#030304] border border-white/5 rounded-xl p-4 shadow-inner">
                    <p className="text-xs leading-relaxed text-slate-200">
                      {activeQuizQuestions[currentQuizIdx].question}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {activeQuizQuestions[currentQuizIdx].options.map((opt, oIdx) => {
                      const isSelected = selectedQuizAnswer === oIdx;
                      const isCorrect = oIdx === activeQuizQuestions[currentQuizIdx].correctIdx;
                      const showFeedback = selectedQuizAnswer !== null;

                      let btnStyle = "bg-[#0b0b0e] border-white/5 text-slate-400 hover:text-slate-200 hover:border-fuchsia-500/30";
                      if (showFeedback) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)]";
                        } else if (isSelected) {
                          btnStyle = "bg-red-950/40 border-red-500/50 text-red-400 font-bold";
                        } else {
                          btnStyle = "bg-[#0b0b0e]/40 border-white/5 text-slate-600 opacity-60";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-fuchsia-950/40 border-fuchsia-500 text-fuchsia-300 font-bold";
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          disabled={showFeedback}
                          onClick={() => setSelectedQuizAnswer(oIdx)}
                          className={`w-full text-left text-xs p-3.5 border rounded-xl transition-all flex items-center justify-between gap-3 ${btnStyle} ${!showFeedback ? 'cursor-pointer' : ''}`}
                        >
                          <span>{opt}</span>
                          {showFeedback && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                          {showFeedback && isSelected && !isCorrect && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback Explanation */}
                  <AnimatePresence>
                    {selectedQuizAnswer !== null && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-3.5 rounded-xl text-[10px] leading-normal border ${
                          selectedQuizAnswer === activeQuizQuestions[currentQuizIdx].correctIdx
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
                            : 'bg-red-500/5 border-red-500/20 text-slate-300'
                        }`}
                      >
                        <span className={`font-black uppercase block mb-1 tracking-wider ${
                          selectedQuizAnswer === activeQuizQuestions[currentQuizIdx].correctIdx ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {selectedQuizAnswer === activeQuizQuestions[currentQuizIdx].correctIdx ? '✔ VALIDATED' : '✘ INCORRECT CALIBRATION'}
                        </span>
                        {activeQuizQuestions[currentQuizIdx].explanation}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  {selectedQuizAnswer !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextScore = quizScore + (selectedQuizAnswer === activeQuizQuestions[currentQuizIdx].correctIdx ? 1 : 0);
                        if (currentQuizIdx + 1 < activeQuizQuestions.length) {
                          setQuizScore(nextScore);
                          setCurrentQuizIdx(currentQuizIdx + 1);
                          setSelectedQuizAnswer(null);
                        } else {
                          // Compile final results
                          const isPass = (nextScore / activeQuizQuestions.length) >= 1.0; // require 100%
                          if (isPass) {
                            setQuizScore(nextScore);
                            setQuizState('passed');
                            setIsScanningOverlay(true);
                            addLog(`VERIFICATION TERMINAL: All attention checks correct. Initiating AI Inspection Sweep...`, 'success');
                            setTimeout(() => {
                              setIsScanningOverlay(false);
                              if (pendingSessionIdx !== null) {
                                applyPendingRewards(pendingSessionIdx);
                              }
                              setQuizState('idle');
                            }, 3500);
                          } else {
                            setQuizState('failed');
                            addLog(`VERIFICATION TERMINAL: Score ${nextScore}/${activeQuizQuestions.length} is below standard. Verification rejected.`, 'warn');
                          }
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-cyan-500 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-fuchsia-950/20"
                    >
                      <span>
                        {currentQuizIdx + 1 < activeQuizQuestions.length ? 'PROCEED TO NEXT TEST' : 'COMPILE ANALYSIS RESULTS'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </button>
                  )}
                </div>
              )}

              {/* Passed Mode */}
              {quizState === 'passed' && (
                <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-8 h-8 animate-bounce text-emerald-400" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-emerald-400 font-bold tracking-widest block uppercase">
                      Attention Integrity Verified
                    </span>
                    <h3 className="text-sm font-black text-slate-100">
                      POL PROOF RECORDED ON CONSTITUENT CHANNELS
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                    Analyzing attention density arrays. Calibrating hardware nodes with mainnet ledger credentials. Please wait for the AI Inspection Scanner sweep.
                  </p>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 border border-white/5 bg-[#030304] p-3 rounded-xl max-w-xs mx-auto">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                    <span>SYNCHRONIZING REWARD METRICS...</span>
                  </div>
                </div>
              )}

              {/* Failed Mode */}
              {quizState === 'failed' && (
                <div className="p-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-400 border border-red-500/30">
                    <ShieldAlert className="w-8 h-8 animate-pulse text-red-400" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-red-400 font-bold tracking-widest block uppercase">
                      Verification Failure
                    </span>
                    <h3 className="text-base font-black text-slate-100 uppercase">
                      Attention Coherence Check Rejected
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                    You answered {quizScore} of {activeQuizQuestions.length} checks correctly. A perfect attention density profile (100%) is required to forge these structural hardware parameters.
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Re-trigger the quiz with new random questions
                        if (pendingSessionIdx !== null) {
                          claimSessionRewards(pendingSessionIdx);
                        }
                      }}
                      className="py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      RETRY QUIZ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizState('idle');
                        setPendingSessionIdx(null);
                      }}
                      className="py-3 bg-[#0c0c0f] border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl tracking-wider transition-all cursor-pointer"
                    >
                      ABORT FOR NOW
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI INSPECTION OVERLAY SWEEP */}
      <AnimatePresence>
        {isScanningOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#000000]/60 backdrop-blur-[2px] pointer-events-none flex flex-col justify-between"
          >
            {/* Glowing neon laser scanline sweeping down and up */}
            <motion.div
              initial={{ top: '0%' }}
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3.5, ease: 'easeInOut', repeat: 0 }}
              className="absolute left-0 w-full h-[6px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_30px_rgba(52,211,153,1),0_0_60px_rgba(52,211,153,0.8)] z-50"
            />
            
            {/* Horizontal digital layout matrix lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(16,185,129,0.06)_2px,transparent_2px)] bg-[size:100%_8px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.02)_2px,transparent_2px)] bg-[size:8px_100%]" />

            {/* Sweep Telemetry readout text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center space-y-4">
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="font-mono text-emerald-400 text-xs font-black tracking-widest bg-slate-950/90 border border-emerald-500/50 px-8 py-5 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.25)] flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>[ SYSTEM-WIDE AI INSPECTION SCAN IN PROGRESS ]</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">
                  SCANNING FOR BRAIN RESONANCE COHERENCE & ATTENTION LEVEL CONFIRMED
                </span>
                <div className="w-48 h-1.5 bg-emerald-950 rounded-full overflow-hidden mt-3 p-0.5 border border-emerald-500/20">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3.2, ease: 'linear' }}
                    className="h-full bg-emerald-400 rounded-full"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

