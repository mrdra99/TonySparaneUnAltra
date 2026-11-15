/**
 * OWNER: Architecture.
 * Singleton dello store di gioco + hook React.
 *   const phase = useGameStore((s) => s.phase);          // in componenti React
 *   gameStore.getState().phase                           // dentro useFrame / codice non React
 *   gameStore.getState().startDialogue('marco');         // azioni
 * Dentro useFrame NON sottoscrivere lo store: leggi getState() o usa `runtime`.
 */
import { useStore } from 'zustand';
import { applyAudioSettings, playSfx } from '@/audio/sfx';
import { getBrowserStorage } from '@/game/core/save';
import { DEFAULT_SETTINGS } from '@/game/core/settings';
import { prefersReducedMotion } from '@/game/core/device';
import { interactionRegistry } from '@/game/interactions/registry';
import { content } from '@/data';
import { flashbackSpawn } from '@/levels/intercity/logic/spawns';
import { PIAZZA_POINTS } from '@/world/environments/piazzaColliders';
import { createGameStore, type GameStore } from './createGameStore';
import { runtime } from './runtime';

export const gameStore = createGameStore({
  content,
  storage: getBrowserStorage(),
  interactions: interactionRegistry,
  runtime,
  playSfx,
  applyAudioSettings,
  defaultSettings: { ...DEFAULT_SETTINGS, reducedMotion: prefersReducedMotion() },
  spawnPose: {
    position: PIAZZA_POINTS.spawn,
    rotationY: PIAZZA_POINTS.spawnRotationY,
    anim: 'idle',
  },
  levelPose: (level) => {
    const sp = flashbackSpawn(level);
    return { position: sp.position, rotationY: sp.rotationY, anim: 'idle' };
  },
  menuPose: {
    position: PIAZZA_POINTS.spawn,
    rotationY: PIAZZA_POINTS.spawnRotationY + Math.PI,
    anim: 'pose',
  },
});

export function useGameStore<T>(selector: (state: GameStore) => T): T {
  return useStore(gameStore, selector);
}

export type { GameStore, GamePhase, Panel, TutorialStep } from './createGameStore';
export { runtime } from './runtime';
