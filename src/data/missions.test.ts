import { content } from '@/data';
import { newGameProgress, pickLast, playDialogueId, pickFirst } from '@/game/quests/simulate';

describe('missione 1 - La ninna canna', () => {
  const dialogues = ['marco-ieri', 'luca-cinque-euro', 'giulia-favori'];

  it.each([
    ['prima scelta', pickFirst],
    ['ultima scelta', pickLast],
  ])('e completabile dall inizio alla fine (%s)', (_name, pick) => {
    let p = newGameProgress(content);
    expect(p.missions['ninna-canna']?.status).toBe('active');
    for (const id of dialogues) {
      p = playDialogueId(content, id, p, pick).progress;
    }
    expect(p.missions['ninna-canna']?.status).toBe('completed');
    expect(p.unlockedAchievements).toContain('la-ninna-canna');
    expect(p.unlockedStories).toContain('story-ninna-canna');
    expect(p.unlockedStories).toContain('story-registro-debiti');
    expect(p.cazzate).toBeGreaterThanOrEqual(15 + 3);
  });

  it('i dialoghi sono ripetibili e senza farming', () => {
    let p = newGameProgress(content);
    for (const id of dialogues) p = playDialogueId(content, id, p).progress;
    const before = p.cazzate;
    for (const id of dialogues) {
      const r = playDialogueId(content, id, p);
      expect(r.completed).toBe(true);
      p = r.progress;
    }
    expect(p.cazzate).toBe(before);
  });

  it('l ordine dei tre NPC e libero', () => {
    let p = newGameProgress(content);
    for (const id of [...dialogues].reverse()) p = playDialogueId(content, id, p).progress;
    expect(p.missions['ninna-canna']?.status).toBe('completed');
  });

  it('usa le battute esatte del prompt', () => {
    const marco = playDialogueId(content, 'marco-ieri', newGameProgress(content));
    expect(marco.lines).toContain('Tony, ma quella di ieri?');
    expect(marco.lines[0]).toBe('Oh fraaaa, mi lasci una cannetta per la ninna canna?');
    const luca = playDialogueId(content, 'luca-cinque-euro', newGameProgress(content));
    expect(luca.lines).toContain('Ma non dovevi darmi cinque euro?');
    const giulia = playDialogueId(content, 'giulia-favori', newGameProgress(content));
    expect(giulia.lines).toContain('Ma quanti favori devi ancora restituire?');
  });
});
