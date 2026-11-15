import type { SfxName } from '@/audio/sfx';
import { SAVE_STORAGE_KEY, loadGame, type StorageLike } from '@/game/core/save';
import { DEFAULT_SETTINGS } from '@/game/core/settings';
import { createInteractionRegistry, npcToInteractable } from '@/game/interactions/registry';
import { TEST_NPC, makeTestContent } from '@/tests/fixtures';
import { createGameStore, type GameStoreApi } from './createGameStore';
import { createRuntime } from './runtime';

function memoryStorage(): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

function setup(storage: StorageLike | null = memoryStorage()) {
  const content = makeTestContent();
  const runtime = createRuntime();
  const interactions = createInteractionRegistry();
  const interactable = npcToInteractable(TEST_NPC);
  if (interactable) interactions.register(interactable);
  interactions.register(content.interactables[0]!);
  const sfx: SfxName[] = [];
  const audio = vi.fn();
  let t = 1000;
  const store = createGameStore({
    content,
    storage,
    interactions,
    runtime,
    playSfx: (n) => sfx.push(n),
    applyAudioSettings: audio,
    defaultSettings: DEFAULT_SETTINGS,
    spawnPose: { position: [0, 9], rotationY: Math.PI, anim: 'idle' },
    menuPose: { position: [0, 9], rotationY: 0, anim: 'pose' },
    now: () => (t += 10),
    random: () => 0,
  });
  return { store, content, runtime, interactions, sfx, audio, storage };
}

const play = (store: GameStoreApi) => {
  store.getState().markSceneReady();
  store.getState().newGame();
  store.getState().finishIntro();
};

describe('fasi', () => {
  it('loading -> menu -> intro -> playing', () => {
    const { store, runtime } = setup();
    expect(store.getState().phase).toBe('loading');
    store.getState().markSceneReady();
    expect(store.getState().phase).toBe('menu');
    expect(runtime.anim.state).toBe('pose');
    store.getState().newGame();
    expect(store.getState().phase).toBe('intro');
    expect(runtime.player.z).toBe(9);
    expect(runtime.anim.state).toBe('idle');
    store.getState().finishIntro();
    expect(store.getState().phase).toBe('playing');
  });
  it('newGame avvia le missioni autoStart e mostra la notifica', () => {
    const { store } = setup();
    store.getState().markSceneReady();
    store.getState().newGame();
    expect(store.getState().progress.missions['m1']?.status).toBe('active');
    expect(store.getState().notifications.map((n) => n.kind)).toContain('missionStarted');
    expect(store.getState().tutorialStep).toBe('move');
  });
  it('pause/resume solo da playing; Esc nei sotto-pannelli', () => {
    const { store } = setup();
    store.getState().pause();
    expect(store.getState().phase).toBe('loading');
    play(store);
    store.getState().pause();
    expect(store.getState().phase).toBe('paused');
    expect(store.getState().panel).toBe('pause');
    store.getState().openPanel('settings');
    expect(store.getState().panel).toBe('settings');
    store.getState().closePanel();
    expect(store.getState().panel).toBe('pause');
    store.getState().closePanel();
    expect(store.getState().phase).toBe('playing');
  });
  it('M apre il registro missioni dal gioco e lo richiude riprendendo', () => {
    const { store } = setup();
    play(store);
    store.getState().toggleMissions();
    expect(store.getState()).toMatchObject({ phase: 'paused', panel: 'missions' });
    store.getState().toggleMissions();
    expect(store.getState()).toMatchObject({ phase: 'playing', panel: 'none' });
  });
  it('returnToMenu e continueGame', () => {
    const { store } = setup();
    play(store);
    store.getState().applyEffects([{ type: 'addCazzate', amount: 10, reason: 'x' }]);
    store.getState().returnToMenu();
    expect(store.getState().phase).toBe('menu');
    expect(store.getState().hasSave).toBe(true);
    store.getState().continueGame();
    expect(store.getState().phase).toBe('intro');
    expect(store.getState().progress.cazzate).toBe(10);
  });
  it('continueGame senza salvataggio e un no-op', () => {
    const { store } = setup();
    store.getState().markSceneReady();
    expect(store.getState().hasSave).toBe(false);
    store.getState().continueGame();
    expect(store.getState().phase).toBe('menu');
  });
});

