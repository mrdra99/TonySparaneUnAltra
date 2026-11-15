/**
 * OWNER: Architecture. Percorsi degli asset (public/assets) e stato di disponibilita'.
 * Le foto frontale/sinistra/destra di Tony NON esistono ancora: `available: false` e' il
 * placeholder esplicito. Quando l'utente le fornisce, basta metterle nel path e portare il flag a true.
 */
export const ASSET_PATHS = {
  /** Ritaglio del volto di Tony per il pannello dialoghi. */
  tonyPortrait: '/assets/tony/portrait.jpg',
  /** Tony di 3/4 da dietro (riferimento per abbigliamento e capelli). */
  tonyOverShoulder: '/assets/tony/additional/over-shoulder.jpg',
  /** Riferimento visivo principale della piazza. */
  piazzaReference: '/assets/piazza/reference.jpg',
} as const;

export interface ReferenceAsset {
  path: string;
  available: boolean;
}

/** Foto di riferimento previste dalla struttura asset ma ASSENTI (placeholder espliciti). */
export const MISSING_REFERENCE_ASSETS: Readonly<
  Record<'front' | 'left' | 'right', ReferenceAsset>
> = {
  front: { path: '/assets/tony/front.jpg', available: false },
  left: { path: '/assets/tony/left.jpg', available: false },
  right: { path: '/assets/tony/right.jpg', available: false },
};
