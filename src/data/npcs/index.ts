// OWNER: Gameplay
// Dati MINIMI di esempio (1 NPC): Gameplay li sostituisce con il cast completo.
import type { NpcDefinition } from '@/game/core/types';
import { PIAZZA_POINTS } from '@/world/environments/piazzaColliders';

export const NPCS: readonly NpcDefinition[] = [
  {
    id: 'marco',
    name: 'Marco',
    gender: 'male',
    watchesTony: true,
    position: [PIAZZA_POINTS.npcArea[0] - 2, PIAZZA_POINTS.npcArea[1]],
    rotationY: Math.PI / 2,
    idleBehaviour: 'stand',
    dialogueId: 'marco-cinque-euro',
    missionId: 'ninna-canna',
    ambientLines: ['👀', 'Ma questo non era in Russia?'],
    appearance: {
      skin: '#d8a47f',
      shirt: '#c0543a',
      pants: '#3a4660',
      hair: '#2a211c',
      hairStyle: 'short',
      height: 1.78,
    },
  },
];
