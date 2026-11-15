# PROGETTO: TONY SPARANE UN'ALTRA

## 1. RUOLO E OBIETTIVO

Agisci come un team professionale di sviluppo videogiochi indie, composto da:

- Senior Game Developer specializzato in Three.js, React Three Fiber e TypeScript.
- Technical Game Designer, responsabile delle meccaniche.
- 3D Environment Designer, responsabile di ambientazione, personaggi e atmosfera.
- UI/UX Designer, responsabile di HUD, menu e interfaccia.
- Software Architect, responsabile dell'architettura.
- QA Engineer, responsabile dei test e della qualità.

Devi progettare e realizzare un videogioco 3D giocabile direttamente nel browser.

**Titolo ufficiale: TONY SPARANE UN'ALTRA**

Genere: avventura comica 3D, esplorazione, dialoghi interattivi e piccole missioni.

Ambientazione: una versione stilizzata della piazza di Torre del Lago Puccini, in Toscana.

Protagonista: Tony, un personaggio ispirato a fotografie di riferimento fornite dall'utente.

Durata della prima demo: 5–10 minuti.

Piattaforma primaria: browser desktop.

Il gioco deve essere divertente, curato visivamente, fluido e realmente interattivo.

NON voglio un semplice sito con immagini e pulsanti. Voglio controllare fisicamente un personaggio in un ambiente tridimensionale.

L'obiettivo secondario del progetto è dimostrare un workflow professionale di sviluppo software: architettura, pianificazione, agenti specializzati, versioning, commit, test e deploy.

---

## 2. IDENTITÀ E TONO DEL GIOCO

Il gioco racconta le incredibili e improbabili avventure che Tony sostiene di aver vissuto.

Tutto è rappresentato come **satira surreale e finzione comica**, non come ricostruzione di fatti reali.

Tony è un antieroe esagerato che inventa continuamente avventure improbabili, colleziona scuse e si trova coinvolto in situazioni ridicole.

Il titolo "SPARANE UN'ALTRA" si riferisce esclusivamente al raccontare un'altra storia assurda, non all'uso di armi.

Il tono deve ricordare una combinazione fra:

- Umorismo demenziale italiano.
- Piccola avventura 3D in terza persona.
- Missioni parodistiche.
- Dialoghi con scelte.
- Meme interattivi.
- Situazioni volutamente assurde.

Non voglio violenza realistica, simulazioni di aggressioni, utilizzo di armi o contenuti sessuali espliciti.

Gli episodi controversi devono essere trattati come racconti fantasiosi, usando dialoghi, illustrazioni comiche e gag non violente.

Ogni riferimento a persone reali e situazioni non verificabili deve restare chiaramente nel contesto della finzione.

---

## 3. STACK TECNOLOGICO

Utilizza preferibilmente:

**Frontend**
- React
- TypeScript in modalità strict
- Vite

**Motore 3D**
- Three.js
- React Three Fiber
- @react-three/drei

**Gestione dello stato**
- Zustand

**UI**
- CSS Modules o CSS strutturato
- Icone Lucide React
- HUD HTML sovrapposto alla scena 3D

**Testing**
- Vitest per logica e utility
- React Testing Library per UI
- Playwright per verifiche end-to-end

**Tooling**
- ESLint
- Prettier
- Git
- npm

**Deploy**
- Vercel

Per l'MVP non serve un backend.

Il salvataggio può essere effettuato con localStorage, utilizzando uno schema di stato versionato.

Non introdurre librerie senza una reale necessità.

Evita dipendenze superflue e soluzioni troppo elaborate per la complessità del progetto.

---

# 4. DESIGN VISIVO

## Direzione artistica

Realizza un ambiente 3D stilizzato, low-poly di buona qualità, con elementi riconoscibili e materiali curati.

Non voglio un gioco composto esclusivamente da cubi anonimi.

Lo stile deve essere:
- Colorato ma non infantile.
- Moderno e riconoscibile.
- Leggermente caricaturale.
- Coerente fra modelli e ambiente.
- Leggibile anche a distanza.
- Fluido e leggero.

Utilizza:
- Luci ambientali morbide.
- Ombre direzionali.
- Ambient occlusion, se compatibile con le prestazioni.
- Materiali con palette coerente.
- Piccole animazioni ambientali.
- Particellari discreti, dove utili.

