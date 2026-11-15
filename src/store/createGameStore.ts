/**
 * OWNER: Architecture.
 * Factory dello store di gioco (zustand vanilla). Dipendenze iniettate -> testabile senza DOM.
 * Il singleton usato dall'app e' in ./gameStore.ts.
 *
 * Regole:
 *  - nessun dato per-frame qui (vedi runtime.ts)
 *  - nearbyPrompt si aggiorna SOLO quando cambia (setNearbyPrompt confronta prima di scrivere)
 *  - ogni effetto passa da applyEffects -> eventi -> notifiche / sfx / fase 'ending'
 */
import { createStore, type StoreApi } from 'zustand/vanilla';
import type { AudioSettings, SfxName } from '@/audio/sfx';
import { MAX_NOTIFICATIONS, TRANSIENT_DIALOGUE_PREFIX } from '@/game/core/constants';
import { createGameSave, loadGame, saveGame, type StorageLike } from '@/game/core/save';
import { sanitizeSettings } from '@/game/core/settings';
import type {
  Vec2,
  Dialogue,
  DialogueEffect,
  GameContent,
  PlayerProgress,
  Settings,
  CelebrationKind,
} from '@/game/core/types';
import {
  IDLE_DIALOGUE,
  advanceDialogue,
  chooseDialogue,
  closeDialogue,
  startDialogue,
  type DialogueState,
  type DialogueStep,
} from '@/game/dialogue/engine';
import {
  FINALE_MISSION_ID,
  FINALE_START_INTERACTABLE_ID,
  FLAGS as FINALE_FLAGS,
  type FlashbackLevelId,
  type LevelId,
} from '@/levels/intercity/logic/ids';
import {
  DELAY_ANNOUNCEMENT,
  initialCountdown,
  isFinaleUnlocked,
  stepCountdown,
  stripSessionFlags,
} from '@/levels/intercity/logic/rules';
import { isInteractableEnabled, type InteractionRegistry } from '@/game/interactions/registry';
import {
  createRandomStoryPicker,
  randomStoryToDialogue,
  type RandomStoryPicker,
} from '@/game/interactions/randomStory';
import { applyEffects } from '@/game/progression/effects';
import type { GameEvent } from '@/game/progression/events';
import {
  eventToNotification,
  eventToSfx,
  type GameNotification,
  type NotificationDraft,
} from '@/game/progression/notifications';
import { createInitialProgress } from '@/game/progression/progress';
import { resetPlayer, type PlayerPose, type RuntimeState } from './runtime';

export type GamePhase = 'loading' | 'menu' | 'intro' | 'playing' | 'paused' | 'dialogue' | 'ending';
export type Panel = 'none' | 'pause' | 'missions' | 'legends' | 'settings' | 'howto' | 'credits';
export type TutorialStep = 'move' | 'look' | 'run' | 'interact' | 'done';

const TUTORIAL_ORDER: readonly TutorialStep[] = ['move', 'look', 'run', 'interact', 'done'];

export interface DialogueSession {
  state: DialogueState;
  dialogueId: string | null;
  /** Id dell'interagibile che ha aperto il dialogo (se c'e'). */
  interactableId: string | null;
}

export interface CelebrationState {
  kind: CelebrationKind;
  /** Cambia a ogni celebrazione: la UI lo usa come key per rilanciare l'effetto. */
  nonce: number;
}

/** Cambio di livello in corso (cartolina): la fase e' 'intro' finche' non termina. */
export interface LevelTransition {
  to: LevelId;
  /** Cambia a ogni transizione: la UI lo usa come key. */
  nonce: number;
  /** True dopo `swapLevel` (schermo nero: il nuovo livello e' montato). */
  swapped: boolean;
}

/** Stato NON persistito del flashback "La notte dell'Intercity". */
export interface FinaleSession {
  countdownSec: number;
  /** Ritardi annunciati dall'Intercity (il timer scaduto non e' mai un game over). */
  delays: number;
  /** Date.now() di inizio del K.O. tecnico, null se non e' in corso. */
  koStartedAt: number | null;
}

