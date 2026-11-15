// OWNER: Finale. Punto della piazza che lancia il flashback "La notte dell'Intercity".
// Sempre visibile come interagibile: bloccato ("Prima finisci le altre storie") finche' le missioni principali
// non sono completate, poi "[E] RACCONTA LA NOTTE DELL'INTERCITY". L'azione la esegue lo store (`beginFinale`).
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, TorusGeometry, type Group } from 'three';
import { content } from '@/data';
import { interactionRegistry } from '@/game/interactions/registry';
import { gameStore, useGameStore } from '@/store/gameStore';
import { PIAZZA_POINTS } from '@/world/environments/piazzaColliders';
import {
  FINALE_LOCKED_LABEL,
  FINALE_MISSION_ID,
  FINALE_START_INTERACTABLE_ID,
  FINALE_START_LABEL,
} from './logic/ids';
import { isFinaleUnlocked } from './logic/rules';

/** A nord dell'uscita della stazione (che ha un suo interagibile), fuori dal suo raggio principale. */
export const FINALE_TRIGGER_POS = [
  PIAZZA_POINTS.stationExit[0] - 1.4,
  PIAZZA_POINTS.stationExit[1] - 4.4,
] as const;

const ringGeo = new TorusGeometry(0.75, 0.07, 6, 28);
const ringMat = new MeshBasicMaterial({ color: '#ffcf33', transparent: true, opacity: 0.85 });

export function PiazzaFinaleTrigger() {
  const unlocked = useGameStore((s) => isFinaleUnlocked(s.progress, content.missionOrder));
  const ring = useRef<Group>(null);

  useEffect(() => {
    const off = interactionRegistry.register({
      id: FINALE_START_INTERACTABLE_ID,
      position: [FINALE_TRIGGER_POS[0], FINALE_TRIGGER_POS[1]],
      radius: 2.0,
      label: FINALE_START_LABEL,
      disabledLabel: FINALE_LOCKED_LABEL,
      // il tipo e' un segnaposto: l'azione vera la intercetta lo store per id (beginFinale)
      action: { type: 'mission', missionId: FINALE_MISSION_ID },
      enabled: unlocked,
      priority: 3,
    });
    return off;
  }, [unlocked]);

  const geo = useMemo(() => ringGeo, []);
  useFrame((state) => {
    const g = ring.current;
    if (!g) return;
    g.visible = unlocked && gameStore.getState().phase === 'playing';
    if (g.visible) g.position.y = 1.7 + Math.sin(state.clock.elapsedTime * 2.2) * 0.12;
  });

  return (
    <group position={[FINALE_TRIGGER_POS[0], 0, FINALE_TRIGGER_POS[1]]}>
      <group ref={ring} visible={false}>
        <mesh geometry={geo} material={ringMat} rotation-x={Math.PI / 2} />
      </group>
    </group>
  );
}
