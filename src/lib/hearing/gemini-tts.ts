/**
 * Gemini neural TTS for Hearing Mode — warm human-like guide voice.
 * Returns WAV bytes ready for the browser <audio> element.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { getGeminiApiKey, hasGeminiApiKey } from '../gemini-key';
import { classifyThrown, type UserErrorCode } from '../user-errors';

export type HearingVoiceStyle = 'guide' | 'soft' | 'clear';

/** Warm, easy-going Gemini prebuilt voices — see AI Studio TTS list. */
export const HEARING_VOICES = {
  /** Default guide — warm real energy */
  guide: 'Sulafat',
  soft: 'Achernar',
  clear: 'Callirrhoe',
} as const;

const DEFAULT_MODEL =
  process.env.HEARING_TTS_MODEL?.trim() || 'gemini-2.5-flash-preview-tts';
const FALLBACK_MODELS = [
  'gemini-2.5-flash-preview-tts',
  'gemini-2.5-pro-preview-tts',
  'gemini-3.1-flash-tts-preview',
];

const MAX_CHARS = 2_800;
const CACHE_DIR =
  process.env.HEARING_TTS_CACHE_DIR?.trim() ||
  path.join(process.cwd(), 'data', 'tts-cache');

const STYLE_DIRECTION: Record<HearingVoiceStyle, string> = {
  guide:
    'Speak with a warm, living human voice — calm confidence, soft real energy, like a kind late-night radio guide. Easy breath. Natural smile in the tone. Never robotic, never flat.',
  soft:
    'Speak softly and intimately, almost a warm whisper — gentle, caring, unhurried. Real human presence.',
  clear:
    'Speak clearly and warmly, easy-going and friendly — like explaining something important to a friend. Natural pacing, never rushed.',
};

function pcm16ToWav(pcm: Buffer, sampleRate: number, channels = 1): Buffer {
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function parseSampleRate(mimeType: string | undefined): number {
  if (!mimeType) return 24_000;
  const m = /rate=(\d+)/i.exec(mimeType);
  if (m) return Number(m[1]) || 24_000;
  return 24_000;
}

function cacheKey(text: string, voice: string, style: HearingVoiceStyle, model: string): string {
  return createHash('sha256')
    .update([model, voice, style, text].join('\0'))
    .digest('hex')
    .slice(0, 40);
}

function voiceForStyle(style: HearingVoiceStyle): string {
  const override = process.env.HEARING_VOICE?.trim();
  if (override) return override;
  return HEARING_VOICES[style];
}

function buildPrompt(text: string, style: HearingVoiceStyle): string {
  const direction = STYLE_DIRECTION[style];
  return `${direction}\n\nSay exactly this — do not add intro or outro:\n\n${text.trim()}`;
}

async function ensureCacheDir(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
}

export function neuralTtsReady(): boolean {
  return hasGeminiApiKey();
}

export type NeuralSpeakResult = {
  wav: Buffer;
  voice: string;
  model: string;
  cached: boolean;
  sampleRate: number;
};

/**
 * Synthesize Hearing Mode line to WAV. Cached on disk by content hash.
 */
export async function synthesizeHearingSpeech(
  text: string,
  style: HearingVoiceStyle = 'guide'
): Promise<NeuralSpeakResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    const err = new Error('gemini_key_missing') as Error & { code: UserErrorCode };
    err.code = 'gemini_key_missing';
    throw err;
  }

  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) throw new Error('empty_text');
  if (cleaned.length > MAX_CHARS) throw new Error('text_too_long');

  const voice = voiceForStyle(style);
  const models = [DEFAULT_MODEL, ...FALLBACK_MODELS.filter((m) => m !== DEFAULT_MODEL)];
  const modelForCache = models[0];

  await ensureCacheDir();
  const key = cacheKey(cleaned, voice, style, modelForCache);
  const cachePath = path.join(CACHE_DIR, `${key}.wav`);

  try {
    const hit = await readFile(cachePath);
    if (hit.length > 44) {
      return { wav: hit, voice, model: modelForCache, cached: true, sampleRate: 24_000 };
    }
  } catch {
    // miss
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(cleaned, style);

  let lastErr: unknown;
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const inline = part?.inlineData;
      const b64 = inline?.data;
      if (!b64) {
        lastErr = new Error('no_audio_in_response');
        continue;
      }

      const raw = Buffer.from(b64, 'base64');
      const mime = inline.mimeType || '';
      let wav: Buffer;
      let sampleRate = 24_000;

      if (mime.includes('wav') || (raw.length >= 12 && raw.toString('ascii', 0, 4) === 'RIFF')) {
        wav = raw;
      } else {
        sampleRate = parseSampleRate(mime);
        wav = pcm16ToWav(raw, sampleRate);
      }

      try {
        await writeFile(cachePath, wav);
      } catch {
        // cache best-effort
      }

      return { wav, voice, model, cached: false, sampleRate };
    } catch (err) {
      lastErr = err;
    }
  }

  const code: UserErrorCode = classifyThrown(lastErr, 'hearing');
  const detail = lastErr instanceof Error ? lastErr.message : 'tts_failed';
  const err = new Error(code) as Error & { code: UserErrorCode; detail: string };
  err.code = code;
  err.detail = detail;
  throw err;
}
