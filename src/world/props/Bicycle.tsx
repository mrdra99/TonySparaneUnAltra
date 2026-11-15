// OWNER: World&3D
// TEMP STUB (Architecture): World lo sostituisce. Contratto: `forwardRef<Group, { wobble?: number }>`;
// `wobble` 0..1 = intensita' della gag comica (0 = ferma).
import { forwardRef } from 'react';
import type { Group } from 'three';

export const Bicycle = forwardRef<Group, { wobble?: number }>(function Bicycle(
  { wobble = 0 },
  ref,
) {
  return (
    <group ref={ref} rotation={[0, 0, wobble * 0.1]}>
      <mesh position={[0, 0.35, 0.45]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.33, 0.03, 8, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.35, -0.45]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.33, 0.03, 8, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.05, 0.05, 0.9]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
    </group>
  );
});
