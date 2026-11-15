import { content } from '@/data';
import { newGameProgress, playDialogueId } from './simulate';
import { computeMarkerTargets } from './markers';
import { effectiveInteractables } from '@/game/systems/interactableOverrides';
import { INTERACTABLE_OVERRIDES } from '@/data/interactables';

const targets = (p: ReturnType<typeof newGameProgress>) =>
  computeMarkerTargets(p, content, effectiveInteractables(content, p, INTERACTABLE_OVERRIDES));

describe('indicatori di missione', () => {
  it('a inizio partita segnala i tre NPC della missione 1', () => {
    const ids = targets(newGameProgress(content)).map((t) => t.id);
    expect(ids).toEqual(expect.arrayContaining(['npc:marco', 'npc:luca', 'npc:giulia']));
  });

  it('toglie l indicatore dopo aver parlato con l NPC', () => {
    const p = playDialogueId(content, 'marco-ieri', newGameProgress(content)).progress;
    const ids = targets(p).map((t) => t.id);
    expect(ids).not.toContain('npc:marco');
    expect(ids).toContain('npc:luca');
  });

  it('nessun indicatore se non c e nessuna missione attiva', () => {
    expect(targets({ ...newGameProgress(content), missions: {} })).toEqual([]);
  });
});
