// OWNER: Finale. Tappa 2: Viareggio, piazzale della stazione di notte (taxi, palme, lampioni).
import { useMemo } from 'react';
import { Instanced, type InstanceItem } from '@/world/props/Instanced';
import { getBenchGeometry, getLampGeometry } from '@/world/props/propGeometries';
import { matVC } from '@/world/materials';
import { TAXI_POS, VGO_LAMPS, VGO_PALMS, collidersFor } from '../logic/colliders';
import {
  getParkedCarsGeometry,
  getPalmGeometry,
  getSkylineGeometry,
  getSkylineWindowsGeometry,
  getStopPoleGeometry,
  getTaxiGeometry,
  getTaxiLightsGeometry,
  getViareggioGroundGeometry,
  getViareggioStationGeometry,
  getViareggioStationWindowsGeometry,
} from './geometries';
import { GlowSign, Ground, LampGlows, LevelColliders, NightLighting, matWindow } from './shared';

const COLLIDERS = collidersFor('intercity-viareggio');

/** Lampioni: i due a nord guardano a sud (rotY 0), quello a sud-est guarda a nord. */
const LAMP_ROT = (z: number): number => (z < 0 ? 0 : Math.PI);

export function ViareggioSquare({ quality }: { quality: 'high' | 'low' }) {
  const lamps = useMemo<InstanceItem[]>(
    () => VGO_LAMPS.map((l) => ({ pos: [l.x, 0, l.z], rotY: LAMP_ROT(l.z) })),
    [],
  );
  const lampSpots = useMemo(
    () =>
      VGO_LAMPS.slice(0, quality === 'high' ? 4 : 3).map((l) => ({
        x: l.x + Math.sin(LAMP_ROT(l.z)) * 1.62,
        y: 6.0,
        z: l.z + Math.cos(LAMP_ROT(l.z)) * 1.62,
      })),
    [quality],
  );
  const palms = useMemo<InstanceItem[]>(
    () => VGO_PALMS.map((p, i) => ({ pos: [p.x, 0, p.z], rotY: i * 2.1 })),
    [],
  );
  const bench = useMemo<InstanceItem[]>(() => [{ pos: [-6.3, 0, 8], rotY: Math.PI }], []);
  return (
    <group>
      <NightLighting quality={quality} />
      <Ground color="#1a1b23" />
      <LevelColliders prefix="finale:vgo:" shapes={COLLIDERS} />

      <mesh geometry={getViareggioGroundGeometry()} material={matVC} receiveShadow />
      <mesh geometry={getViareggioStationGeometry()} material={matVC} castShadow receiveShadow />
      <mesh geometry={getViareggioStationWindowsGeometry()} material={matWindow} />
      <GlowSign
        lines={['VIAREGGIO']}
        bg="#1f4f8f"
        fg="#ffffff"
        width={5.6}
        height={1.3}
        position={[0, 6.0, -8.1]}
      />
      <GlowSign
        lines={['FERROVIE', 'STAZIONE']}
        bg="#0c1a3a"
        fg="#ffcf33"
        width={2.2}
        height={0.8}
        position={[-7, 4.4, -8.06]}
      />

      <group position={[0, 0, -33]}>
        <mesh geometry={getSkylineGeometry()} material={matVC} />
        <mesh geometry={getSkylineWindowsGeometry()} material={matWindow} />
      </group>
      <mesh geometry={getParkedCarsGeometry()} material={matVC} />

      <Instanced geometry={getLampGeometry()} material={matVC} items={lamps} castShadow />
      <LampGlows spots={lampSpots} intensity={70} />
      <Instanced geometry={getPalmGeometry()} material={matVC} items={palms} castShadow />
      <Instanced
        geometry={getBenchGeometry()}
        material={matVC}
        items={bench}
        castShadow
        receiveShadow
      />

      {/* taxi bianco con insegna TAXI accesa */}
      <group position={[TAXI_POS.x, 0, TAXI_POS.z]}>
        <mesh geometry={getTaxiGeometry()} material={matVC} castShadow receiveShadow />
        <mesh geometry={getTaxiLightsGeometry()} material={matWindow} />
        {[-1, 1].map((s) => (
          <GlowSign
            key={s}
            lines={['TAXI']}
            bg="#f4d03f"
            fg="#16213e"
            width={0.78}
            height={0.3}
            position={[0.35, 2.12, s * 0.17]}
            rotationY={s === 1 ? 0 : Math.PI}
            frame={false}
          />
        ))}
        <pointLight
          position={[-2.6, 0.9, 0]}
          color="#fff3c8"
          intensity={14}
          distance={7}
          decay={2}
        />
      </group>

      {/* fermata dei taxi */}
      <group position={[13.2, 0, 3]}>
        <mesh geometry={getStopPoleGeometry()} material={matVC} />
        <GlowSign
          lines={['TAXI']}
          bg="#1f6fb8"
          fg="#ffffff"
          width={0.8}
          height={0.8}
          position={[0, 2.5, 0.08]}
          rotationY={-Math.PI / 2}
        />
      </group>
    </group>
  );
}
