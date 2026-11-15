// OWNER: Gameplay
/**
 * Sistema di attenzione "TUTTI GUARDANO TONY": funzione PURA riutilizzabile da tutti gli NPC.
 * Non scrive nulla sugli oggetti 3D: restituisce gli angoli TARGET; Npcs.tsx li smorza (dampAngle)
 * su `rig.head.rotation.y` e `rig.torso.rotation.y` (pivot dell'NpcModel).
 *
 * Angoli relativi all'orientamento del busto a riposo (npcRotationY), convenzione rotationY.
 * Versione iniziale (Architecture): Gameplay puo' raffinarla (pitch, reazioni, emote).
 */
import { ATTENTION_DEFAULT_RADIUS } from '@/game/core/constants';
import { angleDelta } from '@/game/movement/movementMath';

export const HEAD_MAX_YAW = 1.2;
export const TORSO_MAX_YAW = 0.9;

export interface AttentionInput {
  npcX: number;
  npcZ: number;
  npcRotationY: number;
  tonyX: number;
  tonyZ: number;
  /** Default ATTENTION_DEFAULT_RADIUS. */
  radius?: number;
  watchesTony: boolean;
}

export interface AttentionOutput {
  /** True se Tony e' nel raggio e l'NPC lo sta guardando. */
  active: boolean;
  /** Yaw target della testa, relativo al busto. */
  headYaw: number;
  /** Yaw target del busto, relativo alla posa a riposo (0 se Tony non e' "dietro"). */
  torsoYaw: number;
  /** Distanza da Tony (utile per reazioni). */
  distance: number;
}

const clamp = (v: number, max: number): number => Math.max(-max, Math.min(max, v));

export function computeAttention(input: AttentionInput, out: AttentionOutput): AttentionOutput {
  const dx = input.tonyX - input.npcX;
  const dz = input.tonyZ - input.npcZ;
  const distance = Math.hypot(dx, dz);
  out.distance = distance;
  if (!input.watchesTony || distance > (input.radius ?? ATTENTION_DEFAULT_RADIUS)) {
    out.active = false;
    out.headYaw = 0;
    out.torsoYaw = 0;
    return out;
  }
  const desired = angleDelta(input.npcRotationY, Math.atan2(dx, dz));
  const torso = clamp(desired - clamp(desired, HEAD_MAX_YAW), TORSO_MAX_YAW);
  out.active = true;
  out.torsoYaw = torso;
  out.headYaw = clamp(desired - torso, HEAD_MAX_YAW);
  return out;
}
