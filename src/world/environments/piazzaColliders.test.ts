import { describe, expect, it } from 'vitest';
import { PIAZZA_COLLIDERS, PIAZZA_POINTS, type ColliderShape } from './piazzaColliders';

type P = readonly [number, number];

function inside(c: ColliderShape, [x, z]: P, margin = 0): boolean {
  if (c.kind === 'circle') return Math.hypot(x - c.x, z - c.z) < c.r + margin;
  return x > c.minX - margin && x < c.maxX + margin && z > c.minZ - margin && z < c.maxZ + margin;
}
const blocked = (p: P, margin = 0) => PIAZZA_COLLIDERS.some((c) => inside(c, p, margin));
const inBounds = ([x, z]: P) => x >= -20 && x <= 20 && z >= -15 && z <= 15;

describe('PIAZZA_POINTS', () => {
  const singles: Record<string, P> = {
    spawn: PIAZZA_POINTS.spawn,
    npcArea: PIAZZA_POINTS.npcArea,
    bike: PIAZZA_POINTS.bike,
    stationExit: PIAZZA_POINTS.stationExit,
    stands: PIAZZA_POINTS.stands,
    standsFront: PIAZZA_POINTS.standsFront,
    bin: PIAZZA_POINTS.bin,
    pencilCollectible: PIAZZA_POINTS.pencilCollectible,
    menuCameraOrbitCenter: PIAZZA_POINTS.menuCameraOrbitCenter,
  };

  it.each(Object.entries(singles))('%s e dentro i confini giocabili', (_name, p) => {
    expect(inBounds(p)).toBe(true);
  });

  it('i punti di interazione non finiscono dentro un collider (margine 0.4 m)', () => {
    for (const key of [
      'spawn',
      'npcArea',
      'bike',
      'stationExit',
      'standsFront',
      'bin',
      'pencilCollectible',
    ] as const) {
      expect(blocked(singles[key] as P, 0.4), key).toBe(false);
    }
  });

  it('spawn guarda la gradinata (nord = -z)', () => {
    expect(Math.cos(PIAZZA_POINTS.spawnRotationY)).toBeLessThan(-0.99);
  });

  it('sparane (3) sono liberi e dentro i confini', () => {
    expect(PIAZZA_POINTS.sparane).toHaveLength(3);
    for (const p of PIAZZA_POINTS.sparane) {
      expect(inBounds(p)).toBe(true);
      expect(blocked(p, 0.4)).toBe(false);
    }
  });

  it('npcSpots: almeno 8, liberi (margine 0.6 m) e a distanza fra loro', () => {
    const spots = PIAZZA_POINTS.npcSpots;
    expect(spots.length).toBeGreaterThanOrEqual(8);
    spots.forEach((s, i) => {
      expect(inBounds(s.pos), `spot ${i}`).toBe(true);
      expect(blocked(s.pos, 0.6), `spot ${i}`).toBe(false);
      expect(Number.isFinite(s.rotationY)).toBe(true);
      spots.slice(i + 1).forEach((o, k) => {
        expect(
          Math.hypot(s.pos[0] - o.pos[0], s.pos[1] - o.pos[1]),
          `spot ${i}-${i + 1 + k}`,
        ).toBeGreaterThan(1.2);
      });
    });
  });

  it('i muri perimetrali chiudono l area giocabile', () => {
    for (const p of [
      [-21, 0],
      [21, 0],
      [0, -16],
      [0, 16],
      [-21, -16],
      [21, 16],
    ] as P[]) {
      expect(blocked(p), String(p)).toBe(true);
    }
    // il varco verso la stazione e' dentro il perimetro, oltre e' muro
    expect(blocked([20.5, 1.2])).toBe(true);
  });
});
