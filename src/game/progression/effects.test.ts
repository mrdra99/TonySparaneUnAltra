import { makeTestContent } from '@/tests/fixtures';
import {
  FINALE_KO_FLAG,
  PRE_FINALE_CAP,
  THRESHOLD_MESSAGES,
  clampCazzate,
  thresholdsCrossed,
} from './cazzatometro';
import { applyEffect, applyEffects } from './effects';
import { createInitialProgress } from './progress';

const content = makeTestContent();
const fresh = () => createInitialProgress(1000);

describe('cazzatometro', () => {
  it('clampa a 0..100', () => {
    expect(clampCazzate(-5)).toBe(0);
    expect(clampCazzate(250)).toBe(100);
    expect(clampCazzate(Number.NaN)).toBe(0);
  });
  it('rileva le soglie attraversate solo in salita', () => {
    expect(thresholdsCrossed(0, 24)).toEqual([]);
    expect(thresholdsCrossed(24, 25)).toEqual([25]);
    expect(thresholdsCrossed(20, 80)).toEqual([25, 50, 75]);
    expect(thresholdsCrossed(80, 20)).toEqual([]);
  });
  it('usa i messaggi esatti', () => {
    expect(THRESHOLD_MESSAGES[25]).toBe('Tony sta prendendo confidenza.');
    expect(THRESHOLD_MESSAGES[50]).toBe('La piazza inizia a dubitare.');
    expect(THRESHOLD_MESSAGES[75]).toBe('Livello leggenda urbana.');
    expect(THRESHOLD_MESSAGES[100]).toBe("TONY NE HA SPARATA UN'ALTRA!");
  });
});

describe('applyEffect addCazzate', () => {
  it('aumenta e produce cazzateIncreased', () => {
    const r = applyEffect(fresh(), { type: 'addCazzate', amount: 10, reason: 'x' }, content);
    expect(r.progress.cazzate).toBe(10);
    expect(r.events).toEqual([{ type: 'cazzateIncreased', amount: 10, total: 10, reason: 'x' }]);
  });
  it('emette le soglie attraversate con i messaggi', () => {
    const r = applyEffect(fresh(), { type: 'addCazzate', amount: 55, reason: 'x' }, content);
    const thresholds = r.events.filter((e) => e.type === 'thresholdReached');
    expect(thresholds).toEqual([
      { type: 'thresholdReached', threshold: 25, message: 'Tony sta prendendo confidenza.' },
      { type: 'thresholdReached', threshold: 50, message: 'La piazza inizia a dubitare.' },
    ]);
  });
  it('prima del K.O. tecnico il valore e fermo al tetto pre-finale (95) e non emette il finale', () => {
    const p = { ...fresh(), cazzate: 90 };
    const r = applyEffect(p, { type: 'addCazzate', amount: 30, reason: 'x' }, content);
    expect(r.progress.cazzate).toBe(PRE_FINALE_CAP);
    expect(r.events.some((e) => e.type === 'thresholdReached' && e.threshold === 100)).toBe(false);
    expect(r.events.some((e) => e.type === 'celebration')).toBe(false);
    // al tetto: nessun altro guadagno
    const again = applyEffect(r.progress, { type: 'addCazzate', amount: 5, reason: 'x' }, content);
    expect(again.progress.cazzate).toBe(PRE_FINALE_CAP);
    expect(again.events).toEqual([]);
  });
  it('il tetto non abbassa mai un valore gia sopra (vecchi salvataggi) e non limita i malus', () => {
    const old = { ...fresh(), cazzate: 100 };
    expect(applyEffect(old, { type: 'addCazzate', amount: 3, reason: 'x' }, content).progress).toBe(
      old,
    );
    const down = applyEffect(old, { type: 'addCazzate', amount: -10, reason: 'x' }, content);
    expect(down.progress.cazzate).toBe(90);
  });
  it('con il flag del K.O. tecnico si arriva a 100: soglia e celebrazione finale; il valore e clampato', () => {
    const p = { ...fresh(), cazzate: 90, flags: [FINALE_KO_FLAG] };
    const r = applyEffect(p, { type: 'addCazzate', amount: 30, reason: 'x' }, content);
    expect(r.progress.cazzate).toBe(100);
    expect(r.events).toContainEqual({
      type: 'thresholdReached',
      threshold: 100,
      message: "TONY NE HA SPARATA UN'ALTRA!",
    });
    expect(r.events).toContainEqual({ type: 'celebration', kind: 'finale' });
    expect(r.events[0]).toMatchObject({ type: 'cazzateIncreased', amount: 10, total: 100 });
  });
  it('a 100 gia raggiunto non produce eventi', () => {
    const p = { ...fresh(), cazzate: 100 };
    const r = applyEffect(p, { type: 'addCazzate', amount: 5, reason: 'x' }, content);
    expect(r.events).toEqual([]);
    expect(r.progress).toBe(p);
  });
  it('onceId vale una sola volta', () => {
    const eff = { type: 'addCazzate', amount: 5, reason: 'x', onceId: 'k' } as const;
    const a = applyEffect(fresh(), eff, content);
    expect(a.progress.cazzate).toBe(5);
    expect(a.progress.claimedKeys).toEqual(['k']);
    const b = applyEffect(a.progress, eff, content);
    expect(b.progress).toBe(a.progress);
    expect(b.events).toEqual([]);
  });
  it('non muta l input', () => {
    const p = fresh();
    const snapshot = JSON.stringify(p);
    applyEffect(p, { type: 'addCazzate', amount: 30, reason: 'x' }, content);
    expect(JSON.stringify(p)).toBe(snapshot);
  });
});

