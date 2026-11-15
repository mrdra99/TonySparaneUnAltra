import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { HOLM_OAK, type PineSpec } from '../environments/layout';
import { matFoliage } from '../materials';
import {
  PINE_BASE_HEIGHT,
  getOakCrownGeometry,
  getOakTrunkGeometry,
  getPineCrownGeometry,
  getPineTop,
  getPineTrunkGeometry,
} from './propGeometries';

/** Pino marittimo: tronco sottile inclinato e chioma a ombrello che oscilla piano. */
export function PineTree({ spec }: { spec: PineSpec }) {
  const crown = useRef<Group>(null);
  const top = getPineTop(spec.variant);
  const scale = spec.height / PINE_BASE_HEIGHT;
  const tiltX = spec.lean * Math.sin(spec.leanDir);
  const tiltZ = -spec.lean * Math.cos(spec.leanDir);

  useFrame((state) => {
    const g = crown.current;
    if (!g) return;
    const t = state.clock.elapsedTime * 0.55 + spec.swayPhase;
    g.rotation.z = Math.sin(t) * 0.018 + Math.sin(t * 2.3) * 0.006;
    g.rotation.x = Math.cos(t * 0.8) * 0.014;
  });

  return (
    <group position={[spec.x, 0, spec.z]} rotation={[tiltX, 0, tiltZ]}>
      <group rotation-y={spec.rotY} scale={scale}>
        <mesh
          geometry={getPineTrunkGeometry(spec.variant)}
          material={matFoliage}
          castShadow
          receiveShadow
        />
        <group ref={crown} position={[top[0], top[1], top[2]]}>
          <mesh
            geometry={getPineCrownGeometry(spec.variant)}
            material={matFoliage}
            castShadow
            receiveShadow
          />
        </group>
      </group>
    </group>
  );
}

/** Leccio: chioma scura, tonda e compatta. */
export function HolmOak() {
  const crown = useRef<Group>(null);
  useFrame((state) => {
    const g = crown.current;
    if (!g) return;
    const t = state.clock.elapsedTime * 0.4;
    g.rotation.z = Math.sin(t) * 0.007;
    g.rotation.x = Math.cos(t * 0.7) * 0.006;
  });
  return (
    <group position={[HOLM_OAK.x, 0, HOLM_OAK.z]}>
      <mesh geometry={getOakTrunkGeometry()} material={matFoliage} castShadow receiveShadow />
      <group ref={crown} position={[0, 2.2, 0]}>
        <group position={[0, -2.2, 0]}>
          <mesh geometry={getOakCrownGeometry()} material={matFoliage} castShadow receiveShadow />
        </group>
      </group>
    </group>
  );
}