Evita assolutamente l'estetica generica da template AI, gradienti casuali, pulsanti giganti e interfacce prive di personalità.

Il gioco deve sembrare un piccolo prodotto indie progettato con cura.

## Schermata iniziale

All'avvio mostra:

**TONY SPARANE UN'ALTRA**

Sottotitolo:

*"Le leggende della piazzetta."*

Pulsanti:
- NUOVA PARTITA
- CONTINUA (solo se disponibile)
- COME SI GIOCA
- CREDITI

Nello sfondo deve essere visibile la piazza 3D con Tony in una posa comica e una telecamera che ruota lentamente.

Quando si avvia la partita, transizione cinematografica breve verso il personaggio.

---

# 5. ASSET E FOTOGRAFIE DI RIFERIMENTO

L'utente fornirà fotografie di Tony e della piazza.

Prevedi la seguente struttura:

public/assets/
- tony/
  - front.jpg
  - left.jpg
  - right.jpg
  - additional/
- piazza/
  - reference.jpg
  - additional/
- models/
- textures/
- audio/

Le immagini non sono necessariamente tutte disponibili all'inizio.

Se mancano, utilizza placeholder espliciti e non inventare dettagli che richiedono riferimenti.

## Personaggio Tony

Tony è il protagonista giocabile.

Il suo volto deve risultare il più riconoscibile possibile rispetto alle fotografie fornite, purché l'utente abbia titolo a utilizzarle.

Priorità:
1. Preservare i tratti facciali riconoscibili.
2. Mantenere proporzioni credibili.
3. Evitare deformazioni grottesche indesiderate.
4. Avere un personaggio visivamente coerente nel mondo 3D.

Se sono disponibili più fotografie, valuta l'utilizzo di un modello GLB con texture facciale.

Se è disponibile una sola foto frontale, realizza una soluzione stilizzata: testa tridimensionale semplice con una texture o maschera facciale calibrata, più ritratto fotografico nell'interfaccia dei dialoghi.

Non dichiarare che da una sola immagine sia stata ricostruita una geometria facciale identica da ogni angolazione.

Prevedi la possibilità di sostituire successivamente il personaggio con un modello GLB senza riscrivere il controller, la telecamera o la logica.

## Abbigliamento

Vestiti casual, scarpe e accessori coerenti con le foto, quando disponibili.

## Animazioni del personaggio

Sono necessarie:
- Idle con respirazione.
- Camminata.
- Corsa.
- Rotazione.
- Animazione di interazione.
- Animazione di dialogo.
- Gesticolazione quando racconta una storia assurda.
- Animazione di vittoria.

È accettabile utilizzare un rig semplice e animazioni procedurali per il primo MVP, purché il risultato sia leggibile e non rigido.

---

# 6. AMBIENTAZIONE: LA PIAZZETTA

## Riferimento geografico

Il gioco si svolge in una ricostruzione stilizzata della piazza di Torre del Lago Puccini.

Utilizza la fotografia fornita come riferimento visivo principale.

Non cercare di riprodurre dettagli geografici arbitrari non visibili nelle immagini.

Se il riferimento è incompleto, costruisci una versione semplificata ma coerente con il luogo.

## Elementi ambientali

Inserisci, compatibilmente con il riferimento:

- Pavimentazione della piazza.
- Marciapiedi.
- Panchine.
- Alberi.
- Lampioni.
- Edifici circostanti semplificati.
- Area in cui si radunano gli NPC.
- Bicicletta come elemento narrativo.
- Piccoli oggetti decorativi.
- Segnaletica e insegne stilizzate.

L'ambiente deve risultare vivo.

Aggiungi piccoli movimenti ambientali, per esempio oscillazione leggera della vegetazione o personaggi che cambiano posa.

## Dimensioni

La piazza deve essere abbastanza grande da permettere 2–3 minuti di esplorazione, ma non enorme.

Preferire un'area piccola, dettagliata e ricca di interazioni a una mappa grande e vuota.

## Collisioni

Tony non deve attraversare edifici, panchine o NPC.

Per l'MVP utilizza un sistema di collisioni semplice ma affidabile.

