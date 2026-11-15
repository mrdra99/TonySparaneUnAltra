// OWNER: Gameplay
/**
 * Indicatori "!" sopra gli NPC/punti che hanno un obiettivo ATTIVO e non ancora completato (puro).
 * Un interagibile ha un obiettivo se il suo dialogo contiene un effetto `completeObjective`
 * (o se l'azione e' `mission`) per una missione in corso.
 */
import type {
  Dialogue,
  DialogueEffect,
  GameContent,
  InteractableDefinition,
  PlayerProgress,
} from '@/game/core/types';

export interface ObjectiveRef {
  missionId: string;
  objectiveId: string;
}

export interface MarkerTarget {
  id: string;
  x: number;
  z: number;
  /** Altezza (m) a cui mostrare l'indicatore. */
  y: number;
}

const cache = new WeakMap<Dialogue, readonly ObjectiveRef[]>();

function collect(effects: readonly DialogueEffect[] | undefined, out: ObjectiveRef[]): void {
  for (const e of effects ?? []) {
    if (e.type === 'completeObjective')
      out.push({ missionId: e.missionId, objectiveId: e.objectiveId });
  }
}

/** Obiettivi che un dialogo puo' completare (memoizzato). */
export function dialogueObjectives(d: Dialogue): readonly ObjectiveRef[] {
  const hit = cache.get(d);
  if (hit) return hit;
  const out: ObjectiveRef[] = [];
  for (const node of Object.values(d.nodes)) {
    collect(node.effects, out);
    node.choices?.forEach((c) => collect(c.effects, out));
  }
  cache.set(d, out);
  return out;
}

function isPending(progress: PlayerProgress, ref: ObjectiveRef): boolean {
  const m = progress.missions[ref.missionId];
  return m?.status === 'active' && !m.completedObjectives.includes(ref.objectiveId);
}

const DEFAULT_MARKER_HEIGHT = 2.1;

export function computeMarkerTargets(
  progress: PlayerProgress,
  content: GameContent,
  interactables: readonly InteractableDefinition[],
): MarkerTarget[] {
  const out: MarkerTarget[] = [];
  for (const it of interactables) {
    let refs: readonly ObjectiveRef[] = [];
    if (it.action.type === 'dialogue') {
      const d = content.dialogues[it.action.dialogueId];
      if (d) refs = dialogueObjectives(d);
    } else if (it.action.type === 'mission' && it.action.objectiveId) {
      refs = [{ missionId: it.action.missionId, objectiveId: it.action.objectiveId }];
    }
    if (!refs.some((r) => isPending(progress, r))) continue;
    const npc = it.id.startsWith('npc:')
      ? content.npcs.find((n) => `npc:${n.id}` === it.id)
      : undefined;
    out.push({
      id: it.id,
      x: it.position[0],
      z: it.position[1],
      y: npc ? npc.appearance.height + 0.5 : DEFAULT_MARKER_HEIGHT,
    });
  }
  return out;
}
