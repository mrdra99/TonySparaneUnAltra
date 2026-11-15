import type { SfxName } from '@/audio/sfx';
import { createContent } from '@/game/core/content';
import { DEFAULT_SETTINGS } from '@/game/core/settings';
import type { GameContent, PlayerProgress } from '@/game/core/types';
import { createInteractionRegistry } from '@/game/interactions/registry';
import { FINALE_ACHIEVEMENTS, FINALE_MISSIONS, FINALE_STORIES } from '@/levels/intercity/data';
import {
  FINALE_MISSION_ID,
  FINALE_START_INTERACTABLE_ID,
  FLAGS,
} from '@/levels/intercity/logic/ids';
import { COUNTDOWN_START_SEC } from '@/levels/intercity/logic/rules';
import { flashbackSpawn } from '@/levels/intercity/logic/spawns';
import { createGameStore } from './createGameStore';
import { createRuntime } from './runtime';

function makeContent(): GameContent {
  return createContent({
    missions: [
      {
        id: 'm1',
        title: 'PRIMA',
        description: 'd',
        order: 1,
        autoStart: true,
        objectives: [{ id: 'o1', description: 'x' }],
        reward: { cazzate: 90, points: 10 },
      },
      ...FINALE_MISSIONS,
    ],
    dialogues: [],
    stories: [...FINALE_STORIES],
    achievements: [...FINALE_ACHIEVEMENTS],
    npcs: [],
    interactables: [],
    randomStories: [{ id: 'x1', text: 'Frase' }],
  });
}

function setup() {
  const content = makeContent();
  const runtime = createRuntime();
  const interactions = createInteractionRegistry();
  const sfx: SfxName[] = [];
  let t = 1000;
  const store = createGameStore({
    content,
    storage: null,
    interactions,
    runtime,
    playSfx: (n) => sfx.push(n),
    applyAudioSettings: vi.fn(),
    defaultSettings: DEFAULT_SETTINGS,
    spawnPose: { position: [0, 9], rotationY: Math.PI, anim: 'idle' },
    menuPose: { position: [0, 9], rotationY: 0, anim: 'pose' },
    levelPose: (l) => ({ ...flashbackSpawn(l), anim: 'idle' }),
    now: () => (t += 10),
    random: () => 0,
  });
  store.getState().markSceneReady();
  store.getState().newGame();
  store.getState().finishIntro();
  return { store, runtime, interactions, sfx };
}

const unlock = (store: ReturnType<typeof setup>['store']): void => {
  const p = store.getState().progress;
  store.setState({
    progress: {
      ...p,
      missions: { ...p.missions, m1: { status: 'completed', completedObjectives: ['o1'] } },
    } satisfies PlayerProgress,
  });
};

describe('sblocco del racconto', () => {
  it('prima di finire le altre storie il racconto non parte', () => {
    const { store } = setup();
    expect(store.getState().beginFinale()).toBe(false);
    expect(store.getState().phase).toBe('playing');
    expect(store.getState().level).toBe('piazza');
  });

  it('dopo le missioni principali parte dall interagibile della piazza', () => {
    const { store, interactions } = setup();
    unlock(store);
    interactions.register({
      id: FINALE_START_INTERACTABLE_ID,
      position: [0, 0],
      radius: 2,
      label: 'RACCONTA',
      action: { type: 'mission', missionId: FINALE_MISSION_ID },
    });
    expect(store.getState().interact(FINALE_START_INTERACTABLE_ID)).toBe(true);
    const s = store.getState();
    expect(s.phase).toBe('intro');
    expect(s.levelTransition?.to).toBe('intercity-pisa');
    expect(s.progress.missions[FINALE_MISSION_ID]?.status).toBe('active');
  });

  it('i flag di sessione di un racconto precedente vengono azzerati, quello del K.O. no', () => {
    const { store } = setup();
    unlock(store);
    const p = store.getState().progress;
    store.setState({ progress: { ...p, flags: [FLAGS.loan, FLAGS.colNico, FLAGS.ko] } });
    store.getState().beginFinale();
    expect(store.getState().progress.flags).toEqual([FLAGS.ko]);
  });
});

describe('transizioni fra livelli', () => {
  it('cartolina: intro -> swap a schermo nero (spawn della tappa) -> playing', () => {
    const { store, runtime } = setup();
    expect(store.getState().startLevelTransition('intercity-viareggio')).toBe(true);
    expect(store.getState().phase).toBe('intro');
    expect(store.getState().level).toBe('piazza');
    store.getState().swapLevel();
    const sp = flashbackSpawn('intercity-viareggio');
    expect(store.getState().level).toBe('intercity-viareggio');
    expect(runtime.player.x).toBe(sp.position[0]);
    expect(runtime.player.z).toBe(sp.position[1]);
    expect(store.getState().levelTransition?.swapped).toBe(true);
    store.getState().endLevelTransition();
    expect(store.getState().phase).toBe('playing');
    expect(store.getState().levelTransition).toBeNull();
  });

  it('non parte se non si sta giocando e fa suonare lo sfx della tappa', () => {
    const { store, sfx } = setup();
    store.getState().pause();
    expect(store.getState().startLevelTransition('intercity-pisa')).toBe(false);
    store.getState().resume();
    store.getState().startLevelTransition('intercity-torre');
    expect(sfx).toContain('taxiHorn');
  });

  it('returnToMenu e newGame riportano sempre alla piazza', () => {
    const { store } = setup();
    store.getState().startLevelTransition('intercity-torre');
    store.getState().swapLevel();
    store.getState().endLevelTransition();
    store.getState().returnToMenu();
    expect(store.getState().level).toBe('piazza');
    expect(store.getState().levelTransition).toBeNull();
  });

  it('il livello non e persistito: un nuovo store parte dalla piazza', () => {
    const { store } = setup();
    store.getState().startLevelTransition('intercity-torre');
    store.getState().swapLevel();
    const fresh = setup();
    expect(fresh.store.getState().level).toBe('piazza');
  });
});