describe('interazione -> dialogo -> effetti -> eventi -> notifiche', () => {
  it('flusso completo fino al completamento di obiettivo', () => {
    const { store, runtime, sfx } = setup();
    play(store);
    expect(store.getState().interact('npc:luca')).toBe(true);
    let s = store.getState();
    expect(s.phase).toBe('dialogue');
    expect(s.dialogue.state.status).toBe('active');
    expect(runtime.dialogue).toMatchObject({
      active: true,
      hasTarget: true,
      targetX: 3,
      targetZ: 2,
    });
    expect(sfx).toContain('dialogueStart');
    expect(s.progress.stats.dialoguesStarted).toBe(1);

    s.advanceDialogue(); // -> choice
    expect(store.getState().dialogue.state.status).toBe('choice');
    store.getState().chooseDialogue(1); // storia assurda: +10
    s = store.getState();
    expect(s.progress.cazzate).toBe(10);
    expect(s.progress.stats.choicesMade).toBe(1);
    expect(s.dialogue.state.status).toBe('consequence');
    expect(s.notifications.some((n) => n.title === '+10 CAZZATOMETRO')).toBe(true);
    expect(sfx).toContain('cazzateUp');

    s.advanceDialogue(); // nodo 'end' con completeObjective
    expect(store.getState().progress.missions['m1']?.completedObjectives).toEqual(['o1']);
    store.getState().advanceDialogue(); // fine
    s = store.getState();
    expect(s.phase).toBe('playing');
    expect(s.dialogue.state.status).toBe('idle');
    expect(s.progress.completedDialogues).toEqual(['luca-talk']);
    expect(runtime.dialogue.active).toBe(false);
  });

  it('closeDialogue a meta non segna il dialogo come completato e si puo riaprire', () => {
    const { store } = setup();
    play(store);
    store.getState().startDialogue('luca-talk');
    store.getState().closeDialogue();
    expect(store.getState().phase).toBe('playing');
    expect(store.getState().progress.completedDialogues).toEqual([]);
    expect(store.getState().startDialogue('luca-talk')).toBe(true);
    expect(store.getState().dialogue.state.status).toBe('active');
  });

  it('un dialogo completato si riapre da repeatStart', () => {
    const { store } = setup();
    play(store);
    store.setState({
      progress: { ...store.getState().progress, completedDialogues: ['luca-talk'] },
    });
    store.getState().startDialogue('luca-talk');
    const st = store.getState().dialogue.state;
    expect(st.status === 'active' && st.line.text).toBe('Ancora tu?');
  });

  it('non si apre un dialogo fuori da playing e id sconosciuti non crashano', () => {
    const { store } = setup();
    expect(store.getState().startDialogue('luca-talk')).toBe(false);
    play(store);
    expect(store.getState().startDialogue('nope')).toBe(false);
    expect(store.getState().notifications.some((n) => n.title === 'Dialogo mancante')).toBe(true);
    expect(store.getState().interact('nope')).toBe(false);
  });

  it('la scelta con indice non valido non cambia stato', () => {
    const { store } = setup();
    play(store);
    store.getState().startDialogue('luca-talk');
    store.getState().advanceDialogue();
    const before = store.getState().dialogue.state;
    store.getState().chooseDialogue(7);
    expect(store.getState().dialogue.state).toBe(before);
    expect(store.getState().progress.stats.choicesMade).toBe(0);
  });

  it('interagibile disabilitato: nessuna azione e feedback', () => {
    const { store, interactions } = setup();
    play(store);
    interactions.setEnabled('npc:luca', false);
    expect(store.getState().interact('npc:luca')).toBe(false);
    expect(store.getState().phase).toBe('playing');
    expect(store.getState().notifications.some((n) => n.kind === 'hint')).toBe(true);
  });
});

