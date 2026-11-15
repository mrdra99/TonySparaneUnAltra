// OWNER: Gameplay
// MISSIONE 1 - LA NINNA CANNA ("Oh fraaaa..."). Tre NPC, battute dal prompt. Gag solo verbale:
// nessuno consegna nulla, Tony non ottiene mai niente (ed e' il bello).
import type { Dialogue } from '@/game/core/types';
import {
  END,
  TONY,
  cazzate,
  completionChain,
  dialogue,
  line,
  objective,
  unlockStory,
} from './builder';

const OPENER = 'Oh fraaaa, mi lasci una cannetta per la ninna canna?';

const chain = () =>
  completionChain({
    missionId: 'ninna-canna',
    text: 'Sul registro dei debiti comici di Tony ora c’è scritto: Marco, Luca, Giulia. E una cosa che nessuno ha capito.',
    hint: 'Intanto, verso l’uscita della piazza, uno aspetta Tony con la faccia di chi ha un treno da pagare.',
    extra: [unlockStory('story-registro-debiti')],
    next: 'biglietto-treno',
  });

const marco: Dialogue = dialogue(
  'marco-ieri',
  'open',
  [
    line('open', TONY, OPENER, { gesture: true, next: 'ask' }),
    line('ask', 'marco', 'Tony, ma quella di ieri?', {
      mood: 'smug',
      choices: [
        {
          text: 'Fra, quella era un’altra storia.',
          next: 'r1',
          effects: [cazzate(1, 'Scusa improvvisata', 'm1-marco')],
        },
        {
          text: 'Quella di ieri è andata in pensione.',
          next: 'r2',
          effects: [cazzate(1, 'Scusa improvvisata', 'm1-marco')],
        },
        {
          text: 'Ieri ero a Vladivostok, non fa testo.',
          next: 'r3',
          effects: [cazzate(2, 'Scusa improvvisata', 'm1-marco')],
        },
      ],
    }),
    line('r1', 'marco', 'Un’altra storia? Fra, tu hai più storie che scontrini.', {
      mood: 'confused',
      next: 'done',
    }),
    line('r2', 'marco', 'In pensione? Ma ha lavorato un giorno solo!', {
      mood: 'shocked',
      next: 'done',
    }),
    line('r3', 'marco', 'Vladivostok. Certo. Intanto io ti segno sul quaderno.', {
      mood: 'angry',
      next: 'done',
    }),
    line('done', TONY, 'Oh fraaaa, ci vediamo.', {
      gesture: true,
      effects: [objective('ninna-canna', 'talk-marco')],
      next: 'chain',
    }),
    ...chain(),
    line('again', 'marco', 'Ancora tu? Quella di ieri è ancora lì, eh.', {
      mood: 'smug',
      next: END,
    }),
  ],
  'again',
);

const luca: Dialogue = dialogue(
  'luca-cinque-euro',
  'open',
  [
    line('open', TONY, OPENER, { gesture: true, next: 'ask' }),
    line('ask', 'luca', 'Ma non dovevi darmi cinque euro?', {
      mood: 'angry',
      choices: [
        {
          text: 'Se ragioni così non sei un vero amico.',
          next: 'r1',
          effects: [cazzate(1, 'Scusa improvvisata', 'm1-luca')],
        },
        {
          text: 'Te li do appena trovo un bancomat in Siberia.',
          next: 'r2',
          effects: [cazzate(2, 'Scusa improvvisata', 'm1-luca')],
        },
        {
          text: 'Cinque euro? Fra, io ragiono in rubli.',
          next: 'r3',
          effects: [cazzate(1, 'Scusa improvvisata', 'm1-luca')],
        },
      ],
    }),
    line('r1', 'luca', 'Ah, adesso il cattivo sono io. Bella questa.', {
      mood: 'confused',
      next: 'done',
    }),
    line('r2', 'luca', 'In Siberia c’è il bancomat? Con la fila di orsi?', {
      mood: 'shocked',
      next: 'done',
    }),
    line('r3', 'luca', 'Rubli. Va bene. Allora mi devi cinquecento rubli, più gli interessi.', {
      mood: 'smug',
      next: 'done',
    }),
    line('done', TONY, 'Oh fraaaa, ci vediamo.', {
      gesture: true,
      effects: [objective('ninna-canna', 'talk-luca')],
      next: 'chain',
    }),
    ...chain(),
    line('again', 'luca', 'Tony, ma i miei cinque euro? Eh? EH?', { mood: 'angry', next: END }),
  ],
  'again',
);

const giulia: Dialogue = dialogue(
  'giulia-favori',
  'open',
  [
    line('open', TONY, OPENER, { gesture: true, next: 'ask' }),
    line('ask', 'giulia', 'Ma quanti favori devi ancora restituire?', {
      mood: 'smug',
      choices: [
        {
          text: 'Non puoi capire la situazione.',
          next: 'r1',
          effects: [cazzate(1, 'Scusa improvvisata', 'm1-giulia')],
        },
        {
          text: 'Ne ho perso il conto: li tengo in un’altra valuta.',
          next: 'r2',
          effects: [cazzate(2, 'Scusa improvvisata', 'm1-giulia')],
        },
        {
          text: 'Dipende, i favori vanno a stagioni.',
          next: 'r3',
          effects: [cazzate(1, 'Scusa improvvisata', 'm1-giulia')],
        },
      ],
    }),
    line('r1', 'giulia', 'Ho capito benissimo: sei in rosso anche con le scuse.', {
      mood: 'smug',
      next: 'done',
    }),
    line('r2', 'giulia', 'Un’altra valuta. Quindi è tipo il Monopoli.', {
      mood: 'confused',
      next: 'done',
    }),
    line('r3', 'giulia', 'Stagioni? E adesso che stagione è, scusa?', {
      mood: 'confused',
      next: 'done',
    }),
    line('done', TONY, 'Oh fraaaa, ci vediamo.', {
      gesture: true,
      effects: [objective('ninna-canna', 'talk-giulia')],
      next: 'chain',
    }),
    ...chain(),
    line('again', 'giulia', 'Tony, il conto dei favori è salito. Non chiedermi di quanto.', {
      mood: 'smug',
      next: END,
    }),
  ],
  'again',
);

export const M1_DIALOGUES: readonly Dialogue[] = [marco, luca, giulia];
