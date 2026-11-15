import { applyEffects } from '@/game/progression/effects';
import { createInitialProgress } from '@/game/progression/progress';
import { DIALOGUE_END, type Dialogue } from '@/game/core/types';
import { TEST_DIALOGUE, makeTestContent } from '@/tests/fixtures';
import {
  IDLE_DIALOGUE,
  advanceDialogue,
  chooseDialogue,
  closeDialogue,
  evaluateCondition,
  startDialogue,
  validateDialogue,
} from './engine';

const progress = () => createInitialProgress(1);

describe('dialogue engine', () => {
  it('start entra nel nodo iniziale in stato active', () => {
    const step = startDialogue(TEST_DIALOGUE, progress());
    expect(step.state.status).toBe('active');
    if (step.state.status === 'active') expect(step.state.line.text).toBe('Ciao Tony!');
    expect(step.effects).toEqual([]);
  });

  it('advance porta a un nodo con scelte (stato choice) filtrando le scelte con requires', () => {
    const p = progress();
    const s1 = startDialogue(TEST_DIALOGUE, p);
    const s2 = advanceDialogue(TEST_DIALOGUE, s1.state, p);
    expect(s2.state.status).toBe('choice');
    if (s2.state.status === 'choice') {
      expect(s2.state.choices.map((c) => c.text)).toEqual(['Niente.', 'Una storia assurda.']);
    }
  });

  it('con il flag la scelta condizionale compare', () => {
    const p = { ...progress(), flags: ['secret'] };
    const s = advanceDialogue(TEST_DIALOGUE, startDialogue(TEST_DIALOGUE, p).state, p);
    expect(s.state.status === 'choice' && s.state.choices).toHaveLength(3);
  });

  it('choose applica gli effetti della scelta e va in consequence', () => {
    const p = progress();
    const choice = advanceDialogue(TEST_DIALOGUE, startDialogue(TEST_DIALOGUE, p).state, p);
    const step = chooseDialogue(TEST_DIALOGUE, choice.state, 1, p);
    expect(step.state.status).toBe('consequence');
    expect(step.effects).toEqual([
      { type: 'addCazzate', amount: 10, reason: 'Storia improbabile' },
    ]);
    if (step.state.status === 'consequence') {
      expect(step.state.choiceText).toBe('Una storia assurda.');
      expect(step.state.line.text).toBe('Impossibile!');
    }
  });

  it('choose con indice fuori range o stato errato e un no-op', () => {
    const p = progress();
    const choice = advanceDialogue(TEST_DIALOGUE, startDialogue(TEST_DIALOGUE, p).state, p);
    expect(chooseDialogue(TEST_DIALOGUE, choice.state, 9, p).state).toBe(choice.state);
    const active = startDialogue(TEST_DIALOGUE, p);
    expect(chooseDialogue(TEST_DIALOGUE, active.state, 0, p).state).toBe(active.state);
  });

  it('percorso completo: gli effetti del nodo finale arrivano e il dialogo termina completato', () => {
    const content = makeTestContent();
    let p = progress();
    let step = startDialogue(TEST_DIALOGUE, p);
    step = advanceDialogue(TEST_DIALOGUE, step.state, p); // choice
    step = chooseDialogue(TEST_DIALOGUE, step.state, 0, p); // consequence r1
    expect(step.state.status).toBe('consequence');
    step = advanceDialogue(TEST_DIALOGUE, step.state, p); // end node
    expect(step.state.status).toBe('active');
    expect(step.effects).toEqual([
      { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
    ]);
    p = applyEffects(p, step.effects, content).progress;
    expect(p.missions['m1']?.completedObjectives).toEqual(['o1']);
    step = advanceDialogue(TEST_DIALOGUE, step.state, p);
    expect(step.state).toEqual({ status: 'ended', dialogueId: 'luca-talk', completed: true });
  });

  it('close chiude a meta come non completato; da idle e un no-op', () => {
    const p = progress();
    const s = startDialogue(TEST_DIALOGUE, p);
    expect(closeDialogue(s.state).state).toEqual({
      status: 'ended',
      dialogueId: 'luca-talk',
      completed: false,
    });
    expect(closeDialogue(IDLE_DIALOGUE).state).toBe(IDLE_DIALOGUE);
  });

  it('advance da idle/ended/choice non fa nulla', () => {
    const p = progress();
    expect(advanceDialogue(TEST_DIALOGUE, IDLE_DIALOGUE, p).state).toBe(IDLE_DIALOGUE);
    const choice = advanceDialogue(TEST_DIALOGUE, startDialogue(TEST_DIALOGUE, p).state, p);
    expect(advanceDialogue(TEST_DIALOGUE, choice.state, p).state).toBe(choice.state);
  });

  it('dialogo completato si riapre da repeatStart (nessun blocco)', () => {
    const p = { ...progress(), completedDialogues: ['luca-talk'] };
    const s = startDialogue(TEST_DIALOGUE, p);
    expect(s.state.status === 'active' && s.state.line.text).toBe('Ancora tu?');
    // il nodo 'again' non ha next: advance termina
    expect(advanceDialogue(TEST_DIALOGUE, s.state, p).state).toMatchObject({
      status: 'ended',
      completed: true,
    });
  });

  it('nodo con requires non soddisfatto usa fallback, altrimenti termina', () => {
    const d: Dialogue = {
      id: 'd',
      start: 'gate',
      nodes: {
        gate: {
          id: 'gate',
          speaker: 'x',
          text: 'solo con flag',
          requires: [{ type: 'flag', flag: 'f' }],
          fallback: 'alt',
        },
        alt: { id: 'alt', speaker: 'x', text: 'alternativa', next: DIALOGUE_END },
        nofb: { id: 'nofb', speaker: 'x', text: '?', requires: [{ type: 'flag', flag: 'f' }] },
      },
    };
    const s = startDialogue(d, progress());
    expect(s.state.status === 'active' && s.state.nodeId).toBe('alt');
    const s2 = startDialogue({ ...d, start: 'nofb' }, progress());
    expect(s2.state).toEqual({ status: 'ended', dialogueId: 'd', completed: false });
    const withFlag = startDialogue(d, { ...progress(), flags: ['f'] });
    expect(withFlag.state.status === 'active' && withFlag.state.nodeId).toBe('gate');
  });

  it('protegge da cicli di fallback e nodi mancanti', () => {
    const loop: Dialogue = {
      id: 'loop',
      start: 'a',
      nodes: {
        a: {
          id: 'a',
          speaker: 'x',
          text: '',
          requires: [{ type: 'flag', flag: 'no' }],
          fallback: 'b',
        },
        b: {
          id: 'b',
          speaker: 'x',
          text: '',
          requires: [{ type: 'flag', flag: 'no' }],
          fallback: 'a',
        },
      },
    };
    expect(startDialogue(loop, progress()).state.status).toBe('ended');
    const broken: Dialogue = { id: 'b', start: 'zzz', nodes: {} };
    expect(startDialogue(broken, progress()).state).toMatchObject({
      status: 'ended',
      completed: false,
    });
  });

  it('se tutte le scelte sono nascoste il nodo si comporta come una battuta normale', () => {
    const d: Dialogue = {
      id: 'd',
      start: 'a',
      nodes: {
        a: {
          id: 'a',
          speaker: 'x',
          text: 't',
          choices: [{ text: 'x', next: 'b', requires: [{ type: 'flag', flag: 'no' }] }],
          next: 'b',
        },
        b: { id: 'b', speaker: 'x', text: 'b' },
      },
    };
    expect(startDialogue(d, progress()).state.status).toBe('active');
  });

  it('evaluateCondition copre tutte le condizioni', () => {
    const p = applyEffects(
      progress(),
      [
        { type: 'setFlag', flag: 'f' },
        { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
        { type: 'addCazzate', amount: 30, reason: 'x' },
      ],
      makeTestContent(),
    ).progress;
    const p2 = { ...p, completedDialogues: ['d1'] };
    expect(evaluateCondition({ type: 'flag', flag: 'f' }, p2)).toBe(true);
    expect(evaluateCondition({ type: 'notFlag', flag: 'f' }, p2)).toBe(false);
    expect(
      evaluateCondition({ type: 'objectiveCompleted', missionId: 'm1', objectiveId: 'o1' }, p2),
    ).toBe(true);
    expect(
      evaluateCondition({ type: 'objectiveNotCompleted', missionId: 'm1', objectiveId: 'o2' }, p2),
    ).toBe(true);
    expect(evaluateCondition({ type: 'missionActive', missionId: 'm1' }, p2)).toBe(true);
    expect(evaluateCondition({ type: 'missionCompleted', missionId: 'm1' }, p2)).toBe(false);
    expect(evaluateCondition({ type: 'minCazzate', value: 30 }, p2)).toBe(true);
    expect(evaluateCondition({ type: 'minCazzate', value: 31 }, p2)).toBe(false);
    expect(evaluateCondition({ type: 'dialogueCompleted', dialogueId: 'd1' }, p2)).toBe(true);
  });
});

describe('validateDialogue', () => {
  it('accetta un dialogo valido', () => {
    expect(validateDialogue(TEST_DIALOGUE)).toEqual([]);
  });
  it('segnala riferimenti inesistenti e nodi irraggiungibili', () => {
    const bad: Dialogue = {
      id: 'bad',
      start: 'a',
      nodes: {
        a: { id: 'a', speaker: 'x', text: '', next: 'nope' },
        orphan: { id: 'orphan', speaker: 'x', text: '' },
      },
    };
    const problems = validateDialogue(bad);
    expect(problems.some((p) => p.includes("next 'nope'"))).toBe(true);
    expect(problems.some((p) => p.includes('non raggiungibile'))).toBe(true);
  });
});
