/**
 * Cold-start hook — one composition, one question, one CTA.
 * Hook: name the bait that owns your thumb → First Spark.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Link2, ChevronDown, ChevronUp, X, Sparkles } from 'lucide-react';
import { CinematicBackdrop } from './fx';
import { BRAND, SLOGANS } from '../lib/brand-slogans';

interface OnboardingModalProps {
  onClose: () => void;
  replay?: boolean;
  onEnterLocal?: () => void;
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
          className="absolute -inset-x-8 -top-16 -bottom-8 -z-10 rounded-[2rem] bg-black/30 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
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
          {BRAND.product} · {SLOGANS.attention}
        </p>

        <h1 className="font-display mt-4 text-[2.1rem] sm:text-5xl font-extrabold italic tracking-tight text-white leading-[1.05]">
          Name the bait that
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-amber-300">
            owns your thumb
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg font-semibold text-slate-100 leading-snug max-w-md mx-auto">
          Two minutes. Then you own the scroll.
        </p>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          First Spark turns that moment into{' '}
          <span className="text-cyan-300 font-semibold">Proof of Attention</span> — knowledge fuel
          for your node. Not empty hashes. Not guilt. A win you can feel.
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
                onClick={() => (onEnterPhantom ? onEnterPhantom() : onClose())}
                className="w-full py-3.5 rounded-xl bg-[#AB9FF2] hover:bg-[#c4baf7] text-black font-mono text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_32px_rgba(171,159,242,0.4)]"
              >
                <Link2 className="w-4 h-4" />
                Enter with Phantom — Solana
              </button>
              <p className="text-[10px] text-slate-500 font-sans -mt-1">
                Desktop extension or mobile in-app browser · Devnet · then First Spark
              </p>
              <button
                type="button"
                onClick={() => (onEnterLocal ? onEnterLocal() : onClose())}
                className="w-full py-2.5 rounded-xl border border-cyan-400/35 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-100 font-mono text-[11px] font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Demo wallet · First Spark in 2 min
              </button>
              <button
                type="button"
                onClick={() => (onEnterLocal ? onEnterLocal() : onClose())}
                className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-300 font-mono text-[10px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3 h-3" />
                Local Devnet wallet only
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowLoop((v) => !v)}
          className="mt-5 inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-cyan-400 cursor-pointer"
        >
          Why this works
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
                  <span className="text-cyan-300 font-semibold">Hook</span> — Name the bait. That
                  awareness is the product.
                </li>
                <li>
                  <span className="text-amber-300 font-semibold">Zen</span> — Mind holds knowledge;
                  Machine converts to fuel when you choose.
                </li>
                <li>
                  <span className="text-slate-200 font-semibold">Spread</span> — Pass love &amp;
                  knowledge. {SLOGANS.primary}
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