export interface GameState {
  phase: GamePhase;
  /** Livello montato (non persistito: dopo un reload si riparte sempre dalla piazza). */
  level: LevelId;
  levelTransition: LevelTransition | null;
  finale: FinaleSession;
  panel: Panel;
  /** True se il pannello e' stato aperto da 'M' durante il gioco (chiudendolo si riprende). */
  panelFromGameplay: boolean;
  progress: PlayerProgress;
  settings: Settings;
  /** True se esiste una partita salvata (abilita CONTINUA). */
  hasSave: boolean;
  dialogue: DialogueSession;
  notifications: readonly GameNotification[];
  /** Etichetta del prompt di interazione vicino (senza "[E]"), null se nessuno. */
  nearbyPrompt: string | null;
  /** True se l'interazione vicina non e' disponibile (mostra feedback). */
  nearbyPromptDisabled: boolean;
  tutorialStep: TutorialStep;
  celebration: CelebrationState | null;
  /** In fase 'ending': true quando la schermata finale puo' comparire (dopo la celebrazione). */
  endingRevealed: boolean;
}

export interface GameActions {
  /** Scena pronta (Suspense risolto): loading -> menu. */
  markSceneReady(): void;
  newGame(): void;
  continueGame(): void;
  /** intro -> playing (chiamata dal timer di shell). */
  finishIntro(): void;
  pause(): void;
  resume(): void;
  openPanel(panel: Exclude<Panel, 'none'>): void;
  /** Chiude il sotto-pannello: torna al menu di pausa, o riprende se aperto da 'M'. */
  closePanel(): void;
  /** Azione del tasto M. */
  toggleMissions(): void;
  startDialogue(dialogueId: string, opts?: { interactableId?: string }): boolean;
  advanceDialogue(): void;
  chooseDialogue(index: number): void;
  closeDialogue(): void;
  /** Esegue l'azione di un interagibile registrato. Restituisce true se ha fatto qualcosa. */
  interact(interactableId: string): boolean;
  applyEffects(effects: readonly DialogueEffect[]): void;
  resetProgress(): void;
  updateSettings(patch: Partial<Settings>): void;
  pushNotification(draft: NotificationDraft): void;
  dismissNotification(id: string): void;
  returnToMenu(): void;
  /** Riavvia da capo (azzera il progresso e ricomincia). */
  restart(): void;
  setNearbyPrompt(prompt: string | null, disabled?: boolean): void;
  /** Avanza il tutorial solo se `from` e' il passo corrente (idempotente). */
  advanceTutorial(from: TutorialStep): void;
  clearCelebration(): void;
  revealEnding(): void;
  /** Piazza -> flashback: richiede il racconto sbloccato. Restituisce true se parte. */
  beginFinale(): boolean;
  /** Avvia la cartolina verso `to` (solo da 'playing'). */
  startLevelTransition(to: LevelId): boolean;
  /** A schermo nero: monta il livello di destinazione e riposiziona Tony. */
  swapLevel(): void;
  /** Fine della cartolina: si riprende a giocare. */
  endLevelTransition(): void;
  /** Avanza il countdown dell'Intercity di `dtSec`. Restituisce true se e' scaduto (ritardo). */
  finaleTick(dtSec: number): boolean;
  /** Inizia la scena del K.O. tecnico (fase bloccata, camera su Bogdan). */
  startKo(target: Vec2): void;
  /** Fine della scena: Cazzatometro a 100 -> messaggio, celebrazione, schermata finale. */
  finishKo(): void;
}

export type GameStore = GameState & GameActions;
export type GameStoreApi = StoreApi<GameStore>;

export interface GameStoreDeps {
  content: GameContent;
  /** null = nessun salvataggio disponibile. */
  storage: StorageLike | null;
  interactions: InteractionRegistry;
  runtime: RuntimeState;
  playSfx: (name: SfxName) => void;
  applyAudioSettings: (s: AudioSettings) => void;
  defaultSettings: Settings;
  /** Posa di Tony all'inizio partita. */
  spawnPose: PlayerPose;
  /** Posa di Tony nel menu principale. */
  menuPose: PlayerPose;
  /** Posa di partenza di una tappa del flashback (default: `spawnPose`). */
  levelPose?: (level: FlashbackLevelId) => PlayerPose;
  now?: () => number;
  random?: () => number;
  /** Default true. */
  autosave?: boolean;
  randomPicker?: RandomStoryPicker;
}

