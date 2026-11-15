/**
 * OWNER: Architecture.
 * Collisioni 2D (piano XZ) pure e senza allocazioni per frame.
 *  - registro dei collider statici (add/remove/clear, senza React)
 *  - risoluzione cerchio (player) vs collider con "slide" lungo le pareti
 *  - raycast 2D (per camera anti-occlusione)
 */
import type { Collider, MutableVec2 } from './types';

const EPS = 1e-6;

/** Spinge il punto fuori da un AABB (considerando il raggio). Restituisce true se ha spostato. */
function pushOutOfBox(
  p: MutableVec2,
  r: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): boolean {
  const cx = Math.min(maxX, Math.max(minX, p.x));
  const cz = Math.min(maxZ, Math.max(minZ, p.z));
  const dx = p.x - cx;
  const dz = p.z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return false;
  if (d2 > EPS) {
    const d = Math.sqrt(d2);
    p.x = cx + (dx / d) * r;
    p.z = cz + (dz / d) * r;
    return true;
  }
  // Centro dentro (o sul bordo) del box: esci dalla faccia piu' vicina.
  const toMinX = p.x - minX;
  const toMaxX = maxX - p.x;
  const toMinZ = p.z - minZ;
  const toMaxZ = maxZ - p.z;
  const m = Math.min(toMinX, toMaxX, toMinZ, toMaxZ);
  if (m === toMinX) p.x = minX - r;
  else if (m === toMaxX) p.x = maxX + r;
  else if (m === toMinZ) p.z = minZ - r;
  else p.z = maxZ + r;
  return true;
}

function pushOut(p: MutableVec2, r: number, c: Collider): boolean {
  if (c.kind === 'circle') {
    const dx = p.x - c.x;
    const dz = p.z - c.z;
    const min = r + c.r;
    const d2 = dx * dx + dz * dz;
    if (d2 >= min * min) return false;
    if (d2 < EPS) {
      p.x = c.x + min;
      return true;
    }
    const d = Math.sqrt(d2);
    p.x = c.x + (dx / d) * min;
    p.z = c.z + (dz / d) * min;
    return true;
  }
  return pushOutOfBox(p, r, c.minX, c.maxX, c.minZ, c.maxZ);
}

/**
 * Risolve in-place la posizione `p` di un cerchio di raggio `radius` contro i collider.
 * Chiamarla DOPO aver applicato lo spostamento desiderato: la componente che penetra viene
 * rimossa e quella tangente resta (effetto slide). Piu' passate per angoli/collider adiacenti.
 */
export function resolveCircleVsColliders(
  p: MutableVec2,
  radius: number,
  colliders: readonly Collider[],
  passes = 4,
): MutableVec2 {
  for (let i = 0; i < passes; i++) {
    let moved = false;
    for (let j = 0; j < colliders.length; j++) {
      const c = colliders[j];
      if (c && pushOut(p, radius, c)) moved = true;
    }
    if (!moved) break;
  }
  return p;
}

/** True se il cerchio e' in contatto con almeno un collider. */
export function overlapsAny(
  x: number,
  z: number,
  radius: number,
  colliders: readonly Collider[],
): boolean {
  for (let j = 0; j < colliders.length; j++) {
    const c = colliders[j];
    if (!c) continue;
    if (c.kind === 'circle') {
      const dx = x - c.x;
      const dz = z - c.z;
      const m = radius + c.r;
      if (dx * dx + dz * dz < m * m) return true;
    } else {
      const cx = Math.min(c.maxX, Math.max(c.minX, x));
      const cz = Math.min(c.maxZ, Math.max(c.minZ, z));
      const dx = x - cx;
      const dz = z - cz;
      if (dx * dx + dz * dz < radius * radius) return true;
    }
  }
  return false;
}

/**
 * Raycast 2D del segmento A->B contro i collider (ingranditi di `margin`).
 * Restituisce la frazione t in [0,1] del primo impatto; 1 se il segmento e' libero.
 * Pensato per la camera: `distance = t * distanceDesiderata`.
 */
