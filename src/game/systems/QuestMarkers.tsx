// OWNER: Gameplay
// Indicatore "!" fluttuante sopra chi ha un obiettivo attivo. Geometrie/materiali condivisi,
// animazione in un solo useFrame (nessuna allocazione), ricalcolo dei bersagli solo al cambio di progresso.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CylinderGeometry, MeshStandardMaterial, SphereGeometry, type Group } from 'three';
import { content } from '@/data';
import { INTERACTABLE_OVERRIDES } from '@/data/interactables';
import { computeMarkerTargets } from '@/game/quests/markers';
import { gameStore, useGameStore } from '@/store/gameStore';
import { effectiveInteractables } from './interactableOverrides';

const MAX_MARKERS = 8;

export function QuestMarkers() {
  const progress = useGameStore((s) => s.progress);
  const targets = useMemo(
    () =>
      computeMarkerTargets(
        progress,
        content,
        effectiveInteractables(content, progress, INTERACTABLE_OVERRIDES),
      ).slice(0, MAX_MARKERS),
    [progress],
  );
  const groups = useRef<(Group | null)[]>([]);

  const shared = useMemo(
    () => ({
      body: new CylinderGeometry(0.09, 0.05, 0.3, 10),
      dot: new SphereGeometry(0.07, 10, 8),
      mat: new MeshStandardMaterial({
        color: '#ffcf33',
        emissive: '#ff9a00',
        emissiveIntensity: 0.7,
        roughness: 0.5,
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      shared.body.dispose();
      shared.dot.dispose();
      shared.mat.dispose();
    },
    [shared],
  );

  useFrame((state) => {
    const visible = gameStore.getState().phase === 'playing';
    const t = state.clock.elapsedTime;
    for (let i = 0; i < MAX_MARKERS; i++) {
      const g = groups.current[i];
      const target = targets[i];
      if (!g) continue;
      if (!target || !visible) {
        g.visible = false;
        continue;
      }
      g.visible = true;
      g.position.set(target.x, target.y + Math.sin(t * 2.4 + i) * 0.07, target.z);
      g.rotation.y = t * 1.8;
    }
  });

  return (
    <>
      {Array.from({ length: MAX_MARKERS }, (_, i) => (
        <group
          key={i}
          visible={false}
          ref={(g) => {
            groups.current[i] = g;
          }}
        >
          <mesh geometry={shared.body} material={shared.mat} position={[0, 0.2, 0]} />
          <mesh geometry={shared.dot} material={shared.mat} position={[0, -0.04, 0]} />
        </group>
      ))}
    </>
  );
}
