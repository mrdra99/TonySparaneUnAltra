/**
 * Layout della piazza: UNICA fonte di verita' per geometria visiva (Piazza.tsx) e collider
 * (piazzaColliders.ts). Convenzioni: metri, Y su, x = est, z = sud (il nord e' -z).
 * Area giocabile: x in [-20, 20], z in [-15, 15].
 */

export const PLAZA = { minX: -20, maxX: 20, minZ: -15, maxZ: 15 } as const;

export interface Placement {
  x: number;
  z: number;
  /** Rotazione Y: la "faccia" del prop (+z locale) guarda verso (sin, cos). */
  rotY: number;
}

export const BENCHES: readonly Placement[] = [
  { x: -9, z: -8.2, rotY: 0 },
  { x: -17.9, z: -1.5, rotY: Math.PI / 2 },
  { x: -17.9, z: 4.5, rotY: Math.PI / 2 },
  { x: 17.9, z: 7.2, rotY: -Math.PI / 2 },
  { x: 5, z: 14.3, rotY: Math.PI },
  { x: -2, z: 14.3, rotY: Math.PI },
];
export const BENCH_SIZE = { w: 1.9, d: 0.6 } as const;

/** Il braccio curvo del lampione punta verso +z locale. */
export const LAMPS: readonly Placement[] = [
  { x: -18.3, z: -9, rotY: Math.PI / 2 },
  { x: -18.3, z: 8.5, rotY: Math.PI / 2 },
  { x: 18.5, z: -6.8, rotY: -Math.PI / 2 },
  { x: 18.5, z: 10.8, rotY: -Math.PI / 2 },
  { x: -8, z: 14.4, rotY: Math.PI },
  { x: 9, z: 14.4, rotY: Math.PI },
];

export const TRASH_CANS: readonly Placement[] = [
  { x: -17.6, z: 1.5, rotY: 0 },
  { x: 7, z: 14.5, rotY: 0 },
  { x: 17.6, z: 4.8, rotY: 0 },
];

export interface PineSpec {
  x: number;
  z: number;
  height: number;
  /** Inclinazione del tronco (rad) verso la direzione leanDir (rad, 0 = +x). */
  lean: number;
  leanDir: number;
  variant: number;
  rotY: number;
  swayPhase: number;
}

export const PINES: readonly PineSpec[] = [
  {
    x: -13.5,
    z: -13.4,
    height: 11.5,
    lean: 0.2,
    leanDir: 0.4,
    variant: 0,
    rotY: 0.3,
    swayPhase: 0.2,
  },
  {
    x: -5,
    z: -17.4,
    height: 12.5,
    lean: 0.14,
    leanDir: 3.4,
    variant: 1,
    rotY: 1.1,
    swayPhase: 1.7,
  },
  { x: 2.5, z: -16.8, height: 11, lean: 0.1, leanDir: 0.2, variant: 2, rotY: 2.0, swayPhase: 3.1 },
  { x: 9.5, z: -16.4, height: 12, lean: 0.18, leanDir: 2.7, variant: 0, rotY: 0.9, swayPhase: 4.4 },
  {
    x: 17.6,
    z: -13.4,
    height: 12.8,
    lean: 0.17,
    leanDir: 3.0,
    variant: 1,
    rotY: 2.6,
    swayPhase: 5.2,
  },
  {
    x: -18.3,
    z: -3.2,
    height: 10.5,
    lean: 0.24,
    leanDir: 0.1,
    variant: 2,
    rotY: 0.5,
    swayPhase: 2.4,
  },
  { x: 18.6, z: 13.3, height: 11, lean: 0.15, leanDir: 3.3, variant: 0, rotY: 1.7, swayPhase: 0.9 },
  { x: -19, z: 12.8, height: 10, lean: 0.2, leanDir: 0.2, variant: 1, rotY: 3.3, swayPhase: 3.8 },
];
export const PINE_TRUNK_R = 0.38;

export const HOLM_OAK = { x: 11.4, z: -12.7, trunkR: 0.62 } as const;

export const BLEACHERS = {
  cx: 0,
  /** Fronte della gradinata (z maggiore). */
  zFront: -11.5,
  width: 16,
  steps: 7,
  stepDepth: 0.5,
  stepHeight: 0.3,
} as const;

export const BIN = { x: 15.5, z: -11.6, w: 3.4, d: 1.5 } as const;

export const SIGN_BOARD = { x: -11, z: 14.2, w: 3.1, h: 0.85, y: 2.05 } as const;
export const STATION_SIGN = { x: 19.2, z: -4.9, w: 2.9, h: 0.8, y: 2.6 } as const;
/** Apertura verso la stazione (i marciapiedi est la lasciano libera). */
export const STATION_GAP = { minZ: -3.5, maxZ: 5.5 } as const;

export type Facing = 'N' | 'S' | 'E' | 'W';

