# ARCHITECTURE

## 1. Stack e scelte

| Area     | Scelta                                                                                 | Note                                                     |
| -------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| UI / app | React 19.3, TypeScript 6.0 (strict + `noUncheckedIndexedAccess`), Vite 8               | TS 6.0 e non 7: `typescript-eslint` richiede `<6.1`.     |
| 3D       | three 0.187, @react-three/fiber 9.8 (React 19), @react-three/drei 10.7                 | R3F 9 / drei 10 sono la coppia compatibile con React 19. |
| Stato    | zustand 5 (store vanilla + hook)                                                       | Dati per-frame in `runtime` (non reattivo).              |
| UI extra | CSS Modules, lucide-react                                                              | HUD in HTML sopra il canvas.                             |
| Test     | Vitest 5 + Testing Library + jsdom; Playwright (solo pacchetto, browser da installare) | Due project E2E: desktop e mobile (Pixel 7, touch).      |
| Tooling  | ESLint 10 (flat config, typescript-eslint, react-hooks), Prettier                      |                                                          |
| Deploy   | Vercel (`vercel.json`, SPA Vite)                                                       | Nessun backend.                                          |

Niente motore fisico, router, librerie di postprocessing o altre dipendenze.

## 2. Livelli e dipendenze (unidirezionali)

```
 presentation   src/ui/**            overlay HTML (menu, HUD, dialoghi, touch)           ──► store, data (lettura), hooks
 scene 3D       src/world/**         ambiente, luci, modelli, props                      ──► core (tipi, device), runtime
                src/game/entities/** modello visivo di Tony
 gameplay       src/game/{movement,camera,interactions,systems}/**  (componenti R3F + sistemi) ──► core, store, runtime
 dominio        src/game/{core,progression,dialogue,quests}/**   logica PURA, nessun React/Three
 stato          src/store/**         gameStore (zustand, reattivo) + runtime (mutabile)  ──► dominio
 dati           src/data/**          contenuti dichiarativi (npc, dialoghi, missioni…)    ──► dominio (tipi)
 infrastruttura src/game/core/{save,input,device}.ts, src/audio/**, src/hooks/**
 composizione   src/app/**           App, GameCanvas, GlobalActions, PhaseTimers, worldBindings
```

Regole: il dominio non importa React, Three, store o UI. Lo store importa dominio e dati, non componenti.
La UI non contiene logica di gioco: chiama azioni dello store. I componenti R3F leggono `runtime` in `useFrame`.
Nessun bus di eventi globale non tipizzato: gli eventi sono la union `GameEvent`, prodotta da funzioni pure.

## 3. Moduli chiave

- **Dominio puro**: `applyEffect(progress, effect, content)` → `{progress, events}`; `engine` dialoghi (state machine
  `idle/active/choice/consequence/ended`, condizioni `requires/fallback`, `repeatStart`); `collision` (cerchio vs box/cerchi con slide,
  raycast 2D per la camera); `registry` interagibili con `findNearest`; `randomStory` senza ripetizioni; `device` (profilo e preset qualità).
- **Input unificato** (`input.ts`): `moveAxis` analogico, `run`, `consumeLook`, azioni edge. Tastiera, mouse (pointer lock solo desktop) e
  touch sono **sorgenti** che scrivono; PlayerController/camera/UI **consumano**. Reset su blur, visibilitychange e touchcancel.
- **Store** (`createGameStore(deps)` con dipendenze iniettate → testabile; singleton in `gameStore.ts`): fase di gioco, progresso,
  impostazioni, sessione di dialogo, coda notifiche, tutorial, celebrazione, autosave.
- **Runtime** (`runtime.ts`): posizione/rotazione/velocità, `anim`, camera, target dialogo, interagibile vicino.
- **Contenuti**: `createContent` indicizza gli array di `src/data`; `validateContent` (e `content.test.ts`) verifica i riferimenti.

## 4. Flusso dei dati

Input → `PlayerController` (legge `input` e `runtime.camera.yaw`, risolve collisioni, scrive `runtime.player/anim`) →
`TonyModel` (legge `runtime.anim`) e `ThirdPersonCamera` (legge `runtime.player`, scrive `runtime.camera`).
`InteractionSystem` → `store.interact` → motore dialoghi → `applyEffects` → eventi → notifiche/sfx/fase. Dettaglio in `CONTRACTS.md` §3.

## 5. Salvataggio

`localStorage`, `GameSave { version, savedAt, progress, settings }`, `SAVE_VERSION` + catena `MIGRATIONS`. Validazione e
sanitizzazione campo per campo; corrotto, versione futura o storage bloccato → fallback sicuro (nuova partita). Autosave su
ogni modifica di `progress`/`settings`. "Azzera progressi" mantiene le impostazioni.

## 6. Prestazioni e dispositivi

- `useDeviceProfile()` rileva touch/orientamento/viewport e calcola `qualityProfile` (`high|low`), sovrascrivibile da `settings.quality`.
  `low`: dpr ≤ 1.25, shadow map 1024, niente finto-AO, particelle ×0.4, niente antialias.
- Scena sempre montata dietro i menu; Suspense + `LoadingScreen`; `PCFShadowMap` (`shadows="percentage"`).
- `useFrame` senza allocazioni; materiali/geometrie riusati; instancing per elementi ripetuti; `dt` clampato.
- Mobile: layout da 360 px, safe-area, `touch-action: none`, pointer lock solo desktop, target 30+ FPS su smartphone medio.

## 7. Strategia di test

- **Unit (Vitest)**: dominio puro (progressione, dialoghi, collisioni, input, save/migrazioni, device, interazioni, store integrato).
- **Dati**: `content.test.ts` come guardia di coerenza dei contenuti.
- **UI (Testing Library)**: componenti overlay via store (il Canvas WebGL non si monta in jsdom).
- **E2E (Playwright, QA)**: menu, movimento, dialogo, missione, finale, refresh/persistenza; project desktop e mobile.

## 8. Estendibilità

Aggiungere missioni/NPC/storie/frasi = solo dati (`CONTRACTS.md` §6). Sostituire Tony con un GLB = rimpiazzare `TonyModel`
mantenendo `anim: TonyAnimSource`. Nuove versioni dello schema di salvataggio = `SAVE_VERSION++` + migrazione.
