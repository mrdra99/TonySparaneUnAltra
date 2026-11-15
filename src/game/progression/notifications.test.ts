import { makeTestContent } from '@/tests/fixtures';
import { eventToNotification, eventToSfx } from './notifications';

const content = makeTestContent();

describe('eventToNotification', () => {
  it('cazzate', () => {
    expect(
      eventToNotification({ type: 'cazzateIncreased', amount: 5, total: 5, reason: 'x' }, content),
    ).toMatchObject({ kind: 'cazzate', title: '+5 CAZZATOMETRO', points: 5 });
  });
  it('soglia: titolo = messaggio esatto', () => {
    expect(
      eventToNotification(
        { type: 'thresholdReached', threshold: 50, message: 'La piazza inizia a dubitare.' },
        content,
      )?.title,
    ).toBe('La piazza inizia a dubitare.');
  });
  it('missione, obiettivo, achievement e storia usano i dati del catalogo', () => {
    expect(
      eventToNotification(
        { type: 'missionCompleted', missionId: 'm1', reward: { cazzate: 15 } },
        content,
      ),
    ).toMatchObject({ kind: 'mission', body: 'PRIMA', points: 15 });
    expect(
      eventToNotification(
        { type: 'objectiveCompleted', missionId: 'm1', objectiveId: 'o1', completed: 1, total: 2 },
        content,
      )?.title,
    ).toBe('1/2 Parla con Luca');
    expect(
      eventToNotification(
        { type: 'achievementUnlocked', achievementId: 'a1', points: 25 },
        content,
      ),
    ).toMatchObject({ kind: 'achievement', icon: 'Trophy', points: 25 });
    expect(
      eventToNotification({ type: 'storyUnlocked', storyId: 's1', points: 50 }, content)?.body,
    ).toBe('Storia 1');
  });
  it('celebration non genera toast; id sconosciuti non crashano', () => {
    expect(eventToNotification({ type: 'celebration', kind: 'confetti' }, content)).toBeNull();
    expect(eventToNotification({ type: 'missionStarted', missionId: 'zz' }, content)).toBeNull();
    expect(
      eventToNotification({ type: 'achievementUnlocked', achievementId: 'zz', points: 1 }, content),
    ).not.toBeNull();
  });
});

describe('eventToSfx', () => {
  it('mappa gli eventi principali', () => {
    expect(eventToSfx({ type: 'missionCompleted', missionId: 'm', reward: { cazzate: 1 } })).toBe(
      'missionComplete',
    );
    expect(eventToSfx({ type: 'celebration', kind: 'finale' })).toBe('finale');
    expect(eventToSfx({ type: 'celebration', kind: 'confetti' })).toBeNull();
    expect(eventToSfx({ type: 'missionStarted', missionId: 'm' })).toBeNull();
  });
});
