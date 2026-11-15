// OWNER: Gameplay
// Contenuti bonus: la matita collezionabile ("Le matite nel di dietro": gag verbale innocua, il
// "di dietro" e' dello zaino) e due chiacchiere opzionali (Sofia, Gino) che danno anche indizi.
import type { Dialogue } from '@/game/core/types';
import { END, NARRATOR, TONY, cazzate, dialogue, flag, line, unlockStory } from './builder';

const matita: Dialogue = dialogue(
  'matita',
  'a',
  [
    line(
      'a',
      NARRATOR,
      'Una matita gialla, un po’ mordicchiata, abbandonata sul bordo della piazza.',
      {
        next: 'b',
      },
    ),
    line('b', TONY, 'Fra, una matita! Io le tenevo sempre nel di dietro.', {
      gesture: true,
      next: 'c',
    }),
    line(
      'c',
      TONY,
      '...dello zaino! Nel di dietro dello ZAINO, nella tasca posteriore. Ma che avete capito?',
      {
        gesture: true,
        next: 'd',
      },
    ),
    line(
      'd',
      TONY,
      'A scuola ne avevo a dozzine: ero una cartoleria ambulante, con le ruote e il caricabatterie.',
      {
        choices: [
          {
            text: 'Raccogli la matita.',
            next: 'take',
            effects: [
              flag('collected.matita'),
              cazzate(2, 'Le matite nel di dietro', 'matita'),
              unlockStory('story-matite'),
            ],
          },
          { text: 'Lasciala lì, magari serve a qualcuno.', next: END },
        ],
      },
    ),
    line('take', TONY, 'Nel di dietro dello zaino. Dello zaino! Segnatelo tutti.', {
      gesture: true,
      next: END,
    }),
    line('again', TONY, 'La matita ce l’ho già. Nel di dietro. Dello zaino!', {
      gesture: true,
      next: END,
    }),
  ],
  'again',
);

const sofia: Dialogue = dialogue(
  'sofia-chiacchiere',
  'a',
  [
    line('a', 'sofia', 'Oh Tony, in piazza dicono che racconti storie a pagamento.', {
      mood: 'smug',
      choices: [
        { text: 'Sì, ma a rate.', next: 'r1' },
        { text: 'No, le regalo. Il costo è il silenzio.', next: 'r2' },
        { text: 'Tutto falso, io sono in Russia.', next: 'r3' },
      ],
    }),
    line('r1', 'sofia', 'A rate. Quindi ne hai già raccontate tre e ne pagherai una.', {
      mood: 'happy',
      next: 'tip',
    }),
    line('r2', 'sofia', 'Il silenzio costa troppo: non l’hai mai pagato.', {
      mood: 'smug',
      next: 'tip',
    }),
    line(
      'r3',
      'sofia',
      'In Russia. Ma sei qui davanti a me. Quindi in Russia c’è anche una piazza uguale.',
      {
        mood: 'confused',
        next: 'tip',
      },
    ),
    line(
      'tip',
      'sofia',
      'Se cerchi storie, vai ai punti con la scritta SPARANE UN’ALTRA. E vicino all’uscita.',
      {
        requires: [{ type: 'missionActive', missionId: 'tony-world-tour' }],
        fallback: 'tip2',
        next: END,
      },
    ),
    line(
      'tip2',
      'sofia',
      'Comunque, Gino sulla panchina sa cose. E ha pure una matita da qualche parte.',
      {
        mood: 'happy',
        next: END,
      },
    ),
    line('again', 'sofia', 'Ancora tu? Non ho cambiato idea: racconti storie a rate.', {
      mood: 'smug',
      next: END,
    }),
  ],
  'again',
);

const gino: Dialogue = dialogue(
  'gino-panchina',
  'a',
  [
    line(
      'a',
      'gino',
      'Tony! Eri in Russia, ti ricordo io. Con quel cappotto che sembrava un tappeto.',
      {
        mood: 'happy',
        choices: [
          { text: 'Zio Gino, era un tappeto vero.', next: 'r1' },
          { text: 'Dov’è che hai visto la mia matita?', next: 'r2' },
          { text: 'Tu c’eri? Ero io che ti ricordavo!', next: 'r3' },
        ],
      },
    ),
    line('r1', 'gino', 'Un tappeto volante. Poi ha avuto una multa per sosta vietata.', {
      mood: 'smug',
      next: 'tip',
    }),
    line(
      'r2',
      'gino',
      'Una matita? Sì, dalle parti dei pini a ovest. Brillava, per quanto può brillare una matita.',
      {
        mood: 'confused',
        next: END,
      },
    ),
    line('r3', 'gino', 'Io ricordo tutto. Anche i cinque euro. Specialmente i cinque euro.', {
      mood: 'smug',
      next: END,
    }),
    line('tip', 'gino', 'E se vai dalle parti dei pini a ovest, c’è una matita che ti aspetta.', {
      mood: 'happy',
      next: END,
    }),
    line('again', 'gino', 'Tony, siediti. Anzi no: i cinque euro stanno in piedi.', {
      mood: 'smug',
      next: END,
    }),
  ],
  'again',
);

export const SIDE_DIALOGUES: readonly Dialogue[] = [matita, sofia, gino];