Non introdurre un motore fisico completo se non necessario.

---

# 7. TELECAMERA E CONTROLLI

## Visuale in terza persona

Il giocatore controlla Tony da una telecamera posta dietro di lui, leggermente rialzata.

La telecamera deve:
- Seguire il personaggio con interpolazione fluida.
- Permettere di ruotare la visuale con il mouse.
- Evitare movimenti bruschi.
- Mantenere una distanza configurabile.
- Evitare, per quanto possibile, che muri o oggetti coprano completamente Tony.
- Avvicinarsi per i dialoghi.
- Ritornare alla posizione standard dopo l'interazione.

Non utilizzare una telecamera fissa.

## Comandi

| Input | Azione |
|---|---|
| W A S D | Movimento |
| Frecce | Movimento alternativo |
| Mouse | Rotazione telecamera |
| Shift | Corsa |
| E | Interazione |
| Spazio | Avanzamento dialogo |
| ESC | Pausa |
| M | Registro missioni |

Il movimento deve essere relativo all'orientamento della telecamera.

La rotazione del personaggio deve essere progressiva.

Aggiungi un breve tutorial contestuale alla prima partita.

---

# 8. NPC E COMPORTAMENTI

Gli NPC sono personaggi stilizzati che popolano la piazza.

Ogni NPC deve avere:
- Identificativo univoco.
- Nome.
- Modello 3D.
- Posizione iniziale.
- Orientamento.
- Stato del dialogo.
- Missione associata, se presente.
- Un semplice comportamento ambientale.
- Eventuali reazioni al passaggio di Tony.

## Meccanica speciale: TUTTI GUARDANO TONY

Qualsiasi NPC configurato come personaggio maschile deve avere un comportamento molto particolare:

**Quando Tony passa, l'NPC deve girare la testa per guardarlo.**

Il comportamento deve essere particolarmente evidente quando Tony entra nel suo raggio di attenzione.

Dettagli tecnici:
- Il busto può rimanere nella posizione originale.
- La testa deve ruotare gradualmente verso Tony.
- Usa interpolazione per evitare scatti.
- Limita gli angoli di rotazione a valori credibili.
- Se Tony passa dietro, l'NPC può ruotare anche parte del corpo.
- Quando Tony si allontana, torna alla posa precedente.

Aggiungi occasionalmente una piccola reazione comica, per esempio:

"👀"

Oppure:

*"Ma questo non era in Russia?"*

La logica di attenzione deve essere riutilizzabile per tutti gli NPC.

Non implementarla individualmente per ciascuno.

---

# 9. MECCANICA CENTRALE: IL CAZZATOMETRO

Implementa un indicatore chiamato:

**CAZZATOMETRO**

Il Cazzatometro rappresenta il livello di assurdità accumulato dalle storie di Tony.

Valore iniziale: 0/100.

Quando Tony racconta o completa una storia assurda, la barra aumenta.

Esempi:
- Storia minore: +5.
- Storia improbabile: +10.
- Storia leggendaria: +20.
- Scusa improvvisata: +3.

Al raggiungimento di particolari soglie:

25%: "Tony sta prendendo confidenza."

50%: "La piazza inizia a dubitare."

75%: "Livello leggenda urbana."

100%: "TONY NE HA SPARATA UN'ALTRA!"

Quando la barra raggiunge 100:
- Inquadra Tony.
- Mostra una sua posa teatrale.
- Fai apparire un'esplosione di fumetti e coriandoli.
- Riproduci un effetto sonoro originale.
- Mostra una schermata finale con punteggio e statistiche.

L'effetto deve essere comico, non violento.

---

# 10. MECCANICA: DIALOGHI INTERATTIVI

Quando Tony si avvicina a un NPC compare:

**[E] PARLA CON [NOME]**

Premendo E:
- Tony si ferma.
- La telecamera cambia inquadratura.
- Compare un pannello dialogo.
- Viene mostrato il nome dell'interlocutore.
- Se disponibile, mostra il ritratto.
- Il testo compare con effetto typewriter rapido.
- Il giocatore può scegliere fra 2–3 risposte.

I dialoghi devono essere brevi, divertenti e immediati.

Niente lunghi muri di testo.

## Esempio

