// OWNER: Gameplay
// Le 6 missioni principali (le ultime arrivano a blocchi). Ordine = ordine di avvio nell'HUD.
// Bilancio Cazzatometro (ricompense): 15 + 10 + 15 + 10 + 15 + 20 = 85; il resto (bonus per scelta
// e frasi casuali) porta a 100. Vedi src/data/progression.test.ts.
import type { Mission } from '@/game/core/types';

export const MISSIONS: readonly Mission[] = [
  {
    id: 'ninna-canna',
    title: 'LA NINNA CANNA',
    tagline: 'Oh fraaaa...',
    description: 'Attraversa la piazza e parla con gli amici: Tony ha una richiesta per tutti.',
    order: 1,
    autoStart: true,
    hudLabel: 'Parla con gli amici della piazza',
    objectives: [
      { id: 'talk-marco', description: 'Parla con Marco' },
      { id: 'talk-luca', description: 'Parla con Luca' },
      { id: 'talk-giulia', description: 'Parla con Giulia' },
    ],
    reward: {
      cazzate: 15,
      points: 100,
      achievementId: 'la-ninna-canna',
      storyId: 'story-ninna-canna',
    },
  },
];
