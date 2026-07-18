/**
 * Compatibility shim — Culture Club oath → Human Passport.
 * Prefer importing from ./human-passport for new code.
 */

export {
  hasClubOath,
  hasSpreadLove,
  markSpreadLove,
  buildMemberInvitePost,
  claimHumanPassport as signClubOath,
  getHumanPassport as getClubOath,
  saveHumanPassport as saveClubOath,
  buildPassportMessage as buildClubOathMessage,
  HUMAN_PASSPORT_VERSION as CLUB_OATH_VERSION,
  HUMAN_PASSPORT_STORAGE_KEY as CLUB_OATH_STORAGE_KEY,
  PASSPORT_INVITE_KEY as CLUB_SPREAD_KEY,
  type HumanPassportRecord as ClubOathRecord,
} from './human-passport';

import { PASSPORT_PRINCIPLES } from './human-economy';

/** @deprecated Prefer PASSPORT_PRINCIPLES */
export const CLUB_RULES = PASSPORT_PRINCIPLES.map((p, i) => ({
  n: i + 1,
  line: p.title,
  sub: p.line,
}));
