/**
 * Web Speech API wrappers — TTS + one-shot STT for Hearing Mode.
 */

export type SpeechSupport = {
  tts: boolean;
  stt: boolean;
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

let activeRecognition: SpeechRecognitionLike | null = null;

export function cancelSpeak(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function speak(
  text: string,
  opts?: { rate?: number; pitch?: number; lang?: string }
): Promise<void> {
  const support = getSpeechSupport();
  if (!support.tts || !text.trim()) return Promise.resolve();

  cancelSpeak();

  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = opts?.rate ?? 1.02;
    u.pitch = opts?.pitch ?? 1;
    u.lang = opts?.lang ?? 'en-US';
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
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

    const timeoutMs = opts?.timeoutMs ?? 12_000;
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
      // If we already resolved/rejected, activeRecognition is cleared.
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
