/**
 * Thumb-reach web3 mobile nav — primary rooms + guided next action.
 * Desktop keeps the header; this bar is md:hidden only.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Map,
  Compass,
  Coins,
  User,
  Menu,
  ArrowRight,
  Zap,
} from 'lucide-react';
import type { NavDestination, NavPhase } from './NavMenu';

export type MobileTabId = 'map' | 'lab' | 'treasury' | 'profile' | 'more';

type Tab = {
  id: MobileTabId;
  room?: NavDestination;
  label: string;
  icon: React.ReactNode;
};

const TABS: Tab[] = [
  { id: 'map', room: 'map', label: 'Home', icon: <Map className="w-5 h-5" /> },
  { id: 'lab', room: 'lab', label: 'Academy', icon: <Compass className="w-5 h-5" /> },
  { id: 'treasury', room: 'treasury', label: 'Vault', icon: <Coins className="w-5 h-5" /> },
  { id: 'profile', room: 'profile', label: 'You', icon: <User className="w-5 h-5" /> },
  { id: 'more', label: 'More', icon: <Menu className="w-5 h-5" /> },
];

type NextStep = { id: NavDestination; label: string; reason: string };

type Props = {
  activeRoom: string;
  phase: NavPhase;
  nextStep: NextStep;
  walletShort?: string | null;
  bccBalance?: number;
  energy?: number;
  onNavigate: (id: NavDestination) => void;
  onOpenMore: () => void;
  onNext: () => void;
  onLockedHint?: () => void;
  hidden?: boolean;
};

function tabActive(tab: Tab, activeRoom: string): boolean {
  if (tab.id === 'more') return false;
  if (!tab.room) return false;
  return activeRoom === tab.room;
}

function shortNextLabel(step: NextStep, phase: NavPhase): string {
  if (phase === 'ritual') return 'Start Proof of Attention';
  if (/quieter path/i.test(step.label)) return 'Quieter path';
  if (step.label.length <= 24) return step.label;
  return step.label.slice(0, 22).trimEnd() + '…';
}

export default function MobileBottomNav({
  activeRoom,
  phase,
  nextStep,
  walletShort,
  bccBalance,
  energy,
  onNavigate,
  onOpenMore,
  onNext,
  onLockedHint,
  hidden = false,
}: Props) {
  const [lockPulse, setLockPulse] = useState<string | null>(null);

  if (hidden) return null;

  const ritualLock = phase === 'ritual';
  const showNextChip =
    nextStep &&
    (ritualLock ||
      nextStep.id !== activeRoom ||
      /quieter|spark|mint|refuel|vault|fuel|hook|invite|claim/i.test(nextStep.label));

  const nudgeLocked = (tabId: string) => {
    setLockPulse(tabId);
    window.setTimeout(() => setLockPulse(null), 900);
    onLockedHint?.();
  };

  return (
    <div
      className="md:hidden fixed inset-x-0 bottom-0 z-[55] pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <AnimatePresence>
        {showNextChip && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="px-3 pb-2 pointer-events-auto"
          >
            <button
              type="button"
              onClick={onNext}
              title={nextStep.reason}
              className="w-full flex items-center gap-3 rounded-2xl border border-cyan-400/35 bg-[#0a0a0c]/92 backdrop-blur-xl px-3.5 py-3 text-left shadow-[0_-8px_32px_rgba(0,0,0,0.45)] cursor-pointer active:scale-[0.99] transition-transform"
            >
              <span className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                {ritualLock ? (
                  <Zap className="w-4 h-4 text-cyan-300" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-cyan-300" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[9px] tracking-[0.2em] uppercase text-cyan-400/90">
                  For you
                </span>
                <span className="block text-sm font-bold text-white truncate font-display italic">
                  {shortNextLabel(nextStep, phase)}
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        aria-label="Primary"
        className="pointer-events-auto mx-2 mb-2 rounded-2xl border border-white/10 bg-[#08080c]/95 backdrop-blur-xl shadow-[0_-12px_40px_rgba(0,0,0,0.55)]"
      >
        {(walletShort || typeof bccBalance === 'number' || typeof energy === 'number') && (
          <div className="flex items-center justify-between gap-2 px-3.5 pt-2 pb-1 border-b border-white/[0.04]">
            <div className="flex items-center gap-2 min-w-0">
              {walletShort ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                  <span className="font-mono text-[10px] text-cyan-300/90 truncate">{walletShort}</span>
                </>
              ) : (
                <span className="font-mono text-[10px] text-slate-500">Just looking · Devnet</span>
              )}
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] shrink-0">
              {typeof energy === 'number' && (
                <span className={energy < 40 ? 'text-orange-300' : 'text-orange-300/90'}>
                  {energy}% fuel
                </span>
              )}
              {typeof bccBalance === 'number' && (
                <span className="text-amber-400/90">{bccBalance} BCC</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-stretch justify-between px-1 py-1">
          {TABS.map((tab) => {
            const locked =
              ritualLock && tab.room != null && tab.room !== 'lab' && tab.room !== 'map';
            const active = tabActive(tab, activeRoom);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'more') {
                    onOpenMore();
                    return;
                  }
                  if (locked) {
                    nudgeLocked(tab.id);
                    return;
                  }
                  if (tab.room) onNavigate(tab.room);
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 rounded-xl min-h-[52px] transition-colors cursor-pointer ${
                  locked
                    ? 'text-slate-600 opacity-50'
                    : active
                      ? 'text-cyan-300'
                      : 'text-slate-500 active:text-slate-300'
                } ${lockPulse === tab.id ? 'ring-1 ring-cyan-400/40 bg-cyan-500/5' : ''}`}
                aria-current={active ? 'page' : undefined}
                aria-label={locked ? `${tab.label} — unlocks after Proof of Attention` : tab.label}
              >
                <span className="relative flex items-center justify-center">
                  {tab.icon}
                  {active && !locked && (
                    <motion.span
                      layoutId="mobile-nav-dot"
                      className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-cyan-400"
                    />
                  )}
                </span>
                <span
                  className={`font-mono text-[9px] tracking-wide uppercase font-bold ${
                    active && !locked ? 'text-cyan-300' : ''
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
