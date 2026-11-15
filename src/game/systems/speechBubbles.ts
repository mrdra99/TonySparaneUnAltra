// OWNER: Gameplay
/**
 * Nuvolette comiche sopra le teste degli NPC ("👀", "Tony, ma i miei cinque euro?").
 * Bus senza React: Npcs.tsx chiama `showBubble`, `SpeechBubbleLayer` le proietta sullo schermo.
 * Numero massimo di nuvolette contemporanee limitato + pausa minima tra due nuvolette (anti-caos).
 */
export interface BubbleSlot {
  active: boolean;
  /** Id dell'NPC (una sola nuvoletta per NPC). */
  id: string;
  x: number;
  y: number;
  z: number;
  text: string;
  /** Tempo (s) di fine visualizzazione. */
  until: number;
  /** Incrementa a ogni nuovo testo (il layer aggiorna il DOM solo quando cambia). */
  version: number;
}

export const MAX_BUBBLES = 3;
export const BUBBLE_DURATION = 3.2;
export const BUBBLE_MIN_GAP = 3.5;

export const bubbleSlots: BubbleSlot[] = Array.from({ length: MAX_BUBBLES }, () => ({
  active: false,
  id: '',
  x: 0,
  y: 0,
  z: 0,
  text: '',
  until: 0,
  version: 0,
}));

let lastShownAt = -Infinity;

/** Mostra una nuvoletta. Restituisce false se non c'e' posto o e' troppo presto. */
export function showBubble(
  id: string,
  x: number,
  y: number,
  z: number,
  text: string,
  nowSec: number,
  durationSec: number = BUBBLE_DURATION,
): boolean {
  if (nowSec - lastShownAt < BUBBLE_MIN_GAP) return false;
  let slot = bubbleSlots.find((s) => s.active && s.id === id);
  slot ??= bubbleSlots.find((s) => !s.active);
  if (!slot) return false;
  slot.active = true;
  slot.id = id;
  slot.x = x;
  slot.y = y;
  slot.z = z;
  slot.text = text;
  slot.until = nowSec + durationSec;
  slot.version++;
  lastShownAt = nowSec;
  return true;
}

/** Disattiva le nuvolette scadute. */
export function expireBubbles(nowSec: number): void {
  for (const s of bubbleSlots) if (s.active && nowSec >= s.until) s.active = false;
}

export function clearBubbles(): void {
  for (const s of bubbleSlots) s.active = false;
  lastShownAt = -Infinity;
}