export interface BuildingSpec {
  id: string;
  cx: number;
  cz: number;
  w: number;
  d: number;
  /** Altezza delle pareti (esclusi i tetti). */
  h: number;
  color: string;
  /** Lato su cui sta la facciata decorata: direzione della normale (N = guarda a nord, -z). */
  face: Facing;
  shop?: boolean;
  roofColor?: string;
  roofHeight?: number;
}

export const BUILDINGS: readonly BuildingSpec[] = [
  // sud (guardano a nord, facciata a z = 19.5)
  { id: 'S1', cx: -24, cz: 25, w: 14, d: 11, h: 6.8, color: '#efe3c4', face: 'N' },
  { id: 'S2', cx: -8, cz: 25, w: 14, d: 11, h: 6.8, color: '#e8c55a', face: 'N', shop: true },
  { id: 'S3', cx: 7, cz: 25, w: 12, d: 11, h: 7.2, color: '#f2ede0', face: 'N', shop: true },
  { id: 'S4', cx: 22, cz: 25, w: 14, d: 11, h: 6.6, color: '#d9a55a', face: 'N' },
  // ovest (guardano a est, facciata a x = -24.5)
  { id: 'W1', cx: -30.5, cz: -9, w: 12, d: 12, h: 6.8, color: '#e8c55a', face: 'E' },
  { id: 'W2', cx: -30.5, cz: 6, w: 12, d: 14, h: 7, color: '#f2ede0', face: 'E', shop: true },
  // est (guardano a ovest, facciata a x = 24.5)
  { id: 'E1', cx: 30.5, cz: -10, w: 12, d: 12, h: 6.8, color: '#efe3c4', face: 'W' },
  { id: 'E2', cx: 30.5, cz: 11.5, w: 12, d: 14, h: 6.6, color: '#e2b18c', face: 'W' },
  // stazione in lontananza (oltre l'uscita)
  {
    id: 'ST',
    cx: 52,
    cz: 0.5,
    w: 12,
    d: 14,
    h: 5.2,
    color: '#cfd3d6',
    face: 'W',
    roofColor: '#7d8286',
    roofHeight: 1.4,
  },
  // case lontane a nord, tra i tronchi dei pini
  { id: 'N1', cx: -15, cz: -33, w: 12, d: 9, h: 6.4, color: '#e8c55a', face: 'S' },
  { id: 'N2', cx: 4, cz: -34, w: 14, d: 9, h: 6.8, color: '#f2ede0', face: 'S' },
  { id: 'N3', cx: 24, cz: -33, w: 12, d: 9, h: 6.4, color: '#efe3c4', face: 'S' },
  { id: 'N4', cx: -34, cz: -26, w: 9, d: 12, h: 6.4, color: '#d9a55a', face: 'E' },
];

export interface FacadeFrame {
  /** Centro del piano di facciata (a terra). */
  x: number;
  z: number;
  /** Normale uscente (verso la piazza). */
  nx: number;
  nz: number;
  /** Tangente lungo la facciata. */
  tx: number;
  tz: number;
  length: number;
  rotY: number;
}

export function facadeFrame(b: BuildingSpec): FacadeFrame {
  let nx = 0;
  let nz = 0;
  if (b.face === 'N') nz = -1;
  else if (b.face === 'S') nz = 1;
  else if (b.face === 'E') nx = 1;
  else nx = -1;
  const half = nx !== 0 ? b.w / 2 : b.d / 2;
  const length = nx !== 0 ? b.d : b.w;
  return {
    x: b.cx + nx * half,
    z: b.cz + nz * half,
    nx,
    nz,
    tx: -nz,
    tz: nx,
    length,
    rotY: Math.atan2(nx, nz),
  };
}

export interface BuildingSignSpec {
  building: string;
  text: string;
  bg: string;
  fg: string;
  along: number;
  y: number;
  w: number;
  h: number;
}

export const BUILDING_SIGNS: readonly BuildingSignSpec[] = [
  {
    building: 'S2',
    text: 'Bar La Piazzetta',
    bg: '#7a2b2b',
    fg: '#f6e7c1',
    along: 0,
    y: 3.5,
    w: 4.6,
    h: 0.85,
  },
  {
    building: 'S3',
    text: 'Pizzeria da Gino',
    bg: '#2b6b3a',
    fg: '#fbf2d6',
    along: 0,
    y: 3.5,
    w: 4.6,
    h: 0.85,
  },
  {
    building: 'W2',
    text: 'Tabacchi',
    bg: '#1f3a6b',
    fg: '#f4f1e6',
    along: -1,
    y: 3.5,
    w: 3.2,
    h: 0.85,
  },
  {
    building: 'ST',
    text: 'STAZIONE',
    bg: '#1f4f8f',
    fg: '#ffffff',
    along: 0,
    y: 4.6,
    w: 6,
    h: 1.1,
  },
];
