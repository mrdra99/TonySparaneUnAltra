/**
 * OWNER: Architecture.
 * Registro interagibili (NPC, oggetti, punti missione, punti "SPARANE UN'ALTRA"): un unico
 * sistema generico, senza React. Chi crea un'entita' interagibile la registra e la rimuove al
 * cleanup; InteractionSystem interroga `findNearest` e lo store esegue l'azione.
 */
import { DEFAULT_INTERACT_RADIUS } from '@/game/core/constants';
import type { InteractableDefinition, NpcDefinition } from '@/game/core/types';

export const RANDOM_STORY_LABEL = "SPARANE UN'ALTRA";

/** Etichetta standard per gli NPC: "PARLA CON MARCO". */
export function npcPromptLabel(name: string): string {
  return `PARLA CON ${name.toUpperCase()}`;
}

/** Interagibile standard di un NPC con dialogo (id `npc:<id>`). Undefined se non ha dialogo. */
export function npcToInteractable(npc: NpcDefinition): InteractableDefinition | null {
  if (!npc.dialogueId) return null;
  return {
    id: `npc:${npc.id}`,
    position: npc.position,
    radius: DEFAULT_INTERACT_RADIUS + (npc.colliderRadius ?? 0),
    label: npcPromptLabel(npc.name),
    action: { type: 'dialogue', dialogueId: npc.dialogueId },
  };
}

/** True se l'interagibile e' attivo (default true). */
export function isInteractableEnabled(def: InteractableDefinition): boolean {
  return def.enabled !== false;
}

/**
 * Funzione pura: l'interagibile piu' vicino (entro il proprio raggio) a (x, z).
 * Include quelli disabilitati (per mostrare `disabledLabel`). A pari distanza vince `priority`.
 */
export function findNearestInteractable(
  items: Iterable<InteractableDefinition>,
  x: number,
  z: number,
): InteractableDefinition | null {
  let best: InteractableDefinition | null = null;
  let bestD2 = Infinity;
  let bestPriority = -Infinity;
  for (const it of items) {
    const dx = it.position[0] - x;
    const dz = it.position[1] - z;
    const d2 = dx * dx + dz * dz;
    if (d2 > it.radius * it.radius) continue;
    const pr = it.priority ?? 0;
    if (d2 < bestD2 - 1e-9 || (Math.abs(d2 - bestD2) <= 1e-9 && pr > bestPriority)) {
      best = it;
      bestD2 = d2;
      bestPriority = pr;
    }
  }
  return best;
}

export interface InteractionRegistry {
  /** Registra (o sostituisce) un interagibile. Restituisce la funzione di rimozione. */
  register(def: InteractableDefinition): () => void;
  unregister(id: string): boolean;
  setEnabled(id: string, enabled: boolean): void;
  get(id: string): InteractableDefinition | undefined;
  list(): readonly InteractableDefinition[];
  findNearest(x: number, z: number): InteractableDefinition | null;
  clear(): void;
}

export function createInteractionRegistry(): InteractionRegistry {
  const map = new Map<string, InteractableDefinition>();
  let cache: readonly InteractableDefinition[] = [];
  let dirty = false;

  const registry: InteractionRegistry = {
    register(def) {
      map.set(def.id, def);
      dirty = true;
      return () => {
        // rimuove solo se non e' stato nel frattempo sostituito da un'altra registrazione
        if (map.get(def.id) === def) {
          map.delete(def.id);
          dirty = true;
        }
      };
    },
    unregister(id) {
      const had = map.delete(id);
      if (had) dirty = true;
      return had;
    },
    setEnabled(id, enabled) {
      const def = map.get(id);
      if (!def || isInteractableEnabled(def) === enabled) return;
      map.set(id, { ...def, enabled });
      dirty = true;
    },
    get: (id) => map.get(id),
    list() {
      if (dirty) {
        cache = [...map.values()];
        dirty = false;
      }
      return cache;
    },
    findNearest(x, z) {
      return findNearestInteractable(registry.list(), x, z);
    },
    clear() {
      map.clear();
      dirty = true;
    },
  };
  return registry;
}

/** Registro globale usato dal gioco. */
export const interactionRegistry: InteractionRegistry = createInteractionRegistry();
