# CONTRACTS — contratti tra moduli e proprietà dei file

Documento di riferimento per gli agenti paralleli (World&3D, Gameplay, UI/UX). Si lavora leggendo
**solo questo file e il codice**. Il codice dei contratti (`src/game/core`, `src/store`, ecc.) è già
implementato e testato: non va riscritto, va usato.

## 1. Mappa di proprietà dei file

Regola: **nessun agente modifica file di un altro**. Se serve un cambio di contratto lo si segnala nel
report finale (con la modifica proposta) invece di farlo. Ogni stub ha in testa `// OWNER: <agente>`.

| Agente                           | File / cartelle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **World&3D**                     | `src/world/environments/**` (Piazza, `piazzaColliders.ts`), `src/world/lighting/**`, `src/world/npcs/NpcModel.tsx` (+ file di supporto in `src/world/npcs/` che non siano `Npcs.tsx`), `src/world/props/**`, `src/game/entities/**` (`TonyModel.tsx`, config modello), `public/assets/models/**`, `public/assets/textures/**`                                                                                                                                                                    |
| **Gameplay**                     | `src/game/movement/PlayerController.tsx`, `src/game/camera/**`, `src/game/interactions/InteractionSystem.tsx`, `src/world/npcs/Npcs.tsx`, `src/game/systems/**` (es. `attention.ts`), `src/game/quests/**` oltre a `selectors.ts` solo se aggiunge file nuovi, `src/data/{npcs,dialogues,missions,stories,achievements,interactables,randomStories}/**`                                                                                                                                          |
| **UI/UX**                        | `src/ui/**` (menus, hud, dialogues, notifications, touch, `LoadingScreen.tsx`), `src/audio/sfx.ts` (implementazione), CSS Modules e token di design in `src/ui/**` (e un eventuale `src/styles/ui-*.css`)                                                                                                                                                                                                                                                                                        |
| **Architecture / Orchestratore** | `src/app/**`, `src/store/**`, `src/hooks/**`, `src/game/core/**`, `src/game/progression/**`, `src/game/dialogue/**`, `src/game/interactions/registry.ts` e `randomStory.ts`, `src/game/quests/selectors.ts`, `src/game/movement/movementMath.ts`, `src/data/index.ts`, `src/data/assets.ts`, `src/tests/**`, `src/styles/global.css`, config root (`vite.config.ts`, `tsconfig*`, `eslint.config.js`, `playwright.config.ts`, `package.json`), `docs/**`, `README.md`, `e2e/**` (scritti dal QA) |

I test unitari dei file propri vanno **colocati** (`*.test.ts(x)` accanto al file) e sono di chi possiede il file.
Il test `src/data/content.test.ts` (Architecture) valida i dati di Gameplay: deve restare verde.

> Nota per l'integrazione: gli stub di World (`Piazza`, `Lighting`, `NpcModel`, `Bicycle`, `TonyModel`,
> `piazzaColliders.ts`) sono **placeholder temporanei** con le firme concordate; World li sostituisce
> mantenendo gli export. L'app importa World **solo** tramite `src/app/worldBindings.ts` (un unico punto
> di merge). Gli altri moduli importano direttamente dai percorsi indicati sotto.

## 2. Runtime vs Store

|               | `runtime` (`src/store/runtime.ts`)                                                                                                        | `gameStore` (`src/store/gameStore.ts`, zustand)                                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Natura        | oggetto **mutabile, non reattivo**                                                                                                        | stato **reattivo** (React re-render)                                                                                              |
| Cosa contiene | dati per-frame: posizione/rotazione/velocità del player, `anim`, yaw/pitch/distanza camera, inquadratura dialogo, `nearestInteractableId` | `phase`, `panel`, `progress`, `settings`, dialogo (stato motore), `notifications`, `nearbyPrompt`, tutorial, celebrazione, ending |
| Chi lo legge  | componenti R3F **dentro `useFrame`** (`runtime.player.x`)                                                                                 | componenti React via `useGameStore(selector)`; in `useFrame`/codice non React solo `gameStore.getState()`                         |
| Regola        | mai `set` React per frame                                                                                                                 | mai dati per-frame; `nearbyPrompt` si aggiorna **solo quando cambia** (`setNearbyPrompt` confronta)                               |

Scrittori di `runtime` (**uno solo per campo**):

