/** Livello "La notte dell'Intercity": identificatori e costanti condivise (puro, niente React/three). */
import { FINALE_KO_FLAG } from '@/game/progression/cazzatometro';

export type LevelId = 'piazza' | 'intercity-pisa' | 'intercity-viareggio' | 'intercity-torre';
export type FlashbackLevelId = Exclude<LevelId, 'piazza'>;

/** Ordine delle tappe del flashback. */
export const FLASHBACK_STAGES: readonly FlashbackLevelId[] = [
  'intercity-pisa',
  'intercity-viareggio',
  'intercity-torre',
];

export const isFlashbackLevel = (level: LevelId): level is FlashbackLevelId => level !== 'piazza';

export const FINALE_MISSION_ID = 'notte-intercity';
export const FINALE_OBJECTIVES = {
  loan: 'prestito-intercity',
  colletta: 'colletta-taxi',
  ninna: 'ninna-kanna',
} as const;

/** Interagibile della piazza che lancia il flashback (gestito dallo store). */
export const FINALE_START_INTERACTABLE_ID = 'finale:start';
export const FINALE_START_LABEL = "RACCONTA LA NOTTE DELL'INTERCITY";
export const FINALE_LOCKED_LABEL = 'Prima finisci le altre storie';

/** Prefisso dei flag di sessione: azzerati a ogni avvio del flashback (non persistono fra le sessioni). */
export const SESSION_FLAG_PREFIX = 'finale.s.';

export const FLAGS = {
  loan: 'finale.s.loan',
  pisaBoarded: 'finale.s.pisa.boarded',
  colNico: 'finale.s.col.nico',
  colVale: 'finale.s.col.vale',
  colRicky: 'finale.s.col.ricky',
  colBogdan: 'finale.s.col.bogdan',
  taxiBoarded: 'finale.s.vgo.boarded',
  ninna: 'finale.s.ninna',
  /** Permanente: toglie il tetto del Cazzatometro e vale come "finale visto". */
  ko: FINALE_KO_FLAG,
} as const;
