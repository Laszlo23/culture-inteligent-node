/**
 * Growth invite cards — share image + text to grow the base.
 */

import React, { useMemo, useState } from 'react';
import { Copy, Share2, UserPlus } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import { track } from '../lib/attention-metrics';
import { copyTextFallback, shareCultureText } from '../lib/culture-broadcast';
import { rewardAction } from '../lib/reward-bus';
import { shareDisplayName } from '../lib/display-identity';
import {
  INVITE_CARD_STYLES,
  buildInviteCardPost,
  inviteCardImageUrl,
  inviteShareLandingUrl,
  type InviteCardStyle,
} from '../lib/invite-card';
import FarcasterCastButton from './FarcasterCastButton';

type Props = {
  username?: string | null;
  walletAddress: string;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onOpenMap?: () => void;
};

export default function InviteSharePanel({
  username,
  walletAddress,
  addLog,
  onOpenMap,
}: Props) {
  const [style, setStyle] = useState<InviteCardStyle>('pass');
  const [sharing, setSharing] = useState(false);
  const who = shareDisplayName({ username, walletAddress });
  const code = walletAddress.slice(0, 6);

  const imageUrl = useMemo(
    () => inviteCardImageUrl({ name: who, code, style }),
    [who, code, style]
  );
  const landingUrl = useMemo(
    () => inviteShareLandingUrl({ code, style }),
    [code, style]
  );

  const runShare = async () => {
    setSharing(true);
    const post = buildInviteCardPost({
      username,
      walletAddress,
      style,
      imageUrl,
      landingUrl,
    });
    try {
      const how = await shareCultureText(
        post,
        `${BRAND.product} · invite from ${who}`,
        landingUrl,
        { imageUrl, fileName: `invite-${who}.jpg` }
      );
      track('invite_spread', { how, style });
      rewardAction('invite');
      addLog(
        how === 'share' ? 'Invite card shared.' : 'Invite pack copied — image link included.',
        'success'
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      try {
        await copyTextFallback(post);
        rewardAction('invite');
        addLog('Invite pack copied.', 'info');
      } catch {
        addLog('Share failed — try Cast.', 'warn');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <header className="rounded-2xl border border-rose-400/30 bg-gradient-to-br from-[#14080c]/95 via-[#08060a] to-cyan-950/30 p-5 md:p-6">
        <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-rose-300/90">
          Growth · Invite cards
        </p>
        <h2 className="mt-2 font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
          Pull friends in with a card
        </h2>
        <p className="mt-2 text-sm text-slate-300/90 leading-relaxed">
          Fun image + your name + invite link. They land attributed to you.
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-[#0a0a0e]/95 p-5 space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300/90">
          From {who}
        </p>
        <div className="relative overflow-hidden rounded-xl border border-white/12 aspect-[1200/630] bg-black">
          <img
            key={imageUrl}
            src={imageUrl}
            alt={`Invite from ${who}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {INVITE_CARD_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                style === s.id
                  ? 'border-rose-400/60 bg-rose-500/20 text-rose-100'
                  : 'border-white/12 text-slate-400 hover:border-white/30'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">
          {INVITE_CARD_STYLES.find((s) => s.id === style)?.vibe}
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={sharing}
            onClick={() => void runShare()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            {sharing ? 'Opening…' : 'Share invite card'}
          </button>
          <FarcasterCastButton
            text={[
              `${who} invited you to the Human Economy.`,
              '',
              SLOGANS.hero,
              '',
              'Join →',
              '#HumanEconomy',
            ].join('\n')}
            embedUrl={landingUrl}
            imageUrl={imageUrl}
            variant="primary"
            label="Cast invite"
            onCast={() => {
              track('invite_spread', { how: 'farcaster', style });
              addLog('Invite cast opening…', 'success');
            }}
            className="flex-1"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            void copyTextFallback(
              buildInviteCardPost({
                username,
                walletAddress,
                style,
                imageUrl,
                landingUrl,
              })
            ).then(() => addLog('Invite pack copied.', 'info'))
          }
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy pack
        </button>
        {onOpenMap ? (
          <button
            type="button"
            onClick={onOpenMap}
            className="w-full text-[11px] font-mono uppercase tracking-wider text-slate-500 cursor-pointer"
          >
            Back to home
          </button>
        ) : null}
      </div>
      <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <UserPlus className="w-3.5 h-3.5" />
        Connections count when they claim with your invite.
      </p>
    </div>
  );
}
