// OWNER: Finale. Tappa 3: la Piazza di Torre del Lago di notte (riusa <Piazza/>, senza NPC e senza
// interagibili diurni): luna, toni blu, lampioni accesi (luci calde + alone).
import { useMemo } from 'react';
import { PIAZZA_COLLIDERS, Piazza } from '@/app/worldBindings';
import { LAMPS } from '@/world/environments/layout';
import { LampGlows, LevelColliders, NightLighting } from './shared';

/** Il lampione ha il braccio verso +z locale: la lente sta a 1.62 m e 6.3 m di altezza. */
const HEAD_REACH = 1.62;
const HEAD_Y = 6.0;

export function TorreNight({ quality }: { quality: 'high' | 'low' }) {
  const spots = useMemo(
    () =>
      LAMPS.slice(0, quality === 'high' ? 6 : 4).map((l) => ({
        x: l.x + Math.sin(l.rotY) * HEAD_REACH,
        y: HEAD_Y,
        z: l.z + Math.cos(l.rotY) * HEAD_REACH,
      })),
    [quality],
  );

  return (
    <group>
      <NightLighting quality={quality} moon="#9fb4ff" />
      <LevelColliders prefix="finale:torre:" shapes={PIAZZA_COLLIDERS} />
      <Piazza />
      <LampGlows spots={spots} intensity={80} />
    </group>
  );
}
