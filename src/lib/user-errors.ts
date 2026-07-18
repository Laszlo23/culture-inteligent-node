/**
 * Plain-language member errors — never raw SDK dumps, env vars, or funding language.
 */

export type UserErrorContext = 'hearing' | 'coach' | 'api';

export type UserErrorCode =
  | 'gemini_key_missing'
  | 'neural_voice_unavailable'
  | 'api_credits_exhausted'
  | 'rate_limited'
  | 'network_unavailable'
  | 'tts_failed'
  | 'coach_unavailable'
  | 'auth_required'
  | 'unknown';

export type UserErrorInput = {
  code?: string | null;
  status?: number | null;
  detail?: string | null;
  message?: string | null;
  context?: UserErrorContext;
};

const COPY: Record<UserErrorCode, Record<UserErrorContext | 'default', string>> = {
  gemini_key_missing: {
    hearing:
      'Voice guide isn’t set up yet. You can still read the text and use on-screen controls.',
    coach: 'Coach isn’t set up yet — we used a simple check instead.',
    api: 'This guide isn’t set up yet. Try again later.',
    default:
      'Voice guide isn’t set up yet. You can still read the text and use on-screen controls.',
  },
  neural_voice_unavailable: {
    hearing:
      'Voice guide isn’t set up yet. You can still read the text and use on-screen controls.',
    coach: 'Coach isn’t set up yet — we used a simple check instead.',
    api: 'This guide isn’t available right now.',
    default:
      'Voice guide isn’t set up yet. You can still read the text and use on-screen controls.',
  },
  api_credits_exhausted: {
    hearing: 'Voice guide is out of API credits for now. Text still works — try again later.',
    coach: 'Coach is out of API credits for now — we used a simple check instead.',
    api: 'Out of API credits for now. Try again later.',
    default: 'Out of API credits for now. Try again later.',
  },
  rate_limited: {
    hearing: 'Voice guide is busy. Wait a moment and try again.',
    coach: 'Coach is busy right now — we used a simple check instead.',
    api: 'Too many requests. Wait a moment and try again.',
    default: 'Too many requests. Wait a moment and try again.',
  },
  network_unavailable: {
    hearing: 'Couldn’t reach the voice guide. Check your connection.',
    coach: 'Couldn’t reach the coach — we used a simple check instead.',
    api: 'Couldn’t reach the server. Check your connection.',
    default: 'Couldn’t reach the server. Check your connection.',
  },
  tts_failed: {
    hearing: 'Voice guide couldn’t speak that line. Text still works.',
    coach: 'Coach couldn’t finish — we used a simple check instead.',
    api: 'Something went wrong. Try again in a moment.',
    default: 'Voice guide couldn’t speak that line. Text still works.',
  },
  coach_unavailable: {
    hearing: 'Coach is unavailable right now — we used a simple check instead.',
    coach: 'Coach is unavailable right now — we used a simple check instead.',
    api: 'Coach is unavailable right now — we used a simple check instead.',
    default: 'Coach is unavailable right now — we used a simple check instead.',
  },
  auth_required: {
    hearing: 'Connect your wallet to continue.',
    coach: 'Connect your wallet to continue.',
    api: 'Connect your wallet to continue.',
    default: 'Connect your wallet to continue.',
  },
  unknown: {
    hearing: 'Voice guide couldn’t speak that line. Text still works.',
    coach: 'Coach is unavailable right now — we used a simple check instead.',
    api: 'Something went wrong. Try again in a moment.',
    default: 'Something went wrong. Try again in a moment.',
  },
};

const CODE_ALIASES: Record<string, UserErrorCode> = {
  gemini_key_missing: 'gemini_key_missing',
  neural_voice_unavailable: 'neural_voice_unavailable',
  api_credits_exhausted: 'api_credits_exhausted',
  rate_limited: 'rate_limited',
  network_unavailable: 'network_unavailable',
  tts_failed: 'tts_failed',
  coach_unavailable: 'coach_unavailable',
  auth_required: 'auth_required',
  unauthorized: 'auth_required',
  empty_text: 'tts_failed',
  text_too_long: 'tts_failed',
  no_audio_in_response: 'tts_failed',
};

/** Recoverable API classes — toast cooldown instead of once-forever. */
export const RECOVERABLE_ERROR_CODES: ReadonlySet<UserErrorCode> = new Set([
  'api_credits_exhausted',
  'rate_limited',
  'network_unavailable',
  'tts_failed',
  'coach_unavailable',
]);

const RECOVERABLE_TOAST_COOLDOWN_MS = 45_000;

function haystack(input: UserErrorInput): string {
  return [input.code, input.detail, input.message].filter(Boolean).join(' ').toLowerCase();
}

/**
 * Classify SDK / HTTP / string failures into a stable member-facing code.
 */
