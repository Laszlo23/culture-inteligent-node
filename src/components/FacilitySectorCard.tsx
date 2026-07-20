/**
 * Facility schematic sector card — art, matrix rain, decode-on-focus question.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Coins, Compass, Cpu, Hammer, Users } from 'lucide-react';
import type { FacilityRoom } from '../types';
import {
  resolveSectorArt,
  SECTOR_ACCENT_CLASS,
} from '../lib/sector-media';
import { SectorMatrix } from './fx/SectorMatrix';
import { MatrixTypewriter } from './fx/MatrixTypewriter';
import { useSound } from '../lib/sound/SoundContext';

type Props = {
  room: FacilityRoom;
  sectorIndex: number;
  firstRitualPending: boolean;
  status: { text: string; color: string };
  onEnter: () => void;
  onUpgrade: () => void;
  onUnlock: () => void;
};

function RoomIcon({ id }: { id: string }) {
  const cls = 'w-4 h-4 transition-transform duration-500 group-hover:scale-110 group-focus-within:scale-110';
  if (id === 'reactor') return <Cpu className={`${cls} text-cyan-400`} />;
  if (id === 'workshop') return <Hammer className={`${cls} text-fuchsia-400`} />;
  if (id === 'lab') return <Compass className={`${cls} text-teal-400`} />;
  if (id === 'ai') return <Bot className={`${cls} text-pink-400`} />;
  if (id === 'treasury') return <Coins className={`${cls} text-emerald-400`} />;
  if (id === 'guild') return <Users className={`${cls} text-amber-400`} />;
  return <Cpu className={`${cls} text-cyan-400`} />;
}

export function FacilitySectorCard({
  room,
  sectorIndex,
  firstRitualPending,
  status,
  onEnter,
  onUpgrade,
  onUnlock,
}: Props) {
  const { play } = useSound();
  const [hover, setHover] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const wasDecoding = useRef(false);
  const sector = resolveSectorArt(room.id);
  const accent = SECTOR_ACCENT_CLASS[sector.accent];
  const decodeActive = room.unlocked && (hover || focusWithin);

  useEffect(() => {
    if (decodeActive && !wasDecoding.current) {
      play('hover');
      play('decode');
    }
    wasDecoding.current = decodeActive;
  }, [decodeActive, play]);

  return (
    <motion.div
      tabIndex={room.unlocked ? 0 : -1}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocusWithin(false);
        }
      }}
      whileHover={room.unlocked ? { y: -6, scale: 1.015 } : undefined}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={`group border rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col justify-between overflow-hidden relative min-h-[230px] transition-shadow duration-500 outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/50 bg-[#08090e]/80 ${
        room.unlocked
          ? firstRitualPending
            ? `border-cyan-400/45 shadow-[0_0_36px_rgba(34,211,238,0.18)] ${accent.glow}`
            : `border-white/12 ${accent.borderHover} ${accent.glow}`
          : 'border-white/8 opacity-55'
      }`}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <img
          src={sector.src}
          alt=""
          className="absolute -right-4 -bottom-10 w-[11.5rem] h-[11.5rem] object-cover rounded-2xl rotate-6 opacity-45 brightness-[0.75] saturate-[0.9] transition-all duration-700 ease-out group-hover:opacity-70 group-hover:brightness-100 group-hover:saturate-110 group-hover:scale-110 group-hover:-rotate-1 group-hover:-translate-y-1 group-focus-within:opacity-70 group-focus-within:scale-110"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0c] via-[#0a0a0c]/92 to-[#0a0a0c]/55" />
        {room.unlocked && <SectorMatrix accent={sector.accent} />}
        <div
          className={`absolute inset-0 transition-opacity duration-500 bg-gradient-to-tr ${accent.sheen} ${
            decodeActive ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute inset-0 transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/[0.06] to-transparent skew-x-12 ${
            decodeActive ? 'translate-x-full' : '-translate-x-full'
          }`}
        />
      </div>

      <span className="absolute top-4 right-4 font-mono text-[9px] text-slate-500 z-10 group-hover:text-slate-400 transition-colors">
        SECTOR_0{sectorIndex + 1}
      </span>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <RoomIcon id={room.id} />
          <h4 className="font-sans text-sm font-bold text-white tracking-tight">{room.name}</h4>
        </div>

        <MatrixTypewriter
          text={sector.hook}
          active={decodeActive}
          idleLabel=">_ await focus…"
          className={
            sector.accent === 'amber'
              ? 'text-amber-200'
              : sector.accent === 'teal'
                ? 'text-teal-200'
                : 'text-cyan-100'
          }
        />
        <p
          className={`mt-1.5 text-[11px] font-sans leading-relaxed line-clamp-2 transition-colors duration-300 ${
            decodeActive ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          {room.description}
        </p>
      </div>

      <div className="relative z-10 mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3 font-mono text-[11px]">
        <span
          className={`border px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-widest uppercase ${status.color}`}
        >
          {status.text}
        </span>

        {room.unlocked ? (
          <div className="flex gap-2">
            {room.costToUpgrade > 0 && room.level < room.maxLevel && (
              <button
                type="button"
                onClick={onUpgrade}
                className="px-2.5 py-1.5 bg-[#0a0a0c]/90 hover:bg-[#111115] border border-white/10 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] cursor-pointer font-bold"
                title={`Upgrade Room to increase operations (+${room.perk})`}
              >
                UPGRADE({room.costToUpgrade} CP)
              </button>
            )}
            <button
              type="button"
              onClick={onEnter}
              className="px-3.5 py-1.5 bg-cyan-600 text-black hover:bg-cyan-500 font-black rounded-lg text-[10px] cursor-pointer tracking-wider transition-transform duration-300 group-hover:scale-105"
            >
              ENTER
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onUnlock}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-black rounded-lg text-[10px] cursor-pointer tracking-wider"
          >
            CONSTRUCT ({room.costToUnlock} CP)
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default FacilitySectorCard;
