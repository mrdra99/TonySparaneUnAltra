// OWNER: Finale. Dialoghi del livello "La notte dell'Intercity" (motore dialoghi esistente).
// Nota di design: nessun dialogo usa repeatStart. La ripetizione e' gestita da un nodo iniziale con
// `requires` (flag di sessione) e `fallback`, cosi' un dialogo chiuso a meta' non "salta" mai la scena.
import type { Dialogue } from '@/game/core/types';
import {
  END,
  NARRATOR,
  TONY,
  cazzate,
  dialogue,
  flag,
  line,
  objective,
} from '@/data/dialogues/builder';
import { FINALE_MISSION_ID, FINALE_OBJECTIVES, FLAGS } from '../logic/ids';

const BOGDAN = 'bogdan';

// --- Pisa -------------------------------------------------------------------------------------

const pisaBogdan: Dialogue = dialogue('finale-pisa-bogdan', 'again', [
  line('again', BOGDAN, 'Quaranta, Tony. Il treno è quello bianco. Corri.', {
    requires: [{ type: 'flag', flag: FLAGS.loan }],
    fallback: 'open',
    next: END,
  }),
  line('open', TONY, 'Bogdan! Fra! Per fortuna ti ho trovato.', { gesture: true, next: 'b1' }),
  line('b1', BOGDAN, 'Tony. L’Intercity parte tra poco. Cosa vuoi?', { next: 'b2' }),
  line('b2', TONY, 'Mi servono quaranta euro. Il regionale è partito, questo è l’unico treno.', {
    gesture: true,
    next: 'ask',
  }),
  line('ask', BOGDAN, 'Quaranta euro per un biglietto. Dammi un motivo.', {
    mood: 'smug',
    choices: [
      { text: 'Te li ridò appena mi arriva la pensione.', next: 'r1' },
      { text: 'È un investimento: l’Intercity è un’azienda in crescita.', next: 'r2' },
      { text: 'Venti li devo al treno, venti al karma.', next: 'r3' },
    ],
  }),
  line('r1', BOGDAN, 'La pensione. A chi non ha mai iniziato.', { mood: 'confused', next: 'pay' }),
  line('r2', BOGDAN, 'Mi stai vendendo un treno?', { mood: 'shocked', next: 'pay' }),
  line('r3', BOGDAN, 'E a me quanti ne devi? Il karma non fa ricevuta.', {
    mood: 'angry',
    next: 'pay',
  }),
  line('pay', BOGDAN, 'Va bene. Tieni. Ma io segno: quaranta.', {
    effects: [
      flag(FLAGS.loan),
      objective(FINALE_MISSION_ID, FINALE_OBJECTIVES.loan),
      cazzate(2, 'Prestito sull’Intercity', 'finale-loan'),
    ],
    next: 'thanks',
  }),
  line('thanks', TONY, 'Sei un amico, fra. Ora vado: il treno parte!', {
    gesture: true,
    next: 'end',
  }),
  line('end', BOGDAN, 'Il treno è quello bianco. E Tony... quaranta.', { next: END }),
]);

const pisaDoor: Dialogue = dialogue('finale-pisa-door', 'a', [
  line('a', TONY, 'Il biglietto? Pagato da Bogdan. Come tutto, del resto.', {
    gesture: true,
    next: 'b',
  }),
  line('b', NARRATOR, 'Din-don. «Intercity per Viareggio: attenzione, chiusura porte.»', {
    effects: [flag(FLAGS.pisaBoarded)],
    next: END,
  }),
]);

const pisaVending: Dialogue = dialogue('finale-pisa-vending', 'a', [
  line('a', TONY, 'Un caffè a un euro e venti. Io ho zero euro e zero centesimi.', { next: 'b' }),
  line('b', NARRATOR, 'Il distributore lo guarda. Il distributore ha già capito tutto.', {
    next: END,
  }),
]);

// --- Viareggio: colletta ----------------------------------------------------------------------

interface Friend {
  id: string;
  speaker: string;
  flag: string;
  opener: string;
  excuse: string;
  choices: readonly [string, string, string];
  reply: string;
  again: string;
}

const FRIENDS: readonly Friend[] = [
  {
    id: 'finale-nico',
    speaker: 'Nico',
    flag: FLAGS.colNico,
    opener: 'Nico, fra: mi copri la mia quota del taxi? Sono sette euro.',
    excuse: 'Tony, ho le tasche così. Guarda: dentro c’è solo lo scontrino di un panino del 2019.',
    choices: [
      'Lo scontrino vale come cauzione, fra.',
      'Allora il panino lo paghi tu e il taxi lo pago io. Col panino.',
      'Fa niente: lo segno nel quaderno di Bogdan.',
    ],
    reply: 'Io metto la mia quota, sette euro. La tua non esiste. È già un miracolo così.',
    again: 'La mia quota l’ho messa. La tua l’universo non la conosce.',
  },
  {
    id: 'finale-vale',
    speaker: 'Vale',
    flag: FLAGS.colVale,
    opener: 'Vale! Colletta per il taxi: sette euro a testa. Io sono il testa.',
    excuse: 'Io ho solo buoni pasto. Valgono otto euro, ma solo se compri una piadina.',
    choices: [
      'Il tassista accetta piadine?',
      'Un buono pasto è una valuta del futuro, fra.',
      'Allora vendo un buono a sette euro. A me.',
    ],
    reply: 'La mia quota la metto in contanti. La tua resta in piadina, e la piadina non viaggia.',
    again: 'Io ho dato. Tu hai un buono pasto che non hai.',
  },
  {
    id: 'finale-ricky',
    speaker: 'Ricky',
    flag: FLAGS.colRicky,
    opener: 'Ricky, il taxi costa trentacinque. Siamo in cinque: tu fai sette, io faccio zero.',
    excuse: 'Io pago con Satispay. Tu ce l’hai Satispay?',
    choices: [
      'Ce l’ho, ma il telefono è scarico. Da giovedì.',
      'Io ho il Cazzatometro, che è meglio.',
      'Accettano Satispay? Perché io accetto tutto.',
    ],
    reply: 'Io ho messo la mia in contanti, per sicurezza. La tua la gestisce il cosmo.',
    again: 'La mia è dentro. La tua è in un cloud che non esiste.',
  },
];

