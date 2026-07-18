/**
 * Attention Toll Fuel Shop — 1¢ USDC micropayments (or practice mode).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Coins, Zap, RefreshCw, Printer, Sparkles } from 'lucide-react';
import { GameState } from '../types';
import {
  ensureWalletApiSession,
  fetchTollCatalog,
  fetchTollStats,
  getWalletToken,
  sendPartialEconomyTx,
  verifyTollOnServer,
  type TollCatalogResponse,
  type TollStatsResponse,
} from '../lib/api.ts';
import { syncLedgerToState } from '../lib/economy-actions';
import { resolveEconomyWallet } from '../lib/economy-wallet';
import type { TollSkuId } from '../lib/toll-catalog';

const DEVNET_RPC =
  (typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SOLANA_RPC_URL) ||
  'https://api.devnet.solana.com';

const TOLL_INV_KEY = 'building_culture_toll_inventory_v1';

export function loadTollInventory(): {
  sparkCredits: number;
  academyRetakeCredits: number;
  listSlotCredits: number;
} {
  try {
    const raw = localStorage.getItem(TOLL_INV_KEY);
    if (!raw) return { sparkCredits: 0, academyRetakeCredits: 0, listSlotCredits: 0 };
    const p = JSON.parse(raw);
    return {
      sparkCredits: Number(p.sparkCredits) || 0,
      academyRetakeCredits: Number(p.academyRetakeCredits) || 0,
      listSlotCredits: Number(p.listSlotCredits) || 0,
    };
  } catch {
    return { sparkCredits: 0, academyRetakeCredits: 0, listSlotCredits: 0 };
  }
}

export function persistTollInventory(inv: {
  sparkCredits: number;
  academyRetakeCredits: number;
  listSlotCredits: number;
}) {
  localStorage.setItem(TOLL_INV_KEY, JSON.stringify(inv));
}

/** Spend one spark credit for a named perk (client inventory). */
export function spendSparkCredit(
  kind: 'retake' | 'list' | 'refill'
): { ok: boolean; inv: ReturnType<typeof loadTollInventory> } {
  const inv = loadTollInventory();
  if (kind === 'retake' && inv.academyRetakeCredits > 0) {
    inv.academyRetakeCredits -= 1;
    persistTollInventory(inv);
    return { ok: true, inv };
  }
  if (kind === 'list' && inv.listSlotCredits > 0) {
    inv.listSlotCredits -= 1;
    persistTollInventory(inv);
    return { ok: true, inv };
  }
  if (inv.sparkCredits > 0) {
    inv.sparkCredits -= 1;
    if (kind === 'retake') {
      /* spark pack credit covers retake */
    } else if (kind === 'list') {
      /* spark pack credit covers list */
    }
    persistTollInventory(inv);
    return { ok: true, inv };
  }
  if (kind === 'retake' || kind === 'list') {
    return { ok: false, inv };
  }
  return { ok: false, inv };
}

interface AttentionTollShopProps {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  walletAddress?: string | null;
  walletType?: 'extension' | 'local' | null;
  localKeypair?: Keypair | null;
  highlightSku?: TollSkuId | null;
}

