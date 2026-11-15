import {
  createColliderRegistry,
  overlapsAny,
  raycast2D,
  resolveCircleVsColliders,
} from './collision';
import type { Collider, MutableVec2 } from './types';

const wall: Collider = { kind: 'box', minX: -5, maxX: 5, minZ: 2, maxZ: 3 };
const pt = (x: number, z: number): MutableVec2 => ({ x, z });

describe('resolveCircleVsColliders', () => {
  it('non muove un cerchio libero', () => {
    const p = pt(0, 0);
    resolveCircleVsColliders(p, 0.4, [wall]);
    expect(p).toEqual({ x: 0, z: 0 });
  });
  it('spinge fuori da un box lungo la normale', () => {
    const p = pt(0, 1.8); // penetra nella faccia sud (z=2) di 0.2
    resolveCircleVsColliders(p, 0.4, [wall]);
    expect(p.x).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(1.6);
  });
  it('slide: la componente tangente al muro viene conservata', () => {
    const p = pt(1.5, 1.9);
    resolveCircleVsColliders(p, 0.4, [wall]);
    expect(p.x).toBeCloseTo(1.5);
    expect(p.z).toBeCloseTo(1.6);
  });
  it('spinge fuori dal cerchio', () => {
    const p = pt(0.5, 0);
    resolveCircleVsColliders(p, 0.4, [{ kind: 'circle', x: 0, z: 0, r: 1 }]);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(1.4);
  });
  it('gestisce centro dentro il box (esce dalla faccia piu vicina)', () => {
    const p = pt(0, 2.1);
    resolveCircleVsColliders(p, 0.4, [wall]);
    expect(p.z).toBeCloseTo(1.6);
  });
  it('risolve angoli con piu collider', () => {
    const colliders: Collider[] = [
      { kind: 'box', minX: -5, maxX: 5, minZ: 2, maxZ: 3 },
      { kind: 'box', minX: 2, maxX: 3, minZ: -5, maxZ: 5 },
    ];
    const p = pt(1.8, 1.8);
    resolveCircleVsColliders(p, 0.4, colliders);
    expect(overlapsAny(p.x, p.z, 0.39, colliders)).toBe(false);
  });
  it('centro esattamente sul centro del cerchio non produce NaN', () => {
    const p = pt(0, 0);
    resolveCircleVsColliders(p, 0.4, [{ kind: 'circle', x: 0, z: 0, r: 1 }]);
    expect(Number.isFinite(p.x) && Number.isFinite(p.z)).toBe(true);
  });
});

describe('raycast2D', () => {
  it('restituisce 1 se libero', () => {
    expect(raycast2D(0, 0, 0, -5, [wall])).toBe(1);
  });
  it('restituisce la frazione del primo impatto su un box', () => {
    // da (0,0) a (0,10): colpisce z=2 a t=0.2
    expect(raycast2D(0, 0, 0, 10, [wall])).toBeCloseTo(0.2);
  });
  it('considera il margin', () => {
    expect(raycast2D(0, 0, 0, 10, [wall], 0.5)).toBeCloseTo(0.15);
  });
  it('colpisce un cerchio', () => {
    expect(raycast2D(-5, 0, 5, 0, [{ kind: 'circle', x: 0, z: 0, r: 1 }])).toBeCloseTo(0.4);
  });
  it('inizio dentro un collider = 0', () => {
    expect(raycast2D(0, 2.5, 0, 10, [wall])).toBe(0);
  });
  it('prende il piu vicino tra piu collider', () => {
    const far: Collider = { kind: 'box', minX: -1, maxX: 1, minZ: 8, maxZ: 9 };
    expect(raycast2D(0, 0, 0, 10, [far, wall])).toBeCloseTo(0.2);
  });
});

describe('colliderRegistry', () => {
  it('add / remove / clear / list stabile', () => {
    const r = createColliderRegistry();
    r.add('a', wall);
    const list1 = r.list();
    expect(list1).toHaveLength(1);
    expect(r.list()).toBe(list1); // nessuna ricostruzione se invariato
    r.add('b', { kind: 'circle', x: 0, z: 0, r: 1 });
    expect(r.list()).toHaveLength(2);
    expect(r.remove('a')).toBe(true);
    expect(r.remove('a')).toBe(false);
    expect(r.list()).toHaveLength(1);
    r.clear();
    expect(r.size).toBe(0);
    expect(r.list()).toHaveLength(0);
  });
  it('add con lo stesso id sostituisce', () => {
    const r = createColliderRegistry();
    r.add('a', wall);
    r.add('a', { kind: 'circle', x: 1, z: 1, r: 1 });
    expect(r.list()).toEqual([{ kind: 'circle', x: 1, z: 1, r: 1 }]);
  });
  it('addMany restituisce il cleanup e removeByPrefix funziona', () => {
    const r = createColliderRegistry();
    const dispose = r.addMany('world:', [wall, wall]);
    r.add('npc:x', wall);
    expect(r.size).toBe(3);
    dispose();
    expect(r.size).toBe(1);
    r.addMany('world:', [wall]);
    expect(r.removeByPrefix('world:')).toBe(1);
    expect(r.has('npc:x')).toBe(true);
  });
});
