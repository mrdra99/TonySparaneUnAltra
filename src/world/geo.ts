/**
 * Utility di modellazione low-poly: ogni "Part" e' una primitiva colorata (vertex color) che
 * viene fusa con le altre in UNA SOLA BufferGeometry. Cosi' un albero, una panchina o un
 * personaggio costano 1-2 draw call invece di decine di mesh.
 */
import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type V3 = readonly [number, number, number];

export interface PartOpts {
  pos?: V3;
  /** Rotazione Euler XYZ in radianti. */
  rot?: V3;
  scale?: V3 | number;
  /** Quaternione esplicito (ha priorita' su rot). */
  quat?: readonly [number, number, number, number];
  /** Moltiplicatore di luminosita' [fondo, cima] interpolato sull'altezza della parte. */
  gradient?: readonly [number, number];
}

export interface Part extends PartOpts {
  geo: BufferGeometry;
  color: string | number;
}

const m4 = new Matrix4();
const q4 = new Quaternion();
const e3 = new Euler();
const p3 = new Vector3();
const s3 = new Vector3();
const c3 = new Color();
const UP = new Vector3(0, 1, 0);
const dirV = new Vector3();

/** Fonde le parti in un'unica geometria non indicizzata con attributo `color`. */
export function mergeParts(parts: readonly Part[]): BufferGeometry {
  const list: BufferGeometry[] = [];
  for (const part of parts) {
    let g = part.geo;
    if (g.index) {
      const flat = g.toNonIndexed();
      g.dispose();
      g = flat;
    }
    for (const name of ['uv', 'uv1', 'uv2']) {
      if (g.getAttribute(name)) g.deleteAttribute(name);
    }
    const [px, py, pz] = part.pos ?? [0, 0, 0];
    p3.set(px, py, pz);
    if (part.quat) q4.set(part.quat[0], part.quat[1], part.quat[2], part.quat[3]);
    else {
      const [rx, ry, rz] = part.rot ?? [0, 0, 0];
      e3.set(rx, ry, rz);
      q4.setFromEuler(e3);
    }
    const sc = part.scale ?? 1;
    if (typeof sc === 'number') s3.set(sc, sc, sc);
    else s3.set(sc[0], sc[1], sc[2]);
    m4.compose(p3, q4, s3);
    g.applyMatrix4(m4);

    c3.set(part.color);
    const pos = g.getAttribute('position');
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    let minY = Infinity;
    let maxY = -Infinity;
    if (part.gradient) {
      for (let i = 0; i < count; i++) {
        const y = pos.getY(i);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const span = Math.max(1e-6, maxY - minY);
    for (let i = 0; i < count; i++) {
      let k = 1;
      if (part.gradient) {
        const t = (pos.getY(i) - minY) / span;
        k = part.gradient[0] + (part.gradient[1] - part.gradient[0]) * t;
      }
      colors[i * 3] = c3.r * k;
      colors[i * 3 + 1] = c3.g * k;
      colors[i * 3 + 2] = c3.b * k;
    }
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    list.push(g);
  }
  const merged = mergeGeometries(list, false);
  for (const g of list) g.dispose();
  if (!merged) throw new Error('mergeParts: attributi incompatibili');
  merged.computeBoundingSphere();
  merged.computeBoundingBox();
  return merged;
}

export const box = (
  w: number,
  h: number,
  d: number,
  color: string | number,
  o: PartOpts = {},
): Part => ({
  geo: new BoxGeometry(w, h, d),
  color,
  ...o,
});

export const sphere = (r: number, color: string | number, o: PartOpts = {}, seg = 10): Part => ({
  geo: new SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7))),
  color,
  ...o,
});

/** Arco di sfera (calotte per capelli, barba...). */
export const sphereArc = (
  r: number,
  color: string | number,
  arc: readonly [phiStart: number, phiLength: number, thetaStart: number, thetaLength: number],
  o: PartOpts = {},
  seg = 12,
): Part => ({
  geo: new SphereGeometry(
    r,
    seg,
    Math.max(4, Math.round(seg * 0.7)),
    arc[0],
    arc[1],
    arc[2],
    arc[3],
  ),
  color,
  ...o,
});

export const blob = (r: number, color: string | number, o: PartOpts = {}, detail = 1): Part => ({
  geo: new IcosahedronGeometry(r, detail),
  color,
  ...o,
});

export const cyl = (
  rTop: number,
  rBottom: number,
  h: number,
  color: string | number,
  o: PartOpts = {},
  seg = 8,
): Part => ({ geo: new CylinderGeometry(rTop, rBottom, h, seg), color, ...o });

export const cone = (
  r: number,
  h: number,
  color: string | number,
  o: PartOpts = {},
  seg = 6,
): Part => ({
  geo: new ConeGeometry(r, h, seg),
  color,
  ...o,
});

export const torus = (
  radius: number,
  tube: number,
  color: string | number,
  o: PartOpts = {},
  radial = 6,
  tubular = 14,
): Part => ({ geo: new TorusGeometry(radius, tube, radial, tubular), color, ...o });

/** Cilindro rastremato da a (raggio r1) a b (raggio r2). */
export function limb(
  a: V3,
  b: V3,
  r1: number,
  r2: number,
  color: string | number,
  o: PartOpts = {},
  seg = 6,
): Part {
  dirV.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = dirV.length();
  dirV.normalize();
  q4.setFromUnitVectors(UP, dirV);
  return {
    geo: new CylinderGeometry(r2, r1, len, seg),
    color,
    pos: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2],
    quat: [q4.x, q4.y, q4.z, q4.w],
    ...o,
  };
}

/** PRNG deterministico (mulberry32): stesso mondo a ogni avvio. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Piccolo hash di stringa -> numero (seed deterministico per aspetto/fase). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Smorzamento esponenziale indipendente dal frame rate. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
