/**
 * Situation-aware navigation — show what the moment needs, hide the rest.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Map,
  Zap,
  Hammer,
  Compass,
  Bot,
  Coins,
  Users,
  User,
  Trophy,
  Rocket,
  MessageSquare,
  Handshake,
  HelpCircle,
  RotateCw,
  Shield,
  FileText,
  Scale,
  Glasses,
  Images,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';

export type NavDestination =
  | 'map'
  | 'reactor'
  | 'workshop'
  | 'lab'
  | 'gallery'
  | 'ai'
  | 'treasury'
  | 'guild'
  | 'missions'
  | 'profile'
  | 'leaderboard'
  | 'onboarding'
  | 'partners'
  | 'feedback'
  | 'roadmap'
  | 'legal-privacy'
  | 'legal-terms'
  | 'legal-disclaimer';

/** ritual = First Spark only · guided = post-spark focus loop · open = full facility */
export type NavPhase = 'ritual' | 'guided' | 'open';

interface NavItem {
  id: NavDestination;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

interface NavMenuProps {
  open: boolean;
  onClose: () => void;
  activeRoom: string;
  onNavigate: (id: NavDestination) => void;
  phase?: NavPhase;
  /** Single predicted next step (highlighted) */
  nextStep?: { id: NavDestination; label: string; reason: string } | null;
  showAdmin?: boolean;
  onAdmin?: () => void;
}

const ALL: Record<string, NavItem> = {
  map: { id: 'map', label: 'Facility Map', hint: 'Home overview', icon: <Map className="w-4 h-4" /> },
  lab: {
    id: 'lab',
    label: 'Attention Academy',
    hint: 'Earn knowledge fuel',
    icon: <Compass className="w-4 h-4" />,
  },
  reactor: {
    id: 'reactor',
    label: 'Mining Reactor',
    hint: 'Core energy & yield',
    icon: <Zap className="w-4 h-4" />,
  },
  workshop: {
    id: 'workshop',
    label: 'Hardware Workshop',
    hint: 'Buy & install modules',
    icon: <Hammer className="w-4 h-4" />,
  },
  gallery: {
    id: 'gallery',
    label: 'NFT Gallery',
    hint: 'Your miners',
    icon: <Images className="w-4 h-4" />,
  },
  treasury: {
    id: 'treasury',
    label: 'Ecosystem Vault',
    hint: 'Daily claim · swap · KPI',
    icon: <Coins className="w-4 h-4" />,
  },
  profile: {
    id: 'profile',
    label: 'Member Profile',
    hint: 'Mint & list miners',
    icon: <User className="w-4 h-4" />,
  },
  missions: {
    id: 'missions',
    label: 'Daily Missions',
    hint: 'Practice + Lucky Wheel',
    icon: <RotateCw className="w-4 h-4" />,
  },
  ai: { id: 'ai', label: 'Automation Center', hint: 'AI workers', icon: <Bot className="w-4 h-4" /> },
  guild: { id: 'guild', label: 'Community Guilds', hint: 'Team bonuses', icon: <Users className="w-4 h-4" /> },
  leaderboard: {
    id: 'leaderboard',
    label: 'Season Leaderboard',
    hint: 'Compete & check in',
    icon: <Trophy className="w-4 h-4" />,
  },
  roadmap: {
    id: 'roadmap',
    label: 'Product Roadmap',
    hint: 'Where this is going',
    icon: <Glasses className="w-4 h-4" />,
  },
  onboarding: {
    id: 'onboarding',
    label: 'Ecosystem Hub',
    hint: 'Sister apps & ledger',
    icon: <Rocket className="w-4 h-4" />,
  },
  partners: {
    id: 'partners',
    label: 'Partners',
    hint: 'In-world boosts',
    icon: <Handshake className="w-4 h-4" />,
  },
  feedback: {
    id: 'feedback',
    label: 'Feedback',
    hint: 'Tickets & notes',
    icon: <MessageSquare className="w-4 h-4" />,
  },
};

const LEGAL: NavItem[] = [
  { id: 'legal-privacy', label: 'Privacy Policy', hint: 'How we handle data', icon: <Shield className="w-4 h-4" /> },
  { id: 'legal-terms', label: 'Terms of Use', hint: 'Devnet demo rules', icon: <FileText className="w-4 h-4" /> },
  {
    id: 'legal-disclaimer',
    label: 'Disclaimer',
    hint: 'Simulated vs on-chain',
    icon: <Scale className="w-4 h-4" />,
  },
];

function NavButton({
  item,
  active,
  emphasized,
  onPick,
}: {
  item: NavItem;
  active: boolean;
  emphasized?: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
        emphasized
          ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-100'
          : active
            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
            : 'bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/10 text-slate-300'
      }`}
    >
      <span className={`mt-0.5 ${emphasized || active ? 'text-cyan-400' : 'text-slate-500'}`}>
        {item.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-bold font-sans tracking-tight">{item.label}</span>
        <span className="block text-[10px] text-slate-500 font-sans mt-0.5 leading-snug">{item.hint}</span>
      </span>
      {emphasized && <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />}
    </button>
  );
}

function Collapsed({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-1 py-2 text-slate-500 hover:text-slate-300 cursor-pointer"
      >
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function phaseCopy(phase: NavPhase): { title: string; subtitle: string } {
  switch (phase) {
    case 'ritual':
      return { title: 'Right now', subtitle: 'One step — First Spark' };
    case 'guided':
      return { title: 'Your path', subtitle: 'Suggested next moves' };
    case 'open':
      return { title: 'Navigate', subtitle: 'Facility & account' };
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

export default function NavMenu({
  open,
  onClose,
  activeRoom,
  onNavigate,
  phase = 'open',
  nextStep = null,
  showAdmin,
  onAdmin,
}: NavMenuProps) {
  const copy = phaseCopy(phase);

  const pick = (id: NavDestination) => {
    onNavigate(id);
    onClose();
  };

  const primaryIds: NavDestination[] =
    phase === 'ritual'
      ? ['lab', 'map']
      : phase === 'guided'
        ? ['lab', 'treasury', 'profile', 'map']
        : ['map', 'lab', 'reactor', 'treasury', 'profile'];

  const moreFacilityIds: NavDestination[] =
    phase === 'open'
      ? ['workshop', 'gallery', 'ai', 'guild', 'missions', 'leaderboard', 'roadmap']
      : phase === 'guided'
        ? ['reactor', 'gallery', 'missions', 'workshop']
        : [];

  const accountIds: NavDestination[] =
    phase === 'ritual' ? [] : ['onboarding', 'partners', 'feedback'];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm cursor-pointer border-0"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-[min(100vw,340px)] bg-[#09090c]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <span className="font-mono text-[9px] tracking-[0.2em] text-cyan-500 uppercase block">
                  {copy.title}
                </span>
                <h2 className="text-sm font-bold text-white mt-0.5">{copy.subtitle}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {nextStep && (
                <button
                  type="button"
                  onClick={() => pick(nextStep.id)}
                  className="w-full mb-5 text-left rounded-2xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-3.5 cursor-pointer hover:bg-cyan-500/15 transition-colors"
                >
                  <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-cyan-400 block">
                    Do this next
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white font-display italic">
                      {nextStep.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
                  </span>
                  <span className="mt-1 block text-[11px] text-slate-400 leading-relaxed">
                    {nextStep.reason}
                  </span>
                </button>
              )}

              {phase === 'ritual' && !nextStep && (
                <p className="mb-4 text-[11px] text-slate-400 leading-relaxed px-1">
                  Everything else unlocks after you prove attention once.
                </p>
              )}

              <div className="space-y-1 mb-4">
                {primaryIds.map((id) => {
                  const item = ALL[id];
                  if (!item) return null;
                  return (
                    <NavButton
                      key={id}
                      item={item}
                      active={activeRoom === id}
                      emphasized={nextStep?.id === id}
                      onPick={() => pick(id)}
                    />
                  );
                })}
              </div>

              {moreFacilityIds.length > 0 && (
                <Collapsed title={phase === 'guided' ? 'Explore later' : 'More rooms'}>
                  {moreFacilityIds.map((id) => {
                    const item = ALL[id];
                    if (!item) return null;
                    return (
                      <NavButton
                        key={id}
                        item={item}
                        active={activeRoom === id}
                        onPick={() => pick(id)}
                      />
                    );
                  })}
                </Collapsed>
              )}

              {accountIds.length > 0 && (
                <Collapsed title="Account & hub">
                  {accountIds.map((id) => {
                    const item = ALL[id];
                    if (!item) return null;
                    return (
                      <NavButton
                        key={id}
                        item={item}
                        active={activeRoom === id}
                        onPick={() => pick(id)}
                      />
                    );
                  })}
                </Collapsed>
              )}

              <Collapsed title="Legal">
                {LEGAL.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    active={activeRoom === item.id}
                    onPick={() => pick(item.id)}
                  />
                ))}
              </Collapsed>

              {phase !== 'ritual' && (
                <button
                  type="button"
                  onClick={() => pick('map')}
                  className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-cyan-400 text-xs font-mono cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Back to facility map
                </button>
              )}

              {showAdmin && onAdmin && phase === 'open' && (
                <button
                  type="button"
                  onClick={() => {
                    onAdmin();
                    onClose();
                  }}
                  className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-xs font-mono cursor-pointer"
                >
                  Admin Panel
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
