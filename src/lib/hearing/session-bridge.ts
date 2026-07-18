/**
 * Bridge so AttentionSessionPlayer can claim voice commands while a session is open.
 */

import type { HearingCommand } from './commands';

type SessionHandler = (cmd: HearingCommand) => Promise<boolean> | boolean;

let handler: SessionHandler | null = null;

export function setHearingSessionHandler(next: SessionHandler | null): void {
  handler = next;
}

export async function dispatchHearingSessionCommand(cmd: HearingCommand): Promise<boolean> {
  if (!handler) return false;
  return Boolean(await handler(cmd));
}
