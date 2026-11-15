// OWNER: World&3D
// TEMP STUB creato da Architecture per far compilare il resto: World lo SOSTITUISCE con la propria versione
// mantenendo gli export `PIAZZA_COLLIDERS` e `PIAZZA_POINTS` (firme sotto).
// Sistema di coordinate: metri, Y up, piazza 40x30 centrata in (0,0), nord = -Z, gradinata a nord,
// uscita verso la stazione a est (x = +20). rotationY 0 = guarda +Z (PI = guarda verso nord).
import type { ColliderShape, Vec2 } from '@/game/core/types';

export const PIAZZA_BOUNDS = { minX: -20, maxX: 20, minZ: -15, maxZ: 15 } as const;

export const PIAZZA_COLLIDERS: readonly ColliderShape[] = [
  // muri perimetrali (spessi 1 m, fuori dai limiti)
  { kind: 'box', minX: -21, maxX: -20, minZ: -16, maxZ: 16 }, // ovest
  { kind: 'box', minX: -21, maxX: 21, minZ: -16, maxZ: -15 }, // nord
  { kind: 'box', minX: -21, maxX: 21, minZ: 15, maxZ: 16 }, // sud
  { kind: 'box', minX: 20, maxX: 21, minZ: -16, maxZ: 3 }, // est (nord dell'uscita)
  { kind: 'box', minX: 20, maxX: 21, minZ: 9, maxZ: 16 }, // est (sud dell'uscita)
  // gradinata a nord
  { kind: 'box', minX: -10, maxX: 4, minZ: -14.6, maxZ: -10.2 },
];

export interface PiazzaPoints {
  spawn: Vec2;
  /** Orientamento iniziale di Tony (PI = verso la gradinata). */
  spawnRotationY: number;
  /** Centro dell'area di ritrovo degli NPC. */
  npcArea: Vec2;
  bike: Vec2;
  /** Soglia dell'uscita verso la stazione (est). */
  stationExit: Vec2;
  /** Centro della gradinata. */
  stands: Vec2;
  /** Punti "SPARANE UN'ALTRA". */
  sparane: readonly Vec2[];
}

export const PIAZZA_POINTS: PiazzaPoints = {
  spawn: [0, 9],
  spawnRotationY: Math.PI,
  npcArea: [5, -1],
  bike: [-10, -7.5],
  stationExit: [19, 6],
  stands: [-3, -12.4],
  sparane: [
    [-13, 2],
    [12, -6],
    [-5, 10],
    [9, 9],
  ],
};