NPC: "Oh Tony, ma alla fine quei cinque euro?"

Scelte:

1. "Fra, te li do domani."
2. "Guarda che me li devi tu."
3. "Non posso spiegarti, è una questione internazionale."

Ogni scelta produce una reazione differente.

Alcune scelte aumentano il Cazzatometro.

Implementa i dialoghi tramite dati strutturati e un motore riutilizzabile.

Non scrivere un componente React differente per ogni dialogo.

---

# 11. LE MISSIONI PRINCIPALI

## MISSIONE 1 — LA NINNA CANNA

Titolo:

**"Oh fraaaa..."**

Tony deve attraversare la piazza e interagire con tre NPC.

La sua frase ricorrente è:

*"Oh fraaaa, mi lasci una cannetta per la ninna canna?"*

La frase è una gag narrativa. Non implementare consumo, compravendita o preparazione di sostanze.

Ogni NPC risponde in maniera differente.

NPC 1:
"Tony, ma quella di ieri?"

Tony:
"Fra, quella era un'altra storia."

NPC 2:
"Ma non dovevi darmi cinque euro?"

Tony:
"Se ragioni così non sei un vero amico."

NPC 3:
"Ma quanti favori devi ancora restituire?"

Tony:
"Non puoi capire la situazione."

Al completamento:
- +15 Cazzatometro.
- Sblocco achievement "La ninna canna".
- Aggiornamento registro debiti comici.

## MISSIONE 2 — IL BIGLIETTO DEL TRENO

Titolo:

**"Fra, mi paghi il biglietto?"**

Tony incontra un NPC vicino all'uscita della piazza.

Dialogo:

Tony:
"Fra, mi paghi il biglietto del treno?"

NPC:
"Ma dove devi andare?"

Tony può scegliere:

1. "A Viareggio."
2. "In Russia."
3. "È una missione riservata."

La terza scelta aumenta maggiormente il Cazzatometro.

Ricompensa:
- +10 Cazzatometro.
- Achievement "Pendolare internazionale".

## MISSIONE 3 — I 40 EURO DI BOGDAN

Titolo:

**"Il debito leggendario"**

NPC: Bogdan, versione fittizia e stilizzata.

Bogdan reclama 40 euro da Tony.

Tony può rispondere:
- "Te li ho già dati, fra."
- "Dobbiamo prima fare i conti."
- "In questo momento ho i fondi bloccati a Vladivostok."

Questa missione deve introdurre un piccolo minigioco di dialogo.

Il giocatore deve scegliere tre scuse consecutive, cercando di mantenere in piedi la propria versione.

Le risposte degli NPC cambiano in base alle scelte.

Ricompensa:
- +15 Cazzatometro.
- Achievement "Finanza creativa".

Non serve un sistema economico complesso.

## MISSIONE 4 — LA BICICLETTA MISTERIOSA

Titolo:

**"Il mistero della bici"**

Nella piazza è presente una bicicletta.

Quando Tony si avvicina, un NPC domanda:

"Tony, ma che storia è quella della bicicletta di Monica?"

Tony racconta una vicenda sempre più improbabile.

Il riferimento alla presunta vendita della bici deve essere presentato chiaramente come una leggenda inventata, non come un furto realmente avvenuto.

Il giocatore sceglie tra tre versioni assurde della stessa storia.

Effetto:
- Piccola animazione comica della bici.
- Nuova voce nel registro delle leggende.
- +10 Cazzatometro.

## MISSIONE 5 — IL FEAT FANTASMA

Titolo:

**"Il contratto discografico"**

Tony racconta di aver quasi realizzato un featuring con il rapper Tedua.

La storia viene presentata espressamente come un racconto fantasioso di Tony e non come un'affermazione sul rapper o sulle persone che lavorano con lui.

Per evitare equivoci, nella rappresentazione visiva usa un personaggio musicale interamente inventato, senza riprodurre volto o voce dell'artista reale.

Il giocatore deve ricostruire l'improbabile spiegazione di Tony.

Dialogo:

NPC:
"Tony, ma il disco quando esce?"

Tony:
"Fra, era tutto pronto."

NPC:
"E allora perché non è uscito?"

