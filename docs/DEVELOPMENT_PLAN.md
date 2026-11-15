# DEVELOPMENT PLAN

## 1. Analisi dei requisiti

| Requisito (da `prompt.md`)                                        | Priorità                             | Dipendenze tecniche                                                     |
| ----------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Menu iniziale con piazza 3D sullo sfondo e camera orbitante       | MVP                                  | scena sempre montata, camera in modalità `menu`                         |
| Tony giocabile, terza persona, camera fluida con mouse/drag touch | MVP                                  | `input`, `PlayerController`, `ThirdPersonCamera`, `runtime`             |
| Piazza 3D stilizzata con collisioni semplici                      | MVP                                  | `Piazza`, `PIAZZA_COLLIDERS`, `collision`                               |
| ≥ 3 NPC interattivi, maschili che seguono Tony con lo sguardo     | MVP                                  | `Npcs`, `NpcModel`, `attention`                                         |
| Interazioni generiche + dialoghi a scelte (motore dati)           | MVP                                  | `registry`, `engine`, `DialoguePanel`                                   |
| Missione 1 giocabile, Cazzatometro, soglie, finale                | MVP                                  | `applyEffect`, store, `EndingScreen`                                    |
| HUD, pausa, registro leggende, impostazioni                       | MVP                                  | UI/UX                                                                   |
| Salvataggio versionato + azzera progressi                         | MVP                                  | `save`, autosave                                                        |
| **Touch/mobile pienamente giocabile**                             | MVP                                  | input unificato, `TouchControls`, `useDeviceProfile`, layout responsive |
| Audio sintetizzato con volume/mute                                | MVP (base)                           | `sfx`                                                                   |
| Missioni 2–6, minigioco scuse (missione 3)                        | Secondario (dopo la slice)           | solo dati + eventuale UI minigioco                                      |
| Bonus (matite, "i cinque euro", racconto casuale)                 | Secondario                           | dati + `randomStory`                                                    |
| Animazioni ambientali, particelle, rifiniture grafiche            | Secondario                           | World                                                                   |
| GLB di Tony con texture facciale                                  | Fuori MVP (mancano le foto frontali) | `TonyModel` sostituibile                                                |

## 2. Piano di implementazione

1. **Architecture** (questa fase): scaffold, docs, contratti, store, salvataggio, motore dialoghi, collisioni, input, shell con stub.
2. **In parallelo, cartelle disgiunte**: World&3D (ambiente, luci, modelli, collider, `PIAZZA_POINTS`), Gameplay (player, camera, NPC, interazioni, dati),
   UI/UX (menu, HUD, dialoghi, notifiche, touch, audio).
3. **Integrazione** (Orchestratore): merge, risoluzione di `worldBindings.ts`, verifica contratti, vertical slice (missione 1).
4. **Contenuti**: missioni 2–6, bonus, minigioco.
5. **QA**: test E2E desktop+mobile, regressioni, ottimizzazione, README finale.

Ogni passo = commit Conventional Commits compilanti; verifiche obbligatorie prima del commit: `typecheck`, `lint`, `test`, `build`.

## 3. Rischi

| Rischio                                              | Impatto                       | Mitigazione                                                                                                 |
| ---------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Merge tra agenti paralleli                           | Conflitti/regressioni         | Mappa di proprietà (`CONTRACTS.md`), `worldBindings.ts` come unico punto di giunzione, test su contratti    |
| Prestazioni su smartphone                            | Gioco poco fluido             | Profilo `low` (dpr 1.25, ombre 1024, no AO), instancing, niente allocazioni per frame, target 30+ FPS       |
| Input touch (joystick/camera/dialoghi)               | Gioco non giocabile su mobile | Input unificato testato, `TouchControls` dedicato, project Playwright mobile                                |
| Pointer lock e Esc                                   | Pausa non intercettata        | `pointerlockchange` → azione `pause`                                                                        |
| Foto frontali di Tony mancanti                       | Volto non riconoscibile       | Personaggio procedurale ispirato a `over-shoulder.jpg` + ritratto nei dialoghi; nessuna promessa di fedeltà |
| Contenuti sensibili (persone reali, sostanze, armi)  | Rischio editoriale/legale     | Linee guida in `GAME_DESIGN.md` §1, riferimenti fittizi, niente rappresentazioni esplicite                  |
| Salvataggio corrotto / schema cambiato               | Perdita progressi / crash     | Versioning, migrazioni, sanitizzazione, fallback sicuro, test                                               |
| Dialoghi che bloccano la progressione                | Demo non completabile         | `repeatStart`, effetti idempotenti, `onceId`, test di raggiungibilità degli obiettivi                       |
| Dipendenze molto recenti (Vite 8, TS 6, three 0.187) | Incompatibilità               | Coppie verificate (R3F 9 + drei 10 + React 19; TS 6.0 per typescript-eslint); build e test in CI locale     |

