import { createContext, useContext } from 'react';
import type { HearingModeApi } from '../../hooks/useHearingMode';

export const HearingModeContext = createContext<HearingModeApi | null>(null);

export function useHearing(): HearingModeApi | null {
  return useContext(HearingModeContext);
}

export function useHearingActive(): boolean {
  return Boolean(useContext(HearingModeContext)?.active);
}
