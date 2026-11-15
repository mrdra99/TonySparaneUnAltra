/** Collider 2D dei livelli del flashback (puro). Coordinate locali di ogni tappa, nord = -Z. */
import type { ColliderShape } from '@/game/core/types';
import type { FlashbackLevelId } from './ids';

const box = (minX: number, maxX: number, minZ: number, maxZ: number): ColliderShape => ({
  kind: 'box',
  minX,
  maxX,
  minZ,
  maxZ,
});
const circle = (x: number, z: number, r: number): ColliderShape => ({ kind: 'circle', x, z, r });

// --- Pisa: binario ----------------------------------------------------------------------------

/** Quattro vagoni da 12 m centrati su questi x; il lato porte e' a z = TRAIN_FACE_Z. */
export const COACH_CENTERS: readonly number[] = [-19.2, -6.4, 6.4, 19.2];
export const COACH_DOOR_OFFSETS: readonly number[] = [-4, 4];
export const TRAIN_FACE_Z = -3.4;
export const PISA_COLUMN_Z = 5.6;
export const PISA_COLUMN_XS: readonly number[] = [-14, -7, 0, 7, 14];
export const PISA_BENCHES: readonly { x: number; z: number }[] = [
  { x: -6, z: 1.4 },
  { x: 4, z: 1.4 },
];

const PISA: readonly ColliderShape[] = [
  box(-28, 28, -8, TRAIN_FACE_Z + 0.2), // treno
  box(-20, -17.3, -8, 12), // fondo ovest
  box(17.3, 20, -8, 12), // fondo est
  box(-20, 20, 9.5, 12), // muro del fabbricato viaggiatori
  ...PISA_COLUMN_XS.map((x) => circle(x, PISA_COLUMN_Z, 0.24)),
  ...PISA_BENCHES.map((b) => box(b.x - 0.95, b.x + 0.95, b.z - 0.3, b.z + 0.3)),
  circle(12.6, 1.6, 0.2), // palo dell'orologio
  box(-4.6, -3.4, 8.4, 9.5), // distributore
];

// --- Viareggio: piazzale ----------------------------------------------------------------------

export const TAXI_POS = { x: 8, z: -2.4 } as const;
export const VGO_PALMS: readonly { x: number; z: number }[] = [
  { x: -9, z: -6.4 },
  { x: 1.8, z: -6.9 },
  { x: 12, z: -6.1 },
];
export const VGO_LAMPS: readonly { x: number; z: number }[] = [
  { x: -12.4, z: -6.4 },
  { x: -4.5, z: -6.9 },
  { x: 5.2, z: -6.9 },
  { x: 12.6, z: 6.5 },
];

const VIAREGGIO: readonly ColliderShape[] = [
  box(-16, 16, -15, -8.2), // stazione
  box(-16, -14.3, -9, 11), // bordo ovest
  box(14.3, 16, -9, 11), // bordo est
  box(-16, 16, 9.8, 11.5), // bordo sud
  box(TAXI_POS.x - 2.3, TAXI_POS.x + 2.3, TAXI_POS.z - 1, TAXI_POS.z + 1), // taxi
  ...VGO_PALMS.map((p) => circle(p.x, p.z, 0.3)),
  ...VGO_LAMPS.map((p) => circle(p.x, p.z, 0.25)),
  box(-7.3, -5.3, 7.7, 8.3), // panchina
  circle(14.6 - 1.4, 3, 0.15), // palo fermata taxi
];

export function collidersFor(
  level: Exclude<FlashbackLevelId, 'intercity-torre'>,
): readonly ColliderShape[] {
  return level === 'intercity-pisa' ? PISA : VIAREGGIO;
}
