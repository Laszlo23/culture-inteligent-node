/**
 * One-tap open Farcaster compose with Human Economy cast templates.
 */

import React from 'react';
import {
  CAST_TEMPLATES,
  buildHookLoopCast,
  getCastTemplate,
  openFarcasterCompose,
  type CastTemplateId,
} from '../lib/farcaster';
import { OG_PACKS, type OgPackId } from '../lib/og-share';
import { track } from '../lib/attention-metrics';
import type { HookingTruth } from '../lib/hook-loop-campaign';

type Variant = 'primary' | 'ghost' | 'compact';

type Props = {
  templateId?: CastTemplateId;
  /** Override text/embed (e.g. Hook Loop truth) */
  text?: string;
  embedUrl?: string;
  truth?: HookingTruth;
  label?: string;
  variant?: Variant;
  className?: string;
  onCast?: () => void;
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#8A63D2] hover:bg-[#9B7AE0] text-white font-mono text-xs font-black uppercase tracking-wider cursor-pointer shadow-[0_0_28px_rgba(138,99,210,0.35)]',
  ghost:
    'inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#8A63D2]/45 hover:border-[#8A63D2]/80 text-[#D4C4F0] font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer',
  compact:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#8A63D2]/40 bg-[#8A63D2]/15 hover:bg-[#8A63D2]/25 text-[#E8DEFF] font-mono text-[9px] font-black uppercase tracking-wider cursor-pointer',
};

function FarcasterGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className ?? 'w-3.5 h-3.5'}
    >
      <path d="M18.24 3H5.76A2.76 2.76 0 0 0 3 5.76v12.48A2.76 2.76 0 0 0 5.76 21h12.48A2.76 2.76 0 0 0 21 18.24V5.76A2.76 2.76 0 0 0 18.24 3Zm-2.4 13.2h-1.56l-.84-2.52H10.56l-.84 2.52H8.16l3.12-8.4h1.44l3.12 8.4Zm-3.96-3.84 1.08-3.24 1.08 3.24h-2.16Z" />
    </svg>
  );
}

export default function FarcasterCastButton({
  templateId = 'launch',
  text,
  embedUrl,
  truth,
  label,
  variant = 'primary',
  className = '',
  onCast,
}: Props) {
  const onClick = () => {
    let castText = text;
    let castEmbed = embedUrl;
    let source: string = templateId;

    if (truth) {
      const pack = buildHookLoopCast(truth);
      castText = pack.text;
      castEmbed = pack.embedUrl;
      source = `hook_${truth.id}`;
    } else if (!castText) {
      const t = getCastTemplate(templateId);
      castText = t.text;
      castEmbed = castEmbed ?? t.embedUrl;
    }

    // No fixed template image — openFarcasterCompose rotates OG every share
    openFarcasterCompose(castText!, castEmbed);
    track('farcaster_cast', { template: source });
    onCast?.();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
    >
      <FarcasterGlyph />
      {label ?? 'Cast on Farcaster'}
    </button>
  );
}

/** Quick picker for launch deck — copy/open each growth cast. */
export function FarcasterCastDeck({
  ids = ['launch', 'passport', 'hook_loop', 'proof', 'hearing'] as CastTemplateId[],
}: {
  ids?: CastTemplateId[];
}) {
  return (
    <div className="rounded-2xl border border-[#8A63D2]/25 bg-[#8A63D2]/[0.06] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-[#C4B0F0]">
          Farcaster · growth deck
        </p>
        <span className="font-mono text-[9px] text-slate-500">{CAST_TEMPLATES.length} casts</span>
      </div>
      <p className="text-[12px] text-slate-400 leading-relaxed">
        Every cast advances the OG pack — the feed image changes each share.
      </p>
      <div className="flex flex-wrap gap-2">
        {ids.map((id) => {
          const t = getCastTemplate(id);
          return (
            <FarcasterCastButton
              key={id}
              templateId={id}
              label={t.title}
              variant="compact"
            />
          );
        })}
      </div>
    </div>
  );
}

/** Visual OG pack picker — different image + copy per cast. */
export function OgShareDeck({
  packIds,
}: {
  packIds?: OgPackId[];
}) {
  const packs = packIds
    ? OG_PACKS.filter((p) => packIds.includes(p.id))
    : OG_PACKS;

  return (
    <div className="rounded-2xl border border-white/12 bg-black/40 p-4 space-y-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[9px] font-black tracking-[0.28em] uppercase text-cyan-300">
          Feed cards · OG pack
        </p>
        <span className="font-mono text-[9px] text-slate-500">{packs.length} looks</span>
      </div>
      <p className="text-[12px] text-slate-400 leading-relaxed">
        Pick a look, or use Rain / Grow — each share cycles to the next card.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {packs.map((pack) => (
          <button
            key={pack.id}
            type="button"
            onClick={() => {
              // Explicit pick for this tap; rotator still advances for the next share
              openFarcasterCompose(pack.message, pack.embedPage, pack.imageUrl);
              track('farcaster_cast', { template: `og_${pack.id}` });
            }}
            className="group text-left rounded-xl border border-white/10 bg-[#0a0a0e]/80 overflow-hidden cursor-pointer hover:border-cyan-400/40 transition-colors"
          >
            <div className="aspect-[16/9] overflow-hidden bg-black/50">
              <img
                src={pack.path}
                alt={pack.alt}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                draggable={false}
              />
            </div>
            <div className="px-2.5 py-2">
              <p className="font-mono text-[9px] font-black uppercase tracking-wider text-cyan-300/90">
                {pack.title}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-2 leading-snug">
                {pack.message.split('\n')[0]}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