Scelte:
- "Problemi contrattuali."
- "Il manager non ha capito la mia visione."
- "Mi hanno chiesto di ridimensionare il mio talento."

Ricompensa:
- +15 Cazzatometro.
- Achievement "Featuring fantasma".

## MISSIONE 6 — LE LEGGENDE INTERNAZIONALI

Titolo:

**"Tony World Tour"**

Questa missione presenta una sequenza di racconti impossibili.

Storia A: Vladivostok.
Tony sostiene di essere stato in Russia e di aver assistito ad allenamenti delle Spetsnaz.

Storia B: Il pupazzo segreto.
Tony sostiene di aver nascosto una pistola in un pupazzo, raccontando una storia completamente assurda. Rappresenta soltanto un pupazzo misterioso e fumetti narrativi, senza mostrare armi o minacce.

Storia C: La gabbia dei criceti.
Un'altra improbabile leggenda familiare. Usa icone di criceti e una gabbietta in una vignetta non violenta, senza rappresentare aggressioni.

Storia D: Il treno ungherese.
Tony racconta di aver viaggiato sotto un vagone ferroviario ed essere finito in un improbabile processo internazionale. Racconta la vicenda tramite cartoline comiche e dialoghi, senza simulare comportamenti ferroviari pericolosi o traffici illegali.

Le quattro storie si sbloccano attraverso quattro interazioni nella piazza.

Ogni racconto deve generare una reazione da parte degli NPC, come:

"Fra, questa è impossibile."

"Ma non eri a scuola quel giorno?"

"Tony, ma almeno questa volta ci credi tu?"

Questa missione deve essere il momento più comico del gioco.

Ricompensa:
- +20 Cazzatometro.
- Achievement "Cittadino del mondo".

---

# 12. EVENTI BONUS

Aggiungi un sistema per gestire piccoli eventi secondari.

## Bonus: Le matite misteriose

Inserisci un easter egg chiamato:

"Le matite nel di dietro"

Deve essere una gag verbale surreale legata a un oggetto collezionabile, senza rappresentazioni sessuali esplicite.

## Bonus: I cinque euro

Alcuni NPC possono commentare:

"Tony, ma i miei cinque euro?"

Questi eventi possono attivarsi quando Tony passa loro vicino.

## Bonus: Il racconto casuale

In determinati punti della piazza, compare:

**[E] SPARANE UN'ALTRA**

Premendo E, Tony racconta una frase assurda selezionata casualmente da una raccolta di battute.

Le frasi non devono ripetersi immediatamente.

Le nuove storie devono essere facilmente aggiungibili tramite dati, senza modificare la logica del gioco.

---

# 13. INTERFACCIA DI GIOCO

Realizza un HUD non invasivo.

## In alto a sinistra
Missione attuale e obiettivo.

Esempio:

MISSIONE: LA NINNA CANNA

Parla con gli amici della piazza — 1/3

## In alto a destra
Cazzatometro con barra di avanzamento.

## In basso
Suggerimenti contestuali:

[E] Interagisci

[SHIFT] Corri

[ESC] Pausa

## Notifiche

Quando il giocatore completa una missione:
- Piccolo effetto sonoro.
- Animazione del titolo.
- Punti guadagnati.
- Achievement eventuale.

## Menu di pausa

Contiene:
- Riprendi.
- Missioni.
- Registro delle leggende.
- Impostazioni.
- Riavvia partita.
- Torna al menu.

---

# 14. REGISTRO DELLE LEGGENDE

Implementa un'interfaccia accessibile dal menu.

Il registro contiene le storie sbloccate.

Ogni voce presenta:
- Titolo.
- Breve descrizione.
- Icona.
- Stato: scoperta/non scoperta.
- Punti ottenuti.

Le storie non ancora sbloccate mostrano un punto interrogativo.

Il registro deve essere alimentato da dati configurabili.

Il sistema deve poter supportare facilmente nuove storie in futuro.

---

# 15. SISTEMA DI PROGRESSIONE

Il giocatore completa le missioni principali, accumula punti e sblocca storie.

Non serve un sistema RPG complesso.

Implementa un piccolo sistema di progressione con:
- Missioni.
- Obiettivi.
- Ricompense.
- Achievement.
- Cazzatometro.
- Storico delle leggende.

