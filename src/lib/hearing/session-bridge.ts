/**
 * Bridge so AttentionSessionPlayer / ConversationalProof can claim voice
 * commands and free-speech dictation while a session is open.
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

/** Free-speech capture into the active conversational proof beat. */
export type HearingDictationApi = {
  onTranscript: (transcript: string) => boolean;
  onAdvance: () => boolean | Promise<boolean>;
};

let dictation: HearingDictationApi | null = null;

export function setHearingDictationHandler(next: HearingDictationApi | null): void {
  dictation = next;
}

export function isHearingDictationActive(): boolean {
  return Boolean(dictation);
}

export function dispatchHearingDictation(transcript: string): boolean {
  if (!dictation) return false;
  return dictation.onTranscript(transcript);
}

export async function dispatchHearingAdvance(): Promise<boolean> {
  if (!dictation) return false;
  return Boolean(await dictation.onAdvance());
}
