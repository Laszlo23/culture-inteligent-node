/** Mood keys shared with CinematicPanel / StoryChapterArt */
export type DeckMood = 'opening' | 'problem' | 'awakening' | 'spark' | 'evolution' | 'facility';

export type DeckSlide = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  accent?: string;
  mood?: DeckMood;
  /** Label for optional per-slide CTA; parent wires onCta(slideId). */
  ctaLabel?: string;
};