Lo stato deve essere salvato automaticamente in locale.

Aggiungi un pulsante per azzerare i progressi.

Il salvataggio deve poter gestire modifiche future allo schema dei dati.

---

# 16. ARCHITETTURA SOFTWARE

Non creare un unico file contenente tutta la logica.

Adotta una struttura modulare, mantenibile e testabile.

Separazione rigorosa fra:
1. Presentazione.
2. Scene 3D.
3. Gameplay.
4. Dominio.
5. Gestione dello stato.
6. Dati e configurazioni.
7. Infrastruttura.

Struttura indicativa:

src/
- app/
- game/
  - core/
  - systems/
  - entities/
  - components/
  - camera/
  - movement/
  - interactions/
  - dialogue/
  - quests/
  - progression/
- world/
  - environments/
  - props/
  - lighting/
  - npcs/
- ui/
  - menus/
  - hud/
  - dialogues/
  - notifications/
- data/
  - missions/
  - dialogues/
  - stories/
  - npcs/
- store/
- hooks/
- assets/
- styles/
- tests/

Puoi adattare la struttura se esiste una soluzione più semplice e coerente.

## Principi

- TypeScript strict.
- Evitare `any`.
- Componenti con una responsabilità ben definita.
- Logica gameplay indipendente dal rendering quando ragionevole.
- Dipendenze unidirezionali.
- Configurazione separata dalle implementazioni.
- Funzioni pure per il calcolo di punteggi e progressione.
- Nessun sistema globale di eventi non tipizzato.
- Evitare overengineering.

## Modelli di dominio

Definisci interfacce tipizzate per:
- Character
- NPC
- Dialogue
- DialogueChoice
- Mission
- MissionObjective
- Achievement
- Story
- PlayerProgress
- GameSave

## Interazioni

Implementa un sistema generico che:
- Identifica gli oggetti interagibili.
- Verifica la distanza.
- Mostra l'azione disponibile.
- Attiva il comportamento associato.

Non duplicare la logica per NPC, oggetti e punti missione.

## Dialoghi

Implementa una state machine semplice per:
- Dialogo inattivo.
- Dialogo attivo.
- Scelta.
- Conseguenza.
- Fine dialogo.

Blocca il movimento del giocatore durante i dialoghi.

Gestisci correttamente la possibilità di chiudere e riaprire i dialoghi.

---

# 17. PRESTAZIONI

Il gioco deve funzionare fluidamente su un normale PC moderno.

Target: 60 FPS su hardware desktop ragionevole, senza promessa di prestazioni identiche su qualsiasi dispositivo.

Ottimizzazioni richieste:
- Evitare geometrie inutilmente complesse.
- Riutilizzare materiali.
- Usare instancing dove utile.
- Evitare nuove allocazioni in ogni frame.
- Evitare aggiornamenti globali React a ogni frame.
- Precaricare gli asset essenziali.
- Usare Suspense e una schermata di caricamento.
- Limitare la risoluzione delle ombre in base alle prestazioni.
- Gestire correttamente cleanup di geometrie, materiali ed eventi.

Le animazioni e il movimento devono essere indipendenti dal frame rate.

---

# 18. AUDIO

Utilizza piccoli effetti sonori originali o liberamente utilizzabili, verificando le licenze.

Prevedi:
- Selezione menu.
- Avvio dialogo.
- Missione completata.
- Achievement.
- Incremento Cazzatometro.
- Finale.

Non utilizzare musica protetta da copyright senza autorizzazione.

Aggiungi:
- Volume generale.
- Mute.
- Preferenza salvata.

Non inserire audio solo per riempire il progetto.

---

# 19. ACCESSIBILITÀ E UX

Requisiti:
- Testi leggibili.
- Contrasto adeguato.
- Animazioni non troppo invasive.
- Sottotitoli per ogni dialogo.
- Riduzione delle animazioni opzionale.
- Possibilità di completare i dialoghi anche con tastiera.
- Feedback chiaro quando un'interazione non è disponibile.
- Nessun blocco della progressione dovuto a dialoghi già completati.

Se il browser perde il focus durante il gioco, gestisci correttamente i comandi.

---

# 20. WORKFLOW PROFESSIONALE CON GIT E AGENTI

