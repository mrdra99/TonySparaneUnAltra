// OWNER: Gameplay
// Frasi per "SPARANE UN'ALTRA". Aggiungerne una = aggiungere una riga (nessuna logica da toccare).
// Ogni frase vale Cazzatometro una sola volta; non si ripetono subito (randomStory.ts).
import type { RandomStory } from '@/game/core/types';

const lines: readonly string[] = [
  'Una volta ho dato un passaggio a un piccione fino a Pisa. Mi ha lasciato la mancia.',
  'Fra, a Vladivostok mi chiamavano “il sindaco della piazzetta”.',
  'Il mio ultimo telefono è in una banca svizzera. Non mi serve, ho la memoria.',
  'Ho un cugino che conosce uno che ha visto passare Puccini in bicicletta.',
  'Giuro, ho vinto un torneo di briscola contro un orologio.',
  'Una volta mi hanno fermato per un controllo: erano i miei debiti che chiedevano un autografo.',
  'Ho parlato con un gabbiano per tre ore. Aveva ragione lui.',
  'Fra, io il mare l’ho inventato: prima c’era solo una pozzanghera molto ambiziosa.',
  'Mia nonna faceva la schiacciata così buona che l’hanno studiata all’università. Senza il permesso.',
  'Ho corso i cento metri in nove secondi. Il cronometro però era un panino.',
  'Una volta ho litigato con il GPS e ho vinto: mi ha chiesto scusa in francese.',
  'In Albania mi hanno scambiato per un ministro. Ho firmato tre cose e adesso ho un ponte.',
  'Ho un amico che sa parlare con i semafori. Dice che il giallo è molto timido.',
  'Quella volta che ho scambiato la pizza per un volante: la cena è finita a Livorno.',
  'Ho fatto il bagno nel Lago di Massaciuccoli e il lago mi ha chiesto il bis.',
  'Fra, a Praga ho preso una multa per eccesso di simpatia.',
  'Ho imparato il tedesco in una notte: ho solo dimenticato tutte le parole.',
  'Un mio amico ha un cane che fa il commercialista. Lo chiamano “il Rag. Fido”.',
  'Una volta mi sono perso nel mio stesso quartiere. Mi ha ritrovato una nonna con la borsa della spesa.',
  'Ho venduto un ombrello a un pesce. Era soddisfatto, ma ha chiesto lo scontrino.',
  'A Budapest mi hanno fatto una statua. Poi hanno scoperto che era un cestino.',
  'Io sono stato il primo a scoprire il lunedì. Purtroppo l’ho detto a tutti.',
  'Fra, una volta ho pareggiato a briscola con un fantasma: aveva le carte trasparenti.',
  'In Sardegna ho trovato una conchiglia che parlava. Diceva solo: “Tony, i cinque euro”.',
  'Ho fatto un provino per fare il sole in un cartone animato. Mi hanno detto “troppo luminoso”.',
  'Ho passato un’estate a fare l’autista di una bicicletta. È stata dura: era già piena.',
  'Mio zio ha una barca così lenta che arriva ieri.',
  'Una volta ho preso un treno a Viareggio ed è partito da Lucca. Non ho mai capito come.',
  'Mi hanno chiesto di fare il testimonial della nebbia. Ho detto di no: non si vedeva il compenso.',
  'Ho tenuto un discorso a un lampione. Era così commosso che si è acceso da solo.',
  'Fra, io conosco un posto dove il Wi-Fi si chiama “Ciao Tony” e la password è “ciao Tony”.',
  'Ho ereditato una collezione di tappi dello zio. Adesso il tappo capo sono io.',
];

export const RANDOM_STORIES: readonly RandomStory[] = lines.map((text, i) => ({
  id: `r${i + 1}`,
  text,
  cazzate: i % 5 === 4 ? 3 : 2,
}));
