// OWNER: Gameplay
// Cast della piazza. Tutti personaggi INVENTATI (Bogdan e Monica sono versioni fittizie e stilizzate
// richieste dal prompt). `watchesTony = gender === 'male'`. Posizioni: npcSpots validati da World.
import type { NpcDefinition, Vec2 } from '@/game/core/types';
import { PIAZZA_POINTS } from '@/world/environments/piazzaColliders';

interface Placed {
  position: Vec2;
  rotationY: number;
}

/** Spot `i` di PIAZZA_POINTS.npcSpots (se mancante, ripiega su npcArea). */
export function spot(i: number): Placed {
  const s = PIAZZA_POINTS.npcSpots[i];
  return s
    ? { position: s.pos, rotationY: s.rotationY }
    : { position: PIAZZA_POINTS.npcArea, rotationY: 0 };
}

export const NPCS: readonly NpcDefinition[] = [
  {
    id: 'marco',
    name: 'Marco',
    gender: 'male',
    watchesTony: true,
    ...spot(0),
    idleBehaviour: 'chat',
    dialogueId: 'marco-ieri',
    missionId: 'ninna-canna',
    ambientLines: ['👀', 'Ma questo non era in Russia?', 'Tony, ma quella di ieri?'],
    appearance: {
      skin: '#d8a47f',
      shirt: '#c0543a',
      pants: '#3a4660',
      hair: '#2a211c',
      hairStyle: 'short',
      height: 1.78,
    },
  },
  {
    id: 'luca',
    name: 'Luca',
    gender: 'male',
    watchesTony: true,
    ...spot(1),
    idleBehaviour: 'phone',
    dialogueId: 'luca-cinque-euro',
    missionId: 'ninna-canna',
    ambientLines: ['👀', 'Tony, ma i miei cinque euro?', 'Cinque euro. Cinque. Euro.'],
    appearance: {
      skin: '#e3b894',
      shirt: '#3d6b8c',
      pants: '#2b2b30',
      hair: '#5a3a22',
      hairStyle: 'curly',
      height: 1.72,
      build: 'slim',
      accessory: 'glasses',
    },
  },
  {
    id: 'giulia',
    name: 'Giulia',
    gender: 'female',
    watchesTony: false,
    ...spot(2),
    idleBehaviour: 'stand',
    dialogueId: 'giulia-favori',
    missionId: 'ninna-canna',
    ambientLines: ['Ecco Tony. Il conto dei favori sale.', 'Fra, i favori non si prescrivono.'],
    appearance: {
      skin: '#f0c9a8',
      shirt: '#e0a63a',
      pants: '#4a4f6a',
      hair: '#7a3b1f',
      hairStyle: 'long',
      height: 1.68,
      build: 'slim',
    },
  },
  {
    id: 'gianni',
    name: 'Gianni',
    gender: 'male',
    watchesTony: true,
    position: [16.8, -1.2],
    rotationY: Math.atan2(PIAZZA_POINTS.stationExit[0] - 16.8, PIAZZA_POINTS.stationExit[1] + 1.2),
    idleBehaviour: 'lean',
    dialogueId: 'gianni-biglietto',
    missionId: 'biglietto-treno',
    ambientLines: [
      '👀',
      'Tony! Il treno non aspetta. Tu sì, a quanto pare.',
      'Ma questo non era in Russia?',
    ],
    appearance: {
      skin: '#caa07a',
      shirt: '#5c7a4a',
      pants: '#6b5a44',
      hair: '#3a3028',
      hairStyle: 'cap',
      height: 1.8,
      build: 'broad',
      accessory: 'cap',
    },
  },
  {
    id: 'bogdan',
    name: 'Bogdan',
    gender: 'male',
    watchesTony: true,
    ...spot(3),
    idleBehaviour: 'stand',
    dialogueId: 'bogdan-debito',
    missionId: 'debito-leggendario',
    ambientLines: ['👀', 'Quaranta. Euro.', 'Tony, il quaderno ti saluta.'],
    appearance: {
      skin: '#e8b88e',
      shirt: '#2f3a48',
      pants: '#1f2430',
      hair: '#b8923a',
      hairStyle: 'short',
      height: 1.86,
      build: 'broad',
      accessory: 'glasses',
    },
  },
];
