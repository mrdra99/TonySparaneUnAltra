// OWNER: Architecture
// Il livello "piazza" (di giorno): ambiente, collider, bici, NPC e interagibili della piazza, piu' il punto
// che lancia il flashback finale. Incapsulato qui cosi' GameCanvas puo' montare un livello alla volta
// e gli interagibili/NPC diurni non esistono mai durante "La notte dell'Intercity".
import { useEffect } from 'react';
import { colliderRegistry } from '@/game/core/collision';
import { GAME_FLAGS } from '@/game/core/constants';
import { InteractionSystem } from '@/game/interactions/InteractionSystem';
import { PiazzaFinaleTrigger } from '@/levels/intercity/PiazzaFinaleTrigger';
import { useGameStore } from '@/store/gameStore';
import { Npcs } from '@/world/npcs/Npcs';
import { Bicycle, Lighting, PIAZZA_COLLIDERS, PIAZZA_POINTS, Piazza } from './worldBindings';

/** Registra i collider statici della piazza per tutta la vita del livello. */
function WorldColliders() {
  useEffect(() => colliderRegistry.addMany('world:', PIAZZA_COLLIDERS), []);
  return null;
}

function BikeProp() {
  const gag = useGameStore((s) => s.progress.flags.includes(GAME_FLAGS.bikeGag));
  return (
    <group position={[PIAZZA_POINTS.bike[0], 0, PIAZZA_POINTS.bike[1]]}>
      <Bicycle wobble={gag ? 1 : 0} />
    </group>
  );
}

export function PiazzaLevel({ quality }: { quality: 'high' | 'low' }) {
  return (
    <>
      <Lighting quality={quality} />
      <Piazza />
      <WorldColliders />
      <BikeProp />
      <Npcs />
      <PiazzaFinaleTrigger />
      <InteractionSystem />
    </>
  );
}
