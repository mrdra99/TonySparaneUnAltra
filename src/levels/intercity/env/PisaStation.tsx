// OWNER: Finale. Tappa 1: Pisa Centrale, binario in piena notte. Solo visivo (collider in logic/colliders.ts).
import { useMemo } from 'react';
import { Instanced, type InstanceItem } from '@/world/props/Instanced';
import { getBenchGeometry } from '@/world/props/propGeometries';
import { matVC } from '@/world/materials';
import { COACH_CENTERS, PISA_BENCHES, TRAIN_FACE_Z, collidersFor } from '../logic/colliders';
import { PISA_VENDING_POS } from '../data/cast';
import {
  getCoachGeometry,
  getCoachWindowsGeometry,
  getPisaPlatformGeometry,
  getPisaWindowsGeometry,
  getSkylineGeometry,
  getSkylineWindowsGeometry,
  getTrackGeometry,
  getVendingGeometry,
  getVendingPanelGeometry,
} from './geometries';
import { GlowSign, Ground, LevelColliders, NightLighting, matWindow } from './shared';

const TRAIN_Z = TRAIN_FACE_Z - 1.5;
const COLLIDERS = collidersFor('intercity-pisa');

export function PisaStation({ quality }: { quality: 'high' | 'low' }) {
  const coaches = useMemo<InstanceItem[]>(
    () => COACH_CENTERS.map((x) => ({ pos: [x, 0, TRAIN_Z] })),
    [],
  );
  const benches = useMemo<InstanceItem[]>(
    () => PISA_BENCHES.map((b) => ({ pos: [b.x, 0, b.z], rotY: Math.PI })),
    [],
  );
  return (
    <group>
      <NightLighting quality={quality} />
      <Ground color="#151823" />
      <LevelColliders prefix="finale:pisa:" shapes={COLLIDERS} />

      {/* luci della pensilina */}
      {[-9, 0, 9].map((x) => (
        <pointLight
          key={x}
          position={[x, 3.5, 3.6]}
          color="#ffe2b0"
          intensity={26}
          distance={15}
          decay={2}
        />
      ))}

      <mesh geometry={getPisaPlatformGeometry()} material={matVC} castShadow receiveShadow />
      <mesh geometry={getPisaWindowsGeometry()} material={matWindow} />

      {/* binari: quello dell'Intercity e uno vuoto, con lo skyline di Pisa in fondo */}
      <mesh
        geometry={getTrackGeometry()}
        material={matVC}
        position={[0, 0, TRAIN_Z]}
        receiveShadow
      />
      <mesh geometry={getTrackGeometry()} material={matVC} position={[0, 0, TRAIN_Z - 6.4]} />
      <group position={[0, 0, -34]}>
        <mesh geometry={getSkylineGeometry()} material={matVC} />
        <mesh geometry={getSkylineWindowsGeometry()} material={matWindow} />
      </group>

      {/* Intercity: 4 vagoni bianchi con fascia blu e filetto rosso */}
      <Instanced
        geometry={getCoachGeometry()}
        material={matVC}
        items={coaches}
        castShadow
        receiveShadow
      />
      <Instanced geometry={getCoachWindowsGeometry()} material={matWindow} items={coaches} />

      <Instanced
        geometry={getBenchGeometry()}
        material={matVC}
        items={benches}
        castShadow
        receiveShadow
      />

      {/* distributore automatico (pannello acceso) */}
      <group position={[PISA_VENDING_POS[0], 0, 8.95]} rotation-y={Math.PI}>
        <mesh geometry={getVendingGeometry()} material={matVC} castShadow />
        <mesh geometry={getVendingPanelGeometry()} material={matWindow} />
      </group>

      {/* tabellone partenze, binario e orologio */}
      <GlowSign
        lines={['IC — VIAREGGIO', '23:47 — IN PARTENZA']}
        bg="#0c1a3a"
        fg="#ffcf33"
        width={4.4}
        height={1.3}
        position={[2, 3.1, 9.42]}
        rotationY={Math.PI}
      />
      <GlowSign
        lines={['BINARIO 4', 'PISA CENTRALE']}
        bg="#1f4f8f"
        fg="#ffffff"
        width={2.8}
        height={0.9}
        position={[-10, 3.55, 0.6]}
      />
      <GlowSign
        lines={['BINARIO 4', '→ VIAREGGIO']}
        bg="#1f4f8f"
        fg="#ffffff"
        width={2.8}
        height={0.9}
        position={[10, 3.55, 0.6]}
      />
      <group position={[12.6, 0, 1.6]}>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 3.2, 8]} />
          <meshStandardMaterial color="#6b7384" roughness={0.7} />
        </mesh>
        {[0, Math.PI].map((r) => (
          <GlowSign
            key={r}
            lines={['23:41']}
            bg="#101826"
            fg="#ffe9a8"
            width={1.1}
            height={0.7}
            position={[0, 3.35, r === 0 ? 0.08 : -0.08]}
            rotationY={r}
          />
        ))}
      </group>
    </group>
  );
}
