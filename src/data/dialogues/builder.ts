// OWNER: Gameplay
// Piccoli helper per scrivere i dialoghi come dati compatti. Nessuna logica di gioco.
import {
  DIALOGUE_END,
  type Condition,
  type Dialogue,
  type DialogueChoice,
  type DialogueEffect,
  type DialogueMood,
  type DialogueNode,
} from '@/game/core/types';

export const END = DIALOGUE_END;
export const TONY = 'tony';
export const NARRATOR = 'narrator';

interface LineOpts {
  mood?: DialogueMood;
  gesture?: boolean;
  next?: string;
  effects?: readonly DialogueEffect[];
  choices?: readonly DialogueChoice[];
  requires?: readonly Condition[];
  fallback?: string;
}

/** Nodo di dialogo: `line('id', 'marco', 'testo', { next: 'altro' })`. */
export function line(id: string, speaker: string, text: string, opts: LineOpts = {}): DialogueNode {
  return { id, speaker, text, ...opts };
}

/** Costruisce un Dialogue da una lista di nodi (le chiavi sono gli id dei nodi). */
export function dialogue(
  id: string,
  start: string,
  nodes: readonly DialogueNode[],
  repeatStart?: string,
): Dialogue {
  const record: Record<string, DialogueNode> = {};
  for (const n of nodes) {
    if (n.id in record) throw new Error(`Nodo duplicato '${n.id}' nel dialogo '${id}'`);
    record[n.id] = n;
  }
  return repeatStart ? { id, start, repeatStart, nodes: record } : { id, start, nodes: record };
}

/** Effetto Cazzatometro (one-shot per `onceId`). */
export const cazzate = (amount: number, reason: string, onceId: string): DialogueEffect => ({
  type: 'addCazzate',
  amount,
  reason,
  onceId,
});

export const objective = (missionId: string, objectiveId: string): DialogueEffect => ({
  type: 'completeObjective',
  missionId,
  objectiveId,
});

export const flag = (name: string): DialogueEffect => ({ type: 'setFlag', flag: name });
export const startMission = (missionId: string): DialogueEffect => ({
  type: 'startMission',
  missionId,
});
export const unlockStory = (storyId: string): DialogueEffect => ({ type: 'unlockStory', storyId });
export const celebrate = (kind: 'confetti' | 'comicBurst'): DialogueEffect => ({
  type: 'triggerCelebration',
  kind,
});

/**
 * Coda comune ai dialoghi che possono chiudere una missione: se la missione e' completata mostra
 * una battuta del narratore e avvia (opzionalmente) la successiva; altrimenti il dialogo termina
 * subito (fallback END = completato, quindi nessun blocco). Nodi: `chain` -> `chain2` -> fine.
 */
export function completionChain(opts: {
  missionId: string;
  text: string;
  hint?: string;
  next?: string;
  extra?: readonly DialogueEffect[];
}): DialogueNode[] {
  const effects: DialogueEffect[] = [...(opts.extra ?? [])];
  if (opts.next) effects.push(startMission(opts.next));
  const chain = line('chain', NARRATOR, opts.text, {
    requires: [{ type: 'missionCompleted', missionId: opts.missionId }],
    fallback: END,
    effects,
    next: opts.hint ? 'chain2' : END,
  });
  return opts.hint ? [chain, line('chain2', NARRATOR, opts.hint, { next: END })] : [chain];
}
