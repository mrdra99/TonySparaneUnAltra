/**
 * OWNER: Architecture. "SPARANE UN'ALTRA": scelta casuale senza ripetizioni immediate (pura).
 * Le frasi vivono in src/data/randomStories; aggiungerne non richiede modifiche alla logica.
 */
import {
  RANDOM_STORY_DEFAULT_CAZZATE,
  RANDOM_STORY_HISTORY,
  TRANSIENT_DIALOGUE_PREFIX,
} from '@/game/core/constants';
import { SPEAKER_TONY, type Dialogue, type RandomStory } from '@/game/core/types';

/**
 * Sceglie l'indice di una frase evitando quelle in `recent` (indici piu' recenti per ultimi).
 * Se tutte sono recenti, evita almeno l'ultima. `rng` in [0,1).
 */
export function pickRandomIndex(
  count: number,
  recent: readonly number[],
  rng: () => number,
): number {
  if (count <= 0) return -1;
  if (count === 1) return 0;
  const maxMemory = Math.min(RANDOM_STORY_HISTORY, count - 1);
  const banned = new Set(recent.slice(-maxMemory));
  const pool: number[] = [];
  for (let i = 0; i < count; i++) if (!banned.has(i)) pool.push(i);
  const pick = pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
  return pick ?? 0;
}

export interface RandomStoryPicker {
  next(stories: readonly RandomStory[]): RandomStory | null;
  reset(): void;
}

export function createRandomStoryPicker(rng: () => number = Math.random): RandomStoryPicker {
  let recent: number[] = [];
  return {
    next(stories) {
      const idx = pickRandomIndex(stories.length, recent, rng);
      const story = stories[idx];
      if (!story) return null;
      recent = [...recent, idx].slice(-RANDOM_STORY_HISTORY);
      return story;
    },
    reset() {
      recent = [];
    },
  };
}

/** Dialogo transitorio a un nodo: Tony racconta la frase (+cazzate la prima volta che esce). */
export function randomStoryToDialogue(story: RandomStory): Dialogue {
  const id = `${TRANSIENT_DIALOGUE_PREFIX}${story.id}`;
  return {
    id,
    start: 'n',
    nodes: {
      n: {
        id: 'n',
        speaker: SPEAKER_TONY,
        text: story.text,
        gesture: true,
        effects: [
          {
            type: 'addCazzate',
            amount: story.cazzate ?? RANDOM_STORY_DEFAULT_CAZZATE,
            reason: "Sparane un'altra",
            onceId: id,
          },
        ],
      },
    },
  };
}
