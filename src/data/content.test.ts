import { content } from '@/data';
import { validateContent } from '@/game/core/content';

/**
 * Guardia di coerenza dei dati reali (src/data/**): riferimenti incrociati, dialoghi validi.
 * Se Gameplay aggiunge dati incoerenti questo test fallisce.
 */
describe('contenuti di gioco', () => {
  it('non hanno problemi di coerenza', () => {
    expect(validateContent(content)).toEqual([]);
  });
  it('hanno almeno una missione, un npc e un dialogo', () => {
    expect(content.missionOrder.length).toBeGreaterThan(0);
    expect(content.npcs.length).toBeGreaterThan(0);
    expect(Object.keys(content.dialogues).length).toBeGreaterThan(0);
  });
  it('ogni missione ha obiettivi raggiungibili da qualche effetto o azione', () => {
    const reachable = new Set<string>();
    const collect = (
      effects: readonly { type: string; missionId?: string; objectiveId?: string }[] = [],
    ) =>
      effects.forEach((e) => {
        if (e.type === 'completeObjective') reachable.add(`${e.missionId}/${e.objectiveId}`);
      });
    for (const d of Object.values(content.dialogues)) {
      for (const n of Object.values(d.nodes)) {
        collect(n.effects);
        n.choices?.forEach((c) => collect(c.effects));
      }
    }
    for (const it of content.interactables) {
      if (it.action.type === 'mission' && it.action.objectiveId) {
        reachable.add(`${it.action.missionId}/${it.action.objectiveId}`);
      }
      if (it.action.type === 'collectible') collect(it.action.effects);
    }
    const unreachable = Object.values(content.missions).flatMap((m) =>
      m.objectives.filter((o) => !reachable.has(`${m.id}/${o.id}`)).map((o) => `${m.id}/${o.id}`),
    );
    expect(unreachable).toEqual([]);
  });
});