Questa parte è fondamentale.

Il progetto deve anche servire a dimostrare come si sviluppa un software professionale dall'inizio alla fine.

## Fase 0 — Analisi

Prima di scrivere codice:

1. Analizza i requisiti.
2. Individua le dipendenze tecniche.
3. Distingui MVP e funzionalità secondarie.
4. Definisci un piano di implementazione.
5. Documenta i rischi principali.
6. Controlla gli asset presenti.
7. Definisci criteri di accettazione verificabili.

Crea:
- README.md
- docs/ARCHITECTURE.md
- docs/GAME_DESIGN.md
- docs/DEVELOPMENT_PLAN.md

Non fermarti alla sola documentazione: passa poi all'implementazione.

## Fase 1 — Repository

Se non esiste, inizializza Git.

Configura:
- .gitignore
- ESLint
- Prettier
- TypeScript strict
- Script di build
- Script di test

Verifica lo stato del repository prima di qualsiasi operazione.

Non sovrascrivere file o modifiche dell'utente.

## Fase 2 — Agenti specializzati

Se Claude Code dispone di strumenti per agenti o subagenti, organizza il lavoro attraverso ruoli specializzati.

### Agente Architecture
Responsabile di:
- Struttura del progetto.
- Contratti TypeScript.
- Gestione delle dipendenze.
- Stato applicativo.
- Convenzioni.

### Agente World & 3D
Responsabile di:
- Ambiente.
- Luci.
- Oggetti 3D.
- Collisioni.
- Asset dei personaggi.

### Agente Gameplay
Responsabile di:
- Player controller.
- Interazioni.
- Dialoghi.
- Missioni.
- Cazzatometro.
- Progressione.

### Agente UI/UX
Responsabile di:
- Menu iniziale.
- HUD.
- Dialoghi.
- Mission tracker.
- Notifiche.
- Registro.

### Agente QA
Responsabile di:
- Test.
- Verifiche build.
- Bug.
- Regressioni.
- Documentazione finale.

Gli agenti devono operare su responsabilità chiare.

Se l'ambiente lo supporta, usa worktree o branch isolati per lavori paralleli.

Non consentire a più agenti di modificare simultaneamente gli stessi file senza un processo di integrazione.

Se il supporto agli agenti non è disponibile, esegui le fasi sequenzialmente senza fingere di aver delegato il lavoro.

## Fase 3 — Commit progressivi

Utilizza Conventional Commits.

Esempi:

- chore: initialize vite react typescript project
- docs: add architecture and game design
- feat(world): implement piazza environment
- feat(player): add third person controller
- feat(camera): implement smooth follow camera
- feat(npc): add character interaction system
- feat(dialogue): implement branching dialogue engine
- feat(quests): add mission progression
- feat(ui): create gameplay hud
- feat(progression): implement cazzatometro
- feat(save): add local progress persistence
- test: add gameplay logic coverage
- fix: resolve camera collision issues
- chore: prepare production build

Ogni commit deve rappresentare un incremento coerente e funzionante.

Non creare un solo commit finale enorme.

Prima di ogni commit:
- Controlla le modifiche.
- Verifica che non siano presenti file sensibili.
- Esegui i controlli appropriati.
- Scrivi un messaggio descrittivo.

Non effettuare push verso repository remoti senza configurazione e autorizzazione esplicita.

## Fase 4 — Implementazione incrementale

Ordine richiesto:

1. Setup applicazione.
2. Schermata iniziale.
3. Scena 3D di base.
4. Tony e movimento.
5. Telecamera.
6. Collisioni.
7. NPC.
8. Sistema interazioni.
9. Dialoghi.
10. Prima missione completa.
11. Cazzatometro.
12. Altre missioni.
13. HUD e menu.
14. Salvataggio.
15. Audio.
16. Rifiniture.
17. Test e ottimizzazione.

**Regola fondamentale: prima rendi giocabile una missione dall'inizio alla fine, poi amplia il contenuto.**

Non sviluppare tutte le missioni contemporaneamente lasciando incompleto il motore di gioco.

## Fase 5 — Test

Verifica almeno:

