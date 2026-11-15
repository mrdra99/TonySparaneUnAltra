// OWNER: Gameplay
// Interagibili NON-NPC (gli NPC con dialogueId generano il proprio via npcToInteractable).
// Per cambiare un interagibile in base al progresso vedi INTERACTABLE_OVERRIDES.
import type { InteractableDefinition, Vec2 } from '@/game/core/types';
import { RANDOM_STORY_LABEL } from '@/game/interactions/registry';
import type { InteractableOverride } from '@/game/systems/interactableOverrides';
import { PIAZZA_POINTS } from '@/world/environments/piazzaColliders';

const SPARANE_FALLBACK: readonly Vec2[] = [
  [-8.5, -3.2],
  [4.5, 1.8],
  [11.5, -4.2],
];

/** Punto "SPARANE UN'ALTRA" `i` (da World; ripiega su coordinate di riserva). */
export const sparanePoint = (i: number): Vec2 =>
  PIAZZA_POINTS.sparane[i] ?? SPARANE_FALLBACK[i] ?? PIAZZA_POINTS.npcArea;

const SPARANE: readonly InteractableDefinition[] = [0, 1, 2].map((i): InteractableDefinition => ({
  id: `sparane-${i}`,
  position: sparanePoint(i),
  radius: 2.2,
  label: RANDOM_STORY_LABEL,
  action: { type: 'randomStory' },
}));

/** Uscita verso la stazione: gag di Tony (e quarta storia del World Tour, vedi override). */
const STATION_EXIT: InteractableDefinition = {
  id: 'station-exit',
  position: PIAZZA_POINTS.stationExit,
  radius: 2.4,
  label: 'VERSO LA STAZIONE',
  action: { type: 'dialogue', dialogueId: 'station-gate' },
};

export const INTERACTABLES: readonly InteractableDefinition[] = [...SPARANE, STATION_EXIT];

/** Variazioni degli interagibili in base al progresso (vedi interactableOverrides.ts). */
export const INTERACTABLE_OVERRIDES: readonly InteractableOverride[] = [];
