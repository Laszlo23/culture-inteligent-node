/**
 * Hardware Bay product face — cinematic photo + live mount FX.
 */

import React, { useState } from 'react';
import {
  Cpu, HardDrive, Zap, Battery, Snowflake, Radio, CircuitBoard,
} from 'lucide-react';
import { HardwareModule, ModuleType } from '../types';
import { resolveHardwarePhoto } from '../lib/hardware-media';

const TYPE_META: Record<
  ModuleType,
  { label: string; Icon: typeof Cpu }
> = {
  gpu: { label: 'GPU DIE', Icon: Cpu },
  memory: { label: 'SRAM BANK', Icon: HardDrive },
  accelerator: { label: 'SYNAPSE', Icon: Zap },
  battery: { label: 'FUSION CELL', Icon: Battery },
  cooler: { label: 'CRYO LOOP', Icon: Snowflake },
  dock: { label: 'DRONE BAY', Icon: Radio },
  chip: { label: 'LOGIC DIE', Icon: CircuitBoard },
};

export default function HardwareModuleArt({
  module,
  compact = false,
}: {
  module: HardwareModule;
  compact?: boolean;
}) {
  const meta = TYPE_META[module.type] || TYPE_META.chip;
  const { Icon } = meta;
  const live = module.installed && module.unlocked;
  const photo = resolveHardwarePhoto(module.type);
  const [imgOk, setImgOk] = useState(true);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-[#06070a] ${
        compact ? 'aspect-[16/10]' : 'aspect-[16/11]'
      } ${live ? 'ring-1 ring-emerald-400/30' : ''}`}
    >
      {imgOk ? (
        <img
          src={photo}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
            live
              ? 'scale-105 brightness-110 contrast-110'
              : module.unlocked
                ? 'scale-100 brightness-95'
                : 'scale-100 brightness-50 grayscale-[0.35]'
          }`}
          draggable={false}
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black flex items-center justify-center">
          <Icon className="w-10 h-10 text-slate-500" />
        </div>
      )}

      {/* Cinematic grade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-amber-500/10 pointer-events-none mix-blend-screen" />

      {live && <div className="hw-module-scan absolute inset-0 pointer-events-none" aria-hidden />}

      <div className="absolute bottom-0 inset-x-0 p-2.5 flex items-end justify-between gap-2">
        <div>
          <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase block">
            {meta.label}
          </span>
          <span className="text-[10px] font-mono font-bold text-white truncate block max-w-[11rem] drop-shadow">
            {module.name.replace(/^Enhanced /, '')}
          </span>
        </div>
        <Icon className={`w-4 h-4 shrink-0 drop-shadow ${live ? 'text-cyan-300' : 'text-slate-400'}`} />
      </div>

      {live && (
        <span className="absolute top-2 left-2 text-[8px] font-mono font-black tracking-widest uppercase px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 backdrop-blur-sm">
          Live feed
        </span>
      )}
      {!module.unlocked && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-[9px] font-mono tracking-widest uppercase text-slate-200 border border-white/20 bg-black/60 px-2.5 py-1 rounded backdrop-blur-sm">
            Sealed crate
          </span>
        </div>
      )}
    </div>
  );
}
