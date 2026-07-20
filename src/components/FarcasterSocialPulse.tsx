/**
 * Passport social pulse — Neynar score + most engaging Farcaster casts.
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ExternalLink, Flame, Heart, MessageCircle, Repeat2, Sparkles, Link2 } from 'lucide-react';
import {
  clearFarcasterLink,
  fetchSocialPulse,
  normalizeFcUsername,
  readFarcasterLink,
  writeFarcasterLink,
  type SocialPulse,
  type SocialPulseCast,
} from '../lib/neynar/social';
import { readMiniAppViewer } from '../lib/farcaster/miniapp-context';
import { FARCASTER_PASSPORT, openFarcasterCompose } from '../lib/farcaster';

type Props = {
  walletAddress?: string | null;
  /** Profile-linked Farcaster username (preferred over localStorage) */
  farcasterUsername?: string | null;
  compact?: boolean;
  onLinkedUsername?: (username: string) => void;
};

export default function FarcasterSocialPulse({
  walletAddress,
  farcasterUsername,
  compact = false,
  onLinkedUsername,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [pulse, setPulse] = useState<SocialPulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [handleInput, setHandleInput] = useState('');
  const [castIndex, setCastIndex] = useState(0);
  const [busyLink, setBusyLink] = useState(false);
  const [detached, setDetached] = useState(false);

  const load = async (override?: { fid?: number; username?: string; skipProfile?: boolean }) => {
    setLoading(true);
    try {
      const link = readFarcasterLink();
      const viewer = detached ? null : await readMiniAppViewer();
      const username =
        override?.username ||
        (!override?.skipProfile && !detached ? farcasterUsername : undefined) ||
        link?.username ||
        viewer?.username ||
        undefined;
      const fid =
        override?.fid ||
        (!detached ? link?.fid || viewer?.fid : link?.fid) ||
        undefined;

      let next = await fetchSocialPulse({
        fid: username ? undefined : fid,
        username,
        address:
          !username && !fid && !detached ? walletAddress || undefined : undefined,
      });

      if (!next.linked && !username && fid) {
        next = await fetchSocialPulse({ fid });
      }

      setPulse(next);
      setCastIndex(0);
      if (next.user) {
        setDetached(false);
        writeFarcasterLink({
          username: next.user.username,
          fid: next.user.fid,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (detached) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on identity change
  }, [walletAddress, farcasterUsername]);

  useEffect(() => {
    if (!pulse?.casts?.length || reduceMotion || compact) return;
    const t = window.setInterval(() => {
      setCastIndex((i) => (i + 1) % pulse.casts.length);
    }, 5200);
    return () => window.clearInterval(t);
  }, [pulse?.casts, reduceMotion, compact]);

  const linkHandle = async () => {
    const username = normalizeFcUsername(handleInput);
    if (!username || busyLink) return;
    setBusyLink(true);
    try {
      setDetached(false);
      writeFarcasterLink({ username });
      onLinkedUsername?.(username);
      await load({ username });
    } finally {
      setBusyLink(false);
    }
  };

  const user = pulse?.user;
  const casts = pulse?.casts || [];
  const activeCast: SocialPulseCast | null = casts[castIndex] || casts[0] || null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-[#081018]/90 via-[#0a0a0c]/85 to-[#141008]/80 p-4 backdrop-blur-md shadow-[0_0_36px_rgba(34,211,238,0.12)]">
      <div className="pointer-events-none absolute inset-0 holo-sheen opacity-30" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-cyan-300/90">
            Farcaster pulse
          </p>
          <p className="mt-1 font-display text-xl font-extrabold italic text-white leading-tight">
            Social signal
          </p>
          <p className="mt-1 text-[11px] text-slate-400 leading-snug max-w-sm">
            Neynar score + your hottest casts — flex the culture, not the spam.
          </p>
        </div>
        {user && (
          <a
            href={`https://farcaster.xyz/${user.username}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-2.5 py-1.5 hover:border-cyan-300/40"
          >
            {user.pfpUrl ? (
              <img src={user.pfpUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20" />
            )}
            <div className="text-left min-w-0">
              <p className="font-mono text-[10px] text-cyan-200 truncate">@{user.username}</p>
              <p className="text-[9px] text-slate-500">fid {user.fid}</p>
            </div>
          </a>
        )}
      </div>

      {loading && (
        <p className="relative mt-4 font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Syncing signal…
        </p>
      )}

      {!loading && pulse && !pulse.configured && (
        <div className="relative mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-3">
          <p className="text-sm text-amber-100 font-display italic">Almost live</p>
          <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
            Add <span className="font-mono text-amber-200">NEYNAR_API_KEY</span> on the server to
            unlock score + cast heat. You can still link your handle below.
          </p>
        </div>
      )}

      {!loading && user && (
        <div className={`relative mt-4 grid gap-3 ${compact ? 'grid-cols-1' : 'sm:grid-cols-[140px_1fr]'}`}>
          {/* Score dial */}
          <div className="rounded-xl border border-amber-400/30 bg-black/45 p-3 text-center">
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-200/80">
              Neynar score
            </p>
            <motion.p
              key={user.scorePercent}
              initial={reduceMotion ? false : { scale: 1.2, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-1 font-display text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-cyan-300 value-slam"
            >
              {user.scorePercent}
            </motion.p>
            <p className="font-mono text-[10px] text-slate-500">/ 100</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-white to-cyan-400"
                initial={false}
                animate={{ width: `${user.scorePercent}%` }}
                transition={{ duration: 0.7 }}
              />
            </div>
            <p className="mt-2 font-display text-sm font-bold italic text-cyan-100">
              {user.tier.label}
            </p>
            <p className="text-[10px] text-slate-400">{user.tier.blurb}</p>
            <p className="mt-2 font-mono text-[9px] text-slate-500">
              {user.followerCount.toLocaleString()} followers
            </p>
          </div>

          {/* Hot casts */}
          <div className="rounded-xl border border-white/12 bg-black/40 p-3 min-h-[140px]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-rose-200/80 flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-300" />
                Most engaging
              </p>
              {casts.length > 1 && (
                <div className="flex gap-1">
                  {casts.map((c, i) => (
                    <button
                      key={c.hash}
                      type="button"
                      aria-label={`Cast ${i + 1}`}
                      onClick={() => setCastIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full cursor-pointer ${
                        i === castIndex ? 'bg-cyan-300' : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {activeCast ? (
                <motion.div
                  key={activeCast.hash}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-2"
                >
                  <p className="text-sm text-slate-100 leading-relaxed line-clamp-4 font-sans">
                    {activeCast.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-300" />
                      {activeCast.likes}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Repeat2 className="w-3 h-3 text-emerald-300" />
                      {activeCast.recasts}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 text-cyan-300" />
                      {activeCast.replies}
                    </span>
                    <span className="text-amber-200/80">heat {activeCast.heat}</span>
                    {activeCast.channel && (
                      <span className="text-slate-500">/{activeCast.channel}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={activeCast.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[10px] font-mono uppercase tracking-wider text-slate-200 hover:border-cyan-300/40"
                    >
                      Open cast
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        openFarcasterCompose(
                          `This one still hits.\n\nBuilding Culture · Human Passport\n${FARCASTER_PASSPORT}`,
                          FARCASTER_PASSPORT
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 text-[10px] font-mono uppercase tracking-wider text-amber-100 cursor-pointer hover:bg-amber-500/20"
                    >
                      <Sparkles className="w-3 h-3" />
                      Remix energy
                    </button>
                  </div>
                </motion.div>
              ) : (
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  No casts with heat yet — drop a truth on Farcaster and come back.
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!loading && (!user || pulse?.error === 'user_not_found') && (
        <div className="relative mt-4 space-y-3">
          <p className="text-[12px] text-slate-300 leading-relaxed">
            Link your Farcaster handle to pull your Neynar score and flex your hottest posts on the
            passport.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                @
              </span>
              <input
                type="text"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void linkHandle();
                }}
                placeholder="yourhandle"
                className="w-full rounded-xl border border-white/15 bg-black/50 pl-7 pr-3 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/50"
              />
            </div>
            <button
              type="button"
              disabled={busyLink || !handleInput.trim()}
              onClick={() => void linkHandle()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              Link & load
            </button>
          </div>
        </div>
      )}

      {user && (
        <div className="relative mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              clearFarcasterLink();
              setDetached(true);
              setPulse({
                configured: pulse?.configured ?? true,
                linked: false,
                user: null,
                casts: [],
                source: null,
              });
              setHandleInput('');
              onLinkedUsername?.('');
            }}
            className="text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
          >
            Unlink
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 hover:text-cyan-300 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
