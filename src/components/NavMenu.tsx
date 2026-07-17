/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Map, Zap, Hammer, Compass, Bot, Coins, Users, Calendar,
  User, Trophy, Rocket, MessageSquare, Handshake, HelpCircle,
  RotateCw, Wallet, Shield, FileText, Scale, Glasses
} from 'lucide-react';

export type NavDestination =
  | 'map'
  | 'reactor'
  | 'workshop'
  | 'lab'
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
  showAdmin?: boolean;
  onAdmin?: () => void;
}

const FACILITY: NavItem[] = [
  { id: 'map', label: 'Facility Map', hint: 'Overview schematic', icon: <Map className="w-4 h-4" /> },
  { id: 'reactor', label: 'Mining Reactor', hint: 'Core energy & yield', icon: <Zap className="w-4 h-4" /> },
  { id: 'workshop', label: 'Hardware Workshop', hint: 'Buy & install modules', icon: <Hammer className="w-4 h-4" /> },
  { id: 'lab', label: 'Attention Academy', hint: 'Agent-verified sessions', icon: <Compass className="w-4 h-4" /> },
  { id: 'roadmap', label: 'Product Roadmap', hint: '2D → AR vision', icon: <Glasses className="w-4 h-4 text-emerald-400" /> },
  { id: 'ai', label: 'Automation Center', hint: 'AI worker bots', icon: <Bot className="w-4 h-4" /> },
  { id: 'treasury', label: 'Ecosystem Vault', hint: 'Solana Portal & KPI proof', icon: <Coins className="w-4 h-4" /> },
  { id: 'guild', label: 'Community Guilds', hint: 'Team bonuses', icon: <Users className="w-4 h-4" /> },
];

const DAILY: NavItem[] = [
  {
    id: 'missions',
    label: 'Daily Missions & Lucky Wheel',
    hint: 'Practice tasks + spinning wheel rewards',
    icon: <RotateCw className="w-4 h-4 text-cyan-400" />,
  },
  { id: 'leaderboard', label: 'Season Leaderboard', hint: 'Compete & check in', icon: <Trophy className="w-4 h-4" /> },
];

const ACCOUNT: NavItem[] = [
  { id: 'profile', label: 'Member Profile', hint: 'Wallet & social quests', icon: <User className="w-4 h-4" /> },
  { id: 'onboarding', label: 'Ecosystem Hub', hint: 'PoA ledger & sister apps', icon: <Rocket className="w-4 h-4" /> },
  { id: 'partners', label: 'Partners Program', hint: 'In-world boosts', icon: <Handshake className="w-4 h-4" /> },
  { id: 'feedback', label: 'Feedback', hint: 'Tickets & announcements', icon: <MessageSquare className="w-4 h-4" /> },
];

const LEGAL: NavItem[] = [
  { id: 'legal-privacy', label: 'Privacy Policy', hint: 'How we handle data', icon: <Shield className="w-4 h-4" /> },
  { id: 'legal-terms', label: 'Terms of Use', hint: 'Devnet demo rules', icon: <FileText className="w-4 h-4" /> },
  { id: 'legal-disclaimer', label: 'Disclaimer', hint: 'Simulated vs on-chain', icon: <Scale className="w-4 h-4" /> },
];

function Section({
  title,
  items,
  activeRoom,
  onNavigate,
  onClose,
}: {
  title: string;
  items: NavItem[];
  activeRoom: string;
  onNavigate: (id: NavDestination) => void;
  onClose: () => void;
}) {
  return (
    <div className="mb-5">
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-slate-600 block mb-2 px-1">
        {title}
      </span>
      <div className="space-y-1">
        {items.map((item) => {
          const active = activeRoom === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className={`w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                active
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/10 text-slate-300'
              }`}
            >
              <span className={`mt-0.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`}>
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold font-sans tracking-tight">{item.label}</span>
                <span className="block text-[10px] text-slate-500 font-sans mt-0.5 leading-snug">
                  {item.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function NavMenu({
  open,
  onClose,
  activeRoom,
  onNavigate,
  showAdmin,
  onAdmin,
}: NavMenuProps) {
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
            className="fixed top-0 right-0 bottom-0 z-[70] w-[min(100vw,360px)] bg-[#09090c] border-l border-white/10 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div>
                <span className="font-mono text-[9px] tracking-[0.2em] text-cyan-500 uppercase block">
                  Navigation
                </span>
                <h2 className="text-sm font-bold text-white mt-0.5">Culture Node Menu</h2>
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
              <div className="mb-4 p-3 rounded-xl border border-cyan-500/20 bg-cyan-950/20">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] font-black tracking-wider uppercase">
                  <Wallet className="w-3.5 h-3.5" />
                  Quick tip
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-1.5 leading-relaxed">
                  Lucky Wheel lives under <strong className="text-slate-200">Daily Missions & Lucky Wheel</strong>.
                  Solana KPI proof is in <strong className="text-slate-200">Ecosystem Vault</strong>.
                  Gemini API is optional — sessions still verify with a local agent until you add a key.
                </p>
              </div>

              <Section title="Facility" items={FACILITY} activeRoom={activeRoom} onNavigate={onNavigate} onClose={onClose} />
              <Section title="Daily loops" items={DAILY} activeRoom={activeRoom} onNavigate={onNavigate} onClose={onClose} />
              <Section title="Account & hub" items={ACCOUNT} activeRoom={activeRoom} onNavigate={onNavigate} onClose={onClose} />
              <Section title="Legal" items={LEGAL} activeRoom={activeRoom} onNavigate={onNavigate} onClose={onClose} />

              <button
                type="button"
                onClick={() => {
                  onNavigate('map');
                  onClose();
                }}
                className="w-full mt-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-cyan-400 text-xs font-mono cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Back to facility map
              </button>

              {showAdmin && onAdmin && (
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
