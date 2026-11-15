/**
 * OWNER: Architecture (funzioni pure di supporto; Gameplay puo' estenderle).
 * Convenzione: yaw 0 guarda +Z; il "destra" di chi guarda +Z e' -X.
 */
import type { MutableVec2 } from '@/game/core/types';

/**
 * Converte l'asse di input (x: destra+, y: avanti+) in direzione mondo (x, z) relativa alla camera.
 * `out.x/out.z` sono la direzione (lunghezza = intensita' dell'input, <= 1).
 */
export function inputToWorldDirection(
  axisX: number,
  axisY: number,
  cameraYaw: number,
  out: MutableVec2,
): MutableVec2 {
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);
  // forward = (sin, cos); right = (-cos, sin)
  out.x = sin * axisY - cos * axisX;
  out.z = cos * axisY + sin * axisX;
  return out;
}

/** Normalizza un angolo in (-PI, PI]. */
export function wrapAngle(a: number): number {
  let r = (a + Math.PI) % (2 * Math.PI);
  if (r <= 0) r += 2 * Math.PI;
  return r - Math.PI;
}

/** Differenza angolare minima da `from` a `to` in (-PI, PI]. */
export function angleDelta(from: number, to: number): number {
  return wrapAngle(to - from);
}

/** Smorzamento esponenziale indipendente dal frame rate: porta `current` verso `target`. */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp(-rate * dt);
}

/** Come damp ma lungo il percorso angolare piu' breve. */
export function dampAngle(current: number, target: number, rate: number, dt: number): number {
  return current + angleDelta(current, target) * (1 - Math.exp(-rate * dt));
}
