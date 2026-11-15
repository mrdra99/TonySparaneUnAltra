/** Timeline PURA della cartolina fra le tappe (ms dall'inizio) e testi delle cartoline. */

export const FADE_MS = 550;
export const CARD_MS = 3800;
/** Prima di questo tempo dall'inizio della cartolina lo skip non vale (evita doppi tocchi involontari). */
export const SKIP_LOCK_MS = 700;

export type TransitionStage = 'fadeOut' | 'card' | 'fadeIn' | 'done';

/** Istante (ms) in cui la cartolina finisce, dato l'eventuale skip. */
export function cardEnd(skippedAtMs: number | null): number {
  const natural = FADE_MS + CARD_MS;
  if (skippedAtMs === null) return natural;
  return Math.min(natural, Math.max(skippedAtMs, FADE_MS + SKIP_LOCK_MS));
}

export function transitionStageAt(elapsedMs: number, skippedAtMs: number | null): TransitionStage {
  if (elapsedMs < FADE_MS) return 'fadeOut';
  const end = cardEnd(skippedAtMs);
  if (elapsedMs < end) return 'card';
  if (elapsedMs < end + FADE_MS) return 'fadeIn';
  return 'done';
}

export interface Postcard {
  kicker: string;
  title: string;
  sub: string;
  stamp: string;
}

export const POSTCARDS = {
  'intercity-pisa': {
    kicker: 'FLASHBACK',
    title: 'PISA CENTRALE',
    sub: 'Notte. Un solo treno. L’Intercity. E zero euro in tasca.',
    stamp: 'ORE 23:41',
  },
  'intercity-viareggio': {
    kicker: 'PISA → VIAREGGIO',
    title: 'INTERCITY',
    sub: 'Quaranta euro di debito, un finestrino sporco e Bogdan che conta.',
    stamp: 'ORE 23:47',
  },
  'intercity-torre': {
    kicker: 'VIAREGGIO → TORRE DEL LAGO',
    title: '10 KM IN TAXI',
    sub: 'Colletta alla romana. Una quota è rimasta nell’aria.',
    stamp: 'ORE 00:52',
  },
} as const satisfies Record<string, Postcard>;
