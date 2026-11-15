// OWNER: Gameplay
// MISSIONE 4 - IL MISTERO DELLA BICI. La bici di Monica e' una LEGGENDA INVENTATA da Tony: nessun
// furto, nessuna vendita reale (e Monica, fittizia, ha ancora la sua bici). Tre versioni assurde;
// la scelta imposta flag 'gag.bike' (la bici in scena inizia a sbandare) e 'bike.vN'.
import type { Dialogue } from '@/game/core/types';
import {
  END,
  NARRATOR,
  TONY,
  cazzate,
  completionChain,
  dialogue,
  flag,
  line,
  objective,
} from './builder';

const BIKE_GAG = 'gag.bike';

const nicola: Dialogue = dialogue(
  'nicola-bici',
  'ask',
  [
    line('ask', 'nicola', 'Tony, ma che storia è quella della bicicletta di Monica?', {
      mood: 'confused',
      next: 'tony1',
    }),
    line('tony1', TONY, 'Fra, è una leggenda. Mettetevi comodi, ne esistono tre versioni.', {
      gesture: true,
      next: 'pick',
    }),
    line('pick', TONY, 'Allora, la versione giusta è questa:', {
      gesture: true,
      choices: [
        {
          text: 'L’ha adottata un collezionista di biciclette fantasma.',
          next: 'r1',
          effects: [cazzate(2, 'Storia improbabile', 'm4-bici'), flag(BIKE_GAG), flag('bike.v1')],
        },
        {
          text: 'Se n’è andata da sola in tour in Albania: ora fa concerti.',
          next: 'r2',
          effects: [cazzate(3, 'Storia improbabile', 'm4-bici'), flag(BIKE_GAG), flag('bike.v2')],
        },
        {
          text: 'L’ho venduta a un museo che non esiste. Mi hanno pagato in applausi.',
          next: 'r3',
          effects: [cazzate(4, 'Storia leggendaria', 'm4-bici'), flag(BIKE_GAG), flag('bike.v3')],
        },
      ],
    }),
    line('r1', 'nicola', 'Un collezionista fantasma? E la bici lo sapeva di essere adottata?', {
      mood: 'shocked',
      next: 'disclaimer',
    }),
    line('r2', 'nicola', 'Un tour in Albania. Da sola. Con il cavalletto come manager?', {
      mood: 'shocked',
      next: 'disclaimer',
    }),
    line('r3', 'nicola', 'Pagato in applausi. Quindi hai incassato rumore. Complimenti, fra.', {
      mood: 'smug',
      next: 'disclaimer',
    }),
    line(
      'disclaimer',
      NARRATOR,
      'Leggenda inventata da Tony, come al solito. La bici di Monica sta benissimo: guarda come sbanda, felice.',
      { next: 'done', effects: [flag('bike.told')] },
    ),
    line('done', TONY, 'Ecco, ora guarda la bici e dimmi se mento.', {
      gesture: true,
      effects: [objective('mistero-bici', 'tell-bike')],
      next: END,
    }),
    line(
      'again',
      'nicola',
      'Monica ha detto che la bici è sua. Io dico che è la storia più bella.',
      {
        mood: 'happy',
        next: END,
      },
    ),
  ],
  'again',
);

/** Guardare la bici (obiettivo 2): disponibile solo dopo aver raccontato la leggenda. */
const bikeLook: Dialogue = dialogue(
  'bike-look',
  'look',
  [
    line('look', NARRATOR, 'La bici di Monica oscilla da sola, con l’aria di chi la sa lunga.', {
      next: 't1',
    }),
    line('t1', TONY, 'Vedi? È la bici adottata dal collezionista fantasma: non fa nemmeno ombra.', {
      gesture: true,
      requires: [{ type: 'flag', flag: 'bike.v1' }],
      fallback: 't2',
      next: 'fin',
    }),
    line('t2', TONY, 'Vedi? Ha ancora il biglietto del concerto in Albania sotto la sella.', {
      gesture: true,
      requires: [{ type: 'flag', flag: 'bike.v2' }],
      fallback: 't3',
      next: 'fin',
    }),
    line('t3', TONY, 'Vedi? Ha ancora la medaglia del museo che non esiste.', {
      gesture: true,
      next: 'fin',
    }),
    line(
      'fin',
      'nicola',
      'Tony, hai vinto: la bici è l’unica che racconta sempre la stessa storia.',
      {
        mood: 'happy',
        effects: [objective('mistero-bici', 'check-bike')],
        next: 'chain',
      },
    ),
    ...completionChain({
      missionId: 'mistero-bici',
      text: 'Nuova voce nel registro delle leggende: “La bici di Monica”. Monica ha confermato di avere ancora la sua bici.',
      hint: 'Intanto, vicino alla gradinata, qualcuno chiede a Tony quando esce il disco.',
      next: 'contratto-discografico',
    }),
    line('again', TONY, 'La bici sbanda ancora. Segno che la leggenda funziona.', {
      gesture: true,
      next: END,
    }),
  ],
  'again',
);

/** Monica (fittizia): reagisce in base alla versione scelta da Tony. */
const monica: Dialogue = dialogue(
  'monica-bici',
  'start',
  [
    line(
      'start',
      'monica',
      'Oh Tony. Mi hanno detto che hai raccontato una storia sulla mia bici.',
      {
        mood: 'smug',
        requires: [{ type: 'flag', flag: BIKE_GAG }],
        fallback: 'generic',
        next: 'v1',
      },
    ),
    line('v1', 'monica', 'Il collezionista fantasma? Strano, stamattina la bici mi ha salutato.', {
      mood: 'confused',
      requires: [{ type: 'flag', flag: 'bike.v1' }],
      fallback: 'v2',
      next: 'q',
    }),
    line('v2', 'monica', 'Il tour in Albania? Ma io le ho dato solo un po’ d’olio!', {
      mood: 'shocked',
      requires: [{ type: 'flag', flag: 'bike.v2' }],
      fallback: 'v3',
      next: 'q',
    }),
    line('v3', 'monica', 'Il museo che non esiste? La bici è lì, Tony. La vedo da qui.', {
      mood: 'angry',
      next: 'q',
    }),
    line('q', TONY, 'Ma almeno ti è piaciuta la storia, no?', {
      gesture: true,
      choices: [
        { text: 'Era una leggenda, Monica: nessuno ha toccato niente.', next: 'ok' },
        { text: 'Tutto vero. Ho anche un piccione come testimone.', next: 'bird' },
      ],
    }),
    line(
      'ok',
      'monica',
      'Lo so. Ma la prossima volta inventa una storia in cui io sono la protagonista.',
      {
        mood: 'smug',
        next: END,
      },
    ),
    line('bird', 'monica', 'Il piccione. Va bene. Digli che la bici ha il cestino libero.', {
      mood: 'happy',
      next: END,
    }),
    line('generic', 'monica', 'Ciao Tony! La mia bici è lì, se la guardi troppo ti segue.', {
      mood: 'happy',
      next: END,
    }),
  ],
  'start',
);

export const M4_DIALOGUES: readonly Dialogue[] = [nicola, bikeLook, monica];
