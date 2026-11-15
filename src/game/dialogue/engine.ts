/**
 * OWNER: Architecture.
 * Motore dialoghi: state machine PURA. Nessuno stato interno: ogni funzione riceve il Dialogue,
 * lo stato corrente e il progresso, e restituisce {state, effects}. Gli `effects` sono quelli da
 * applicare (via applyEffects) e sono gia' ordinati: prima quelli della scelta, poi quelli del nodo
 * raggiunto. Lo store li applica e aggiorna il progresso PRIMA della chiamata successiva.
 *
 * Stati:
 *   idle         nessun dialogo
 *   active       una battuta, `advance` passa al nodo `next` (o termina)
 *   choice       battuta con scelte visibili; si procede con `choose(index)`
 *   consequence  battuta raggiunta DOPO una scelta (reazione); per la UI e' come `active`
 *   ended        dialogo concluso (`completed` true = arrivato alla fine, false = chiuso a meta')
 *
 * Nodi condizionali: `requires` non soddisfatto -> `fallback` (o fine). `Dialogue.repeatStart`
 * e' il nodo iniziale usato se il dialogo e' gia' stato completato (nessun blocco alla riapertura).
 */
import {
  DIALOGUE_END,
  type Condition,
  type Dialogue,
  type DialogueEffect,
  type DialogueMood,
  type DialogueNode,
  type PlayerProgress,
  type SpeakerId,
} from '@/game/core/types';
import {
  hasFlag,
  isDialogueCompleted,
  isMissionActive,
  isMissionCompleted,
  isObjectiveCompleted,
} from '@/game/progression/progress';

export interface DialogueLine {
  nodeId: string;
  speaker: SpeakerId;
  text: string;
  mood?: DialogueMood;
  gesture?: boolean;
}

export interface ResolvedChoice {
  /** Posizione tra le scelte VISIBILI: e' il valore da passare a choose(). */
  index: number;
  /** Indice nell'array originale `node.choices`. */
  sourceIndex: number;
  text: string;
}

export type DialogueState =
  | { status: 'idle' }
  | { status: 'active'; dialogueId: string; nodeId: string; line: DialogueLine }
  | {
      status: 'choice';
      dialogueId: string;
      nodeId: string;
      line: DialogueLine;
      choices: readonly ResolvedChoice[];
    }
  | {
      status: 'consequence';
      dialogueId: string;
      nodeId: string;
      line: DialogueLine;
      choiceText: string;
    }
  | { status: 'ended'; dialogueId: string; completed: boolean };

export interface DialogueStep {
  state: DialogueState;
  effects: readonly DialogueEffect[];
}

export const IDLE_DIALOGUE: DialogueState = { status: 'idle' };
const MAX_CHAIN = 32;

export function evaluateCondition(cond: Condition, progress: PlayerProgress): boolean {
  switch (cond.type) {
    case 'flag':
      return hasFlag(progress, cond.flag);
    case 'notFlag':
      return !hasFlag(progress, cond.flag);
    case 'objectiveCompleted':
      return isObjectiveCompleted(progress, cond.missionId, cond.objectiveId);
    case 'objectiveNotCompleted':
      return !isObjectiveCompleted(progress, cond.missionId, cond.objectiveId);
    case 'missionCompleted':
      return isMissionCompleted(progress, cond.missionId);
    case 'missionActive':
      return isMissionActive(progress, cond.missionId);
    case 'minCazzate':
      return progress.cazzate >= cond.value;
    case 'dialogueCompleted':
      return isDialogueCompleted(progress, cond.dialogueId);
  }
}

export function evaluateConditions(
  conds: readonly Condition[] | undefined,
  progress: PlayerProgress,
): boolean {
  return !conds || conds.every((c) => evaluateCondition(c, progress));
}

function lineOf(node: DialogueNode): DialogueLine {
  const line: DialogueLine = { nodeId: node.id, speaker: node.speaker, text: node.text };
  if (node.mood) line.mood = node.mood;
  if (node.gesture) line.gesture = true;
  return line;
}

const ended = (
  dialogueId: string,
  completed: boolean,
  effects: readonly DialogueEffect[] = [],
): DialogueStep => ({
  state: { status: 'ended', dialogueId, completed },
  effects,
});

