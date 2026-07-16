/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wallet, ShieldAlert, Check, Key, Sparkles,
  RefreshCw, Info, Link2, Copy
} from 'lucide-react';
import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { ensureWalletApiSession } from '../lib/api.ts';

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

interface AuthPortalProps {
  onLoginSuccess: (user: WalletSessionUser) => void;
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

export default function AuthPortal({ onLoginSuccess }: AuthPortalProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savedLocalAddress, setSavedLocalAddress] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SECRET_KEY);
      if (!raw) return;
      const secretKey = Uint8Array.from(JSON.parse(raw));
      const keypair = Keypair.fromSecretKey(secretKey);
      setSavedLocalAddress(keypair.publicKey.toString());
    } catch {
      // ignore corrupt local secret
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

    localStorage.setItem(
      WALLET_META_KEY,
      JSON.stringify({ type: walletType, address })
    );
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));

    try {
      await ensureWalletApiSession({
        walletAddress: address,
        walletType,
        localKeypair: localKeypair || null,
      });
      setSuccessMsg(`Wallet linked: ${shortAddr(address)}. API session ready.`);
    } catch (err: any) {
      console.warn('Wallet API session:', err);
      setSuccessMsg(
        `Wallet linked: ${shortAddr(address)}. (API session deferred — ${err?.message || 'retry from Academy'})`
      );
    }

    onLoginSuccess(user);
  };

  const connectPhantom = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const provider = (window as any).solana;
    if (!provider?.isPhantom) {
      setErrorMsg(
        'Phantom not detected. Open this app in a normal browser tab (not an iframe), or use Local Devnet Wallet below — works without an extension.'
      );
      setLoading(false);
      return;
    }

    try {
      const response = await provider.connect();
      const address = response.publicKey.toString();
      setSuccessMsg('Phantom connected. Opening Culture Node…');
      await completeLogin(address, 'extension');
    } catch (err: any) {
      console.error('Phantom connect failed:', err);
      setErrorMsg(err?.message || 'Phantom connection was rejected.');
    } finally {
      setLoading(false);
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
        localStorage.setItem(
          LOCAL_SECRET_KEY,
          JSON.stringify(Array.from(keypair.secretKey))
        );
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

  const copySavedAddress = () => {
    if (!savedLocalAddress) return;
    navigator.clipboard.writeText(savedLocalAddress);
    setSuccessMsg('Local wallet address copied.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030304]/95 backdrop-blur-md overflow-y-auto">
      <div className="absolute inset-0 bg-cyber-grid bg-[size:32px_32px] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 140 }}
        className="relative w-full max-w-md bg-[#09090c] border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden z-10"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-indigo-500" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3.5 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="font-mono text-[9px] font-black tracking-[0.25em] text-cyan-400 uppercase block">
            Solana Operator Gate
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight mt-1">
            Wallet Login Only
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-2 leading-relaxed">
            No email or password. Connect Phantom or generate a local Devnet keypair to enter the facility — for jury review and demo recording.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3.5 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-[11px] font-sans flex items-start gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-sans flex items-start gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1 mb-4">
          <label className="text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono block">
            Operator name (optional)
          </label>
          <input
            type="text"
            disabled={loading}
            placeholder="Defaults to Op_xxxx…xxxx from wallet"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-[#050506] border border-white/10 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-sans transition-colors"
          />
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={connectPhantom}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-mono text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-fuchsia-950/40 transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Connect Phantom
              </>
            )}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[10px] text-slate-600 font-mono">OR DEVNET LOCAL</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          {savedLocalAddress && (
            <button
              type="button"
              onClick={() => createOrUseLocalWallet(true)}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/15 text-cyan-300 font-mono text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              <Key className="w-4 h-4" />
              Continue saved wallet ({shortAddr(savedLocalAddress)})
            </button>
          )}

          <button
            type="button"
            onClick={() => createOrUseLocalWallet(false)}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-950/10 text-slate-200 font-mono text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            {savedLocalAddress ? 'Create new local Devnet wallet' : 'Create local Devnet wallet'}
          </button>
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

        <div className="mt-5 pt-4 border-t border-white/5">
          <div className="flex items-start gap-2 text-[10px] text-slate-500 font-sans leading-relaxed">
            <Info className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0 mt-0.5" />
            <span>
              Jury tip: use <strong className="text-slate-400">Local Devnet Wallet</strong> if Phantom is blocked (iframes / AI Studio). Then open Ecosystem Vault → Solana Portal for airdrop + contribution txs.
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