describe('missioni e obiettivi', () => {
  it('startMission crea la missione una sola volta', () => {
    const a = applyEffect(fresh(), { type: 'startMission', missionId: 'm1' }, content);
    expect(a.progress.missions['m1']).toEqual({ status: 'active', completedObjectives: [] });
    expect(a.events).toEqual([{ type: 'missionStarted', missionId: 'm1' }]);
    const b = applyEffect(a.progress, { type: 'startMission', missionId: 'm1' }, content);
    expect(b.progress).toBe(a.progress);
  });
  it('ignora missioni e obiettivi sconosciuti', () => {
    const p = fresh();
    expect(applyEffect(p, { type: 'startMission', missionId: 'zz' }, content).progress).toBe(p);
    expect(
      applyEffect(p, { type: 'completeObjective', missionId: 'm1', objectiveId: 'zz' }, content)
        .progress,
    ).toBe(p);
  });
  it('completeObjective parziale non completa la missione', () => {
    const start = applyEffect(fresh(), { type: 'startMission', missionId: 'm1' }, content);
    const r = applyEffect(
      start.progress,
      { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
      content,
    );
    expect(r.progress.missions['m1']?.status).toBe('active');
    expect(r.events).toEqual([
      { type: 'objectiveCompleted', missionId: 'm1', objectiveId: 'o1', completed: 1, total: 2 },
    ]);
  });
  it('completeObjective su missione non avviata la avvia', () => {
    const r = applyEffect(
      fresh(),
      { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
      content,
    );
    expect(r.events[0]).toEqual({ type: 'missionStarted', missionId: 'm1' });
    expect(r.progress.missions['m1']?.completedObjectives).toEqual(['o1']);
  });
  it('un obiettivo gia completato e un no-op', () => {
    const a = applyEffect(
      fresh(),
      { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
      content,
    );
    const b = applyEffect(
      a.progress,
      { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
      content,
    );
    expect(b.progress).toBe(a.progress);
    expect(b.events).toEqual([]);
  });
  it('completa automaticamente la missione e assegna il premio', () => {
    const r = applyEffects(
      fresh(),
      [
        { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
        { type: 'completeObjective', missionId: 'm1', objectiveId: 'o2' },
      ],
      content,
    );
    expect(r.progress.missions['m1']?.status).toBe('completed');
    expect(r.progress.cazzate).toBe(15);
    expect(r.progress.unlockedAchievements).toEqual(['a1']);
    expect(r.progress.unlockedStories).toEqual(['s1']);
    // 100 (punti missione) + 25 (achievement) + 50 (storia)
    expect(r.progress.score).toBe(175);
    const types = r.events.map((e) => e.type);
    expect(types).toContain('missionCompleted');
    expect(types).toContain('achievementUnlocked');
    expect(types).toContain('storyUnlocked');
    expect(types).not.toContain('thresholdReached'); // 15 < 25
  });
  it('una missione completata ignora ulteriori obiettivi', () => {
    const done = applyEffect(
      fresh(),
      { type: 'completeObjective', missionId: 'm2', objectiveId: 'o1' },
      content,
    );
    expect(done.progress.missions['m2']?.status).toBe('completed');
    expect(done.progress.cazzate).toBe(60);
    const again = applyEffect(
      done.progress,
      { type: 'completeObjective', missionId: 'm2', objectiveId: 'o1' },
      content,
    );
    expect(again.progress).toBe(done.progress);
  });
  it('il premio puo far scattare le soglie; il finale solo dopo il K.O. tecnico', () => {
    const capped = applyEffect(
      { ...fresh(), cazzate: 50 },
      { type: 'completeObjective', missionId: 'm2', objectiveId: 'o1' },
      content,
    );
    expect(capped.progress.cazzate).toBe(PRE_FINALE_CAP);
    expect(capped.events).not.toContainEqual({ type: 'celebration', kind: 'finale' });
    const p = { ...fresh(), cazzate: 50, flags: [FINALE_KO_FLAG] };
    const r = applyEffect(
      p,
      { type: 'completeObjective', missionId: 'm2', objectiveId: 'o1' },
      content,
    );
    expect(r.progress.cazzate).toBe(100);
    expect(r.events).toContainEqual({ type: 'celebration', kind: 'finale' });
  });
});

describe('altri effetti', () => {
  it('unlockStory / unlockAchievement sono idempotenti e danno punti', () => {
    const a = applyEffects(
      fresh(),
      [
        { type: 'unlockStory', storyId: 's1' },
        { type: 'unlockStory', storyId: 's1' },
        { type: 'unlockAchievement', achievementId: 'a1' },
        { type: 'unlockAchievement', achievementId: 'a1' },
      ],
      content,
    );
    expect(a.progress.score).toBe(75);
    expect(a.events.map((e) => e.type)).toEqual(['storyUnlocked', 'achievementUnlocked']);
    expect(a.progress.stats.storiesTold).toBe(1);
  });
  it('ignora storie e achievement sconosciuti', () => {
    const p = fresh();
    expect(applyEffect(p, { type: 'unlockStory', storyId: 'nope' }, content).progress).toBe(p);
    expect(
      applyEffect(p, { type: 'unlockAchievement', achievementId: 'nope' }, content).progress,
    ).toBe(p);
  });
  it('setFlag aggiunge una sola volta', () => {
    const a = applyEffect(fresh(), { type: 'setFlag', flag: 'f' }, content);
    expect(a.progress.flags).toEqual(['f']);
    const b = applyEffect(a.progress, { type: 'setFlag', flag: 'f' }, content);
    expect(b.progress).toBe(a.progress);
  });
  it('triggerCelebration emette solo un evento', () => {
    const p = fresh();
    const r = applyEffect(p, { type: 'triggerCelebration', kind: 'confetti' }, content);
    expect(r.progress).toBe(p);
    expect(r.events).toEqual([{ type: 'celebration', kind: 'confetti' }]);
  });
});