/** Entra in un nodo: gestisce requires/fallback, effetti d'ingresso e scelta dello stato. */
function enter(
  dialogue: Dialogue,
  nodeId: string,
  progress: PlayerProgress,
  viaChoice: { text: string } | null,
  carried: readonly DialogueEffect[],
  depth = 0,
): DialogueStep {
  if (nodeId === DIALOGUE_END) return ended(dialogue.id, true, carried);
  const node = dialogue.nodes[nodeId];
  if (!node || depth > MAX_CHAIN) return ended(dialogue.id, false, carried);

  if (!evaluateConditions(node.requires, progress)) {
    return node.fallback
      ? enter(dialogue, node.fallback, progress, viaChoice, carried, depth + 1)
      : ended(dialogue.id, false, carried);
  }

  const effects = node.effects ? [...carried, ...node.effects] : carried;
  const line = lineOf(node);

  const visible: ResolvedChoice[] = [];
  node.choices?.forEach((c, sourceIndex) => {
    if (evaluateConditions(c.requires, progress)) {
      visible.push({ index: visible.length, sourceIndex, text: c.text });
    }
  });
  if (visible.length > 0) {
    return {
      state: { status: 'choice', dialogueId: dialogue.id, nodeId: node.id, line, choices: visible },
      effects,
    };
  }
  if (viaChoice) {
    return {
      state: {
        status: 'consequence',
        dialogueId: dialogue.id,
        nodeId: node.id,
        line,
        choiceText: viaChoice.text,
      },
      effects,
    };
  }
  return {
    state: { status: 'active', dialogueId: dialogue.id, nodeId: node.id, line },
    effects,
  };
}

/** Avvia un dialogo. Usa `repeatStart` se il dialogo e' gia' completato. */
export function startDialogue(dialogue: Dialogue, progress: PlayerProgress): DialogueStep {
  const startId =
    dialogue.repeatStart && isDialogueCompleted(progress, dialogue.id)
      ? dialogue.repeatStart
      : dialogue.start;
  return enter(dialogue, startId, progress, null, []);
}

/** Avanza da una battuta (active/consequence). Negli altri stati e' un no-op. */
export function advanceDialogue(
  dialogue: Dialogue,
  state: DialogueState,
  progress: PlayerProgress,
): DialogueStep {
  if (state.status !== 'active' && state.status !== 'consequence') return { state, effects: [] };
  const node = dialogue.nodes[state.nodeId];
  const next = node?.next;
  if (!next) return ended(dialogue.id, true);
  return enter(dialogue, next, progress, null, []);
}

/** Sceglie la risposta `index` (posizione tra le visibili). Fuori range / stato errato = no-op. */
export function chooseDialogue(
  dialogue: Dialogue,
  state: DialogueState,
  index: number,
  progress: PlayerProgress,
): DialogueStep {
  if (state.status !== 'choice') return { state, effects: [] };
  const picked = state.choices[index];
  const node = dialogue.nodes[state.nodeId];
  const choice = picked ? node?.choices?.[picked.sourceIndex] : undefined;
  if (!choice) return { state, effects: [] };
  return enter(dialogue, choice.next, progress, { text: choice.text }, choice.effects ?? []);
}

/** Chiude il dialogo a meta' (Esc / pulsante): ended con completed=false. */
export function closeDialogue(state: DialogueState): DialogueStep {
  if (state.status === 'idle') return { state, effects: [] };
  return ended(state.dialogueId, false);
}

/** Verifica strutturale di un dialogo. Restituisce la lista dei problemi (vuota = ok). */
export function validateDialogue(dialogue: Dialogue): string[] {
  const problems: string[] = [];
  const has = (id: string | undefined): boolean =>
    id === DIALOGUE_END || (!!id && id in dialogue.nodes);
  const where = (id: string): string => `${dialogue.id}/${id}`;
  if (!has(dialogue.start)) problems.push(`${dialogue.id}: start '${dialogue.start}' inesistente`);
  if (dialogue.repeatStart && !has(dialogue.repeatStart)) {
    problems.push(`${dialogue.id}: repeatStart '${dialogue.repeatStart}' inesistente`);
  }
  const reachable = new Set<string>();
  const visit = (id: string | undefined): void => {
    if (!id || id === DIALOGUE_END || reachable.has(id)) return;
    const node = dialogue.nodes[id];
    if (!node) return;
    reachable.add(id);
    visit(node.next);
    visit(node.fallback);
    node.choices?.forEach((c) => visit(c.next));
  };
  visit(dialogue.start);
  visit(dialogue.repeatStart);
  for (const [key, node] of Object.entries(dialogue.nodes)) {
    if (node.id !== key)
      problems.push(`${where(key)}: id del nodo '${node.id}' diverso dalla chiave`);
    if (node.next && !has(node.next))
      problems.push(`${where(key)}: next '${node.next}' inesistente`);
    if (node.fallback && !has(node.fallback)) {
      problems.push(`${where(key)}: fallback '${node.fallback}' inesistente`);
    }
    node.choices?.forEach((c, i) => {
      if (!has(c.next)) problems.push(`${where(key)}: choice ${i} next '${c.next}' inesistente`);
    });
    if (node.choices && node.choices.length > 0 && node.next) {
      problems.push(`${where(key)}: ha sia choices sia next (next ignorato)`);
    }
    if (!reachable.has(key)) problems.push(`${where(key)}: nodo non raggiungibile`);
  }
  return problems;
}
