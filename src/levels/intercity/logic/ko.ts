/** Timeline PURA del K.O. tecnico (ms dall'inizio della scena). */

export type KoStage = 'bell' | 'collapse' | 'count1' | 'count2' | 'count3' | 'banner' | 'done';

export const KO_TIMELINE: Readonly<Record<KoStage, number>> = {
  bell: 0,
  collapse: 1100,
  count1: 3800,
  count2: 4900,
  count3: 6000,
  banner: 7100,
  done: 10200,
};

const ORDER: readonly KoStage[] = [
  'bell',
  'collapse',
  'count1',
  'count2',
  'count3',
  'banner',
  'done',
];

export function koStageAt(elapsedMs: number): KoStage {
  let stage: KoStage = 'bell';
  for (const s of ORDER) if (elapsedMs >= KO_TIMELINE[s]) stage = s;
  return stage;
}

/** Durata della caduta di Bogdan (slow-motion). */
export const KO_COLLAPSE_MS = 2300;

/** Avanzamento 0..1 della caduta (ease-out cubico: rallenta verso la fine, effetto slow-motion). */
export function collapseProgress(elapsedMs: number): number {
  const t = (elapsedMs - KO_TIMELINE.collapse) / KO_COLLAPSE_MS;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - (1 - t) * (1 - t) * (1 - t);
}

/** Barcollamento prima della caduta (0..1): sale durante il campanello. */
export function wobbleAmount(elapsedMs: number): number {
  if (elapsedMs >= KO_TIMELINE.collapse) return 0;
  return Math.min(1, Math.max(0, elapsedMs / KO_TIMELINE.collapse));
}
