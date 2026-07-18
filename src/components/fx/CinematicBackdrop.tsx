/**
 * Full-bleed cinematic atmosphere — muted looping video + veil + grain.
 * Falls back to CSS field when video unavailable or reduced-motion is on.
 */

import React, { useEffect, useRef, useState } from 'react';

export type AtmosphereVariant = 'hero' | 'auth' | 'facility' | 'ritual';

const SOURCES: Record<AtmosphereVariant, { mp4: string; poster?: string }> = {
  hero: { mp4: '/atmosphere/hero-field.mp4' },
  auth: { mp4: '/atmosphere/hero-field.mp4' },
  facility: { mp4: '/atmosphere/facility-grid.mp4' },
  ritual: { mp4: '/atmosphere/ritual-pulse.mp4' },
};

const VEIL: Record<AtmosphereVariant, string> = {
  hero:
    'linear-gradient(180deg, rgba(5,6,8,0.35) 0%, rgba(5,6,8,0.55) 45%, rgba(5,6,8,0.82) 100%), radial-gradient(ellipse 80% 60% at 50% 20%, rgba(34,211,238,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(245,158,11,0.08), transparent 50%)',
  auth:
    'linear-gradient(160deg, rgba(5,6,8,0.45) 0%, rgba(5,6,8,0.72) 50%, rgba(5,6,8,0.9) 100%), radial-gradient(ellipse 70% 50% at 30% 30%, rgba(34,211,238,0.1), transparent 60%)',
  facility:
    'linear-gradient(180deg, rgba(5,5,6,0.72) 0%, rgba(5,5,6,0.88) 100%), radial-gradient(ellipse 60% 40% at 15% 0%, rgba(34,211,238,0.06), transparent)',
  ritual:
    'linear-gradient(180deg, rgba(6,8,14,0.4) 0%, rgba(5,6,8,0.75) 70%, rgba(5,6,8,0.92) 100%), radial-gradient(ellipse 70% 50% at 50% 40%, rgba(34,211,238,0.14), transparent 60%), radial-gradient(ellipse 40% 30% at 70% 70%, rgba(245,158,11,0.1), transparent)',
};

const VIDEO_OPACITY: Record<AtmosphereVariant, number> = {
  hero: 0.55,
  auth: 0.4,
  facility: 0.22,
  ritual: 0.48,
};

type Props = {
  variant?: AtmosphereVariant;
  className?: string;
  /** Extra dimming for busy UI (facility map) */
  dim?: boolean;
};

export function CinematicBackdrop({
  variant = 'facility',
  className = '',
  dim = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(true);
  const [ready, setReady] = useState(false);
  const src = SOURCES[variant];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setUseVideo(false);
      return;
    }
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const play = () => {
      v.play().then(() => setReady(true)).catch(() => setUseVideo(false));
    };
    if (v.readyState >= 2) play();
    else v.addEventListener('loadeddata', play, { once: true });
    return () => v.removeEventListener('loadeddata', play);
  }, [variant]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {/* CSS base field — always present */}
      <div className={`absolute inset-0 atmosphere-base atmosphere-${variant}`} />

      {useVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover scale-105 transition-opacity duration-1000"
          style={{ opacity: ready ? (dim ? 0.12 : VIDEO_OPACITY[variant]) : 0 }}
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

      {/* Color grade + vignette */}
      <div
        className="absolute inset-0"
        style={{ background: VEIL[variant] }}
      />
      <div className="absolute inset-0 atmosphere-vignette" />
      <div className="absolute inset-0 atmosphere-grain" />
      <div className="absolute inset-0 bg-cyber-grid bg-[size:36px_36px] opacity-[0.04]" />
    </div>
  );
}

export default CinematicBackdrop;
