# GAME DESIGN — TONY SPARANE UN'ALTRA

_Le leggende della piazzetta._ Avventura comica 3D in terza persona, browser desktop **e** touch (smartphone/tablet).
Demo di 5–10 minuti. La specifica completa è in `prompt.md`; qui il riassunto operativo.

## 1. Tono e limiti di contenuto

Satira surreale: Tony è un antieroe che inventa storie improbabili. Tutto è **finzione comica**, mai ricostruzione di fatti reali.

- Niente violenza realistica, armi in scena, consumo/compravendita di sostanze, contenuti sessuali espliciti.
- La frase "ninna canna" è solo una gag verbale; la pistola nel pupazzo è un pupazzo misterioso + fumetti, senza armi visibili.
- Leggende su persone reali (bici di Monica, feat con un rapper) presentate come racconti inventati da Tony; il personaggio
  musicale è **interamente inventato** (nessun volto/voce reale). "Le matite nel di dietro" = gag verbale legata a un collezionabile, senza rappresentazioni.
- "SPARANE UN'ALTRA" significa solo raccontare un'altra storia assurda.

## 2. Loop di gioco

Esplora la piazza → parla con gli NPC (`E`) → scegli le risposte → il **Cazzatometro** sale → missioni completate, storie sbloccate
(Registro delle leggende), achievement → a **100** scatta il finale (posa teatrale, fumetti/coriandoli, sfx, schermata con punteggio e statistiche).

## 3. Cazzatometro

0–100, clamp. Esempi: storia minore +5, improbabile +10, leggendaria +20, scusa improvvisata +3.
Soglie e messaggi esatti: **25** "Tony sta prendendo confidenza." · **50** "La piazza inizia a dubitare." · **75** "Livello leggenda urbana." ·
**100** "TONY NE HA SPARATA UN'ALTRA!" → finale. I guadagni da frasi casuali valgono una volta per frase (anti-farming).

## 4. Missioni (contenuto completo dopo la vertical slice)

| #   | Titolo                                                 | Obiettivi                                                                                                      | Ricompensa                        |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| 1   | LA NINNA CANNA — "Oh fraaaa..."                        | parlare con 3 NPC della piazza                                                                                 | +15, achievement "La ninna canna" |
| 2   | Il biglietto del treno — "Fra, mi paghi il biglietto?" | NPC vicino all'uscita (est); scelta Viareggio/Russia/riservata (la 3ª pesa di più)                             | +10, "Pendolare internazionale"   |
| 3   | Il debito leggendario — i 40 euro di Bogdan            | minigioco: 3 scuse consecutive, risposte che dipendono dalle scelte                                            | +15, "Finanza creativa"           |
| 4   | Il mistero della bici                                  | bici di Monica, 3 versioni assurde (gag animata della bici)                                                    | +10, voce nel registro leggende   |
| 5   | Il contratto discografico                              | racconto del feat con un artista inventato, 3 spiegazioni                                                      | +15, "Featuring fantasma"         |
| 6   | Tony World Tour                                        | 4 storie (Vladivostok, pupazzo segreto, gabbia dei criceti, treno ungherese) sbloccate da 4 punti nella piazza | +20, "Cittadino del mondo"        |

**Vertical slice (prima)**: missione 1 completa dall'inizio alla fine, poi le altre. Obiettivi e id sono definiti in `src/data/missions`.

## 5. NPC e "TUTTI GUARDANO TONY"

Ogni NPC: id, nome, modello procedurale, posizione, orientamento, dialogo, missione, idle (stand/lean/phone/chat/sit/wave/pace), battute ambientali.
Gli NPC con `watchesTony` (default: maschili) girano **la testa** verso Tony entro il raggio di attenzione (interpolazione, angoli limitati);
se Tony passa dietro ruota anche il busto; tornano alla posa quando si allontana. Logica unica e riutilizzabile
(`computeAttention`). Reazioni occasionali: "👀", _"Ma questo non era in Russia?"_.

## 6. Controlli

| Azione                  | Desktop                       | Touch                                                    |
| ----------------------- | ----------------------------- | -------------------------------------------------------- |
| Muovi                   | WASD / frecce                 | joystick virtuale sinistro (analogico, dead-zone)        |
| Corri                   | Shift                         | spingere il joystick oltre ~85% (corsa automatica)       |
| Camera                  | mouse (pointer lock su click) | trascinamento nell'area destra                           |
| Interagisci             | E                             | pulsante contestuale con l'etichetta ("PARLA CON MARCO") |
| Avanza dialogo / scelte | Spazio, E, click · tasti 1–3  | tap · pulsanti grandi (≥ 44 px)                          |
| Pausa / Missioni        | Esc / M                       | pulsanti in alto                                         |

Tutorial contestuale alla prima partita (muovi → guarda → corri → interagisci). Reset dei comandi su perdita di focus.

## 7. Interfaccia

HUD non invasivo: alto-sinistra missione e obiettivo (es. "Parla con gli amici della piazza — 1/3"); alto-destra Cazzatometro;
in basso suggerimenti contestuali. Notifiche: missione completata, punti, achievement, storia sbloccata, soglie. Menu: nuova partita, continua
(solo se c'è un salvataggio), come si gioca, crediti. Pausa: riprendi, missioni, registro leggende, impostazioni, riavvia, torna al menu.
Impostazioni: volume, mute, riduci animazioni, distanza camera, sensibilità, qualità (auto/alta/bassa), azzera progressi.
**Mobile**: layout responsive da 360 px (portrait e landscape; il suggerimento "ruota il telefono" non è bloccante), safe-area, niente hover-only,
HUD compatto, nessuno scroll/zoom accidentale.

## 8. Direzione artistica

Low-poly stilizzato, colorato ma non infantile, leggermente caricaturale; luci morbide + ombre direzionali; palette coerente; piccole animazioni
ambientali (vegetazione, NPC che cambiano posa). Piazza ispirata alla foto di riferimento: spiazzo di cemento chiaro con segni di sgommate,
gradinata di cemento a 7 gradini con striscia gialla e ringhiera, pini marittimi inclinati, leccio scuro, cassonetto con graffiti, lampione alto,
case basse gialle/crema con tetti in coppi.
**Tony**: personaggio stilizzato procedurale; riferimento `over-shoulder.jpg` (bomber in raso verde-acqua con colletto a righe arancio/bianco/blu notte,
barba scura corta, occhiali da sole sulla testa). Ritratto fotografico (`portrait.jpg`) solo nei dialoghi. **Mancano** le foto frontale/laterali:
nessuna promessa di fedeltà facciale 3D; modello sostituibile con GLB in futuro.

## 9. Audio

Effetti sintetizzati con WebAudio (nessun file protetto): selezione menu, avvio dialogo, missione completata, achievement, incremento Cazzatometro,
finale. Volume generale, mute, preferenza salvata. Nessuna musica.
