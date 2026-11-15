/** OWNER: Architecture. Impostazioni: default, limiti e sanitizzazione (pura). */
import { CAMERA_LIMITS } from './constants';
import type { QualitySetting, Settings } from './types';

export const SETTINGS_LIMITS = {
  volume: { min: 0, max: 1, step: 0.05 },
  cameraDistance: { min: CAMERA_LIMITS.minDistance, max: CAMERA_LIMITS.maxDistance, step: 0.5 },
  mouseSensitivity: { min: 0.3, max: 3, step: 0.1 },
} as const;

export const DEFAULT_SETTINGS: Settings = {
  volume: 0.7,
  muted: false,
  reducedMotion: false,
  cameraDistance: CAMERA_LIMITS.defaultDistance,
  mouseSensitivity: 1,
  quality: 'auto',
  tutorialSeen: false,
};

const QUALITY_VALUES: readonly QualitySetting[] = ['auto', 'high', 'low'];

function num(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Accetta qualsiasi input e restituisce Settings valide (default per i campi mancanti/invalidi). */
export function sanitizeSettings(raw: unknown, base: Settings = DEFAULT_SETTINGS): Settings {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const quality = QUALITY_VALUES.find((q) => q === r['quality']) ?? base.quality;
  const L = SETTINGS_LIMITS;
  return {
    volume: num(r['volume'], base.volume, L.volume.min, L.volume.max),
    muted: bool(r['muted'], base.muted),
    reducedMotion: bool(r['reducedMotion'], base.reducedMotion),
    cameraDistance: num(
      r['cameraDistance'],
      base.cameraDistance,
      L.cameraDistance.min,
      L.cameraDistance.max,
    ),
    mouseSensitivity: num(
      r['mouseSensitivity'],
      base.mouseSensitivity,
      L.mouseSensitivity.min,
      L.mouseSensitivity.max,
    ),
    quality,
    tutorialSeen: bool(r['tutorialSeen'], base.tutorialSeen),
  };
}
