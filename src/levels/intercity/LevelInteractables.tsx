// OWNER: Finale. Registra gli interagibili della tappa corrente nel registro globale e li aggiorna quando
// cambiano i flag (porta del treno, portiera del taxi). Al cleanup li toglie tutti: gli interagibili della
// piazza non convivono mai con quelli del flashback.
import { useEffect } from 'react';
import { evaluateConditions } from '@/game/dialogue/engine';
import { interactionRegistry } from '@/game/interactions/registry';
import { gameStore } from '@/store/gameStore';
import { interactablesFor } from './data/cast';
import type { FlashbackLevelId } from './logic/ids';

export function LevelInteractables({ level }: { level: FlashbackLevelId }) {
  useEffect(() => {
    const items = interactablesFor(level);
    const offs = new Map<string, () => void>();
    const applied = new Map<string, boolean>();
    const sync = (progress: ReturnType<typeof gameStore.getState>['progress']): void => {
      for (const it of items) {
        const enabled = evaluateConditions(it.unlockedWhen, progress);
        if (applied.get(it.def.id) === enabled) continue;
        offs.get(it.def.id)?.();
        offs.set(it.def.id, interactionRegistry.register({ ...it.def, enabled }));
        applied.set(it.def.id, enabled);
      }
    };
    sync(gameStore.getState().progress);
    const unsubscribe = gameStore.subscribe((s, prev) => {
      if (s.progress !== prev.progress) sync(s.progress);
    });
    return () => {
      unsubscribe();
      offs.forEach((off) => off());
    };
  }, [level]);
  return null;
}
