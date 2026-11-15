/**
 * OWNER: Architecture.
 * Hook reattivo (resize / orientationchange / cambio pointer) sul profilo dispositivo.
 * Usa useSyncExternalStore con snapshot memoizzato: nessun re-render se i valori non cambiano.
 * La qualita' effettiva combina il rilevamento con `settings.quality` ('auto' | 'high' | 'low').
 */
import { useMemo, useSyncExternalStore } from 'react';
import {
  detectDeviceProfile,
  readDeviceEnv,
  resolveDeviceProfile,
  type DeviceProfile,
  type ResolvedDeviceProfile,
} from '@/game/core/device';
import { useGameStore } from '@/store/gameStore';

let cached: DeviceProfile | null = null;

function sameProfile(a: DeviceProfile, b: DeviceProfile): boolean {
  return (
    a.isTouch === b.isTouch &&
    a.orientation === b.orientation &&
    a.isSmallViewport === b.isSmallViewport &&
    a.viewportWidth === b.viewportWidth &&
    a.viewportHeight === b.viewportHeight &&
    a.detectedQuality === b.detectedQuality
  );
}

/** Snapshot stabile (stessa referenza finche' nulla cambia). */
export function getDeviceProfile(): DeviceProfile {
  const next = detectDeviceProfile(readDeviceEnv());
  if (cached && sameProfile(cached, next)) return cached;
  cached = next;
  return next;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
  const queries =
    typeof window.matchMedia === 'function'
      ? [window.matchMedia('(pointer: coarse)'), window.matchMedia('(hover: none)')]
      : [];
  queries.forEach((q) => q.addEventListener('change', onChange));
  return () => {
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
    queries.forEach((q) => q.removeEventListener('change', onChange));
  };
}

export function useDeviceProfile(): ResolvedDeviceProfile {
  const profile = useSyncExternalStore(subscribe, getDeviceProfile, getDeviceProfile);
  const quality = useGameStore((s) => s.settings.quality);
  return useMemo(() => resolveDeviceProfile(profile, quality), [profile, quality]);
}