export default function AttentionTollShop({
  state,
  setState,
  addLog,
  walletAddress: walletAddressProp,
  walletType: walletTypeProp,
  localKeypair: localKeypairProp,
  highlightSku,
}: AttentionTollShopProps) {
  const [catalog, setCatalog] = useState<TollCatalogResponse | null>(null);
  const [stats, setStats] = useState<TollStatsResponse | null>(null);
  const [busySku, setBusySku] = useState<string | null>(null);
  const [step, setStep] = useState('');

  const walletCtx = resolveEconomyWallet();
  const walletAddress = walletAddressProp ?? walletCtx?.walletAddress ?? null;
  const walletType = walletTypeProp ?? walletCtx?.walletType ?? null;
  const localKeypair = localKeypairProp ?? walletCtx?.localKeypair ?? null;

  const refresh = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([fetchTollCatalog(), fetchTollStats()]);
      setCatalog(c);
      setStats(s);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'toll catalog error';
      addLog(`TOLL: ${msg}`, 'warn');
    }
  }, [addLog]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const inv = loadTollInventory();
    setState((prev) => ({
      ...prev,
      sparkCredits: inv.sparkCredits,
      academyRetakeCredits: inv.academyRetakeCredits,
      listSlotCredits: inv.listSlotCredits,
    }));
  }, [setState]);

  const applyEntitlement = async (data: Awaited<ReturnType<typeof verifyTollOnServer>>) => {
    const e = data.entitlement;
    const inv = loadTollInventory();
    inv.sparkCredits += e.sparkCredits;
    inv.academyRetakeCredits += e.academyRetakeCredits;
    inv.listSlotCredits += e.listSlotCredits;
    persistTollInventory(inv);

    if (data.economyTx && walletAddress) {
      try {
        if (!getWalletToken()) {
          await ensureWalletApiSession({
            walletAddress,
            walletType: walletType || 'local',
            localKeypair,
          });
        }
        await sendPartialEconomyTx({
          serializedBase64: data.economyTx,
          walletType: walletType || 'local',
          localKeypair,
        });
        await syncLedgerToState(setState);
      } catch (econErr: unknown) {
        const msg = econErr instanceof Error ? econErr.message : String(econErr);
        if (e.energyPercent > 0) {
          setState((prev) => ({
            ...prev,
            energy: Math.min(100, prev.energy + e.energyPercent),
            sparkCredits: inv.sparkCredits,
            academyRetakeCredits: inv.academyRetakeCredits,
            listSlotCredits: inv.listSlotCredits,
            claimTurboActive: e.claimTurbo || prev.claimTurboActive,
          }));
          addLog(`TOLL fuel applied locally (economy settle failed): ${msg}`, 'warn');
          return;
        }
      }
    }

    setState((prev) => ({
      ...prev,
      energy:
        e.energyPercent > 0 && !data.economyTx
          ? Math.min(100, prev.energy + e.energyPercent)
          : prev.energy,
      sparkCredits: inv.sparkCredits,
      academyRetakeCredits: inv.academyRetakeCredits,
      listSlotCredits: inv.listSlotCredits,
      claimTurboActive: e.claimTurbo || prev.claimTurboActive,
    }));
  };

  const buySku = async (skuId: string, priceMicroUsdc: number) => {
    if (!walletAddress) {
      addLog('TOLL BLOCKED: Connect a wallet first.', 'warn');
      return;
    }
    setBusySku(skuId);
    setStep('Preparing toll…');
    try {
      if (!getWalletToken()) {
        await ensureWalletApiSession({
          walletAddress,
          walletType: walletType || 'local',
          localKeypair,
        });
      }

      const usePractice = !catalog?.configured || !catalog.treasury;
      if (usePractice) {
        setStep('Practice toll (treasury not configured)…');
        const data = await verifyTollOnServer({
          sku: skuId,
          quantity: 1,
          practice: true,
        });
        await applyEntitlement(data);
        addLog(
          `TOLL PRACTICE: ${skuId} credited (set VITE_TOLL_TREASURY for real 1¢ USDC).`,
          'warn'
        );
        await refresh();
        return;
      }

      const connection = new Connection(DEVNET_RPC, 'confirmed');
      const mint = new PublicKey(catalog.usdcMint);
      const treasury = new PublicKey(catalog.treasury!);
      const owner = new PublicKey(walletAddress);
      const fromAta = getAssociatedTokenAddressSync(mint, owner);
      const toAta = getAssociatedTokenAddressSync(mint, treasury);

      const tx = new Transaction().add(
        createAssociatedTokenAccountIdempotentInstruction(owner, fromAta, owner, mint),
        createAssociatedTokenAccountIdempotentInstruction(owner, toAta, treasury, mint),
        createTransferInstruction(fromAta, toAta, owner, priceMicroUsdc, [], TOKEN_PROGRAM_ID)
      );

      setStep('Fetching blockhash…');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = owner;

      let signature = '';
      if (walletType === 'local' && localKeypair) {
        setStep('Signing USDC toll with local keypair…');
        tx.sign(localKeypair);
        signature = await connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        });
      } else {
        const provider = (window as unknown as { solana?: { signAndSendTransaction: (t: Transaction) => Promise<{ signature: string }> } }).solana;
        if (!provider?.signAndSendTransaction) {
          throw new Error('Phantom provider not found — use local Devnet wallet or open in a new tab.');
        }
        setStep('Approve 1¢ USDC toll in wallet…');
        const result = await provider.signAndSendTransaction(tx);
        signature = result.signature;
      }

      setStep('Confirming toll…');
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed'
      );

      setStep('Server verifying…');
      const data = await verifyTollOnServer({ signature, sku: skuId, quantity: 1 });
      await applyEntitlement(data);
      addLog(
        `TOLL PAID: ${skuId} · ${data.solscan || signature.slice(0, 16)}…`,
        'success'
      );
      await refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`TOLL FAILED: ${msg}`, 'warn');
    } finally {
      setBusySku(null);
      setStep('');
    }
  };

  const annualUsd = stats ? (stats.extrapolatedAnnualCents / 100).toFixed(2) : '0.00';
  const allTimeUsd = stats ? (stats.allTimeCents / 100).toFixed(2) : '0.00';
  const todayUsd = stats ? (stats.todayCents / 100).toFixed(2) : '0.00';

  return (
    <div id="attention-toll-shop" className="space-y-4">
      <div className="bg-[#0a0a0c] border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Printer className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-sm font-semibold text-slate-100 tracking-wider">
                PENNY PROTOCOL · ATTENTION TOLL
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
              Free forever: first Academy pass, claim_daily, basic reactor. Everything that
              accelerates, retries, or lists costs ~1¢ USDC. Volume is the printer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-amber-300 cursor-pointer"
            aria-label="Refresh toll stats"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-[#050506] border border-white/5 rounded-xl p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
              Today
            </span>
            <span className="text-lg font-mono font-bold text-amber-300">${todayUsd}</span>
            <span className="text-[10px] text-slate-500 font-mono block">
              {stats?.todayCount ?? 0} tolls
            </span>
          </div>
          <div className="bg-[#050506] border border-white/5 rounded-xl p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
              All-time
            </span>
            <span className="text-lg font-mono font-bold text-emerald-300">${allTimeUsd}</span>
            <span className="text-[10px] text-slate-500 font-mono block">
              {stats?.allTimeCount ?? 0} tolls
            </span>
          </div>
          <div className="bg-[#050506] border border-white/5 rounded-xl p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
              Model / yr
            </span>
            <span className="text-lg font-mono font-bold text-cyan-300">${annualUsd}</span>
            <span className="text-[10px] text-slate-500 font-mono block">from 24h rate</span>
          </div>
          <div className="bg-[#050506] border border-white/5 rounded-xl p-3">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">
              Inventory
            </span>
            <span className="text-sm font-mono text-slate-200">
              {state.sparkCredits ?? 0} sparks · {state.academyRetakeCredits ?? 0} retakes ·{' '}
              {state.listSlotCredits ?? 0} lists
            </span>
            <span className="text-[10px] text-slate-500 font-mono block">
              mkt fee {stats?.marketplaceFeeBps ?? 250} bps
            </span>
          </div>
        </div>

        {!catalog?.configured && (
          <p className="text-[10px] font-mono text-amber-300/90 mb-3 border border-amber-500/20 rounded-lg px-3 py-2 bg-amber-500/5">
            Treasury unset — purchases run as practice credits. Set VITE_TOLL_TREASURY (+ Devnet USDC)
            for real 1¢ settlement.
          </p>
        )}

        {step && (
          <p className="text-[10px] font-mono text-cyan-300/80 mb-2 animate-pulse">{step}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(catalog?.skus || []).map((sku) => {
            const hot = highlightSku === sku.id;
            return (
              <div
                key={sku.id}
                className={`rounded-xl border p-4 flex flex-col gap-2 ${
                  hot
                    ? 'border-amber-400/50 bg-amber-500/10'
                    : 'border-white/5 bg-[#050506]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {sku.id === 'spark_refill' || sku.id === 'spark_pack_100' ? (
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span className="text-xs font-mono font-bold text-slate-100">{sku.name}</span>
                  </div>
                  <span className="text-[11px] font-mono font-black text-amber-300">
                    {sku.priceCents}¢
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{sku.description}</p>
                <button
                  type="button"
                  disabled={Boolean(busySku)}
                  onClick={() => void buySku(sku.id, sku.priceMicroUsdc)}
                  className={`w-full py-2 rounded-lg font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 ${
                    busySku === sku.id
                      ? 'bg-slate-800 text-slate-500'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                >
                  <Coins className="w-3 h-3" />
                  {busySku === sku.id ? 'Processing…' : `Pay ${sku.priceCents}¢`}
                </button>
              </div>
            );
          })}
        </div>

        {stats?.note && (
          <p className="text-[9px] font-mono text-slate-600 mt-3">{stats.note}</p>
        )}
      </div>
    </div>
  );
}
