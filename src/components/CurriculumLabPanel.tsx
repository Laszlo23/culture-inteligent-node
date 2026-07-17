/**
 * Admin-only: generate weekly Attention Intelligence draft → approve publish.
 */

import React, { useState } from 'react';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import type { AttentionSession } from '../content/attention-intelligence';
import {
  researchCurriculumDraft,
  fetchCurriculumDrafts,
  publishCurriculumDraft,
  rejectCurriculumDraft,
  ensureWalletApiSession,
  getWalletToken,
} from '../lib/api.ts';
import { Keypair } from '@solana/web3.js';

interface CurriculumLabPanelProps {
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  onPublished: () => void;
}

export default function CurriculumLabPanel({ addLog, onPublished }: CurriculumLabPanelProps) {
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<AttentionSession[]>([]);
  const [preview, setPreview] = useState<AttentionSession | null>(null);
  const [error, setError] = useState('');

  const ensureAuth = async () => {
    const sessionRaw = localStorage.getItem('solana_current_user_session_v1');
    const sessionUser = sessionRaw ? JSON.parse(sessionRaw) : null;
    if (!sessionUser?.walletAddress) throw new Error('Connect a wallet first');
    if (!getWalletToken()) {
      let localKeypair: Keypair | null = null;
      if (sessionUser.walletType === 'local') {
        const secret = localStorage.getItem('solana_local_secret');
        if (secret) localKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)));
      }
      await ensureWalletApiSession({
        walletAddress: sessionUser.walletAddress,
        walletType: sessionUser.walletType || 'local',
        localKeypair,
      });
    }
  };

  const loadDrafts = async () => {
    setBusy(true);
    setError('');
    try {
      await ensureAuth();
      const data = await fetchCurriculumDrafts();
      setDrafts(data.drafts || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load drafts');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      await ensureAuth();
      const data = await researchCurriculumDraft();
      setPreview(data.draft);
      setDrafts((prev) => [data.draft, ...prev.filter((d) => d.id !== data.draft.id)]);
      addLog('CURRICULUM AGENT: Draft generated (research-assisted). Review before publish.', 'info');
    } catch (e: any) {
      setError(e?.message || 'Research failed');
      addLog(`CURRICULUM AGENT: ${e?.message || 'failed'}`, 'warn');
    } finally {
      setBusy(false);
    }
  };

  const approve = async (id: string) => {
    setBusy(true);
    try {
      await ensureAuth();
      await publishCurriculumDraft(id);
      setPreview(null);
      await loadDrafts();
      onPublished();
      addLog('CURRICULUM: Draft published as this week\'s drop.', 'success');
    } catch (e: any) {
      setError(e?.message || 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  const reject = async (id: string) => {
    setBusy(true);
    try {
      await ensureAuth();
      await rejectCurriculumDraft(id);
      setPreview((p) => (p?.id === id ? null : p));
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      addLog('CURRICULUM: Draft rejected.', 'info');
    } catch (e: any) {
      setError(e?.message || 'Reject failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[10px] font-mono text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Curriculum Lab (Admin)
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gemini researches evidence-based attention science → you approve before live.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void loadDrafts()}
            className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-400"
          >
            Load drafts
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void generate()}
            className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 text-amber-200 inline-flex items-center gap-1.5"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            Generate weekly draft
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {(preview || drafts[0]) && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
          {(() => {
            const d = preview || drafts[0];
            return (
              <>
                <p className="text-sm font-semibold text-white">{d.title}</p>
                <p className="text-[12px] text-slate-400 line-clamp-3">{d.hook}</p>
                {d.citations && d.citations.length > 0 && (
                  <ul className="text-[10px] text-slate-500 list-disc pl-4">
                    {d.citations.slice(0, 4).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}
                {d.researchNote && (
                  <p className="text-[10px] text-amber-500/80">{d.researchNote}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void approve(d.id)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200"
                  >
                    <Check className="w-3 h-3" /> Approve & publish
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void reject(d.id)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-400/30 text-rose-300"
                  >
                    <X className="w-3 h-3" /> Reject
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
