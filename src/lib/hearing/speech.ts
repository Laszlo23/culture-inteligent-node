/**
 * Web Speech API wrappers — warm guide TTS + one-shot STT for Hearing Mode.
 * Voice profile: smooth, easy-going, sympathetic — a listening companion.
 */

export type SpeechSupport = {
  tts: boolean;
  stt: boolean;
};

export type SpeakStyle = 'guide' | 'soft' | 'clear';

export type SpeakOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  style?: SpeakStyle;
  /** Skip cancel of current speech (rare). */
  append?: boolean;
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

/** Preferred warm / sympathetic English voices (macOS, Windows, Chrome). */
const GUIDE_VOICE_PATTERNS: RegExp[] = [
  /samantha/i,
  /karen/i,
  /moira/i,
  /fiona/i,
  /victoria/i,
  /tessa/i,
  /serena/i,
  /aria/i,
  /jenny/i,
  /sara/i,
  /zira/i,
  /google uk english female/i,
  /google us english/i,
  /microsoft (aria|jenny|sara|zira)/i,
  /natural/i,
  /neural/i,
  /premium/i,
  /enhanced/i,
  /female/i,
];

const STYLE_DEFAULTS: Record<
  SpeakStyle,
  { rate: number; pitch: number; volume: number; pauseMs: number }
> = {
  /** Primary Hearing Mode guide — unhurried, kind */
  guide: { rate: 0.86, pitch: 1.02, volume: 0.94, pauseMs: 420 },
  /** Whisper-soft asides */
  soft: { rate: 0.82, pitch: 1.04, volume: 0.78, pauseMs: 520 },
  /** Slightly clearer for long command lists */
  clear: { rate: 0.9, pitch: 1.0, volume: 0.95, pauseMs: 300 },
};

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function getSpeechSupport(): SpeechSupport {
  if (typeof window === 'undefined') return { tts: false, stt: false };
  return {
    tts: typeof window.speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined',
    stt: Boolean(getRecognitionCtor()),
  };
}

let cachedGuideVoice: SpeechSynthesisVoice | null | undefined;

/** Warm English voice — sympathetic first, then any en. */
export function pickSympatheticVoice(
  voices?: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const list = voices ?? window.speechSynthesis.getVoices();
  if (!list.length) return null;

  for (const re of GUIDE_VOICE_PATTERNS) {
    const hit = list.find((v) => re.test(v.name) && /^en(-|$)/i.test(v.lang));
    if (hit) return hit;
  }
  return (
    list.find((v) => /^en(-|$)/i.test(v.lang) && v.localService) ||
    list.find((v) => /^en(-|$)/i.test(v.lang)) ||
    null
  );
}

function resolveGuideVoice(): SpeechSynthesisVoice | null {
  if (cachedGuideVoice !== undefined) {
    const stillThere =
      cachedGuideVoice &&
      window.speechSynthesis.getVoices().some((v) => v.voiceURI === cachedGuideVoice!.voiceURI);
    if (stillThere || cachedGuideVoice === null) return cachedGuideVoice;
  }
  cachedGuideVoice = pickSympatheticVoice();
  return cachedGuideVoice;
}

/** Warm voices load async on Chrome — refresh cache. */
export function warmSpeechVoices(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const refresh = () => {
    cachedGuideVoice = undefined;
    resolveGuideVoice();
  };
  refresh();
  window.speechSynthesis.addEventListener('voiceschanged', refresh, { once: true });
}

let activeRecognition: SpeechRecognitionLike | null = null;
let speakGeneration = 0;

export function cancelSpeak(): void {
  speakGeneration += 1;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Split into breathable phrases so the guide never rushes. */
export function splitForBreath(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const parts = cleaned
    .split(/(?<=[.!?…])\s+|\s+[—–]\s+|\s+·\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const part of parts) {
    if (part.length <= 160) {
      out.push(part);
      continue;
    }
    // Long clause — break on commas / and
    const bits = part.split(/(?<=,)\s+|\s+(?=and\s)/i);
    let buf = '';
    for (const bit of bits) {
      if ((buf + ' ' + bit).trim().length > 140 && buf) {
        out.push(buf.trim());
        buf = bit;
      } else {
        buf = buf ? `${buf} ${bit}` : bit;
      }
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out.length ? out : [cleaned];
}

function utterOnce(
  text: string,
  opts: {
    rate: number;
    pitch: number;
    volume: number;
    lang: string;
    voice: SpeechSynthesisVoice | null;
  }
): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate;
    u.pitch = opts.pitch;
    u.volume = opts.volume;
    u.lang = opts.lang;
    if (opts.voice) u.voice = opts.voice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/**
 * Speak with a sympathetic guide voice.
 * Phrases are paced with soft pauses — listening / enlightened feel.
 */
export async function speak(text: string, opts?: SpeakOptions): Promise<void> {
  const support = getSpeechSupport();
  if (!support.tts || !text.trim()) return;

  const style = opts?.style ?? 'guide';
  const defaults = STYLE_DEFAULTS[style];
  const rate = opts?.rate ?? defaults.rate;
  const pitch = opts?.pitch ?? defaults.pitch;
  const volume = opts?.volume ?? defaults.volume;
  const lang = opts?.lang ?? 'en-US';
  const pauseMs = defaults.pauseMs;

  if (!opts?.append) {
    cancelSpeak();
  }
  const gen = speakGeneration;

  // Chrome: kick voices if empty
  if (!window.speechSynthesis.getVoices().length) {
    warmSpeechVoices();
    await sleep(80);
  }

  const voice = resolveGuideVoice();
  const phrases = splitForBreath(text);

  for (let i = 0; i < phrases.length; i++) {
    if (gen !== speakGeneration) return;
    const phrase = phrases[i];
    await utterOnce(phrase, { rate, pitch, volume, lang, voice });
    if (gen !== speakGeneration) return;
    if (i < phrases.length - 1) {
      await sleep(pauseMs);
    }
  }
}

export function stopListening(): void {
  if (!activeRecognition) return;
  try {
    activeRecognition.onresult = null;
    activeRecognition.onerror = null;
    activeRecognition.onend = null;
    activeRecognition.abort();
  } catch {
    // ignore
  }
  activeRecognition = null;
}

/**
 * Listen once for a final transcript. Rejects with a short error code string.
 */
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
    const timer = window.setTimeout(() => {
      try {
        rec.abort();
      } catch {
        // ignore
      }
      if (activeRecognition === rec) activeRecognition = null;
      reject(new Error('stt_timeout'));
    }, timeoutMs);

    const finish = (fn: () => void) => {
      window.clearTimeout(timer);
      if (activeRecognition === rec) activeRecognition = null;
      fn();
    };

    rec.onresult = (ev) => {
      const transcript = ev.results?.[0]?.[0]?.transcript?.trim() || '';
      finish(() => {
        if (transcript) resolve(transcript);
        else reject(new Error('stt_empty'));
      });
    };

    rec.onerror = (ev) => {
      finish(() => reject(new Error(ev.error || 'stt_error')));
    };

    rec.onend = () => {
      if (activeRecognition !== rec) return;
      finish(() => reject(new Error('stt_ended')));
    };

    try {
      rec.start();
    } catch {
      finish(() => reject(new Error('stt_start_failed')));
    }
  });
}
