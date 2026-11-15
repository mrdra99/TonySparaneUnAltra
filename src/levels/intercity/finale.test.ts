// Completabilita' del livello simulando le scelte col motore dialoghi reale e i dati reali.
import { content } from '@/data';
import { validateContent } from '@/game/core/content';
import type { PlayerProgress } from '@/game/core/types';
import { evaluateConditions } from '@/game/dialogue/engine';
import { newGameProgress, pickFirst, pickLast, playDialogueId } from '@/game/quests/simulate';
import type { ChoicePicker } from '@/game/quests/simulate';
import { PRE_FINALE_CAP } from '@/game/progression/cazzatometro';
import { FINALE_CHARACTERS, LEVEL_INTERACTABLES, interactablesFor } from './data/cast';
import { FINALE_MISSION_ID, FINALE_OBJECTIVES, FLAGS, SESSION_FLAG_PREFIX } from './logic/ids';
import { advanceStage, collettaState, patienceFromFlags } from './logic/rules';
import { applyEffects } from '@/game/progression/effects';

const play = (id: string, p: PlayerProgress, pick: ChoicePicker = pickFirst) =>
  playDialogueId(content, id, p, pick);

const start = (): PlayerProgress =>
  applyEffects(
    newGameProgress(content),
    [{ type: 'startMission', missionId: FINALE_MISSION_ID }],
    content,
  ).progress;

/** Gioca l'intera notte nell'ordine "giusto" scegliendo con `pick`. */
function playWholeNight(pick: ChoicePicker): PlayerProgress {
  let p = start();
  p = play('finale-pisa-bogdan', p, pick).progress;
  expect(advanceStage('intercity-pisa', p.flags).kind).toBe('wait');
  p = play('finale-pisa-door', p, pick).progress;
  expect(advanceStage('intercity-pisa', p.flags)).toEqual({
    kind: 'transition',
    to: 'intercity-viareggio',
  });
  for (const id of ['finale-nico', 'finale-vale', 'finale-ricky']) {
    p = play(id, p, pick).progress;
  }
  p = play('finale-viareggio-bogdan', p, pick).progress;
  expect(advanceStage('intercity-viareggio', p.flags).kind).toBe('wait');
  p = play('finale-taxi-door', p, pick).progress;
  expect(advanceStage('intercity-viareggio', p.flags).kind).toBe('transition');
  p = play('finale-torre-bogdan', p, pick).progress;
  return p;
}

describe('contenuti del livello', () => {
  it('sono coerenti con il catalogo del gioco', () => {
    expect(validateContent(content)).toEqual([]);
  });
  it('la missione e l ultima in ordine, non autoStart, con ricompensa senza Cazzatometro', () => {
    const m = content.missions[FINALE_MISSION_ID];
    expect(m).toBeDefined();
    expect(content.missionOrder[content.missionOrder.length - 1]).toBe(FINALE_MISSION_ID);
    expect(m?.autoStart).toBeFalsy();
    expect(m?.reward.cazzate).toBe(0);
    expect(m?.objectives.map((o) => o.id)).toEqual(Object.values(FINALE_OBJECTIVES));
  });
  it('ogni interagibile di dialogo punta a un dialogo esistente', () => {
    for (const { def } of LEVEL_INTERACTABLES) {
      if (def.action.type === 'dialogue') {
        expect(content.dialogues[def.action.dialogueId], def.id).toBeDefined();
      }
    }
    for (const c of FINALE_CHARACTERS) {
      if (c.dialogueId) expect(content.dialogues[c.dialogueId], c.id).toBeDefined();
    }
  });
  it('gli id degli interagibili sono unici e non collidono con quelli della piazza', () => {
    const ids = LEVEL_INTERACTABLES.map((i) => i.def.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(content.interactables.some((i) => i.id === id)).toBe(false);
      expect(id.startsWith('finale:')).toBe(true);
    }
  });
  it('ogni tappa ha almeno un interagibile e Bogdan', () => {
    for (const l of ['intercity-pisa', 'intercity-viareggio', 'intercity-torre'] as const) {
      expect(interactablesFor(l).length).toBeGreaterThan(0);
      expect(FINALE_CHARACTERS.some((c) => c.level === l && c.name === 'Bogdan')).toBe(true);
    }
  });
  it('i personaggi stanno nei limiti delle tappe (cinque metri dal bordo)', () => {
    for (const c of FINALE_CHARACTERS) {
      expect(Math.abs(c.position[0])).toBeLessThan(16);
      expect(Math.abs(c.position[1])).toBeLessThan(10);
    }
  });
  it('niente armi o sostanze nei dialoghi del livello', () => {
    const text = Object.values(content.dialogues)
      .filter((d) => d.id.startsWith('finale-'))
      .flatMap((d) =>
        Object.values(d.nodes).flatMap((n) => [n.text, ...(n.choices?.map((c) => c.text) ?? [])]),
      )
      .join(' ')
      .toLowerCase();
    for (const w of ['pistola', 'coltello', 'droga', 'cocaina', 'hashish', 'fumare', 'spinello']) {
      expect(text).not.toContain(w);
    }
  });
});