| Campo                                              | Scrittore                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------ |
| `player.x/y/z/rotationY/vx/vz`, `anim.state/speed` | `PlayerController` (Gameplay)                                                  |
| `camera.yaw/pitch/distance`                        | `ThirdPersonCamera` (Gameplay)                                                 |
| `nearestInteractableId`                            | `InteractionSystem` (Gameplay)                                                 |
| `dialogue.*` (target camera dialogo)               | `gameStore` (apertura/chiusura dialogo)                                        |
| reset/posa iniziale                                | `resetPlayer()` chiamata dallo store (newGame / returnToMenu / markSceneReady) |

`runtime.anim` è la `TonyAnimSource` passata a `<TonyModel anim={runtime.anim} />`
(`state: 'idle'|'walk'|'run'|'talk'|'gesture'|'interact'|'victory'|'pose'`, `speed` in m/s).
`'pose'` è la posa comica statica del menu. Il `PlayerController` scrive `anim` nelle fasi
`playing|dialogue|ending|intro`; nel `menu` resta `'pose'` (impostato dallo store).

## 3. Flusso interazione → dialogo → effetti → eventi → notifiche

```
InteractionSystem (useFrame)           runtime.nearestInteractableId + store.setNearbyPrompt(label)  [solo se cambia]
   │  input 'interact' (E / bottone touch)
   ▼
store.interact(id) ──► registry.get(id).action
   │   dialogue   → store.startDialogue(dialogueId, {interactableId})
   │   randomStory→ pickRandom → dialogo transitorio 'random:<id>' (addCazzate onceId)
   │   collectible→ setFlag collected.<itemId> + effects, interagibile disabilitato
   │   mission    → startMission (+ completeObjective se objectiveId)
   ▼
engine.startDialogue(dialogue, progress) → {state, effects}     (PURO)
   │  phase = 'dialogue'; runtime.dialogue = target camera; movimento bloccato
   ▼
UI DialoguePanel legge store.dialogue.state  → advanceDialogue() / chooseDialogue(i) / closeDialogue()
   │  ogni passo del motore restituisce `effects`
   ▼
applyEffects(progress, effects, content) → {progress, events: GameEvent[]}   (PURO)
   ▼
store.handleEvents(events):
   • eventToNotification → store.notifications (toast tipizzati)
   • eventToSfx          → playSfx(...)
   • celebration         → store.celebration {kind, nonce}
   • thresholdReached 100→ phase 'ending' (celebrazione 3D, poi EndingScreen quando endingRevealed)
   ▼
autosave (subscribe su progress/settings) → localStorage (schema versionato)
```

Il motore dialoghi **non** conosce lo store; lo store **non** conosce React. Stato `ended` del motore:
lo store lo converte subito in `idle` + `phase = 'playing'` (e `completedDialogues` se `completed`).

## 4. Sistema di coordinate

- Unità = **metri**, **Y up**. Piano del suolo = **XZ**. Punti 2D = `Vec2 = [x, z]`.
- **Nord = −Z**, sud = +Z, est = +X, ovest = −X.
- `rotationY = 0` guarda verso **+Z**; cresce verso **+X** (stessa convenzione di `Object3D.rotation.y`):
  `π` = guarda a nord (−Z), `π/2` = guarda a est, `−π/2` a ovest.
- Camera `yaw`: stessa convenzione (direzione in cui la camera guarda). Movimento: `inputToWorldDirection`.
- Piazza **40 × 30 m** centrata in (0,0): `x ∈ [−20, 20]`, `z ∈ [−15, 15]`. Muri perimetrali spessi 1 m
  fuori dai limiti (collider box).

Layout di massima (**la fonte di verità per la logica è `PIAZZA_POINTS` in
`src/world/environments/piazzaColliders.ts`**; i valori sotto sono quelli dello stub, World li rifinisce
mantenendo la zona e comunicando le variazioni nel report):

