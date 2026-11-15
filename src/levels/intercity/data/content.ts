// OWNER: Finale. Missione, storia e achievement del livello "La notte dell'Intercity".
// Registrati da src/data/index.ts. Il premio NON assegna Cazzatometro: il 100 arriva solo dal K.O. tecnico.
import type { Achievement, Mission, Story } from '@/game/core/types';
import { FINALE_MISSION_ID, FINALE_OBJECTIVES } from '../logic/ids';

export const FINALE_MISSIONS: readonly Mission[] = [
  {
    id: FINALE_MISSION_ID,
    title: 'LA NOTTE DELL’INTERCITY',
    tagline: 'K.O. tecnico',
    description:
      'Pisa, Viareggio, Torre del Lago: una notte, un solo treno, un taxi alla romana e un’ultima richiesta a Bogdan.',
    order: 99,
    hudLabel: 'Segui Bogdan fino a Torre del Lago',
    objectives: [
      { id: FINALE_OBJECTIVES.loan, description: 'Fatti prestare i 40 € per l’Intercity' },
      { id: FINALE_OBJECTIVES.colletta, description: 'Fai la colletta alla romana per il taxi' },
      { id: FINALE_OBJECTIVES.ninna, description: 'Chiedi a Bogdan l’ultima, piccola cosa' },
    ],
    reward: {
      cazzate: 0,
      points: 300,
      achievementId: 'ko-tecnico',
      storyId: 'story-notte-intercity',
    },
  },
];

export const FINALE_STORIES: readonly Story[] = [
  {
    id: 'story-notte-intercity',
    title: 'La notte dell’Intercity',
    description:
      'Pisa, un solo treno, quaranta euro, un taxi alla romana e una richiesta di troppo. Finisce con un K.O. tecnico.',
    icon: 'TrainFront',
    points: 100,
  },
];

export const FINALE_ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'ko-tecnico',
    title: 'K.O. tecnico',
    description: 'Hai esaurito la pazienza di Bogdan: non serve nemmeno il gong.',
    icon: 'Trophy',
    points: 200,
  },
];
