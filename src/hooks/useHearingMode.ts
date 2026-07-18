/**
 * Hearing Mode controller — TTS, listen loop, barge-in, persistence.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelSpeak,
  getSpeechSupport,
  listenOnce,
  speak,
  stopListening,
  type SpeechSupport,
} from '../lib/hearing/speech';
import { parseHearingCommand, type HearingCommand } from '../lib/hearing/commands';
import {
  exitScript,
  helpScript,
  unknownCommandScript,
  unsupportedScript,
  welcomeScript,
} from '../lib/hearing/scripts';
import { track } from '../lib/attention-metrics';

export const HEARING_STORAGE_KEY = 'culture_hearing_v1';
export const HEARING_BANNER_KEY = 'culture_hearing_banner_v1';

export type HearingPhase = 'idle' | 'speaking' | 'listening';

export type HearingModeApi = {
  active: boolean;
  phase: HearingPhase;
  lastLine: string;
  support: SpeechSupport;
  micEnabled: boolean;
  setMicEnabled: (on: boolean) => void;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
  speakLine: (text: string) => Promise<void>;
  handleCommand: (cmd: HearingCommand) => Promise<void>;
};

export type HearingCommandHandler = (
  cmd: HearingCommand,
  ctx: { speakLine: (text: string) => Promise<void>; lastLine: string }
) => Promise<boolean> | boolean;

function readStoredActive(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('hear') === '1' || params.get('hear') === 'true') return true;
    return localStorage.getItem(HEARING_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistActive(on: boolean): void {
  try {
    localStorage.setItem(HEARING_STORAGE_KEY, on ? '1' : '0');
  } catch {
    // ignore
  }
}

export function useHearingMode(onCommand: HearingCommandHandler): HearingModeApi {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<HearingPhase>('idle');
  const [lastLine, setLastLine] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [support] = useState<SpeechSupport>(() => getSpeechSupport());

  const activeRef = useRef(false);
  const micRef = useRef(true);
  const lastLineRef = useRef('');
  const loopGenRef = useRef(0);
  const onCommandRef = useRef(onCommand);
  const bootedRef = useRef(false);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    micRef.current = micEnabled;
  }, [micEnabled]);

  const speakLine = useCallback(async (text: string) => {
    const line = text.trim();
    if (!line) return;
    lastLineRef.current = line;
    setLastLine(line);
    setPhase('speaking');
    stopListening();
    try {
      await speak(line);
    } finally {
      if (activeRef.current) setPhase('idle');
      else setPhase('idle');
    }
  }, []);

  const handleCommand = useCallback(
    async (cmd: HearingCommand) => {
      track('hearing_command', { cmd });
      if (cmd === 'stop') {
        cancelSpeak();
        setPhase('idle');
        return;
      }
      if (cmd === 'repeat') {
        if (lastLineRef.current) await speakLine(lastLineRef.current);
        return;
      }
      if (cmd === 'help') {
        await speakLine(helpScript());
        return;
      }
      if (cmd === 'exit') {
        await speakLine(exitScript());
        loopGenRef.current += 1;
        stopListening();
        cancelSpeak();
        activeRef.current = false;
        setActive(false);
        persistActive(false);
        setPhase('idle');
        track('hearing_exit', { reason: 'command' });
        return;
      }

      const handled = await onCommandRef.current(cmd, {
        speakLine,
        lastLine: lastLineRef.current,
      });
      if (!handled && cmd !== 'unknown') {
        // Command reserved for app but not handled this tick — stay quiet.
        return;
      }
      if (!handled) {
        await speakLine(unknownCommandScript());
      }
    },
    [speakLine]
  );

  const listenLoop = useCallback(
    async (gen: number) => {
      while (activeRef.current && gen === loopGenRef.current) {
        if (!micRef.current || !support.stt) {
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        // Don't listen over TTS
        if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        setPhase('listening');
        try {
          const transcript = await listenOnce({ timeoutMs: 10_000 });
          if (!activeRef.current || gen !== loopGenRef.current) return;
          cancelSpeak(); // barge-in
          const cmd = parseHearingCommand(transcript);
          await handleCommand(cmd);
        } catch {
          // timeout / abort — continue loop
        } finally {
          if (activeRef.current && gen === loopGenRef.current) {
            setPhase((p) => (p === 'listening' ? 'idle' : p));
          }
        }
        await new Promise((r) => setTimeout(r, 280));
      }
    },
    [handleCommand, support.stt]
  );

  const enable = useCallback(() => {
    const s = getSpeechSupport();
    if (!s.tts && !s.stt) {
      void speakLine(unsupportedScript(s));
      return;
    }
    loopGenRef.current += 1;
    const gen = loopGenRef.current;
    activeRef.current = true;
    setActive(true);
    persistActive(true);
    track('hearing_open', { tts: s.tts, stt: s.stt });
    void (async () => {
      if (!s.tts) {
        await speakLine(unsupportedScript(s));
      } else {
        await speakLine(welcomeScript());
        if (!s.stt) await speakLine(unsupportedScript(s));
      }
      void listenLoop(gen);
    })();
  }, [listenLoop, speakLine]);

  const disable = useCallback(() => {
    loopGenRef.current += 1;
    stopListening();
    cancelSpeak();
    activeRef.current = false;
    setActive(false);
    persistActive(false);
    setPhase('idle');
    track('hearing_exit', { reason: 'toggle' });
    // Soft line — don't await; loop already stopped
    void speak(exitScript()).catch(() => undefined);
  }, []);

  const toggle = useCallback(() => {
    if (activeRef.current) disable();
    else enable();
  }, [disable, enable]);

  // Boot from ?hear=1 / localStorage once
  useEffect(() => {
    if (bootedRef.current) return;
    if (!readStoredActive()) {
      bootedRef.current = true;
      return;
    }
    // Defer so App handlers are ready
    const t = window.setTimeout(() => {
      if (bootedRef.current) return;
      bootedRef.current = true;
      enable();
    }, 400);
    return () => window.clearTimeout(t);
  }, [enable]);

  useEffect(() => {
    return () => {
      loopGenRef.current += 1;
      stopListening();
      cancelSpeak();
    };
  }, []);

  return {
    active,
    phase,
    lastLine,
    support,
    micEnabled,
    setMicEnabled,
    enable,
    disable,
    toggle,
    speakLine,
    handleCommand,
  };
}
