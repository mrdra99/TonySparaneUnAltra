// OWNER: Gameplay
// MISSIONE 5 - IL CONTRATTO DISCOGRAFICO. Tony SOSTIENE di aver quasi fatto un featuring con un
// rapper famoso: e' una vanteria (una sola battuta) che nessuno crede, senza affermazioni sul
// rapper o sul suo staff. Il personaggio musicale in scena e' interamente inventato: MC Nebbia.
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
} from './builder';

const chain = () =>
  completionChain({
    missionId: 'contratto-discografico',
    text: 'Il disco non uscirà mai. Ma ora è ufficiale: è il disco più atteso dell’universo parallelo.',
    hint: 'Dalla piazza partono voci: Tony ha “storie dal mondo” da raccontare. Quattro punti, quattro leggende.',
    next: 'tony-world-tour',
  });

const ciro: Dialogue = dialogue(
  'ciro-disco',
  'ask',
  [
    line('ask', 'ciro', 'Tony, ma il disco quando esce?', { mood: 'smug', next: 't1' }),
    line('t1', TONY, 'Fra, era tutto pronto.', { gesture: true, next: 'why' }),
    line('why', 'ciro', 'E allora perché non è uscito?', {
      mood: 'confused',
      choices: [
        {
          text: 'Problemi contrattuali.',
          next: 'r1',
          effects: [cazzate(2, 'Scusa improvvisata', 'm5-ciro')],
        },
        {
          text: 'Il manager non ha capito la mia visione.',
          next: 'r2',
          effects: [cazzate(3, 'Storia improbabile', 'm5-ciro')],
        },
        {
          text: 'Mi hanno chiesto di ridimensionare il mio talento.',
          next: 'r3',
          effects: [cazzate(4, 'Storia leggendaria', 'm5-ciro')],
        },
      ],
    }),
    line('r1', 'ciro', 'Contrattuali. Con chi? Con tuo cugino che ha un microfono da karaoke?', {
      mood: 'smug',
      next: 'boast',
    }),
    line('r2', 'ciro', 'La tua visione. Quella che vede solo i cinque euro degli altri?', {
      mood: 'smug',
      next: 'boast',
    }),
    line(
      'r3',
      'ciro',
      'Ridimensionare il talento? Tony, il tuo talento non entra nemmeno nel garage.',
      {
        mood: 'shocked',
        next: 'boast',
      },
    ),
    line('boast', TONY, 'Giuro: ero a un passo da un feat con Tedua.', {
      gesture: true,
      next: 'doubt',
    }),
    line(
      'doubt',
      'ciro',
      'Certo. E io ero a un passo dal Pallone d’oro. Mi mancava solo il pallone.',
      {
        mood: 'smug',
        next: 'disclaimer',
      },
    ),
    line(
      'disclaimer',
      NARRATOR,
      'Vanteria di Tony, come tutte le altre: nessuno ci crede, e il vero rapper non c’entra niente.',
      { next: 'done' },
    ),
    line('done', TONY, 'Vabbè, se vuoi la versione ufficiale chiedila a MC Nebbia.', {
      gesture: true,
      effects: [objective('contratto-discografico', 'ask-disk')],
      next: 'chain',
    }),
    ...chain(),
    line('again', 'ciro', 'Il disco esce quando esce la nebbia, giusto? Ho capito.', {
      mood: 'happy',
      next: END,
    }),
  ],
  'again',
);

const nebbia: Dialogue = dialogue(
  'nebbia-incontro',
  'a',
  [
    line('a', TONY, 'Fra! Ecco il mio socio: MC Nebbia, quasi-feat ufficiale!', {
      gesture: true,
      next: 'b',
    }),
    line(
      'b',
      'mcnebbia',
      'Io? Non ti conosco. Sono un artista inventato: compaio solo quando c’è nebbia.',
      {
        mood: 'confused',
        next: 'c',
      },
    ),
    line('c', TONY, 'Ma il contratto?', { next: 'd' }),
    line('d', 'mcnebbia', 'Il contratto sta in un cassetto che non esiste. Come me.', {
      mood: 'smug',
      choices: [
        { text: 'Dai, almeno una strofa.', next: 'r1' },
        { text: 'Allora il feat lo facciamo in sogno.', next: 'r2' },
        { text: 'Firma qui, ti pago in rubli.', next: 'r3' },
      ],
    }),
    line(
      'r1',
      'mcnebbia',
      '“Nebbia in piazzetta, Tony in bicicletta, cinque euro sulla panchina e nessuno li ritrova.”',
      { mood: 'happy', next: 'done' },
    ),
    line('r2', 'mcnebbia', 'Ottimo: in sogno non servono le firme. Solo il pisolino.', {
      mood: 'happy',
      next: 'done',
    }),
    line('r3', 'mcnebbia', 'Accetto. Ho un solo problema: sono inventato, non ho il portafoglio.', {
      mood: 'confused',
      next: 'done',
    }),
    line('done', TONY, 'Visto? Era tutto pronto. Mancava solo la nebbia.', {
      gesture: true,
      effects: [objective('contratto-discografico', 'meet-nebbia')],
      next: 'chain',
    }),
    ...chain(),
    line('again', 'mcnebbia', 'Se senti un ritornello, è la nebbia. Non è un feat.', {
      mood: 'smug',
      next: END,
    }),
  ],
  'again',
);

export const M5_DIALOGUES: readonly Dialogue[] = [ciro, nebbia];
