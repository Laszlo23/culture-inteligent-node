/**
 * Attention modal — one social-spread task, one clear CTA.
 */

import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Copy,
  ExternalLink,
  MessageCircle,
  Radio,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import FarcasterCastButton from './FarcasterCastButton';
import {
  completeAttentionShareTask,
  snoozeAttentionSharePrompt,
  type AttentionShareTask,
} from '../lib/attention-share-prompt';
import { shareCultureText, copyTextFallback } from '../lib/culture-broadcast';
import { pickQuote } from '../lib/motivating-quotes';
import { BRAND, SLOGANS } from '../lib/brand-slogans';
import { track } from '../lib/attention-metrics';
import { COMMUNITY_LINKS } from '../lib/community-invite';
import { DISCORD_INVITE_URL } from '../lib/discord-community';

type Props = {
  open: boolean;
  task: AttentionShareTask | null;
  onClose: () => void;
  onCompleted?: (task: AttentionShareTask) => void;
};

function ChannelIcon({ action }: { action: AttentionShareTask['action'] }) {
  if (action === 'copy_discord') return <MessageCircle className="w-4 h-4" />;
  if (action === 'copy_telegram') return <Radio className="w-4 h-4" />;
  if (action === 'farcaster_cast') return <Sparkles className="w-4 h-4" />;
  return <Share2 className="w-4 h-4" />;
}

export default function AttentionShareModal({
  open,
  task,
  onClose,
  onCompleted,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const quote = pickQuote(task ? `share:${task.id}` : 'share');

  const finish = (t: AttentionShareTask, how: string) => {
    completeAttentionShareTask(t);
    track('attention_share_complete', { task: t.id, how });
    track('broadcast_share', { channel: `attention_modal_${t.id}`, how });
    onCompleted?.(t);
    onClose();
  };

  const dismiss = () => {
    snoozeAttentionSharePrompt();
    track('broadcast_dismiss', { channel: 'attention_modal' });
    onClose();
  };

  const runCopyOrShare = async (t: AttentionShareTask) => {
    const text = t.shareText;
    if (!text) return;
    setBusy(true);
    try {
      if (t.action === 'native_share' || t.action === 'hearing_share') {
        const how = await shareCultureText(text);
        setToast(how === 'share' ? 'Shared' : 'Copied — paste anywhere');
        window.setTimeout(() => finish(t, how), 500);
      } else {
        await copyTextFallback(text);
        setToast('Copied');
        window.setTimeout(() => finish(t, 'clipboard'), 450);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setBusy(false);
        return;
      }
      setToast('Could not share — try again');
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && task && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 sm:p-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="attention-share-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-[#050608]/78 backdrop-blur-sm cursor-pointer"
            aria-label="Dismiss"
            onClick={dismiss}
          />

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#08090e] shadow-[0_28px_80px_rgba(0,0,0,0.65)]"
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_20%_0%,rgba(34,211,238,0.16),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(245,158,11,0.12),transparent_50%)]" />
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-400 via-amber-300 to-cyan-400" />

            <div className="relative z-10 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-cyan-300 inline-flex items-center gap-1.5">
                    <ChannelIcon action={task.action} />
                    Attention · {task.channelLabel}
                  </p>
                  <h2
                    id="attention-share-title"
                    className="mt-2 font-display text-2xl font-extrabold italic text-white tracking-tight leading-tight"
                  >
                    {task.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed">{task.body}</p>
              <p className="mt-3 text-[12px] italic text-amber-100/80 leading-relaxed">
                {quote}
              </p>
              <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                {BRAND.product} · {SLOGANS.spread}
              </p>

              <div className="mt-5 flex flex-col gap-2.5">
                {task.action === 'farcaster_cast' && task.castTemplateId ? (
                  <FarcasterCastButton
                    templateId={task.castTemplateId}
                    label={task.cta}
                    variant="primary"
                    className="w-full"
                    onCast={() => finish(task, 'farcaster')}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runCopyOrShare(task)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black uppercase tracking-wider cursor-pointer disabled:opacity-60 shadow-[0_0_28px_rgba(34,211,238,0.35)]"
                  >
                    {task.action.startsWith('copy') ? (
                      <Copy className="w-4 h-4" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    {busy ? 'Working…' : task.cta}
                  </button>
                )}

                <div className="flex flex-wrap gap-2">
                  {task.action === 'copy_discord' && (
                    <a
                      href={DISCORD_INVITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-[10px] font-mono text-slate-400 hover:text-indigo-200 uppercase tracking-wider"
                    >
                      Open Discord <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {task.action === 'copy_telegram' && (
                    <a
                      href={COMMUNITY_LINKS.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-[10px] font-mono text-slate-400 hover:text-sky-200 uppercase tracking-wider"
                    >
                      Open Telegram <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={dismiss}
                    className="ml-auto px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    Later
                  </button>
                </div>
              </div>

              {toast && (
                <p className="mt-3 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
                  <Copy className="w-3 h-3" />
                  {toast}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
