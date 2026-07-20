/**
 * Product roadmap — one distinct video + poster per phase.
 * Drop replacement mp4s in public/roadmap/ to upgrade later.
 */

export type RoadmapPhaseId = 'now' | 'next' | 'soon' | 'horizon';

export type RoadmapPhaseMedia = {
  id: RoadmapPhaseId;
  video: string;
  poster: string;
  caption: string;
};

export const ROADMAP_PHASE_MEDIA: Record<RoadmapPhaseId, RoadmapPhaseMedia> = {
  now: {
    id: 'now',
    video: '/roadmap/now.mp4',
    poster: '/roadmap/now-poster.webp',
    caption: 'Culture Node live — 2D attention mining on screen',
  },
  next: {
    id: 'next',
    video: '/roadmap/next.mp4',
    poster: '/roadmap/next-poster.webp',
    caption: 'Weekly intelligence — research drops into the Academy',
  },
  soon: {
    id: 'soon',
    video: '/roadmap/soon.mp4',
    poster: '/roadmap/soon-poster.webp',
    caption: 'Creator labs — builders author high-signal modules',
  },
  horizon: {
    id: 'horizon',
    video: '/roadmap/horizon.mp4',
    poster: '/roadmap/horizon-poster.webp',
    caption: 'AR attention mining — focus drills in the real world',
  },
};
