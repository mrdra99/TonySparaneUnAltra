/** OWNER: Architecture. Cazzatometro: costanti e funzioni pure. */

export const CAZZATOMETRO_MAX = 100;

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

/** Soglie attraversate passando da `prev` a `next` (solo in salita), in ordine crescente. */
export function thresholdsCrossed(prev: number, next: number): Threshold[] {
  return THRESHOLDS.filter((t) => prev < t && next >= t);
}
