// OWNER: Gameplay
/**
 * Override dinamici degli interagibili in base al progresso (puro).
 * Esempio: i punti "SPARANE UN'ALTRA" diventano storie del World Tour mentre la missione 6 e'
 * attiva; la bici e' "non disponibile" finche' Tony non ha raccontato la leggenda.
 * Gli override sono dati (src/data/interactables); l'ultimo che combacia vince.
 */
import type {
  Condition,
  GameContent,
  InteractableDefinition,
  PlayerProgress,
} from '@/game/core/types';
import { evaluateConditions } from '@/game/dialogue/engine';
import { npcToInteractable } from '@/game/interactions/registry';

export interface InteractableOverride {
  /** Id dell'interagibile da modificare. */
  id: string;
  requires: readonly Condition[];
  patch: Partial<Omit<InteractableDefinition, 'id' | 'position'>>;
}

export interface ResolvedInteractable {
  def: InteractableDefinition;
  /** Indice dell'override applicato (-1 = definizione base). Utile per capire se e' cambiato. */
  overrideIndex: number;
}

export function resolveInteractable(
  def: InteractableDefinition,
  progress: PlayerProgress,
  overrides: readonly InteractableOverride[],
): ResolvedInteractable {
  let matched = -1;
  overrides.forEach((o, i) => {
    if (o.id === def.id && evaluateConditions(o.requires, progress)) matched = i;
  });
  const o = matched >= 0 ? overrides[matched] : undefined;
  return { def: o ? { ...def, ...o.patch } : def, overrideIndex: matched };
}

/** Tutti gli interagibili "effettivi" (NPC + oggetti) per il progresso dato. */
export function effectiveInteractables(
  content: GameContent,
  progress: PlayerProgress,
  overrides: readonly InteractableOverride[],
): InteractableDefinition[] {
  const base = [
    ...content.npcs.flatMap((n) => {
      const i = npcToInteractable(n);
      return i ? [i] : [];
    }),
    ...content.interactables,
  ];
  return base.map((d) => resolveInteractable(d, progress, overrides).def);
}
