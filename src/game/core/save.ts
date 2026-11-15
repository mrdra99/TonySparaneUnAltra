/**
 * OWNER: Architecture.
 * Salvataggio su localStorage con schema VERSIONATO.
 *  - SAVE_VERSION + catena di migrazioni (versione n -> n+1) applicate in ordine
 *  - validazione/sanitizzazione di ogni campo; dati corrotti o di versione futura -> fallback sicuro
 *  - ogni accesso allo storage e' in try/catch (storage bloccato, quota, modalita' privata)
 * Per cambiare lo schema: incrementare SAVE_VERSION e aggiungere in MIGRATIONS la funzione
 * `[versionePrecedente]: (data) => dataNuova`.
 */
import { createInitialProgress } from '@/game/progression/progress';
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';
import type { GameSave, MissionProgress, PlayerProgress, Settings } from './types';

export const SAVE_VERSION = 1;
export const SAVE_STORAGE_KEY = 'tony-sparane-un-altra:save';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Migrazione dalla versione `n` (chiave) alla `n + 1`. Riceve e restituisce dati non tipizzati. */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;
export type MigrationMap = Readonly<Record<number, Migration>>;

/** Nessuna migrazione reale: la v1 e' lo schema iniziale. */
export const MIGRATIONS: MigrationMap = {};

export type LoadResult =
  | { status: 'none' }
  | { status: 'unavailable' }
  | { status: 'corrupt'; reason: string }
  | { status: 'loaded'; save: GameSave; migrated: boolean };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function strings(v: unknown): readonly string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter((x): x is string => typeof x === 'string'))];
}

function finite(v: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

function timestamp(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

function sanitizeMissions(v: unknown): Readonly<Record<string, MissionProgress>> {
  const out: Record<string, MissionProgress> = {};
  if (!isRecord(v)) return out;
  for (const [id, raw] of Object.entries(v)) {
    if (!isRecord(raw)) continue;
    const status =
      raw['status'] === 'completed' ? 'completed' : raw['status'] === 'active' ? 'active' : null;
    if (!status) continue;
    out[id] = { status, completedObjectives: strings(raw['completedObjectives']) };
  }
  return out;
}

/** Restituisce un PlayerProgress valido da dati arbitrari, o null se non e' un oggetto. */
export function sanitizeProgress(raw: unknown): PlayerProgress | null {
  if (!isRecord(raw)) return null;
  const base = createInitialProgress();
  const stats = isRecord(raw['stats']) ? raw['stats'] : {};
  return {
    cazzate: finite(raw['cazzate'], 0, 0, 100),
    score: finite(raw['score'], 0),
    missions: sanitizeMissions(raw['missions']),
    flags: strings(raw['flags']),
    unlockedStories: strings(raw['unlockedStories']),
    unlockedAchievements: strings(raw['unlockedAchievements']),
    completedDialogues: strings(raw['completedDialogues']),
    claimedKeys: strings(raw['claimedKeys']),
    stats: {
      dialoguesStarted: finite(stats['dialoguesStarted'], base.stats.dialoguesStarted),
      choicesMade: finite(stats['choicesMade'], base.stats.choicesMade),
      storiesTold: finite(stats['storiesTold'], base.stats.storiesTold),
      startedAt: timestamp(stats['startedAt']),
      finishedAt: timestamp(stats['finishedAt']),
    },
  };
}

export function createGameSave(
  progress: PlayerProgress,
  settings: Settings,
  now: number,
): GameSave {
  return { version: SAVE_VERSION, savedAt: now, progress, settings };
}

export function serializeSave(save: GameSave): string {
  return JSON.stringify(save);
}

/** Applica le migrazioni in catena. Fallisce se manca un passaggio o la versione e' futura. */
export function migrateSave(
  raw: unknown,
  migrations: MigrationMap = MIGRATIONS,
  targetVersion: number = SAVE_VERSION,
): { ok: true; data: Record<string, unknown>; migrated: boolean } | { ok: false; reason: string } {
  if (!isRecord(raw)) return { ok: false, reason: 'formato non valido' };
  let version = raw['version'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, reason: 'versione mancante o non valida' };
  }
  if (version > targetVersion) return { ok: false, reason: `versione futura (${version})` };
  let data: Record<string, unknown> = raw;
  let migrated = false;
  while (version < targetVersion) {
    const step = migrations[version];
    if (!step) return { ok: false, reason: `migrazione mancante da v${version}` };
    try {
      data = { ...step(data), version: version + 1 };
    } catch {
      return { ok: false, reason: `migrazione v${version} fallita` };
    }
    version += 1;
    migrated = true;
  }
  return { ok: true, data, migrated };
}

/** Parsing completo di una stringa JSON di salvataggio (migrazione + sanitizzazione). */
export function parseSave(json: string, migrations: MigrationMap = MIGRATIONS): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { status: 'corrupt', reason: 'JSON non valido' };
  }
  const m = migrateSave(raw, migrations);
  if (!m.ok) return { status: 'corrupt', reason: m.reason };
  const progress = sanitizeProgress(m.data['progress']);
  if (!progress) return { status: 'corrupt', reason: 'progresso mancante' };
  return {
    status: 'loaded',
    migrated: m.migrated,
    save: {
      version: SAVE_VERSION,
      savedAt: finite(m.data['savedAt'], 0),
      progress,
      settings: sanitizeSettings(m.data['settings'], DEFAULT_SETTINGS),
    },
  };
}

/** Storage del browser, o null se non disponibile (accesso a localStorage puo' lanciare). */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = `${SAVE_STORAGE_KEY}:probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadGame(
  storage: StorageLike | null,
  migrations: MigrationMap = MIGRATIONS,
): LoadResult {
  if (!storage) return { status: 'unavailable' };
  let json: string | null;
  try {
    json = storage.getItem(SAVE_STORAGE_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (json === null) return { status: 'none' };
  return parseSave(json, migrations);
}

/** Restituisce true se scritto. Non lancia mai. */
export function saveGame(storage: StorageLike | null, save: GameSave): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_STORAGE_KEY, serializeSave(save));
    return true;
  } catch {
    return false;
  }
}

export function clearSave(storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(SAVE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
