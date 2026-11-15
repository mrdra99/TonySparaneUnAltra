import { createInitialProgress } from '@/game/progression/progress';
import {
  MIGRATIONS,
  SAVE_STORAGE_KEY,
  SAVE_VERSION,
  clearSave,
  createGameSave,
  loadGame,
  migrateSave,
  parseSave,
  sanitizeProgress,
  saveGame,
  type StorageLike,
} from './save';
import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';

function memoryStorage(
  initial: Record<string, string> = {},
): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

describe('save / load', () => {
  it('round trip', () => {
    const storage = memoryStorage();
    const progress = { ...createInitialProgress(5), cazzate: 42, flags: ['a'] };
    expect(saveGame(storage, createGameSave(progress, DEFAULT_SETTINGS, 99))).toBe(true);
    const r = loadGame(storage);
    expect(r.status).toBe('loaded');
    if (r.status === 'loaded') {
      expect(r.save.version).toBe(SAVE_VERSION);
      expect(r.save.savedAt).toBe(99);
      expect(r.save.progress.cazzate).toBe(42);
      expect(r.save.progress.flags).toEqual(['a']);
      expect(r.save.settings).toEqual(DEFAULT_SETTINGS);
      expect(r.migrated).toBe(false);
    }
  });
  it('nessun salvataggio -> none', () => {
    expect(loadGame(memoryStorage()).status).toBe('none');
  });
  it('storage assente o che lancia -> unavailable / false senza eccezioni', () => {
    expect(loadGame(null).status).toBe('unavailable');
    expect(loadGame(throwingStorage).status).toBe('unavailable');
    expect(
      saveGame(throwingStorage, createGameSave(createInitialProgress(), DEFAULT_SETTINGS, 1)),
    ).toBe(false);
    expect(saveGame(null, createGameSave(createInitialProgress(), DEFAULT_SETTINGS, 1))).toBe(
      false,
    );
    expect(clearSave(throwingStorage)).toBe(false);
  });
  it('clearSave rimuove', () => {
    const storage = memoryStorage({ [SAVE_STORAGE_KEY]: '{}' });
    expect(clearSave(storage)).toBe(true);
    expect(loadGame(storage).status).toBe('none');
  });
});

describe('dati corrotti', () => {
  it.each([
    ['json non valido', '{non json'],
    ['non oggetto', '42'],
    ['array', '[]'],
    ['null', 'null'],
    ['senza versione', '{"progress":{}}'],
    ['versione non intera', '{"version":1.5,"progress":{}}'],
    ['versione zero', '{"version":0,"progress":{}}'],
    ['senza progress', `{"version":${SAVE_VERSION}}`],
    ['progress non oggetto', `{"version":${SAVE_VERSION},"progress":"x"}`],
  ])('%s -> corrupt', (_label, json) => {
    expect(parseSave(json).status).toBe('corrupt');
  });
  it('versione futura -> corrupt (non sovrascrive logica)', () => {
    const r = parseSave(`{"version":${SAVE_VERSION + 1},"progress":{}}`);
    expect(r).toMatchObject({ status: 'corrupt' });
  });
  it('sanitizza campi con tipi sbagliati', () => {
    const r = parseSave(
      JSON.stringify({
        version: SAVE_VERSION,
        savedAt: 'ieri',
        progress: {
          cazzate: 9999,
          score: -4,
          missions: {
            ok: { status: 'completed', completedObjectives: ['a', 3, 'a'] },
            bad: { status: 'x' },
            worse: 7,
          },
          flags: 'no',
          unlockedStories: ['s1', null],
          stats: { dialoguesStarted: 'molti', startedAt: 123 },
        },
        settings: { volume: 5, muted: 'si', quality: 'ultra', cameraDistance: 1 },
      }),
    );
    expect(r.status).toBe('loaded');
    if (r.status !== 'loaded') return;
    const p = r.save.progress;
    expect(p.cazzate).toBe(100);
    expect(p.score).toBe(0);
    expect(p.missions).toEqual({ ok: { status: 'completed', completedObjectives: ['a'] } });
    expect(p.flags).toEqual([]);
    expect(p.unlockedStories).toEqual(['s1']);
    expect(p.stats.dialoguesStarted).toBe(0);
    expect(p.stats.startedAt).toBe(123);
    expect(r.save.savedAt).toBe(0);
    expect(r.save.settings.volume).toBe(1);
    expect(r.save.settings.muted).toBe(DEFAULT_SETTINGS.muted);
    expect(r.save.settings.quality).toBe('auto');
    expect(r.save.settings.cameraDistance).toBe(3);
  });
  it('sanitizeProgress(null) = null', () => {
    expect(sanitizeProgress(null)).toBeNull();
    expect(sanitizeProgress('x')).toBeNull();
  });
});

describe('migrazioni', () => {
  const v1 = { version: 1, savedAt: 1, progress: { cazzate: 10 }, settings: {} };
  it('la catena reale e vuota alla v1', () => {
    expect(Object.keys(MIGRATIONS)).toHaveLength(0);
  });
  it('applica migrazioni in ordine fino alla versione target', () => {
    const order: number[] = [];
    const res = migrateSave(
      v1,
      {
        1: (d) => {
          order.push(1);
          return { ...d, progress: { ...(d['progress'] as object), cazzate: 20 } };
        },
        2: (d) => {
          order.push(2);
          return { ...d, extra: true };
        },
      },
      3,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(order).toEqual([1, 2]);
      expect(res.migrated).toBe(true);
      expect(res.data['version']).toBe(3);
      expect(res.data['extra']).toBe(true);
      expect((res.data['progress'] as { cazzate: number }).cazzate).toBe(20);
    }
  });
  it('migrazione mancante o che lancia -> errore', () => {
    expect(migrateSave(v1, {}, 2)).toMatchObject({ ok: false });
    expect(
      migrateSave(
        v1,
        {
          1: () => {
            throw new Error('boom');
          },
        },
        2,
      ),
    ).toMatchObject({ ok: false });
  });
});

describe('settings', () => {
  it('sanitizeSettings usa i default per input invalidi', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({ volume: Number.NaN, mouseSensitivity: 100 }).mouseSensitivity).toBe(
      3,
    );
    expect(sanitizeSettings({ volume: Number.NaN }).volume).toBe(DEFAULT_SETTINGS.volume);
  });
});
