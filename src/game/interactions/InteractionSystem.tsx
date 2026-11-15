// OWNER: Gameplay
// Versione iniziale (Architecture). Responsabilita':
//  - registra gli interagibili NON-NPC di content.interactables (gli NPC li registra Npcs.tsx)
//  - ogni frame: trova l'interagibile piu' vicino, scrive runtime.nearestInteractableId e aggiorna
//    store.nearbyPrompt SOLO quando cambia (setNearbyPrompt confronta)
//  - sul comando 'interact' (E / pulsante touch) chiama store.interact(id)
import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { content } from '@/data';
import { isInteractableEnabled, interactionRegistry } from '@/game/interactions/registry';
import { useInputAction } from '@/hooks/useInputAction';
import { gameStore, runtime } from '@/store/gameStore';

export function InteractionSystem() {
  useEffect(() => {
    const offs = content.interactables.map((def) => interactionRegistry.register(def));
    return () => offs.forEach((off) => off());
  }, []);

  useInputAction('interact', () => {
    const s = gameStore.getState();
    const id = runtime.nearestInteractableId;
    if (s.phase === 'playing' && id) s.interact(id);
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
    if (!near) {
      s.setNearbyPrompt(null);
    } else if (isInteractableEnabled(near)) {
      s.setNearbyPrompt(near.label, false);
    } else {
      s.setNearbyPrompt(near.disabledLabel ?? near.label, true);
    }
  });

  return null;
}