export function createGameStore(deps: GameStoreDeps): GameStoreApi {
  const { content, runtime, interactions } = deps;
  const now = deps.now ?? Date.now;
  const picker = deps.randomPicker ?? createRandomStoryPicker(deps.random ?? Math.random);
  let notificationSeq = 0;
  let celebrationSeq = 0;

  const loaded = loadGame(deps.storage);
  const initialSettings =
    loaded.status === 'loaded' ? loaded.save.settings : sanitizeSettings(deps.defaultSettings);
  const initialProgress =
    loaded.status === 'loaded' ? loaded.save.progress : createInitialProgress();

  const idleSession: DialogueSession = {
    state: IDLE_DIALOGUE,
    dialogueId: null,
    interactableId: null,
  };

  const store = createStore<GameStore>()((set, get) => {
    // --- helper interni ----------------------------------------------------

    const toast = (draft: NotificationDraft): void => {
      const n: GameNotification = { ...draft, id: `n${++notificationSeq}` };
      set((s) => ({ notifications: [...s.notifications, n].slice(-MAX_NOTIFICATIONS) }));
    };

    const handleEvents = (events: readonly GameEvent[]): void => {
      for (const ev of events) {
        const draft = eventToNotification(ev, content);
        if (draft) toast(draft);
        const sfx = eventToSfx(ev);
        if (sfx) deps.playSfx(sfx);
        if (ev.type === 'celebration') {
          set({ celebration: { kind: ev.kind, nonce: ++celebrationSeq } });
        }
        if (ev.type === 'thresholdReached' && ev.threshold === 100) {
          // Finale: chiude eventuale dialogo e passa alla fase di celebrazione.
          runtime.dialogue.active = false;
          set((s) => ({
            phase: 'ending',
            panel: 'none',
            dialogue: idleSession,
            endingRevealed: false,
            progress: { ...s.progress, stats: { ...s.progress.stats, finishedAt: now() } },
          }));
        }
      }
    };

    const runEffects = (effects: readonly DialogueEffect[]): void => {
      if (effects.length === 0) return;
      const result = applyEffects(get().progress, effects, content);
      if (result.progress !== get().progress) set({ progress: result.progress });
      handleEvents(result.events);
    };

    const endDialogue = (completed: boolean, dialogueId: string): void => {
      runtime.dialogue.active = false;
      runtime.dialogue.hasTarget = false;
      const s = get();
      const markDone =
        completed &&
        !dialogueId.startsWith(TRANSIENT_DIALOGUE_PREFIX) &&
        !s.progress.completedDialogues.includes(dialogueId);
      set({
        dialogue: idleSession,
        phase: s.phase === 'dialogue' ? 'playing' : s.phase,
        ...(markDone
          ? {
              progress: {
                ...s.progress,
                completedDialogues: [...s.progress.completedDialogues, dialogueId],
              },
            }
          : {}),
      });
    };

    /** Applica uno step del motore: effetti, nuovo stato, eventuale fine. */
    const applyStep = (
      dialogue: Dialogue,
      step: DialogueStep,
      interactableId: string | null,
    ): void => {
      runEffects(step.effects);
      if (get().phase === 'ending') return; // il finale ha gia' chiuso il dialogo
      if (step.state.status === 'ended') {
        endDialogue(step.state.completed, step.state.dialogueId);
        return;
      }
      set({ dialogue: { state: step.state, dialogueId: dialogue.id, interactableId } });
    };

    const beginDialogue = (dialogue: Dialogue, interactableId: string | null): boolean => {
      if (get().phase !== 'playing') return false;
      const step = startDialogue(dialogue, get().progress);
      if (step.state.status === 'ended') {
        // requires non soddisfatto in partenza: nulla da mostrare
        runEffects(step.effects);
        return false;
      }
      const def = interactableId ? interactions.get(interactableId) : undefined;
      if (def) {
        runtime.dialogue.targetX = def.position[0];
        runtime.dialogue.targetZ = def.position[1];
        runtime.dialogue.hasTarget = true;
      } else {
        runtime.dialogue.hasTarget = false;
      }
      runtime.dialogue.active = true;
      set((s) => ({
        phase: 'dialogue',
        nearbyPrompt: null,
        nearbyPromptDisabled: false,
        progress: {
          ...s.progress,
          stats: { ...s.progress.stats, dialoguesStarted: s.progress.stats.dialoguesStarted + 1 },
        },
      }));
      deps.playSfx('dialogueStart');
      applyStep(dialogue, step, interactableId);
      return true;
    };

    const currentDialogue = (): Dialogue | null => {
      const id = get().dialogue.dialogueId;
      if (!id) return null;
      return id.startsWith(TRANSIENT_DIALOGUE_PREFIX)
        ? (transient.get(id) ?? null)
        : (content.dialogues[id] ?? null);
    };
    /** Dialoghi transitori attivi (frasi casuali): vivono solo finche' il dialogo e' aperto. */
    const transient = new Map<string, Dialogue>();

    let transitionSeq = 0;
    const freshFinale = (): FinaleSession => {
      const c = initialCountdown();
      return { countdownSec: c.sec, delays: c.delays, koStartedAt: null };
    };

    const beginGame = (progress: PlayerProgress, tutorial: boolean): void => {
      resetPlayer(runtime, deps.spawnPose);
      set({
        level: 'piazza',
        levelTransition: null,
        finale: freshFinale(),
        progress,
        phase: 'intro',
        panel: 'none',
        panelFromGameplay: false,
        dialogue: idleSession,
        notifications: [],
        nearbyPrompt: null,
        nearbyPromptDisabled: false,
        tutorialStep: tutorial ? 'move' : 'done',
        celebration: null,
        endingRevealed: false,
        hasSave: true,
      });
    };

    return {
      phase: 'loading',
      level: 'piazza',
      levelTransition: null,
      finale: freshFinale(),
      panel: 'none',
      panelFromGameplay: false,
      progress: initialProgress,
      settings: initialSettings,
      hasSave: loaded.status === 'loaded' && initialProgress.stats.startedAt !== null,
      dialogue: idleSession,
      notifications: [],
      nearbyPrompt: null,
      nearbyPromptDisabled: false,
      tutorialStep: initialSettings.tutorialSeen ? 'done' : 'move',
      celebration: null,
      endingRevealed: false,

      markSceneReady() {
        if (get().phase !== 'loading') return;
        resetPlayer(runtime, deps.menuPose);
        set({ phase: 'menu' });
      },

      newGame() {
        const fresh = createInitialProgress(now());
        beginGame(fresh, !get().settings.tutorialSeen);
        runEffects(
          content.missionOrder.flatMap((id) =>
            content.missions[id]?.autoStart
              ? [{ type: 'startMission', missionId: id } as const]
              : [],
          ),
        );
      },

      continueGame() {
        const s = get();
        if (!s.hasSave) return;
        beginGame(s.progress, !s.settings.tutorialSeen);
        if (s.progress.stats.finishedAt !== null) {
          // partita gia' conclusa: si riprende ad esplorare senza rilanciare il finale
          set({ phase: 'playing' });
        }
      },

      finishIntro() {
        if (get().phase === 'intro') set({ phase: 'playing' });
      },

      pause() {
        if (get().phase !== 'playing') return;
        set({ phase: 'paused', panel: 'pause', panelFromGameplay: false });
      },

      resume() {
        if (get().phase !== 'paused') return;
        set({ phase: 'playing', panel: 'none', panelFromGameplay: false });
      },

      openPanel(panel) {
        const { phase } = get();
        if (phase === 'menu') set({ panel });
        else if (phase === 'paused') set({ panel, panelFromGameplay: false });
        else if (phase === 'playing') set({ phase: 'paused', panel, panelFromGameplay: true });
      },

      closePanel() {
        const s = get();
        if (s.phase === 'menu') {
          set({ panel: 'none' });
        } else if (s.phase === 'paused') {
          if (s.panel === 'pause' || s.panelFromGameplay) {
            set({ phase: 'playing', panel: 'none', panelFromGameplay: false });
          } else {
            set({ panel: 'pause' });
          }
        }
      },

      toggleMissions() {
        const s = get();
        if (s.phase === 'playing') get().openPanel('missions');
        else if (s.phase === 'paused' && s.panel === 'missions') get().closePanel();
      },

      startDialogue(dialogueId, opts) {
        const dialogue = content.dialogues[dialogueId];
        if (!dialogue) {
          toast({ kind: 'info', title: 'Dialogo mancante', body: dialogueId, durationMs: 3000 });
          return false;
        }
        return beginDialogue(dialogue, opts?.interactableId ?? null);
      },

      advanceDialogue() {
        const dialogue = currentDialogue();
        const session = get().dialogue;
        if (!dialogue) return;
        applyStep(
          dialogue,
          advanceDialogue(dialogue, session.state, get().progress),
          session.interactableId,
        );
        if (get().dialogue.state.status === 'idle') transient.clear();
      },

      chooseDialogue(index) {
        const dialogue = currentDialogue();
        const session = get().dialogue;
        if (!dialogue || session.state.status !== 'choice') return;
        const step = chooseDialogue(dialogue, session.state, index, get().progress);
        if (step.state === session.state) return;
        set((s) => ({
          progress: {
            ...s.progress,
            stats: { ...s.progress.stats, choicesMade: s.progress.stats.choicesMade + 1 },
          },
        }));
        applyStep(dialogue, step, session.interactableId);
        if (get().dialogue.state.status === 'idle') transient.clear();
      },

      closeDialogue() {
        const session = get().dialogue;
        if (session.state.status === 'idle') return;
        const step = closeDialogue(session.state);
        if (step.state.status === 'ended') endDialogue(false, step.state.dialogueId);
        transient.clear();
      },

      interact(interactableId) {
        const def = interactions.get(interactableId);
        if (!def || get().phase !== 'playing') return false;
        if (!isInteractableEnabled(def)) {
          toast({ kind: 'hint', title: def.disabledLabel ?? 'Non ora', durationMs: 1800 });
          return false;
        }
        get().advanceTutorial('interact');
        if (interactableId === FINALE_START_INTERACTABLE_ID) return get().beginFinale();
        const action = def.action;
        switch (action.type) {
          case 'dialogue':
            return get().startDialogue(action.dialogueId, { interactableId });
          case 'randomStory': {
            const story = picker.next(content.randomStories);
            if (!story) {
              toast({
                kind: 'hint',
                title: 'Tony non ha niente da sparare... per ora.',
                durationMs: 2500,
              });
              return false;
            }
            const dialogue = randomStoryToDialogue(story);
            transient.set(dialogue.id, dialogue);
            const ok = beginDialogue(dialogue, interactableId);
            if (!ok) transient.clear();
            return ok;
          }
          case 'collectible': {
            const flag = `collected.${action.itemId}`;
            if (get().progress.flags.includes(flag)) return false;
            runEffects([{ type: 'setFlag', flag }, ...(action.effects ?? [])]);
            interactions.setEnabled(interactableId, false);
            return true;
          }
          case 'mission': {
            const effects: DialogueEffect[] = [
              { type: 'startMission', missionId: action.missionId },
            ];
            if (action.objectiveId) {
              effects.push({
                type: 'completeObjective',
                missionId: action.missionId,
                objectiveId: action.objectiveId,
              });
            }
            runEffects(effects);
            return true;
          }
        }
      },

      applyEffects(effects) {
        runEffects(effects);
      },

      resetProgress() {
        set({
          progress: createInitialProgress(),
          hasSave: false,
          notifications: [],
          dialogue: idleSession,
        });
        picker.reset();
      },

      updateSettings(patch) {
        const settings = sanitizeSettings({ ...get().settings, ...patch });
        set({ settings });
        deps.applyAudioSettings({ volume: settings.volume, muted: settings.muted });
      },

      pushNotification(draft) {
        toast(draft);
      },

      dismissNotification(id) {
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
      },

      returnToMenu() {
        resetPlayer(runtime, deps.menuPose);
        set((s) => ({
          phase: 'menu',
          level: 'piazza',
          levelTransition: null,
          finale: freshFinale(),
          panel: 'none',
          panelFromGameplay: false,
          dialogue: idleSession,
          notifications: [],
          nearbyPrompt: null,
          nearbyPromptDisabled: false,
          celebration: null,
          endingRevealed: false,
          hasSave: s.progress.stats.startedAt !== null,
        }));
      },

      restart() {
        get().resetProgress();
        get().newGame();
      },

      setNearbyPrompt(prompt, disabled = false) {
        const s = get();
        if (
          s.nearbyPrompt === prompt &&
          s.nearbyPromptDisabled === (prompt === null ? false : disabled)
        )
          return;
        set({ nearbyPrompt: prompt, nearbyPromptDisabled: prompt === null ? false : disabled });
      },

      advanceTutorial(from) {
        const s = get();
        if (s.tutorialStep !== from || from === 'done') return;
        const next = TUTORIAL_ORDER[TUTORIAL_ORDER.indexOf(from) + 1] ?? 'done';
        set({ tutorialStep: next });
        if (next === 'done' && !s.settings.tutorialSeen)
          get().updateSettings({ tutorialSeen: true });
      },

      clearCelebration() {
        if (get().celebration) set({ celebration: null });
      },

      revealEnding() {
        if (get().phase === 'ending' && !get().endingRevealed) set({ endingRevealed: true });
      },

      beginFinale() {
        const s = get();
        if (s.phase !== 'playing' || s.level !== 'piazza') return false;
        if (!isFinaleUnlocked(s.progress, content.missionOrder)) return false;
        // nuova sessione: via i flag di sessione (il flag permanente del K.O. resta)
        const flags = stripSessionFlags(s.progress.flags);
        if (flags !== s.progress.flags) set({ progress: { ...s.progress, flags } });
        set({ finale: freshFinale() });
        runEffects([{ type: 'startMission', missionId: FINALE_MISSION_ID }]);
        return get().startLevelTransition('intercity-pisa');
      },

      startLevelTransition(to) {
        if (get().phase !== 'playing') return false;
        runtime.nearestInteractableId = null;
        set({
          phase: 'intro',
          nearbyPrompt: null,
          nearbyPromptDisabled: false,
          levelTransition: { to, nonce: ++transitionSeq, swapped: false },
        });
        deps.playSfx(to === 'intercity-torre' ? 'taxiHorn' : 'stationChime');
        return true;
      },

      swapLevel() {
        const t = get().levelTransition;
        if (!t || t.swapped) return;
        const to = t.to;
        if (to === 'piazza') resetPlayer(runtime, deps.spawnPose);
        else resetPlayer(runtime, (deps.levelPose ?? (() => deps.spawnPose))(to));
        set({
          level: to,
          levelTransition: { ...t, swapped: true },
          ...(to === 'intercity-pisa' ? { finale: freshFinale() } : {}),
        });
      },

      endLevelTransition() {
        if (!get().levelTransition) return;
        set((s) => ({ levelTransition: null, phase: s.phase === 'intro' ? 'playing' : s.phase }));
      },

      finaleTick(dtSec) {
        const s = get();
        if (s.phase !== 'playing' || s.level !== 'intercity-pisa') return false;
        const r = stepCountdown({ sec: s.finale.countdownSec, delays: s.finale.delays }, dtSec);
        set({ finale: { ...s.finale, countdownSec: r.countdown.sec, delays: r.countdown.delays } });
        if (r.expired) {
          toast({ kind: 'hint', title: DELAY_ANNOUNCEMENT, icon: 'Clock', durationMs: 4500 });
          deps.playSfx('stationChime');
        }
        return r.expired;
      },

      startKo(target) {
        const s = get();
        if (s.phase !== 'playing' || s.finale.koStartedAt !== null) return;
        runtime.dialogue.targetX = target[0];
        runtime.dialogue.targetZ = target[1];
        runtime.dialogue.hasTarget = true;
        runtime.dialogue.active = true;
        set({
          phase: 'dialogue',
          nearbyPrompt: null,
          nearbyPromptDisabled: false,
          finale: { ...s.finale, koStartedAt: now() },
        });
      },

      finishKo() {
        if (get().finale.koStartedAt === null || get().phase === 'ending') return;
        // il flag toglie il tetto pre-finale; poi il Cazzatometro sale a 100 (soglia -> ending)
        runEffects([
          { type: 'setFlag', flag: FINALE_FLAGS.ko },
          { type: 'addCazzate', amount: 100, reason: 'K.O. tecnico', onceId: 'finale-ko' },
        ]);
        // replay: il 100 era gia' stato incassato, ma il finale va comunque mostrato
        if (get().phase !== 'ending') {
          runtime.dialogue.active = false;
          runtime.dialogue.hasTarget = false;
          set((st) => ({
            phase: 'ending',
            panel: 'none',
            dialogue: idleSession,
            endingRevealed: false,
            celebration: { kind: 'finale', nonce: ++celebrationSeq },
            progress: {
              ...st.progress,
              stats: { ...st.progress.stats, finishedAt: st.progress.stats.finishedAt ?? now() },
            },
          }));
          deps.playSfx('finale');
        }
      },
    };
  });

  // Audio: applica subito le impostazioni correnti.
  deps.applyAudioSettings({ volume: initialSettings.volume, muted: initialSettings.muted });

  // Autosave su cambio di progress o settings.
  if (deps.autosave !== false) {
    store.subscribe((state, prev) => {
      if (state.progress !== prev.progress || state.settings !== prev.settings) {
        saveGame(deps.storage, createGameSave(state.progress, state.settings, now()));
      }
    });
  }

  return store;
}
