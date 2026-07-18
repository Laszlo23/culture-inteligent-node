/**
 * Conversion rails — every completed beat should open the next win
 * (retention → distribution → cash) without selling the free core.
 *
 * Priority after the product loop is clear:
 * 1) Spread (distribution)
 * 2) Partner Attention Session (first real $)
 * 3) Soft 1¢ toll (when settlement ready)
 */

export type WinRoom =
  | 'partners'
  | 'treasury'
  | 'onboarding'
  | 'passport'
  | 'lab'
  | 'map';

export type WinRail = {
  id: 'partner' | 'toll' | 'discord' | 'hear';
  label: string;
  reason: string;
  room?: WinRoom;
  href?: string;
};

export type ClearLoopNext = {
  id: WinRoom;
  label: string;
  reason: string;
  /** Secondary rails shown under the primary CTA */
  rails: WinRail[];
};

/**
 * When Hear→Spark→Zen→Spread→Return is warm and nothing is due,
 * point at revenue + distribution — not an empty reactor tour.
 */
export function clearLoopWinningNext(input: {
  you: string;
  tollReady: boolean;
  hasPassport: boolean;
}): ClearLoopNext {
  const you = input.you;
  const rails: WinRail[] = [
    {
      id: 'partner',
      label: 'Partner pilot',
      reason: 'Attention Session — first cash or trade case study',
      room: 'partners',
    },
    {
      id: 'discord',
      label: 'Discord HQ',
      reason: 'Houses + Hearing ritual — keep the club warm',
      room: 'onboarding',
    },
  ];
  if (input.tollReady) {
    rails.unshift({
      id: 'toll',
      label: '1¢ spark refill',
      reason: 'Optional fuel when the reactor is dry — free core stays free',
      room: 'treasury',
    });
  }

  if (!input.hasPassport) {
    return {
      id: 'passport',
      label: 'Claim Human Passport',
      reason: `${you}, ownership first — then Spread and grow the club.`,
      rails,
    };
  }

  return {
    id: 'partners',
    label: 'Book a Partner Session',
    reason: `${you}, the loop is warm — ship one Attention Session (pilot $0–$1.5k or trade). That’s the first dollar.`,
    rails,
  };
}

/** Bot / partner deep links after a win beat */
export function winningDeepLinks(appBase: string): Array<{ label: string; url: string }> {
  const base = appBase.replace(/\/?$/, '/');
  return [
    { label: 'Academy · Spark', url: `${base}?room=lab` },
    { label: 'Partner pilot', url: `${base}?room=partners` },
    { label: 'Vault · claim / 1¢', url: `${base}?room=treasury` },
    { label: 'Hearing Mode', url: `${base}?hear=1` },
  ];
}