export function classifyUserError(input: UserErrorInput): UserErrorCode {
  const codeRaw = String(input.code || '').trim().toLowerCase();
  if (codeRaw && CODE_ALIASES[codeRaw]) return CODE_ALIASES[codeRaw];

  const status = input.status ?? null;
  if (status === 401 || status === 403) return 'auth_required';
  if (status === 503) {
    if (codeRaw.includes('neural') || codeRaw.includes('gemini') || input.context === 'hearing') {
      return 'neural_voice_unavailable';
    }
    return 'network_unavailable';
  }
  if (status === 429) return 'rate_limited';

  const h = haystack(input);

  if (
    h.includes('gemini_key_missing') ||
    h.includes('api key not valid') ||
    h.includes('api_key_invalid') ||
    h.includes('invalid api key') ||
    (h.includes('api key') && (h.includes('missing') || h.includes('not set')))
  ) {
    return 'gemini_key_missing';
  }

  if (
    h.includes('resource_exhausted') ||
    h.includes('quota') ||
    h.includes('billing') ||
    h.includes('insufficient_quota') ||
    (h.includes('credit') && h.includes('exhaust')) ||
    h.includes('exceeded your current quota') ||
    h.includes('out of credits')
  ) {
    return 'api_credits_exhausted';
  }

  if (
    h.includes('rate limit') ||
    h.includes('rate_limit') ||
    h.includes('too many requests') ||
    h.includes('429')
  ) {
    return 'rate_limited';
  }

  if (
    h.includes('failed to fetch') ||
    h.includes('networkerror') ||
    h.includes('network request failed') ||
    h.includes('load failed') ||
    h.includes('econnrefused') ||
    h.includes('enotfound') ||
    h.includes('etimedout') ||
    h.includes('network_unavailable')
  ) {
    return 'network_unavailable';
  }

  if (h.includes('neural_voice_unavailable')) return 'neural_voice_unavailable';
  if (h.includes('tts_failed') || h.includes('no_audio')) return 'tts_failed';

  if (input.context === 'coach') return 'coach_unavailable';
  if (input.context === 'hearing') return 'tts_failed';
  return 'unknown';
}

export function toUserError(input: UserErrorInput): string {
  const code = classifyUserError(input);
  const ctx = input.context || 'default';
  const byCtx = COPY[code];
  return byCtx[ctx] || byCtx.default;
}

/** HTTP status for classified hearing/TTS failures. */
export function httpStatusForUserError(code: UserErrorCode): number {
  switch (code) {
    case 'gemini_key_missing':
    case 'neural_voice_unavailable':
      return 503;
    case 'api_credits_exhausted':
    case 'rate_limited':
      return 429;
    case 'auth_required':
      return 401;
    case 'network_unavailable':
      return 503;
    case 'tts_failed':
    case 'coach_unavailable':
    case 'unknown':
      return 500;
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}

/**
 * Classify an unknown thrown value (Gemini SDK, fetch, etc.).
 */
export function classifyThrown(err: unknown, context?: UserErrorContext): UserErrorCode {
  if (!err) return context === 'coach' ? 'coach_unavailable' : 'unknown';

  const status =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: number }).status)
      : typeof err === 'object' && err !== null && 'statusCode' in err
        ? Number((err as { statusCode?: number }).statusCode)
        : null;

  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: unknown }).message)
          : String(err);

  return classifyUserError({ code: message, status, detail: message, context });
}

export function thrownToUserError(err: unknown, context?: UserErrorContext): string {
  return toUserError({
    code: classifyThrown(err, context),
    detail: err instanceof Error ? err.message : String(err ?? ''),
    context,
  });
}

/**
 * Prefer plain copy for quota/network/auth; keep short product messages that
 * are already clear (e.g. "Need 100 BCC").
 */
export function friendlyFailureDetail(err: unknown, context: UserErrorContext = 'api'): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'unknown');
  const code = classifyThrown(err, context);
  if (
    code === 'api_credits_exhausted' ||
    code === 'rate_limited' ||
    code === 'network_unavailable' ||
    code === 'gemini_key_missing' ||
    code === 'neural_voice_unavailable' ||
    code === 'auth_required' ||
    code === 'coach_unavailable' ||
    code === 'tts_failed'
  ) {
    return toUserError({ code, detail: raw, context });
  }
  // Strip env-var / secret-looking dumps
  if (/VITE_|ECONOMY_|SECRET|GEMINI_|api[_ ]?key/i.test(raw)) {
    return toUserError({ code: 'unknown', detail: raw, context });
  }
  // Keep short human product rules
  if (raw.length <= 120 && !/[A-Z_]{8,}/.test(raw) && !raw.includes(' at ')) {
    return raw;
  }
  return toUserError({ code: 'unknown', detail: raw, context });
}

/** True when this warn toast should use cooldown instead of once-forever. */
export function isRecoverableUserErrorMessage(message: string): boolean {
  const code = classifyUserError({ detail: message, message });
  if (RECOVERABLE_ERROR_CODES.has(code)) return true;
  const m = message.toLowerCase();
  return (
    m.includes('out of api credits') ||
    m.includes('voice guide is busy') ||
    m.includes('couldn’t reach') ||
    m.includes("couldn't reach") ||
    m.includes('coach is unavailable') ||
    m.includes('coach is out of api credits') ||
    m.includes('coach is busy') ||
    m.includes('api credits')
  );
}

export function recoverableToastCooldownMs(): number {
  return RECOVERABLE_TOAST_COOLDOWN_MS;
}

/** Stable fingerprint class for throttling Hearing lastLine / toasts. */
export function userErrorClassKey(input: UserErrorInput): string {
  return classifyUserError(input);
}