describe('SPARANE UN ALTRA', () => {
  it('apre un dialogo transitorio e da cazzate solo la prima volta', () => {
    const { store } = setup();
    play(store);
    expect(store.getState().interact('sparane-1')).toBe(true);
    const st = store.getState().dialogue.state;
    expect(st.status === 'active' && st.line.text).toBe('Frase 1');
    expect(store.getState().progress.cazzate).toBe(3);
    store.getState().advanceDialogue();
    expect(store.getState().phase).toBe('playing');
    expect(store.getState().progress.completedDialogues).toEqual([]); // transitorio
    // random() = 0 e history: la frase successiva e diversa
    store.getState().interact('sparane-1');
    const st2 = store.getState().dialogue.state;
    expect(st2.status === 'active' && st2.line.text).toBe('Frase 2');
    expect(store.getState().progress.cazzate).toBe(6);
  });
});

describe('finale a 100', () => {
  it('raggiungere 100 durante un dialogo passa a ending, chiude il dialogo e lancia la celebrazione', () => {
    const { store, runtime, sfx } = setup();
    play(store);
    store.getState().startDialogue('luca-talk');
    store.getState().applyEffects([{ type: 'addCazzate', amount: 100, reason: 'boom' }]);
    const s = store.getState();
    expect(s.phase).toBe('ending');
    expect(s.dialogue.state.status).toBe('idle');
    expect(runtime.dialogue.active).toBe(false);
    expect(s.celebration?.kind).toBe('finale');
    expect(s.endingRevealed).toBe(false);
    expect(s.progress.stats.finishedAt).not.toBeNull();
    expect(sfx).toContain('finale');
    expect(s.notifications.some((n) => n.title === "TONY NE HA SPARATA UN'ALTRA!")).toBe(true);
    s.revealEnding();
    expect(store.getState().endingRevealed).toBe(true);
    store.getState().clearCelebration();
    expect(store.getState().celebration).toBeNull();
  });
  it('restart dopo il finale riparte da zero', () => {
    const { store } = setup();
    play(store);
    store.getState().applyEffects([{ type: 'addCazzate', amount: 100, reason: 'boom' }]);
    store.getState().restart();
    const s = store.getState();
    expect(s.phase).toBe('intro');
    expect(s.progress.cazzate).toBe(0);
    expect(s.progress.stats.finishedAt).toBeNull();
    expect(s.endingRevealed).toBe(false);
  });
});

describe('collectible e missione come azioni', () => {
  it('collectible: una sola volta, applica gli effetti e si disabilita', () => {
    const { store, interactions } = setup();
    play(store);
    interactions.register({
      id: 'matita',
      position: [0, 0],
      radius: 2,
      label: 'RACCOGLI',
      action: {
        type: 'collectible',
        itemId: 'matita',
        effects: [{ type: 'addCazzate', amount: 5, reason: 'Matita' }],
      },
    });
    expect(store.getState().interact('matita')).toBe(true);
    expect(store.getState().progress.cazzate).toBe(5);
    expect(store.getState().progress.flags).toContain('collected.matita');
    expect(interactions.get('matita')?.enabled).toBe(false);
    expect(store.getState().interact('matita')).toBe(false);
    expect(store.getState().progress.cazzate).toBe(5);
  });
  it('azione mission avvia e completa l obiettivo', () => {
    const { store, interactions } = setup();
    play(store);
    interactions.register({
      id: 'punto',
      position: [0, 0],
      radius: 2,
      label: 'ANDARE',
      action: { type: 'mission', missionId: 'm2', objectiveId: 'o1' },
    });
    store.getState().interact('punto');
    expect(store.getState().progress.missions['m2']?.status).toBe('completed');
    expect(store.getState().progress.cazzate).toBe(60);
  });
});

