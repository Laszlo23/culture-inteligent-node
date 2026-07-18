/**
 * Procedural Culture Node sound design — UI chirps + optional positive pad.
 * No binary assets; unlocks on first user gesture (browser autoplay policy).
 */

import { nextAffirmation } from './affirmations';

export type UiSound =
  | 'hover'
  | 'decode'
  | 'enter'
  | 'success'
  | 'soft'
  | 'toggle';

const SFX_KEY = 'bc_sound_sfx_v1';
const VIBE_KEY = 'bc_sound_vibe_v1';

/** Quiet pad under Hearing Mode guide (does not enable vibe affirmations). */
const HEARING_PAD_GAIN = 0.032;
const VIBE_PAD_GAIN = 0.045;

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === '1';
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private padBus: GainNode | null = null;
  private padOsc: OscillatorNode[] = [];
  private padLfo: OscillatorNode | null = null;
  private padStarted = false;
  private unlocked = false;
  private lastHoverAt = 0;
  private lastAffirmation = '';
  private affirmationTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  /** Soft listening bed while Hearing Mode is active */
  private hearingBed = false;
  /** Guide voice is speaking — pause vibe affirmations */
  private narrationActive = false;

  sfxEnabled = readFlag(SFX_KEY, true);
  vibeEnabled = readFlag(VIBE_KEY, false);

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  async unlock(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(this.ctx.destination);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = this.sfxEnabled ? 0.45 : 0;
        this.sfxBus.connect(this.master);

        this.padBus = this.ctx.createGain();
        this.padBus.gain.value = 0;
        this.padBus.connect(this.master);
      }
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.unlocked = this.ctx.state === 'running';
      if (this.unlocked && this.vibeEnabled) this.startPad();
      if (this.unlocked && this.vibeEnabled) this.scheduleAffirmations();
      this.emit();
      return this.unlocked;
    } catch {
      return false;
    }
  }

  isUnlocked() {
    return this.unlocked;
  }

  setSfxEnabled(on: boolean) {
    this.sfxEnabled = on;
    writeFlag(SFX_KEY, on);
    if (this.sfxBus && this.ctx) {
      this.sfxBus.gain.setTargetAtTime(on ? 0.45 : 0, this.ctx.currentTime, 0.05);
    }
    void this.unlock();
    this.play('toggle');
    this.emit();
  }

  setVibeEnabled(on: boolean) {
    this.vibeEnabled = on;
    writeFlag(VIBE_KEY, on);
    void this.unlock().then(() => {
      if (on) {
        this.startPad();
        this.fadePad(this.hearingBed ? HEARING_PAD_GAIN : VIBE_PAD_GAIN);
        if (!this.hearingBed && !this.narrationActive) {
          this.scheduleAffirmations();
          this.speakAffirmation(true);
        }
      } else {
        this.stopAffirmations();
        if (!this.hearingBed) {
          this.fadePad(0);
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
        } else {
          this.fadePad(HEARING_PAD_GAIN);
        }
      }
      this.emit();
    });
  }

  /**
   * Soft ambient bed for Hearing Mode — breathy pad, no competing affirmations.
   * Restores vibe affirmations when Hearing turns off (if vibe is on).
   */
  setHearingBed(on: boolean) {
    this.hearingBed = on;
    void this.unlock().then(() => {
      if (on) {
        this.startPad();
        this.fadePad(HEARING_PAD_GAIN);
        this.stopAffirmations();
      } else if (this.vibeEnabled) {
        this.fadePad(VIBE_PAD_GAIN);
        if (!this.narrationActive) this.scheduleAffirmations();
      } else {
        this.fadePad(0);
      }
      this.emit();
    });
  }

  /** Call around guide TTS so vibe affirmations never talk over Hearing. */
  setNarrationActive(on: boolean) {
    this.narrationActive = on;
    if (on) {
      this.stopAffirmations();
    } else if (this.vibeEnabled && !this.hearingBed) {
      this.scheduleAffirmations();
    }
  }

  private fadePad(target: number) {
    if (!this.padBus || !this.ctx) return;
    this.padBus.gain.cancelScheduledValues(this.ctx.currentTime);
    this.padBus.gain.setTargetAtTime(target, this.ctx.currentTime, 0.8);
  }

  private startPad() {
    if (!this.ctx || !this.padBus || this.padStarted) return;
    this.padStarted = true;

    // Soft C major warmth — very quiet positive bed
    const freqs = [130.81, 164.81, 196.0, 261.63];
    const now = this.ctx.currentTime;
    const breath = this.ctx.createGain();
    breath.gain.value = 1;
    breath.connect(this.padBus);

    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      g.gain.value = 0.14 / freqs.length;
      osc.connect(g);
      g.connect(breath);
      osc.start(now);
      this.padOsc.push(osc);
    });

    // Gentle amplitude breath on a child gain (does not fight pad fade)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.25;
    breath.gain.value = 0.75;
    lfo.connect(lfoGain);
    lfoGain.connect(breath.gain);
    lfo.start(now);
    this.padLfo = lfo;

    if (this.vibeEnabled || this.hearingBed) {
      this.fadePad(this.hearingBed ? HEARING_PAD_GAIN : VIBE_PAD_GAIN);
    }
  }

  private scheduleAffirmations() {
    this.stopAffirmations();
    if (!this.vibeEnabled || this.hearingBed || this.narrationActive) return;

    const loop = () => {
      if (!this.vibeEnabled || this.hearingBed || this.narrationActive) return;
      this.speakAffirmation(false);
      // Sparse — every 55–90s so it stays subliminal / ambient
      const wait = 55_000 + Math.random() * 35_000;
      this.affirmationTimer = setTimeout(loop, wait);
    };
    this.affirmationTimer = setTimeout(loop, 18_000);
  }

  private stopAffirmations() {
    if (this.affirmationTimer) {
      clearTimeout(this.affirmationTimer);
      this.affirmationTimer = null;
    }
  }

  speakAffirmation(_immediate: boolean) {
    // Pad-only vibe — browser TTS sounds cheap; Hearing uses neural Gemini voice instead.
    if (!this.vibeEnabled || this.hearingBed || this.narrationActive) return;
    this.lastAffirmation = nextAffirmation(this.lastAffirmation);
  }

  play(kind: UiSound) {
    if (!this.sfxEnabled) return;
    void this.unlock().then((ok) => {
      if (!ok || !this.ctx || !this.sfxBus) return;

      const now = this.ctx.currentTime;
      if (kind === 'hover') {
        if (now * 1000 - this.lastHoverAt < 90) return;
        this.lastHoverAt = now * 1000;
        this.tone({ freq: 880, dur: 0.05, type: 'sine', gain: 0.08, when: now });
        return;
      }
      if (kind === 'decode') {
        this.tone({ freq: 520, dur: 0.08, type: 'triangle', gain: 0.1, when: now });
        this.tone({ freq: 780, dur: 0.12, type: 'sine', gain: 0.07, when: now + 0.05 });
        this.tone({ freq: 1040, dur: 0.18, type: 'sine', gain: 0.05, when: now + 0.1 });
        return;
      }
      if (kind === 'enter') {
        this.tone({ freq: 392, dur: 0.1, type: 'triangle', gain: 0.12, when: now });
        this.tone({ freq: 523.25, dur: 0.14, type: 'sine', gain: 0.1, when: now + 0.07 });
        this.tone({ freq: 659.25, dur: 0.2, type: 'sine', gain: 0.08, when: now + 0.14 });
        return;
      }
      if (kind === 'success') {
        this.tone({ freq: 523.25, dur: 0.12, type: 'sine', gain: 0.12, when: now });
        this.tone({ freq: 659.25, dur: 0.14, type: 'sine', gain: 0.1, when: now + 0.1 });
        this.tone({ freq: 783.99, dur: 0.22, type: 'triangle', gain: 0.09, when: now + 0.2 });
        return;
      }
      if (kind === 'soft') {
        this.tone({ freq: 440, dur: 0.09, type: 'sine', gain: 0.06, when: now });
        return;
      }
      if (kind === 'toggle') {
        this.tone({ freq: 660, dur: 0.06, type: 'sine', gain: 0.09, when: now });
        return;
      }
      const _never: never = kind;
      void _never;
    });
  }

  private tone(opts: {
    freq: number;
    dur: number;
    type: OscillatorType;
    gain: number;
    when: number;
  }) {
    if (!this.ctx || !this.sfxBus) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = opts.type;
    osc.frequency.setValueAtTime(opts.freq, opts.when);
    g.gain.setValueAtTime(0.0001, opts.when);
    g.gain.exponentialRampToValueAtTime(opts.gain, opts.when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, opts.when + opts.dur);
    osc.connect(g);
    g.connect(this.sfxBus);
    osc.start(opts.when);
    osc.stop(opts.when + opts.dur + 0.02);
  }
}

export const soundEngine = new SoundEngine();
