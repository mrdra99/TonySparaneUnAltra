// OWNER: Gameplay
/**
 * Sistema di attenzione "TUTTI GUARDANO TONY": logica PURA riutilizzabile da tutti gli NPC.
 *
 *  - `computeAttention`: angoli TARGET (testa/busto/inclinazione) dato NPC e posizione di Tony.
 *  - `stepAttention`: smoothing esponenziale frame-independent verso il target (stato mutabile).
 *  - `updateReaction`: reazione comica occasionale ("👀", battute) con cooldown e senza ripetizioni.
 *
 * Nulla qui tocca oggetti 3D: Npcs.tsx scrive il risultato su `rig.head` / `rig.torso`.
 * Angoli relativi al busto a riposo (npcRotationY), convenzione rotationY (+ = verso +X).
 */
import { ATTENTION_DEFAULT_RADIUS } from '@/game/core/constants';
import { angleDelta, damp, dampAngle } from '@/game/movement/movementMath';

/** Limite di rotazione della testa (~70 gradi). */
export const HEAD_MAX_YAW = (70 * Math.PI) / 180;
/** Limite di rotazione del busto, usato solo se Tony e' "dietro" (~50 gradi). */
export const TORSO_MAX_YAW = (50 * Math.PI) / 180;
/** Limite di inclinazione della testa (su/giu'). */
export const HEAD_MAX_PITCH = 0.4;
/** Isteresi: una volta che guarda Tony, lo lascia solo oltre raggio * questo fattore. */
export const ATTENTION_EXIT_FACTOR = 1.2;

export interface AttentionInput {
  npcX: number;
  npcZ: number;
  npcRotationY: number;
  tonyX: number;
  tonyZ: number;
  /** Default ATTENTION_DEFAULT_RADIUS. */
  radius?: number;
  watchesTony: boolean;
  /** Se l'NPC stava gia' guardando Tony (abilita l'isteresi sul raggio d'uscita). */
  wasActive?: boolean;
  /** Altezza occhi dell'NPC (m, default 1.6) e di Tony (default 1.63): per l'inclinazione. */
  npcEyeY?: number;
  tonyEyeY?: number;
}

export interface AttentionOutput {
  /** True se Tony e' nel raggio e l'NPC lo sta guardando. */
  active: boolean;
  /** Yaw target della testa, relativo al busto. */
  headYaw: number;
  /** Yaw target del busto, relativo alla posa a riposo (0 se Tony non e' "dietro"). */
  torsoYaw: number;
  /** Pitch target della testa (positivo = guarda in basso). */
  headPitch: number;
  /** Distanza da Tony (utile per reazioni). */
  distance: number;
}

export const createAttentionOutput = (): AttentionOutput => ({
  active: false,
  headYaw: 0,
  torsoYaw: 0,
  headPitch: 0,
  distance: 0,
});

const clamp = (v: number, max: number): number => Math.max(-max, Math.min(max, v));

export function computeAttention(input: AttentionInput, out: AttentionOutput): AttentionOutput {
  const dx = input.tonyX - input.npcX;
  const dz = input.tonyZ - input.npcZ;
  const distance = Math.hypot(dx, dz);
  out.distance = distance;
  const radius =
    (input.radius ?? ATTENTION_DEFAULT_RADIUS) * (input.wasActive ? ATTENTION_EXIT_FACTOR : 1);
  if (!input.watchesTony || distance > radius) {
    out.active = false;
    out.headYaw = 0;
    out.torsoYaw = 0;
    out.headPitch = 0;
    return out;
  }
  const desired = angleDelta(input.npcRotationY, Math.atan2(dx, dz));
  // Il busto contribuisce solo per l'eccesso oltre il limite della testa (Tony dietro).
  const torso = clamp(desired - clamp(desired, HEAD_MAX_YAW), TORSO_MAX_YAW);
  out.active = true;
  out.torsoYaw = torso;
  out.headYaw = clamp(desired - torso, HEAD_MAX_YAW);
  const dy = (input.npcEyeY ?? 1.6) - (input.tonyEyeY ?? 1.63);
  out.headPitch = clamp(Math.atan2(dy, Math.max(distance, 0.5)), HEAD_MAX_PITCH);
  return out;
}