describe('countdown dell Intercity', () => {
  it('scade senza game over: annuncio, timer azzerato, si continua a giocare', () => {
    const { store, sfx } = setup();
    store.getState().startLevelTransition('intercity-pisa');
    store.getState().swapLevel();
    store.getState().endLevelTransition();
    expect(store.getState().finale.countdownSec).toBe(COUNTDOWN_START_SEC);
    expect(store.getState().finaleTick(30)).toBe(false);
    expect(store.getState().finale.countdownSec).toBe(COUNTDOWN_START_SEC - 30);
    expect(store.getState().finaleTick(COUNTDOWN_START_SEC)).toBe(true);
    const s = store.getState();
    expect(s.phase).toBe('playing');
    expect(s.finale.countdownSec).toBe(COUNTDOWN_START_SEC);
    expect(s.finale.delays).toBe(1);
    expect(s.notifications.some((n) => n.title.includes('5 minuti di ritardo'))).toBe(true);
    expect(sfx).toContain('stationChime');
  });

  it('il timer non scorre in pausa, in dialogo o fuori da Pisa', () => {
    const { store } = setup();
    expect(store.getState().finaleTick(10)).toBe(false);
    expect(store.getState().finale.countdownSec).toBe(COUNTDOWN_START_SEC);
    store.getState().startLevelTransition('intercity-pisa');
    store.getState().swapLevel();
    store.getState().endLevelTransition();
    store.getState().pause();
    store.getState().finaleTick(10);
    expect(store.getState().finale.countdownSec).toBe(COUNTDOWN_START_SEC);
  });
});

describe('K.O. tecnico e 100 del Cazzatometro', () => {
  const toTorre = (store: ReturnType<typeof setup>['store']): void => {
    store.getState().startLevelTransition('intercity-torre');
    store.getState().swapLevel();
    store.getState().endLevelTransition();
  };

  it('prima del K.O. il Cazzatometro non supera 95 anche con ricompense enormi', () => {
    const { store } = setup();
    store.getState().applyEffects([
      { type: 'completeObjective', missionId: 'm1', objectiveId: 'o1' },
      { type: 'addCazzate', amount: 50, reason: 'x' },
    ]);
    expect(store.getState().progress.cazzate).toBe(95);
    expect(store.getState().phase).toBe('playing');
    expect(store.getState().celebration).toBeNull();
  });

  it('startKo blocca il gioco e inquadra Bogdan; finishKo porta a 100 e al finale', () => {
    const { store, runtime, sfx } = setup();
    store.getState().applyEffects([{ type: 'addCazzate', amount: 95, reason: 'x' }]);
    toTorre(store);
    store.getState().startKo([5, -6]);
    let s = store.getState();
    expect(s.phase).toBe('dialogue');
    expect(s.finale.koStartedAt).not.toBeNull();
    expect(runtime.dialogue.targetX).toBe(5);
    expect(s.progress.cazzate).toBe(95);

    store.getState().finishKo();
    s = store.getState();
    expect(s.progress.cazzate).toBe(100);
    expect(s.progress.flags).toContain(FLAGS.ko);
    expect(s.phase).toBe('ending');
    expect(s.celebration?.kind).toBe('finale');
    expect(s.progress.stats.finishedAt).not.toBeNull();
    expect(s.notifications.some((n) => n.title === "TONY NE HA SPARATA UN'ALTRA!")).toBe(true);
    expect(sfx).toContain('finale');
    expect(runtime.dialogue.active).toBe(false);
  });

  it('startKo non si ripete e finishKo senza K.O. in corso non fa nulla', () => {
    const { store } = setup();
    store.getState().finishKo();
    expect(store.getState().phase).toBe('playing');
    toTorre(store);
    store.getState().startKo([5, -6]);
    const at = store.getState().finale.koStartedAt;
    store.getState().startKo([9, 9]);
    expect(store.getState().finale.koStartedAt).toBe(at);
  });

  it('restart dopo il K.O. riparte dalla piazza, da zero', () => {
    const { store } = setup();
    toTorre(store);
    store.getState().startKo([5, -6]);
    store.getState().finishKo();
    store.getState().restart();
    const s = store.getState();
    expect(s.level).toBe('piazza');
    expect(s.finale.koStartedAt).toBeNull();
    expect(s.progress.cazzate).toBe(0);
    expect(s.progress.flags).not.toContain(FLAGS.ko);
  });
});
