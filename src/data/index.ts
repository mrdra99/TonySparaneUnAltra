/**
 * OWNER: Architecture (assemblaggio). Le cartelle src/data/<tipo>/ sono di Gameplay.
 * Qui i dati vengono indicizzati nel catalogo `content` usato da store, motore e UI.
 */
import { createContent } from '@/game/core/content';
import {
  FINALE_ACHIEVEMENTS,
  FINALE_DIALOGUES,
  FINALE_MISSIONS,
  FINALE_STORIES,
} from '@/levels/intercity/data';
import { ACHIEVEMENTS } from './achievements';
import { DIALOGUES } from './dialogues';
import { INTERACTABLES } from './interactables';
import { MISSIONS } from './missions';
import { NPCS } from './npcs';
import { RANDOM_STORIES } from './randomStories';
import { STORIES } from './stories';

export const content = createContent({
  missions: [...MISSIONS, ...FINALE_MISSIONS],
  dialogues: [...DIALOGUES, ...FINALE_DIALOGUES],
  stories: [...STORIES, ...FINALE_STORIES],
  achievements: [...ACHIEVEMENTS, ...FINALE_ACHIEVEMENTS],
  npcs: NPCS,
  interactables: INTERACTABLES,
  randomStories: RANDOM_STORIES,
});

export { ASSET_PATHS, MISSING_REFERENCE_ASSETS } from './assets';
