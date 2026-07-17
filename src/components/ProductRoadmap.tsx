/**
 * Product roadmap — 2D Culture Node → AR Attention Mining vision.
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Sparkles,
  Users,
  Glasses,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface ProductRoadmapProps {
  onEnterAcademy: () => void;
}

const PHASES = [
  {
    id: 'now',
    label: 'Now',
    title: 'Culture Node (2D)',
    status: 'live' as const,
    icon: <Compass className="w-5 h-5" />,
    body: 'Attention Academy Sessions 1–8, agent-verified Proof of Attention, Solana Devnet KPI contributions, facility mining loop.',
    bullets: ['Attention Intelligence core series', 'Wallet PoA + KPI on Devnet', 'Nodes fueled by real learning'],
  },
  {
    id: 'next',
    label: 'Next',
    title: 'Weekly Intelligence',
    status: 'building' as const,
    icon: <Sparkles className="w-5 h-5" />,
    body: 'Research agent drafts evidence-based sessions from the open web. Humans approve. Weekly drops, streaks, and guild challenges.',
    bullets: ['Gemini research drafts', 'Human approve before publish', 'Streaks & community challenges'],
  },
  {
    id: 'soon',
    label: 'Soon',
    title: 'Creator Labs',
    status: 'planned' as const,
    icon: <Users className="w-5 h-5" />,
    body: 'Builders and educators author modules. Gated deeper quizzes, videos, and reputation for high-signal curriculum.',
    bullets: ['Community-authored sessions', 'Gated deeper modules', 'Reputation for teachers'],
  },
  {
    id: 'horizon',
    label: 'Horizon',
    title: 'AR Attention Mining',
    status: 'vision' as const,
    icon: <Glasses className="w-5 h-5" />,
    body: 'From screen mining to real experiences. Glasses and spatial sessions — focus drills in the world, location quests, creator-led AR learning with an AI companion. Building toward — not shipped.',
    bullets: [
      'Spatial / glasses-native drills',
      'Real-world location quests',
      'Creators teach with AR + AI',
    ],
  },
];

export default function ProductRoadmap({ onEnterAcademy }: ProductRoadmapProps) {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-3">
        <p className="text-[10px] font-mono tracking-[0.28em] uppercase text-emerald-400">Building Culture</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          From 2D mining to real-world attention
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          We are building Attention Intelligence as a skill — first on the Culture Node screen, then into
          augmented reality where creators and learners meet in the physical world.
        </p>
      </div>

      <div className="relative space-y-4">
        <div className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-emerald-500/50 via-violet-500/30 to-transparent hidden sm:block" />

        {PHASES.map((phase, i) => (
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative sm:pl-14"
          >
            <div
              className={`hidden sm:flex absolute left-0 top-5 w-12 h-12 rounded-full items-center justify-center border ${
                phase.status === 'live'
                  ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                  : phase.status === 'building'
                    ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300'
                    : phase.status === 'planned'
                      ? 'border-violet-400/40 bg-violet-500/10 text-violet-300'
                      : 'border-amber-400/40 bg-amber-500/10 text-amber-300'
              }`}
            >
              {phase.icon}
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#0a0a0c]/90 backdrop-blur p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500">
                  {phase.label}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    phase.status === 'live'
                      ? 'border-emerald-500/40 text-emerald-400'
                      : phase.status === 'building'
                        ? 'border-cyan-500/40 text-cyan-400'
                        : phase.status === 'planned'
                          ? 'border-violet-500/40 text-violet-400'
                          : 'border-amber-500/40 text-amber-400'
                  }`}
                >
                  {phase.status === 'live'
                    ? 'LIVE'
                    : phase.status === 'building'
                      ? 'IN BUILD'
                      : phase.status === 'planned'
                        ? 'PLANNED'
                        : 'VISION'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{phase.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{phase.body}</p>
              <ul className="space-y-1.5">
                {phase.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-slate-300">
                    {phase.status === 'live' || phase.status === 'building' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                    )}
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onEnterAcademy}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-sm font-bold hover:bg-emerald-500/30 transition-colors"
        >
          Enter Attention Academy <ArrowRight className="w-4 h-4" />
        </button>
        <a
          href="https://buildingcultureid.space"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-300 text-sm hover:border-cyan-400/40 hover:text-cyan-300 transition-colors"
        >
          buildingcultureid.space <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <p className="text-center text-[11px] text-slate-600 max-w-lg mx-auto">
        Tagline: Fuel Knowledge. Build Communities. Shape the Future. AR glasses experiences are a
        declared horizon — we ship 2D proof loops first so the vision has a real foundation.
      </p>
    </div>
  );
}