## 4. Criteri di accettazione verificabili

Legenda verifica: **U** = test unitario/integrazione (Vitest), **E** = Playwright (scritto, **non eseguito**), **M** = verifica manuale.
Stato: [x] = verificato da test automatici o dal codice; [ ] = **da collaudare a mano** (richiede browser o dispositivo).

| #   | Criterio                                                                                                            | Verifica           | Stato                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------- |
| 1   | `npm run build` senza errori; `typecheck` e `lint` puliti                                                           | comandi            | [x] eseguiti a ogni commit                                                |
| 2   | La pagina si carica senza errori in console (escluse note di driver WebGL)                                          | E                  | [ ] da collaudare a mano                                                  |
| 3   | Il menu mostra NUOVA PARTITA, COME SI GIOCA, CREDITI; CONTINUA solo con salvataggio                                 | U + E              | [x] U (`MainMenu.test`, store); E non eseguito                            |
| 4   | La piazza 3D è visibile dietro il menu con camera orbitante e Tony in posa                                          | M                  | [ ] da collaudare a mano                                                  |
| 5   | Tony cammina e corre; il movimento è relativo alla camera                                                           | U + E              | [x] logica U (`movementMath`); resa in gioco [ ] da collaudare            |
| 6   | La camera segue con interpolazione, ruota col mouse/drag, non è coperta da muri                                     | M + U              | [x] U (`raycast2D`, `cameraShots`); fluidità [ ] da collaudare            |
| 7   | Tony non attraversa edifici, panchine, NPC                                                                          | U + E              | [x] U (`collision`); [ ] verifica in scena                                |
| 8   | ≥ 3 NPC interattivi; gli NPC `watchesTony` girano la testa e tornano a riposo                                       | U + M              | [x] U (`attention`, dati: 11 NPC); resa [ ] da collaudare                 |
| 9   | Prompt "[E] PARLA CON ..."; E apre il dialogo; movimento bloccato in dialogo                                        | U + E              | [x] U (store: fase `dialogue`; `PlayerController` azzera la velocità)     |
| 10  | Le scelte producono reazioni diverse e modificano lo stato                                                          | U                  | [x]                                                                       |
| 11  | Dialoghi chiudibili (Esc) e riapribili; un dialogo completato non blocca la progressione                            | U                  | [x]                                                                       |
| 12  | Missione 1 completabile; assegna +15, achievement e storia; toast                                                   | U + E              | [x] U (simulazione sui dati reali)                                        |
| 13  | Cazzatometro 0–100 con soglie e messaggi esatti; a 100 compare il finale. Tetto a 95 finché non c'è il K.O. tecnico | U + E              | [x] U (store, `cazzatometro`, `finale.test`); schermata [ ] da collaudare |
| 14  | Progresso salvato e ripristinato dopo refresh; "Azzera progressi" funziona; salvataggio corrotto non crasha         | U + E              | [x] U (`save.test`, store con storage in memoria)                         |
| 15  | Pausa (Esc) con tutte le voci; registro missioni (M) e registro leggende                                            | E                  | [x] U sui componenti (`PauseMenu.test`, `Logs.test`); [ ] collaudo reale  |
| 16  | Si può ricominciare dopo il finale                                                                                  | U + E              | [x] U (restart/returnToMenu dopo il finale e dopo il K.O.)                |
| 17  | Perdita di focus/visibilità azzera i comandi                                                                        | U                  | [x] (`input.test`)                                                        |
| 18  | Mobile (Pixel 7): joystick, camera a trascinamento, pulsante interazione, pausa e missioni; dialoghi a tap          | E (project mobile) | [x] U sui componenti (`TouchControls.test`); [ ] collaudo su telefono     |
| 19  | Layout utilizzabile da 360 px in portrait e landscape; safe-area; nessuno scroll/zoom accidentale                   | E + M              | [ ] da collaudare a mano                                                  |
| 20  | 60 FPS desktop / 30+ FPS smartphone medio (profilo `low`)                                                           | M                  | [ ] da collaudare a mano                                                  |
| 21  | Sottotitoli per ogni dialogo, opzione "riduci animazioni", dialoghi completabili da tastiera                        | U + M              | [x] U (`DialoguePanel`, impostazioni); [ ] verifica a mano                |

