// OWNER: Gameplay
// MISSIONE 2 - IL BIGLIETTO DEL TRENO ("Fra, mi paghi il biglietto?"). La terza scelta pesa di piu'.
import type { Dialogue } from '@/game/core/types';
import {
  END,
  NARRATOR,
  TONY,
  cazzate,
  completionChain,
  dialogue,
  line,
  objective,
  unlockStory,
} from './builder';

const gianni: Dialogue = dialogue(
  'gianni-biglietto',
  'open',
  [
    line('open', TONY, 'Fra, mi paghi il biglietto del treno?', { gesture: true, next: 'ask' }),
    line('ask', 'gianni', 'Ma dove devi andare?', {
      mood: 'confused',
      choices: [
        {
          text: 'A Viareggio.',
          next: 'r1',
          effects: [cazzate(2, 'Scusa improvvisata', 'm2-gianni')],
        },
        {
          text: 'In Russia.',
          next: 'r2',
          effects: [cazzate(2, 'Storia minore', 'm2-gianni')],
        },
        {
          text: 'È una missione riservata.',
          next: 'r3',
          effects: [cazzate(6, 'Missione riservata', 'm2-gianni')],
        },
      ],
    }),
    line('r1', 'gianni', 'Viareggio? Sono dieci minuti! Ti pago il caffè, il biglietto no.', {
      mood: 'angry',
      next: 'done',
    }),
    line(
      'r2',
      'gianni',
      'In Russia. Col regionale delle sette. Cambi a Pisa e poi a Mosca, giusto?',
      {
        mood: 'shocked',
        next: 'done',
      },
    ),
    line(
      'r3',
      'gianni',
      'Riservata. E io cosa sono, lo sponsor? Va bene, ma stanotte non ci dormo.',
      {
        mood: 'shocked',
        next: 'done',
      },
    ),
    line('done', TONY, 'Sapevo di poter contare su di te. Cioè, no. Ma è uguale.', {
      gesture: true,
      effects: [objective('biglietto-treno', 'ask-ticket'), unlockStory('story-biglietto')],
      next: 'chain',
    }),
    ...completionChain({
      missionId: 'biglietto-treno',
      text: 'Il biglietto è andato. Dal capannello, uno col quaderno in mano ha alzato la testa: Bogdan si è ricordato dei 40 euro.',
      hint: 'Bogdan sta sistemando gli occhiali. È il segnale: la resa dei conti è vicina.',
      next: 'debito-leggendario',
    }),
    line(
      'again',
      'gianni',
      'Ancora tu? Il biglietto è un’idea, non un oggetto. Vai a farti un giro.',
      {
        mood: 'smug',
        next: END,
      },
    ),
  ],
  'again',
);

/** Flavor: l'uscita verso la stazione (si trasforma in "treno ungherese" durante il World Tour). */
const stationGate: Dialogue = dialogue('station-gate', 'a', [
  line(
    'a',
    NARRATOR,
    'Oltre il varco c’è la stazione. Sul binario 4 c’è un cartello: “Leggenda in corso”.',
    {
      next: 'b',
    },
  ),
  line('b', TONY, 'Fra, non posso partire: ho una piazza da servire.', {
    gesture: true,
    next: END,
  }),
]);

export const M2_DIALOGUES: readonly Dialogue[] = [gianni, stationGate];
