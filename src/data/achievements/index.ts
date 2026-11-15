// OWNER: Gameplay
import type { Achievement } from '@/game/core/types';

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'la-ninna-canna',
    title: 'La ninna canna',
    description: 'Hai fatto il giro della piazza con la solita richiesta.',
    icon: 'Moon',
    points: 100,
  },
  {
    id: 'pendolare-internazionale',
    title: 'Pendolare internazionale',
    description: 'Hai chiesto un biglietto per Viareggio, la Russia o una missione riservata.',
    icon: 'TrainFront',
    points: 100,
  },
  {
    id: 'finanza-creativa',
    title: 'Finanza creativa',
    description: 'Hai sostenuto tre scuse consecutive davanti a un quaderno dei debiti.',
    icon: 'Coins',
    points: 120,
  },
];
