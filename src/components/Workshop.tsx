/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, HardDrive, Zap, Compass, Check, Hammer, ShoppingCart, ArrowUp, AlertCircle } from 'lucide-react';
import { GameState, HardwareModule } from '../types';

interface WorkshopProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

export default function Workshop({ state, setState, addLog }: WorkshopProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<HardwareModule | null>(null);

  const buyModule = (module: HardwareModule) => {
    if (state.credits < module.cost) {
      addLog(`TRANSACTION ERROR: Insufficient credits. Need ${module.cost} credits. Current: ${state.credits}`, 'warn');
      return;
    }

    setState(prev => {
      const updatedHardware = prev.hardware.map(h => {
        if (h.id === module.id) {
          return { ...h, unlocked: true };
        }
        return h;
      });

      // Calculate new cumulative mining power
      const activeInstalledPower = updatedHardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusPower, 4.8); // 4.8 is base power

      // Calculate efficiency additions
      const activeInstalledEfficiency = updatedHardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusEfficiency, 1.0);

      return {
        ...prev,
        credits: prev.credits - module.cost,
        hardware: updatedHardware,
        miningPower: activeInstalledPower,
        efficiency: activeInstalledEfficiency
      };
    });

    addLog(`ACQUISITION GRANTED: Purchased ${module.name} for ${module.cost} credits. Module sent to facility inventory.`, 'success');
  };

  const toggleInstall = (module: HardwareModule) => {
    setState(prev => {
      const updatedHardware = prev.hardware.map(h => {
        if (h.id === module.id) {
          return { ...h, installed: !h.installed };
        }
        // If it's the same type of module, we only allow one to be active per type for balance, or can have multiple.
        // Let's allow installing multiple, but toggle this specific one.
        return h;
      });

      // Calculate total mining power
      const activeInstalledPower = updatedHardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusPower, 4.8);

      const activeInstalledEfficiency = updatedHardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusEfficiency, 1.0);

      return {
        ...prev,
        hardware: updatedHardware,
        miningPower: activeInstalledPower,
        efficiency: activeInstalledEfficiency
      };
    });

    if (module.installed) {
      addLog(`HARDWARE DE-MOUNTED: ${module.name} disconnected from central chassis grids.`, 'info');
    } else {
      addLog(`HARDWARE DEPLOYED: ${module.name} successfully mounted on reactor chamber.`, 'success');
    }
  };

  // Solder/Upgrade existing hardware modules
  const craftUpgrade = (module: HardwareModule) => {
    const upgradeCost = Math.floor(module.cost * 0.5);
    if (state.credits < upgradeCost) {
      addLog(`CRAFTING REJECTED: Insufficient assembly credits. Need ${upgradeCost} credits.`, 'warn');
      return;
    }

    setState(prev => {
      const updatedHardware = prev.hardware.map(h => {
        if (h.id === module.id) {
          return {
            ...h,
            name: `Enhanced ${h.name}`,
            bonusPower: Math.floor(h.bonusPower * 1.3),
            bonusEfficiency: parseFloat((h.bonusEfficiency * 1.25).toFixed(3)),
            cost: Math.floor(h.cost * 1.5)
          };
        }
        return h;
      });

      // Recalculate based on newly updated stats
      const activeInstalledPower = updatedHardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusPower, 4.8);

      const activeInstalledEfficiency = updatedHardware
        .filter(h => h.installed && h.unlocked)
        .reduce((sum, h) => sum + h.bonusEfficiency, 1.0);

      return {
        ...prev,
        credits: prev.credits - upgradeCost,
        hardware: updatedHardware,
        miningPower: activeInstalledPower,
        efficiency: activeInstalledEfficiency
      };
    });

    addLog(`FORGE SOLDER SUCCESSFUL: ${module.name} hardware registers upgraded (+30% power, +25% efficiency).`, 'success');
    setSelectedModule(null);
  };

  const filteredHardware = state.hardware.filter(h => {
    if (filterType === 'all') return true;
    if (filterType === 'unlocked') return h.unlocked;
    if (filterType === 'locked') return !h.unlocked;
    return h.type === filterType;
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return { border: 'border-fuchsia-500/80', bg: 'bg-fuchsia-950/20', text: 'text-fuchsia-400', badge: 'bg-fuchsia-900/40 border-fuchsia-700 text-fuchsia-300' };
      case 'Epic': return { border: 'border-cyan-500/80', bg: 'bg-cyan-950/20', text: 'text-cyan-400', badge: 'bg-cyan-900/40 border-cyan-700 text-cyan-300' };
      case 'Rare': return { border: 'border-blue-500/80', bg: 'bg-blue-950/20', text: 'text-blue-400', badge: 'bg-blue-900/40 border-blue-700 text-blue-300' };
      default: return { border: 'border-emerald-500/80', bg: 'bg-emerald-950/20', text: 'text-emerald-400', badge: 'bg-emerald-900/40 border-emerald-700 text-emerald-300' };
    }
  };

  return (
    <div id="workshop-room" className="space-y-6">
      
      {/* Filters and Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0a0a0c] border border-white/5 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <Hammer className="w-5 h-5 text-cyan-400" />
          <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">HARDWARE MARKETPLACE & ASSEMBLY</h3>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          {['all', 'unlocked', 'locked', 'gpu', 'memory', 'cooler', 'battery'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                filterType === type
                  ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-bold'
                  : 'bg-[#050506] border border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Assembly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHardware.map(item => {
          const rStyles = getRarityColor(item.rarity);
          return (
            <motion.div
              layout
              key={item.id}
              className={`bg-[#0a0a0c] border-2 ${rStyles.border} rounded-2xl p-5 shadow-xl relative flex flex-col justify-between overflow-hidden group hover:scale-[1.01] transition-all`}
            >
              {/* Decorative top corner rarity label */}
              <div className="absolute top-0 right-0">
                <span className={`text-[9px] font-mono border-l border-b px-2.5 py-1 block rounded-bl-lg tracking-wider ${rStyles.badge}`}>
                  {item.rarity.toUpperCase()}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-500 tracking-widest block">{item.type.toUpperCase()} INTERFACE</span>
                <h4 className="text-sm font-semibold text-slate-100 font-mono mt-1 group-hover:text-cyan-300 transition-colors">
                  {item.name}
                </h4>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Stat gains block */}
                <div className="grid grid-cols-2 gap-2 mt-4 font-mono text-xs bg-[#050506] p-2.5 rounded-lg border border-white/5">
                  <div>
                    <span className="text-[9px] text-slate-500 block">MINING POWER</span>
                    <span className="text-slate-200 font-bold">+{item.bonusPower} PH/s</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">EFFICIENCY</span>
                    <span className="text-emerald-400 font-bold">+{item.bonusEfficiency.toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2.5">
                {!item.unlocked ? (
                  // Purchase block
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="font-mono">
                      <span className="text-[9px] text-slate-500 block">COST</span>
                      <span className="text-amber-400 font-bold">{item.cost} CP</span>
                    </div>
                    <button
                      onClick={() => buyModule(item)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-mono text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      UNLOCK
                    </button>
                  </div>
                ) : (
                  // Mount / Unmount control
                  <div className="flex w-full items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedModule(item)}
                      className="bg-[#050506] hover:bg-white/[0.03] border border-white/10 text-slate-300 font-mono text-[11px] px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Upgrade Module Metrics"
                    >
                      <Hammer className="w-3.5 h-3.5 text-slate-400" />
                      UPGRADE
                    </button>

                    <button
                      onClick={() => toggleInstall(item)}
                      className={`px-4 py-2 rounded-xl font-mono text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        item.installed
                          ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-black'
                      }`}
                    >
                      {item.installed ? (
                        <>
                          <Check className="w-4 h-4" />
                          MOUNTED
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          MOUNT RIG
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

        {/* Forge/Upgrade Modal */}
        <AnimatePresence>
          {selectedModule && (
            <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0a0a0c] border border-white/10 rounded-2xl max-w-md w-full p-6 relative overflow-hidden shadow-2xl"
              >
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-amber-500" />
                
                <h4 className="text-sm font-semibold font-mono tracking-wider text-slate-100 flex items-center gap-2 mb-2">
                  <Hammer className="w-4 h-4 text-cyan-400" />
                  MODULE UPGRADE STATION
                </h4>
                
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Upgrade <span className="text-slate-200 font-bold">{selectedModule.name}</span> to permanently increase its mining power and efficiency metrics.
                </p>

                {/* Solder comparison grids */}
                <div className="my-5 p-4 bg-[#050506] border border-white/5 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-slate-400">Upgrade Cost:</span>
                    <span className="text-amber-400 font-bold">{Math.floor(selectedModule.cost * 0.5)} CP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Mining Power:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{selectedModule.bonusPower} PH/s</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-emerald-400 font-bold">+{Math.floor(selectedModule.bonusPower * 1.3)} PH/s</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Efficiency Boost:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">+{selectedModule.bonusEfficiency.toFixed(2)}x</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-emerald-400 font-bold">+{(selectedModule.bonusEfficiency * 1.25).toFixed(2)}x</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 font-mono text-xs">
                  <button
                    onClick={() => setSelectedModule(null)}
                    className="px-4 py-2 bg-[#050506] border border-white/10 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={() => craftUpgrade(selectedModule)}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                    CONFIRM UPGRADE
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

    </div>
  );
}
