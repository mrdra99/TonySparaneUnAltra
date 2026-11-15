// OWNER: UI/UX
/**
 * CONTRATTO audio (implementazione stub no-op: l'agente UI/UX la riempie con WebAudio sintetizzato,
 * nessun file audio esterno). Requisiti per l'implementazione:
 *  - sicura in jsdom / senza AudioContext (nessuna eccezione)
 *  - l'AudioContext va creato/ripreso al primo gesto utente (autoplay policy)
 *  - rispetta volume e mute impostati con applyAudioSettings
 * Lo store chiama `playSfx` (eventi di gioco) e `applyAudioSettings` (a ogni cambio impostazioni).
 */
export type SfxName =
  | 'menuSelect'
  | 'dialogueStart'
  | 'missionComplete'
  | 'achievement'
  | 'cazzateUp'
  | 'finale'
  | 'blip';

export interface AudioSettings {
  /** 0..1 */
  volume: number;
  muted: boolean;
}

export function playSfx(_name: SfxName): void {
  // stub: implementata da UI/UX
}

export function applyAudioSettings(_settings: AudioSettings): void {
  // stub: implementata da UI/UX
}
