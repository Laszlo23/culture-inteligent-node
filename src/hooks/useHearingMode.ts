/**
 * Hearing Mode controller — warm guide TTS, listen loop, barge-in, soft pad.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  cancelSpeak,
  getSpeechSupport,
  isGuideSpeaking,
  listenOnce,
  probeNeuralVoice,
  speak,
  stopListening,
  warmSpeechVoices,
  type SpeechSupport,
} from '../lib/hearing/speech';
import { parseHearingCommand, type HearingCommand } from '../lib/hearing/commands';
import {
  dispatchHearingAdvance,
  dispatchHearingDictation,
  isHearingDictationActive,
} from '../lib/hearing/session-bridge';
import {
  exitScript,
  helpScript,
  unknownCommandScript,
  unsupportedScript,
  welcomeScript,
} from '../lib/hearing/scripts';
import { track } from '../lib/attention-metrics';
import { soundEngine } from '../lib/sound/engine';
import { toUserError, userErrorClassKey } from '../lib/user-errors';

const HEARING_ERROR_THROTTLE_MS = 45_000;

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

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function useHearingMode(onCommand: HearingCommandHandler): HearingModeApi {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<HearingPhase>('idle');
  const [lastLine, setLastLine] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [support, setSupport] = useState<SpeechSupport>(() => getSpeechSupport());

  const activeRef = useRef(false);
  const micRef = useRef(true);
  const speakingRef = useRef(false);
  const lastLineRef = useRef('');
  const loopGenRef = useRef(0);
  const onCommandRef = useRef(onCommand);
  const bootedRef = useRef(false);
  const lastErrorClassAtRef = useRef<Map<string, number>>(new Map());

  const showSpeakError = useCallback((code?: string, message?: string) => {
    const msg =
      message ||
      toUserError({ code: code || 'tts_failed', context: 'hearing' });
    const classKey = userErrorClassKey({ code, detail: msg, context: 'hearing' });
    const lastAt = lastErrorClassAtRef.current.get(classKey) || 0;
    if (Date.now() - lastAt < HEARING_ERROR_THROTTLE_MS) return;
    lastErrorClassAtRef.current.set(classKey, Date.now());
    lastLineRef.current = msg;
    setLastLine(msg);
  }, []);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    micRef.current = micEnabled;
  }, [micEnabled]);

  useEffect(() => {
    warmSpeechVoices();
    void probeNeuralVoice().then(() => setSupport(getSpeechSupport()));
  }, []);

  /** Mute/unmute — must abort an in-flight listen so the browser mic indicator clears. */
  const setMicEnabledSafe = useCallback((on: boolean) => {
    micRef.current = on;
    setMicEnabled(on);
    if (!on) {
      stopListening();
      setPhase((p) => (p === 'listening' ? 'idle' : p));
      track('hearing_mic', { on: false });
    } else {
      track('hearing_mic', { on: true });
    }
  }, []);

  const speakLine = useCallback(async (text: string) => {
    const line = text.trim();
    if (!line) return;
    lastLineRef.current = line;
    setLastLine(line);
    speakingRef.current = true;
    setPhase('speaking');
    stopListening();
    soundEngine.setNarrationActive(true);
    try {
      const result = await speak(line, { style: 'guide' });
      if (!result.ok) showSpeakError(result.code, result.message);
      // Contemplative beat before the mic opens — enlightened pause
      if (activeRef.current) await pause(480);
    } finally {
      soundEngine.setNarrationActive(false);
      speakingRef.current = false;
      setPhase('idle');
    }
  }, [showSpeakError]);

  const handleCommand = useCallback(
    async (cmd: HearingCommand) => {
      track('hearing_command', { cmd });
      if (cmd === 'stop') {
        cancelSpeak();
        soundEngine.setNarrationActive(false);
        setPhase('idle');
        return;
      }
      if (cmd === 'repeat') {
        if (lastLineRef.current) await speakLine(lastLineRef.current);
        return;
      }
      if (cmd === 'help') {
        // Clearer pacing for the longer command list
        const line = helpScript();
        lastLineRef.current = line;
        setLastLine(line);
        speakingRef.current = true;
        setPhase('speaking');
        stopListening();
        soundEngine.setNarrationActive(true);
        try {
          const result = await speak(line, { style: 'clear' });
          if (!result.ok) showSpeakError(result.code, result.message);
          if (activeRef.current) await pause(400);
        } finally {
          soundEngine.setNarrationActive(false);
          speakingRef.current = false;
          setPhase('idle');
        }
        return;
      }
      if (cmd === 'exit') {
        await speakLine(exitScript());
        loopGenRef.current += 1;
        stopListening();
        cancelSpeak();
        soundEngine.setHearingBed(false);
        soundEngine.setNarrationActive(false);
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
        return;
      }
      if (!handled) {
        await speakLine(unknownCommandScript());
      }
    },
    [speakLine, showSpeakError]
  );

  const listenLoop = useCallback(
    async (gen: number) => {
      while (activeRef.current && gen === loopGenRef.current) {
        if (!micRef.current || !support.stt) {
          await pause(600);
          continue;
        }
        // Neural Gemini TTS uses HTMLAudioElement — not speechSynthesis.
        // Wait until the guide finishes or we'll steal the mic mid-sentence.
        if (speakingRef.current || isGuideSpeaking()) {
          await pause(220);
          continue;
        }
        setPhase('listening');
        try {
          const transcript = await listenOnce({ timeoutMs: 14_000 });
          if (!activeRef.current || gen !== loopGenRef.current) return;
          if (!micRef.current) continue;
          cancelSpeak(); // barge-in
          const cmd = parseHearingCommand(transcript);

          // Conversational proof owns the mic: free speech → beat, next/done advances.
          // Only stop/exit/help/repeat escape as global Hearing commands.
          // Important: always consume `next` so "next" never gets dictated into the answer.
          if (isHearingDictationActive()) {
            if (cmd === 'next') {
              await dispatchHearingAdvance();
              continue;
            }
            if (cmd === 'stop' || cmd === 'exit' || cmd === 'help' || cmd === 'repeat') {
              await handleCommand(cmd);
              continue;
            }
            if (dispatchHearingDictation(transcript)) continue;
          }

          await handleCommand(cmd);
        } catch {
          // timeout / abort / mute — continue loop
        } finally {
          if (activeRef.current && gen === loopGenRef.current) {
            setPhase((p) => (p === 'listening' ? 'idle' : p));
          }
        }
        await pause(360);
      }
    },
    [handleCommand, support.stt]
  );

  const enable = useCallback(() => {
    void soundEngine.unlock();
    soundEngine.setHearingBed(true);
    loopGenRef.current += 1;
    const gen = loopGenRef.current;
    activeRef.current = true;
    setActive(true);
    persistActive(true);
    void (async () => {
      await probeNeuralVoice();
      const s = getSpeechSupport();
      setSupport(s);
      track('hearing_open', { tts: s.tts, stt: s.stt, neural: s.neural });
      await pause(280);
      if (!s.neural) {
        const miss = toUserError({ code: 'neural_voice_unavailable', context: 'hearing' });
        lastLineRef.current = miss;
        setLastLine(miss);
        setPhase('idle');
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
    soundEngine.setHearingBed(false);
    soundEngine.setNarrationActive(false);
    activeRef.current = false;
    setActive(false);
    persistActive(false);
    setPhase('idle');
    track('hearing_exit', { reason: 'toggle' });
    void speak(exitScript(), { style: 'soft' }).catch(() => undefined);
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
    const t = window.setTimeout(() => {
      if (bootedRef.current) return;
      bootedRef.current = true;
      enable();
    }, 500);
    return () => window.clearTimeout(t);
  }, [enable]);

  useEffect(() => {
    return () => {
      loopGenRef.current += 1;
      stopListening();
      cancelSpeak();
      soundEngine.setHearingBed(false);
      soundEngine.setNarrationActive(false);
    };
  }, []);

  return {
    active,
    phase,
    lastLine,
    support,
    micEnabled,
    setMicEnabled: setMicEnabledSafe,
    enable,
    disable,
    toggle,
    speakLine,
    handleCommand,
  };
}