export function raycast2D(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  colliders: readonly Collider[],
  margin = 0,
): number {
  const dx = bx - ax;
  const dz = bz - az;
  let best = 1;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    if (!c) continue;
    let t = Infinity;
    if (c.kind === 'circle') {
      const R = c.r + margin;
      const fx = ax - c.x;
      const fz = az - c.z;
      const a = dx * dx + dz * dz;
      if (a < EPS) continue;
      const b = 2 * (fx * dx + fz * dz);
      const cc = fx * fx + fz * fz - R * R;
      if (cc <= 0) {
        t = 0;
      } else {
        const disc = b * b - 4 * a * cc;
        if (disc >= 0) {
          const s = (-b - Math.sqrt(disc)) / (2 * a);
          if (s >= 0) t = s;
        }
      }
    } else {
      let tMin = 0;
      let tMax = 1;
      const minX = c.minX - margin;
      const maxX = c.maxX + margin;
      const minZ = c.minZ - margin;
      const maxZ = c.maxZ + margin;
      let hit = true;
      if (Math.abs(dx) < EPS) {
        if (ax < minX || ax > maxX) hit = false;
      } else {
        let t1 = (minX - ax) / dx;
        let t2 = (maxX - ax) / dx;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
      }
      if (hit) {
        if (Math.abs(dz) < EPS) {
          if (az < minZ || az > maxZ) hit = false;
        } else {
          let t1 = (minZ - az) / dz;
          let t2 = (maxZ - az) / dz;
          if (t1 > t2) [t1, t2] = [t2, t1];
          tMin = Math.max(tMin, t1);
          tMax = Math.min(tMax, t2);
        }
      }
      if (hit && tMin <= tMax) t = tMin;
    }
    if (t < best) best = t;
  }
  return best;
}

// ---------------------------------------------------------------------------
// Registro
// ---------------------------------------------------------------------------

export interface ColliderRegistry {
  /** Aggiunge o sostituisce il collider con questo id. */
  add(id: string, collider: Collider): void;
  /** Aggiunge molti collider con id `${prefix}${index}`. Restituisce una funzione di rimozione. */
  addMany(prefix: string, colliders: readonly Collider[]): () => void;
  remove(id: string): boolean;
  removeByPrefix(prefix: string): number;
  clear(): void;
  has(id: string): boolean;
  /** Array stabile (ricostruito solo quando il registro cambia): sicuro da leggere ogni frame. */
  list(): readonly Collider[];
  readonly size: number;
}

export function createColliderRegistry(): ColliderRegistry {
  const map = new Map<string, Collider>();
  let cache: readonly Collider[] = [];
  let dirty = false;

  const registry: ColliderRegistry = {
    add(id, collider) {
      map.set(id, collider);
      dirty = true;
    },
    addMany(prefix, colliders) {
      const ids = colliders.map((c, i) => {
        const id = `${prefix}${i}`;
        map.set(id, c);
        return id;
      });
      dirty = true;
      return () => {
        ids.forEach((id) => map.delete(id));
        dirty = true;
      };
    },
    remove(id) {
      const had = map.delete(id);
      if (had) dirty = true;
      return had;
    },
    removeByPrefix(prefix) {
      let n = 0;
      for (const id of [...map.keys()]) {
        if (id.startsWith(prefix)) {
          map.delete(id);
          n++;
        }
      }
      if (n > 0) dirty = true;
      return n;
    },
    clear() {
      map.clear();
      dirty = true;
    },
    has: (id) => map.has(id),
    list() {
      if (dirty) {
        cache = [...map.values()];
        dirty = false;
      }
      return cache;
    },
    get size() {
      return map.size;
    },
  };
  return registry;
}

/** Registro globale usato dal gioco (World/Npcs registrano, PlayerController legge). */
export const colliderRegistry: ColliderRegistry = createColliderRegistry();
