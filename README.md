# TONY SPARANE UN'ALTRA

_Le leggende della piazzetta._ Avventura comica 3D nel browser (React Three Fiber), ispirata a una versione stilizzata
della piazza di Torre del Lago Puccini. Satira surreale: ogni riferimento a persone o fatti reali è finzione dichiarata.

> **Stato: BOZZA** (scritta dall'agente Architecture). Il QA la completa a fine progetto. Le sezioni "Come aggiungere..." e
> "Funzionalità" riflettono lo stato attuale; vedi `docs/DEVELOPMENT_PLAN.md` §6.

## Requisiti

- Node.js `^20.19` oppure `>=22.12`, npm
- Browser con WebGL2 (desktop o smartphone/tablet con touch)

## Installazione e avvio

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build, anteprima, test

```bash
npm run build      # tsc -b && vite build  -> dist/
npm run preview    # serve dist/ su http://localhost:4173
npm run typecheck  # TypeScript strict
npm run lint       # ESLint (flat config)
npm run format     # Prettier
npm test           # Vitest (unit + integrazione)
npx playwright install chromium   # una tantum
npm run test:e2e   # Playwright: project desktop-chromium e mobile-pixel7
```

## Controlli

| Azione           | Desktop                            | Touch                          |
| ---------------- | ---------------------------------- | ------------------------------ |
| Movimento        | WASD / frecce                      | joystick virtuale (a sinistra) |
| Corsa            | Shift                              | joystick spinto al massimo     |
| Camera           | mouse (click per il pointer lock)  | trascinamento nell'area destra |
| Interazione      | E                                  | pulsante contestuale           |
| Avanza dialogo   | Spazio / E / click, scelte con 1-3 | tap, pulsanti scelta           |
| Pausa / Missioni | Esc / M                            | pulsanti in alto               |

## Struttura del codice

```
src/app/            composizione (App, GameCanvas, worldBindings)
src/game/           core (tipi, input, collisioni, save, device), progression, dialogue, quests,
                    interactions, movement, camera, systems, entities
src/world/          environments, lighting, props, npcs (scena 3D)
src/ui/             menus, hud, dialogues, notifications, touch
src/data/           contenuti dichiarativi (missioni, dialoghi, npc, storie, achievement, frasi)
src/store/          gameStore (zustand) e runtime (stato per-frame)
src/hooks/          useDeviceProfile, useInputAction
src/audio/          effetti sonori (contratto + implementazione)
docs/               ARCHITECTURE, GAME_DESIGN, DEVELOPMENT_PLAN, CONTRACTS
```

## Come estendere (solo dati)

Dettagli in `docs/CONTRACTS.md` §6.

- **Missione**: aggiungi un oggetto in `src/data/missions/` (obiettivi + ricompensa) e completa gli obiettivi con effetti `completeObjective` nei dialoghi.
- **NPC**: aggiungi una `NpcDefinition` in `src/data/npcs/` con `dialogueId`; collider e prompt "PARLA CON ..." sono automatici.
- **Storia (leggenda)**: aggiungi una voce in `src/data/stories/` e sbloccala con l'effetto `unlockStory` o come premio di missione.
- **Frase "SPARANE UN'ALTRA"**: aggiungi una riga in `src/data/randomStories/`.
- **Sostituire il modello di Tony**: sostituisci `src/game/entities/TonyModel.tsx` con un GLB mantenendo la prop `anim` (`runtime.anim`).

## Pubblicazione su Vercel

`vercel.json` è già presente (framework Vite, output `dist`). Importa il repository su Vercel oppure `npx vercel` / `npx vercel --prod`.
Nessun backend e nessuna variabile d'ambiente.

## Asset

Fotografie di riferimento in `public/assets/` (`tony/portrait.jpg`, `tony/additional/over-shoulder.jpg`, `piazza/reference.jpg`).
**Mancano** `tony/front.jpg`, `left.jpg`, `right.jpg`: segnalati come placeholder (`src/data/assets.ts`). La cartella `Foto/` è privata e non versionata.

## Funzionalità

Completate: vedi `docs/DEVELOPMENT_PLAN.md` §6 (aggiornato dal QA). Quelle non elencate come complete **non sono** da considerarsi finite.

## Licenza

MIT (vedi `LICENSE`).
