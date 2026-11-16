/** Regole PURE del livello: pazienza di Bogdan, colletta, countdown, tappe, sblocco. */
import { PLAYER_DISPLAY_NAME } from '@/game/core/constants';
import type { PlayerProgress } from '@/game/core/types';
import { SESSION_FLAG_PREFIX, FINALE_MISSION_ID, FLAGS, FLASHBACK_STAGES } from './ids';
import type { FlashbackLevelId, LevelId } from './ids';

// ---------------------------------------------------------------------------
// Sblocco del racconto
// ---------------------------------------------------------------------------

/** Il racconto si sblocca quando tutte le missioni principali (tutte tranne il finale) sono completate. */
export function isFinaleUnlocked(
  progress: Pick<PlayerProgress, 'missions'>,
  missionOrder: readonly string[],
): boolean {
  const main = missionOrder.filter((id) => id !== FINALE_MISSION_ID);
  return main.length > 0 && main.every((id) => progress.missions[id]?.status === 'completed');
}

/** Rimuove i flag di sessione (non tocca il flag permanente del K.O.). Stessa referenza se nulla cambia. */
export function stripSessionFlags(flags: readonly string[]): readonly string[] {
  return flags.some((f) => f.startsWith(SESSION_FLAG_PREFIX))
    ? flags.filter((f) => !f.startsWith(SESSION_FLAG_PREFIX))
    : flags;
}

// ---------------------------------------------------------------------------
// Pazienza di Bogdan
// ---------------------------------------------------------------------------

export const PATIENCE_START = 100;
export const PATIENCE_COST_LOAN = 40;
export const PATIENCE_COST_COLLETTA = 40;

/** 100 -> 60 (Intercity) -> 20 (colletta) -> 0 (ninna kanna). */
export function patienceFromFlags(flags: readonly string[]): number {
  if (flags.includes(FLAGS.ninna)) return 0;
  let p = PATIENCE_START;
  if (flags.includes(FLAGS.loan)) p -= PATIENCE_COST_LOAN;
  if (flags.includes(FLAGS.colBogdan)) p -= PATIENCE_COST_COLLETTA;
  return Math.max(0, p);
}

// ---------------------------------------------------------------------------
// Colletta alla romana
// ---------------------------------------------------------------------------

export const TAXI_FARE_EUR = 35;
export const COLLETTA_PEOPLE = 5;
export const COLLETTA_SHARE_EUR = TAXI_FARE_EUR / COLLETTA_PEOPLE;

export interface CollettaRow {
  id: 'nico' | 'vale' | 'ricky' | 'bogdan' | 'tony';
  name: string;
  /** Euro versati, null se non ancora (Tony resta sempre a 0). */
  amount: number | null;
  /** Nota comica sotto il nome. */
  note: string;
}

export interface CollettaState {
  rows: readonly CollettaRow[];
  collected: number;
  fare: number;
  /** Quota di Tony versata da lui stesso: sempre 0. */
  tonyPaid: number;
  /** Tutti hanno pagato (Bogdan compreso, anche per Tony). */
  complete: boolean;
  /** Amici che hanno gia' messo la loro quota. */
  friendsPaid: number;
}

export function collettaState(flags: readonly string[]): CollettaState {
  const has = (f: string): boolean => flags.includes(f);
  const share = COLLETTA_SHARE_EUR;
  const rows: CollettaRow[] = [
    {
      id: 'nico',
      name: 'Nico',
      amount: has(FLAGS.colNico) ? share : null,
      note: 'tasche vuote (la sua quota c’è)',
    },
    {
      id: 'vale',
      name: 'Vale',
      amount: has(FLAGS.colVale) ? share : null,
      note: 'buoni pasto (solo i suoi)',
    },
    {
      id: 'ricky',
      name: 'Ricky',
      amount: has(FLAGS.colRicky) ? share : null,
      note: 'Satispay (solo il suo)',
    },
    {
      id: 'bogdan',
      name: 'Bogdan',
      amount: has(FLAGS.colBogdan) ? share * 2 : null,
      note: 'la sua + quella di Tony',
    },
    { id: 'tony', name: PLAYER_DISPLAY_NAME, amount: 0, note: 'ci ha provato' },
  ];
  const collected = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  return {
    rows,
    collected,
    fare: TAXI_FARE_EUR,
    tonyPaid: 0,
    complete: collected >= TAXI_FARE_EUR,
    friendsPaid: [FLAGS.colNico, FLAGS.colVale, FLAGS.colRicky].filter(has).length,
  };
}

/** Bogdan accetta di coprire Tony solo dopo che tutti gli altri hanno provato. */
export function canBogdanCoverTony(flags: readonly string[]): boolean {
  return [FLAGS.colNico, FLAGS.colVale, FLAGS.colRicky].every((f) => flags.includes(f));
}

export function formatEuro(amount: number): string {
  return `${amount.toFixed(2).replace('.', ',')} €`;
}

// ---------------------------------------------------------------------------
// Countdown dell'Intercity (a Pisa)
// ---------------------------------------------------------------------------

export const COUNTDOWN_START_SEC = 90;
export const DELAY_MINUTES = 5;
export const DELAY_ANNOUNCEMENT = "L'Intercity viaggia con 5 minuti di ritardo. Come sempre.";

export interface Countdown {
  sec: number;
  /** Quante volte il tempo e' scaduto (ritardi annunciati). */
  delays: number;
}

export const initialCountdown = (): Countdown => ({ sec: COUNTDOWN_START_SEC, delays: 0 });

/** Avanza di `dtSec`. Allo scadere NON c'e' game over: ritardo annunciato e timer azzerato. */
export function stepCountdown(
  c: Countdown,
  dtSec: number,
): { countdown: Countdown; expired: boolean } {
  const sec = c.sec - dtSec;
  if (sec > 0) return { countdown: { sec, delays: c.delays }, expired: false };
  return { countdown: { sec: COUNTDOWN_START_SEC, delays: c.delays + 1 }, expired: true };
}

export function formatCountdown(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Macchina a stati delle tappe
// ---------------------------------------------------------------------------

/** Flag che chiude la tappa. L'ultima tappa chiude con la scena del K.O. */
const STAGE_DONE_FLAG: Readonly<Record<FlashbackLevelId, string>> = {
  'intercity-pisa': FLAGS.pisaBoarded,
  'intercity-viareggio': FLAGS.taxiBoarded,
  'intercity-torre': FLAGS.ninna,
};

export function isStageComplete(level: LevelId, flags: readonly string[]): boolean {
  if (level === 'piazza') return false;
  return flags.includes(STAGE_DONE_FLAG[level]);
}

/** Tappa successiva, o null se `level` e' l'ultima (-> K.O. tecnico) o la piazza. */
export function nextStage(level: LevelId): FlashbackLevelId | null {
  const i = FLASHBACK_STAGES.indexOf(level as FlashbackLevelId);
  if (i < 0) return null;
  return FLASHBACK_STAGES[i + 1] ?? null;
}

export type StageAdvance =
  { kind: 'wait' } | { kind: 'transition'; to: FlashbackLevelId } | { kind: 'ko' };

/** Cosa fare ora data la tappa corrente e i flag (puro): attendere, cambiare tappa o lanciare il K.O. */
export function advanceStage(level: LevelId, flags: readonly string[]): StageAdvance {
  if (!isStageComplete(level, flags)) return { kind: 'wait' };
  const next = nextStage(level);
  return next ? { kind: 'transition', to: next } : { kind: 'ko' };
}
