// OWNER: Gameplay
// Registro delle leggende. Ogni voce e' una storia che Tony racconta (e che nessuno crede).
import type { Story } from '@/game/core/types';

export const STORIES: readonly Story[] = [
  {
    id: 'story-ninna-canna',
    title: 'La leggenda della ninna canna',
    description:
      'Tony attraversa la piazza con una richiesta sempre uguale. Nessuno sa come finisca, ma tutti ne conoscono il ritornello.',
    icon: 'Moon',
    points: 50,
  },
  {
    id: 'story-registro-debiti',
    title: 'Il registro dei debiti comici',
    description:
      'Cinque euro, un favore e “quella di ieri”. Un quaderno che cresce più in fretta del Cazzatometro.',
    icon: 'BookOpen',
    points: 30,
  },
  {
    id: 'story-biglietto',
    title: 'Il biglietto per ovunque',
    description:
      'Viareggio, la Russia o una missione riservata: la destinazione cambia, il biglietto non lo paga mai Tony.',
    icon: 'TrainFront',
    points: 40,
  },
  {
    id: 'story-pendolare',
    title: 'Il pendolare internazionale',
    description: 'Tutti i treni portano a Tony. Nessuno sa a che ora parta.',
    icon: 'Globe',
    points: 30,
  },
  {
    id: 'story-debito',
    title: 'Il quaderno di Bogdan',
    description: 'Quaranta euro, tre scuse e un piccione come testimone.',
    icon: 'NotebookPen',
    points: 40,
  },
  {
    id: 'story-debito-leggendario',
    title: 'Il debito leggendario',
    description: 'Un debito così non si estingue: si tramanda.',
    icon: 'Coins',
    points: 40,
  },
];
