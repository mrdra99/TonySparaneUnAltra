// OWNER: Gameplay
// MISSIONE 3 - IL DEBITO LEGGENDARIO (i 40 euro di Bogdan, personaggio fittizio e stilizzato).
// Minigioco: tre scuse consecutive. Ogni scusa ha uno "stile" (A: negazione, B: conti, C: assurdo).
// Restare coerenti alza la credibilita', cambiare versione la abbassa (B<->C e' neutro). Le battute
// di Bogdan dipendono da cio' che Tony ha detto prima; l'esito (win/draw/lose) cambia il finale ma
// la missione e' SEMPRE completabile. Il grafo e' generato qui in modo dichiarativo.
import type { Dialogue, DialogueChoice, DialogueNode } from '@/game/core/types';
import {
  END,
  TONY,
  cazzate,
  completionChain,
  dialogue,
  flag,
  line,
  objective,
  unlockStory,
} from './builder';

export type ExcuseStyle = 'A' | 'B' | 'C';
const STYLES: readonly ExcuseStyle[] = ['A', 'B', 'C'];

/** Variazione di credibilita' passando dallo stile `prev` allo stile `next`. */
export function credibilityDelta(prev: ExcuseStyle, next: ExcuseStyle): number {
  if (prev === next) return 1;
  if (prev !== 'A' && next !== 'A') return 0;
  return -1;
}

export type DebtVerdict = 'win' | 'draw' | 'lose';
/** Esito finale a partire dai tre stili scelti (credibilita' iniziale 2). */
export function debtVerdict(s1: ExcuseStyle, s2: ExcuseStyle, s3: ExcuseStyle): DebtVerdict {
  const c = 2 + credibilityDelta(s1, s2) + credibilityDelta(s2, s3);
  return c >= 3 ? 'win' : c === 2 ? 'draw' : 'lose';
}

const ROUND1: Record<ExcuseStyle, string> = {
  A: 'Te li ho già dati, fra.',
  B: 'Dobbiamo prima fare i conti.',
  C: 'In questo momento ho i fondi bloccati a Vladivostok.',
};
const ROUND2: Record<ExcuseStyle, string> = {
  A: 'Davanti a testimoni. C’era anche un piccione.',
  B: 'Tu mi devi la differenza, se ci pensi.',
  C: 'Il bonifico è partito, ma è fermo alla frontiera.',
};
const ROUND3: Record<ExcuseStyle, string> = {
  A: 'Tu confondi, fra: io pago sempre in anticipo.',
  B: 'Facciamo un conto semplice: tu mi devi un caffè.',
  C: 'Domani sblocco tutto: ho un cugino in ambasciata.',
};
/** Cazzatometro per scusa: l'assurdo (C) vale di piu'. */
const GAIN: Record<ExcuseStyle, number> = { A: 1, B: 1, C: 2 };

/** Reazione di Bogdan alla PRIMA scusa (introduce il secondo round). */
const REACT1: Record<ExcuseStyle, string> = {
  A: 'Già dati. Quando? Dove? Con quale testimone?',
  B: 'I conti. Va bene. Io ho il quaderno, tu la fantasia.',
  C: 'Vladivostok. Ovviamente. Dove altro?',
};
/** Reazione alla SECONDA scusa, dato lo stile della prima (introduce il terzo round). */
const REACT2: Record<ExcuseStyle, Record<ExcuseStyle, string>> = {
  A: {
    A: 'Già dati, ancora già dati. Sei coerente come un muro. Ultima occasione, fra.',
    B: 'Prima “già dati”, ora “i conti”? Scegli una versione, fra. Ultima occasione.',
    C: 'Già dati, ma anche bloccati a Vladivostok? Li hai dati a un orso? Ultima occasione.',
  },
  B: {
    A: 'Prima i conti, poi “già dati”? Hai il quaderno della verità? Ultima occasione.',
    B: 'La differenza, la differenza... almeno sei preciso. Ultima occasione.',
    C: 'Conti e bonifico fermo: questa potrebbe reggere. Ultima occasione, eh.',
  },
  C: {
    A: 'Bloccati a Vladivostok, ma già dati? Il bonifico è tornato indietro? Ultima occasione.',
    B: 'Bonifico bloccato e poi la differenza: mi stai quasi convincendo. Ultima occasione.',
    C: 'Frontiera, bonifico, ambasciata: almeno la storia ha una geografia. Ultima occasione.',
  },
};

