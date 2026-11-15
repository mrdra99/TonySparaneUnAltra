import { TEST_NPC } from '@/tests/fixtures';
import type { InteractableDefinition } from '@/game/core/types';
import { createRandomStoryPicker, pickRandomIndex, randomStoryToDialogue } from './randomStory';
import {
  createInteractionRegistry,
  findNearestInteractable,
  npcPromptLabel,
  npcToInteractable,
} from './registry';

const item = (id: string, x: number, z: number, extra: Partial<InteractableDefinition> = {}) =>
  ({
    id,
    position: [x, z],
    radius: 2,
    label: id.toUpperCase(),
    action: { type: 'randomStory' },
    ...extra,
  }) satisfies InteractableDefinition;

describe('findNearestInteractable', () => {
  it('null se nessuno e nel raggio', () => {
    expect(findNearestInteractable([item('a', 10, 10)], 0, 0)).toBeNull();
  });
  it('sceglie il piu vicino tra quelli nel raggio', () => {
    const r = findNearestInteractable(
      [item('a', 1.5, 0), item('b', 0.5, 0), item('c', 5, 5)],
      0,
      0,
    );
    expect(r?.id).toBe('b');
  });
  it('rispetta il raggio individuale', () => {
    expect(findNearestInteractable([item('a', 3, 0, { radius: 3.5 })], 0, 0)?.id).toBe('a');
    expect(findNearestInteractable([item('a', 3, 0, { radius: 2.9 })], 0, 0)).toBeNull();
  });
  it('a pari distanza vince la priorita', () => {
    const r = findNearestInteractable([item('a', 1, 0), item('b', 0, 1, { priority: 5 })], 0, 0);
    expect(r?.id).toBe('b');
  });
  it('include gli interagibili disabilitati (per il feedback)', () => {
    expect(findNearestInteractable([item('a', 1, 0, { enabled: false })], 0, 0)?.id).toBe('a');
  });
});

describe('interactionRegistry', () => {
  it('register / get / findNearest / unregister', () => {
    const reg = createInteractionRegistry();
    const off = reg.register(item('a', 1, 0));
    expect(reg.get('a')?.id).toBe('a');
    expect(reg.findNearest(0, 0)?.id).toBe('a');
    off();
    expect(reg.get('a')).toBeUndefined();
    expect(reg.findNearest(0, 0)).toBeNull();
  });
  it('il cleanup di una vecchia registrazione non rimuove quella nuova', () => {
    const reg = createInteractionRegistry();
    const off1 = reg.register(item('a', 1, 0));
    reg.register(item('a', 2, 0));
    off1();
    expect(reg.get('a')?.position).toEqual([2, 0]);
  });
  it('setEnabled aggiorna lo stato', () => {
    const reg = createInteractionRegistry();
    reg.register(item('a', 1, 0));
    reg.setEnabled('a', false);
    expect(reg.get('a')?.enabled).toBe(false);
    reg.setEnabled('a', true);
    expect(reg.get('a')?.enabled).toBe(true);
  });
  it('npcToInteractable genera il prompt PARLA CON', () => {
    const i = npcToInteractable(TEST_NPC);
    expect(i?.id).toBe('npc:luca');
    expect(i?.label).toBe('PARLA CON LUCA');
    expect(npcPromptLabel('Marco')).toBe('PARLA CON MARCO');
    expect(npcToInteractable({ ...TEST_NPC, dialogueId: undefined })).toBeNull();
  });
});

describe('random stories', () => {
  it('non ripete immediatamente (history)', () => {
    let seed = 1;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const recent: number[] = [];
    let prev = -1;
    for (let i = 0; i < 200; i++) {
      const idx = pickRandomIndex(5, recent, rng);
      expect(idx).not.toBe(prev);
      expect(recent.slice(-4)).not.toContain(idx);
      recent.push(idx);
      prev = idx;
    }
  });
  it('con una sola frase la restituisce sempre; con 0 restituisce -1', () => {
    expect(pickRandomIndex(1, [0], Math.random)).toBe(0);
    expect(pickRandomIndex(0, [], Math.random)).toBe(-1);
  });
  it('con 2 frasi alterna', () => {
    const picker = createRandomStoryPicker(() => 0);
    const stories = [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ];
    const seq = [0, 1, 2, 3].map(() => picker.next(stories)?.id);
    expect(seq).toEqual(['a', 'b', 'a', 'b']);
    expect(picker.next([])).toBeNull();
  });
  it('randomStoryToDialogue crea un dialogo transitorio one-shot', () => {
    const d = randomStoryToDialogue({ id: 'x1', text: 'Frase' });
    expect(d.id).toBe('random:x1');
    expect(d.nodes['n']?.effects).toEqual([
      { type: 'addCazzate', amount: 3, reason: "Sparane un'altra", onceId: 'random:x1' },
    ]);
  });
});
