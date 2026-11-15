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
