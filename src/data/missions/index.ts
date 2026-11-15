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
  {
    id: 'biglietto-treno',
    title: 'IL BIGLIETTO DEL TRENO',
    tagline: 'Fra, mi paghi il biglietto?',
    description: 'Vicino all’uscita della piazza c’è uno che forse ha dei soldi. Forse.',
    order: 2,
    hudLabel: 'Chiedi a Gianni, vicino all’uscita, il biglietto del treno',
    objectives: [{ id: 'ask-ticket', description: 'Chiedi a Gianni se ti paga il biglietto' }],
    reward: {
      cazzate: 10,
      points: 100,
      achievementId: 'pendolare-internazionale',
      storyId: 'story-pendolare',
    },
  },
  {
    id: 'debito-leggendario',
    title: 'IL DEBITO LEGGENDARIO',
    tagline: 'I 40 euro di Bogdan',
    description: 'Bogdan reclama 40 euro. Servono tre scuse consecutive, e una buona memoria.',
    order: 3,
    hudLabel: 'Affronta Bogdan: tre scuse, una sola versione',
    objectives: [{ id: 'settle-debt', description: 'Resisci alle tre scuse con Bogdan' }],
    reward: {
      cazzate: 15,
      points: 150,
      achievementId: 'finanza-creativa',
      storyId: 'story-debito-leggendario',
    },
  },
];
