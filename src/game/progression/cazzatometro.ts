/** OWNER: Architecture. Cazzatometro: costanti e funzioni pure. */

export const CAZZATOMETRO_MAX = 100;

/**
 * Tetto del Cazzatometro PRIMA del finale: 100 si raggiunge solo col K.O. tecnico di Bogdan
 * (livello "La notte dell'Intercity"). Finche' il flag `FINALE_KO_FLAG` non e' acceso il valore
 * non supera questo tetto, qualunque sia la somma di missioni, bonus e frasi casuali.
 */
export const PRE_FINALE_CAP = 95;
/** Flag acceso dal K.O. tecnico: toglie il tetto e sblocca il 100. */
export const FINALE_KO_FLAG = 'finale.ko';

export const THRESHOLDS = [25, 50, 75, 100] as const;
export type Threshold = (typeof THRESHOLDS)[number];

/** Messaggi esatti dalla specifica di gioco. */
export const THRESHOLD_MESSAGES: Readonly<Record<Threshold, string>> = {
  25: 'Tony sta prendendo confidenza.',
  50: 'La piazza inizia a dubitare.',
  75: 'Livello leggenda urbana.',
  100: "TONY NE HA SPARATA UN'ALTRA!",
};

export function clampCazzate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(CAZZATOMETRO_MAX, Math.max(0, value));
}

/** Massimo raggiungibile dato l'insieme di flag del progresso. */
export function maxCazzateFor(flags: readonly string[]): number {
  return flags.includes(FINALE_KO_FLAG) ? CAZZATOMETRO_MAX : PRE_FINALE_CAP;
}

/**
 * Valore dopo aver sommato `amount` a `prev`, con tetto pre-finale (puro).
 * Un valore gia' sopra il tetto (vecchi salvataggi) non viene mai abbassato da un guadagno.
 */
export function addCazzateCapped(prev: number, amount: number, flags: readonly string[]): number {
  const raw = clampCazzate(prev + amount);
  if (amount <= 0) return raw;
  return Math.max(prev, Math.min(raw, maxCazzateFor(flags)));
}

/** Soglie attraversate passando da `prev` a `next` (solo in salita), in ordine crescente. */
export function thresholdsCrossed(prev: number, next: number): Threshold[] {
  return THRESHOLDS.filter((t) => prev < t && next >= t);
}
