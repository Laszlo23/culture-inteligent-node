/**
 * Skeptic-first cold start — one composition, one question, one CTA.
 * Hook in ≤12s. No multi-step handbook.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Link2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { CinematicBackdrop } from './fx';

interface OnboardingModalProps {
  onClose: () => void;
  replay?: boolean;
  /** Primary path: create/reuse local Devnet wallet and enter */
  onEnterLocal?: () => void;
  /** Secondary: open Phantom connect flow */
  onEnterPhantom?: () => void;
}

export default function OnboardingModal({
  onClose,
  replay = false,
  onEnterLocal,
  onEnterPhantom,
}: OnboardingModalProps) {
  const [showLoop, setShowLoop] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#050608]">
      <CinematicBackdrop variant="hero" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 200 }}
        className="relative z-10 w-full max-w-lg text-center"
      >
        <motion.div
          aria-hidden
          className="absolute -inset-x-8 -top-16 -bottom-8 -z-10 rounded-[2rem] bg-black/25 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        />
        {replay && (
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-2 right-0 p-2 text-slate-500 hover:text-slate-200 cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <p className="font-mono text-[10px] font-bold tracking-[0.28em] uppercase text-cyan-400/90">
          Culture Node · Solana Devnet
        </p>

        <h1 className="font-display mt-3 text-4xl sm:text-5xl font-extrabold italic tracking-tight text-white leading-[0.95]">
          CULTURE NODE
        </h1>

        <p className="mt-6 text-lg sm:text-xl font-semibold text-slate-100 leading-snug">
          Why power a node with empty hashes?
        </p>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          You don&apos;t. Attention Intelligence — plasticity, bias, focus — becomes{' '}
          <span className="text-cyan-300">Proof of Attention</span>. That&apos;s fuel. That&apos;s
          the game.
        </p>
        <p className="mt-3 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
          For people who ask why — not who copy the last cycle
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {replay ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              Close guide
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (onEnterLocal ? onEnterLocal() : onClose())}
                className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_28px_rgba(34,211,238,0.25)]"
              >
                <Key className="w-4 h-4" />
                Continue with a demo wallet
              </button>
              <p className="text-[10px] text-slate-500 font-sans -mt-1">
                This browser · Solana Devnet · nothing of value · wipe anytime
              </p>
              <button
                type="button"
                onClick={() => (onEnterPhantom ? onEnterPhantom() : onClose())}
                className="w-full py-2.5 rounded-xl border border-white/12 bg-white/[0.03] hover:border-cyan-400/35 text-slate-300 font-mono text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-violet-400" />
                I have Phantom
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowLoop((v) => !v)}
          className="mt-5 inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-cyan-400 cursor-pointer"
        >
          What is this?
          {showLoop ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {showLoop && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <ol className="mt-3 text-left text-xs text-slate-400 space-y-2 bg-black/40 border border-white/8 rounded-2xl p-4 max-w-md mx-auto">
                <li>
                  <span className="text-cyan-300 font-semibold">Knowledge</span> — pass a short Academy
                  snap (First Spark ~2 min).
                </li>
                <li>
                  <span className="text-amber-300 font-semibold">Energy</span> — a pass refuels your
                  node. Don&apos;t take our word — watch the fuel move.
                </li>
                <li>
                  <span className="text-slate-200 font-semibold">Node</span> — then explore. Devnet
                  demo; attest ≠ mint; no mainnet money.
                </li>
              </ol>
            </motion.div>
          )}
        </AnimatePresence>

        {!replay && (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 text-[10px] font-mono text-slate-600 hover:text-slate-400 uppercase tracking-wider cursor-pointer"
          >
            Skip to connect
          </button>
        )}
      </motion.div>
    </div>
  );
}
