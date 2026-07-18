/**
 * Cinematic Prove → Bind → Mint ritual for ZKPassport soulbound reputation.
 * Keeps attention through motion + staged beats — not a static modal.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Link2, ShieldCheck, X, Sparkles, ExternalLink } from 'lucide-react';
import { CinematicBackdrop, GlowPulse, EnergyFlow } from './fx';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import {
  buildVerifyPayload,
  requestZkPassportUniqueness,
} from '../lib/zk-id/zkpassport';
import {
  ensureWalletApiSession,
  getWalletToken,
  zkBind,
  zkMintSoulbound,
  zkStatus,
  zkVerify,
} from '../lib/api';
import type { SoulboundReputation } from '../types';
import { Keypair } from '@solana/web3.js';

type Beat = 'prove' | 'bind' | 'mint' | 'done';

export type SoulboundRitualOverlayProps = {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
  walletType?: 'extension' | 'local';
  localKeypair?: Keypair | null;
  addLog?: (msg: string, level?: 'info' | 'success' | 'warn' | 'system') => void;
  onComplete?: (rep: SoulboundReputation) => void;
};

const BEATS: { id: Beat; label: string; icon: React.ReactNode }[] = [
  { id: 'prove', label: 'Prove', icon: <Fingerprint className="w-3.5 h-3.5" /> },
  { id: 'bind', label: 'Bind', icon: <Link2 className="w-3.5 h-3.5" /> },
  { id: 'mint', label: 'Mint', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { id: 'done', label: 'Sealed', icon: <Sparkles className="w-3.5 h-3.5" /> },
];

function beatIndex(b: Beat): number {
  return BEATS.findIndex((x) => x.id === b);
}

export default function SoulboundRitualOverlay({
  open,
  onClose,
  walletAddress,
  walletType = 'local',
  localKeypair = null,
  addLog,
  onComplete,
}: SoulboundRitualOverlayProps) {
  const [beat, setBeat] = useState<Beat>('prove');
  const [status, setStatus] = useState('Ready when you are.');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [nullifierHash, setNullifierHash] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [mintSignature, setMintSignature] = useState<string | null>(null);
  const [mintNote, setMintNote] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(true);
  const [energyPulse, setEnergyPulse] = useState(12);

  const ensureSession = useCallback(async () => {
    if (!getWalletToken()) {
      await ensureWalletApiSession({
        walletAddress,
        walletType,
        localKeypair,
      });
    }
  }, [walletAddress, walletType, localKeypair]);

  useEffect(() => {
    if (!open) return;
    setBeat('prove');
    setError(null);
    setQrUrl(null);
    setNullifierHash(null);
    setMintAddress(null);
    setMintSignature(null);
    setMintNote(null);
    setStatus(`${SLOGANS.attention} First prove you're you.`);
    setEnergyPulse(12);
    void (async () => {
      try {
        await ensureSession();
        const s = await zkStatus();
        setDevMode(s.devMode);
        if (s.soulboundMinted && s.mintAddress) {
          setBeat('done');
          setNullifierHash(s.nullifierHash || null);
          setMintAddress(s.mintAddress);
          setMintSignature(s.mintSignature || null);
          setStatus('Soulbound · ZKPassport-bound · non-transferable');
          setEnergyPulse(100);
        } else if (s.bound && s.mintable) {
          setBeat('mint');
          setNullifierHash(s.nullifierHash || null);
          setStatus('Identity bound. Mint your soulbound reputation.');
          setEnergyPulse(66);
        } else if (s.pendingVerify && s.nullifierHash) {
          setBeat('bind');
          setNullifierHash(s.nullifierHash);
          setStatus('Proof verified. Bind to this wallet.');
          setEnergyPulse(40);
        }
      } catch {
        // fresh ritual
      }
    })();
  }, [open, ensureSession]);

  const runProve = async () => {
    setBusy(true);
    setError(null);
    setStatus('Opening ZKPassport uniqueness…');
    try {
      await ensureSession();
      const result = await requestZkPassportUniqueness({
        walletAddress,
        forceMock: devMode,
        onUrl: (url) => setQrUrl(url),
        onStatus: (line) => setStatus(line),
      });
      if (!result.verified || !result.uniqueIdentifier) {
        throw new Error('Uniqueness proof failed');
      }
      const payload = buildVerifyPayload(result);
      const verified = await zkVerify(payload);
      setNullifierHash(verified.nullifierHash);
      setEnergyPulse(40);
      setBeat('bind');
      setStatus(
        verified.mode === 'mock'
          ? 'Dev mock nullifier locked. Bind to this wallet.'
          : 'ZKPassport verified. Bind nullifier to this wallet.'
      );
      addLog?.('ZK: Uniqueness verified — nullifier scoped to Culture Node.', 'success');
    } catch (err: any) {
      setError(err?.message || 'Prove failed');
      addLog?.(`ZK PROVE FAILED: ${err?.message || err}`, 'warn');
    } finally {
      setBusy(false);
    }
  };

  const runBind = async () => {
    setBusy(true);
    setError(null);
    setStatus('Binding nullifier ↔ wallet…');
    try {
      await ensureSession();
      const bound = await zkBind(nullifierHash || undefined);
      setNullifierHash(bound.nullifierHash);
      setEnergyPulse(66);
      if (bound.soulboundMinted) {
        setBeat('done');
        setStatus('Already sealed on this identity.');
      } else {
        setBeat('mint');
        setStatus('Bound. Mint soulbound reputation — non-transferable.');
      }
      addLog?.('ZK: Nullifier bound to wallet. Ready to mint SBT.', 'success');
    } catch (err: any) {
      setError(err?.message || 'Bind failed');
      addLog?.(`ZK BIND FAILED: ${err?.message || err}`, 'warn');
    } finally {
      setBusy(false);
    }
  };

  const runMint = async () => {
    setBusy(true);
    setError(null);
    setStatus('Sealing soulbound badge…');
    try {
      await ensureSession();
      const minted = await zkMintSoulbound();
      setMintAddress(minted.mintAddress);
      setMintSignature(minted.mintSignature || null);
      setMintNote(minted.note || null);
      setEnergyPulse(100);
      setBeat('done');
      setStatus(
        minted.nonTransferable
          ? 'Soulbound · ZKPassport-bound · Token-2022 NonTransferable'
          : minted.note || 'Soulbound reputation sealed (ZK-gated).'
      );
      const rep: SoulboundReputation = {
        zkProvider: 'zkpassport',
        nullifierHash: nullifierHash || '',
        verifiedAt: new Date().toISOString(),
        boundWallet: walletAddress,
        mintAddress: minted.mintAddress,
        mintSignature: minted.mintSignature,
        badgePda: minted.badgePda,
        soulboundMinted: true,
      };
      onComplete?.(rep);
      addLog?.(
        `SOULBOUND MINTED: ${minted.mintAddress.slice(0, 20)}… (${minted.mode})`,
        'success'
      );
    } catch (err: any) {
      setError(err?.message || 'Mint failed');
      addLog?.(`SOULBOUND MINT FAILED: ${err?.message || err}`, 'warn');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const idx = beatIndex(beat);
  const shortWallet = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-[#030406]/92 backdrop-blur-md" />
        <CinematicBackdrop variant="ritual" className="absolute inset-0 opacity-80" />
        <GlowPulse energy={energyPulse} color="cyan" className="absolute -right-20 top-10 w-72 h-72" />
        <GlowPulse energy={energyPulse} color="amber" className="absolute -left-16 bottom-8 w-64 h-64" />

        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 180 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#08090e]/88 shadow-[0_30px_80px_rgba(0,0,0,0.75)]"
        >
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-400" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-slate-500 hover:text-slate-200 cursor-pointer z-20"
            aria-label="Close ritual"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative p-6 md:p-8">
            <p className="font-mono text-[10px] font-black tracking-[0.28em] uppercase text-cyan-400/90">
              {SLOGANS.attention}
            </p>
            <h2 className="font-display mt-2 text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
              Soulbound reputation
            </h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Only the person on the ID — via ZKPassport — can seal this badge. No name stored.
              Non-transferable.
            </p>

            {/* Beat rail */}
            <div className="mt-6 flex items-center gap-1">
              {BEATS.map((b, i) => {
                const active = i === idx;
                const done = i < idx;
                return (
                  <React.Fragment key={b.id}>
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider ${
                        active
                          ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                          : done
                            ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-white/8 bg-white/[0.03] text-slate-500'
                      }`}
                    >
                      {b.icon}
                      {b.label}
                    </div>
                    {i < BEATS.length - 1 && (
                      <div
                        className={`flex-1 h-px ${done ? 'bg-emerald-400/40' : 'bg-white/10'}`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="mt-4">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                Attention lock
              </span>
              <EnergyFlow energy={energyPulse} className="mt-1.5 h-2" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={beat}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="mt-6 min-h-[140px]"
              >
                {beat === 'prove' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed">{status}</p>
                    {devMode && (
                      <p className="text-[11px] font-mono text-amber-400/90 uppercase tracking-wider">
                        Dev mode — mock uniqueness (not a real passport scan)
                      </p>
                    )}
                    {qrUrl && (
                      <a
                        href={qrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 font-mono"
                      >
                        Open ZKPassport link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void runProve()}
                      className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-60 shadow-[0_0_28px_rgba(34,211,238,0.3)]"
                    >
                      {busy ? 'Proving…' : 'Prove with ZKPassport'}
                    </button>
                  </div>
                )}

                {beat === 'bind' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed">{status}</p>
                    <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-[11px] text-slate-400 space-y-1">
                      <p>
                        Wallet{' '}
                        <span className="text-cyan-300">{shortWallet}</span>
                      </p>
                      {nullifierHash && (
                        <p>
                          Nullifier{' '}
                          <span className="text-amber-200/90">
                            {nullifierHash.slice(0, 12)}…{nullifierHash.slice(-8)}
                          </span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void runBind()}
                      className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-60"
                    >
                      {busy ? 'Binding…' : 'Bind identity to wallet'}
                    </button>
                  </div>
                )}

                {beat === 'mint' && (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed">{status}</p>
                    <motion.div
                      className="relative h-24 rounded-2xl border border-cyan-400/25 overflow-hidden"
                      animate={{
                        boxShadow: [
                          '0 0 0 rgba(34,211,238,0)',
                          '0 0 40px rgba(34,211,238,0.25)',
                          '0 0 0 rgba(34,211,238,0)',
                        ],
                      }}
                      transition={{ duration: 2.4, repeat: Infinity }}
                    >
                      <CinematicBackdrop variant="duality" />
                      <div className="relative z-10 flex h-full items-center justify-center">
                        <p className="font-display text-lg italic font-bold text-white">
                          {BRAND.proof}
                        </p>
                      </div>
                    </motion.div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void runMint()}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-60 shadow-[0_0_28px_rgba(16,185,129,0.35)]"
                    >
                      {busy ? 'Minting…' : 'Mint soulbound badge'}
                    </button>
                  </div>
                )}

                {beat === 'done' && (
                  <div className="space-y-4 text-center">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mx-auto w-16 h-16 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 flex items-center justify-center"
                    >
                      <ShieldCheck className="w-8 h-8 text-emerald-300" />
                    </motion.div>
                    <p className="text-sm text-emerald-200/90 font-medium">{status}</p>
                    {mintAddress && (
                      <p className="font-mono text-[10px] text-slate-400 break-all px-2">
                        {mintAddress}
                      </p>
                    )}
                    {mintNote && (
                      <p className="text-[11px] text-slate-500 leading-relaxed">{mintNote}</p>
                    )}
                    {mintSignature && !mintSignature.startsWith('local:') && (
                      <a
                        href={`https://solscan.io/tx/${mintSignature}?cluster=devnet`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-300 font-mono"
                      >
                        View on Solscan <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-3 rounded-xl border border-white/15 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer hover:border-cyan-400/40"
                    >
                      Return to facility
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {error && (
              <p className="mt-4 text-xs text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <p className="mt-5 text-[10px] font-mono text-slate-600 uppercase tracking-wider text-center">
              Attested memo ≠ soulbound NFT · Void stays anonymous
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
