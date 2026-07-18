/**
 * Hardware Bay product photography — cinematic stills per module type.
 */

import type { ModuleType } from '../types';

export const HARDWARE_PHOTOS: Record<ModuleType, string> = {
  gpu: '/hardware/gpu.png',
  memory: '/hardware/memory.png',
  accelerator: '/hardware/accelerator.png',
  battery: '/hardware/battery.png',
  cooler: '/hardware/cooler.png',
  dock: '/hardware/dock.png',
  chip: '/hardware/chip.png',
};

export function resolveHardwarePhoto(type: ModuleType | string): string {
  if (type in HARDWARE_PHOTOS) return HARDWARE_PHOTOS[type as ModuleType];
  return HARDWARE_PHOTOS.chip;
}

export const ARENA_HERO = '/atmosphere/arena-hero.png';
