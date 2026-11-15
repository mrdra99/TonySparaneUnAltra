/**
 * Piazza della Pace (Torre del Lago Puccini), ricostruzione stilizzata. SOLO VISIVA: la
 * logica di gioco (collisioni, punti) sta in piazzaColliders.ts. Nord = -z.
 */
import { useEffect, useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import { mergeParts, type Part, box } from '../geo';
import { PALETTE as P, matVC } from '../materials';
import { Bleachers, Benches, RecycleBin, StreetLamps, TrashCans } from '../props/Furniture';
import { Buildings } from '../props/Buildings';
import { Pigeons } from '../props/Pigeons';
import { Sign } from '../props/Sign';
import { HolmOak, PineTree } from '../props/Trees';
import { Vegetation } from '../props/Vegetation';
import { FLOOR_BOUNDS, makePiazzaFloorTexture } from '../textures';
import { PINES, PLAZA, SIGN_BOARD, STATION_GAP, STATION_SIGN } from './layout';

const floorW = FLOOR_BOUNDS.maxX - FLOOR_BOUNDS.minX;
const floorD = FLOOR_BOUNDS.maxZ - FLOOR_BOUNDS.minZ;
const floorCx = (FLOOR_BOUNDS.maxX + FLOOR_BOUNDS.minX) / 2;
const floorCz = (FLOOR_BOUNDS.maxZ + FLOOR_BOUNDS.minZ) / 2;

const asphaltMat = new MeshStandardMaterial({ color: P.asphalt, roughness: 1, flatShading: true });
const grassMat = new MeshStandardMaterial({ color: P.grass, roughness: 1, flatShading: true });

/** Marciapiedi rialzati con cordolo (sud, ovest, est con varco per la stazione). */
function useSidewalkGeometry() {
  const geo = useMemo(() => {
    const parts: Part[] = [];
    const h = 0.14;
    const add = (minX: number, maxX: number, minZ: number, maxZ: number) => {
      const w = maxX - minX;
      const d = maxZ - minZ;
      parts.push(
        box(w, h, d, P.paver, {
          pos: [(minX + maxX) / 2, h / 2, (minZ + maxZ) / 2],
          gradient: [0.85, 1.05],
        }),
      );
    };
    const curb = (minX: number, maxX: number, minZ: number, maxZ: number) => {
      parts.push(
        box(maxX - minX, h + 0.02, maxZ - minZ, P.curb, {
          pos: [(minX + maxX) / 2, (h + 0.02) / 2, (minZ + maxZ) / 2],
        }),
      );
    };
    // sud
    add(PLAZA.minX, PLAZA.maxX, 13.2, PLAZA.maxZ);
    curb(PLAZA.minX, PLAZA.maxX, 13.05, 13.2);
    // ovest
    add(PLAZA.minX, -18.6, PLAZA.minZ, 13.2);
    curb(-18.75, -18.6, PLAZA.minZ, 13.05);
    // est: due tratti con il varco verso la stazione
    add(18.6, PLAZA.maxX, PLAZA.minZ, STATION_GAP.minZ);
    curb(18.6, 18.75, PLAZA.minZ, STATION_GAP.minZ);
    add(18.6, PLAZA.maxX, STATION_GAP.maxZ, 13.2);
    curb(18.6, 18.75, STATION_GAP.maxZ, 13.2);
    return mergeParts(parts);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

export function Piazza() {
  const floorTex = useMemo(() => makePiazzaFloorTexture(), []);
  const floorMat = useMemo(
    () => new MeshStandardMaterial({ map: floorTex, roughness: 0.96, metalness: 0 }),
    [floorTex],
  );
  useEffect(
    () => () => {
      floorTex.dispose();
      floorMat.dispose();
    },
    [floorTex, floorMat],
  );
  const sidewalks = useSidewalkGeometry();

  return (
    <group>
      {/* terreno: asfalto di base, prato a nord, piazza in cemento */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.03, 0]} material={asphaltMat} receiveShadow>
        <planeGeometry args={[400, 400]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -48]} material={grassMat} receiveShadow>
        <planeGeometry args={[300, 65]} />
      </mesh>
      <mesh
        rotation-x={-Math.PI / 2}
        position={[floorCx, 0, floorCz]}
        material={floorMat}
        receiveShadow
      >
        <planeGeometry args={[floorW, floorD]} />
      </mesh>
      <mesh geometry={sidewalks} material={matVC} receiveShadow castShadow />

      <Bleachers />
      <RecycleBin />
      <Benches />
      <StreetLamps />
      <TrashCans />
      <Pigeons />

      {PINES.map((p, i) => (
        <PineTree key={i} spec={p} />
      ))}
      <HolmOak />
      <Vegetation />
      <Buildings />

      <Sign
        lines={['Piazza della Pace']}
        bg="#1f4f8f"
        fg="#ffffff"
        width={SIGN_BOARD.w}
        height={SIGN_BOARD.h}
        position={[SIGN_BOARD.x, SIGN_BOARD.y, SIGN_BOARD.z]}
        rotationY={Math.PI}
        posts
      />
      <Sign
        lines={['STAZIONE →']}
        bg="#1f4f8f"
        fg="#ffffff"
        width={STATION_SIGN.w}
        height={STATION_SIGN.h}
        position={[STATION_SIGN.x, STATION_SIGN.y, STATION_SIGN.z]}
        rotationY={-Math.PI / 2}
        posts
      />
    </group>
  );
}