describe('completabilita del livello (motore dialoghi puro)', () => {
  it.each([
    ['prima scelta', pickFirst],
    ['ultima scelta', pickLast],
  ])('si completa dall inizio alla fine (%s)', (_n, pick) => {
    const p = playWholeNight(pick);
    expect(p.missions[FINALE_MISSION_ID]?.status).toBe('completed');
    expect(p.unlockedAchievements).toContain('ko-tecnico');
    expect(p.unlockedStories).toContain('story-notte-intercity');
    expect(patienceFromFlags(p.flags)).toBe(0);
    expect(advanceStage('intercity-torre', p.flags)).toEqual({ kind: 'ko' });
    // il Cazzatometro non tocca 100 senza il K.O.
    expect(p.cazzate).toBeLessThan(100);
    expect(p.cazzate).toBeLessThanOrEqual(PRE_FINALE_CAP);
  });

  it('la pazienza scende a ogni favore: 100 -> 60 -> 20 -> 0', () => {
    let p = start();
    expect(patienceFromFlags(p.flags)).toBe(100);
    p = play('finale-pisa-bogdan', p).progress;
    expect(patienceFromFlags(p.flags)).toBe(60);
    for (const id of ['finale-nico', 'finale-vale', 'finale-ricky']) p = play(id, p).progress;
    expect(patienceFromFlags(p.flags)).toBe(60);
    p = play('finale-viareggio-bogdan', p).progress;
    expect(patienceFromFlags(p.flags)).toBe(20);
    p = play('finale-torre-bogdan', p).progress;
    expect(patienceFromFlags(p.flags)).toBe(0);
  });

  it('Bogdan di Viareggio non copre Tony finche gli amici non hanno provato', () => {
    let p = start();
    const early = play('finale-viareggio-bogdan', p);
    expect(early.progress.flags).not.toContain(FLAGS.colBogdan);
    p = play('finale-nico', early.progress).progress;
    expect(play('finale-viareggio-bogdan', p).progress.flags).not.toContain(FLAGS.colBogdan);
  });

  it('dopo la colletta la scena non regredisce: la riapertura mostra la battuta breve', () => {
    let p = start();
    for (const id of ['finale-nico', 'finale-vale', 'finale-ricky', 'finale-viareggio-bogdan']) {
      p = play(id, p).progress;
    }
    expect(collettaState(p.flags).complete).toBe(true);
    const again = play('finale-viareggio-bogdan', p);
    expect(again.lines).toEqual(['Quota coperta. Sali sul taxi prima che cambi idea.']);
  });

  it('i dialoghi interrotti a meta non saltano mai la scena alla riapertura', () => {
    // un "wait" (completato) non deve far partire il nodo `again` dei successivi tentativi
    let p = start();
    p = play('finale-viareggio-bogdan', p).progress;
    expect(play('finale-viareggio-bogdan', p).lines[0]).toContain('Prima prova a raccogliere');
  });

  it('niente farming del Cazzatometro ripetendo i dialoghi', () => {
    const p = playWholeNight(pickFirst);
    let q = p;
    for (const id of Object.keys(content.dialogues).filter((d) => d.startsWith('finale-'))) {
      q = play(id, q).progress;
    }
    expect(q.cazzate).toBe(p.cazzate);
  });

  it('i flag di sessione hanno tutti il prefisso giusto (tranne il K.O. permanente)', () => {
    for (const [name, flag] of Object.entries(FLAGS)) {
      if (name === 'ko') expect(flag.startsWith(SESSION_FLAG_PREFIX)).toBe(false);
      else expect(flag.startsWith(SESSION_FLAG_PREFIX)).toBe(true);
    }
  });

  it('le condizioni di sblocco di porta e taxi seguono i flag', () => {
    const door = LEVEL_INTERACTABLES.find((i) => i.def.id === 'finale:pisa-door');
    const taxi = LEVEL_INTERACTABLES.find((i) => i.def.id === 'finale:taxi-door');
    const base = start();
    expect(evaluateConditions(door?.unlockedWhen, base)).toBe(false);
    expect(evaluateConditions(door?.unlockedWhen, play('finale-pisa-bogdan', base).progress)).toBe(
      true,
    );
    expect(evaluateConditions(taxi?.unlockedWhen, base)).toBe(false);
  });
});
