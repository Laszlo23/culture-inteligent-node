/**
 * Make it rain — high-class weekly distribution ritual.
 * One composition: Cast → Pin → Invite → Host.
 */

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Headphones,
  Handshake,
  MessageCircle,
  Radio,
  Share2,
} from 'lucide-react';
import FarcasterCastButton from './FarcasterCastButton';
import CinematicPanel from './fx/CinematicPanel';
import {
  RAIN_CAST_SEQUENCE,
  getCastTemplate,
  openFarcasterCompose,
  type CastTemplateId,
} from '../lib/farcaster';
import {
  DISCORD_PIN_COPY,
  DM_INVITE_COPY,
  TELEGRAM_PIN_COPY,
  RAIN_CHAPTERS,
  RAIN_TASKS,
  chapterDoneCount,
  firstIncompleteChapter,
  markRainTask,
  rainDoneCount,
  readRainProgress,
  toggleRainTask,
  type RainChapterId,
  type RainProgress,
  type RainTaskId,
} from '../lib/rain-checklist';
import { DISCORD_INVITE_URL } from '../lib/discord-community';
import { COMMUNITY_LINKS } from '../lib/community-invite';
import { track } from '../lib/attention-metrics';
import { BRAND } from '../lib/brand-slogans';

type Props = {
  compact?: boolean;
  onOpenPartners?: () => void;
  onOpenHearing?: () => void;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function ProgressRibbon({
  progress,
  total,
}: {
  progress: number;
  total: number;
}) {
  const pct = Math.round((progress / Math.max(1, total)) * 100);
  return (
    <div className="min-w-[7.5rem]">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-200/80">
          This week
        </span>
        <span className="font-display text-lg font-bold italic tabular-nums text-white">
          {progress}
          <span className="text-slate-500 text-sm not-italic font-mono">/{total}</span>
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cyan-300"
          initial={false}
          animate={{ width: `${Math.max(4, pct)}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function TaskTick({
  id,
  progress,
  onToggle,
}: {
  id: RainTaskId;
  progress: RainProgress;
  onToggle: (id: RainTaskId) => void;
}) {
  const task = RAIN_TASKS.find((t) => t.id === id);
  if (!task) return null;
  const on = progress[id];
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/8 bg-black/30 px-3 py-2.5 text-left transition hover:border-white/18 cursor-pointer"
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
          on
            ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
            : 'border-white/20 text-transparent group-hover:border-amber-400/40'
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13px] font-medium ${
            on ? 'text-slate-500 line-through' : 'text-slate-100'
          }`}
        >
          {task.label}
        </span>
        <span className="block text-[11px] text-slate-500 font-sans">{task.hint}</span>
      </span>
    </button>
  );
}

export default function MakeItRainDeck({
  compact = false,
  onOpenPartners,
  onOpenHearing,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState<RainProgress>(() => readRainProgress());
  const [chapter, setChapter] = useState<RainChapterId>(() =>
    firstIncompleteChapter(readRainProgress())
  );
  const [toast, setToast] = useState<string | null>(null);
  const done = rainDoneCount(progress);
  const active = useMemo(
    () => RAIN_CHAPTERS.find((c) => c.id === chapter) ?? RAIN_CHAPTERS[0],
    [chapter]
  );

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const rainAll = () => {
    const first = getCastTemplate('rain');
    openFarcasterCompose(first.text, first.embedUrl);
    setProgress(markRainTask('cast_rain', true));
    setChapter('cast');
    track('rain_cast', { template: 'rain', burst: true });
    flash('Compose open — finish the cast, then pin.');
  };

  const onToggle = (id: RainTaskId) => {
    setProgress(toggleRainTask(id));
  };

  const markAndFlash = (id: RainTaskId, msg: string) => {
    setProgress(markRainTask(id, true));
    flash(msg);
  };

  if (compact) {
    return (
      <CinematicPanel mood="evolution" compact className="border-amber-400/20">
        <div className="relative z-10 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.24em] text-amber-300/90">
              {BRAND.parent} · Make it rain
            </p>
            <p className="mt-1 font-display text-xl font-bold italic text-white tracking-tight">
              Cast. Pin. Invite. Host.
            </p>
            <p className="mt-1 text-[12px] text-slate-400">
              {done}/{RAIN_TASKS.length} this week
            </p>
          </div>
          <button
            type="button"
            onClick={rainAll}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-mono text-[11px] font-black uppercase tracking-wider text-black transition hover:bg-amber-300 cursor-pointer"
          >
            Rain cast
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </CinematicPanel>
    );
  }

  return (
    <CinematicPanel mood="evolution" className="border-amber-400/25">
      <div className="relative z-10 p-5 md:p-8">
        {/* Hero — one composition */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/90">
              {BRAND.parent}
            </p>
            <h3 className="mt-2 font-display text-3xl font-extrabold italic tracking-tight text-white md:text-4xl">
              Make it rain
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300/95 md:text-base">
              One weekly ritual. Four beats. Distribution that feels like craft — not spam.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
            <ProgressRibbon progress={done} total={RAIN_TASKS.length} />
            <button
              type="button"
              onClick={rainAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 font-mono text-[11px] font-black uppercase tracking-wider text-black shadow-[0_12px_40px_rgba(251,191,36,0.25)] transition hover:bg-amber-300 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              Begin with a cast
            </button>
          </div>
        </div>

        {/* Chapter rail */}
        <nav
          aria-label="Rain ritual"
          className="mt-8 flex items-stretch gap-1 sm:gap-2"
        >
          {RAIN_CHAPTERS.map((ch, i) => {
            const complete = chapterDoneCount(progress, ch) >= ch.taskIds.length;
            const current = ch.id === chapter;
            return (
              <React.Fragment key={ch.id}>
                {i > 0 && (
                  <div
                    className={`my-auto h-px w-2 sm:w-4 shrink-0 ${
                      complete || current ? 'bg-amber-400/50' : 'bg-white/10'
                    }`}
                    aria-hidden
                  />
                )}
                <button
                  type="button"
                  onClick={() => setChapter(ch.id)}
                  aria-current={current ? 'step' : undefined}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition cursor-pointer sm:px-3 ${
                    current
                      ? 'border-amber-400/45 bg-amber-500/15 text-white'
                      : complete
                        ? 'border-emerald-400/25 bg-emerald-500/8 text-emerald-100/90'
                        : 'border-white/8 bg-black/25 text-slate-400 hover:border-white/18 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-mono font-black ${
                      current
                        ? 'border-amber-300 bg-amber-400 text-black'
                        : complete
                          ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                          : 'border-white/15 bg-black/40'
                    }`}
                  >
                    {complete && !current ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em]">
                    {ch.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Active chapter body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-sm md:p-6"
          >
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.26em] text-amber-300/85">
              Beat {RAIN_CHAPTERS.findIndex((c) => c.id === active.id) + 1} · {active.label}
            </p>
            <h4 className="mt-2 font-display text-2xl font-bold italic text-white tracking-tight">
              {active.title}
            </h4>
            <p className="mt-1.5 max-w-lg text-sm text-slate-400 leading-relaxed">
              {active.line}
            </p>

            <div className="mt-5 space-y-4">
              {active.id === 'cast' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {RAIN_CAST_SEQUENCE.slice(0, 4).map((id: CastTemplateId) => {
                      const t = getCastTemplate(id);
                      return (
                        <FarcasterCastButton
                          key={id}
                          templateId={id}
                          variant="compact"
                          label={t.title}
                          onCast={() => {
                            if (id === 'rain' || id === 'launch') {
                              setProgress(markRainTask('cast_rain', true));
                            }
                            if (id === 'hearing' || id === 'weekly_hearing') {
                              setProgress(markRainTask('cast_hearing', true));
                            }
                            if (id === 'partner_pilot') {
                              setProgress(markRainTask('partner_outreach', true));
                            }
                            track('rain_cast', { template: id });
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    {active.taskIds.map((id) => (
                      <TaskTick key={id} id={id} progress={progress} onToggle={onToggle} />
                    ))}
                  </div>
                </>
              )}

              {active.id === 'pin' && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyText(DISCORD_PIN_COPY);
                        markAndFlash('pin_discord', ok ? 'Discord pin copied' : 'Copy failed');
                        track('rain_pin', { channel: 'discord' });
                      }}
                      className="group rounded-xl border border-white/12 bg-gradient-to-br from-indigo-950/40 to-black/40 px-4 py-4 text-left transition hover:border-indigo-300/40 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-indigo-200">
                        <MessageCircle className="h-4 w-4" />
                        Discord pin
                      </span>
                      <span className="mt-2 block text-sm text-slate-200">
                        Copy the #welcome ritual card
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 group-hover:text-indigo-200">
                        <Copy className="h-3 w-3" /> Copy
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyText(TELEGRAM_PIN_COPY);
                        markAndFlash('pin_telegram', ok ? 'Telegram pin copied' : 'Copy failed');
                        track('rain_pin', { channel: 'telegram' });
                      }}
                      className="group rounded-xl border border-white/12 bg-gradient-to-br from-sky-950/35 to-black/40 px-4 py-4 text-left transition hover:border-sky-300/40 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-sky-200">
                        <Radio className="h-4 w-4" />
                        Telegram pin
                      </span>
                      <span className="mt-2 block text-sm text-slate-200">
                        Weekly Hearing pulse for the group
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 group-hover:text-sky-200">
                        <Copy className="h-3 w-3" /> Copy
                      </span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={DISCORD_INVITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-300 hover:text-white"
                    >
                      Open Discord <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href={COMMUNITY_LINKS.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-300 hover:text-white"
                    >
                      Open Telegram <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </>
              )}

              {active.id === 'invite' && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyText(DM_INVITE_COPY);
                      markAndFlash('dm_ten', ok ? 'DM script copied — send to 10' : 'Copy failed');
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-4 text-left transition hover:bg-amber-500/15 cursor-pointer"
                  >
                    <span>
                      <span className="block font-mono text-[10px] font-black uppercase tracking-wider text-amber-200">
                        Trusted DM script
                      </span>
                      <span className="mt-1 block text-sm text-slate-200">
                        Short, honest invite — Passport + First Spark
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 font-mono text-[10px] font-black uppercase text-black">
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </span>
                  </button>
                  <TaskTick id="dm_ten" progress={progress} onToggle={onToggle} />
                </>
              )}

              {active.id === 'host' && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {onOpenHearing && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenHearing();
                          markAndFlash('hearing_live', 'Hearing opened — host the room');
                        }}
                        className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-4 text-left transition hover:bg-cyan-500/15 cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-cyan-200">
                          <Headphones className="h-4 w-4" />
                          Community Hearing
                        </span>
                        <span className="mt-2 block text-sm text-slate-200">
                          Spark → Zen → Spread · ~30 min
                        </span>
                      </button>
                    )}
                    {onOpenPartners && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenPartners();
                          markAndFlash('partner_outreach', 'Partner path opened');
                        }}
                        className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-4 text-left transition hover:border-amber-400/35 cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-200">
                          <Handshake className="h-4 w-4" />
                          Partner pilot
                        </span>
                        <span className="mt-2 block text-sm text-slate-200">
                          One Attention Session ask this week
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {active.taskIds.map((id) => (
                      <TaskTick key={id} id={id} progress={progress} onToggle={onToggle} />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Chapter nav */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
              <button
                type="button"
                disabled={RAIN_CHAPTERS.findIndex((c) => c.id === active.id) === 0}
                onClick={() => {
                  const i = RAIN_CHAPTERS.findIndex((c) => c.id === active.id);
                  if (i > 0) setChapter(RAIN_CHAPTERS[i - 1].id);
                }}
                className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 enabled:hover:text-slate-200 disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                Previous beat
              </button>
              <button
                type="button"
                onClick={() => {
                  const i = RAIN_CHAPTERS.findIndex((c) => c.id === active.id);
                  if (i < RAIN_CHAPTERS.length - 1) setChapter(RAIN_CHAPTERS[i + 1].id);
                  else setChapter('cast');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-white transition hover:border-amber-400/40 cursor-pointer"
              >
                {active.id === 'host' ? 'Back to cast' : 'Next beat'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2 font-mono text-[11px] text-amber-200"
              role="status"
            >
              <Check className="h-3.5 w-3.5" />
              {toast}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </CinematicPanel>
  );
}
