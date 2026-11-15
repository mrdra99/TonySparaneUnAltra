// OWNER: World&3D
// TEMP STUB (Architecture): World lo sostituisce mantenendo la firma.
// Contratto: `TonyModel({ anim }: { anim: TonyAnimSource })`. `anim` e' un oggetto MUTABILE
// (runtime.anim) letto in useFrame; il posizionamento/rotazione e' del gruppo genitore (PlayerController).
// Il modello e' sostituibile con un GLB senza toccare controller/camera/logica.
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { TonyAnimSource } from '@/store/runtime';

export type { TonyAnimSource } from '@/store/runtime';

export function TonyModel({ anim }: { anim: TonyAnimSource }) {
  const bodyRef = useRef<Group>(null);

  useFrame((state) => {
    const body = bodyRef.current;
    if (!body) return;
    const t = state.clock.elapsedTime;
    const moving = anim.state === 'walk' || anim.state === 'run';
    body.position.y = moving ? Math.abs(Math.sin(t * (anim.state === 'run' ? 12 : 8))) * 0.06 : 0;
    body.rotation.z =
      anim.state === 'gesture' || anim.state === 'pose' ? Math.sin(t * 6) * 0.08 : 0;
  });

  return (
    <group ref={bodyRef}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.6, 4, 10]} />
        <meshStandardMaterial color="#2fa59a" />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <sphereGeometry args={[0.15, 14, 12]} />
        <meshStandardMaterial color="#d9a47c" />
      </mesh>
    </group>
  );
}
