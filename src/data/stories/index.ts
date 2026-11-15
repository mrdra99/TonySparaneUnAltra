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
];
