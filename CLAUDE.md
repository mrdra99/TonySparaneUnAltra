# Tony Sparane Un'Altra

Videogioco 3D comico per browser (desktop e mobile touch). Tony si muove in terza persona in una
versione stilizzata della piazza di Torre del Lago Puccini: parla con gli NPC, completa missioni
parodistiche e riempie il Cazzatometro. È satira fra amici, sempre presentata come finzione e senza
violenza. La specifica completa è in `prompt.md`.

## Stack

Vite + React 19 + TypeScript 6 (strict, `noUncheckedIndexedAccess`), three + @react-three/fiber 9 +
drei 10, Zustand 5, CSS Modules, lucide-react. Test con Vitest + RTL + jsdom ed e2e con Playwright
(project desktop-chromium e mobile-pixel7). Deploy su Vercel. Nessun backend: il salvataggio sta in
localStorage con schema versionato (`src/game/core/save.ts`). Alias `@/` = `src/`.

## Struttura — dove sta cosa

- `docs/CONTRACTS.md`: **da leggere per primo**. Dice chi possiede quale file, la differenza fra
  runtime e store, il flusso interazione → dialogo → effetti → notifiche e le coordinate della piazza.
- `src/app/`: composizione (Canvas, fasi). `worldBindings.ts` è l'unico punto di giunzione con `src/world`.
- `src/game/core`: tipi, input unificato tastiera/mouse/touch, collisioni, save, device profile.
- `src/game/{dialogue,progression}`: logica pura testata (motore dialoghi, effetti, Cazzatometro).
- `src/store/runtime.ts`: dati per-frame mutabili. `src/store/gameStore.ts`: stato reattivo.
- `src/world/`: piazza, luci, modelli NPC e prop. `src/game/entities/TonyModel.tsx`: Tony, sostituibile con un GLB.
- `src/levels/intercity/`: livello finale "La notte dell'Intercity" (Pisa, Viareggio, Torre del Lago): `data/` (cast,
  dialoghi, missione, speaker extra), `logic/` pura, `env/`, `actors/`. Il Cazzatometro è a tetto 95 finché non scatta il K.O. tecnico.
- `src/data/`: NPC, dialoghi, missioni, storie, frasi casuali. Si aggiungono contenuti qui, non nel codice.
- `src/ui/`: menu, HUD, dialoghi, notifiche, comandi touch. `src/audio/sfx.ts`: SFX sintetizzati con WebAudio.

## Comandi

`npm install` · `npm run dev` · `npm run typecheck` · `npm run lint` · `npm test` · `npm run build` ·
`npm run test:e2e` (prima serve `npx playwright install chromium`).

## Convenzioni specifiche

- Mai `set` React per frame: i dati per-frame stanno in `runtime` e si leggono in `useFrame`.
  Niente allocazioni in `useFrame`.
- Contenuti di gioco solo come dati tipizzati, validati da `src/data/content.test.ts`.
- Commit in formato Conventional Commits, sviluppo su feature branch, mai su main.
- Testi di gioco e documenti in italiano, codice in inglese.

## Trappole / cosa non toccare

- `Foto/` contiene le foto originali dell'utente: è in .gitignore e non va committata.
- Non esiste una foto frontale di Tony: niente texture fotografica sul volto 3D, la foto si usa
  solo come ritratto nei dialoghi.
- Contenuti: niente armi, violenza, sostanze o sesso espliciti. Ogni storia controversa è una vanteria
  di Tony a cui nessuno crede. Niente marchi (la giacca è senza logo) e niente volto o voce di artisti reali.
- Il repo sta su OneDrive: l'isolamento worktree automatico di Claude Code fallisce. I worktree vanno
  creati a mano fuori da OneDrive (es. `C:\Users\zamol\wt\`).
- `.gitattributes` forza gli a capo LF.

> TODO: progetto Vercel e dominio non ancora configurati. Chiedere prima di qualsiasi push o deploy.
