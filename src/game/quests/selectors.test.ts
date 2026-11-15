import { applyEffects } from '@/game/progression/effects';
import { createInitialProgress } from '@/game/progression/progress';
import { makeTestContent } from '@/tests/fixtures';
import {
  areAllMissionsCompleted,
  getCurrentMission,
  listMissions,
  summarizeMission,
} from './selectors';

const content = makeTestContent();

describe('mission selectors', () => {
  it('nessuna missione attiva -> null', () => {
    expect(getCurrentMission(createInitialProgress(), content)).toBeNull();
  });
  it('la missione corrente e la prima attiva per order, con conteggio obiettivi', () => {
    const p = applyEffects(
      createInitialProgress(),
      [
        { type: 'startMission', missionId: 'm2' },
        { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
      ],
      content,
    ).progress;
    const cur = getCurrentMission(p, content);
    expect(cur?.mission.id).toBe('m1');
    expect(cur).toMatchObject({
      completed: 1,
      total: 2,
      label: 'Parla con altri',
      nextObjectiveId: 'o2',
    });
  });
  it('hudLabel ha precedenza', () => {
    const m = { ...content.missions['m1']!, hudLabel: 'Parla con gli amici' };
    expect(summarizeMission(m, createInitialProgress()).label).toBe('Parla con gli amici');
  });
  it('listMissions riporta locked/active/completed e areAllMissionsCompleted', () => {
    let p = applyEffects(
      createInitialProgress(),
      [{ type: 'startMission', missionId: 'm1' }],
      content,
    ).progress;
    expect(listMissions(p, content).map((m) => m.status)).toEqual(['active', 'locked']);
    expect(areAllMissionsCompleted(p, content)).toBe(false);
    p = applyEffects(
      p,
      [
        { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
        { type: 'completeObjective', missionId: 'm1', objectiveId: 'o2' },
        { type: 'completeObjective', missionId: 'm2', objectiveId: 'o1' },
      ],
      content,
    ).progress;
    expect(areAllMissionsCompleted(p, content)).toBe(true);
  });
});