Lista §20 Fase 5 del prompt: la logica (collisioni, scelte, missioni, Cazzatometro, salvataggio/ripristino, finale, ricomincio) è coperta da test; "la pagina si carica", "Tony cammina/corre", "la camera segue" e "gli NPC reagiscono" come resa visiva sono **da collaudare a mano**.

Missioni 2–6 e bonus: ogni missione ha obiettivi raggiungibili (guardia automatica in `content.test.ts`) e ricompensa verificata da test.

## 5. Check degli asset

| Asset                                                   | Stato                | Uso                                                                                                            |
| ------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `public/assets/tony/portrait.jpg`                       | presente             | ritratto nei dialoghi                                                                                          |
| `public/assets/tony/additional/over-shoulder.jpg`       | presente             | riferimento abbigliamento/capelli di Tony                                                                      |
| `public/assets/piazza/reference.jpg`                    | presente             | riferimento principale della piazza                                                                            |
| `public/assets/tony/front.jpg`, `left.jpg`, `right.jpg` | **mancanti**         | placeholder esplicito (`MISSING_REFERENCE_ASSETS`, `available:false`); nessun volto 3D da angolazioni mancanti |
| `public/assets/{models,textures,audio}`                 | vuote (`.gitkeep`)   | audio sintetizzato a runtime; modelli GLB futuri                                                               |
| `Foto/`                                                 | cartella dell'utente | **non toccata e non versionata** (`.gitignore`)                                                                |

L'utente deve avere titolo a usare le fotografie fornite; i contenuti su persone reali restano finzione dichiarata.

## 6. Stato funzionalità

**Completo (verificato da test e build):** scaffold, contratti, motore dialoghi, progressione, collisioni, input unificato,
salvataggio versionato, store, piazza e NPC, missioni 1-6 e bonus, Cazzatometro, UI (menu, HUD, pausa, registri, impostazioni),
controlli touch, audio sintetizzato, livello finale "La notte dell'Intercity" (3 tappe, countdown, K.O. tecnico, tetto a 95),
ritratti/nomi per i personaggi del finale (`GameContent.speakers`), occluder della camera nei livelli del finale,
capelli di Tony corretti (ciuffo, niente chignon).

**Scritto ma non eseguito:** spec Playwright in `e2e/` (desktop e mobile).

**Da collaudare a mano:** resa visiva e fluidità (criteri 2, 4, 19, 20), comfort dei controlli touch su telefono reale, tempi del
percorso verso un NPC negli e2e.

**Limiti noti:** nessun GLB reale di Tony e nessuna foto frontale; NPC `pace`/`wave` statici; il livello del finale non è
persistito (dopo un refresh si riparte dalla piazza); nessuna musica.

## 7. Livello finale — "La notte dell'Intercity"

Dopo le altre missioni la piazza offre il racconto finale (`finale:start`): flashback in tre tappe con cartoline di transizione.
**Pisa** (binario, countdown di 90 s con "ritardo" senza game over, 40 € da Bogdan) -> **Viareggio** (colletta alla romana con
Nico, Vale, Ricky e Bogdan, 35 € di taxi) -> **Torre del Lago di notte** (ultima richiesta a Bogdan, scena del K.O. tecnico).
Solo la fine della scena accende il flag permanente `finale.ko`, toglie il tetto del Cazzatometro (95) e porta a 100.
Codice in `src/levels/intercity/`, contratti in `docs/CONTRACTS.md` §8, test in `src/levels/intercity/**/*.test.ts`,
`src/store/finale.test.ts`, `src/ui/finale/finale.test.tsx`.
