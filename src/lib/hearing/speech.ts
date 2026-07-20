/**
 * Hearing Mode speech — neural Gemini voice first (warm / real).
 * Browser speechSynthesis is disabled by default (sounds like cheap TTS).
 */

import { classifyUserError, toUserError, type UserErrorCode } from '../user-errors';

export type SpeechSupport = {
  tts: boolean;
  stt: boolean;
  neural: boolean;
};

export type SpeakStyle = 'guide' | 'soft' | 'clear';

export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  style?: SpeakStyle;
  /** Force browser TTS (off unless HEARING_ALLOW_BROWSER_TTS). */
  allowBrowser?: boolean;
};

export type SpeakResult = {
  ok: boolean;
  code?: UserErrorCode;
  message?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

let neuralAvailable: boolean | null = null;
let activeAudio: HTMLAudioElement | null = null;
let speakGeneration = 0;
let activeRecognition: SpeechRecognitionLike | null = null;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function browserTtsAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('browserTts') === '1';
  } catch {
    return false;
  }
}

export async function probeNeuralVoice(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/hearing/voice', { credentials: 'same-origin' });
    if (!res.ok) {
      neuralAvailable = false;
      return false;
    }
    const data = (await res.json()) as { ready?: boolean };
    neuralAvailable = Boolean(data.ready);
    return neuralAvailable;
  } catch {
    neuralAvailable = false;
    return false;
  }
}

export function getSpeechSupport(): SpeechSupport {
  if (typeof window === 'undefined') return { tts: false, stt: false, neural: false };
  const neural = neuralAvailable === true;
  const browser =
    typeof window.speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
  return {
    neural,
    stt: Boolean(getRecognitionCtor()),
    // Prefer neural; browser only counts if explicitly allowed
    tts: neural || (browserTtsAllowed() && browser),
  };
}

/** Kept for SoundContext warm-up; no-op for neural path. */
export function warmSpeechVoices(): void {
  void probeNeuralVoice();
}

export function pickSympatheticVoice(): SpeechSynthesisVoice | null {
  return null;
}

export function cancelSpeak(): void {
  speakGeneration += 1;
  if (activeAudio) {
    try {
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.pause();
      activeAudio.removeAttribute('src');
      activeAudio.load();
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function playBlob(blob: Blob, volume: number, gen: number): Promise<void> {
  return new Promise((resolve) => {
    if (gen !== speakGeneration) {
      resolve();
      return;
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio();
    activeAudio = audio;
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.src = url;

    const finish = () => {
      URL.revokeObjectURL(url);
      if (activeAudio === audio) activeAudio = null;
      resolve();
    };

    audio.onended = finish;
    audio.onerror = finish;
    void audio.play().catch(() => finish());
  });
}

async function speakNeural(
  text: string,
  style: SpeakStyle,
  volume: number,
  gen: number
): Promise<SpeakResult> {
  try {
    const res = await fetch('/api/hearing/speak', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, style }),
    });
    if (!res.ok) {
      if (res.status === 503 || res.status === 429) neuralAvailable = false;
      let code: string | undefined;
      let serverMessage: string | undefined;
      try {
        const body = (await res.json()) as { error?: string; message?: string };
        code = body.error;
        serverMessage = body.message;
      } catch {
        // non-JSON error body
      }
      const classified = classifyUserError({
        code,
        status: res.status,
        detail: serverMessage,
        context: 'hearing',
      });
      return {
        ok: false,
        code: classified,
        message:
          serverMessage ||
          toUserError({ code: classified, status: res.status, context: 'hearing' }),
      };
    }
    neuralAvailable = true;
    const blob = await res.blob();
    if (gen !== speakGeneration) return { ok: true };
    await playBlob(blob, volume, gen);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: toUserError({
        code: 'network_unavailable',
        detail: err instanceof Error ? err.message : String(err),
        context: 'hearing',
      }),
      code: 'network_unavailable',
    };
  }
}

/**
 * Speak with neural Gemini voice (warm Sulafat).
 * Browser TTS only if ?browserTts=1 — otherwise stay quiet if neural fails.
 * Returns ok/message so Hearing UI can explain silent failures.
 */
export async function speak(text: string, opts?: SpeakOptions): Promise<SpeakResult> {
  const line = text.trim();
  if (!line) return { ok: true };

  cancelSpeak();
  const gen = speakGeneration;
  const style = opts?.style ?? 'guide';
  const volume = opts?.volume ?? (style === 'soft' ? 0.88 : 0.96);

  if (neuralAvailable === null) {
    await probeNeuralVoice();
  }

  const result = await speakNeural(line, style, volume, gen);
  if (result.ok || gen !== speakGeneration) return result.ok ? { ok: true } : result;

  if (opts?.allowBrowser || browserTtsAllowed()) {
    await speakBrowserFallback(line, gen);
    return { ok: true };
  }
  return result;
}

function speakBrowserFallback(text: string, gen: number): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve();
  return new Promise((resolve) => {
    if (gen !== speakGeneration) {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88;
    u.pitch = 1.02;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/** Rejects the in-flight listenOnce when mute/speak interrupts recognition. */
let abortActiveListen: (() => void) | null = null;

export function stopListening(): void {
  const abort = abortActiveListen;
  abortActiveListen = null;
  try {
    if (activeRecognition) {
      activeRecognition.onresult = null;
      activeRecognition.onerror = null;
      activeRecognition.onend = null;
      activeRecognition.abort();
    }
  } catch {
    // ignore
  }
  activeRecognition = null;
  // Unblock the pending listenOnce so mute/speak can switch overlays immediately.
  abort?.();
}

/** True while neural guide audio (or browser TTS) is actually playing. */
export function isGuideSpeaking(): boolean {
  if (activeAudio && !activeAudio.paused && !activeAudio.ended) return true;
  if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) return true;
  return false;
}

export function listenOnce(opts?: { lang?: string; timeoutMs?: number }): Promise<string> {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return Promise.reject(new Error('stt_unsupported'));

  stopListening();

  return new Promise((resolve, reject) => {
    const rec = new Ctor();
    activeRecognition = rec;
    rec.lang = opts?.lang ?? 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    const timeoutMs = opts?.timeoutMs ?? 14_000;
    let settled = false;
    const timer = window.setTimeout(() => {
      finish(() => reject(new Error('stt_timeout')));
      try {
        rec.abort();
      } catch {
        // ignore
      }
    }, timeoutMs);

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (abortActiveListen) abortActiveListen = null;
      if (activeRecognition === rec) activeRecognition = null;
      fn();
    };

    abortActiveListen = () => finish(() => reject(new Error('stt_aborted')));

    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript?.trim() || '';
      finish(() => {
        if (transcript) resolve(transcript);
        else reject(new Error('stt_empty'));
      });
    };

    rec.onerror = (ev) => {
      // aborted is expected when mute/speak interrupts — treat as soft end
      const code = ev.error || 'stt_error';
      if (code === 'aborted' || code === 'no-speech') {
        finish(() => reject(new Error(code === 'aborted' ? 'stt_aborted' : 'stt_empty')));
        return;
      }
      finish(() => reject(new Error(code)));
    };

    rec.onend = () => {
      if (settled) return;
      finish(() => reject(new Error('stt_ended')));
    };

    try {
      rec.start();
    } catch {
      finish(() => reject(new Error('stt_start_failed')));
    }
  });
}

/** @deprecated phrase split only used by browser path — kept for tests */
export function splitForBreath(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
