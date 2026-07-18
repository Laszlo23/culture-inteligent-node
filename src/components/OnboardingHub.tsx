/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Wallet, Key, ShieldCheck, Trophy, HelpCircle, 
  ChevronRight, Copy, Check, ExternalLink, Cpu, Info, 
  Settings2, Rocket, ArrowRight, Share2, Network, Compass,
  Flame, BookOpen, ShieldAlert, Terminal, CheckSquare, Globe, Coins
} from 'lucide-react';
import { GameState, SoulboundReputation } from '../types';
import SoulboundRitualOverlay from './SoulboundRitualOverlay';
import { Keypair } from '@solana/web3.js';

interface OnboardingHubProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onEnterApp?: () => void;
}

export default function OnboardingHub({ state, setState, addLog, onEnterApp }: OnboardingHubProps) {
  const [copied, setCopied] = useState(false);
  const [partnerCommunitySize, setPartnerCommunitySize] = useState<number>(500);
  const [partnerCustomDuration, setPartnerCustomDuration] = useState<number>(7);
  const [partnerTokenType, setPartnerTokenType] = useState<'meme' | 'utility' | 'nft'>('utility');
  const [subTab, setSubTab] = useState<'economy' | 'proofs' | 'fairness' | 'partners'>('economy');
  const [mintingPoaId, setMintingPoaId] = useState<string | null>(null);
  const [showSoulboundRitual, setShowSoulboundRitual] = useState(false);
  const [ritualWallet, setRitualWallet] = useState<{
    address: string;
    walletType: 'extension' | 'local';
    localKeypair: Keypair | null;
  } | null>(null);

  // Live Oracle Feed State for Transparency Page
  const [oracleLogs, setOracleLogs] = useState<Array<{ id: string; node: string; action: string; reward: string; time: string }>>([
    { id: 'o_1', node: 'Node #48291', action: 'Verified 25m Deep Focus Session', reward: '+150 Cognitive Energy', time: '1s ago' },
    { id: 'o_2', node: 'Node #11094', action: 'Completed "Rust Compiler Loops" Course', reward: '+100 BCC, +1 Knowledge Fragment', time: '4s ago' },
    { id: 'o_3', node: 'Node #72810', action: 'Contributed Code Snippet to Dev Guild Hub', reward: '+35 Energy, +20 BCC', time: '12s ago' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const nodes = ['Node #90218', 'Node #33812', 'Node #75429', 'Node #12093', 'Node #55601', 'Node #88392'];
      const actions = [
        'Verified 25m Deep Focus Session',
        'Completed "AI Basics Lesson" Course',
        'Stabilized Zen Coresync Coherence at 92%',
        'Contributed Insight on Autonomous Agents',
        'Claimed Daily Streak signature bonus'
      ];
      const rewards = [
        '+150 Cognitive Energy, +20 BCC',
        '+100 BCC, +1 Knowledge Fragment',
        '+30% Core Energy, +250 CP',
        '+20 BCC, +50 Energy',
        '+150 BCC, Streak Streak x3'
      ];
      
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];

      setOracleLogs(prev => [
        { id: 'o_' + Date.now(), node: randomNode, action: randomAction, reward: randomReward, time: 'Just now' },
        ...prev.slice(0, 5)
      ]);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const contractAddress =
    'ZKPassport-gated soulbound · Token-2022 NonTransferable (Devnet)';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("https://github.com/Laszlo23/culture-inteligent-node");
    setCopied(true);
    addLog("COPIED: Building Culture repo URL (BCC SPL mint coming — rewards are facility CP until then).", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const openSoulboundRitual = () => {
    try {
      const sessionRaw = localStorage.getItem('solana_current_user_session_v1');
      const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
      if (!sessionUser?.walletAddress) {
        addLog('SOULBOUND: Connect a wallet first.', 'warn');
        return;
      }
      let localKeypair: Keypair | null = null;
      if (sessionUser.walletType === 'local') {
        const secret = localStorage.getItem('solana_local_secret');
        if (secret) {
          localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
        }
      }
      setRitualWallet({
        address: sessionUser.walletAddress,
        walletType: sessionUser.walletType === 'extension' ? 'extension' : 'local',
        localKeypair,
      });
      setShowSoulboundRitual(true);
    } catch {
      addLog('SOULBOUND: Could not read wallet session.', 'warn');
    }
  };

  const onSoulboundComplete = (rep: SoulboundReputation) => {
    setState((prev) => ({
      ...prev,
      soulboundReputation: rep,
      proofOfAttentions: (prev.proofOfAttentions || []).map((p) =>
        p.walletAddress === rep.boundWallet ||
        (ritualWallet && p.walletAddress.includes(ritualWallet.address.slice(0, 8)))
          ? {
              ...p,
              soulboundMinted: true,
              soulbound: rep,
            }
          : p
      ),
    }));
  };

  // Prefer real agent-verified proofs; placeholder only when empty
  const proofs =
    state.proofOfAttentions && state.proofOfAttentions.length > 0
      ? state.proofOfAttentions
      : [
          {
            id: 'poa_demo',
            walletAddress: 'Complete Academy for real PoA',
            activity: 'No verified sessions yet',
            duration: 0,
            verification: 'Finish Attention Academy + Gemini agent verify',
            rewardEnergy: 0,
            rewardBcc: 0,
            timestamp: new Date().toISOString(),
            minted: false,
          },
        ];

  /** Memo attest = PoA activity receipt (not soulbound). */
  const handleAttestPoa = async (id: string) => {
    const target = (state.proofOfAttentions || []).find((p) => p.id === id);
    if (!target) {
      addLog(
        'ATTEST BLOCKED: Only agent-verified PoA records can be attested. Finish Academy first.',
        'warn'
      );
      return;
    }
    if ((target.attested || target.minted) && target.signature) {
      addLog(
        `Already attested: https://solscan.io/tx/${target.signature}?cluster=devnet`,
        'info'
      );
      return;
    }

    setMintingPoaId(id);
    try {
      const sessionRaw = localStorage.getItem('solana_current_user_session_v1');
      const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
      if (!sessionUser?.walletAddress) throw new Error('No wallet session');

      const {
        sendPoaMemoAttestation,
        attestAttentionProof,
        ensureWalletApiSession,
        getWalletToken,
      } = await import('../lib/api.ts');
      let localKeypair: Keypair | null = null;
      if (sessionUser.walletType === 'local') {
        const secret = localStorage.getItem('solana_local_secret');
        if (secret) {
          localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
        }
      }
      if (!getWalletToken()) {
        await ensureWalletApiSession({
          walletAddress: sessionUser.walletAddress,
          walletType: sessionUser.walletType || 'local',
          localKeypair,
        });
      }
      const memo = `poa:${target.sessionId || id}:${target.score ?? 0}`;
      addLog('ATTEST: Broadcasting Devnet memo for PoA (not soulbound)…', 'info');
      const signature = await sendPoaMemoAttestation({
        walletAddress: sessionUser.walletAddress,
        walletType: sessionUser.walletType || 'local',
        localKeypair,
        memo,
      });
      await attestAttentionProof({
        verificationId: id,
        signature,
        sessionId: target.sessionId,
        score: target.score,
      });
      setState((prev) => ({
        ...prev,
        proofOfAttentions: (prev.proofOfAttentions || []).map((p) =>
          p.id === id
            ? { ...p, minted: true, attested: true, signature, attestPending: false }
            : p
        ),
        credits: prev.credits + 50,
      }));
      addLog(`POA ATTESTED (memo): https://solscan.io/tx/${signature}?cluster=devnet`, 'success');
    } catch (err: any) {
      addLog(`POA ATTEST FAILED: ${err?.message || err}`, 'warn');
    } finally {
      setMintingPoaId(null);
    }
  };

  const otherProducts = [
    {
      name: "Building Culture ID",
      url: "https://buildingcultureid.space/",
      tagline: "Core Sovereign Web3 Identity Ledger",
      desc: "The fundamental decentralized passport and identity mapping layer for the Building Culture ecosystem.",
      accent: "from-cyan-500/20 to-blue-500/5",
      border: "hover:border-cyan-500/30",
      icon: <Key className="w-5 h-5 text-cyan-400" />
    },
    {
      name: "Building Culture App",
      url: "https://app.buildingcultureid.space/",
      tagline: "Primary Culture Mining Dashboard",
      desc: "Deploy raw hardware reactors, monitor live hash operations, and manage active token yields.",
      accent: "from-amber-500/20 to-orange-500/5",
      border: "hover:border-amber-500/30",
      icon: <Cpu className="w-5 h-5 text-amber-400" />
    },
    {
      name: "Building Culture Agent",
      url: "https://agent.buildingcultureid.space/",
      tagline: "Autonomous Agent Core Node",
      desc: "Deploy interactive neural workflows that auto-optimize compiler loops and monitor ledger balances.",
      accent: "from-purple-500/20 to-pink-500/5",
      border: "hover:border-purple-500/30",
      icon: <Network className="w-5 h-5 text-purple-400" />
    },
    {
      name: "Pepe Mining Hub",
      url: "https://pepe.buildingcultureid.space/",
      tagline: "Decentralized Meme Mining Reactor",
      desc: "Leverage viral meme-energy coefficients to unlock high-yield visual mining and custom rig upgrades.",
      accent: "from-emerald-500/20 to-teal-500/5",
      border: "hover:border-emerald-500/30",
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />
    },
    {
      name: "Match Engine Portal",
      url: "https://match.buildingcultureid.space/",
      tagline: "Algorithmic Alliance Matcher",
      desc: "Match compatible operational nodes to construct synergized guilds and scale collective hash rates.",
      accent: "from-rose-500/20 to-red-500/5",
      border: "hover:border-rose-500/30",
      icon: <Trophy className="w-5 h-5 text-rose-400" />
    },
    {
      name: "WMOS Portal",
      url: "https://wmos.buildingcultureid.space/",
      tagline: "World Map Operating System",
      desc: "The universal visual layer charting physical culture nodes and geolocated Web3 guilds worldwide.",
      accent: "from-indigo-500/20 to-violet-500/5",
      border: "hover:border-indigo-500/30",
      icon: <Compass className="w-5 h-5 text-indigo-400" />
    }
  ];

  // Helper calculation for custom partner session
  const estimatedHourlyYield = Math.floor(partnerCommunitySize * (partnerTokenType === 'meme' ? 1.5 : partnerTokenType === 'nft' ? 2.2 : 1.2) * (partnerCustomDuration / 2));
  const estimatedTotalCampaignBcc = estimatedHourlyYield * 24 * partnerCustomDuration;

  return (
    <div id="onboarding-hub" className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Dynamic Hero Banner */}
      <div className="relative rounded-3xl bg-[#0a0a0c] border border-white/5 p-8 md:p-12 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid bg-[size:32px_32px] opacity-[0.03] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-6">
          <span className="px-3 py-1 bg-cyan-950/40 text-cyan-400 text-[9px] font-mono tracking-widest font-black rounded-full border border-cyan-500/20 uppercase inline-flex items-center gap-1.5 animate-pulse">
            <Rocket className="w-3.5 h-3.5" /> ECOSYSTEM HUB
          </span>
          
          <h1 className="font-mono text-3xl md:text-5xl font-black text-slate-100 tracking-tight leading-none uppercase">
            Mining Culture. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-amber-400">Powering Communities.</span>
          </h1>

          <p className="font-sans text-xs md:text-sm text-slate-400 leading-relaxed">
            Welcome to the centralized onboarding center of the <strong>Building Culture Ecosystem</strong>. We transform passive online communities, viral attention energy, and custom project ecosystems into high-velocity interactive mining protocols. Secure, sovereign, and entirely built on decentralized pipelines.
          </p>

          {/* Token Address Display with Interactive Copy Utility */}
          <div className="bg-[#050506] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <span className="text-[9px] text-amber-500 font-bold tracking-widest uppercase block">OFFICIAL $BCC TOKEN CONTRACT (BASE)</span>
              <span className="text-slate-300 font-bold select-all break-all">{contractAddress}</span>
            </div>
            <button
              onClick={handleCopyAddress}
              className={`px-4 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                copied 
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400 hover:bg-cyan-950/10'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "COPIED LEDGER" : "COPY BASE CONTRACT"}
            </button>
          </div>

          {onEnterApp && (
            <div className="pt-2">
              <button
                onClick={onEnterApp}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-black font-mono text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                ACCESS ACTIVE PROTOCOL CORE
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-tab Selection Menu */}
      <div className="flex flex-wrap border-b border-white/5 gap-6 font-mono text-xs font-bold">
        <button
          onClick={() => setSubTab('economy')}
          className={`pb-3 px-1 transition-all relative cursor-pointer tracking-wider flex items-center gap-1.5 uppercase ${
            subTab === 'economy' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Compass className="w-4 h-4 text-amber-400" />
          1. Protocol Economy
        </button>
        <button
          onClick={() => setSubTab('proofs')}
          className={`pb-3 px-1 transition-all relative cursor-pointer tracking-wider flex items-center gap-1.5 uppercase ${
            subTab === 'proofs' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          2. Proof of Attention
        </button>
        <button
          onClick={() => setSubTab('fairness')}
          className={`pb-3 px-1 transition-all relative cursor-pointer tracking-wider flex items-center gap-1.5 uppercase ${
            subTab === 'fairness' ? 'text-teal-400 border-b-2 border-teal-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Terminal className="w-4 h-4 text-teal-400" />
          3. Fair Mining Page
        </button>
        <button
          onClick={() => setSubTab('partners')}
          className={`pb-3 px-1 transition-all relative cursor-pointer tracking-wider flex items-center gap-1.5 uppercase ${
            subTab === 'partners' ? 'text-fuchsia-400 border-b-2 border-fuchsia-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Network className="w-4 h-4 text-fuchsia-400" />
          4. Partners & Products
        </button>
      </div>

      {/* Dynamic Viewport */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          
          {/* SubTab 1: Protocol Economy */}
          {subTab === 'economy' && (
            <div className="space-y-8">
              {/* Q&A Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                <div className="bg-[#0a0a0c] border border-white/5 p-6 rounded-2xl relative overflow-hidden space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm">What is BCC?</h3>
                  <p className="font-sans text-slate-400 leading-relaxed text-[11px]">
                    Building Culture Coin ($BCC) is the primary economic unit powering our decentralization network. It acts as both gas, voting consensus weight, and coordination liquidity.
                  </p>
                </div>
                
                <div className="bg-[#0a0a0c] border border-white/5 p-6 rounded-2xl relative overflow-hidden space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm">Why does it have value?</h3>
                  <p className="font-sans text-slate-400 leading-relaxed text-[11px]">
                    Unlike traditional currencies backed by empty printing presses, BCC is backed by <strong>verified human attention energy</strong>, cognitive progress logs, and collaborative builder contributions.
                  </p>
                </div>

                <div className="bg-[#0a0a0c] border border-white/5 p-6 rounded-2xl relative overflow-hidden space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 border border-fuchsia-500/20">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm">What happens when I mine?</h3>
                  <p className="font-sans text-slate-400 leading-relaxed text-[11px]">
                    Your node processes learning proofs on the Solana ledger. Maintaining stasis, taking focus logs, and compiling lessons converts attention noise into cryptographically solid reputation hashes.
                  </p>
                </div>
              </div>

              {/* Economy Flow Map */}
              <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center gap-2 mb-6">
                  <Compass className="w-5 h-5 text-amber-400" />
                  <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">THE CORE PROTOCOL ECONOMY FLOW</h3>
                </div>

                <div className="relative">
                  {/* Flow Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 relative z-10 text-xs font-mono">
                    {[
                      { num: "01", label: "LEARN", icon: <BookOpen className="w-4 h-4 text-amber-400" />, desc: "Synthesize lessons in the Attention Academy" },
                      { num: "02", label: "GENERATE ATTENTION ENERGY", icon: <Flame className="w-4 h-4 text-orange-400" />, desc: "Keep node core stasis fully charged" },
                      { num: "03", label: "MINE BCC POINTS", icon: <Coins className="w-4 h-4 text-yellow-400" />, desc: "Mine $BCC and $COGNITIVE rewards" },
                      { num: "04", label: "UPGRADE NODE", icon: <Settings2 className="w-4 h-4 text-cyan-400" />, desc: "Acquire better parts or construct facility sectors" },
                      { num: "05", label: "INCREASE MINING EFFICIENCY", icon: <Cpu className="w-4 h-4 text-purple-400" />, desc: "Scale global multiplier metrics" },
                      { num: "06", label: "EARN REPUTATION", icon: <ShieldCheck className="w-4 h-4 text-teal-400" />, desc: "Mint Soulbound Proof of Attention NFTs" },
                      { num: "07", label: "PARTICIPATE IN ECOSYSTEM", icon: <Globe className="w-4 h-4 text-indigo-400" />, desc: "Join builder factions and run custom white-label camps" },
                    ].map((step, idx) => (
                      <div key={idx} className="bg-[#050506]/80 border border-white/5 hover:border-amber-500/20 rounded-xl p-4 flex flex-col justify-between min-h-[140px] relative transition-all group">
                        <span className="absolute top-2 right-2 text-[10px] text-slate-600 font-bold">{step.num}</span>
                        <div>
                          <div className="mb-2">{step.icon}</div>
                          <span className="text-[10px] font-black text-slate-200 block uppercase tracking-tight group-hover:text-amber-400 transition-colors">{step.label}</span>
                        </div>
                        <p className="font-sans text-[10px] text-slate-500 leading-normal mt-2">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SubTab 2: Proof of Attention Ledger */}
          {subTab === 'proofs' && (
            <div className="space-y-6">
              <div className="bg-[#0a0a0c] border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-100 tracking-wider">PROOF OF CONTRIBUTION LEDGER</h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">
                      Every course module you graduate and focus session you maintain creates a verifiable cryptographic proof. Mint them as permanent Soulbound NFTs to secure passive reputation multipliers.
                    </p>
                  </div>
                </div>
                
                <div className="font-mono text-xs bg-[#050506] border border-white/10 px-4 py-2.5 rounded-xl flex gap-4 text-center">
                  <div>
                    <span className="text-[8px] text-slate-500 block">PROOFS RECORDED</span>
                    <span className="text-sm font-bold text-cyan-400 font-black">{(state.proofOfAttentions || proofs).length}</span>
                  </div>
                  <div className="w-[1px] bg-white/10" />
                  <div>
                    <span className="text-[8px] text-slate-500 block">SOULBOUND BADGES</span>
                    <span className="text-sm font-bold text-amber-400 font-black">{(state.proofOfAttentions || proofs).filter(p => p.minted).length}</span>
                  </div>
                </div>
              </div>

              {/* Proofs Grid list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
                {(state.proofOfAttentions || proofs).map((p, index) => (
                  <div 
                    key={p.id}
                    className={`bg-[#0a0a0c] border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[220px] transition-all ${
                      p.minted 
                        ? 'border-emerald-500/20 bg-emerald-950/[0.02]' 
                        : 'border-white/5 hover:border-cyan-500/30'
                    }`}
                  >
                    {/* Background stamp */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/[0.02] rounded-full pointer-events-none" />

                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-slate-500 font-bold uppercase block">POA ID: #{p.id.toUpperCase()}</span>
                        <span className={`text-[8px] font-bold border px-1.5 py-0.5 rounded tracking-widest uppercase ${
                          p.soulboundMinted || state.soulboundReputation?.soulboundMinted
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                            : p.attested || p.minted
                              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-400'
                        }`}>
                          {p.soulboundMinted || state.soulboundReputation?.soulboundMinted
                            ? '✓ SOULBOUND · ZK'
                            : p.attested || p.minted
                              ? 'ATTESTED (MEMO)'
                              : 'ZK GATE'}
                        </span>
                      </div>

                      <h4 className="text-slate-100 font-bold text-sm mt-3">{p.activity}</h4>

                      <div className="grid grid-cols-2 gap-4 mt-4 bg-[#050506] p-3 rounded-xl border border-white/5 text-[10px]">
                        <div>
                          <span className="text-slate-500 text-[8px] block uppercase">Operator Wallet</span>
                          <span className="text-slate-300 font-bold select-all">{p.walletAddress}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8px] block uppercase">Duration</span>
                          <span className="text-slate-300 font-bold">{p.duration} Minutes focus</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8px] block uppercase">Verification Source</span>
                          <span className="text-cyan-400 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> {p.verification}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[8px] block uppercase">Earned Reward</span>
                          <span className="text-amber-400 font-bold">+{p.rewardEnergy} Energy / +{p.rewardBcc} BCC</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-white/5 flex justify-between items-center text-[10px]">
                      <span className="text-slate-500">{p.timestamp}</span>
                      
                      <div className="flex flex-wrap gap-2 justify-end">
                        {!(p.attested || p.minted) && p.id !== 'poa_demo' && (
                          <button
                            type="button"
                            onClick={() => void handleAttestPoa(p.id)}
                            disabled={mintingPoaId === p.id}
                            className="px-3 py-2 border border-white/15 text-slate-300 font-bold uppercase text-[10px] tracking-wider rounded-lg cursor-pointer hover:border-amber-400/40"
                          >
                            {mintingPoaId === p.id ? 'ATTESTING…' : 'ATTEST MEMO'}
                          </button>
                        )}
                        {p.soulboundMinted || state.soulboundReputation?.soulboundMinted ? (
                          <div className="text-emerald-400 font-bold flex items-center gap-1 px-2">
                            <Check className="w-4 h-4" /> SOULBOUND SEALED
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={openSoulboundRitual}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-black uppercase text-[10px] tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            SEAL SOULBOUND · ZK
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SubTab 3: Fair Mining Page */}
          {subTab === 'fairness' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-mono text-xs">
              
              {/* Philosophy */}
              <div className="lg:col-span-7 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-teal-400" />
                  <h3 className="text-sm font-semibold text-slate-100 tracking-wider">FAIR MINING PROTOCOL PARAMETERS</h3>
                </div>

                <p className="font-sans text-slate-400 leading-relaxed text-xs">
                  Many mining games use artificial algorithms, fake hash rates, or heavy venture-capital dumps that deplete retail builders. Building Culture stands strictly on <strong>Absolute Proof of Attention (PoA)</strong>:
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    { label: "On-Chain Activity Proofs", desc: "Real Solana Devnet: KPI contribution transfer + optional PoA memo attestation after Gemini agent verify. Facility CP stays off-chain until SPL mint." },
                    { label: "Verified Learning & Study Logs", desc: "Hash rate is powered by real attention. Complete modules, verify focus timers, and solve puzzles to expand node parameters." },
                    { label: "Transparent Resource Distribution", desc: "Zero pre-mines. Developer allocations scale linearly with community growth. 100% of mining parameters are fully open-source and visible on-chain." },
                    { label: "Proof of Attention Validation", desc: "Decentralized community oracles cross-examine focus logs to prevent script exploitation or click-bot harvesting." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-3 bg-[#050506] border border-white/5 p-3 rounded-xl">
                      <div className="w-5 h-5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold shrink-0">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-slate-200 font-bold">{item.label}</h4>
                        <p className="font-sans text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Oracle Live Logs */}
              <div className="lg:col-span-5 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-200 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                      ORACLE VERIFICATION FEED
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase">Live ledger</span>
                  </div>

                  <div className="space-y-3 max-h-[290px] overflow-y-auto divide-y divide-white/[0.03]">
                    {oracleLogs.map(log => (
                      <div key={log.id} className="pt-2.5 pb-2 flex gap-2 items-start text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between text-slate-400 font-bold text-[9px]">
                            <span>{log.node}</span>
                            <span>{log.time}</span>
                          </div>
                          <p className="text-slate-200 mt-1">{log.action}</p>
                          <span className="text-[9px] text-teal-400 font-bold block mt-0.5">{log.reward}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 mt-4 text-[9px] text-slate-500 text-center uppercase tracking-widest">
                  Secure decentralized oracle stream v1.8
                </div>
              </div>
            </div>
          )}

          {/* SubTab 4: Partners & Products */}
          {subTab === 'partners' && (
            <div className="space-y-8">
              
              {/* Partner integration sandbox */}
              <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2">
                      <Network className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">CUSTOM MINING SESSIONS FOR WEB3 PARTNERS</h3>
                    </div>
                    
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Are you building a Web3 protocol, launching a meme community, or administering an NFT collective? We can design, compile, and execute <strong>custom, white-labeled Mining Sessions</strong> tailored perfectly to your ecosystem metadata!
                    </p>

                    <div className="space-y-2.5 text-[11px] text-slate-400 font-sans leading-relaxed">
                      <p>
                        Instead of simple staking pools, your users actively execute diagnostic challenges, play microcode puzzles, and trigger customized lucky wheelspins designed to propagate <strong>your native token or custom NFT rewards</strong> alongside $BCC.
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px]">
                        <li className="flex items-center gap-1.5 bg-[#050506] border border-white/5 p-2 rounded-lg">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> Dynamic Metadata Injection
                        </li>
                        <li className="flex items-center gap-1.5 bg-[#050506] border border-white/5 p-2 rounded-lg">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> Direct Smart Contract Audits
                        </li>
                        <li className="flex items-center gap-1.5 bg-[#050506] border border-white/5 p-2 rounded-lg">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> Custom Cooldown Ratios
                        </li>
                        <li className="flex items-center gap-1.5 bg-[#050506] border border-white/5 p-2 rounded-lg">
                          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" /> Multitoken Liquidity Swaps
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Interactive Calculator Box */}
                  <div className="lg:col-span-5 bg-[#050506] border border-white/10 rounded-2xl p-6 space-y-4 font-mono text-xs">
                    <h4 className="text-slate-200 font-black text-[10px] tracking-wider uppercase border-b border-white/5 pb-2 flex items-center gap-1.5">
                      <Settings2 className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} /> SESSION ESTIMATOR PIPELINE
                    </h4>

                    {/* Input 1: Community Size */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>ESTIMATED COMMUNITY SIZE</span>
                        <span className="text-cyan-400 font-bold">{partnerCommunitySize} MEMBERS</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="5000"
                        step="50"
                        value={partnerCommunitySize}
                        onChange={(e) => setPartnerCommunitySize(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Input 2: Campaign duration */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>CAMPAIGN SESSION DURATION</span>
                        <span className="text-cyan-400 font-bold">{partnerCustomDuration} DAYS</span>
                      </div>
                      <input
                        type="range"
                        min="3"
                        max="30"
                        step="1"
                        value={partnerCustomDuration}
                        onChange={(e) => setPartnerCustomDuration(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/5 rounded-lg appearance-none"
                      />
                    </div>

                    {/* Input 3: Token Type */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 block uppercase">NATIVE ECOSYSTEM FOCUS</label>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        {['utility', 'meme', 'nft'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setPartnerTokenType(type as any)}
                            className={`py-1.5 rounded-lg border font-bold uppercase transition-all ${
                              partnerTokenType === type 
                                ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400' 
                                : 'border-white/5 bg-[#0a0a0c] text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculation Output panel */}
                    <div className="bg-[#0a0a0c] border border-white/5 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">EST. HOURLY HASH VELOCITY</span>
                        <span className="text-slate-300 font-bold">{(estimatedHourlyYield / 10).toFixed(1)} GH/s</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">HOURLY $BCC SWAP POOL</span>
                        <span className="text-slate-300 font-bold">{estimatedHourlyYield} BCC / hr</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-amber-500 text-[10px] font-black uppercase">TOTAL CAMPAIGN MINING LIMIT</span>
                        <span className="text-amber-400 font-black text-right">{estimatedTotalCampaignBcc.toLocaleString()} $BCC</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addLog(`PARTNER TRANSMISSION DISPATCHED: Submitted session request for ${partnerCommunitySize} members. Core estimating allocation...`, "success");
                        alert(`Thank you! Our core development team will construct a tailored ${partnerCustomDuration}-day mining contract fit for your ${partnerTokenType} token metadata ecosystem.`);
                      }}
                      className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black text-center rounded-xl text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      DEPLOY CUSTOM SESSION PROTOCOL
                    </button>
                  </div>
                </div>
              </div>

              {/* PRODUCTS ECOSYSTEM DIRECTORY */}
              <div className="space-y-6">
                <div className="text-center max-w-2xl mx-auto space-y-2 font-mono">
                  <h3 className="text-sm font-semibold text-slate-100 tracking-wider uppercase">BUILDING CULTURE REGISTERED SUITE</h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Explore the interconnected decentralized product lineup of the <strong>Building Culture ID</strong> network. All modules utilize shared consensus, native Base integration, and synergized identity vaults.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherProducts.map((prod) => (
                    <a
                      key={prod.name}
                      href={prod.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${prod.accent} ${prod.border} group`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl">
                            {prod.icon}
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                        </div>
                        
                        <div>
                          <h4 className="font-mono text-xs font-black text-slate-100 uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                            {prod.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{prod.tagline}</span>
                        </div>

                        <p className="text-[11px] text-slate-400 font-sans leading-relaxed min-h-[48px]">
                          {prod.desc}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.03] flex items-center justify-between text-[9px] font-mono uppercase text-slate-500">
                        <span>SECURE DIRECTORY PIPELINE</span>
                        <span className="text-cyan-400 font-black group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          LAUNCH PRODUCT <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {ritualWallet && (
        <SoulboundRitualOverlay
          open={showSoulboundRitual}
          onClose={() => setShowSoulboundRitual(false)}
          walletAddress={ritualWallet.address}
          walletType={ritualWallet.walletType}
          localKeypair={ritualWallet.localKeypair}
          addLog={addLog}
          onComplete={onSoulboundComplete}
        />
      )}
    </div>
  );
}