function friendDialogue(f: Friend): Dialogue {
  return dialogue(f.id, 'again', [
    line('again', f.speaker, f.again, {
      requires: [{ type: 'flag', flag: f.flag }],
      fallback: 'open',
      next: END,
    }),
    line('open', TONY, f.opener, { gesture: true, next: 'excuse' }),
    line('excuse', f.speaker, f.excuse, {
      mood: 'smug',
      choices: f.choices.map((text) => ({ text, next: 'reply' })),
    }),
    line('reply', f.speaker, f.reply, {
      effects: [flag(f.flag), cazzate(1, 'Colletta fallita', `${f.id}-fail`)],
      next: END,
    }),
  ]);
}

const bogdanTaxi: Dialogue = dialogue('finale-viareggio-bogdan', 'again', [
  line('again', BOGDAN, 'Quota coperta. Sali sul taxi prima che cambi idea.', {
    requires: [{ type: 'flag', flag: FLAGS.colBogdan }],
    fallback: 'gate',
    next: END,
  }),
  line('gate', TONY, 'Bogdan, sono tutti dentro. Tutti tranne me, ma lo sai.', {
    requires: [
      { type: 'flag', flag: FLAGS.colNico },
      { type: 'flag', flag: FLAGS.colVale },
      { type: 'flag', flag: FLAGS.colRicky },
    ],
    fallback: 'wait',
    gesture: true,
    next: 'b1',
  }),
  line('wait', BOGDAN, 'Prima prova a raccogliere la tua quota dagli altri. Provaci davvero.', {
    next: END,
  }),
  line('b1', BOGDAN, 'Sette euro, Tony. Hai fatto tre giri e non ne hai portato uno.', {
    mood: 'angry',
    choices: [
      { text: 'L’importante è partecipare, fra.', next: 'b2' },
      { text: 'Io metto l’idea, tu metti i soldi: è un modello cooperativo.', next: 'b2' },
      { text: 'Il taxi lo pago in nostalgia: tra dieci anni varrà un sacco.', next: 'b2' },
    ],
  }),
  line('b2', BOGDAN, 'Pago io anche la tua. Ma io segno: quaranta, più il taxi.', {
    effects: [
      flag(FLAGS.colBogdan),
      objective(FINALE_MISSION_ID, FINALE_OBJECTIVES.colletta),
      cazzate(2, 'Colletta alla romana', 'finale-colletta'),
    ],
    next: 'b3',
  }),
  line('b3', TONY, 'Sei il miglior socio che abbia mai non-pagato.', { gesture: true, next: END }),
]);

const taxiDoor: Dialogue = dialogue('finale-taxi-door', 'a', [
  line('a', 'Tassista', 'Torre del Lago? Dieci chilometri, trentacinque euro. Chi paga?', {
    next: 'b',
  }),
  line('b', TONY, 'Bogdan. Ho una nota spese emotiva.', { gesture: true, next: 'c' }),
  line(
    'c',
    NARRATOR,
    'Clacson. Il taxi parte verso Torre del Lago, con quattro che contano i soldi.',
    {
      effects: [flag(FLAGS.taxiBoarded)],
      next: END,
    },
  ),
]);

// --- Torre del Lago -------------------------------------------------------------------------

const torreBogdan: Dialogue = dialogue('finale-torre-bogdan', 'open', [
  line('open', BOGDAN, 'Torre del Lago. Finalmente. Sono le due di notte, Tony.', { next: 'o2' }),
  line('o2', BOGDAN, 'Ti ho pagato un Intercity. Ti ho pagato un taxi. Buonanotte.', {
    mood: 'angry',
    next: 'o3',
  }),
  line('o3', TONY, 'Aspetta, fra. Un’ultima cosa. Piccola, piccola.', {
    gesture: true,
    next: 'ask',
  }),
  line('ask', BOGDAN, 'Che cosa?', {
    mood: 'confused',
    choices: [
      { text: 'Oh fra, mi lasceresti una NINNA KANNA?', next: 'silence' },
      { text: 'Fra... una NINNA KANNA, piccolina?', next: 'silence' },
      { text: 'NINNA. KANNA.', next: 'silence' },
    ],
  }),
  line('silence', NARRATOR, 'Silenzio. Un grillo, da qualche parte, smette di cantare.', {
    next: 's2',
  }),
  line('s2', BOGDAN, 'Il treno. Il taxi. E adesso... una ninna kanna?', {
    mood: 'shocked',
    effects: [objective(FINALE_MISSION_ID, FINALE_OBJECTIVES.ninna), flag(FLAGS.ninna)],
    next: 's3',
  }),
  line('s3', NARRATOR, 'Dentro Bogdan, la pazienza fa un ultimo rumore. Poi niente.', {
    next: END,
  }),
]);

export const FINALE_DIALOGUES: readonly Dialogue[] = [
  pisaBogdan,
  pisaDoor,
  pisaVending,
  ...FRIENDS.map(friendDialogue),
  bogdanTaxi,
  taxiDoor,
  torreBogdan,
];
