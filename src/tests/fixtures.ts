/** Fixture condivise dai test: catalogo di contenuti piccolo e indipendente dai dati reali. */
import { createContent } from '@/game/core/content';
import {
  DIALOGUE_END,
  type Dialogue,
  type GameContent,
  type NpcDefinition,
} from '@/game/core/types';

export const TEST_NPC: NpcDefinition = {
  id: 'luca',
  name: 'Luca',
  gender: 'male',
  watchesTony: true,
  position: [3, 2],
  rotationY: 0,
  idleBehaviour: 'stand',
  dialogueId: 'luca-talk',
  appearance: {
    skin: '#d8a47f',
    shirt: '#444444',
    pants: '#222222',
    hair: '#111111',
    hairStyle: 'short',
    height: 1.75,
  },
};

export const TEST_DIALOGUE: Dialogue = {
  id: 'luca-talk',
  start: 'a',
  repeatStart: 'again',
  nodes: {
    a: {
      id: 'a',
      speaker: 'luca',
      text: 'Ciao Tony!',
      next: 'q',
    },
    q: {
      id: 'q',
      speaker: 'luca',
      text: 'Che racconti?',
      choices: [
        { text: 'Niente.', next: 'r1' },
        {
          text: 'Una storia assurda.',
          next: 'r2',
          effects: [{ type: 'addCazzate', amount: 10, reason: 'Storia improbabile' }],
        },
        { text: 'Segreto.', next: 'r3', requires: [{ type: 'flag', flag: 'secret' }] },
      ],
    },
    r1: { id: 'r1', speaker: 'luca', text: 'Come al solito.', next: 'end' },
    r2: { id: 'r2', speaker: 'luca', text: 'Impossibile!', next: 'end' },
    r3: { id: 'r3', speaker: 'luca', text: 'Oh!', next: 'end' },
    end: {
      id: 'end',
      speaker: 'tony',
      text: 'Fra, ciao.',
      effects: [{ type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' }],
      next: DIALOGUE_END,
    },
    again: { id: 'again', speaker: 'luca', text: 'Ancora tu?' },
  },
};

export function makeTestContent(): GameContent {
  return createContent({
    missions: [
      {
        id: 'm1',
        title: 'PRIMA',
        description: 'd',
        order: 1,
        autoStart: true,
        objectives: [
          { id: 'o1', description: 'Parla con Luca' },
          { id: 'o2', description: 'Parla con altri' },
        ],
        reward: { cazzate: 15, points: 100, achievementId: 'a1', storyId: 's1' },
      },
      {
        id: 'm2',
        title: 'SECONDA',
        description: 'd',
        order: 2,
        objectives: [{ id: 'o1', description: 'Fai X' }],
        reward: { cazzate: 60 },
      },
    ],
    dialogues: [TEST_DIALOGUE],
    stories: [{ id: 's1', title: 'Storia 1', description: 'd', icon: 'Moon', points: 50 }],
    achievements: [{ id: 'a1', title: 'Ach 1', description: 'd', icon: 'Trophy', points: 25 }],
    npcs: [TEST_NPC],
    interactables: [
      {
        id: 'sparane-1',
        position: [0, 0],
        radius: 2,
        label: "SPARANE UN'ALTRA",
        action: { type: 'randomStory' },
      },
    ],
    randomStories: [
      { id: 'x1', text: 'Frase 1' },
      { id: 'x2', text: 'Frase 2' },
      { id: 'x3', text: 'Frase 3', cazzate: 5 },
    ],
  });
}
