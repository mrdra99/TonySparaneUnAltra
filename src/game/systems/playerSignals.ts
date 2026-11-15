// OWNER: Gameplay
// Segnali one-shot verso il PlayerController (unico scrittore di runtime.anim): l'InteractionSystem
// li alza, il controller li consuma. Niente React, niente store.
export const playerSignals = {
  /** performance.now() fino al quale Tony mostra l'animazione 'interact'. */
  interactUntilMs: 0,
};

export const INTERACT_ANIM_MS = 650;

export function pulseInteract(nowMs: number = performance.now()): void {
  playerSignals.interactUntilMs = nowMs + INTERACT_ANIM_MS;
}
