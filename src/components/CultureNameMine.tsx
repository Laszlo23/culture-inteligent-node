/**
 * Mine a Culture Name — laszlo.culture for your wallet.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Loader2, Pickaxe, Share2, Sparkles } from 'lucide-react';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import {
  claimCultureName,
  checkCultureName,
  getCultureNameByWallet,
} from '../lib/api';
import { track } from '../lib/attention-metrics';
import { copyTextFallback, shareCultureText } from '../lib/culture-broadcast';
import { rewardAction } from '../lib/reward-bus';
import {
  formatCultureName,
  normalizeCultureLabel,
  readLocalCultureName,
  suggestCultureLabels,
  validateCultureLabel,
  writeLocalCultureName,
} from '../lib/culture-names';
import {
  CULTURE_CARD_STYLES,
  buildCultureNameCardPost,
  buildCultureNameCast,
  cultureNameCardImageUrl,
  cultureNameShareLandingUrl,
  pickCultureCardStyle,
  type CultureCardStyle,
} from '../lib/culture-name-card';
import FarcasterCastButton from './FarcasterCastButton';

type Props = {
  walletAddress: string | null;
  seedUsername?: string | null;
  /** Prefill from ?name= */
  initialName?: string | null;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onClaimed?: (full: string) => void;
  onOpenMap?: () => void;
};

