// OWNER: World&3D
// TEMP STUB (Architecture): World lo sostituisce mantenendo le firme.
// Contratto di pivot:
//  - `torso` e `head` sono pivot ROTAZIONALI di proprieta' del Gameplay (sistema di attenzione):
//    Gameplay scrive torso.rotation.y e head.rotation.y/x. World NON li scrive mai: le animazioni
//    idle vanno su nodi interni (es. un gruppo "body" figlio del torso).
//  - `head` e' figlio di `torso`; `root` e' il gruppo radice (posizionato/ruotato da Gameplay).
import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { Group, Object3D } from 'three';
import type { NpcAppearance } from '@/game/core/types';

export interface NpcRig {
  root: Group;
  torso: Object3D;
  head: Object3D;
}

export interface NpcModelProps {
  appearance: NpcAppearance;
  pose?: 'stand' | 'sit' | 'lean';
}

export const NpcModel = forwardRef<NpcRig, NpcModelProps>(function NpcModel({ appearance }, ref) {
  const rootRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);

  useImperativeHandle(
    ref,
    () => ({
      root: rootRef.current as Group,
      torso: torsoRef.current as Group,
      head: headRef.current as Group,
    }),
    [],
  );

  const h = appearance.height;
  return (
    <group ref={rootRef}>
      <mesh position={[0, h * 0.25, 0]} castShadow>
        <boxGeometry args={[0.34, h * 0.5, 0.22]} />
        <meshStandardMaterial color={appearance.pants} />
      </mesh>
      <group ref={torsoRef} position={[0, h * 0.5, 0]}>
        <mesh position={[0, h * 0.17, 0]} castShadow>
          <boxGeometry args={[0.44, h * 0.34, 0.26]} />
          <meshStandardMaterial color={appearance.shirt} />
        </mesh>
        <group ref={headRef} position={[0, h * 0.37, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshStandardMaterial color={appearance.skin} />
          </mesh>
          {/* naso: indica la direzione dello sguardo (+Z locale) */}
          <mesh position={[0, 0, 0.13]}>
            <boxGeometry args={[0.04, 0.04, 0.06]} />
            <meshStandardMaterial color={appearance.hair} />
          </mesh>
        </group>
      </group>
    </group>
  );
});