/** Angoli correnti (mutabili) dei pivot di un NPC. */
export interface AttentionPose {
  headYaw: number;
  torsoYaw: number;
  headPitch: number;
}

export const ATTENTION_RATES = {
  /** Velocita' di aggancio (1/s) mentre guarda Tony. */
  headIn: 8,
  torsoIn: 3.2,
  pitchIn: 6,
  /** Ritorno alla posa: piu' lento, piu' naturale. */
  headOut: 3,
  torsoOut: 1.6,
  pitchOut: 3,
} as const;

/**
 * Porta `pose` verso i target (`headYaw`/`torsoYaw`/`headPitch` sono gia' comprensivi di eventuali
 * movimenti idle) con smoothing esponenziale frame-independent. `engaged` = sta guardando Tony.
 */
export function stepAttention(
  pose: AttentionPose,
  target: { headYaw: number; torsoYaw: number; headPitch: number },
  engaged: boolean,
  dt: number,
): AttentionPose {
  const r = ATTENTION_RATES;
  pose.headYaw = dampAngle(pose.headYaw, target.headYaw, engaged ? r.headIn : r.headOut, dt);
  pose.torsoYaw = dampAngle(pose.torsoYaw, target.torsoYaw, engaged ? r.torsoIn : r.torsoOut, dt);
  pose.headPitch = damp(pose.headPitch, target.headPitch, engaged ? r.pitchIn : r.pitchOut, dt);
  return pose;
}

// ---------------------------------------------------------------------------
// Reazioni comiche
// ---------------------------------------------------------------------------

export const REACTION_EMOTE = '👀';

export interface ReactionState {
  /** Tony era nel raggio al frame precedente. */
  inside: boolean;
  /** Tempo (s) prima del quale non si reagisce piu'. */
  cooldownUntil: number;
  /** Indice dell'ultima battuta mostrata (-1 = nessuna). */
  lastIndex: number;
}

export const createReactionState = (): ReactionState => ({
  inside: false,
  cooldownUntil: 0,
  lastIndex: -1,
});

export interface ReactionOptions {
  /** Cooldown minimo/massimo (s) dopo una reazione. */
  cooldown?: readonly [number, number];
  /** Probabilita' di reagire a ogni ingresso nel raggio (default 0.7). */
  chance?: number;
  /** Probabilita' di preferire l'emote "👀" alla battuta (default 0.35). */
  emoteChance?: number;
}

/**
 * Da chiamare ogni frame. Restituisce il testo della nuvoletta SOLO sul frame in cui scatta una
 * reazione (ingresso di Tony nel raggio, fuori cooldown, a caso), altrimenti null.
 */
export function updateReaction(
  state: ReactionState,
  inside: boolean,
  nowSec: number,
  rng: () => number,
  lines: readonly string[],
  opts: ReactionOptions = {},
): string | null {
  const entered = inside && !state.inside;
  state.inside = inside;
  if (!entered || nowSec < state.cooldownUntil) return null;
  const [cdMin, cdMax] = opts.cooldown ?? [14, 28];
  state.cooldownUntil = nowSec + cdMin + rng() * (cdMax - cdMin);
  if (rng() > (opts.chance ?? 0.7)) return null;
  const pool = lines.length > 0 ? lines : [REACTION_EMOTE];
  if (pool.length === 1) return pool[0] ?? null;
  if (lines.length > 0 && rng() < (opts.emoteChance ?? 0.35) && !lines.includes(REACTION_EMOTE)) {
    return REACTION_EMOTE;
  }
  // Evita di ripetere subito l'ultima battuta.
  let idx = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  if (idx === state.lastIndex) idx = (idx + 1) % pool.length;
  state.lastIndex = idx;
  return pool[idx] ?? null;
}
