import { content } from '@/data';
import { INTERACTABLE_OVERRIDES } from '@/data/interactables';
import { effectiveInteractables } from '@/game/systems/interactableOverrides';
import { newGameProgress, extremeOutcome, playDialogueId } from '@/game/quests/simulate';
import { getCurrentMission } from '@/game/quests/selectors';
import { FINALE_MISSION_ID } from '@/levels/intercity/logic/ids';

/** Missioni principali: tutte tranne il livello finale (La notte dell'Intercity), che ha un test suo. */
const MAIN_MISSIONS = content.missionOrder.filter((id) => id !== FINALE_MISSION_ID);

/** Ordine di una partita "lineare" completa (le missioni si avviano in catena). */
const FULL_RUN = [
  'marco-ieri',
  'luca-cinque-euro',
  'giulia-favori',
  'gianni-biglietto',
  'bogdan-debito',
  'nicola-bici',
  'bike-look',
  'ciro-disco',
  'nebbia-incontro',
  'tour-vladivostok',
  'tour-pupazzo',
  'tour-criceti',
  'tour-treno',
];

function run(mode: 'min' | 'max', stopBefore?: string) {
  let p = newGameProgress(content);
  for (const id of FULL_RUN) {
    if (id === stopBefore) break;
    p = extremeOutcome(content, id, p, mode);
  }
  return p;
}

describe('progressione e bilancio del Cazzatometro', () => {
  it('tutte le 6 missioni si completano in ordine, anche col percorso peggiore', () => {
    for (const mode of ['min', 'max'] as const) {
      const p = run(mode);
      for (const id of MAIN_MISSIONS) {
        expect(p.missions[id]?.status, `${mode}: ${id}`).toBe('completed');
      }
      expect(p.unlockedAchievements).toHaveLength(5);
      expect(MAIN_MISSIONS).toHaveLength(6);
    }
  });

  it('il percorso minimo supera comunque la soglia del finale (>= 95)', () => {
    expect(run('min').cazzate).toBeGreaterThanOrEqual(95);
  });

  it('con le sole missioni il Cazzatometro non sfonda 100 prima dell ultima storia', () => {
    expect(run('max', 'tour-treno').cazzate).toBeLessThan(100);
  });

  it('a ogni passo l HUD ha una missione corrente con un obiettivo chiaro', () => {
    let p = newGameProgress(content);
    for (const id of FULL_RUN) {
      const m = getCurrentMission(p, content);
      if (p.missions['tony-world-tour']?.status !== 'completed') {
        expect(m, `prima di ${id}`).not.toBeNull();
        expect(m?.label.length).toBeGreaterThan(5);
      }
      p = extremeOutcome(content, id, p, 'min');
    }
  });

  it('un giocatore che ripete tutti i dialoghi non fa farming', () => {
    const p = run('max');
    let q = p;
    for (const id of FULL_RUN) q = playDialogueId(content, id, q).progress;
    expect(q.cazzate).toBe(p.cazzate);
    expect(q.score).toBe(p.score);
  });

  it('le storie del registro sono tutte sbloccabili e il punteggio e alto', () => {
    const p = run('min');
    const missing = content.storyOrder.filter(
      (s) =>
        !p.unlockedStories.includes(s) && s !== 'story-matite' && s !== 'story-notte-intercity',
    );
    expect(missing).toEqual([]);
    expect(p.score).toBeGreaterThan(1000);
  });
});

describe('World Tour: punti interattivi', () => {
  const actions = (p: ReturnType<typeof newGameProgress>) =>
    Object.fromEntries(
      effectiveInteractables(content, p, INTERACTABLE_OVERRIDES).map((i) => [i.id, i.action]),
    );

  it('durante la missione 6 i 4 punti diventano storie, poi tornano casuali', () => {
    let p = run('min', 'tour-vladivostok');
    expect(p.missions['tony-world-tour']?.status).toBe('active');
    const before = actions(p);
    expect(before['sparane-0']).toEqual({ type: 'dialogue', dialogueId: 'tour-vladivostok' });
    expect(before['sparane-1']).toEqual({ type: 'dialogue', dialogueId: 'tour-pupazzo' });
    expect(before['sparane-2']).toEqual({ type: 'dialogue', dialogueId: 'tour-criceti' });
    expect(before['station-exit']).toEqual({ type: 'dialogue', dialogueId: 'tour-treno' });
    p = extremeOutcome(content, 'tour-vladivostok', p, 'min');
    expect(actions(p)['sparane-0']).toEqual({ type: 'randomStory' });
  });

  it('prima della missione 6 i punti sono casuali', () => {
    expect(actions(newGameProgress(content))['sparane-0']).toEqual({ type: 'randomStory' });
  });

  it('le storie hanno le reazioni degli NPC del prompt', () => {
    const lines = ['tour-vladivostok', 'tour-pupazzo', 'tour-criceti'].flatMap(
      (id) => playDialogueId(content, id, newGameProgress(content)).lines,
    );
    const text = lines.join('\n');
    expect(text).toContain('Fra, questa è impossibile.');
    expect(text).toContain('Ma non eri a scuola quel giorno?');
    expect(text).toContain('Tony, ma almeno questa volta ci credi tu?');
  });

  it('nessuna arma o sostanza e nominata nei contenuti', () => {
    const all = Object.values(content.dialogues)
      .flatMap((d) => Object.values(d.nodes).map((n) => n.text))
      .join(' ')
      .toLowerCase();
    for (const word of ['pistola', 'fucile', 'coltello', 'droga', 'cocaina', 'hashish']) {
      expect(all).not.toContain(word);
    }
  });
});

describe('frasi casuali e bonus', () => {
  it('ci sono almeno 25 frasi uniche con id unici', () => {
    const r = content.randomStories;
    expect(r.length).toBeGreaterThanOrEqual(25);
    expect(new Set(r.map((x) => x.text)).size).toBe(r.length);
    expect(new Set(r.map((x) => x.id)).size).toBe(r.length);
  });

  it('i cinque euro sono battute ambientali di almeno 2 NPC', () => {
    const n = content.npcs.filter((x) => x.ambientLines?.some((l) => /cinque euro/i.test(l)));
    expect(n.length).toBeGreaterThanOrEqual(2);
  });

  it('la matita: gag verbale, una sola volta, sblocca la leggenda', () => {
    const take = playDialogueId(content, 'matita', newGameProgress(content), (c) =>
      c.findIndex((x) => /Raccogli/.test(x.text)),
    );
    expect(take.progress.flags).toContain('collected.matita');
    expect(take.progress.unlockedStories).toContain('story-matite');
    expect(take.lines.join(' ')).toMatch(/di dietro/i);
    const again = playDialogueId(content, 'matita', take.progress);
    expect(again.progress.cazzate).toBe(take.progress.cazzate);
  });
});

describe('cast', () => {
  it('ha almeno 8 NPC con aspetti vari', () => {
    expect(content.npcs.length).toBeGreaterThanOrEqual(8);
    expect(new Set(content.npcs.map((n) => n.appearance.shirt)).size).toBeGreaterThanOrEqual(8);
  });
});