- La pagina si carica senza errori.
- Il menu iniziale funziona.
- Tony può camminare.
- Tony può correre.
- La telecamera segue correttamente.
- Le collisioni funzionano.
- Gli NPC reagiscono alla sua presenza.
- I dialoghi si aprono.
- I dialoghi si chiudono.
- Il movimento è bloccato durante i dialoghi.
- Le scelte modificano correttamente lo stato.
- Le missioni si completano.
- Il Cazzatometro si aggiorna.
- Il progresso viene salvato.
- Il progresso viene recuperato dopo refresh.
- La schermata finale compare.
- Il giocatore può ricominciare.
- Non ci sono errori di TypeScript.
- La build di produzione riesce.

Utilizza test automatizzati per la logica.

Se è disponibile un browser di test, esegui verifiche reali e acquisisci screenshot dei principali stati.

Non dichiarare test superati senza averli effettivamente eseguiti.

---

# 21. CRITERI DI ACCETTAZIONE MVP

Considera completa la prima versione soltanto quando:

1. Il gioco parte dal browser.
2. È presente un menu iniziale.
3. La piazza è visibile e tridimensionale.
4. Tony è un personaggio giocabile.
5. È presente una telecamera in terza persona.
6. Tony può esplorare la piazza.
7. Ci sono almeno tre NPC interattivi.
8. Gli NPC maschili configurati seguono Tony con lo sguardo.
9. Esiste un sistema di dialoghi funzionante.
10. Esiste almeno una missione completamente giocabile.
11. Il Cazzatometro funziona.
12. La progressione viene salvata.
13. Il menu di pausa funziona.
14. È possibile raggiungere una conclusione della demo.
15. La build passa senza errori.

Le missioni aggiuntive devono essere implementate una volta completata questa vertical slice, senza compromettere il funzionamento della demo.

---

# 22. DELIVERABLE FINALI

Consegna:

- Codice sorgente completo.
- Applicazione avviabile.
- README con istruzioni.
- Documentazione architetturale.
- Documentazione gameplay.
- Cronologia commit leggibile.
- Test automatizzati.
- Build di produzione.
- Configurazione Vercel, se necessaria.

Nel README specifica:

- Requisiti.
- Installazione.
- Avvio.
- Build.
- Test.
- Controlli.
- Struttura del codice.
- Come aggiungere una missione.
- Come aggiungere un NPC.
- Come aggiungere una storia.
- Come sostituire il modello 3D di Tony.
- Come pubblicare su Vercel.

Documenta esplicitamente le funzionalità complete e quelle ancora mancanti.

---

# 23. VINCOLI FINALI

NON voglio:
- Una demo composta solo da un menu.
- Una finta scena 3D costruita con CSS.
- Una mappa vuota.
- Un personaggio immobile.
- Sistemi enormi inutilizzati.
- Componenti monolitici.
- Asset casuali e stilisticamente incompatibili.
- Dipendenze superflue.
- Codice che non compila.
- Commenti che sostituiscono implementazioni.
- Funzioni simulate dichiarate come complete.
- Promesse di fedeltà fotografica impossibili.
- Meccaniche violente o contenuti che presentino racconti non verificati come fatti reali.

VOGLIO:
- Un vero piccolo videogioco.
- Esplorazione 3D.
- Terza persona.
- Tony riconoscibile.
- Piazza ispirata alle foto.
- NPC espressivi.
- Dialoghi comici.
- Missioni brevi.
- Gameplay immediato.
- Codice pulito.
- Workflow professionale.
- Commit progressivi.
- Progetto realmente avviabile.

## ISTRUZIONE OPERATIVA FINALE

Comincia esaminando il repository e gli asset disponibili.

Crea un piano sintetico e documentato, poi passa subito all'implementazione della vertical slice giocabile.

Procedi in incrementi verificabili, effettuando commit coerenti.

Se gli asset fotografici non sono ancora presenti, utilizza placeholder chiaramente identificati, mantenendo pronta la pipeline per sostituirli.

Non fermarti alla pianificazione e non chiedere conferma per ogni fase ordinaria.

Priorità assoluta: **un'esperienza di gioco piccola, completa, divertente e tecnicamente solida.**

Il gioco deve chiamarsi:

# TONY SPARANE UN'ALTRA

*Sottotitolo: Le leggende della piazzetta.*