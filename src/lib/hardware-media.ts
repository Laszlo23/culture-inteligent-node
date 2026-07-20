/**
 * Hardware Bay product photography — cinematic stills per module type.
 */

import type { ModuleType } from '../types';

export const HARDWARE_PHOTOS: Record<ModuleType, string> = {
  gpu: '/hardware/gpu.webp',
  memory: '/hardware/memory.webp',
  accelerator: '/hardware/accelerator.webp',
  battery: '/hardware/battery.webp',
  cooler: '/hardware/cooler.webp',
  dock: '/hardware/dock.webp',
  chip: '/hardware/chip.webp',
};

export function resolveHardwarePhoto(type: ModuleType | string): string {
  if (type in HARDWARE_PHOTOS) return HARDWARE_PHOTOS[type as ModuleType];
  return HARDWARE_PHOTOS.chip;
}

export const ARENA_HERO = '/atmosphere/arena-hero.webp';
