// OWNER: Gameplay
// Interagibili NON-NPC (gli NPC con dialogueId generano il proprio via npcToInteractable).
// Dato MINIMO di esempio: un punto "SPARANE UN'ALTRA".
import type { InteractableDefinition } from '@/game/core/types';
import { RANDOM_STORY_LABEL } from '@/game/interactions/registry';
import { PIAZZA_POINTS } from '@/world/environments/piazzaColliders';

export const INTERACTABLES: readonly InteractableDefinition[] = [
  {
    id: 'sparane-0',
    position: PIAZZA_POINTS.sparane[0] ?? [0, 0],
    radius: 2.2,
    label: RANDOM_STORY_LABEL,
    action: { type: 'randomStory' },
  },
];