export default function CultureNameMine({
  walletAddress,
  seedUsername,
  initialName,
  addLog,
  onClaimed,
  onOpenMap,
}: Props) {
  const [draft, setDraft] = useState(() =>
    normalizeCultureLabel(initialName || seedUsername || '')
  );
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>(
    'idle'
  );
  const [statusMsg, setStatusMsg] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [mined, setMined] = useState<string | null>(() => {
    if (!walletAddress) return null;
    const local = readLocalCultureName(walletAddress);
    return local ? formatCultureName(local.name) : null;
  });
  const [sharing, setSharing] = useState(false);
  const [cardStyle, setCardStyle] = useState<CultureCardStyle>(() =>
    pickCultureCardStyle(initialName || seedUsername || 'mine')
  );

  const suggestions = walletAddress
    ? suggestCultureLabels(seedUsername || 'builder', walletAddress)
    : [];

  const minedLabel = mined ? normalizeCultureLabel(mined) : '';
  const cardImageUrl = useMemo(() => {
    if (!minedLabel) return null;
    return cultureNameCardImageUrl(minedLabel, cardStyle);
  }, [minedLabel, cardStyle]);
  const cardLandingUrl = useMemo(() => {
    if (!minedLabel) return null;
    return cultureNameShareLandingUrl(minedLabel, cardStyle);
  }, [minedLabel, cardStyle]);

  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    void getCultureNameByWallet(walletAddress)
      .then((r) => {
        if (cancelled || !r.claimed || !r.full) return;
        setMined(r.full);
        writeLocalCultureName({
          name: r.name!,
          walletAddress: r.walletAddress,
          claimedAt: r.claimedAt || new Date().toISOString(),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  useEffect(() => {
    if (mined) return;
    const label = normalizeCultureLabel(draft);
    if (!label) {
      setStatus('idle');
      setStatusMsg('');
      return;
    }
    const v = validateCultureLabel(label);
    if (v.ok === false) {
      setStatus('invalid');
      setStatusMsg(v.error);
      return;
    }
    setStatus('checking');
    setStatusMsg('Checking the ledger…');
    const t = window.setTimeout(() => {
      void checkCultureName(label)
        .then((r) => {
          if (normalizeCultureLabel(draft) !== label) return;
          if (!r.ok) {
            setStatus('invalid');
            setStatusMsg(r.error || 'Invalid');
            return;
          }
          if (r.available) {
            setStatus('available');
            setStatusMsg(`${r.full} is open — mine it.`);
          } else {
            setStatus('taken');
            setStatusMsg(`${r.full} is already mined.`);
          }
        })
        .catch(() => {
          setStatus('idle');
          setStatusMsg('Could not check — try again.');
        });
    }, 320);
    return () => window.clearTimeout(t);
  }, [draft, mined]);

  const runClaim = async () => {
    if (!walletAddress) {
      addLog('Connect a wallet to mine a Culture Name.', 'warn');
      return;
    }
    const v = validateCultureLabel(draft);
    if (v.ok === false) {
      addLog(v.error, 'warn');
      return;
    }
    setClaiming(true);
    track('culture_name_claim_start', { name: v.label });
    try {
      const result = await claimCultureName(v.label);
      setMined(result.full);
      writeLocalCultureName({
        name: result.name,
        walletAddress: result.walletAddress,
        claimedAt: result.claimedAt,
      });
      track('culture_name_claim', { name: result.name });
      rewardAction('culture_name', { label: result.full });
      addLog(`MINED: ${result.full} is yours.`, 'success');
      onClaimed?.(result.full);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      addLog(msg, 'warn');
    } finally {
      setClaiming(false);
    }
  };

  const runShare = async () => {
    if (!mined || !cardImageUrl || !cardLandingUrl) return;
    const label = normalizeCultureLabel(mined);
    setSharing(true);
    const post = buildCultureNameCardPost(label, cardStyle, {
      imageUrl: cardImageUrl,
      landingUrl: cardLandingUrl,
    });
    try {
      const how = await shareCultureText(
        post,
        `${BRAND.product} · ${mined}`,
        cardLandingUrl,
        { imageUrl: cardImageUrl, fileName: `${mined}.jpg` }
      );
      track('culture_name_share', { name: label, how, style: cardStyle });
      addLog(
        how === 'share'
          ? `Shared ${mined} card.`
          : `Copied ${mined} pack + card image link.`,
        'success'
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      try {
        await copyTextFallback(post);
        addLog(`Copied ${mined} pack.`, 'info');
      } catch {
        addLog('Share failed — try Cast or Copy.', 'warn');
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <header className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-[#081418]/95 via-[#08060a] to-amber-950/30 p-5 md:p-6">
        <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-cyan-300/90">
          Identity · Culture Names
        </p>
        <h2 className="mt-2 font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
          {SLOGANS.cultureName}
        </h2>
        <p className="mt-2 text-sm text-slate-300/90 leading-relaxed">
          {SLOGANS.cultureNameSub}
        </p>
      </header>

      {mined ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-400/35 bg-[#0a0a0e]/95 p-5 md:p-6 space-y-4"
        >
          <div className="text-center space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300">
              Mined · yours · share the card
            </p>
            <p className="font-display text-2xl md:text-3xl font-black italic text-white">
              {mined}
            </p>
            <p className="text-sm text-slate-400">
              Bound to{' '}
              {walletAddress
                ? `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`
                : 'your wallet'}
              . Pick a look — then share image + text.
            </p>
          </div>

          {cardImageUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.45)] aspect-[1200/630] bg-black">
              <img
                key={cardImageUrl}
                src={cardImageUrl}
                alt={`${mined} share card`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 justify-center">
            {CULTURE_CARD_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCardStyle(s.id)}
                className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                  cardStyle === s.id
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-100'
                    : 'border-white/12 text-slate-400 hover:border-white/30'
                }`}
                title={s.vibe}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-center text-[11px] text-slate-500">
            {CULTURE_CARD_STYLES.find((s) => s.id === cardStyle)?.vibe}
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              disabled={sharing}
              onClick={() => void runShare()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? 'Opening share…' : 'Share card + text'}
            </button>
            <FarcasterCastButton
              text={buildCultureNameCast(normalizeCultureLabel(mined), cardStyle).text}
              embedUrl={
                buildCultureNameCast(normalizeCultureLabel(mined), cardStyle).embedUrl
              }
              imageUrl={
                buildCultureNameCast(normalizeCultureLabel(mined), cardStyle).imageUrl
              }
              variant="primary"
              label="Cast card"
              onCast={() => {
                track('culture_name_share', {
                  name: normalizeCultureLabel(mined),
                  how: 'farcaster',
                  style: cardStyle,
                });
                addLog(`Casting ${mined} card…`, 'success');
              }}
              className="flex-1"
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => {
                if (!cardImageUrl) return;
                void copyTextFallback(
                  buildCultureNameCardPost(normalizeCultureLabel(mined), cardStyle, {
                    imageUrl: cardImageUrl,
                    landingUrl: cardLandingUrl || undefined,
                  })
                ).then(() => addLog('Card pack copied — image link included.', 'info'));
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy pack
            </button>
            <a
              href={cardImageUrl || '#'}
              download={`${mined}.jpg`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-400/30 text-cyan-100 font-mono text-[10px] font-black uppercase tracking-wider"
            >
              Open image
            </a>
          </div>
          {onOpenMap ? (
            <button
              type="button"
              onClick={onOpenMap}
              className="w-full text-[11px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Back to home
            </button>
          ) : null}
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0e]/95 p-5 md:p-6 space-y-4">
          <label className="block space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400/85">
              Choose a name
            </span>
            <div className="flex items-stretch gap-0 rounded-xl border border-white/15 bg-black/40 overflow-hidden focus-within:border-cyan-400/50">
              <input
                value={draft}
                onChange={(e) => setDraft(normalizeCultureLabel(e.target.value))}
                placeholder="laszlo"
                maxLength={16}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent px-4 py-3.5 text-white font-display text-xl italic font-bold outline-none placeholder:text-slate-600"
              />
              <span className="shrink-0 flex items-center px-3 font-mono text-sm text-cyan-300/90 border-l border-white/10 bg-cyan-500/5">
                .culture
              </span>
            </div>
          </label>

          <p
            className={`text-[12px] min-h-[1.25rem] ${
              status === 'available'
                ? 'text-emerald-300'
                : status === 'taken' || status === 'invalid'
                  ? 'text-rose-300'
                  : 'text-slate-500'
            }`}
          >
            {status === 'checking' ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {statusMsg}
              </span>
            ) : status === 'available' ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {statusMsg}
              </span>
            ) : (
              statusMsg || 'Letters, numbers, hyphen · 3–16 chars'
            )}
          </p>

          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDraft(s)}
                  className="px-2.5 py-1 rounded-lg border border-white/10 hover:border-cyan-400/40 text-[11px] font-mono text-slate-300 cursor-pointer"
                >
                  {formatCultureName(s)}
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            disabled={!walletAddress || status !== 'available' || claiming}
            onClick={() => void runClaim()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-45 disabled:cursor-not-allowed text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_28px_rgba(34,211,238,0.28)]"
          >
            {claiming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pickaxe className="w-4 h-4" />
            )}
            {!walletAddress
              ? 'Connect wallet to mine'
              : claiming
                ? 'Mining…'
                : `Mine ${formatCultureName(draft || 'name')}`}
          </button>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400/80" />
            First wallet to claim wins. One name per wallet.
          </p>
        </div>
      )}
    </div>
  );
}
