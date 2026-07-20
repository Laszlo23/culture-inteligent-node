/**
 * Full-bleed cinematic atmosphere — muted looping video + soft veil.
 * Kept quiet so UI stays readable; CSS field fallback when video/reduced-motion.
 */

import React, { useEffect, useRef, useState } from 'react';

export type AtmosphereVariant = 'hero' | 'auth' | 'facility' | 'ritual' | 'duality';

const SOURCES: Record<AtmosphereVariant, { mp4: string; poster?: string }> = {
  hero: { mp4: '/atmosphere/hero-field.mp4' },
  auth: { mp4: '/atmosphere/hero-field.mp4' },
  facility: { mp4: '/atmosphere/facility-grid.mp4' },
  ritual: { mp4: '/atmosphere/ritual-pulse.mp4' },
  /** Soft Mind/Machine wash — single quiet plate (no dual video stack) */
  duality: {
    mp4: '/atmosphere/facility-grid.mp4',
    poster: '/atmosphere/arena-hero.webp',
  },
};

const VEIL: Record<AtmosphereVariant, string> = {
  hero:
    'linear-gradient(180deg, rgba(5,6,8,0.55) 0%, rgba(5,6,8,0.72) 45%, rgba(5,6,8,0.9) 100%), radial-gradient(ellipse 80% 60% at 50% 20%, rgba(34,211,238,0.06), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(245,158,11,0.04), transparent 50%)',
  auth:
    'linear-gradient(160deg, rgba(5,6,8,0.6) 0%, rgba(5,6,8,0.8) 50%, rgba(5,6,8,0.94) 100%), radial-gradient(ellipse 70% 50% at 30% 30%, rgba(34,211,238,0.05), transparent 60%)',
  facility:
    'linear-gradient(180deg, rgba(5,5,6,0.82) 0%, rgba(5,5,6,0.92) 100%), radial-gradient(ellipse 60% 40% at 15% 0%, rgba(34,211,238,0.04), transparent)',
  ritual:
    'linear-gradient(180deg, rgba(6,8,14,0.55) 0%, rgba(5,6,8,0.82) 70%, rgba(5,6,8,0.94) 100%), radial-gradient(ellipse 70% 50% at 50% 40%, rgba(34,211,238,0.08), transparent 60%), radial-gradient(ellipse 40% 30% at 70% 70%, rgba(245,158,11,0.05), transparent)',
  duality:
    'linear-gradient(105deg, rgba(8,6,4,0.72) 0%, rgba(5,6,8,0.78) 50%, rgba(4,10,14,0.75) 100%), radial-gradient(ellipse 50% 45% at 20% 40%, rgba(245,158,11,0.06), transparent 55%), radial-gradient(ellipse 50% 45% at 80% 45%, rgba(34,211,238,0.06), transparent 55%)',
};

const VIDEO_OPACITY: Record<AtmosphereVariant, number> = {
  hero: 0.28,
  auth: 0.22,
  facility: 0.14,
  ritual: 0.24,
  duality: 0.16,
};

type Props = {
  variant?: AtmosphereVariant;
  className?: string;
  /** Extra dimming for busy UI (facility map) */
  dim?: boolean;
};

function useMutedLoop(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  onFail: () => void,
  onReady: () => void
) {
  useEffect(() => {
    if (!enabled) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      onFail();
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const play = () => {
      v.play().then(onReady).catch(onFail);
    };
    if (v.readyState >= 2) play();
    else v.addEventListener('loadeddata', play, { once: true });
    return () => v.removeEventListener('loadeddata', play);
  }, [enabled, videoRef, onFail, onReady]);
}

export function CinematicBackdrop({
  variant = 'facility',
  className = '',
  dim = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(true);
  const [ready, setReady] = useState(false);
  const src = SOURCES[variant];
  const baseOpacity = dim
    ? Math.min(0.1, VIDEO_OPACITY[variant] * 0.5)
    : VIDEO_OPACITY[variant];

  useMutedLoop(
    videoRef,
    useVideo,
    () => setUseVideo(false),
    () => setReady(true)
  );

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <div className={`absolute inset-0 atmosphere-base atmosphere-${variant}`} />

      {useVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover scale-[1.02] transition-opacity duration-1000"
          style={{ opacity: ready ? baseOpacity : 0 }}
          src={src.mp4}
          poster={src.poster}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          onError={() => setUseVideo(false)}
        />
      )}

      {variant === 'duality' && (
        <div className="absolute inset-0 duality-split-wash" />
      )}

      <div className="absolute inset-0" style={{ background: VEIL[variant] }} />
      <div className="absolute inset-0 atmosphere-vignette" />
    </div>
  );
}

export default CinematicBackdrop;
