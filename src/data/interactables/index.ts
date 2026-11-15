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

/** La bici di Monica (obiettivo 2 della missione 4): disponibile dopo la leggenda di Tony. */
const BIKE: InteractableDefinition = {
  id: 'bike',
  position: PIAZZA_POINTS.bike,
  radius: 2.6,
  label: 'GUARDA LA BICI',
  action: { type: 'dialogue', dialogueId: 'bike-look' },
  enabled: false,
  disabledLabel: 'PRIMA PARLA CON NICOLA',
};

/** Matita collezionabile ("Le matite nel di dietro"). */
const PENCIL: InteractableDefinition = {
  id: 'matita',
  position: PIAZZA_POINTS.pencilCollectible,
  radius: 2,
  label: 'RACCOGLI LA MATITA',
  action: { type: 'dialogue', dialogueId: 'matita' },
};

export const INTERACTABLES: readonly InteractableDefinition[] = [
  ...SPARANE,
  STATION_EXIT,
  BIKE,
  PENCIL,
];

/** Le quattro tappe del World Tour: punto interagibile -> dialogo, attive solo durante la missione 6. */
const TOUR_STOPS: readonly (readonly [id: string, slug: string, label: string])[] = [
  ['sparane-0', 'vladivostok', 'RACCONTA: VLADIVOSTOK'],
  ['sparane-1', 'pupazzo', 'RACCONTA: IL PUPAZZO SEGRETO'],
  ['sparane-2', 'criceti', 'RACCONTA: LA GABBIA DEI CRICETI'],
  ['station-exit', 'treno', 'RACCONTA: IL TRENO UNGHERESE'],
];

const tourOverrides: readonly InteractableOverride[] = TOUR_STOPS.map(([id, slug, label]) => ({
  id,
  requires: [
    { type: 'missionActive', missionId: 'tony-world-tour' },
    { type: 'objectiveNotCompleted', missionId: 'tony-world-tour', objectiveId: `tour-${slug}` },
  ],
  patch: { label, action: { type: 'dialogue', dialogueId: `tour-${slug}` } },
}));

/** Variazioni degli interagibili in base al progresso (vedi interactableOverrides.ts). */
export const INTERACTABLE_OVERRIDES: readonly InteractableOverride[] = [
  { id: 'bike', requires: [{ type: 'flag', flag: 'bike.told' }], patch: { enabled: true } },
  ...tourOverrides,
];
