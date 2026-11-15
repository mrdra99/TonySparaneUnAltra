// OWNER: Gameplay
// Calcoli PURI delle inquadrature (nessun Three.js): testabili e senza allocazioni (scrivono in `out`).

export interface ShotOut {
  camX: number;
  camZ: number;
  lookX: number;
  lookZ: number;
}

export const createShotOut = (): ShotOut => ({ camX: 0, camZ: 0, lookX: 0, lookZ: 0 });

/**
 * Inquadratura di dialogo "di lato": camera a `offset` metri dal punto medio fra Tony e
 * l'interlocutore, perpendicolare alla loro congiungente (`side` = +1 / -1 sceglie il lato),
 * leggermente arretrata. Senza interlocutore usa la direzione verso cui guarda Tony.
 */
export function dialogueShot(
  px: number,
  pz: number,
  targetX: number,
  targetZ: number,
  hasTarget: boolean,
  facingY: number,
  side: 1 | -1,
  out: ShotOut,
  offset = 3,
): ShotOut {
  const mx = hasTarget ? (px + targetX) / 2 : px;
  const mz = hasTarget ? (pz + targetZ) / 2 : pz;
  let dx = hasTarget ? targetX - px : Math.sin(facingY);
  let dz = hasTarget ? targetZ - pz : Math.cos(facingY);
  const len = Math.hypot(dx, dz);
  if (len < 0.05) {
    dx = Math.sin(facingY);
    dz = Math.cos(facingY);
  } else {
    dx /= len;
    dz /= len;
  }
  // perpendicolare (sinistra della direzione Tony -> interlocutore) e arretramento di 0.6 m
  out.camX = mx - dz * side * offset - dx * 0.6;
  out.camZ = mz + dx * side * offset - dz * 0.6;
  out.lookX = mx;
  out.lookZ = mz;
  return out;
}

/** Angolo di oscillazione dell'orbita del menu (rad), simmetrico attorno alla direzione frontale. */
export function menuOrbitAngle(t: number, reducedMotion: boolean): number {
  return Math.sin(t * (reducedMotion ? 0.05 : 0.16)) * (reducedMotion ? 0.35 : 1.05);
}

/** Direzione orizzontale (dal bersaglio verso la camera) per yaw/pitch di follow. Scrive in `out`. */
export function followBackVector(
  yaw: number,
  pitch: number,
  out: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  const cp = Math.cos(pitch);
  out.x = -Math.sin(yaw) * cp;
  out.y = Math.sin(pitch);
  out.z = -Math.cos(yaw) * cp;
  return out;
}
