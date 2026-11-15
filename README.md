# TONY SPARANE UN'ALTRA

_Le leggende della piazzetta._ Avventura comica 3D nel browser (React Three Fiber), ispirata a una versione
stilizzata della piazza di Torre del Lago Puccini. Giocabile da desktop e da smartphone/tablet (touch).

> **Disclaimer.** Il gioco è una **satira surreale fra amici, interamente di finzione**. Personaggi, storie e
> situazioni sono inventati o iperbolici: ogni riferimento a persone o fatti reali è una vanteria di Tony a cui
> nessuno crede, mai la ricostruzione di fatti veri. Nessuna violenza, arma, sostanza o contenuto sessuale
> esplicito. Nessun marchio, volto o voce di artisti reali.

## Requisiti

- Node.js `^20.19` oppure `>=22.12` (consigliato 22, vedi `.nvmrc`) e npm
- Browser con WebGL2 (desktop o smartphone/tablet con touch)

## Installazione e avvio

```bash
npm install
npm run dev                 # http://localhost:5173
npm run dev -- --host       # accessibile da altri dispositivi della rete locale
```

**Da telefono in LAN:** avvia `npm run dev -- --host`, poi apri sul telefono l'indirizzo `Network` stampato da
Vite (es. `http://192.168.1.x:5173`). Telefono e PC devono stare sulla stessa rete Wi-Fi; se non si apre,
consenti Node nel firewall di Windows.

## Build, anteprima, test

```bash
npm run build         # tsc -b && vite build  -> dist/
npm run preview       # serve dist/ su http://localhost:4173
npm run typecheck     # TypeScript strict
npm run lint          # ESLint (flat config)
npm run format:check  # Prettier (verifica); `npm run format` per applicare
npm test              # Vitest: unit + integrazione con lo store
```

### Test end-to-end (Playwright)

Gli spec in `e2e/` coprono menu, nuova partita, CONTINUA dopo refresh, movimento, pausa, dialogo e controlli
touch. Due project: `desktop-chromium` e `mobile-pixel7`.

```bash
npx playwright install chromium   # una tantum
npm run test:e2e                  # builda, avvia il preview su :4173 e lancia gli spec
```

> **Stato:** gli spec e2e sono **scritti ma non ancora eseguiti** (il collaudo nel browser non è stato fatto in
> fase di sviluppo). Il percorso verso un NPC in `gameplay.desktop.spec.ts` ha tempi indicativi da tarare al
> primo giro.

## Controlli

| Azione           | Desktop                                               | Touch                                                      |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| Movimento        | WASD / frecce                                         | joystick virtuale flottante (metà sinistra)                |
| Corsa            | Shift                                                 | joystick spinto oltre l'85% o pulsante Corri               |
| Camera           | mouse (click per il pointer lock)                     | trascinamento nell'area destra                             |
| Interazione      | E                                                     | pulsante contestuale con l'etichetta (es. PARLA CON MARCO) |
| Avanza dialogo   | Spazio / E / click; scelte con 1-2-3 o frecce + Invio | tap sul pannello; pulsanti scelta grandi                   |
| Pausa / Missioni | Esc / M                                               | pulsanti in alto                                           |

Perdendo il focus della finestra (blur, cambio tab, touchcancel) tutti i comandi vengono azzerati. In dialogo Tony
non si muove; Esc chiude il dialogo.

## Struttura del codice

```
src/app/            composizione (App, GameCanvas, PiazzaLevel, worldBindings: unico punto di giunzione col mondo 3D)
src/game/           core (tipi, input, collisioni, save, device), progression, dialogue, quests,
                    interactions, movement, camera, systems, entities (TonyModel)
src/world/          environments (piazza), lighting, props, npcs (scena 3D della piazza)
src/levels/intercity/  livello finale "La notte dell'Intercity": data (cast, dialoghi, missione), logic pura
                    (regole, collider, K.O.), env (Pisa, Viareggio, Torre del Lago), actors
src/ui/             menus, hud, dialogues, notifications, touch, finale
src/data/           contenuti dichiarativi (missioni, dialoghi, npc, storie, achievement, frasi)
src/store/          gameStore (zustand, stato reattivo) e runtime (stato per-frame mutabile)
src/hooks/          useDeviceProfile, useInputAction
src/audio/          effetti sonori sintetizzati con WebAudio
e2e/                test Playwright
docs/               ARCHITECTURE, GAME_DESIGN, CONTRACTS, DEVELOPMENT_PLAN
```

Leggi prima `docs/CONTRACTS.md` (proprietà dei file, runtime vs store, flusso interazione -> dialogo -> effetti).

## Come estendere (solo dati)

Dettagli in `docs/CONTRACTS.md` §6. I contenuti sono validati da `src/data/content.test.ts`
(riferimenti incrociati, obiettivi raggiungibili).

- **Missione**: aggiungi un oggetto in `src/data/missions/index.ts` (id, titolo, obiettivi, ricompensa) e completa
  gli obiettivi con effetti `completeObjective` nei nodi dei dialoghi (`src/data/dialogues/`).
- **NPC**: aggiungi una `NpcDefinition` in `src/data/npcs/index.ts` (aspetto, posizione, `idleBehaviour`,
  `dialogueId`) più il dialogo in `src/data/dialogues/`. Collider, prompt "PARLA CON ..." e sguardo
  (`watchesTony`) sono automatici. Per chi parla senza essere un NPC della piazza usa `GameContent.speakers`
  (vedi `src/levels/intercity/data/speakers.ts`).
