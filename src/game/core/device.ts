/**
 * OWNER: Architecture. Rilevamento dispositivo e profili di qualita' (logica PURA, testabile).
 * L'hook React e' in src/hooks/useDeviceProfile.ts.
 */
import type { QualityProfile, QualitySetting } from './types';

export interface DeviceEnv {
  /** matchMedia('(pointer: coarse)') */
  pointerCoarse: boolean;
  /** matchMedia('(hover: none)') */
  hoverNone: boolean;
  maxTouchPoints: number;
  width: number;
  height: number;
}

export type Orientation = 'portrait' | 'landscape';

export interface DeviceProfile {
  isTouch: boolean;
  orientation: Orientation;
  /** Viewport piccolo: larghezza < 768 o altezza < 500. */
  isSmallViewport: boolean;
  viewportWidth: number;
  viewportHeight: number;
  /** Qualita' suggerita dal dispositivo ('low' su touch o viewport piccolo). */
  detectedQuality: QualityProfile;
}

export interface QualityPreset {
  /** Limite superiore del device pixel ratio (Canvas dpr={[1, dprMax]}). */
  dprMax: number;
  shadowMapSize: number;
  /** Finto AO (contact shadows, ecc.). Nessuna libreria di postprocessing. */
  ambientOcclusion: boolean;
  /** Moltiplicatore 0..1 sul numero di particelle. */
  particleScale: number;
  antialias: boolean;
}

export const QUALITY_PRESETS: Readonly<Record<QualityProfile, QualityPreset>> = {
  high: {
    dprMax: 1.75,
    shadowMapSize: 2048,
    ambientOcclusion: true,
    particleScale: 1,
    antialias: true,
  },
  low: {
    dprMax: 1.25,
    shadowMapSize: 1024,
    ambientOcclusion: false,
    particleScale: 0.4,
    antialias: false,
  },
};

export interface ResolvedDeviceProfile extends DeviceProfile {
  /** Qualita' effettiva: override utente (settings.quality) oppure detectedQuality. */
  qualityProfile: QualityProfile;
  preset: QualityPreset;
}

export function detectDeviceProfile(env: DeviceEnv): DeviceProfile {
  const isTouch = env.pointerCoarse || (env.hoverNone && env.maxTouchPoints > 0);
  const isSmallViewport = env.width < 768 || env.height < 500;
  return {
    isTouch,
    orientation: env.height > env.width ? 'portrait' : 'landscape',
    isSmallViewport,
    viewportWidth: env.width,
    viewportHeight: env.height,
    detectedQuality: isTouch || isSmallViewport ? 'low' : 'high',
  };
}

export function resolveQuality(setting: QualitySetting, detected: QualityProfile): QualityProfile {
  return setting === 'auto' ? detected : setting;
}

export function resolveDeviceProfile(
  profile: DeviceProfile,
  setting: QualitySetting,
): ResolvedDeviceProfile {
  const qualityProfile = resolveQuality(setting, profile.detectedQuality);
  return { ...profile, qualityProfile, preset: QUALITY_PRESETS[qualityProfile] };
}

/** Legge l'ambiente reale (browser). In SSR/test senza window restituisce un desktop 1280x720. */
export function readDeviceEnv(): DeviceEnv {
  if (typeof window === 'undefined') {
    return { pointerCoarse: false, hoverNone: false, maxTouchPoints: 0, width: 1280, height: 720 };
  }
  const mm = (q: string): boolean =>
    typeof window.matchMedia === 'function' ? window.matchMedia(q).matches : false;
  return {
    pointerCoarse: mm('(pointer: coarse)'),
    hoverNone: mm('(hover: none)'),
    maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/** True se l'utente ha chiesto di ridurre le animazioni a livello di sistema. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}
