/** Punti di partenza di ogni tappa (puro). Convenzioni di CONTRACTS.md: [x, z], rotationY 0 = +Z. */
import type { Vec2 } from '@/game/core/types';
import type { FlashbackLevelId } from './ids';

export interface LevelSpawn {
  position: Vec2;
  rotationY: number;
}

/** Pisa: si parte a est (vicino alla porta del treno) e Bogdan e' in fondo a ovest. */
export const PISA_SPAWN: LevelSpawn = { position: [13, 4.5], rotationY: -Math.PI / 2 };
export const VIAREGGIO_SPAWN: LevelSpawn = { position: [-10, 5], rotationY: Math.PI / 2 };
export const TORRE_SPAWN: LevelSpawn = { position: [-13, 9], rotationY: Math.PI * 0.62 };

export function flashbackSpawn(level: FlashbackLevelId): LevelSpawn {
  switch (level) {
    case 'intercity-pisa':
      return PISA_SPAWN;
    case 'intercity-viareggio':
      return VIAREGGIO_SPAWN;
    case 'intercity-torre':
      return TORRE_SPAWN;
  }
}
