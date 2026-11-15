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

Legenda verifica: **U** = test unitario/integrazione (Vitest), **E** = Playwright, **M** = verifica manuale/screenshot.

| #   | Criterio                                                                                                                                   | Verifica                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| 1   | `npm run build` termina senza errori; `typecheck` e `lint` puliti                                                                          | comandi                         |
| 2   | La pagina si carica senza errori in console (escluse note di driver WebGL)                                                                 | E                               |
| 3   | Il menu mostra NUOVA PARTITA, COME SI GIOCA, CREDITI; CONTINUA solo con salvataggio                                                        | U + E                           |
| 4   | La piazza 3D è visibile dietro il menu con camera orbitante e Tony in posa                                                                 | M (screenshot)                  |
| 5   | Tony cammina (WASD/frecce) e corre (Shift); il movimento è relativo alla camera                                                            | U (`inputToWorldDirection`) + E |
| 6   | La camera segue con interpolazione, ruota col mouse (desktop) / trascinamento (touch), non è coperta da muri                               | M + U (`raycast2D`)             |
| 7   | Tony non attraversa edifici, panchine, NPC (slide lungo le pareti)                                                                         | U (`collision`) + E             |
| 8   | ≥ 3 NPC interattivi; gli NPC `watchesTony` girano la testa entro il raggio e tornano a riposo                                              | U (`computeAttention`) + M      |
| 9   | Prompt "[E] PARLA CON <NOME>" vicino a un NPC; E apre il dialogo; movimento bloccato in dialogo                                            | U (store) + E                   |
| 10  | Le scelte producono reazioni diverse e modificano lo stato (Cazzatometro, obiettivi)                                                       | U                               |
| 11  | Dialoghi chiudibili (Esc) e riapribili; un dialogo completato non blocca la progressione                                                   | U                               |
| 12  | Missione 1 completabile; assegna +15, achievement e storia; toast di completamento                                                         | U + E                           |
| 13  | Cazzatometro 0–100 con soglie e messaggi esatti; a 100 compare il finale con punteggio e statistiche                                       | U + E                           |
| 14  | Il progresso è salvato e ripristinato dopo refresh; "Azzera progressi" funziona; salvataggio corrotto non crasha                           | U + E                           |
| 15  | Pausa (Esc) con tutte le voci; registro missioni (M) e registro leggende (`?` per le non scoperte)                                         | E                               |
| 16  | Si può ricominciare dopo il finale                                                                                                         | U + E                           |
| 17  | Perdita di focus/visibilità azzera i comandi (nessun tasto "incastrato")                                                                   | U                               |
| 18  | Mobile (Pixel 7, touch): joystick, camera a trascinamento, pulsante interazione con etichetta, pausa e missioni funzionano; dialoghi a tap | E (project mobile)              |
| 19  | Layout utilizzabile da 360 px in portrait e landscape; safe-area rispettate; nessuno scroll/zoom/selezione accidentale                     | E (viewport) + M                |
| 20  | 60 FPS desktop / 30+ FPS smartphone medio (profilo `low`)                                                                                  | M (misura)                      |
| 21  | Sottotitoli per ogni dialogo, opzione "riduci animazioni", dialoghi completabili da tastiera                                               | U + M                           |

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

## 6. Stato funzionalità (da aggiornare dal QA)

Completo: scaffold, contratti, motore dialoghi, progressione, collisioni, input unificato, salvataggio, store, shell con stub.
Da fare: ambiente 3D definitivo, modelli, player/camera rifiniti, NPC e dati finali, UI definitiva, touch rifinito, audio, missioni 2–6, test E2E.
