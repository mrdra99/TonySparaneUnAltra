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
  {
    id: 'story-bici-monica',
    title: 'La bici di Monica',
    description:
      'Collezionisti fantasma, tour in Albania e musei inesistenti. Leggenda inventata da Tony: la bici sta benissimo.',
    icon: 'Bike',
    points: 60,
  },
  {
    id: 'story-feat-fantasma',
    title: 'Il feat fantasma',
    description:
      'Il disco che non esce mai e l’artista inventato che compare solo con la nebbia. Vanteria di Tony, ovviamente.',
    icon: 'Mic',
    points: 60,
  },
  {
    id: 'story-vladivostok',
    title: 'Il capo della pausa',
    description:
      'A Vladivostok, durante un addestramento, Tony fischiava alle undici e tutti si fermavano per il caffè.',
    icon: 'Coffee',
    points: 50,
  },
  {
    id: 'story-pupazzo',
    title: 'Il segreto di Ciccio',
    description:
      'Un orsetto con le pile custodisce “il segreto più pericoloso d’Europa”. Nessuno sa dov’è. Nemmeno Tony.',
    icon: 'Lock',
    points: 50,
  },
  {
    id: 'story-criceti',
    title: 'L’assemblea dei criceti',
    description: 'Una gabbietta a due piani, un’assemblea di condominio e una ruota a turni.',
    icon: 'Rat',
    points: 50,
  },
  {
    id: 'story-treno',
    title: 'Il processo di Budapest',
    description:
      'Cartoline, un giudice col cappello di carta e una condanna a viaggiare con la fantasia.',
    icon: 'TrainFront',
    points: 50,
  },
  {
    id: 'story-world-tour',
    title: 'Tony World Tour',
    description: 'Quattro storie, zero prove, una piazza che applaude senza crederci.',
    icon: 'Globe',
    points: 80,
  },
  {
    id: 'story-matite',
    title: 'Le matite nel di dietro',
    description:
      'Dello zaino, ovviamente. Un equivoco che Tony smentisce da sempre, con molta energia.',
    icon: 'Pencil',
    points: 40,
  },
];
