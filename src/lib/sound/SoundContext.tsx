/**
 * React bridge for Culture Node sound — UI SFX + optional positive vibe layer.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { warmSpeechVoices } from '../hearing/speech';
import { soundEngine, type UiSound } from './engine';

type SoundApi = {
  sfxEnabled: boolean;
  vibeEnabled: boolean;
  unlocked: boolean;
  play: (kind: UiSound) => void;
  setSfxEnabled: (on: boolean) => void;
  setVibeEnabled: (on: boolean) => void;
  unlock: () => Promise<boolean>;
};

const SoundContext = createContext<SoundApi | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [sfxEnabled, setSfx] = useState(soundEngine.sfxEnabled);
  const [vibeEnabled, setVibe] = useState(soundEngine.vibeEnabled);
  const [unlocked, setUnlocked] = useState(soundEngine.isUnlocked());

  useEffect(() => {
    const unsub = soundEngine.subscribe(() => {
      setSfx(soundEngine.sfxEnabled);
      setVibe(soundEngine.vibeEnabled);
      setUnlocked(soundEngine.isUnlocked());
    });
    return () => {
      unsub();
    };
  }, []);

  // Unlock audio on first pointer/key after mount (autoplay policy)
  useEffect(() => {
    const unlock = () => {
      void soundEngine.unlock();
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Chrome loads voices async — prefer warm guide voice for Hearing + vibe
  useEffect(() => {
    warmSpeechVoices();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const warm = () => {
      warmSpeechVoices();
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener('voiceschanged', warm);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', warm);
  }, []);

  const play = useCallback((kind: UiSound) => soundEngine.play(kind), []);
  const setSfxEnabled = useCallback((on: boolean) => soundEngine.setSfxEnabled(on), []);
  const setVibeEnabled = useCallback((on: boolean) => soundEngine.setVibeEnabled(on), []);
  const unlock = useCallback(() => soundEngine.unlock(), []);

  const value = useMemo(
    () => ({
      sfxEnabled,
      vibeEnabled,
      unlocked,
      play,
      setSfxEnabled,
      setVibeEnabled,
      unlock,
    }),
    [sfxEnabled, vibeEnabled, unlocked, play, setSfxEnabled, setVibeEnabled, unlock]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound(): SoundApi {
  const ctx = useContext(SoundContext);
  if (!ctx) {
    return {
      sfxEnabled: false,
      vibeEnabled: false,
      unlocked: false,
      play: () => undefined,
      setSfxEnabled: () => undefined,
      setVibeEnabled: () => undefined,
      unlock: async () => false,
    };
  }
  return ctx;
}
