/**
 * Product roadmap — 2D Culture Node → AR Attention Mining.
 * Each phase has its own video (public/roadmap/{id}.mp4).
 */

import React, { useEffect, useRef, useState } from 'react';
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
  Volume2,
  VolumeX,
  Play,
} from 'lucide-react';
import { ROADMAP_PHASE_MEDIA, type RoadmapPhaseId } from '../lib/roadmap-media';

interface ProductRoadmapProps {
  onEnterAcademy: () => void;
}

const PHASES: Array<{
  id: RoadmapPhaseId;
  label: string;
  title: string;
  status: 'live' | 'building' | 'planned' | 'vision';
  icon: React.ReactNode;
  body: string;
  bullets: string[];
}> = [
  {
    id: 'now',
    label: 'Now',
    title: 'Culture Node (2D)',
    status: 'live',
    icon: <Compass className="w-5 h-5" />,
    body: 'Attention Academy Sessions 1–8, agent-verified Proof of Attention, Solana Devnet KPI contributions, facility mining loop.',
    bullets: ['Attention Intelligence core series', 'Wallet PoA + KPI on Devnet', 'Nodes fueled by real learning'],
  },
  {
    id: 'next',
    label: 'Next',
    title: 'Weekly Intelligence',
    status: 'building',
    icon: <Sparkles className="w-5 h-5" />,
    body: 'Research agent drafts evidence-based sessions from the open web. Humans approve. Weekly drops, streaks, and guild challenges.',
    bullets: ['Gemini research drafts', 'Human approve before publish', 'Streaks & community challenges'],
  },
  {
    id: 'soon',
    label: 'Soon',
    title: 'Creator Labs',
    status: 'planned',
    icon: <Users className="w-5 h-5" />,
    body: 'Builders and educators author modules. Gated deeper quizzes, videos, and reputation for high-signal curriculum.',
    bullets: ['Community-authored sessions', 'Gated deeper modules', 'Reputation for teachers'],
  },
  {
    id: 'horizon',
    label: 'Horizon',
    title: 'AR Attention Mining',
    status: 'vision',
    icon: <Glasses className="w-5 h-5" />,
    body: 'From screen mining to real experiences. Glasses and spatial sessions — focus drills in the world, location quests, creator-led AR learning with an AI companion. Building toward — not shipped.',
    bullets: [
      'Spatial / glasses-native drills',
      'Real-world location quests',
      'Creators teach with AR + AI',
    ],
  },
];

function PhaseVideo({
  phaseId,
  active,
  onActivate,
}: {
  phaseId: RoadmapPhaseId;
  active: boolean;
  onActivate: () => void;
}) {
  const media = ROADMAP_PHASE_MEDIA[phaseId];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) {
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  }, [active]);

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black group">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={media.video}
        poster={media.poster}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onClick={onActivate}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      <p className="absolute bottom-2.5 left-3 right-16 text-[10px] font-mono text-white/85 tracking-wide z-10">
        {media.caption}
      </p>
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5">
        {!playing && (
          <button
            type="button"
            onClick={onActivate}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center cursor-pointer"
            aria-label="Play phase video"
          >
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMuted((m) => !m);
          }}
          className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 border border-white/15 flex items-center justify-center cursor-pointer"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-300" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-slate-200" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProductRoadmap({ onEnterAcademy }: ProductRoadmapProps) {
  const [activeVideo, setActiveVideo] = useState<RoadmapPhaseId>('now');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-3">
        <p className="text-[10px] font-mono tracking-[0.28em] uppercase text-emerald-400">
          Building Culture
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          From 2D mining to real-world attention
        </h2>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Four chapters — each with its own film. Watch the path from Culture Node on screen to AR
          attention in the world.
        </p>
      </div>

      <div className="relative space-y-5">
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

            <div className="rounded-2xl border border-white/8 bg-[#0a0a0c]/90 backdrop-blur p-5 md:p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
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

              <PhaseVideo
                phaseId={phase.id}
                active={activeVideo === phase.id}
                onActivate={() => setActiveVideo(phase.id)}
              />

              <h3 className="text-xl font-bold text-white">{phase.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{phase.body}</p>
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
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-sm font-bold hover:bg-emerald-500/30 transition-colors cursor-pointer"
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
        Tagline: Fuel Knowledge. Build Communities. Shape the Future. Swap any phase film by replacing{' '}
        <span className="font-mono text-slate-500">public/roadmap/*.mp4</span>.
      </p>
    </div>
  );
}
