/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Check, ExternalLink, Lock, ShieldCheck, 
  Award, Edit2, Info, X, Send, Share2, Sparkles, AlertTriangle, RefreshCw,
  Cpu, Coins, Hammer, ShoppingBag, Tag, PlusCircle, CheckCircle2, Wallet, Trash2, ArrowUpRight
} from 'lucide-react';
import { GameState, MinerNFT } from '../types';

function MinerVisual({ imageType, rarity }: { imageType: string; rarity: string }) {
  const colors = {
    Common: { primary: '#64748b', glow: 'rgba(100, 116, 139, 0.2)', bg: '#1e293b' },
    Rare: { primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)', bg: '#1e3a8a' },
    Epic: { primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', bg: '#3b0764' },
    Legendary: { primary: '#eab308', glow: 'rgba(234, 179, 8, 0.5)', bg: '#451a03' },
    Mythic: { primary: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)', bg: '#450a0a' },
  }[rarity as 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic'] || { primary: '#22d3ee', glow: 'rgba(34, 211, 238, 0.3)', bg: '#083344' };

  if (imageType === 'obsidian') {
    return (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="16" fill="#09090c" />
        <rect x="2" y="2" width="96" height="96" rx="14" stroke={colors.primary} strokeWidth="1.5" strokeOpacity="0.4" />
        <defs>
          <filter id="glow-obsidian" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Animated rotating background nodes */}
        <circle cx="50" cy="50" r="32" stroke={colors.primary} strokeWidth="0.5" strokeDasharray="4 6" opacity="0.3" />
        <rect x="30" y="30" width="40" height="40" rx="8" fill={colors.bg} stroke={colors.primary} strokeWidth="2.5" filter="url(#glow-obsidian)" />
        <path d="M50 15 V30 M50 70 V85 M15 50 H30 M70 50 H85" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="50" r="10" fill="#09090c" stroke={colors.primary} strokeWidth="1.5" />
        <circle cx="50" cy="50" r="4" fill={colors.primary} className="animate-pulse" />
      </svg>
    );
  } else if (imageType === 'helix') {
    return (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="16" fill="#09090c" />
        <rect x="2" y="2" width="96" height="96" rx="14" stroke={colors.primary} strokeWidth="1.5" strokeOpacity="0.4" />
        <defs>
          <filter id="glow-helix" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Dynamic double helix path */}
        <path d="M30 30 C 40 40, 40 60, 50 50 C 60 40, 60 60, 70 70" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" filter="url(#glow-helix)" />
        <path d="M30 70 C 40 60, 40 40, 50 50 C 60 60, 60 40, 70 30" stroke={colors.primary} strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" opacity="0.6" />
        <circle cx="30" cy="30" r="4" fill={colors.primary} />
        <circle cx="70" cy="70" r="4" fill={colors.primary} />
        <circle cx="50" cy="50" r="7" fill={colors.bg} stroke={colors.primary} strokeWidth="2" />
      </svg>
    );
  } else if (imageType === 'reactor') {
    return (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="16" fill="#09090c" />
        <rect x="2" y="2" width="96" height="96" rx="14" stroke={colors.primary} strokeWidth="1.5" strokeOpacity="0.4" />
        <defs>
          <filter id="glow-reactor" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {/* Pentagram fusion reactor chamber */}
        <polygon points="50,15 82,42 70,82 30,82 18,42" fill={colors.bg} stroke={colors.primary} strokeWidth="2" strokeLinejoin="round" />
        <polygon points="50,25 72,43 64,72 36,72 28,43" fill="#09090c" stroke={colors.primary} strokeWidth="1.2" strokeDasharray="2 3" />
        <circle cx="50" cy="52" r="14" fill={colors.bg} stroke={colors.primary} strokeWidth="2" filter="url(#glow-reactor)" />
        <circle cx="50" cy="52" r="6" fill="#fff" className="animate-ping" style={{ animationDuration: '3s' }} />
      </svg>
    );
  } else {
    // Quantum Nexus Grid
    return (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="16" fill="#09090c" />
        <rect x="2" y="2" width="96" height="96" rx="14" stroke={colors.primary} strokeWidth="1.5" strokeOpacity="0.4" />
        <defs>
          <filter id="glow-quantum" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx="50" cy="50" r="30" stroke={colors.primary} strokeWidth="1.2" strokeDasharray="3 4" opacity="0.4" />
        <circle cx="50" cy="50" r="20" stroke={colors.primary} strokeWidth="2.5" filter="url(#glow-quantum)" />
        <line x1="15" y1="15" x2="85" y2="85" stroke={colors.primary} strokeWidth="1" strokeOpacity="0.3" />
        <line x1="85" y1="15" x2="15" y2="85" stroke={colors.primary} strokeWidth="1" strokeOpacity="0.3" />
        <circle cx="50" cy="50" r="8" fill="#ffffff" filter="url(#glow-quantum)" />
      </svg>
    );
  }
}

interface MemberProfileProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  currentUser: { username: string; email: string; walletAddress?: string } | null;
  onLogout: () => void;
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

export default function MemberProfile({ state, setState, addLog, currentUser, onLogout }: MemberProfileProps) {
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

  // Tab & NFT interaction states
  const [rightTab, setRightTab] = useState<'social' | 'miners'>('miners');
  const [listingNftId, setListingNftId] = useState<string | null>(null);
  const [nftListingPrice, setNftListingPrice] = useState<string>('75');
  const [isMintingNft, setIsMintingNft] = useState<boolean>(false);
  const [mintStep, setMintStep] = useState<string>('');

  // Formula to keep global miningPower synced across the station
  const recalculateMiningPower = (newNFTs: MinerNFT[], hardwareList = state.hardware) => {
    const activeInstalledPower = hardwareList
      .filter(h => h.installed && h.unlocked)
      .reduce((sum, h) => sum + h.bonusPower, 4.8);
    
    const ownedNFTsPower = newNFTs
      .filter(n => n.owner === 'Me')
      .reduce((sum, n) => sum + n.hashrate, 0);

    const activeWorkersPower = state.workers
      .filter(w => w.unlocked)
      .reduce((sum, w) => sum + w.powerBonus * (1 + (w.level - 1) * 0.25), 0);

    return parseFloat((activeInstalledPower + ownedNFTsPower + activeWorkersPower).toFixed(1));
  };

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

  // --- NFT Web3 Transaction Handlers ---
  const buyMinerNft = (nft: MinerNFT) => {
    const currentCGT = state.cognitiveTokens || 0;
    if (currentCGT < nft.listingPrice) {
      addLog(`TRANSACTION REJECTED: Insufficient balance. You need ${nft.listingPrice} CGT but only have ${currentCGT} CGT.`, "warn");
      return;
    }

    addLog(`BROADCASTING PURCHASE: Initiating secure ledger acquisition signature for "${nft.name}"...`, "info");
    
    setTimeout(() => {
      setState(prev => {
        const nextNFTs = prev.minerNFTs.map(item => {
          if (item.id === nft.id) {
            return { ...item, owner: 'Me', isListed: false, listingPrice: 0 };
          }
          return item;
        });
        const nextPower = recalculateMiningPower(nextNFTs, prev.hardware);
        return {
          ...prev,
          cognitiveTokens: (prev.cognitiveTokens || 0) - nft.listingPrice,
          minerNFTs: nextNFTs,
          miningPower: nextPower
        };
      });
      addLog(`LEDGER SETTLED: Purchased "${nft.name}" for ${nft.listingPrice} CGT. Rigs output expanded!`, "success");
    }, 1200);
  };

  const listMinerNft = (nftId: string) => {
    const priceVal = Number(nftListingPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      addLog("LISTING ERROR: Please enter a valid price greater than 0.", "warn");
      return;
    }

    addLog(`BROADCASTING LISTING: Writing escrow parameters for token ${nftId}...`, "info");

    setTimeout(() => {
      setState(prev => {
        const nextNFTs = prev.minerNFTs.map(item => {
          if (item.id === nftId) {
            return { ...item, isListed: true, listingPrice: priceVal };
          }
          return item;
        });
        const nextPower = recalculateMiningPower(nextNFTs, prev.hardware);
        return {
          ...prev,
          minerNFTs: nextNFTs,
          miningPower: nextPower
        };
      });
      setListingNftId(null);
      addLog(`NFT LISTED: Rig successfully offered on public Devnet DEX at ${priceVal} CGT.`, "success");
    }, 1000);
  };

  const cancelListingNft = (nftId: string) => {
    addLog(`CANCELING LISTING: Recalling item from DEX contract...`, "info");

    setTimeout(() => {
      setState(prev => {
        const nextNFTs = prev.minerNFTs.map(item => {
          if (item.id === nftId) {
            return { ...item, isListed: false, listingPrice: 0 };
          }
          return item;
        });
        const nextPower = recalculateMiningPower(nextNFTs, prev.hardware);
        return {
          ...prev,
          minerNFTs: nextNFTs,
          miningPower: nextPower
        };
      });
      addLog(`LISTING REVOKED: Miner returned safely to your secure digital hardware rig.`, "success");
    }, 1000);
  };

  const upgradeMinerNft = (nft: MinerNFT) => {
    const currentCGT = state.cognitiveTokens || 0;
    if (currentCGT < nft.upgradeCost) {
      addLog(`UPGRADE DECLINED: Insufficient COGNITIVE tokens. Requires ${nft.upgradeCost} CGT.`, "warn");
      return;
    }

    addLog(`UPGRADING MODULE: Solder instruction transmitted to NFT ${nft.id}...`, "info");

    setTimeout(() => {
      setState(prev => {
        const nextNFTs = prev.minerNFTs.map(item => {
          if (item.id === nft.id) {
            const nextLevel = item.level + 1;
            const extraHashrate = {
              Common: 50,
              Rare: 120,
              Epic: 200,
              Legendary: 350,
              Mythic: 600
            }[item.rarity] || 50;
            return {
              ...item,
              level: nextLevel,
              hashrate: item.hashrate + extraHashrate,
              upgradeCost: item.upgradeCost * 2
            };
          }
          return item;
        });
        const nextPower = recalculateMiningPower(nextNFTs, prev.hardware);
        return {
          ...prev,
          cognitiveTokens: (prev.cognitiveTokens || 0) - nft.upgradeCost,
          minerNFTs: nextNFTs,
          miningPower: nextPower
        };
      });
      addLog(`UPGRADE SUCCESSFUL: Elevated "${nft.name}" to Level ${nft.level + 1}! Hashrate boosted!`, "success");
    }, 1200);
  };

  const mintNewMinerNft = () => {
    const currentCGT = state.cognitiveTokens || 0;
    if (currentCGT < 100) {
      addLog("MINTING ERROR: Insufficient balance. Minting costs 100 CGT.", "warn");
      return;
    }

    setIsMintingNft(true);
    setMintStep("1/4 Registering new asset structure on Devnet...");

    setTimeout(() => {
      setMintStep("2/4 Encrypting SVG procedural model vector payload...");

      setTimeout(() => {
        setMintStep("3/4 Signing on-chain transaction with secure identity keys...");

        setTimeout(() => {
          setMintStep("4/4 Distributing consensus blocks to validators...");

          setTimeout(() => {
            const minerNames = [
              "Nebula Plasma-Forge", "Chronos Temporal-Rig", 
              "Starlight Quantum-Core", "Cyber Void-Infuser", 
              "Giga Silicon-Catalyst"
            ];
            const minerImages = ["obsidian", "helix", "reactor", "quantum"];
            
            const roll = Math.random() * 100;
            let rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' = 'Common';
            let baseHash = 100;
            let upCost = 40;

            if (roll < 50) {
              rarity = 'Common';
              baseHash = Math.floor(Math.random() * 100) + 100;
              upCost = 50;
            } else if (roll < 80) {
              rarity = 'Rare';
              baseHash = Math.floor(Math.random() * 150) + 250;
              upCost = 100;
            } else if (roll < 95) {
              rarity = 'Epic';
              baseHash = Math.floor(Math.random() * 350) + 450;
              upCost = 200;
            } else if (roll < 99) {
              rarity = 'Legendary';
              baseHash = Math.floor(Math.random() * 600) + 900;
              upCost = 400;
            } else {
              rarity = 'Mythic';
              baseHash = Math.floor(Math.random() * 1000) + 2000;
              upCost = 800;
            }

            const randName = minerNames[Math.floor(Math.random() * minerNames.length)];
            const randImg = minerImages[Math.floor(Math.random() * minerImages.length)];
            const randId = `miner_${Date.now()}`;
            const randAddress = `SolMT${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            const newNFT: MinerNFT = {
              id: randId,
              name: randName,
              image: randImg,
              hashrate: baseHash,
              level: 1,
              maxLevel: 5,
              rarity: rarity,
              isListed: false,
              listingPrice: 0,
              upgradeCost: upCost,
              mintAddress: randAddress,
              owner: 'Me',
              description: `A mastercrafted ${rarity.toLowerCase()} tier operations miner, newly minted on-chain.`
            };

            setState(prev => {
              const nextNFTs = [...prev.minerNFTs, newNFT];
              const nextPower = recalculateMiningPower(nextNFTs, prev.hardware);
              return {
                ...prev,
                cognitiveTokens: (prev.cognitiveTokens || 0) - 100,
                minerNFTs: nextNFTs,
                miningPower: nextPower
              };
            });

            setIsMintingNft(false);
            setMintStep('');
            addLog(`MINT CONFIRMED: Successfully minted 1x standard ${rarity} Miner NFT to your account! Address: ${randAddress}`, "success");
          }, 800);
        }, 800);
      }, 800);
    }, 800);
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

          {/* Active Cryptographic Account Session Status */}
          {currentUser && (
            <div className="p-4 bg-[#050506] border border-white/10 rounded-xl space-y-3 font-mono text-[11px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.02] rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">ACTIVE CREDENTIAL SESSION</span>
                <span className={`text-[8px] px-1.5 py-0.2 border rounded font-black ${
                  currentUser.username.startsWith('Guest_')
                    ? 'bg-slate-950/20 border-slate-800 text-slate-500'
                    : 'bg-cyan-950/40 border-cyan-500/20 text-cyan-400'
                }`}>
                  {currentUser.username.startsWith('Guest_') ? 'TEMP OBSERVER' : 'SECURE LEDGER'}
                </span>
              </div>
              
              <div className="space-y-1 bg-black/30 p-3 rounded-lg border border-white/[0.03]">
                <div className="flex justify-between">
                  <span className="text-slate-500">USER HANDLE:</span>
                  <span className="text-slate-200 font-bold">@{currentUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">EMAIL LINK:</span>
                  <span className="text-slate-300 truncate max-w-[150px]" title={currentUser.email}>
                    {currentUser.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">WALLET LINK:</span>
                  <span className="text-slate-400 truncate max-w-[150px]">
                    {currentUser.walletAddress || 'No Wallet bound (Link in Treasury)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2 bg-red-950/20 hover:bg-red-900/30 border border-red-500/30 hover:border-red-500/50 text-red-400 font-bold rounded-lg tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                SECURE LOGOUT
              </button>
            </div>
          )}

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

        {/* Social & NFT Miner (Right Panel) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tabs Selector */}
          <div className="flex bg-[#050506] border border-white/5 rounded-xl p-1 font-mono text-xs">
            <button
              onClick={() => setRightTab('miners')}
              className={`flex-1 py-2.5 rounded-lg font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                rightTab === 'miners'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white shadow-lg font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Cpu className="w-4 h-4" />
              NFT MINER RIGS
            </button>
            <button
              onClick={() => setRightTab('social')}
              className={`flex-1 py-2.5 rounded-lg font-bold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                rightTab === 'social'
                  ? 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white shadow-lg font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Share2 className="w-4 h-4" />
              COMMUNITY QUESTS
            </button>
          </div>

          {rightTab === 'social' ? (
            /* Main Social Board */
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
                      Follow our updates at <span className="text-cyan-400 font-bold font-mono">@buildingcultu3</span> to track node expansions.
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
                      Engage with our core status ledger at post link: <span className="text-amber-400 font-semibold break-all text-[10px] font-mono">x.com/status/2077460511478751639</span>.
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
          ) : (
            /* SECURE NFT MINER RIGS & DECENTRALIZED MARKETPLACE */
            <div className="space-y-6 font-mono text-xs">
              
              {/* Wallet Association Checker */}
              {!currentUser?.walletAddress && (
                <div className="bg-red-950/10 border border-red-500/30 rounded-2xl p-4 flex gap-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/[0.02] rounded-full blur-xl pointer-events-none" />
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-red-400 uppercase tracking-wider">SOLANA WALLET NOT BOUND</h4>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Your identity card lacks a registered Solana address. To manage, upgrade, or trade NFT assets on-chain, please open the <strong>Ecosystem Vault (Treasury)</strong> and connect a Devnet wallet or local secure keypair.
                    </p>
                  </div>
                </div>
              )}

              {/* HUD / Stats display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4 flex justify-between items-center shadow-md">
                  <div>
                    <span className="text-[8px] text-slate-500 block">TOTAL RIGS CAPACITY</span>
                    <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400">
                      {(state.minerNFTs || []).filter(n => n.owner === 'Me').length} ACTIVE RIGS
                    </span>
                  </div>
                  <Cpu className="w-5 h-5 text-fuchsia-400" />
                </div>

                <div className="bg-[#0a0a0c] border border-white/5 rounded-xl p-4 flex justify-between items-center shadow-md">
                  <div>
                    <span className="text-[8px] text-cyan-500 block font-bold">COGNITIVE TOKEN BALANCE</span>
                    <span className="text-lg font-black text-cyan-400">
                      {state.cognitiveTokens ?? 250} CGT
                    </span>
                  </div>
                  <Coins className="w-5 h-5 text-cyan-400" />
                </div>
              </div>

              {/* Mint Module Card */}
              <div className="bg-gradient-to-r from-[#170a24] to-[#0a0614] border border-fuchsia-500/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30 px-2 py-0.5 rounded uppercase font-black tracking-widest">SOLANA DEPLOYER</span>
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider mt-1">MINT PROTOCOL CORE (NFT)</h4>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Deploy 100 CGT to trigger a standard on-chain mint transaction. Releases a random high-density miner rig directly into your wallet.
                    </p>
                  </div>

                  <button
                    onClick={mintNewMinerNft}
                    disabled={isMintingNft || (state.cognitiveTokens ?? 0) < 100}
                    className={`w-full sm:w-auto px-5 py-3 rounded-xl font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      !isMintingNft && (state.cognitiveTokens ?? 0) >= 100
                        ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-950/30 font-black'
                        : 'bg-white/[0.02] border border-white/5 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    MINT (100 CGT)
                  </button>
                </div>

                {isMintingNft && (
                  <div className="mt-4 bg-[#050506]/80 border border-fuchsia-500/30 p-3.5 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-fuchsia-400 font-bold uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        BROADCASTING MINT INSTANCE...
                      </span>
                      <span className="text-slate-400">PROCESSING</span>
                    </div>
                    <div className="text-[10px] text-slate-300 bg-black/40 p-2 rounded border border-white/[0.03] italic">
                      {mintStep}
                    </div>
                  </div>
                )}
              </div>

              {/* My Rigs Inventory Grid */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  <Cpu className="w-4 h-4 text-fuchsia-400" />
                  <span>MY ACTIVE HARDWARE RIGS ({(state.minerNFTs || []).filter(n => n.owner === 'Me').length})</span>
                </div>

                {(state.minerNFTs || []).filter(n => n.owner === 'Me').length === 0 ? (
                  <div className="bg-[#050506] border border-white/5 rounded-xl p-6 text-center text-slate-500 font-sans">
                    No active mining rigs found in your linked wallet. Mint one above!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(state.minerNFTs || []).filter(n => n.owner === 'Me').map(nft => {
                      const isListingThis = listingNftId === nft.id;

                      return (
                        <div key={nft.id} className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-4.5 space-y-4 relative overflow-hidden shadow-md group">
                          {/* Top Card Rarity Pill */}
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] px-2 py-0.5 border rounded uppercase font-black tracking-widest ${
                              nft.rarity === 'Common' ? 'bg-slate-950/40 border-slate-500/20 text-slate-400' :
                              nft.rarity === 'Rare' ? 'bg-blue-950/40 border-blue-500/20 text-blue-400' :
                              nft.rarity === 'Epic' ? 'bg-purple-950/40 border-purple-500/20 text-purple-400' :
                              nft.rarity === 'Legendary' ? 'bg-amber-950/40 border-amber-500/20 text-amber-400' :
                              'bg-red-950/40 border-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                            }`}>
                              {nft.rarity}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                              LVL {nft.level} / {nft.maxLevel}
                            </span>
                          </div>

                          {/* Visual Component */}
                          <div className="grid grid-cols-3 gap-3 items-center">
                            <div className="w-16 h-16 rounded-xl border border-white/10 p-0.5 bg-[#050506] relative overflow-hidden flex-shrink-0">
                              <MinerVisual imageType={nft.image} rarity={nft.rarity} />
                            </div>

                            <div className="col-span-2 space-y-1">
                              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-xs line-clamp-1">{nft.name}</h5>
                              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                                <span>+{nft.hashrate} PH/s</span>
                              </div>
                              <span className="text-[8px] text-slate-500 block truncate" title={nft.mintAddress}>
                                Mint: {nft.mintAddress.slice(0, 10)}...
                              </span>
                            </div>
                          </div>

                          {/* Action Controls Panel */}
                          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-white/5">
                            {/* Upgrade Button */}
                            <button
                              onClick={() => upgradeMinerNft(nft)}
                              disabled={nft.level >= nft.maxLevel || (state.cognitiveTokens ?? 0) < nft.upgradeCost}
                              className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                nft.level >= nft.maxLevel
                                  ? 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                                  : (state.cognitiveTokens ?? 0) >= nft.upgradeCost
                                  ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold'
                                  : 'bg-white/[0.01] border border-white/5 text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              <Hammer className="w-3 h-3" />
                              {nft.level >= nft.maxLevel ? 'MAX LEVEL' : `UPGRADE (${nft.upgradeCost} CGT)`}
                            </button>

                            {/* Listing Controls Toggle */}
                            {nft.isListed ? (
                              <button
                                onClick={() => cancelListingNft(nft.id)}
                                className="py-2 px-3 bg-red-950/20 hover:bg-red-900/30 border border-red-500/30 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                REVOKE ESCROW
                              </button>
                            ) : isListingThis ? (
                              <div className="flex gap-1.5">
                                <input
                                  type="number"
                                  value={nftListingPrice}
                                  onChange={(e) => setNftListingPrice(e.target.value)}
                                  placeholder="Price"
                                  className="w-16 bg-[#050506] border border-cyan-500/30 text-slate-200 outline-none text-center rounded text-[10px]"
                                />
                                <button
                                  onClick={() => listMinerNft(nft.id)}
                                  className="px-2 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded text-[9px] uppercase tracking-wider"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => setListingNftId(null)}
                                  className="px-2 py-1.5 bg-white/5 text-slate-400 rounded text-[9px]"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setListingNftId(nft.id);
                                  setNftListingPrice('150');
                                }}
                                className="py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                LIST FOR SALE
                              </button>
                            )}
                          </div>

                          {nft.isListed && (
                            <div className="absolute bottom-1 right-2 text-[8px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-1.5 py-0.2 rounded font-black tracking-widest uppercase">
                              Listed: {nft.listingPrice} CGT
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* public DEX Station Marketplace Grid */}
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  <span>ON-CHAIN STATION MARKETPLACE (PUBLIC OFFERS)</span>
                </div>

                {(state.minerNFTs || []).filter(n => n.owner !== 'Me' && n.isListed).length === 0 ? (
                  <div className="bg-[#050506] border border-white/5 rounded-xl p-6 text-center text-slate-500 font-sans">
                    No active public listings offering miner rigs on Devnet. List one of your own to see it!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(state.minerNFTs || []).filter(n => n.owner !== 'Me' && n.isListed).map(nft => {
                      return (
                        <div key={nft.id} className="bg-[#0a0a0c] border border-cyan-500/10 rounded-2xl p-4.5 space-y-4 relative overflow-hidden shadow-md hover:border-cyan-500/20 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] px-2 py-0.5 border rounded uppercase font-black tracking-widest ${
                              nft.rarity === 'Common' ? 'bg-slate-950/40 border-slate-500/20 text-slate-400' :
                              nft.rarity === 'Rare' ? 'bg-blue-950/40 border-blue-500/20 text-blue-400' :
                              nft.rarity === 'Epic' ? 'bg-purple-950/40 border-purple-500/20 text-purple-400' :
                              nft.rarity === 'Legendary' ? 'bg-amber-950/40 border-amber-500/20 text-amber-400' :
                              'bg-red-950/40 border-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                            }`}>
                              {nft.rarity}
                            </span>
                            <span className="text-[9px] text-cyan-400 font-black font-mono">
                              DEX LISTED
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 items-center">
                            <div className="w-16 h-16 rounded-xl border border-white/10 p-0.5 bg-[#050506] relative overflow-hidden flex-shrink-0">
                              <MinerVisual imageType={nft.image} rarity={nft.rarity} />
                            </div>

                            <div className="col-span-2 space-y-1">
                              <h5 className="font-bold text-slate-200 uppercase tracking-wider text-xs line-clamp-1">{nft.name}</h5>
                              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold">
                                <span>+{nft.hashrate} PH/s</span>
                              </div>
                              <span className="text-[8px] text-slate-500 block truncate" title={`Seller: ${nft.owner}`}>
                                Seller: {nft.owner.slice(0, 10)}...
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-white/5">
                            <div className="font-mono text-xs text-slate-400">
                              <span className="text-[8px] text-slate-500 block">PRICE</span>
                              <span className="text-cyan-400 font-black text-sm">{nft.listingPrice} CGT</span>
                            </div>

                            <button
                              onClick={() => buyMinerNft(nft)}
                              disabled={(state.cognitiveTokens ?? 0) < nft.listingPrice}
                              className={`px-4.5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                (state.cognitiveTokens ?? 0) >= nft.listingPrice
                                  ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-500 hover:to-indigo-600 text-slate-950 font-black shadow-md shadow-cyan-950/20'
                                  : 'bg-white/[0.01] border border-white/5 text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              BUY NFT
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>    </div>

      </div>

  );
}
