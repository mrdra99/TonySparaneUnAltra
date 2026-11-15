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
  {
    id: 'mistero-bici',
    title: 'IL MISTERO DELLA BICI',
    tagline: 'Che storia è quella della bici di Monica?',
    description:
      'Nicola vuole la verità sulla bici di Monica. Tony ha tre versioni. Tutte inventate, tutte meravigliose.',
    order: 4,
    hudLabel: 'Racconta la leggenda della bici a Nicola, poi guarda la bici',
    objectives: [
      { id: 'tell-bike', description: 'Racconta la leggenda a Nicola, vicino alla bici' },
      { id: 'check-bike', description: 'Guarda la bici di Monica' },
    ],
    reward: { cazzate: 10, points: 100, storyId: 'story-bici-monica' },
  },
  {
    id: 'contratto-discografico',
    title: 'IL CONTRATTO DISCOGRAFICO',
    tagline: 'Il feat fantasma',
    description:
      'Il disco di Tony non esce mai. Perché? Lui ha tre spiegazioni. L’artista inventato ne ha una sola: la nebbia.',
    order: 5,
    hudLabel: 'Spiega a Ciro perché il disco non esce, poi trova MC Nebbia',
    objectives: [
      { id: 'ask-disk', description: 'Spiega a Ciro perché il disco non è uscito' },
      { id: 'meet-nebbia', description: 'Cerca MC Nebbia, l’artista inventato' },
    ],
    reward: {
      cazzate: 15,
      points: 150,
      achievementId: 'featuring-fantasma',
      storyId: 'story-feat-fantasma',
    },
  },
  {
    id: 'tony-world-tour',
    title: 'TONY WORLD TOUR',
    tagline: 'Quattro storie impossibili',
    description:
      'Tony porta la sua leggenda in giro per la piazza: tre punti SPARANE UN’ALTRA e l’uscita per la stazione.',
    order: 6,
    hudLabel: 'Racconta le 4 storie: 3 punti SPARANE UN’ALTRA e l’uscita della stazione',
    objectives: [
      { id: 'tour-vladivostok', description: 'Racconta la storia di Vladivostok' },
      { id: 'tour-pupazzo', description: 'Racconta la storia del pupazzo segreto' },
      { id: 'tour-criceti', description: 'Racconta la storia della gabbia dei criceti' },
      { id: 'tour-treno', description: 'Racconta la storia del treno ungherese' },
    ],
    reward: {
      cazzate: 20,
      points: 250,
      achievementId: 'cittadino-del-mondo',
      storyId: 'story-world-tour',
    },
  },
];
