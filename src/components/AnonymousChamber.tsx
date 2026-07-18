/**
 * The Void — questions you would never ask with a name attached.
 * Anonymity is enforced: no wallet token, server rejects Authorization, schema has no identity columns.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EyeOff, ShieldCheck, Send, RefreshCw, Lock, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AnonymityReceipt,
  VoidAsk,
  VoidReply,
  VOID_MANIFEST,
  fetchVoidManifest,
  listVoidAsks,
  listVoidReplies,
  postVoidAsk,
  postVoidReply,
} from '../lib/void-chamber';
import { VOID_DRAFT_KEY } from '../lib/void-chamber';

type Props = {
  addLog: (message: string, type: 'info' | 'success' | 'warn' | 'system') => void;
  initialDraft?: string;
};

export default function AnonymousChamber({ addLog, initialDraft }: Props) {
  const [asks, setAsks] = useState<VoidAsk[]>([]);
  const [draft, setDraft] = useState(() => {
    if (initialDraft?.trim()) return initialDraft;
    try {
      return localStorage.getItem(VOID_DRAFT_KEY) || '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<AnonymityReceipt | null>(null);
  const [manifestLive, setManifestLive] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, VoidReply[]>>({});
  const [replyDraft, setReplyDraft] = useState('');
  const [proofOpen, setProofOpen] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [list, manifest] = await Promise.all([listVoidAsks(), fetchVoidManifest()]);
      setAsks(list);
      setManifestLive(manifest.ok);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (initialDraft?.trim()) {
      setDraft(initialDraft);
      return;
    }
    try {
      const seeded = localStorage.getItem(VOID_DRAFT_KEY);
      if (seeded?.trim()) setDraft(seeded);
    } catch {
      // ignore
    }
  }, [initialDraft]);

  useEffect(() => {
    // Clear one-shot Signal Desk seed after it lands in the composer
    if (!draft.trim()) return;
    try {
      const seeded = localStorage.getItem(VOID_DRAFT_KEY);
      if (seeded && seeded === draft) {
        localStorage.removeItem(VOID_DRAFT_KEY);
      }
    } catch {
      // ignore
    }
  }, [draft]);

  const submitAsk = async () => {
    if (submitting) return;
    setSubmitting(true);
    setReceipt(null);
    try {
      const { ask, receipt: r } = await postVoidAsk(draft);
      setDraft('');
      setReceipt(r);
      setAsks((prev) => [ask, ...prev.filter((a) => a.id !== ask.id)]);
      addLog(
        `VOID ASK SEALED: anonymous receipt ${r.postId.slice(0, 12)}… · auth never sent.`,
        'success'
      );
    } catch (e: any) {
      addLog(`VOID REJECTED: ${e?.message || e}`, 'warn');
    } finally {
      setSubmitting(false);
    }
  };

  const openThread = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    const list = await listVoidReplies(id);
    setReplies((prev) => ({ ...prev, [id]: list }));
  };

  const submitReply = async (askId: string) => {
    if (!replyDraft.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { reply, receipt: r } = await postVoidReply(askId, replyDraft);
      setReplyDraft('');
      setReceipt(r);
      setReplies((prev) => ({
        ...prev,
        [askId]: [...(prev[askId] || []), reply],
      }));
      setAsks((prev) =>
        prev.map((a) => (a.id === askId ? { ...a, replyCount: (a.replyCount || 0) + 1 } : a))
      );
      addLog('VOID REPLY SEALED: still nameless.', 'success');
    } catch (e: any) {
      addLog(`VOID REPLY REJECTED: ${e?.message || e}`, 'warn');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-[#0a0812] via-[#07070a] to-[#050810] p-5 md:p-7"
      >
        <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.18),_transparent_55%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <EyeOff className="w-4 h-4 text-violet-300" />
            <span className="text-[10px] font-mono font-black tracking-[0.22em] uppercase text-violet-300/90">
              The Void · nameless chamber
            </span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold italic text-white tracking-tight">
            Ask what you would never ask with a name.
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl font-sans leading-relaxed">
            No wallet. No profile. No Authorization header. If identity tries to ride along, the
            server rejects the request — that rejection is part of the proof.
          </p>
        </div>
      </motion.div>

      {/* Anonymity proof — inspectable */}
      <div className="rounded-2xl border border-emerald-400/20 bg-[#060a08]/90 overflow-hidden">
        <button
          type="button"
          onClick={() => setProofOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono font-black tracking-widest uppercase text-emerald-300">
              Anonymity proof · verifiable
            </span>
            <span
              className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                manifestLive
                  ? 'border-emerald-400/40 text-emerald-300'
                  : 'border-amber-400/40 text-amber-300'
              }`}
            >
              {manifestLive ? 'LIVE MANIFEST' : 'CLIENT CONTRACT'}
            </span>
          </div>
          {proofOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        <AnimatePresence>
          {proofOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {VOID_MANIFEST.claim}
                </p>
                <ul className="space-y-1.5 text-[10px] font-mono text-slate-300">
                  <li className="flex gap-2">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    Auth policy: <span className="text-emerald-300">{VOID_MANIFEST.authPolicy}</span>
                  </li>
                  <li className="flex gap-2">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    Stored fields only:{' '}
                    <span className="text-slate-200">{VOID_MANIFEST.storedFields.join(', ')}</span>
                  </li>
                  <li className="flex gap-2">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    Never stored:{' '}
                    <span className="text-rose-300/90">
                      {VOID_MANIFEST.forbiddenFields.join(', ')}
                    </span>
                  </li>
                </ul>
                <p className="text-[9px] text-slate-600 font-mono leading-relaxed">
                  Verify: GET /api/void/manifest · POST with Authorization must return 400 · schema
                  void_asks has no identity columns. App/DB never stores who you are — host/CDN
                  access logs may still see an IP; use Tor if you need that layer too.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Compose */}
      <div className="rounded-2xl border border-white/10 bg-[#0a0a0c]/90 p-4 md:p-5 space-y-3">
        <label className="text-[9px] font-mono font-black tracking-widest uppercase text-slate-500 block">
          Your nameless question
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="The thing you would never have the balls to ask out loud…"
          className="w-full rounded-xl bg-black/50 border border-white/10 focus:border-violet-400/40 outline-none px-3.5 py-3 text-sm text-slate-200 placeholder:text-slate-600 font-sans resize-y min-h-[100px]"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[9px] font-mono text-slate-600">
            {draft.length}/2000 · wallet token never attached · light PoW mines before send
          </span>
          <button
            type="button"
            disabled={submitting || draft.trim().length < 8}
            onClick={() => void submitAsk()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer"
          >
            {submitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Drop into the Void
          </button>
        </div>
      </div>

      {/* Receipt */}
      <AnimatePresence>
        {receipt && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-cyan-400/30 bg-cyan-950/20 px-4 py-3 space-y-2"
          >
            <span className="text-[9px] font-mono font-black tracking-widest uppercase text-cyan-300 block">
              Anonymity receipt
            </span>
            <div className="grid gap-1 text-[10px] font-mono text-slate-300">
              <div>
                post · <span className="text-white break-all">{receipt.postId}</span>
              </div>
              <div>
                content hash · <span className="text-cyan-200 break-all">{receipt.contentHash}</span>
              </div>
              <div>
                auth sent ·{' '}
                <span className="text-emerald-300">{String(receipt.authHeaderSent)}</span> · wallet
                token · <span className="text-emerald-300">{String(receipt.walletTokenSent)}</span>
              </div>
              <div>
                mode · <span className="text-amber-200">{receipt.serverMode}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono font-black tracking-widest uppercase text-slate-500">
          Nameless feed
        </span>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-[9px] font-mono text-slate-500 hover:text-violet-300 inline-flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {asks.length === 0 && !loading && (
          <p className="text-sm text-slate-500 italic font-sans text-center py-8">
            Empty void. Be the first to ask the unaskable.
          </p>
        )}
        {asks.map((ask) => (
          <div
            key={ask.id}
            className="rounded-2xl border border-white/8 bg-[#0a0a0c]/85 p-4 space-y-2"
          >
            <p className="text-sm text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
              {ask.body}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[8px] font-mono text-slate-600">
                #{ask.contentHash.slice(0, 10)}
                {ask.local ? ' · local seal' : ''} ·{' '}
                {new Date(ask.createdAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <button
                type="button"
                onClick={() => void openThread(ask.id)}
                className="text-[9px] font-mono text-violet-300/90 hover:text-violet-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <MessageCircle className="w-3 h-3" />
                {ask.replyCount || 0} nameless{' '}
                {(ask.replyCount || 0) === 1 ? 'reply' : 'replies'}
              </button>
            </div>

            <AnimatePresence>
              {expandedId === ask.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 pt-3 border-t border-white/5 space-y-2">
                    {(replies[ask.id] || []).map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl bg-black/40 border border-white/5 px-3 py-2"
                      >
                        <p className="text-[12px] text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                          {r.body}
                        </p>
                        <span className="text-[8px] font-mono text-slate-600 mt-1 block">
                          #{r.contentHash.slice(0, 8)}
                        </span>
                      </div>
                    ))}
                    <textarea
                      value={expandedId === ask.id ? replyDraft : ''}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      rows={2}
                      placeholder="Answer without a name…"
                      className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-400/40 font-sans"
                    />
                    <button
                      type="button"
                      disabled={submitting || !replyDraft.trim()}
                      onClick={() => void submitReply(ask.id)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-violet-500/20 border border-white/10 text-[9px] font-mono font-black uppercase tracking-wider text-slate-300 cursor-pointer disabled:opacity-40"
                    >
                      Reply namelessly
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