| Elemento                                          | Posizione [x, z]                                             | Note                                  |
| ------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| Spawn Tony                                        | `[0, 9]`, rotationY `π`                                      | sud-centro, guarda verso la gradinata |
| Gradinata (7 gradini, striscia gialla, ringhiera) | centro `[−3, −12.4]`, box `x[−10,4] z[−14.6,−10.2]`          | nord; solida (collider)               |
| Area di ritrovo NPC                               | centro `[5, −1]`, raggio ~5                                  | NPC missione 1 e Bogdan qui           |
| Bicicletta (missione 4)                           | `[−10, −7.5]`                                                | vicino alla gradinata, lato ovest     |
| Uscita verso la stazione (est)                    | soglia `[19, 6]`, varco nel muro est `z ∈ [3, 9]`            | NPC missione 2 vicino, es. `[17, 6]`  |
| Punti "SPARANE UN'ALTRA"                          | `[−13, 2]`, `[12, −6]`, `[−5, 10]`, `[9, 9]`                 | 4 punti = 4 storie "World Tour"       |
| Cassonetto con graffiti (indicativo)              | `[17.5, −11]`                                                | angolo nord-est                       |
| Lampioni (indicativo)                             | `[−14, −6]`, `[12, 2]`, `[−2, 12]`                           | uno alto, come nella foto             |
| Pini inclinati / leccio (indicativo)              | pini `[−17, −12]`, `[−18, 0]`, `[16, 12]`; leccio `[17, −3]` | ai bordi                              |
| Panchine (indicative)                             | `[−6, 3]`, `[2, 5]`, `[−12, 8]`                              | collider box/ruotati con più box      |

Regole di piazzamento: NPC e interagibili a **≥ 1 m** da collider statici; lasciare corridoi larghi
**≥ 1.6 m** (Tony ha raggio 0.4). Edifici e tetti in coppi sono **fuori** dal rettangolo giocabile (cornice scenica).

## 5. API dei contratti (firme)

### 5.1 Input unificato — `src/game/core/input.ts`

Le sorgenti **scrivono**, i consumer **leggono**; nessuno legge eventi DOM direttamente.

```ts
class InputManager {
  get moveAxis(): Readonly<{ x: number; y: number }>;   // x: destra+, y: avanti+, |v| <= 1, analogico
  get run(): boolean;                                   // shift | touchRun | joystick >= AUTO_RUN_THRESHOLD(0.85)
  consumeLook(out: {x:number;y:number}): typeof out;    // pixel CSS accumulati, poi azzerati
  onAction(action: InputAction, cb: () => void): () => void;   // edge; ritorna unsubscribe
  // scrittura (sorgenti)
  setKey(code, down, repeat?): boolean;  setJoystick(x, y): void /* dead-zone 0.15 */;
  setTouchRun(on): void;  addLookDelta(dx, dy): void;  trigger(action): void;  reset(): void;
}
type InputAction = 'interact'|'advance'|'pause'|'missions'|'choice1'|'choice2'|'choice3';
export const input: InputManager;                       // singleton
attachKeyboard(target?, manager?) => detach             // keydown/up + reset su blur/visibilitychange/touchcancel
attachMouseLook(element, {enabled, onPointerLockLost}) => detach   // pointer lock solo mouse (desktop)
```

Tasti: WASD/frecce (move), Shift (run), E→`interact`, Spazio→`advance`, Esc→`pause`, M→`missions`, 1/2/3→`choiceN`.
Joystick: `setJoystick(x, y)` con **y > 0 = avanti** (inverti la y dello schermo). Look: `LOOK_RADIANS_PER_PIXEL × settings.mouseSensitivity`.
Hook: `useInputAction(action, handler)` (`src/hooks/useInputAction.ts`).
Instradamento: `pause`/`missions` in `src/app/GlobalActions.tsx`; `interact` in `InteractionSystem` (phase `playing`);
`advance`/`interact`/`choiceN` in `DialoguePanel` (phase `dialogue`, typewriter-aware). Esc in dialogo = chiude il dialogo.

### 5.2 Dispositivo e qualità — `src/game/core/device.ts`, `src/hooks/useDeviceProfile.ts`

```ts
interface DeviceProfile { isTouch; orientation: 'portrait'|'landscape'; isSmallViewport; viewportWidth; viewportHeight;
                          detectedQuality: 'high'|'low' }
interface QualityPreset { dprMax; shadowMapSize; ambientOcclusion; particleScale /*0..1*/; antialias }
interface ResolvedDeviceProfile extends DeviceProfile { qualityProfile: 'high'|'low'; preset: QualityPreset }
function useDeviceProfile(): ResolvedDeviceProfile;      // reattivo; qualityProfile rispetta settings.quality ('auto'|'high'|'low')
QUALITY_PRESETS.high = {1.75, 2048, AO sì, particelle 1}   QUALITY_PRESETS.low = {1.25, 1024, AO no, particelle 0.4}
```

