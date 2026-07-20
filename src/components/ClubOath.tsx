/**
 * Culture Club oath — hook → sign → spread love & knowledge.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Feather, ShieldAlert, Loader2, Check, Heart, Copy, Sparkles, ArrowRight } from 'lucide-react';
import { Keypair } from '@solana/web3.js';
import { CinematicBackdrop } from './fx';
import {
  CLUB_RULES,
  buildMemberInvitePost,
  hasSpreadLove,
  markSpreadLove,
  signClubOath,
} from '../lib/club-oath';
import { resolveEconomyWallet } from '../lib/economy-wallet';
import { sendAttentionProofMemo } from '../lib/poa-chain';
import { track } from '../lib/attention-metrics';
import { withRotatingOg } from '../lib/og-share';
import type { SessionWalletType } from '../lib/wallet/types';

type Props = {
  walletAddress: string;
  walletType: SessionWalletType;
  displayName?: string;
  /** Called when member enters the floor; `spread` if they copied the invite. */
  onSigned: (result: { spread: boolean }) => void;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
};

type Phase = 'rules' | 'welcome';

export default function ClubOath({
  walletAddress,
  walletType,
  displayName,
  onSigned,
  addLog,
}: Props) {
  const [phase, setPhase] = useState<Phase>('rules');
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [spread, setSpread] = useState(() => hasSpreadLove(walletAddress));

  React.useEffect(() => {
    if (phase !== 'rules' || revealed >= CLUB_RULES.length) return;
    const t = window.setTimeout(() => setRevealed((n) => n + 1), revealed === 0 ? 400 : 280);
    return () => window.clearTimeout(t);
  }, [revealed, phase]);

  const invitePost = buildMemberInvitePost({ displayName, walletAddress });

  const handleSign = async () => {
    setError('');
    setSigning(true);
    try {
      const ctx = resolveEconomyWallet();
      let localKeypair: Keypair | null = ctx?.localKeypair ?? null;
      if (walletType === 'local' && !localKeypair) {
        const raw = localStorage.getItem('solana_local_secret');
        if (raw) {
          localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
        }
      }

      const record = await signClubOath({
        walletAddress,
        walletType,
        localKeypair,
      });

      addLog(
        record.demoUnsigned
          ? 'CULTURE CLUB: Oath marked (demo sign). Sealing on Devnet…'
          : `CULTURE CLUB: Oath signed · ${record.signature.slice(0, 8)}… — sealing on Devnet…`,
        'success'
      );

      // Mandatory PoA memo — membership commitment lands on-chain
      const oathMemo = await sendAttentionProofMemo({
        kind: 'club_oath',
        parts: { sig: record.signature.slice(0, 16), v: record.version },
      });
      if ('signature' in oathMemo) {
        addLog(`Club oath on Devnet — ${oathMemo.solscan}`, 'success');
      } else {
        addLog(
          `Oath saved locally — on-chain seal pending (${oathMemo.reason}). You can still enter.`,
          'warn'
        );
      }

      setPhase('welcome');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signature rejected.';
      setError(msg);
      addLog(`CULTURE CLUB: Sign failed — ${msg}`, 'warn');
    } finally {
      setSigning(false);
    }
  };

  const copyInvite = async () => {
    try {
      const post = withRotatingOg({ text: invitePost, appendImageLink: true }).text;
      await navigator.clipboard.writeText(post);
      const first = !hasSpreadLove(walletAddress);
      markSpreadLove(walletAddress);
      setSpread(true);
      setCopied(true);
      track('spread_copy', { channel: 'oath', first });
      addLog('Invite copied — spreading love & knowledge.', 'success');
      if (first) {
        const spreadMemo = await sendAttentionProofMemo({
          kind: 'spread',
          parts: { channel: 'oath' },
        });
        if ('signature' in spreadMemo) {
          addLog(`Spread sealed on Devnet — ${spreadMemo.solscan}`, 'success');
        }
      }
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setError('Could not copy — select the text and copy manually.');
    }
  };

  const enterFloor = () => {
    onSigned({ spread });
  };

  const short = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;
  const allIn = revealed >= CLUB_RULES.length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#050608] overflow-y-auto">
      <CinematicBackdrop variant="hero" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 180 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="rounded-3xl border border-white/10 bg-[#09090c]/88 backdrop-blur-md shadow-[0_30px_80px_rgba(0,0,0,0.85)] overflow-hidden">
          <div className="h-[2px] bg-gradient-to-r from-amber-500/80 via-rose-400/70 to-cyan-400" />

          <AnimatePresence mode="wait">
            {phase === 'rules' ? (
              <motion.div
                key="rules"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -12 }}
                className="p-6 md:p-8"
              >
                <p className="font-mono text-[10px] font-black tracking-[0.32em] uppercase text-amber-400/90 text-center">
                  First night · Proof of Attention membership
                </p>
                <h1 className="font-display mt-3 text-center text-3xl sm:text-4xl font-extrabold italic tracking-tight text-white leading-none">
                  CULTURE CLUB
                </h1>
                <p className="mt-3 text-center text-sm text-slate-400 leading-relaxed">
                  {displayName ? `${displayName} — ` : ''}
                  we&apos;re here for attention. Get hooked on love and knowledge. Rules are short.
                  Sign to enter.
                </p>

                <ol className="mt-7 space-y-3.5">
                  {CLUB_RULES.map((rule, i) => {
                    const show = i < revealed;
                    const highlight = rule.n === 5 || rule.n === 6;
                    return (
                      <motion.li
                        key={rule.n}
                        initial={false}
                        animate={show ? { opacity: 1, x: 0 } : { opacity: 0.15, x: -8 }}
                        transition={{ duration: 0.35 }}
                        className="flex gap-3"
                      >
                        <span
                          className={`font-mono text-sm font-black tabular-nums shrink-0 w-6 pt-0.5 ${
                            highlight ? 'text-rose-400' : 'text-cyan-400/80'
                          }`}
                        >
                          {rule.n}.
                        </span>
                        <div>
                          <p
                            className={`text-[13px] sm:text-sm font-semibold leading-snug ${
                              highlight ? 'text-rose-100' : 'text-slate-100'
                            }`}
                          >
                            {rule.line}
                          </p>
                          {show && (
                            <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
                              {rule.sub}
                            </p>
                          )}
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-5 p-3 rounded-xl bg-red-950/25 border border-red-500/30 text-red-300 text-[11px] flex gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-7 space-y-3">
                  <button
                    type="button"
                    disabled={!allIn || signing}
                    onClick={() => void handleSign()}
                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black font-mono text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_32px_rgba(245,158,11,0.28)]"
                  >
                    {signing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Awaiting signature…
                      </>
                    ) : (
                      <>
                        <Feather className="w-4 h-4" />
                        Sign the oath · {short}
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                    {walletType === 'extension'
                      ? 'Phantom will ask you to sign a message — no tx, no fee'
                      : 'Local Devnet key signs in-browser — nothing leaves this machine'}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 md:p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                  className="mx-auto w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-400/40 flex items-center justify-center text-rose-300 mb-4"
                >
                  <Heart className="w-7 h-7 fill-rose-400/40" />
                </motion.div>

                <p className="font-mono text-[10px] font-black tracking-[0.32em] uppercase text-rose-400/90">
                  You&apos;re in · attention membership
                </p>
                <h2 className="font-display mt-2 text-3xl font-extrabold italic text-white tracking-tight">
                  Now pass it on
                </h2>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
                  We&apos;re here for attention. Their failure curve is optional. Copy your invite —
                  the next soul needs the hook too. Then First Spark: prove it.
                </p>

                <div className="mt-6 text-left rounded-2xl border border-white/10 bg-black/40 p-4">
                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap font-sans leading-relaxed max-h-36 overflow-y-auto">
                    {invitePost}
                  </pre>
                </div>

                {error && (
                  <p className="mt-3 text-[11px] text-red-300 flex items-center justify-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {error}
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => void copyInvite()}
                    className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-mono text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_28px_rgba(244,63,94,0.3)]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied — go paste it
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy invite · spread love
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={enterFloor}
                    className="w-full py-3 rounded-xl border border-cyan-400/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 font-mono text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {spread ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Enter · Ignite First Spark
                      </>
                    ) : (
                      <>
                        Enter · I&apos;ll spread later
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  {!spread && (
                    <p className="text-[10px] text-slate-500 font-mono">
                      Tip: copy first — a small welcome boost when you pass the invite
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
