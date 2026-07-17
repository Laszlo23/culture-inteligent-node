/**
 * Living OS FX primitives — lightweight CSS + motion helpers.
 * Prefer CSS ambient loops for 60fps; use motion for short beats.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/** Slow drifting gradients + sparse CSS particles behind facility chrome. */
export function AmbientField({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-cyan-500/[0.04] blur-3xl ambient-drift" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] rounded-full bg-fuchsia-500/[0.035] blur-3xl ambient-drift-slow" />
      <div className="absolute top-1/3 left-1/2 w-[40%] h-[40%] -translate-x-1/2 rounded-full bg-emerald-500/[0.025] blur-3xl ambient-drift-mid" />
      <div className="ambient-particles absolute inset-0 opacity-40" />
      <style>{`
        @keyframes ambientDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(2%, 3%) scale(1.05); }
        }
        @keyframes ambientDriftSlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-3%, -2%) scale(1.08); }
        }
        @keyframes ambientDriftMid {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-48%, 4%); }
        }
        .ambient-drift { animation: ambientDrift 18s ease-in-out infinite; }
        .ambient-drift-slow { animation: ambientDriftSlow 28s ease-in-out infinite; }
        .ambient-drift-mid { animation: ambientDriftMid 22s ease-in-out infinite; }
        .ambient-particles {
          background-image:
            radial-gradient(1px 1px at 10% 20%, rgba(165,243,252,0.35), transparent),
            radial-gradient(1px 1px at 30% 70%, rgba(232,121,249,0.25), transparent),
            radial-gradient(1.5px 1.5px at 70% 40%, rgba(110,231,183,0.3), transparent),
            radial-gradient(1px 1px at 85% 15%, rgba(165,243,252,0.2), transparent),
            radial-gradient(1px 1px at 55% 85%, rgba(251,191,36,0.2), transparent);
          background-size: 100% 100%;
          animation: ambientDrift 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

/** Soft glow intensity from energy (0–100) or mining power. */
export function GlowPulse({
  energy = 50,
  className = '',
  color = 'cyan',
}: {
  energy?: number;
  className?: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'fuchsia' | 'orange';
}) {
  const intensity = Math.max(0.15, Math.min(1, energy / 100));
  const duration = energy < 25 ? 3.2 : energy > 70 ? 1.4 : 2.2;
  const colorMap = {
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    fuchsia: 'bg-fuchsia-400',
    orange: 'bg-orange-400',
  };
  return (
    <motion.div
      className={`rounded-full blur-2xl pointer-events-none ${colorMap[color]} ${className}`}
      style={{ opacity: intensity * 0.45 }}
      animate={{ opacity: [intensity * 0.25, intensity * 0.55, intensity * 0.25], scale: [1, 1.08, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/** Horizontal energy flow bar driven by energy %. */
export function EnergyFlow({
  energy,
  className = '',
}: {
  energy: number;
  className?: string;
}) {
  const critical = energy < 20;
  return (
    <div className={`h-1.5 rounded-full bg-black/50 overflow-hidden border border-white/5 ${className}`}>
      <motion.div
        className={`h-full rounded-full ${
          critical
            ? 'bg-gradient-to-r from-orange-600 to-red-500'
            : energy < 50
              ? 'bg-gradient-to-r from-amber-500 to-cyan-500'
              : 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400'
        }`}
        initial={false}
        animate={{ width: `${Math.max(2, Math.min(100, energy))}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

/** Standardized room enter/exit wrapper. */
export function RoomEnter({
  children,
  roomKey,
}: {
  children: React.ReactNode;
  roomKey: string;
}) {
  return (
    <motion.div
      key={roomKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

type ClaimBurstProps = {
  show: boolean;
  label: string;
  onDone?: () => void;
};

/** Short reward micro-animation for BCC / energy claims. */
export function ClaimBurst({ show, label, onDone }: ClaimBurstProps) {
  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(() => onDone?.(), 1400);
    return () => window.clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-24 z-[80] flex justify-center px-4"
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <div className="relative px-5 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-400/40 shadow-[0_0_40px_rgba(52,211,153,0.35)] backdrop-blur-md">
            <motion.div
              className="absolute inset-0 rounded-2xl bg-emerald-400/10"
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 0.8, repeat: 1 }}
            />
            <span className="relative font-mono text-sm font-black tracking-wider text-emerald-300">
              {label}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type BriefItem = {
  id: string;
  tone: 'critical' | 'info' | 'success' | 'warn';
  title: string;
  body: string;
  actionLabel?: string;
  actionRoom?: string;
};

/** Build Attention Brief cards from existing GameState (no backend). */
export function buildAttentionBrief(input: {
  energy: number;
  missions: { id: string; completed: boolean; label: string }[];
  notifications: { id: string; read: boolean; title: string; type?: string }[];
  completedAcademySessions: string[];
  coreSessionCount: number;
}): BriefItem[] {
  const items: BriefItem[] = [];

  if (input.energy < 40) {
    items.push({
      id: 'energy-low',
      tone: 'critical',
      title: 'Core reserves critical',
      body: `Knowledge fuel at ${Math.round(input.energy)}%. A short Academy session can restore energy.`,
      actionLabel: 'Enter Academy',
      actionRoom: 'lab',
    });
  } else if (input.energy >= 85) {
    items.push({
      id: 'energy-high',
      tone: 'success',
      title: 'Node fully charged',
      body: 'Attention reserves are strong. Push output or claim daily directives.',
      actionLabel: 'Open Reactor',
      actionRoom: 'reactor',
    });
  }

  const openMission = input.missions.find((m) => !m.completed);
  if (openMission) {
    items.push({
      id: `mission-${openMission.id}`,
      tone: 'info',
      title: 'Ops directive ready',
      body: openMission.label,
      actionLabel: 'View Missions',
      actionRoom: 'missions',
    });
  }

  const streak = Number(localStorage.getItem('solana_daily_streak_v1') || '0');
  const lastClaim = localStorage.getItem('solana_daily_last_claim_v1');
  const claimedToday =
    lastClaim && new Date(Number(lastClaim)).toDateString() === new Date().toDateString();
  if (streak > 0 && claimedToday) {
    items.push({
      id: 'streak',
      tone: 'success',
      title: `Daily streak ×${streak}`,
      body: 'Proof of Attention cadence maintained. Keep the node warm.',
      actionLabel: 'Vault',
      actionRoom: 'treasury',
    });
  } else if (!claimedToday) {
    items.push({
      id: 'streak-claim',
      tone: 'warn',
      title: 'Daily attestation open',
      body: 'Sign today’s vault ritual to extend your streak.',
      actionLabel: 'Claim in Vault',
      actionRoom: 'treasury',
    });
  }

  const unread = input.notifications.filter((n) => !n.read);
  if (unread.length > 0) {
    items.push({
      id: 'notif',
      tone: unread.some((n) => n.type === 'warn') ? 'warn' : 'info',
      title: `${unread.length} signal${unread.length > 1 ? 's' : ''} unread`,
      body: unread[0].title,
    });
  }

  const done = input.completedAcademySessions.length;
  if (done < input.coreSessionCount) {
    items.push({
      id: 'academy',
      tone: 'info',
      title: 'Knowledge channel open',
      body: `${done}/${input.coreSessionCount} core sessions verified. Learning fuels the reactor.`,
      actionLabel: 'Continue Academy',
      actionRoom: 'lab',
    });
  }

  return items.slice(0, 5);
}

export function AttentionBriefStrip({
  items,
  onNavigate,
}: {
  items: BriefItem[];
  onNavigate: (room: string) => void;
}) {
  if (items.length === 0) return null;

  const toneBorder: Record<BriefItem['tone'], string> = {
    critical: 'border-orange-500/35 bg-orange-950/25',
    warn: 'border-amber-500/30 bg-amber-950/20',
    success: 'border-emerald-500/30 bg-emerald-950/20',
    info: 'border-cyan-500/25 bg-cyan-950/15',
  };
  const toneText: Record<BriefItem['tone'], string> = {
    critical: 'text-orange-300',
    warn: 'text-amber-300',
    success: 'text-emerald-300',
    info: 'text-cyan-300',
  };

  return (
    <div className="mb-5 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[9px] font-mono tracking-[0.28em] uppercase text-slate-500">
          Attention Brief
        </span>
        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
          Live · Knowledge → Energy
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border px-3 py-2.5 backdrop-blur-sm ${toneBorder[item.tone]}`}
          >
            <p className={`text-[11px] font-bold font-mono ${toneText[item.tone]}`}>{item.title}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{item.body}</p>
            {item.actionRoom && item.actionLabel && (
              <button
                type="button"
                onClick={() => onNavigate(item.actionRoom!)}
                className="mt-2 text-[9px] font-mono uppercase tracking-wider text-cyan-400/90 hover:text-cyan-300 cursor-pointer"
              >
                {item.actionLabel} →
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** sessionStorage flag when energy was just refilled elsewhere */
export const ENERGY_SURGE_KEY = 'bc_energy_surge_v1';

export function markEnergySurge() {
  try {
    sessionStorage.setItem(ENERGY_SURGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function consumeEnergySurge(maxAgeMs = 45_000): boolean {
  try {
    const raw = sessionStorage.getItem(ENERGY_SURGE_KEY);
    if (!raw) return false;
    sessionStorage.removeItem(ENERGY_SURGE_KEY);
    return Date.now() - Number(raw) < maxAgeMs;
  } catch {
    return false;
  }
}
