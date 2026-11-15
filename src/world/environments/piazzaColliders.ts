/**
 * Collider 2D (pianta XZ) e punti notevoli della piazza, derivati da layout.ts così da
 * restare coerenti con la geometria di Piazza.tsx. Coordinate in metri, Y su, nord = -z.
 */
import {
  BENCHES,
  BENCH_SIZE,
  BIN,
  BLEACHERS,
  HOLM_OAK,
  LAMPS,
  PINES,
  PINE_TRUNK_R,
  SIGN_BOARD,
  STATION_SIGN,
  TRASH_CANS,
} from './layout';

export type ColliderShape =
  | { kind: 'circle'; x: number; z: number; r: number }
  | { kind: 'box'; minX: number; maxX: number; minZ: number; maxZ: number };

const circle = (x: number, z: number, r: number): ColliderShape => ({ kind: 'circle', x, z, r });
const box = (minX: number, maxX: number, minZ: number, maxZ: number): ColliderShape => ({
  kind: 'box',
  minX,
  maxX,
  minZ,
  maxZ,
});

const bleachersHalf = BLEACHERS.width / 2 + 0.3;
const bleachersDepth = BLEACHERS.steps * BLEACHERS.stepDepth;

function buildColliders(): ColliderShape[] {
  const list: ColliderShape[] = [];

  // Gradinata (con ringhiere laterali) e cassonetto
  list.push(
    box(
      BLEACHERS.cx - bleachersHalf,
      BLEACHERS.cx + bleachersHalf,
      BLEACHERS.zFront - bleachersDepth - 0.5,
      BLEACHERS.zFront + 0.05,
    ),
  );
  list.push(box(BIN.x - BIN.w / 2, BIN.x + BIN.w / 2, BIN.z - BIN.d / 2, BIN.z + BIN.d / 2));

  // Alberi
  for (const p of PINES) list.push(circle(p.x, p.z, PINE_TRUNK_R));
  list.push(circle(HOLM_OAK.x, HOLM_OAK.z, HOLM_OAK.trunkR));

  // Panchine (ruotate di 0/90 gradi: box allineati agli assi)
  for (const b of BENCHES) {
    const sideways = Math.abs(Math.sin(b.rotY)) > 0.5;
    const hx = (sideways ? BENCH_SIZE.d : BENCH_SIZE.w) / 2;
    const hz = (sideways ? BENCH_SIZE.w : BENCH_SIZE.d) / 2;
    list.push(box(b.x - hx, b.x + hx, b.z - hz, b.z + hz));
  }

  // Lampioni e cestini
  for (const l of LAMPS) list.push(circle(l.x, l.z, 0.25));
  for (const t of TRASH_CANS) list.push(circle(t.x, t.z, 0.32));

  // Cartello "Piazza della Pace" (due pali) e cartello stazione (due pali)
  const bx = SIGN_BOARD.w / 2 - 0.2;
  list.push(
    circle(SIGN_BOARD.x - bx, SIGN_BOARD.z, 0.14),
    circle(SIGN_BOARD.x + bx, SIGN_BOARD.z, 0.14),
  );
  const sz = STATION_SIGN.w / 2 - 0.2;
  list.push(
    circle(STATION_SIGN.x, STATION_SIGN.z - sz, 0.14),
    circle(STATION_SIGN.x, STATION_SIGN.z + sz, 0.14),
  );

  // Muri perimetrali invisibili (area giocabile 40x30 centrata nell'origine)
  list.push(
    box(-23, 23, -18, -15), // nord
    box(-23, 23, 15, 18), // sud
    box(-23, -20, -18, 18), // ovest
    box(20, 23, -18, 18), // est
  );
  return list;
}

export const PIAZZA_COLLIDERS: readonly ColliderShape[] = buildColliders();

export type Vec2 = readonly [number, number];
interface NpcSpot {
  readonly pos: Vec2;
  /** Rotazione Y: facing = (sin, cos) sul piano XZ (0 = guarda a +z, sud). */
  readonly rotationY: number;
}

/** Spot che guarda verso (tx, tz). */
const spot = (x: number, z: number, tx: number, tz: number): NpcSpot => ({
  pos: [x, z],
  rotationY: Math.atan2(tx - x, tz - z),
});

const NPC_AREA: Vec2 = [6, -8];

export const PIAZZA_POINTS = {
  spawn: [0, 9],
  /** Rotazione Y allo spawn: Tony guarda la gradinata a nord (-z). */
  spawnRotationY: Math.PI,
  npcArea: NPC_AREA,
  npcSpots: [
    spot(3.6, -8.6, NPC_AREA[0], NPC_AREA[1]),
    spot(5.6, -9.9, NPC_AREA[0], NPC_AREA[1]),
    spot(8.0, -8.9, NPC_AREA[0], NPC_AREA[1]),
    spot(4.4, -6.2, NPC_AREA[0], NPC_AREA[1]),
    spot(7.2, -6.0, NPC_AREA[0], NPC_AREA[1]),
    spot(9.6, -6.8, NPC_AREA[0], NPC_AREA[1]),
    spot(-4.5, -9.3, 0, -3),
    spot(-6.5, -5.2, 0, 0),
    spot(1.5, -6.6, 6, -8),
    spot(12.4, -5.6, 8, -8),
    spot(-12.5, -3.8, -9, -8),
    spot(-3, 3.5, 0, 9),
    spot(9.5, 5.5, 0, 9),
    spot(-14.5, 8.5, -8, 5),
  ],
  bike: [12.6, -9.2],
  stationExit: [19, 1.2],
  /** Centro della gradinata. */
  stands: [BLEACHERS.cx, BLEACHERS.zFront - bleachersDepth / 2],
  /** Punto davanti alla gradinata (zona di interazione). */
  standsFront: [0, -10.2],
  bin: [15.5, -9.9],
  sparane: [
    [-8.5, -3.2],
    [4.5, 1.8],
    [11.5, -4.2],
  ],
  pencilCollectible: [-14.5, -5.8],
  menuCameraOrbitCenter: [1, -4],
} as const satisfies Record<string, unknown> & {
  spawn: Vec2;
  spawnRotationY: number;
  npcArea: Vec2;
  bike: Vec2;
  stationExit: Vec2;
  stands: Vec2;
  sparane: readonly Vec2[];
};