describe('nearbyPrompt, tutorial, notifiche', () => {
  it('nearbyPrompt non causa aggiornamenti se invariato', () => {
    const { store } = setup();
    const calls = vi.fn();
    store.subscribe(calls);
    store.getState().setNearbyPrompt('PARLA CON LUCA');
    store.getState().setNearbyPrompt('PARLA CON LUCA');
    store.getState().setNearbyPrompt('PARLA CON LUCA', false);
    expect(calls).toHaveBeenCalledTimes(1);
    store.getState().setNearbyPrompt('PARLA CON LUCA', true);
    expect(calls).toHaveBeenCalledTimes(2);
    store.getState().setNearbyPrompt(null);
    store.getState().setNearbyPrompt(null);
    expect(calls).toHaveBeenCalledTimes(3);
  });
  it('tutorial avanza solo dal passo corrente e salva tutorialSeen alla fine', () => {
    const { store } = setup();
    play(store);
    store.getState().advanceTutorial('run'); // non e il passo corrente
    expect(store.getState().tutorialStep).toBe('move');
    store.getState().advanceTutorial('move');
    store.getState().advanceTutorial('look');
    store.getState().advanceTutorial('run');
    store.getState().advanceTutorial('interact');
    expect(store.getState().tutorialStep).toBe('done');
    expect(store.getState().settings.tutorialSeen).toBe(true);
    store.getState().newGame();
    expect(store.getState().tutorialStep).toBe('done');
  });
  it('la coda notifiche e limitata e dismiss funziona', () => {
    const { store } = setup();
    for (let i = 0; i < 20; i++)
      store.getState().pushNotification({ kind: 'info', title: `n${i}`, durationMs: 1 });
    expect(store.getState().notifications).toHaveLength(8);
    const first = store.getState().notifications[0]!;
    store.getState().dismissNotification(first.id);
    expect(store.getState().notifications).toHaveLength(7);
  });
});

describe('impostazioni e salvataggio', () => {
  it('updateSettings sanitizza e notifica l audio', () => {
    const { store, audio } = setup();
    store.getState().updateSettings({ volume: 5, muted: true });
    expect(store.getState().settings.volume).toBe(1);
    expect(audio).toHaveBeenLastCalledWith({ volume: 1, muted: true });
  });
  it('autosave su progress e settings; si ricarica una nuova partita con lo stesso storage', () => {
    const storage = memoryStorage();
    const a = setup(storage);
    play(a.store);
    a.store.getState().applyEffects([{ type: 'addCazzate', amount: 30, reason: 'x' }]);
    a.store.getState().updateSettings({ volume: 0.2 });
    const r = loadGame(storage);
    expect(r.status === 'loaded' && r.save.progress.cazzate).toBe(30);
    expect(r.status === 'loaded' && r.save.settings.volume).toBe(0.2);

    const b = setup(storage);
    expect(b.store.getState().hasSave).toBe(true);
    expect(b.store.getState().progress.cazzate).toBe(30);
    expect(b.store.getState().settings.volume).toBe(0.2);
  });
  it('resetProgress azzera i progressi, mantiene le impostazioni e disabilita CONTINUA', () => {
    const storage = memoryStorage();
    const { store } = setup(storage);
    play(store);
    store.getState().updateSettings({ muted: true });
    store.getState().applyEffects([{ type: 'addCazzate', amount: 30, reason: 'x' }]);
    store.getState().returnToMenu();
    store.getState().resetProgress();
    expect(store.getState().progress.cazzate).toBe(0);
    expect(store.getState().hasSave).toBe(false);
    expect(store.getState().settings.muted).toBe(true);
    const r = loadGame(storage);
    expect(r.status === 'loaded' && r.save.progress.stats.startedAt).toBeNull();
  });
  it('salvataggio corrotto: parte pulito senza eccezioni', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_STORAGE_KEY, '{rotto');
    const { store } = setup(storage);
    expect(store.getState().hasSave).toBe(false);
    expect(store.getState().progress.cazzate).toBe(0);
  });
  it('senza storage il gioco funziona comunque', () => {
    const { store } = setup(null);
    play(store);
    store.getState().applyEffects([{ type: 'addCazzate', amount: 5, reason: 'x' }]);
    expect(store.getState().progress.cazzate).toBe(5);
  });
});