`isTouch` = `pointer: coarse` oppure (`hover: none` e touch points > 0). `low` su touch o viewport piccolo
(< 768 px di larghezza o < 500 di altezza). Niente librerie di postprocessing: "AO" = finto (contact shadows).

### 5.3 Tipi di dominio — `src/game/core/types.ts`

`Vec2`, `ColliderShape` (`{kind:'circle',x,z,r} | {kind:'box',minX,maxX,minZ,maxZ}`), `NpcAppearance`
(`skin, shirt, pants, hair, hairStyle:'short'|'long'|'bald'|'cap'|'curly', height, build?, accessory?`),
`Character`, `NpcDefinition`, `Dialogue`/`DialogueNode`/`DialogueChoice`, `DialogueEffect` (union discriminata),
`Condition`, `Mission`/`MissionObjective`/`MissionReward`, `Achievement`, `Story`, `RandomStory`,
`InteractableDefinition`/`InteractionAction`, `PlayerProgress`, `Settings`, `GameSave`, `GameContent`.
Costanti: `DIALOGUE_END = '$end'`, `SPEAKER_TONY = 'tony'`, `SPEAKER_NARRATOR = 'narrator'`.

### 5.4 Collisioni — `src/game/core/collision.ts`

```ts
colliderRegistry.add(id, collider) / addMany(prefix, colliders) => dispose / remove(id) / removeByPrefix(p) / clear() / list()
resolveCircleVsColliders(p: {x,z}, radius, colliders, passes = 4): {x,z}   // in-place, slide lungo le pareti
raycast2D(ax, az, bx, bz, colliders, margin = 0): number                   // frazione 0..1 del primo impatto (camera)
overlapsAny(x, z, radius, colliders): boolean
```

