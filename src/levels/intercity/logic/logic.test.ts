import { createInitialProgress } from '@/game/progression/progress';
import { FINALE_MISSION_ID, FLAGS, FLASHBACK_STAGES } from './ids';
import {
  COLLETTA_PEOPLE,
  COUNTDOWN_START_SEC,
  TAXI_FARE_EUR,
  advanceStage,
  canBogdanCoverTony,
  collettaState,
  formatCountdown,
  formatEuro,
  initialCountdown,
  isFinaleUnlocked,
  isStageComplete,
  nextStage,
  patienceFromFlags,
  stepCountdown,
  stripSessionFlags,
} from './rules';
import { KO_TIMELINE, collapseProgress, koStageAt, wobbleAmount } from './ko';
import { CARD_MS, FADE_MS, SKIP_LOCK_MS, cardEnd, transitionStageAt } from './transition';

describe('sblocco del racconto', () => {
  const order = ['a', 'b', FINALE_MISSION_ID];
  const done = { status: 'completed', completedObjectives: [] } as const;

  it('serve aver completato tutte le missioni tranne il finale', () => {
    expect(isFinaleUnlocked(createInitialProgress(), order)).toBe(false);
    expect(isFinaleUnlocked({ missions: { a: done } }, order)).toBe(false);
    expect(isFinaleUnlocked({ missions: { a: done, b: done } }, order)).toBe(true);
  });
  it('una missione solo attiva non basta e il finale stesso non conta', () => {
    const active = { status: 'active', completedObjectives: [] } as const;
    expect(isFinaleUnlocked({ missions: { a: done, b: active } }, order)).toBe(false);
    expect(isFinaleUnlocked({ missions: {} }, [FINALE_MISSION_ID])).toBe(false);
  });
  it('stripSessionFlags toglie solo i flag di sessione', () => {
    const flags = ['x', FLAGS.loan, FLAGS.ko, FLAGS.colNico];
    expect(stripSessionFlags(flags)).toEqual(['x', FLAGS.ko]);
    const clean = ['x'];
    expect(stripSessionFlags(clean)).toBe(clean);
  });
});

describe('pazienza di Bogdan', () => {
  it('100 -> 60 -> 20 -> 0', () => {
    expect(patienceFromFlags([])).toBe(100);
    expect(patienceFromFlags([FLAGS.loan])).toBe(60);
    expect(patienceFromFlags([FLAGS.loan, FLAGS.colBogdan])).toBe(20);
    expect(patienceFromFlags([FLAGS.loan, FLAGS.colBogdan, FLAGS.ninna])).toBe(0);
  });
  it('la ninna kanna azzera la pazienza in qualunque momento', () => {
    expect(patienceFromFlags([FLAGS.ninna])).toBe(0);
  });
  it('gli amici che pagano la loro quota non consumano pazienza', () => {
    expect(patienceFromFlags([FLAGS.colNico, FLAGS.colVale, FLAGS.colRicky])).toBe(100);
  });
});

describe('colletta alla romana', () => {
  it('parte vuota: Tony e a 0, nessuno ha pagato', () => {
    const c = collettaState([]);
    expect(c.collected).toBe(0);
    expect(c.complete).toBe(false);
    expect(c.tonyPaid).toBe(0);
    expect(c.rows.find((r) => r.id === 'tony')?.amount).toBe(0);
    expect(c.rows.filter((r) => r.amount === null)).toHaveLength(4);
  });
  it('gli amici versano la loro quota, ma il taxi si paga solo con Bogdan', () => {
    const c = collettaState([FLAGS.colNico, FLAGS.colVale, FLAGS.colRicky]);
    expect(c.friendsPaid).toBe(3);
    expect(c.collected).toBe((TAXI_FARE_EUR / COLLETTA_PEOPLE) * 3);
    expect(c.complete).toBe(false);
  });
  it('con Bogdan che copre la quota di Tony il totale e esattamente la tariffa', () => {
    const c = collettaState([FLAGS.colNico, FLAGS.colVale, FLAGS.colRicky, FLAGS.colBogdan]);
    expect(c.collected).toBe(TAXI_FARE_EUR);
    expect(c.complete).toBe(true);
    expect(c.tonyPaid).toBe(0);
    expect(c.rows.find((r) => r.id === 'bogdan')?.amount).toBe(14);
  });
  it('Bogdan copre Tony solo dopo i tre tentativi', () => {
    expect(canBogdanCoverTony([FLAGS.colNico, FLAGS.colVale])).toBe(false);
    expect(canBogdanCoverTony([FLAGS.colNico, FLAGS.colVale, FLAGS.colRicky])).toBe(true);
  });
  it('formatta gli euro all italiana', () => {
    expect(formatEuro(0)).toBe('0,00 €');
    expect(formatEuro(7.5)).toBe('7,50 €');
  });
});

