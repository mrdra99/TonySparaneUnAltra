// OWNER: Finale. Sistema di interazione dei livelli del flashback: trova l'interagibile piu' vicino, aggiorna il
// prompt SOLO quando cambia e fa partire `store.interact` su E / pulsante touch. Sostituisce InteractionSystem
// (che in piazza registra anche i punti SPARANE UN'ALTRA e la bici) senza toccarne il codice.
import { useFrame } from '@react-three/fiber';
import { isInteractableEnabled, interactionRegistry } from '@/game/interactions/registry';
import { pulseInteract } from '@/game/systems/playerSignals';
import { useInputAction } from '@/hooks/useInputAction';
import { gameStore, runtime } from '@/store/gameStore';

export function LevelInteractionSystem() {
  useInputAction('interact', () => {
    const s = gameStore.getState();
    const id = runtime.nearestInteractableId;
    if (s.phase !== 'playing' || !id) return;
    if (s.interact(id)) pulseInteract();
  });

  useFrame(() => {
    const s = gameStore.getState();
    if (s.phase !== 'playing') {
      runtime.nearestInteractableId = null;
      s.setNearbyPrompt(null);
      return;
    }
    const near = interactionRegistry.findNearest(runtime.player.x, runtime.player.z);
    runtime.nearestInteractableId = near?.id ?? null;
    if (!near) s.setNearbyPrompt(null);
    else if (isInteractableEnabled(near)) s.setNearbyPrompt(near.label, false);
    else s.setNearbyPrompt(near.disabledLabel ?? near.label, true);
  });

  return null;
}
