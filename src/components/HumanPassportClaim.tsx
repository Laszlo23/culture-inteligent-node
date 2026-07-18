/**
 * Soft Human Passport claim — replaces Culture Club oath gate.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, Loader2, Share2 } from 'lucide-react';
import { Keypair } from '@solana/web3.js';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import { PASSPORT_PRINCIPLES } from '../lib/human-economy';
import {
  buildMemberInvitePost,
  claimHumanPassport,
  hasSpreadLove,
  markSpreadLove,
} from '../lib/human-passport';
import {
  buildCommunityInviteCast,
  COMMUNITY_LINKS,
  inviteWelcomeLine,
} from '../lib/community-invite';
import { copyTextFallback } from '../lib/culture-broadcast';
import { sendAttentionProofMemo } from '../lib/poa-chain';
import { track } from '../lib/attention-metrics';
import { inviteCodeFromWallet, reportGrowthEvent } from '../lib/growth-loop';
import { CinematicBackdrop } from './fx';
import { useSound } from '../lib/sound/SoundContext';
import FarcasterCastButton from './FarcasterCastButton';

type Props = {
  walletAddress: string;
  walletType: 'extension' | 'local';
  displayName?: string;
  inviteCode?: string | null;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onClaimed: (opts: { invited: boolean }) => void;
  onStartProof: () => void;
};

export default function HumanPassportClaim({
  walletAddress,
  walletType,
  displayName,
  inviteCode,
  addLog,
  onClaimed,
  onStartProof,
}: Props) {
  const { play } = useSound();
  const [phase, setPhase] = useState<'claim' | 'ready'>('claim');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invited, setInvited] = useState(() => hasSpreadLove(walletAddress));

  const short = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;
  const welcome = inviteWelcomeLine(inviteCode);
  const castPack = buildCommunityInviteCast({ displayName, walletAddress });

  const claim = async () => {
    setBusy(true);
    setError(null);
    try {
      let localKeypair: Keypair | null = null;
      if (walletType === 'local') {
        const raw = localStorage.getItem('solana_local_secret');
        if (raw) {
          localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
        }
      }
      const record = await claimHumanPassport({
        walletAddress,
        walletType,
        localKeypair,
      });
      try {
        await sendAttentionProofMemo({
          kind: 'club_oath',
          parts: { sig: record.signature.slice(0, 16), v: record.version },
        });
      } catch {
        // ownership memo optional
      }
      play('success');
      addLog('PASSPORT: Human Passport claimed. You own your digital reputation.', 'success');
      setPhase('ready');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not claim passport.';
      setError(msg);
      addLog(`PASSPORT: ${msg}`, 'warn');
    } finally {
      setBusy(false);
    }
  };

  const invite = async () => {
    try {
      const post = buildMemberInvitePost({ displayName, walletAddress });
      await copyTextFallback(post);
      const first = !hasSpreadLove(walletAddress);
      markSpreadLove(walletAddress);
      setInvited(true);
      track('invite_spread', { how: 'clipboard', first });
      void reportGrowthEvent({
        type: 'spread',
        actorCode: inviteCodeFromWallet(walletAddress),
        nonce: `spread:passport-clip:${walletAddress}:${first ? '1' : Date.now()}`,
      });
      play('soft');
      addLog(
        first
          ? 'PASSPORT: Invite copied — share with someone who should build theirs.'
          : 'PASSPORT: Invite copied again.',
        'success'
      );
    } catch {
      addLog('PASSPORT: Could not copy invite.', 'warn');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-[#050608]">
      <CinematicBackdrop variant="ritual" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-[#09090c]/90 backdrop-blur-md p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.75)]"
      >
        <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-cyan-400">
          {BRAND.passport}
        </p>

        {welcome && phase === 'claim' && (
          <p className="mt-3 rounded-xl border border-amber-400/25 bg-amber-950/30 px-3 py-2.5 text-[12px] text-amber-100/90 leading-relaxed">
            {welcome}
          </p>
        )}

        {phase === 'claim' ? (
          <>
            <h1 className="mt-3 font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
              Claim your Human Passport
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {SLOGANS.equation}. Three principles — then you own a portable reputation record.
            </p>
            <ul className="mt-6 space-y-3">
              {PASSPORT_PRINCIPLES.map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-white">{p.title}</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">{p.line}</p>
                </li>
              ))}
            </ul>
            {error && (
              <p className="mt-4 text-[12px] text-red-300/90">{error}</p>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void claim()}
              className="mt-6 w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-2"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Build my passport · {short}
            </button>
            <p className="mt-3 text-[10px] text-slate-600 text-center font-mono">
              Secure ID · ownership record · practice network
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-3 font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
              Passport ready
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              {SLOGANS.ownership} Next: prove attention — then invite one builder so the community grows.
            </p>
            <button
              type="button"
              onClick={() => {
                onClaimed({ invited });
                onStartProof();
              }}
              className="mt-6 w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-2"
            >
              Start Proof of Attention
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <FarcasterCastButton
                text={castPack.text}
                embedUrl={castPack.embedUrl}
                label="Cast invite"
                variant="primary"
                onCast={() => {
                  const first = !hasSpreadLove(walletAddress);
                  markSpreadLove(walletAddress);
                  setInvited(true);
                  track('invite_spread', { how: 'farcaster', first });
                  void reportGrowthEvent({
                    type: 'spread',
                    actorCode: inviteCodeFromWallet(walletAddress),
                    nonce: `spread:passport-fc:${walletAddress}:${first ? '1' : Date.now()}`,
                  });
                  addLog('PASSPORT: Invite cast opened — rain on Farcaster.', 'success');
                }}
                className="w-full"
              />
              <button
                type="button"
                onClick={() => void invite()}
                className="w-full py-3 rounded-xl border border-white/12 text-slate-300 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5" />
                {invited ? 'Copy again' : 'Copy invite'}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-slate-500 text-center leading-relaxed">
              Community homes:{' '}
              <a
                href={COMMUNITY_LINKS.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400/90 hover:text-sky-300 underline-offset-2 hover:underline"
              >
                Telegram
              </a>
              {' · '}
              <a
                href={COMMUNITY_LINKS.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300/90 hover:text-indigo-200 underline-offset-2 hover:underline"
              >
                Discord
              </a>
            </p>
            <button
              type="button"
              onClick={() => onClaimed({ invited })}
              className="mt-2 w-full py-2 text-[10px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-wider cursor-pointer"
            >
              Enter workspace
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
