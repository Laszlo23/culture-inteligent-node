/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Wallet, Key, ShieldCheck, Trophy, 
  HelpCircle, ChevronRight, ChevronLeft, Check, Play, EyeOff, Cpu
} from 'lucide-react';

interface OnboardingModalProps {
  onClose: (dontShowAgain: boolean) => void;
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState<number>(0);
  const [dontShow, setDontShow] = useState<boolean>(false);

  const steps = [
    {
      title: "Welcome to Solana Cognitive Station",
      tagline: "SECURE YOUR MINING REACTOR HUB",
      description: "You have been commissioned to manage a high-density, decentralized culture node. Your goal is to optimize hash power (PH/s) by taking interactive courses, buying high-performance hardware, and maintaining reactor stasis levels.",
      icon: <Sparkles className="w-8 h-8 text-cyan-400" />,
      color: "from-cyan-500/20 to-blue-500/5",
      accent: "text-cyan-400",
      bullets: [
        "Base Reactor Power: Increase PH/s through advanced computing components",
        "Attention Academy: Refuel core energy by passing focus logs and quizzes",
        "Credits Balance: Earn CP to reconstruct and expand critical facility sectors"
      ]
    },
    {
      title: "Solana Devnet Wallet Integration",
      tagline: "REAL TIME ON-CHAIN WEB3 TRANSACTIONS",
      description: "We bring real-time Solana operations straight into your browser! Interact using either your browser extension (Phantom/Solflare) or generate a zero-install browser-isolated sandboxed Devnet Keypair in seconds.",
      icon: <Wallet className="w-8 h-8 text-purple-400" />,
      color: "from-purple-500/20 to-pink-500/5",
      accent: "text-purple-400",
      bullets: [
        "Injected Extensions: Pair with standard desktop browser wallets",
        "Sandbox Keypair: Instant real on-chain testing inside the preview iframe",
        "Faucet Drops: Click to claim +1.0 Devnet SOL directly from the test network"
      ]
    },
    {
      title: "Daily Contract Streak Claims",
      tagline: "VERIFY CONSECUTIVE SIGN-IN BONUSES",
      description: "Consistency is key. The newly upgraded Treasury Room allows you to execute on-chain smart contract signatures to verify your continuous activity streak and harvest escalating bonus Credits (CP) daily!",
      icon: <Trophy className="w-8 h-8 text-amber-400" />,
      color: "from-amber-500/20 to-orange-500/5",
      accent: "text-amber-400",
      bullets: [
        "Streak Tracker: Claims scale with every consecutive day of active duty",
        "Smart Contract signature: Cryptographically verify your operational streak",
        "Automatic payouts: Instantly adds Credits directly into your primary state"
      ]
    },
    {
      title: "On-Chain NFT Miners & COGNITIVE Token",
      tagline: "VISUAL RIG OWNERSHIP & MARKETPLACE",
      description: "Manage physical high-power visual Miner Rigs that reside securely in your Solana wallet as NFTs. Exchange Credits (CP) for COGNITIVE Utility Tokens (CGT) at the Treasury DEX swap to upgrade rig levels, list them on public DEXes, or mint elite class models!",
      icon: <Cpu className="w-8 h-8 text-fuchsia-400" />,
      color: "from-fuchsia-500/20 to-pink-500/5",
      accent: "text-fuchsia-400",
      bullets: [
        "Visual Rig Upgrades: Level up your Common/Rare/Epic rigs with CGT to expand raw hash rates",
        "Public DEX Marketplace: List your custom rig for trade or acquire power configurations from other nodes",
        "Decentralized Minting: Deploy CGT tokens to construct completely new procedural visual rigs"
      ]
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onClose(dontShow);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onClose(false)}
        className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
      />

      {/* Main Glassmorphic Modal Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="relative w-full max-w-xl bg-[#09090c]/95 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-10"
      >
        {/* Background ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="font-mono text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Operational Handbook
            </span>
          </div>

          <button 
            onClick={() => onClose(dontShow)}
            className="text-xs font-mono font-bold text-slate-500 hover:text-white transition-colors uppercase px-2 py-1 rounded bg-white/[0.02] border border-white/5 hover:border-white/10"
          >
            SKIP HANDBOOK
          </button>
        </div>

        {/* Step indicator breadcrumbs */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx === step 
                  ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
                  : idx < step ? 'bg-cyan-900' : 'bg-white/5'
              }`}
            />
          ))}
        </div>

        {/* Main Content Viewport */}
        <div className="min-h-[300px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Icon banner */}
              <div className="flex items-start gap-4 mb-5">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${current.color} border border-white/10 flex-shrink-0`}>
                  {current.icon}
                </div>
                <div>
                  <span className={`font-mono text-[9px] font-extrabold tracking-widest block ${current.accent}`}>
                    {current.tagline}
                  </span>
                  <h2 className="text-xl font-bold font-sans text-slate-100 tracking-tight mt-1">
                    {current.title}
                  </h2>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 font-sans leading-relaxed mb-6">
                {current.description}
              </p>

              {/* Bullet details */}
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-2.5 font-sans text-xs">
                {current.bullets.map((bullet, bidx) => {
                  const [title, desc] = bullet.split(': ');
                  return (
                    <div key={bidx} className="flex items-start gap-2.5 text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[9px] text-cyan-400 font-bold mt-0.5 flex-shrink-0">
                        {bidx + 1}
                      </div>
                      <p className="leading-relaxed text-slate-400">
                        <strong className="text-slate-200">{title}:</strong> {desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pt-5 border-t border-white/5">
            {/* "Do not show again" Checkbox button */}
            <button
              onClick={() => setDontShow(prev => !prev)}
              className="flex items-center gap-2 text-left cursor-pointer group"
            >
              <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                dontShow 
                  ? 'bg-cyan-500 border-cyan-400 text-black' 
                  : 'border-white/20 group-hover:border-cyan-500/40'
              }`}>
                {dontShow && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-[11px] font-bold text-slate-300">Do Not Show Again</span>
                <span className="font-mono text-[8px] text-slate-500 uppercase">Saves settings to local storage</span>
              </div>
            </button>

            {/* Pagination buttons */}
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl border border-white/5 bg-[#0e0e12] hover:bg-white/[0.02] text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  BACK
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-mono font-black flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
              >
                {step === steps.length - 1 ? (
                  <>
                    START SIMULATOR
                    <Play className="w-3.5 h-3.5 fill-black" />
                  </>
                ) : (
                  <>
                    NEXT
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
