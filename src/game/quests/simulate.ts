// OWNER: Gameplay
/**
 * Simulatore PURO di dialoghi/missioni col motore reale (nessuno store, nessun React):
 * usato dai test di completabilita' e di bilancio del Cazzatometro.
 * Replica la logica dello store: effetti -> applyEffects, dialogo completato -> completedDialogues.
 */
import type { Dialogue, GameContent, PlayerProgress } from '@/game/core/types';
import {
  advanceDialogue,
  chooseDialogue,
  startDialogue,
  type DialogueState,
  type DialogueStep,
} from '@/game/dialogue/engine';
import { applyEffects } from '@/game/progression/effects';
import type { GameEvent } from '@/game/progression/events';
import { createInitialProgress } from '@/game/progression/progress';

export type ChoicePicker = (
  choices: readonly { index: number; sourceIndex: number; text: string }[],
  nodeId: string,
) => number;

export interface PlayResult {
  progress: PlayerProgress;
  events: GameEvent[];
  /** Nodi visitati, nell'ordine. */
  visited: string[];
  /** Testi delle battute mostrate. */
  lines: string[];
  completed: boolean;
}

export const pickFirst: ChoicePicker = () => 0;
export const pickLast: ChoicePicker = (choices) => choices.length - 1;
export const pickSource =
  (sourceIndex: number): ChoicePicker =>
  (choices) =>
    Math.max(
      0,
      choices.findIndex((c) => c.sourceIndex === sourceIndex),
    );

/** Nuova partita simulata (missioni autoStart avviate come fa lo store). */
export function newGameProgress(content: GameContent): PlayerProgress {
  const start = content.missionOrder.flatMap((id) =>
    content.missions[id]?.autoStart ? [{ type: 'startMission', missionId: id } as const] : [],
  );
  return applyEffects(createInitialProgress(1), start, content).progress;
}

/** Gioca un dialogo fino alla fine scegliendo con `pick`. */
export function playDialogue(
  content: GameContent,
  dialogue: Dialogue,
  progress: PlayerProgress,
  pick: ChoicePicker = pickFirst,
): PlayResult {
  let current = progress;
  const events: GameEvent[] = [];
  const visited: string[] = [];
  const lines: string[] = [];
  const holder: { state: DialogueState } = { state: { status: 'idle' } };

  const apply = (step: DialogueStep): void => {
    const r = applyEffects(current, step.effects, content);
    current = r.progress;
    events.push(...r.events);
    holder.state = step.state;
    const state = step.state;
    if (state.status !== 'idle' && state.status !== 'ended') {
      visited.push(state.nodeId);
      lines.push(state.line.text);
    }
  };

  apply(startDialogue(dialogue, current));
  for (let guard = 0; guard < 200; guard++) {
    const state = holder.state;
    if (state.status === 'ended') break;
    if (state.status === 'choice') {
      apply(chooseDialogue(dialogue, state, pick(state.choices, state.nodeId), current));
    } else {
      apply(advanceDialogue(dialogue, state, current));
    }
  }
  const last = holder.state;
  const completed = last.status === 'ended' && last.completed;
  if (completed && !current.completedDialogues.includes(dialogue.id)) {
    current = { ...current, completedDialogues: [...current.completedDialogues, dialogue.id] };
  }
  return { progress: current, events, visited, lines, completed };
}

/** Cerca `dialogueId` nel contenuto e lo gioca. */
export function playDialogueId(
  content: GameContent,
  dialogueId: string,
  progress: PlayerProgress,
  pick: ChoicePicker = pickFirst,
): PlayResult {
  const d = content.dialogues[dialogueId];
  if (!d) throw new Error(`Dialogo inesistente: ${dialogueId}`);
  return playDialogue(content, d, progress, pick);
}

/**
 * Enumera TUTTI i percorsi possibili di un dialogo (DFS sulle scelte) e restituisce il progresso
 * finale di ciascuno. Per i test di bilancio (minimo/massimo Cazzatometro di un dialogo).
 */
export function enumerateOutcomes(
  content: GameContent,
  dialogue: Dialogue,
  progress: PlayerProgress,
  limit = 5000,
): PlayerProgress[] {
  const results: PlayerProgress[] = [];
  const rec = (step: DialogueStep, before: PlayerProgress, depth: number): void => {
    if (results.length >= limit || depth > 60) return;
    const after = applyEffects(before, step.effects, content).progress;
    const st = step.state;
    if (st.status === 'ended') {
      results.push(
        st.completed && !after.completedDialogues.includes(dialogue.id)
          ? { ...after, completedDialogues: [...after.completedDialogues, dialogue.id] }
          : after,
      );
    } else if (st.status === 'choice') {
      for (const c of st.choices)
        rec(chooseDialogue(dialogue, st, c.index, after), after, depth + 1);
    } else if (st.status === 'active' || st.status === 'consequence') {
      rec(advanceDialogue(dialogue, st, after), after, depth + 1);
    }
  };
  rec(startDialogue(dialogue, progress), progress, 0);
  return results;
}

/** Progresso dopo il percorso che MINIMIZZA (o massimizza) il Cazzatometro del dialogo. */
export function extremeOutcome(
  content: GameContent,
  dialogueId: string,
  progress: PlayerProgress,
  mode: 'min' | 'max',
): PlayerProgress {
  const d = content.dialogues[dialogueId];
  if (!d) throw new Error(`Dialogo inesistente: ${dialogueId}`);
  const all = enumerateOutcomes(content, d, progress);
  const first = all[0];
  if (!first) throw new Error(`Nessun percorso per ${dialogueId}`);
  return all.reduce(
    (a, b) => (mode === 'min' ? (b.cazzate < a.cazzate ? b : a) : b.cazzate > a.cazzate ? b : a),
    first,
  );
}
