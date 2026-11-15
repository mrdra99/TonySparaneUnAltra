import { content } from '@/data';
import {
  newGameProgress,
  pickFirst,
  pickLast,
  pickSource,
  playDialogueId,
  type ChoicePicker,
} from '@/game/quests/simulate';
import { credibilityDelta, debtVerdict } from '@/data/dialogues/m3';

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

describe('missione 2 - Il biglietto del treno', () => {
  const afterM1 = () => {
    let p = newGameProgress(content);
    for (const id of ['marco-ieri', 'luca-cinque-euro', 'giulia-favori']) {
      p = playDialogueId(content, id, p).progress;
    }
    return p;
  };

  it('parte quando si completa la missione 1', () => {
    expect(afterM1().missions['biglietto-treno']?.status).toBe('active');
  });

  it.each([0, 1, 2])('e completabile con la scelta %i', (i) => {
    const r = playDialogueId(content, 'gianni-biglietto', afterM1(), pickSource(i));
    expect(r.progress.missions['biglietto-treno']?.status).toBe('completed');
    expect(r.progress.unlockedAchievements).toContain('pendolare-internazionale');
    expect(r.progress.missions['debito-leggendario']?.status).toBe('active');
  });

  it('la terza scelta (missione riservata) da piu Cazzatometro', () => {
    const base = afterM1();
    const gain = (i: number) =>
      playDialogueId(content, 'gianni-biglietto', base, pickSource(i)).progress.cazzate -
      base.cazzate;
    expect(gain(2)).toBeGreaterThan(gain(0));
    expect(gain(2)).toBeGreaterThan(gain(1));
  });
});

describe('missione 3 - Il debito leggendario', () => {
  const styles = ['A', 'B', 'C'] as const;
  const idx = { A: 0, B: 1, C: 2 } as const;

  it('credibilita: coerenza premia, contraddizione punisce, B<->C neutro', () => {
    expect(credibilityDelta('A', 'A')).toBe(1);
    expect(credibilityDelta('A', 'C')).toBe(-1);
    expect(credibilityDelta('C', 'A')).toBe(-1);
    expect(credibilityDelta('B', 'C')).toBe(0);
  });

  it('tutte le 27 combinazioni di scuse completano la missione e danno 3-6 Cazzatometro', () => {
    const verdicts = new Set<string>();
    for (const s1 of styles) {
      for (const s2 of styles) {
        for (const s3 of styles) {
          const seq = [idx[s1], idx[s2], idx[s3]];
          let call = 0;
          const pick: ChoicePicker = (choices) => {
            const want = seq[call++] ?? 0;
            return choices.findIndex((c) => c.sourceIndex === want);
          };
          const start = newGameProgress(content);
          const r = playDialogueId(content, 'bogdan-debito', start, pick);
          expect(r.completed).toBe(true);
          expect(r.progress.missions['debito-leggendario']?.status).toBe('completed');
          expect(r.progress.unlockedAchievements).toContain('finanza-creativa');
          const verdict = debtVerdict(s1, s2, s3);
          expect(r.progress.flags).toContain(`bogdan.${verdict}`);
          verdicts.add(verdict);
          const gained = r.progress.cazzate - 15 - start.cazzate;
          expect(gained).toBeGreaterThanOrEqual(3);
          expect(gained).toBeLessThanOrEqual(6);
        }
      }
    }
    expect([...verdicts].sort()).toEqual(['draw', 'lose', 'win']);
  });

  it('le reazioni di Bogdan cambiano con le scelte', () => {
    const texts = new Set<string>();
    for (const first of [0, 1, 2]) {
      let call = 0;
      const pick: ChoicePicker = (choices) => {
        const want = call++ === 0 ? first : 0;
        return choices.findIndex((c) => c.sourceIndex === want);
      };
      const r = playDialogueId(content, 'bogdan-debito', newGameProgress(content), pick);
      texts.add(r.lines[2] ?? '');
    }
    expect(texts.size).toBe(3);
  });

  it('la riapertura dipende dall esito e non regala Cazzatometro', () => {
    const first = playDialogueId(content, 'bogdan-debito', newGameProgress(content), pickFirst);
    const again = playDialogueId(content, 'bogdan-debito', first.progress);
    expect(again.completed).toBe(true);
    expect(again.progress.cazzate).toBe(first.progress.cazzate);
    expect(again.lines).toHaveLength(1);
  });
});
