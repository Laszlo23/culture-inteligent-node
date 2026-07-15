/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Check, ExternalLink, Lock, ShieldCheck, 
  Award, Edit2, Info, X, Send, Share2, Sparkles, AlertTriangle, RefreshCw
} from 'lucide-react';
import { GameState } from '../types';

interface MemberProfileProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
}

const PRESET_AVATARS = [
  {
    name: 'Neon Hacker',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cyber Android',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Synthwave Pilot',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Quantum Core Dev',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tech Explorer',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
];

export default function MemberProfile({ state, setState, addLog }: MemberProfileProps) {
  // Safe profile hydration
  const profileState = state.profile || {
    avatarUrl: PRESET_AVATARS[0].url,
    aboutMe: '',
    xUsername: '',
    telegramUsername: '',
    discordUsername: '',
    profileCompletedRewardClaimed: false,
    xFollowClaimed: false,
    telegramJoinClaimed: false,
    discordJoinClaimed: false,
    xPostInteractionClaimed: false
  };

  // Local form states
  const [avatarUrl, setAvatarUrl] = useState(profileState.avatarUrl);
  const [aboutMe, setAboutMe] = useState(profileState.aboutMe);
  const [xUsername, setXUsername] = useState(profileState.xUsername);
  const [telegramUsername, setTelegramUsername] = useState(profileState.telegramUsername);
  const [discordUsername, setDiscordUsername] = useState(profileState.discordUsername);
  
  // Custom avatar URL input toggle
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // Local verification loading simulation states
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationFeedback, setVerificationFeedback] = useState('');

  // Check if profile fields are complete (Avatar, About, and at least 1 Social)
  const isProfileComplete = 
    avatarUrl.trim() !== '' && 
    aboutMe.trim().length >= 10 && 
    (xUsername.trim() !== '' || telegramUsername.trim() !== '' || discordUsername.trim() !== '');

  // Calculate global completed quests out of 5 (1 Profile + 4 Socials)
  const totalQuests = 5;
  const completedCount = 
    (profileState.profileCompletedRewardClaimed ? 1 : 0) +
    (profileState.xFollowClaimed ? 1 : 0) +
    (profileState.telegramJoinClaimed ? 1 : 0) +
    (profileState.discordJoinClaimed ? 1 : 0) +
    (profileState.xPostInteractionClaimed ? 1 : 0);

  const globalProgressPercent = Math.round((completedCount / totalQuests) * 100);

  // Apply custom changes to state
  const saveProfileSettings = () => {
    setState(prev => {
      const currentProfile = prev.profile || profileState;
      return {
        ...prev,
        profile: {
          ...currentProfile,
          avatarUrl,
          aboutMe,
          xUsername,
          telegramUsername,
          discordUsername
        }
      };
    });
    addLog("PROFILE SYNCHRONIZED: Member metadata has been updated successfully.", "success");
  };

  // Interactive reward claims simulation
  const startVerification = (taskId: string, claimAction: () => void) => {
    if (verifyingTaskId) return;

    // Check pre-requisites
    if (taskId === 'profile_completed' && !isProfileComplete) {
      addLog("REWARD REJECTED: Complete your profile avatar, write at least 10 chars of bio, and add a social username first.", "warn");
      return;
    }
    if (taskId === 'x_follow' && !xUsername) {
      addLog("REWARD REJECTED: Add your X username in your profile settings before claiming.", "warn");
      return;
    }
    if (taskId === 'tg_join' && !telegramUsername) {
      addLog("REWARD REJECTED: Add your Telegram username in your profile settings before claiming.", "warn");
      return;
    }
    if (taskId === 'discord_join' && !discordUsername) {
      addLog("REWARD REJECTED: Add your Discord username in your profile settings before claiming.", "warn");
      return;
    }
    if (taskId === 'x_interaction' && !xUsername) {
      addLog("REWARD REJECTED: Add your X username in your profile settings before claiming.", "warn");
      return;
    }

    setVerifyingTaskId(taskId);
    setVerificationProgress(0);

    const stages = [
      'Querying ledger state...',
      'Matching username signatures...',
      'Verifying protocol activity...',
      'Finalizing ecosystem credentials...',
      'Authentication successful!'
    ];

    let currentStage = 0;
    setVerificationFeedback(stages[0]);

    const interval = setInterval(() => {
      setVerificationProgress(prev => {
        const next = prev + 8;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            claimAction();
            setVerifyingTaskId(null);
          }, 300);
          return 100;
        }

        // Cycle through feedback
        const stageIdx = Math.min(stages.length - 1, Math.floor((next / 100) * stages.length));
        if (stageIdx !== currentStage) {
          currentStage = stageIdx;
          setVerificationFeedback(stages[stageIdx]);
        }
        return next;
      });
    }, 120);
  };

  // Reward triggers
  const claimProfileReward = () => {
    setState(prev => {
      const currentProfile = prev.profile || profileState;
      if (currentProfile.profileCompletedRewardClaimed) return prev;

      return {
        ...prev,
        credits: prev.credits + 200,
        energy: Math.min(100, prev.energy + 20),
        profile: {
          ...currentProfile,
          avatarUrl,
          aboutMe,
          xUsername,
          telegramUsername,
          discordUsername,
          profileCompletedRewardClaimed: true
        }
      };
    });
    addLog("LEDGER UNLOCKED: Profile filling reward approved. +200 CP, +20% Core Energy.", "success");
  };

  const claimXFollowReward = () => {
    setState(prev => {
      const currentProfile = prev.profile || profileState;
      if (currentProfile.xFollowClaimed) return prev;

      return {
        ...prev,
        credits: prev.credits + 100,
        profile: {
          ...currentProfile,
          xFollowClaimed: true
        }
      };
    });
    addLog("LEDGER UNLOCKED: Official X account follow reward approved. +100 CP added.", "success");
  };

  const claimTelegramJoinReward = () => {
    setState(prev => {
      const currentProfile = prev.profile || profileState;
      if (currentProfile.telegramJoinClaimed) return prev;

      return {
        ...prev,
        credits: prev.credits + 100,
        profile: {
          ...currentProfile,
          telegramJoinClaimed: true
        }
      };
    });
    addLog("LEDGER UNLOCKED: Telegram group join reward approved. +100 CP added.", "success");
  };

  const claimDiscordJoinReward = () => {
    setState(prev => {
      const currentProfile = prev.profile || profileState;
      if (currentProfile.discordJoinClaimed) return prev;

      return {
        ...prev,
        credits: prev.credits + 100,
        profile: {
          ...currentProfile,
          discordJoinClaimed: true
        }
      };
    });
    addLog("LEDGER UNLOCKED: Discord server join reward approved. +100 CP added.", "success");
  };

  const claimXInteractionReward = () => {
    setState(prev => {
      const currentProfile = prev.profile || profileState;
      if (currentProfile.xPostInteractionClaimed) return prev;

      return {
        ...prev,
        credits: prev.credits + 250,
        profile: {
          ...currentProfile,
          xPostInteractionClaimed: true
        }
      };
    });
    addLog("LEDGER UNLOCKED: X Post interaction (Like, Repost, Comment) reward approved. +250 CP added.", "success");
  };

  const selectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
    setShowCustomAvatarInput(false);
  };

  const applyCustomAvatar = () => {
    if (customAvatarUrl.trim() !== '') {
      setAvatarUrl(customAvatarUrl);
      setShowCustomAvatarInput(false);
    }
  };

  return (
    <div id="member-profile-room" className="space-y-6">
      
      {/* Banner / Header summary */}
      <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-cyber-grid bg-[size:24px_24px] opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-[10px] font-mono text-fuchsia-400 tracking-[0.2em] block uppercase font-bold">IDENTITY & COMMUNITY PROTOCOLS</span>
            <h2 className="text-2xl lg:text-3xl font-black italic text-white leading-none mt-2 mb-2">
              MEMBER PROFILE & SOCIAL HUB
            </h2>
            <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-xl">
              Fill out your member card, synchronize your active Web3 identities, and support the official **Building Culture** channels to claim exclusive credits and fuel reactor power.
            </p>
          </div>

          <div className="bg-[#050506]/80 border border-white/5 p-4 rounded-xl font-mono text-xs w-full md:w-auto min-w-[200px]">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-widest">
              <span>HUB SYNC STATUS</span>
              <span className="text-fuchsia-400">{globalProgressPercent}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-3">
              <motion.div 
                className="bg-gradient-to-r from-fuchsia-500 to-indigo-500 h-full"
                animate={{ width: `${globalProgressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{completedCount} / {totalQuests} REWARDS UNLOCKED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile Editor (Left Panel) */}
        <div className="lg:col-span-5 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-fuchsia-400" />
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">MEMBER DIGITAL CARD</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">ID_VERIFIED</span>
          </div>

          {/* Interactive Profile Card View */}
          <div className="bg-gradient-to-b from-[#111116] to-[#07070a] border border-white/5 rounded-2xl p-4 flex gap-4 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-[8px] text-slate-600 font-mono">BC-0941</div>
            
            {/* Display Avatar with standard referer security rule */}
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-[#050506]">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Member Avatar" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="space-y-1 w-full overflow-hidden">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-bold text-white tracking-tight">Active Member</span>
                <span className="text-[9px] font-mono bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 px-1.5 py-0.2 rounded font-black">
                  LEVEL {state.facilityLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 italic line-clamp-2 pr-2 font-sans">
                {aboutMe || '"Bio stands ready for authorization..."'}
              </p>
              
              <div className="flex flex-wrap gap-2 text-[9px] font-mono pt-1.5">
                {xUsername && <span className="text-cyan-400 bg-cyan-950/20 border border-cyan-800/30 px-1.5 py-0.5 rounded">X: {xUsername}</span>}
                {telegramUsername && <span className="text-sky-400 bg-sky-950/20 border border-sky-800/30 px-1.5 py-0.5 rounded">TG: {telegramUsername}</span>}
                {discordUsername && <span className="text-indigo-400 bg-indigo-950/20 border border-indigo-800/30 px-1.5 py-0.5 rounded">DISC: {discordUsername}</span>}
              </div>
            </div>
          </div>

          {/* Preset Avatar Selector */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wide">Select Avatar Profile</label>
              <button
                type="button"
                onClick={() => setShowCustomAvatarInput(!showCustomAvatarInput)}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors uppercase cursor-pointer"
              >
                {showCustomAvatarInput ? 'Preset Options' : 'Custom Image URL'}
              </button>
            </div>

            {showCustomAvatarInput ? (
              <div className="flex gap-2 font-mono">
                <input
                  type="text"
                  placeholder="Paste direct HTTPS image URL..."
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="flex-1 bg-[#050506] border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-xs font-sans"
                />
                <button
                  type="button"
                  onClick={applyCustomAvatar}
                  className="px-3.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  APPLY
                </button>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto py-1">
                {PRESET_AVATARS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectPresetAvatar(p.url)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border transition-all flex-shrink-0 cursor-pointer ${
                      avatarUrl === p.url ? 'border-fuchsia-500 scale-105 shadow-[0_0_10px_rgba(217,70,239,0.3)]' : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form Inputs */}
          <div className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 block font-bold uppercase tracking-wider">ABOUT ME (MIN 10 CHARS)</label>
              <textarea
                rows={3}
                placeholder="Write a brief bio about your interests or goals in Building Culture (e.g., 'Web3 dev learning Rust and AI integration')"
                value={aboutMe}
                onChange={(e) => setAboutMe(e.target.value)}
                className="w-full bg-[#050506] border border-white/10 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-xs leading-normal resize-none font-sans"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold uppercase tracking-wider">X USERNAME</label>
                <input
                  type="text"
                  placeholder="@your_handle"
                  value={xUsername}
                  onChange={(e) => setXUsername(e.target.value)}
                  className="w-full bg-[#050506] border border-white/10 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold uppercase tracking-wider">TELEGRAM</label>
                <input
                  type="text"
                  placeholder="@username"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  className="w-full bg-[#050506] border border-white/10 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold uppercase tracking-wider">DISCORD</label>
                <input
                  type="text"
                  placeholder="username#1234"
                  value={discordUsername}
                  onChange={(e) => setDiscordUsername(e.target.value)}
                  className="w-full bg-[#050506] border border-white/10 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-fuchsia-500 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={saveProfileSettings}
                className="flex-1 py-3 bg-[#050506] hover:bg-white/[0.03] border border-white/10 text-slate-300 font-bold rounded-xl tracking-wider uppercase transition-all cursor-pointer"
              >
                SAVE DETAILS
              </button>
              
              <button
                type="button"
                disabled={profileState.profileCompletedRewardClaimed}
                onClick={() => startVerification('profile_completed', claimProfileReward)}
                className={`flex-1 py-3 font-bold tracking-wider rounded-xl uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  profileState.profileCompletedRewardClaimed
                    ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                    : isProfileComplete
                    ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-950/20'
                    : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
                }`}
              >
                {profileState.profileCompletedRewardClaimed ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    REWARD CLAIMED
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    CLAIM REWARD (+200 CP)
                  </>
                )}
              </button>
            </div>
            
            {/* Hint message on incomplete profiles */}
            {!profileState.profileCompletedRewardClaimed && !isProfileComplete && (
              <p className="text-[10px] text-slate-500 leading-normal flex gap-1.5 items-start mt-2">
                <Info className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
                <span>To claim the profile reward, make sure you write at least 10 characters in 'About Me' and fill out at least one of the social usernames!</span>
              </p>
            )}
          </div>
        </div>

        {/* Social Missions (Right Panel) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Social Board */}
          <div className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 font-mono">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100 tracking-wider">OFFICIAL COMMUNITY QUESTS</h3>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">LIVE_POOLS</span>
            </div>

            {/* Simulated Live Synchronizer Telemetry */}
            <AnimatePresence mode="wait">
              {verifyingTaskId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-cyan-950/10 border border-cyan-500/30 p-4 rounded-xl space-y-3 font-mono text-xs overflow-hidden"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-cyan-400 animate-pulse font-black uppercase tracking-wider flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      SECURE CREDENTIAL AUDIT
                    </span>
                    <span className="text-slate-300 font-bold">{verificationProgress}%</span>
                  </div>
                  
                  <div className="w-full bg-[#050506] rounded-full h-2 overflow-hidden border border-white/5">
                    <motion.div 
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full"
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>FEEDBACK: {verificationFeedback}</span>
                    <span className="animate-pulse">● EXECUTING SYNC</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quests Lists */}
            <div className="space-y-4">
              
              {/* Task 1: Follow on X */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                profileState.xFollowClaimed 
                  ? 'bg-emerald-950/10 border-emerald-500/20 opacity-60' 
                  : 'bg-[#050506] border-white/5 hover:border-white/10'
              }`}>
                <div className="space-y-1 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded uppercase font-black tracking-widest">X OUTPOST</span>
                    <span className="text-[10px] text-slate-500">• 100 CP</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">FOLLOW OFFICIAL X HANDLE</h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Follow our updates at <span className="text-cyan-400 font-bold">@buildingcultu3</span> to track node expansions.
                  </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto font-mono text-xs">
                  <a
                    href="https://x.com/buildingcultu3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    OPEN
                  </a>
                  
                  <button
                    type="button"
                    disabled={profileState.xFollowClaimed}
                    onClick={() => startVerification('x_follow', claimXFollowReward)}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold transition-all ${
                      profileState.xFollowClaimed
                        ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                        : xUsername
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-black cursor-pointer'
                        : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {profileState.xFollowClaimed ? 'CLAIMED' : 'CLAIM'}
                  </button>
                </div>
              </div>

              {/* Task 2: Join Telegram */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                profileState.telegramJoinClaimed 
                  ? 'bg-emerald-950/10 border-emerald-500/20 opacity-60' 
                  : 'bg-[#050506] border-white/5 hover:border-white/10'
              }`}>
                <div className="space-y-1 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-1.5 py-0.2 rounded uppercase font-black tracking-widest">TELEGRAM</span>
                    <span className="text-[10px] text-slate-500">• 100 CP</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">JOIN THE OFFICIAL TELEGRAM UNIT</h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Synchronize communications with builders in our high-density group chat.
                  </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto font-mono text-xs">
                  <a
                    href="https://t.me/+4zFH7-2tyW0yOTBk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-sky-400" />
                    JOIN
                  </a>
                  
                  <button
                    type="button"
                    disabled={profileState.telegramJoinClaimed}
                    onClick={() => startVerification('tg_join', claimTelegramJoinReward)}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold transition-all ${
                      profileState.telegramJoinClaimed
                        ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                        : telegramUsername
                        ? 'bg-sky-600 hover:bg-sky-500 text-black cursor-pointer'
                        : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {profileState.telegramJoinClaimed ? 'CLAIMED' : 'CLAIM'}
                  </button>
                </div>
              </div>

              {/* Task 3: Join Discord */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                profileState.discordJoinClaimed 
                  ? 'bg-emerald-950/10 border-emerald-500/20 opacity-60' 
                  : 'bg-[#050506] border-white/5 hover:border-white/10'
              }`}>
                <div className="space-y-1 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.2 rounded uppercase font-black tracking-widest">DISCORD HQ</span>
                    <span className="text-[10px] text-slate-500">• 100 CP</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">STRIKE DISCORD CITADEL CONVERSATION</h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Establish secure links in our community Discord guild for team incentives.
                  </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto font-mono text-xs">
                  <a
                    href="https://discord.gg/geUpHt3eSb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    CONNECT
                  </a>
                  
                  <button
                    type="button"
                    disabled={profileState.discordJoinClaimed}
                    onClick={() => startVerification('discord_join', claimDiscordJoinReward)}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold transition-all ${
                      profileState.discordJoinClaimed
                        ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                        : discordUsername
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-black cursor-pointer'
                        : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {profileState.discordJoinClaimed ? 'CLAIMED' : 'CLAIM'}
                  </button>
                </div>
              </div>

              {/* Task 4: Like, Repost & Comment on X Post */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                profileState.xPostInteractionClaimed 
                  ? 'bg-emerald-950/10 border-emerald-500/20 opacity-60' 
                  : 'bg-[#050506] border-white/5 hover:border-white/10'
              }`}>
                <div className="space-y-1 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded uppercase font-black tracking-widest">X SPECIAL PROPAGANDA</span>
                    <span className="text-[10px] text-slate-500">• 250 CP</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">INTERACT: LIKE, REPOST & COMMENT</h4>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Engage with our core status ledger at post link: <span className="text-amber-400 font-semibold break-all text-[10px]">x.com/status/2077460511478751639</span>.
                  </p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto font-mono text-xs">
                  <a
                    href="https://x.com/bihary41418/status/2077460511478751639"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    ENGAGE
                  </a>
                  
                  <button
                    type="button"
                    disabled={profileState.xPostInteractionClaimed}
                    onClick={() => startVerification('x_interaction', claimXInteractionReward)}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg font-bold transition-all ${
                      profileState.xPostInteractionClaimed
                        ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                        : xUsername
                        ? 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer'
                        : 'bg-white/5 border border-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {profileState.xPostInteractionClaimed ? 'CLAIMED' : 'CLAIM'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