const VERDICT_LINES: Record<DebtVerdict, { text: string; mood: 'happy' | 'confused' | 'angry' }> = {
  win: {
    text: 'Mi hai quasi convinto. Anzi no: mi hai confuso. Per oggi lasciamo stare i 40 euro, ma il quaderno resta aperto.',
    mood: 'happy',
  },
  draw: {
    text: 'Non ci ho capito niente, ma sembri sincero. Segno i 40 euro come “da definire”. Quaderno nuovo!',
    mood: 'confused',
  },
  lose: {
    text: 'Le tue scuse fanno acqua da tutte le parti. Va bene: 40 euro, più 5 di interessi creativi.',
    mood: 'angry',
  },
};

const BOGDAN_AGAIN: Record<DebtVerdict, string> = {
  win: 'Tony! Per questa settimana i 40 euro dormono. Non svegliarli.',
  draw: 'Quaderno nuovo, pagina nuova: 40 euro “da definire”. Sono ottimista.',
  lose: 'Con gli interessi creativi siamo a 45. Ti ho fatto lo sconto del sorriso.',
};

function choicesFor(
  texts: Record<ExcuseStyle, string>,
  nextFor: (s: ExcuseStyle) => string,
  round: 1 | 2 | 3,
): DialogueChoice[] {
  return STYLES.map((s) => ({
    text: texts[s],
    next: nextFor(s),
    effects: [cazzate(GAIN[s], 'Scusa improvvisata', `m3-r${round}`)],
  }));
}

function buildDebtDialogue(): Dialogue {
  const nodes: DialogueNode[] = [];
  nodes.push(
    line('open', TONY, 'Oh Bogdan, fra, che bella giornata, eh?', { gesture: true, next: 'claim' }),
    line('claim', 'bogdan', 'Tony. Quaranta euro. Ho il quaderno qui. Dove sono i miei soldi?', {
      mood: 'angry',
      choices: choicesFor(ROUND1, (s) => `r2_${s}`, 1),
    }),
  );
  for (const s1 of STYLES) {
    nodes.push(
      line(`r2_${s1}`, 'bogdan', REACT1[s1], {
        mood: s1 === 'C' ? 'shocked' : 'smug',
        choices: choicesFor(ROUND2, (s2) => `r3_${s1}${s2}`, 2),
      }),
    );
  }
  for (const s1 of STYLES) {
    for (const s2 of STYLES) {
      nodes.push(
        line(`r3_${s1}${s2}`, 'bogdan', REACT2[s1][s2], {
          mood: credibilityDelta(s1, s2) < 0 ? 'angry' : 'confused',
          choices: choicesFor(ROUND3, (s3) => `v_${debtVerdict(s1, s2, s3)}`, 3),
        }),
      );
    }
  }
  for (const v of ['win', 'draw', 'lose'] as const) {
    nodes.push(
      line(`v_${v}`, 'bogdan', VERDICT_LINES[v].text, {
        mood: VERDICT_LINES[v].mood,
        effects: [flag(`bogdan.${v}`)],
        next: 'done',
      }),
    );
  }
  nodes.push(
    line('done', TONY, 'Bogdan, sei un amico. Un amico con un quaderno, ma un amico.', {
      gesture: true,
      effects: [objective('debito-leggendario', 'settle-debt'), unlockStory('story-debito')],
      next: 'chain',
    }),
    ...completionChain({
      missionId: 'debito-leggendario',
      text: 'Bogdan chiude il quaderno. Sulla copertina c’è scritto “Tony: vedi appendice”.',
      hint: 'Dalle parti della bici qualcuno ripete a mezza voce: “Ma che storia è quella di Monica?”',
      next: 'mistero-bici',
    }),
    // riapertura: la battuta dipende dall'esito
    line('again', 'bogdan', BOGDAN_AGAIN.win, {
      mood: 'happy',
      requires: [{ type: 'flag', flag: 'bogdan.win' }],
      fallback: 'again_draw',
      next: END,
    }),
    line('again_draw', 'bogdan', BOGDAN_AGAIN.draw, {
      mood: 'confused',
      requires: [{ type: 'flag', flag: 'bogdan.draw' }],
      fallback: 'again_lose',
      next: END,
    }),
    line('again_lose', 'bogdan', BOGDAN_AGAIN.lose, { mood: 'smug', next: END }),
  );
  return dialogue('bogdan-debito', 'open', nodes, 'again');
}

export const M3_DIALOGUES: readonly Dialogue[] = [buildDebtDialogue()];
