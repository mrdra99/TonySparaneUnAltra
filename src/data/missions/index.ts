// OWNER: Gameplay
// Dato MINIMO di esempio (1 missione): Gameplay lo sostituisce con le 6 missioni.
import type { Mission } from '@/game/core/types';

export const MISSIONS: readonly Mission[] = [
  {
    id: 'ninna-canna',
    title: 'LA NINNA CANNA',
    tagline: 'Oh fraaaa...',
    description: 'Attraversa la piazza e parla con gli amici.',
    order: 1,
    autoStart: true,
    hudLabel: 'Parla con gli amici della piazza',
    objectives: [{ id: 'talk-marco', description: 'Parla con Marco' }],
    reward: {
      cazzate: 15,
      points: 100,
      achievementId: 'la-ninna-canna',
      storyId: 'story-ninna-canna',
    },
  },
];
