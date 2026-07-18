/**
 * Thin wallet gate — after skeptic landing. Auto-starts local wallet when requested.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet,
  ShieldAlert,
  Check,
  Key,
  Sparkles,
  RefreshCw,
  Info,
  Link2,
  Copy,
} from 'lucide-react';
import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { ensureWalletApiSession } from '../lib/api.ts';
import {
  connectPhantomWallet,
  getPhantomProvider,
  isLikelyMobile,
  phantomInstallUrl,
} from '../lib/phantom';
import { CinematicBackdrop } from './fx';

if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = Buffer;
}

export interface WalletSessionUser {
  username: string;
  email: string;
  walletAddress: string;
  walletType: 'extension' | 'local';
  isAdmin?: boolean;
}

export type AuthAutoStart = 'local' | 'phantom' | null;

interface AuthPortalProps {
  onLoginSuccess: (user: WalletSessionUser) => void;
  /** Auto-run wallet path from landing CTA */
  autoStart?: AuthAutoStart;
}

const SESSION_KEY = 'solana_current_user_session_v1';
const LOCAL_SECRET_KEY = 'solana_local_secret';
const WALLET_META_KEY = 'solana_wallet_session_v1';

function shortAddr(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function operatorNameFromWallet(address: string): string {
  return `Op_${address.slice(0, 4)}${address.slice(-4)}`;
}

export default function AuthPortal({ onLoginSuccess, autoStart = null }: AuthPortalProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savedLocalAddress, setSavedLocalAddress] = useState<string | null>(null);
  const [sessionDeferred, setSessionDeferred] = useState<{
    address: string;
    walletType: 'extension' | 'local';
    reason: string;
    user: WalletSessionUser;
  } | null>(null);
  const [retryingSession, setRetryingSession] = useState(false);
  const pendingLocalKeypair = useRef<Keypair | null>(null);
  const autoRan = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SECRET_KEY);
      if (!raw) return;
      const secretKey = Uint8Array.from(JSON.parse(raw));
      const keypair = Keypair.fromSecretKey(secretKey);
      setSavedLocalAddress(keypair.publicKey.toString());
    } catch {
      // ignore
    }
  }, []);

  const completeLogin = async (
    address: string,
    walletType: 'extension' | 'local',
    localKeypair?: Keypair | null
  ) => {
    const username = displayName.trim() || operatorNameFromWallet(address);
    const user: WalletSessionUser = {
      username,
      email: `${username.toLowerCase()}@wallet.local`,
      walletAddress: address,
      walletType,
      isAdmin: false,
    };

    localStorage.setItem(WALLET_META_KEY, JSON.stringify({ type: walletType, address }));
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    pendingLocalKeypair.current = localKeypair || null;

    try {
      await ensureWalletApiSession({
        walletAddress: address,
        walletType,
        localKeypair: localKeypair || null,
      });
      setSessionDeferred(null);
      setSuccessMsg(`Wallet linked: ${shortAddr(address)}. Opening your node…`);
      onLoginSuccess(user);
    } catch (err: any) {
      console.warn('Wallet API session:', err);
      const reason = err?.message || 'network hiccup';
      // Hold the gate so members can retry before entering empty-handed for proofs.
      setSessionDeferred({ address, walletType, reason, user });
      setSuccessMsg(
        `Wallet ready (${shortAddr(address)}). API session deferred — retry so Academy proofs can attach.`
      );
    }
  };

  const retryApiSession = async () => {
    if (!sessionDeferred) return;
    setRetryingSession(true);
    setErrorMsg('');
    try {
      await ensureWalletApiSession({
        walletAddress: sessionDeferred.address,
        walletType: sessionDeferred.walletType,
        localKeypair:
          sessionDeferred.walletType === 'local' ? pendingLocalKeypair.current : null,
      });
      const user = sessionDeferred.user;
      setSessionDeferred(null);
      setSuccessMsg(`API session restored. Opening your node…`);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Session retry failed — try again in a moment.');
    } finally {
      setRetryingSession(false);
    }
  };

  const continueWithoutApiSession = () => {
    if (!sessionDeferred) return;
    const user = sessionDeferred.user;
    setSessionDeferred(null);
    setSuccessMsg('Entering node — you can retry API session from Academy if proofs fail.');
    onLoginSuccess(user);
  };

  const connectPhantom = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const result = await connectPhantomWallet();
      if (result.status === 'redirected') {
        setSuccessMsg('Opening in Phantom… approve there, then you’re in.');
        // Stay loading briefly — page will leave for the deeplink
        return;
      }
      if (result.status === 'unavailable') {
        setErrorMsg(
          `${result.reason} Or continue with a local Devnet demo wallet below.`
        );
        setLoading(false);
        return;
      }
      setSuccessMsg('Phantom connected. Opening Culture Node…');
      await completeLogin(result.address, 'extension');
    } catch (err: unknown) {
      console.error('Phantom connect failed:', err);
      const message = err instanceof Error ? err.message : 'Phantom connection was rejected.';
      setErrorMsg(message);
      setLoading(false);
    } finally {
      if (getPhantomProvider()) {
        setLoading(false);
      }
    }
  };

  const createOrUseLocalWallet = async (reuseExisting: boolean) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let keypair: Keypair;

      if (reuseExisting) {
        const raw = localStorage.getItem(LOCAL_SECRET_KEY);
        if (!raw) {
          setErrorMsg('No saved Devnet wallet found.');
          setLoading(false);
          return;
        }
        keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
      } else {
        keypair = Keypair.generate();
        localStorage.setItem(LOCAL_SECRET_KEY, JSON.stringify(Array.from(keypair.secretKey)));
        setSavedLocalAddress(keypair.publicKey.toString());
      }

      const address = keypair.publicKey.toString();
      setSuccessMsg(
        reuseExisting
          ? 'Restored local Devnet wallet.'
          : 'New local Devnet wallet created (stored in this browser).'
      );
      await completeLogin(address, 'local', keypair);
    } catch (err: any) {
      console.error('Local wallet failed:', err);
      setErrorMsg(err?.message || 'Failed to create local Devnet wallet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoStart || autoRan.current) return;
    autoRan.current = true;
    if (autoStart === 'local') {
      const hasSaved = Boolean(localStorage.getItem(LOCAL_SECRET_KEY));
      void createOrUseLocalWallet(hasSaved);
    } else if (autoStart === 'phantom') {
      void connectPhantom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot autoStart
  }, [autoStart]);

  const copySavedAddress = () => {
    if (!savedLocalAddress) return;
    navigator.clipboard.writeText(savedLocalAddress);
    setSuccessMsg('Local wallet address copied.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050608] overflow-y-auto">
      <CinematicBackdrop variant="auth" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 160 }}
        className="relative w-full max-w-md bg-[#09090c]/82 border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10 backdrop-blur-md"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-amber-500/80 to-cyan-500" />

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-mono text-[9px] font-black tracking-[0.25em] text-cyan-400 uppercase block">
            Human Passport
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight mt-1 font-display italic">
            {autoStart === 'local'
              ? 'Securing your passport…'
              : 'Own your digital reputation'}
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-2 leading-relaxed">
            Continue with a secure ID, claim your Human Passport, then prove attention. Mobile opens
            inside Phantom for you — ownership stays yours.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-[11px] font-sans flex items-start gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-sans flex items-start gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {sessionDeferred && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/35 text-amber-100 text-[11px] font-sans space-y-3">
            <p className="leading-relaxed">
              Wallet is ready — API session still deferred ({sessionDeferred.reason}). Retry so
              Academy proofs can attach. Stay here until it lands if you can.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void retryApiSession()}
                disabled={retryingSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3 h-3 ${retryingSession ? 'animate-spin' : ''}`} />
                Retry API session
              </button>
              <button
                type="button"
                onClick={continueWithoutApiSession}
                disabled={retryingSession}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:border-amber-400/40 font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
              >
                Continue anyway →
              </button>
            </div>
          </div>
        )}

        {loading && autoStart ? (
          <div className="flex flex-col items-center gap-3 py-8 text-slate-400 text-xs font-mono">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            {autoStart === 'local' ? 'Creating demo wallet…' : 'Opening Phantom…'}
          </div>
        ) : (
          <>
            <div className="space-y-1 mb-4">
              <label className="text-slate-500 font-bold uppercase tracking-wider text-[10px] font-mono block">
                Operator name (optional)
              </label>
              <input
                type="text"
                disabled={loading}
                placeholder="Defaults from wallet"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#050506] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-sans"
              />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => void connectPhantom()}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-mono text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 bg-[#AB9FF2] hover:bg-[#c4baf7] text-black cursor-pointer disabled:opacity-60 shadow-[0_0_28px_rgba(171,159,242,0.35)]"
              >
                {loading && autoStart === 'phantom' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                {isLikelyMobile() && !getPhantomProvider()
                  ? 'Continue in Phantom'
                  : 'Continue with Phantom'}
              </button>
              <p className="text-[10px] text-slate-500 font-sans text-center -mt-1">
                Secure passport ·{' '}
                <a
                  href={phantomInstallUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-300/90 underline-offset-2 hover:underline"
                >
                  Get Phantom
                </a>
                {isLikelyMobile() ? ' · works on phone' : ' · browser'}
              </p>

              <button
                type="button"
                onClick={() => void createOrUseLocalWallet(Boolean(savedLocalAddress))}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 text-slate-200 font-mono text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading && autoStart === 'local' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : savedLocalAddress ? (
                  <>
                    <Key className="w-4 h-4 text-cyan-400" />
                    Continue without app ({shortAddr(savedLocalAddress)})
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Continue without app
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 font-sans text-center -mt-1">
                This device only · practice network · logout clears keys
              </p>

              {savedLocalAddress && (
                <button
                  type="button"
                  onClick={() => void createOrUseLocalWallet(false)}
                  disabled={loading}
                  className="w-full py-2 text-[10px] font-mono text-slate-500 hover:text-slate-300 uppercase tracking-wider cursor-pointer"
                >
                  Create new local wallet
                </button>
              )}
            </div>

            {savedLocalAddress && (
              <button
                type="button"
                onClick={copySavedAddress}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 font-mono cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                Copy saved address
              </button>
            )}
          </>
        )}

        <div className="mt-5 pt-4 border-t border-white/5 flex items-start gap-2 text-[10px] text-slate-500 font-sans leading-relaxed">
          <Info className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
          <span>
            Next: claim your <strong className="text-slate-400">Human Passport</strong>, then a short{' '}
            <strong className="text-slate-400">Proof of Attention</strong> challenge (~2 min).
          </span>
        </div>
      </motion.div>
    </div>
  );
}
