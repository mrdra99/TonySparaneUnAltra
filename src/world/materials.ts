/**
 * Palette e materiali condivisi dell'intero mondo (istanze a livello di modulo, mai
 * ricreate né eliminate: sopravvivono a smontaggi/StrictMode).
 */
import { DoubleSide, MeshStandardMaterial } from 'three';

export const PALETTE = {
  concrete: '#cbc4b6',
  concreteWarm: '#d3c7b0',
  concreteDark: '#9d988c',
  concreteStep: '#a7a399',
  paver: '#b79f8b',
  curb: '#d9d3c7',
  asphalt: '#46464a',
  grass: '#6e8d47',
  grassDark: '#587339',
  pineBark: '#7a5441',
  pineBarkTop: '#a56b48',
  pineNeedle: '#386a3a',
  pineNeedleLight: '#52853f',
  oakLeaf: '#27452f',
  oakLeafLight: '#3b6340',
  bush: '#3f6a37',
  wood: '#9a6a3e',
  woodDark: '#6e4a2c',
  metal: '#37433f',
  metalLight: '#8d949a',
  yellow: '#e6c14f',
  cream: '#eee1be',
  white: '#f3efe6',
  ochre: '#d9a55a',
  salmon: '#e2b18c',
  terracotta: '#b9532f',
  terracottaDark: '#97402a',
  teal: '#3f8f94',
  navy: '#1d2a4d',
  orange: '#e8873a',
  glass: '#2c3a4a',
  shutterGreen: '#4b6b45',
  shutterBrown: '#7a4f33',
  sky: '#8fc4f2',
  fog: '#d4e6f2',
} as const;

/** Materiale per geometrie fuse con vertex color (flat shading: look low-poly). */
export const matVC = new MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.92,
  metalness: 0,
});

/** Come matVC ma con ombreggiatura morbida (personaggi, teste). */
export const matVCSmooth = new MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.78,
  metalness: 0,
});

/** Bianco tinto per-istanza (instanceColor). */
export const matInstanced = new MeshStandardMaterial({
  color: '#ffffff',
  flatShading: true,
  roughness: 0.95,
  metalness: 0,
});

/** Chiome e cespugli: foglie a due facce non necessarie, solo flat. */
export const matFoliage = new MeshStandardMaterial({
  color: '#ffffff',
  vertexColors: true,
  flatShading: true,
  roughness: 1,
  metalness: 0,
});

/** Tegole: stesso materiale istanziato, colore per istanza. */
export const matRoof = new MeshStandardMaterial({
  color: '#ffffff',
  flatShading: true,
  roughness: 0.85,
  metalness: 0,
  side: DoubleSide,
});

/** Lente dei lampioni: leggermente emissiva. */
export const matLamp = new MeshStandardMaterial({
  color: '#fff4cf',
  emissive: '#ffe9a8',
  emissiveIntensity: 0.35,
  roughness: 0.4,
});