Chi registra rimuove al cleanup. Id: `world:*` (registrati dall'app da `PIAZZA_COLLIDERS`), `npc:<id>` (Npcs).
`list()` restituisce un array stabile: leggibile ogni frame senza allocazioni.

### 5.5 Interazioni — `src/game/interactions/registry.ts`

```ts
interface InteractableDefinition { id; position: Vec2; radius; label /* "PARLA CON MARCO" */; action: InteractionAction;
                                   enabled?; disabledLabel?; priority? }
type InteractionAction = {type:'dialogue',dialogueId} | {type:'randomStory'} | {type:'collectible',itemId,effects?} | {type:'mission',missionId,objectiveId?}
interactionRegistry.register(def) => unregister / unregister(id) / setEnabled(id, bool) / get(id) / list() / findNearest(x, z)
findNearestInteractable(items, x, z)   // pura; include i disabilitati (per mostrare disabledLabel)
npcToInteractable(npc)                 // id `npc:<id>`, label "PARLA CON <NOME>"
RANDOM_STORY_LABEL = "SPARANE UN'ALTRA"
```

Prompt UI: `[E] <label>` su desktop; su touch il bottone contestuale mostra `<label>` (nessun `[E]`).

### 5.6 Motore dialoghi — `src/game/dialogue/engine.ts` (puro)

```ts
startDialogue(dialogue, progress): DialogueStep       // usa dialogue.repeatStart se gia' completato
advanceDialogue(dialogue, state, progress): DialogueStep
chooseDialogue(dialogue, state, index, progress): DialogueStep     // index = posizione tra le scelte VISIBILI
closeDialogue(state): DialogueStep                    // ended { completed:false }
type DialogueStep = { state: DialogueState; effects: readonly DialogueEffect[] }
type DialogueState = idle | active{line} | choice{line,choices:{index,sourceIndex,text}[]} | consequence{line,choiceText} | ended{completed}
validateDialogue(dialogue): string[]   evaluateCondition(cond, progress)
```

- `requires` su nodo non soddisfatto → `fallback` (o fine). `requires` su scelta → scelta nascosta.
- `consequence` = battuta raggiunta subito dopo una scelta (per la UI è come `active`).
- **Nessun blocco della progressione**: usare `repeatStart` per riaprire dialoghi completati; gli effetti
  `completeObjective`/`unlockStory`/`setFlag` sono idempotenti; `addCazzate` va marcato con `onceId` per evitare farming.

### 5.7 Progressione — `src/game/progression/*` (pure)

```ts
applyEffect(progress, effect, content): { progress, events: GameEvent[] }     // stessa referenza se nulla cambia
applyEffects(progress, effects, content)
type GameEvent = cazzateIncreased{amount,total,reason} | thresholdReached{threshold:25|50|75|100,message} | missionStarted{missionId}
               | objectiveCompleted{missionId,objectiveId,completed,total} | missionCompleted{missionId,reward}
               | achievementUnlocked{achievementId,points} | storyUnlocked{storyId,points} | celebration{kind}
eventToNotification(event, content) / eventToSfx(event)          // notifications.ts
getCurrentMission / listMissions / summarizeMission              // src/game/quests/selectors.ts
```

Missione completata automaticamente a tutti gli obiettivi fatti → assegna `reward` (Cazzatometro + `points`

- achievement + story). `completeObjective` su missione non avviata la avvia. Cazzatometro clampato 0–100;
  soglie con i messaggi esatti; 100 emette anche `celebration{finale}`.

### 5.8 Store — `src/store/gameStore.ts`

```ts
phase: 'loading'|'menu'|'intro'|'playing'|'paused'|'dialogue'|'ending'
panel: 'none'|'pause'|'missions'|'legends'|'settings'|'howto'|'credits'
progress, settings, hasSave, dialogue:{state,dialogueId,interactableId}, notifications: GameNotification[],
nearbyPrompt: string|null, nearbyPromptDisabled, tutorialStep:'move'|'look'|'run'|'interact'|'done',
celebration:{kind,nonce}|null, endingRevealed
actions: markSceneReady, newGame, continueGame, finishIntro, pause, resume, openPanel, closePanel, toggleMissions,
  startDialogue(id,{interactableId?}), advanceDialogue, chooseDialogue(i), closeDialogue, interact(id), applyEffects,
  resetProgress, updateSettings(patch), pushNotification, dismissNotification, returnToMenu, restart,
  setNearbyPrompt(prompt, disabled?), advanceTutorial(from), clearCelebration, revealEnding
```

Fasi: `loading`→(`SceneReady`)→`menu`→(newGame/continue)→`intro` (timer `PhaseTimers`)→`playing`⇄`paused`/`dialogue`→`ending`.
Autosave su ogni cambio di `progress`/`settings`. `resetProgress` mantiene le impostazioni.
Per codice non React: `gameStore.getState().x`; per React: `useGameStore((s) => s.x)`.

### 5.9 Salvataggio — `src/game/core/save.ts`

`SAVE_VERSION = 1`, chiave `tony-sparane-un-altra:save`, `MIGRATIONS` (map `versione → fn(data)`),
`loadGame/saveGame/clearSave` con try/catch, `parseSave`, `sanitizeProgress`. Corrotto/versione futura/storage
bloccato → il gioco parte da zero senza eccezioni. Per cambiare lo schema: `SAVE_VERSION++` + migrazione.

### 5.10 Camera — modalità guidate dalla fase (Gameplay)

`menu` (orbita lenta attorno a Tony in `'pose'`) · `intro` (dolly verso il follow, `INTRO_DURATION_MS`) ·
`follow` · `dialogue` (inquadra `runtime.dialogue.targetX/Z` se `hasTarget`, altrimenti Tony da vicino) ·
`celebration` (frontale su Tony in `victory`). `cameraModeForPhase(phase)` è esportata.

### 5.11 Interfacce World (concordate)

```ts
// src/world/environments/Piazza.tsx          export function Piazza(): JSX.Element     (SOLO visivo)
// src/world/environments/piazzaColliders.ts  export const PIAZZA_COLLIDERS: readonly ColliderShape[]
//                                            export const PIAZZA_POINTS: { spawn, spawnRotationY, npcArea, bike, stationExit, stands, sparane[] }
// src/world/lighting/Lighting.tsx            export function Lighting({ quality }: { quality: 'high' | 'low' })
// src/world/npcs/NpcModel.tsx                export const NpcModel = forwardRef<NpcRig, NpcModelProps>
//    NpcRig = { root: Group; torso: Object3D; head: Object3D }
//    NpcModelProps = { appearance: NpcAppearance; pose?: 'stand'|'sit'|'lean' }
// src/world/props/Bicycle.tsx                export const Bicycle = forwardRef<Group, { wobble?: number }>   // wobble 0..1
// src/game/entities/TonyModel.tsx            export function TonyModel({ anim }: { anim: TonyAnimSource })
```

- **Pivot di attenzione**: `rig.head` e `rig.torso` sono **di proprietà di Gameplay** (scrive `head.rotation.y`,
  `torso.rotation.y`); World anima solo nodi interni (respiro/idle) e **non scrive mai** quei due pivot. `head` è figlio di `torso`.
- `TonyModel` non si muove da solo: il genitore (`PlayerController`) posiziona il gruppo; `TonyModel` legge `anim`
  in `useFrame`. Il modello è sostituibile con GLB mantenendo `TonyModelProps`/`anim` (nessun cambio a controller/camera/logica).
- Asset Tony: `ASSET_PATHS` e `MISSING_REFERENCE_ASSETS` in `src/data/assets.ts`. **`front/left/right.jpg` NON esistono**
  (flag `available:false`): niente volto ricostruito da una foto mancante. Riferimento abbigliamento: `over-shoulder.jpg`
  (bomber in raso verde-acqua con colletto a righe arancio/bianco/blu notte, barba scura corta, occhiali da sole sulla testa).
  Ritratto per i dialoghi: `portrait.jpg`. Riferimento piazza: `piazza/reference.jpg`.

## 6. Come aggiungere contenuti (solo dati)

- **NPC**: aggiungere a `src/data/npcs/` (`NpcDefinition`, `watchesTony = gender==='male'`, `dialogueId`), posizione `[x,z]`
  valida (§4). Collider e interagibile (`npc:<id>`) li registra `Npcs.tsx`: nessun codice da toccare.
- **Dialogo**: `src/data/dialogues/` (`Dialogue` con nodi; effetti nei nodi/scelte; `repeatStart` per la riapertura).
- **Missione**: `src/data/missions/` (+ obiettivi, `reward`); gli obiettivi si completano con `completeObjective` nei dialoghi
  o con interagibili `{type:'mission'}`. Ricompensa automatica al completamento.
- **Storia (leggenda)** / **Achievement**: `src/data/stories/`, `src/data/achievements/` (`icon` = nome lucide-react).
- **"SPARANE UN'ALTRA"**: frase in `src/data/randomStories/` + (se serve) punto in `src/data/interactables/`.
- Dopo ogni modifica ai dati: `npm test` (il test `content.test.ts` verifica riferimenti incrociati e dialoghi).

## 7. Convenzioni

- TypeScript **strict** + `noUncheckedIndexedAccess`; **niente `any`** (ESLint lo vieta); import con `@/` (alias di `src/`).
- **Niente allocazioni per frame** in `useFrame`: niente `new Vector3()`/oggetti/array letterali nel loop; pre-alloca con
  `useMemo`/`useRef` o variabili di modulo. Niente `setState`/store `set` per frame.
- **Frame-rate indipendente**: usa `dt` clampato (`MAX_FRAME_DT`) e `damp`/`dampAngle` (smorzamento esponenziale).
- **Cleanup**: ogni registrazione (collider, interagibile, listener, timer, pointer lock) ha il suo cleanup nell'effect.
- Riusa geometrie/materiali (module scope o `useMemo`), `InstancedMesh` per ripetizioni (alberi, panchine, ecc.);
  dispose di ciò che crei a mano.
- Rispetta `preset.shadowMapSize`/`particleScale`/`ambientOcclusion` dal profilo qualità; target 60 FPS desktop, 30+ su smartphone medio.
- **Mobile/touch** (UI/UX): layout responsive da **360 px**, portrait e landscape (suggerimento "ruota" non bloccante);
  safe-area (`var(--safe-top|right|bottom|left)`); `touch-action: none` sul canvas; target ≥ 44 px; niente hover-only;
  HUD compatto su schermi piccoli; mai scroll/zoom/selezione accidentali.
- Testi di gioco in **italiano**; identificatori e commenti di codice in inglese/italiano coerenti col file; niente emoji nei docs.
- Contenuti: **satira surreale**; niente violenza, armi, sostanze o sessualità esplicita; riferimenti a persone reali
  chiaramente fittizi (vedi `GAME_DESIGN.md`).
- Commit: Conventional Commits; ogni commit compila e passa typecheck/lint/test/build.