- **Storia (leggenda)**: aggiungi una voce in `src/data/stories/index.ts` e sbloccala con l'effetto
  `unlockStory` in un dialogo o come premio di missione (`reward.storyId`).
- **Frase "SPARANE UN'ALTRA"**: aggiungi una riga in `src/data/randomStories/`; ogni frase dà Cazzatometro una
  sola volta (anti-farming).
- **Sostituire il modello 3D di Tony con un GLB**: esporta il modello (origine ai piedi, +Z avanti, ~1.8 m) in
  `public/assets/models/tony.glb`, poi in `src/game/entities/TonyModel.tsx` imposta
  `TONY_MODEL_CONFIG.source = 'glb'`. Clip opzionali con i nomi degli stati (`idle`, `walk`, `run`, `talk`,
  `gesture`, `interact`, `victory`, `pose`; i mancanti ripiegano su `idle`). Controller, camera e logica non
  cambiano.

## Pubblicazione

Il gioco è una singola pagina statica: nessun backend, nessuna variabile d'ambiente. Build `npm run build`,
output `dist`, Node 22 (`.nvmrc`).

- **Vercel**: importa il repository Git su vercel.com; `vercel.json` fa rilevare il preset Vite (build
  `npm run build`, output `dist`, rewrite SPA verso `index.html`). Oppure `npx vercel` / `npx vercel --prod`.
- **Netlify**: importa il repository Git su netlify.com; le impostazioni (build `npm run build`, publish `dist`,
  Node 22, redirect SPA) sono lette da `netlify.toml`.

## Funzionalità complete

Verificate da test automatici (Vitest, 370+ test) o dal codice; la resa visiva va comunque collaudata a mano.

- Menu iniziale con piazza 3D dietro e camera orbitante; CONTINUA solo con salvataggio; come si gioca; crediti
  con disclaimer; impostazioni (volume, mute, riduci animazioni, distanza camera, sensibilità, qualità,
  azzera progressi).
- Tony giocabile in terza persona (camminata, corsa, camera con anti-occlusione, collisioni con scivolamento);
  input unificato tastiera/mouse/touch con reset su perdita di focus.
- Piazza stilizzata e 11 NPC; gli NPC `watchesTony` girano la testa verso Tony ("TUTTI GUARDANO TONY").
- Motore di dialoghi a scelte con effetti, 6 missioni + bonus (matite, i cinque euro, racconto casuale
  "SPARANE UN'ALTRA"), Cazzatometro 0-100 con soglie e messaggi, achievement, registro delle leggende.
- Finale in due atti: **tetto del Cazzatometro a 95** finché non si vive "La notte dell'Intercity" (Pisa,
  Viareggio, Torre del Lago: prestito di Bogdan, colletta per il taxi, K.O. tecnico), che sblocca il 100,
  la celebrazione e la schermata finale con punteggio e statistiche; poi si può ricominciare.
- HUD, notifiche, pausa, registro missioni; layout responsive da 360 px con safe-area e controlli touch.
- Salvataggio in localStorage con schema versionato, migrazioni, sanitizzazione e salvataggio corrotto tollerato;
  autosave; azzera progressi.
- Audio sintetizzato (WebAudio), nessun file protetto.

## Mancanti / limiti noti

- **Collaudo visivo non fatto**: aspetto 3D, fluidità (60 FPS desktop / 30+ FPS mobile), comfort dei controlli
  touch e leggibilità su schermo piccolo sono da verificare a mano. Nessuno screenshot è stato acquisito.
- **Test e2e scritti ma non eseguiti** (vedi sopra).
- **Nessun GLB reale di Tony**: il personaggio è procedurale (bomber teal, barba, capelli corti col ciuffo,
  occhiali sulla testa) ispirato a `over-shoulder.jpg`; la foto compare solo come ritratto nei dialoghi.
  Mancano le foto frontale/laterali (`front.jpg`, `left.jpg`, `right.jpg`): nessuna promessa di somiglianza 3D.
- Alcuni NPC con comportamento `pace` o `wave` restano **statici** (nessuna animazione dedicata); le pose
  attive sono stand, lean, sit.
- Il livello corrente del finale non è salvato: dopo un refresh nel mezzo del racconto si riparte dalla piazza
  (il progresso resta).
- Nessuna musica, nessun multiplayer, nessun backend.
- Le dipendenze sono molto recenti (Vite 8, TypeScript 6, three 0.187): non provate su tutti i browser.

## Crediti

Sviluppato da un team di agenti Claude coordinati: **Architecture** (scaffold, contratti, store, motore dialoghi),
**World & 3D** (piazza, luci, modelli, Tony), **Gameplay** (movimento, camera, NPC, interazioni, contenuti),
**UI/UX** (menu, HUD, dialoghi, touch, audio), **Livello finale** (La notte dell'Intercity), **QA** (test,
e2e, documentazione) e l'**orchestratore**. Idea, foto e supervisione: l'utente.
Le fotografie in `public/assets/` appartengono all'utente; la cartella `Foto/` è privata e non versionata.

## Licenza

MIT (vedi `LICENSE`).
