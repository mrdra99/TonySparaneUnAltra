// OWNER: Gameplay
// MISSIONE 6 - TONY WORLD TOUR. Quattro racconti impossibili, ognuno ai punti "SPARANE UN'ALTRA"
// della piazza (e all'uscita per la stazione). Tutto e' vanteria di Tony: nessuna arma, nessuna
// violenza, nessun comportamento pericoloso. Dopo ogni storia un NPC urla la sua incredulita'.
import type { Dialogue, DialogueNode } from '@/game/core/types';
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

interface TourStory {
  /** Id del dialogo e suffisso di obiettivo/storia. */
  slug: 'vladivostok' | 'pupazzo' | 'criceti' | 'treno';
  /** Battute di Tony (2-3). */
  telling: readonly string[];
  /** Eventuale nota del narratore (cartoline, vignette) dopo il racconto. */
  panel?: string;
  /** Chi urla da lontano e cosa. */
  shouter: string;
  shout: string;
  /** Tre chiusure di Tony: [testo, reazione] (la terza vale +1 Cazzatometro). */
  endings: readonly [
    readonly [string, string],
    readonly [string, string],
    readonly [string, string],
  ];
}

function tourDialogue(s: TourStory): Dialogue {
  const id = `tour-${s.slug}`;
  const once = `m6-${s.slug}`;
  const nodes: DialogueNode[] = [];
  s.telling.forEach((text, i) => {
    const isFirst = i === 0;
    const isLast = i === s.telling.length - 1;
    nodes.push(
      line(`t${i}`, TONY, text, {
        gesture: true,
        ...(isFirst ? { effects: [cazzate(1, 'Storia dal World Tour', `${once}-base`)] } : {}),
        next: isLast ? (s.panel ? 'panel' : 'shout') : `t${i + 1}`,
      }),
    );
  });
  if (s.panel) nodes.push(line('panel', NARRATOR, s.panel, { next: 'shout' }));
  nodes.push(
    line('shout', s.shouter, `(da lontano) ${s.shout}`, { mood: 'shocked', next: 'pick' }),
    line('pick', TONY, 'E se non ci credete...', {
      gesture: true,
      choices: s.endings.map(([text], i) => ({
        text,
        next: `r${i}`,
        ...(i === 2 ? { effects: [cazzate(1, 'Storia leggendaria', `${once}-end`)] } : {}),
      })),
    }),
  );
  s.endings.forEach(([, reaction], i) => {
    nodes.push(
      line(`r${i}`, s.shouter, `(da lontano) ${reaction}`, { mood: 'confused', next: 'done' }),
    );
  });
  nodes.push(
    line(
      'done',
      TONY,
      'Ecco un’altra tappa del World Tour. Il prossimo biglietto lo paga la leggenda.',
      {
        gesture: true,
        effects: [objective('tony-world-tour', id), unlockStory(`story-${s.slug}`)],
        next: 'chain',
      },
    ),
    ...completionChain({
      missionId: 'tony-world-tour',
      text: 'World Tour completato: quattro storie, zero prove, applausi dalla piazza.',
      hint: 'Il Cazzatometro vibra. Sta per succedere qualcosa di grosso.',
    }),
    line('again', TONY, 'Questa tappa l’ho già raccontata. Ma vale sempre il biglietto.', {
      gesture: true,
      next: END,
    }),
  );
  return dialogue(id, 't0', nodes, 'again');
}

const stories: readonly TourStory[] = [
  {
    slug: 'vladivostok',
    telling: [
      'Fra, una volta a Vladivostok mi hanno invitato a guardare un addestramento delle Spetsnaz.',
      'Io ero lì col thermos del caffè. Mi hanno nominato “capo della pausa”: alle undici in punto fischiavo e si fermavano tutti.',
      'Il sergente mi ha detto: “Tony, tu sei l’unico che ha capito la parte importante: il caffè.”',
    ],
    shouter: 'marco',
    shout: 'Fra, questa è impossibile.',
    endings: [
      ['Giuro sul thermos.', 'Sul thermos. Almeno è un giuramento caldo.'],
      ['Ho una foto, ma è sfocata.', 'Sfocata. Come tutte le tue prove.'],
      ['Chiedete a mio cugino, a Vladivostok.', 'Tuo cugino in Siberia. Gli mando un piccione.'],
    ],
  },
  {
    slug: 'pupazzo',
    telling: [
      'E poi c’è la storia del pupazzo. Un orsetto con le pile, nome in codice: Ciccio.',
      'Dentro Ciccio ho nascosto il segreto più pericoloso d’Europa.',
      'Non vi dico cos’è. Vi dico solo che se lo scopre qualcuno, stasera si litiga per le fette.',
    ],
    panel:
      'Vignetta: un orsetto di peluche con un lucchetto al collo, e un fumetto che dice “SSSH!”.',
    shouter: 'luca',
    shout: 'Ma non eri a scuola quel giorno?',
    endings: [
      [
        'Ciccio è in un posto sicuro. Cioè, in un cassetto.',
        'Un cassetto. Il segreto d’Europa è in un cassetto.',
      ],
      ['Se parlo, l’orsetto si offende.', 'Si offende un orsetto. Va bene, nessuno lo disturba.'],
      [
        'Ho cambiato nascondiglio tre volte, fra.',
        'Tre nascondigli. Intanto il nostro è il peggiore: la tua faccia.',
      ],
    ],
  },
  {
    slug: 'criceti',
    telling: [
      'E la gabbietta dei criceti di mia zia: due piani, balcone e citofono.',
      'I criceti hanno organizzato un’assemblea di condominio. Ordine del giorno: la ruota nuova.',
      'Alla fine hanno votato all’unanimità: ruota a turni e nessuno litiga. Mia zia piange ancora per la commozione.',
    ],
    panel:
      'Vignetta: tre criceti con la cravatta intorno a un tavolino minuscolo, mentre il più piccolo alza la zampa.',
    shouter: 'giulia',
    shout: 'Tony, ma almeno questa volta ci credi tu?',
    endings: [
      ['Io? Sempre. Anzi, un po’ di meno.', 'Un po’ di meno. È già un record di onestà.'],
      ['Ho il verbale dell’assemblea.', 'Il verbale. Scritto con una zampetta, presumo.'],
      ['I criceti non mentono mai.', 'I criceti no. Gli zii dei criceti, forse.'],
    ],
  },
  {
    slug: 'treno',
    telling: [
      'Una volta mi sono addormentato in cuccetta e mi sono svegliato a Budapest.',
      'Sulla banchina c’era un giudice con il cappello di carta: mi ha processato per “racconto troppo bello”.',
      'Mi hanno condannato a ricevere cartoline dal mondo: una da Praga, una da Vienna, una da Marte.',
    ],
    panel: 'Cartolina: “Saluti da Budapest! Il processo va benissimo, il giudice ha riso. Tony”.',
    shouter: 'bogdan',
    shout: 'Segno tutto sul quaderno. Alla voce “treni”.',
    endings: [
      ['Ho ancora le cartoline.', 'Le cartoline. Anche quella da Marte? Con il francobollo?'],
      [
        'Ho vinto il processo ai punti.',
        'Ai punti. Il giudice aveva il cappello, quindi vale doppio.',
      ],
      [
        'Il giudice mi segue su tutti i social.',
        'Il giudice coi social. Almeno mette “mi piace” alle scuse.',
      ],
    ],
  },
];

export const M6_DIALOGUES: readonly Dialogue[] = stories.map(tourDialogue);
