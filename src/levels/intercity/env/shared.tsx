// OWNER: Finale. Pezzi condivisi dagli ambienti notturni del flashback: luci, cielo, insegne luminose,
// materiali. Materiali e geometrie sono risorse di modulo (mai ricreate); le texture si liberano al dismount.
import { useEffect, useMemo } from 'react';
import { Stars } from '@react-three/drei';
import {
  BackSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  type CanvasTexture,
} from 'three';
import { colliderRegistry } from '@/game/core/collision';
import type { ColliderShape } from '@/game/core/types';
import { makeTextTexture } from '@/world/textures';

/** Finestre accese e insegne: non risentono delle luci (restano luminose di notte). */
export const matWindow = new MeshBasicMaterial({ color: '#ffd98a' });
export const matLampGlow = new MeshBasicMaterial({
  color: '#fff1c2',
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});
export const matGround = (color: string): MeshStandardMaterial =>
  new MeshStandardMaterial({ color, roughness: 1, flatShading: true });

const moonGeo = new SphereGeometry(5, 16, 12);
const moonMat = new MeshBasicMaterial({ color: '#eef3ff', fog: false });
const skyGeo = new SphereGeometry(300, 16, 12);
const skyMat = new MeshBasicMaterial({ color: '#070b1c', side: BackSide, fog: false });

interface NightLightingProps {
  quality: 'high' | 'low';
  /** Tonalita' della luna: 'blue' per Torre del Lago, piu' neutra alle stazioni. */
  moon?: string;
}

/** Cielo notturno: stelle, luna, luce lunare con ombre, riempimento blu. */
export function NightLighting({ quality, moon = '#a9bdff' }: NightLightingProps) {
  const mapSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <color attach="background" args={['#070b1c']} />
      <fog attach="fog" args={['#0b1230', 38, 150]} />
      <mesh geometry={skyGeo} material={skyMat} />
      <Stars
        radius={180}
        depth={40}
        count={quality === 'high' ? 1800 : 700}
        factor={5}
        saturation={0}
        fade
        speed={0}
      />
      <mesh geometry={moonGeo} material={moonMat} position={[-70, 62, -110]} />
      <hemisphereLight args={['#6f86d6', '#1a1f33', 0.85]} />
      <ambientLight intensity={0.16} color="#8aa0ff" />
      <directionalLight
        castShadow
        position={[-20, 28, -16]}
        intensity={1.5}
        color={moon}
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
      />
    </>
  );
}

export interface LampSpot {
  x: number;
  /** Altezza della sorgente (m). */
  y: number;
  z: number;
}

/** Luci calde dei lampioni + alone luminoso: poche luci puntiformi (budget mobile). */
export function LampGlows({
  spots,
  intensity = 60,
}: {
  spots: readonly LampSpot[];
  intensity?: number;
}) {
  return (
    <>
      {spots.map((s, i) => (
        <group key={i} position={[s.x, s.y, s.z]}>
          <pointLight color="#ffd9a0" intensity={intensity} distance={17} decay={2} />
          <mesh material={matLampGlow}>
            <sphereGeometry args={[0.34, 8, 6]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

interface GlowSignProps {
  lines: readonly string[];
  bg: string;
  fg: string;
  width: number;
  height: number;
  position: readonly [number, number, number];
  rotationY?: number;
  /** Se true lo spessore e un telaio scuro. */
  frame?: boolean;
}

/** Insegna con testo su canvas, materiale unlit: resta leggibile e "accesa" di notte. */
export function GlowSign({
  lines,
  bg,
  fg,
  width,
  height,
  position,
  rotationY = 0,
  frame = true,
}: GlowSignProps) {
  const key = lines.join('|');
  const tex: CanvasTexture = useMemo(
    () =>
      makeTextTexture({
        lines: key.split('|'),
        width: 512,
        height: Math.max(64, Math.round((512 * height) / width)),
        bg,
        fg,
        border: fg,
        weight: '800',
      }),
    [key, bg, fg, width, height],
  );
  const mat = useMemo(() => new MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  useEffect(
    () => () => {
      tex.dispose();
      mat.dispose();
    },
    [tex, mat],
  );
  return (
    <group position={[position[0], position[1], position[2]]} rotation-y={rotationY}>
      {frame && (
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[width + 0.12, height + 0.12, 0.05]} />
          <meshStandardMaterial color="#1b2230" roughness={0.8} />
        </mesh>
      )}
      <mesh material={mat}>
        <planeGeometry args={[width, height]} />
      </mesh>
    </group>
  );
}

/** Registra i collider del livello con un prefisso proprio e li toglie al cleanup. */
export function LevelColliders({
  prefix,
  shapes,
}: {
  prefix: string;
  shapes: readonly ColliderShape[];
}) {
  useEffect(() => colliderRegistry.addMany(prefix, shapes), [prefix, shapes]);
  return null;
}

/** Piano del terreno (grande, scuro) condiviso da stazione e piazzale. */
export function Ground({
  color,
  size = 400,
  y = -0.02,
  receiveShadow = true,
}: {
  color: string;
  size?: number;
  y?: number;
  receiveShadow?: boolean;
}) {
  const mat = useMemo(() => matGround(color), [color]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh
      rotation-x={-Math.PI / 2}
      position={[0, y, 0]}
      material={mat}
      receiveShadow={receiveShadow}
    >
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}