describe('countdown', () => {
  it('scende e non scade prima del tempo', () => {
    const r = stepCountdown(initialCountdown(), 10);
    expect(r.expired).toBe(false);
    expect(r.countdown.sec).toBe(COUNTDOWN_START_SEC - 10);
  });
  it('allo scadere conta un ritardo e riparte, senza mai bloccarsi', () => {
    let c = initialCountdown();
    for (let i = 0; i < 3; i++) {
      const r = stepCountdown(c, COUNTDOWN_START_SEC);
      expect(r.expired).toBe(true);
      expect(r.countdown.sec).toBe(COUNTDOWN_START_SEC);
      c = r.countdown;
    }
    expect(c.delays).toBe(3);
  });
  it('formatta m:ss', () => {
    expect(formatCountdown(90)).toBe('1:30');
    expect(formatCountdown(5.2)).toBe('0:06');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});

describe('macchina a stati delle tappe', () => {
  it('Pisa -> Viareggio -> Torre -> K.O.', () => {
    expect(FLASHBACK_STAGES).toEqual(['intercity-pisa', 'intercity-viareggio', 'intercity-torre']);
    expect(nextStage('intercity-pisa')).toBe('intercity-viareggio');
    expect(nextStage('intercity-viareggio')).toBe('intercity-torre');
    expect(nextStage('intercity-torre')).toBeNull();
    expect(nextStage('piazza')).toBeNull();
  });
  it('attende finche la tappa non e chiusa dal suo flag', () => {
    expect(advanceStage('intercity-pisa', [FLAGS.loan])).toEqual({ kind: 'wait' });
    expect(advanceStage('intercity-pisa', [FLAGS.pisaBoarded])).toEqual({
      kind: 'transition',
      to: 'intercity-viareggio',
    });
    expect(advanceStage('intercity-viareggio', [FLAGS.taxiBoarded])).toEqual({
      kind: 'transition',
      to: 'intercity-torre',
    });
  });
  it('l ultima tappa chiude con il K.O. tecnico; la piazza non avanza mai', () => {
    expect(advanceStage('intercity-torre', [FLAGS.ninna])).toEqual({ kind: 'ko' });
    expect(advanceStage('piazza', Object.values(FLAGS))).toEqual({ kind: 'wait' });
    expect(isStageComplete('piazza', [FLAGS.ninna])).toBe(false);
  });
  it('i flag di una tappa non chiudono le altre', () => {
    expect(isStageComplete('intercity-viareggio', [FLAGS.pisaBoarded])).toBe(false);
    expect(isStageComplete('intercity-torre', [FLAGS.taxiBoarded])).toBe(false);
  });
});

describe('timeline del K.O.', () => {
  it('le fasi si susseguono: campanella, caduta, 1-2-3, scritta, fine', () => {
    expect(koStageAt(0)).toBe('bell');
    expect(koStageAt(KO_TIMELINE.collapse)).toBe('collapse');
    expect(koStageAt(KO_TIMELINE.count1)).toBe('count1');
    expect(koStageAt(KO_TIMELINE.count2)).toBe('count2');
    expect(koStageAt(KO_TIMELINE.count3)).toBe('count3');
    expect(koStageAt(KO_TIMELINE.banner + 1)).toBe('banner');
    expect(koStageAt(KO_TIMELINE.done)).toBe('done');
  });
  it('i tempi sono crescenti', () => {
    const t = Object.values(KO_TIMELINE);
    expect([...t].sort((a, b) => a - b)).toEqual(t);
  });
  it('la caduta parte dopo il campanello e arriva a 1 senza tornare indietro', () => {
    expect(collapseProgress(0)).toBe(0);
    expect(collapseProgress(KO_TIMELINE.collapse)).toBe(0);
    let prev = 0;
    for (let t = KO_TIMELINE.collapse; t <= KO_TIMELINE.count1; t += 100) {
      const p = collapseProgress(t);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
    expect(collapseProgress(KO_TIMELINE.count1)).toBe(1);
  });
  it('barcolla prima di cadere e poi smette', () => {
    expect(wobbleAmount(0)).toBe(0);
    expect(wobbleAmount(KO_TIMELINE.collapse / 2)).toBeGreaterThan(0);
    expect(wobbleAmount(KO_TIMELINE.collapse)).toBe(0);
  });
});

describe('cartolina fra le tappe', () => {
  it('dissolvenza, cartolina, dissolvenza, fine', () => {
    expect(transitionStageAt(0, null)).toBe('fadeOut');
    expect(transitionStageAt(FADE_MS + 10, null)).toBe('card');
    expect(transitionStageAt(FADE_MS + CARD_MS + 10, null)).toBe('fadeIn');
    expect(transitionStageAt(FADE_MS * 2 + CARD_MS + 10, null)).toBe('done');
  });
  it('lo skip anticipa la fine ma non subito (anti doppio tocco)', () => {
    expect(cardEnd(null)).toBe(FADE_MS + CARD_MS);
    expect(cardEnd(FADE_MS + 100)).toBe(FADE_MS + SKIP_LOCK_MS);
    expect(cardEnd(FADE_MS + 1500)).toBe(FADE_MS + 1500);
    expect(cardEnd(FADE_MS + CARD_MS + 5000)).toBe(FADE_MS + CARD_MS);
    expect(transitionStageAt(FADE_MS + 1600, FADE_MS + 1500)).toBe('fadeIn');
  });
});
