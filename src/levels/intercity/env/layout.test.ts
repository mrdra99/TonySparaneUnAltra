// Validazione "a tavolino" di ambienti e collider (niente WebGL): spawn liberi, NPC e interagibili raggiungibili,
// nessun elemento di scena fuori dai muri, geometrie fuse valide.
import { overlapsAny } from '@/game/core/collision';
import { PLAYER_RADIUS } from '@/game/core/constants';
import type { ColliderShape, Vec2 } from '@/game/core/types';
import { PIAZZA_COLLIDERS } from '@/world/environments/piazzaColliders';
import { FINALE_CHARACTERS, LEVEL_INTERACTABLES } from '../data/cast';
import type { FlashbackLevelId } from '../logic/ids';
import { collidersFor } from '../logic/colliders';
import { flashbackSpawn } from '../logic/spawns';
import {
  getCoachGeometry,
  getCoachWindowsGeometry,
  getPalmGeometry,
  getPisaPlatformGeometry,
  getTaxiGeometry,
  getTrackGeometry,
  getViareggioStationGeometry,
} from './geometries';

const LEVELS: readonly FlashbackLevelId[] = [
  'intercity-pisa',
  'intercity-viareggio',
  'intercity-torre',
];

function shapes(level: FlashbackLevelId): readonly ColliderShape[] {
  return level === 'intercity-torre' ? PIAZZA_COLLIDERS : collidersFor(level);
}

const STEP = 0.25;
const BOUNDS = { minX: -17, maxX: 17, minZ: -9, maxZ: 11 } as const;

/** Celle raggiungibili dallo spawn con un cerchio di raggio Tony (griglia 25 cm). */
function reachable(level: FlashbackLevelId): (p: Vec2, within: number) => boolean {
  const cs = shapes(level);
  const sp = flashbackSpawn(level).position;
  const key = (i: number, j: number): string => `${i},${j}`;
  const seen = new Set<string>();
  const queue: [number, number][] = [[Math.round(sp[0] / STEP), Math.round(sp[1] / STEP)]];
  seen.add(key(queue[0]?.[0] ?? 0, queue[0]?.[1] ?? 0));
  while (queue.length > 0) {
    const cur = queue.pop();
    if (!cur) break;
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const i = cur[0] + di;
      const j = cur[1] + dj;
      const x = i * STEP;
      const z = j * STEP;
      if (x < BOUNDS.minX - 8 || x > BOUNDS.maxX + 8 || z < BOUNDS.minZ - 8 || z > BOUNDS.maxZ + 8)
        continue;
      if (seen.has(key(i, j)) || overlapsAny(x, z, PLAYER_RADIUS, cs)) continue;
      seen.add(key(i, j));
      queue.push([i, j]);
    }
  }
  return (p, within) => {
    for (const k of seen) {
      const [i, j] = k.split(',').map(Number);
      if (Math.hypot((i ?? 0) * STEP - p[0], (j ?? 0) * STEP - p[1]) <= within) return true;
    }
    return false;
  };
}

describe.each(LEVELS)('%s', (level) => {
  const cs = shapes(level);

  it('lo spawn di Tony e libero', () => {
    const sp = flashbackSpawn(level).position;
    expect(overlapsAny(sp[0], sp[1], PLAYER_RADIUS, cs)).toBe(false);
  });

  it('i personaggi non stanno dentro i collider statici (>= 1 m di margine)', () => {
    for (const c of FINALE_CHARACTERS.filter((x) => x.level === level)) {
      expect(overlapsAny(c.position[0], c.position[1], 1.0, cs), c.id).toBe(false);
    }
  });

  it('ogni personaggio con dialogo e ogni interagibile e raggiungibile da Tony', () => {
    const near = reachable(level);
    for (const c of FINALE_CHARACTERS.filter((x) => x.level === level && x.dialogueId)) {
      expect(near(c.position, 2.2), c.id).toBe(true);
    }
    for (const it of LEVEL_INTERACTABLES.filter((x) => x.level === level)) {
      expect(near(it.def.position, it.def.radius - 0.1), it.def.id).toBe(true);
    }
  });
});

describe('geometrie fuse', () => {
  it.each([
    ['vagone', getCoachGeometry],
    ['vetri del vagone', getCoachWindowsGeometry],
    ['binario', getTrackGeometry],
    ['banchina', getPisaPlatformGeometry],
    ['stazione di Viareggio', getViareggioStationGeometry],
    ['taxi', getTaxiGeometry],
    ['palma', getPalmGeometry],
  ])('%s: ha vertici e vertex color, ed e memoizzata', (_name, get) => {
    const g = get();
    expect(g.getAttribute('position').count).toBeGreaterThan(0);
    expect(g.getAttribute('color').count).toBe(g.getAttribute('position').count);
    expect(get()).toBe(g);
  });

  it('il treno entra nei muri laterali del binario', () => {
    const box = getCoachGeometry().boundingBox;
    expect(box).not.toBeNull();
    expect(box?.max.x ?? 99).toBeLessThanOrEqual(6.3);
    expect(box?.max.y ?? 99).toBeLessThan(4.5);
  });
});
