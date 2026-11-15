// OWNER: Gameplay
// Sistema di interazione:
//  - registra gli interagibili NON-NPC di content.interactables (gli NPC li registra Npcs.tsx) e li
//    aggiorna quando cambia il progresso (override: punti World Tour, bici, ...)
//  - ogni frame: trova l'interagibile piu' vicino, scrive runtime.nearestInteractableId e aggiorna
//    store.nearbyPrompt SOLO quando cambia (setNearbyPrompt confronta)
//  - sul comando 'interact' (E / pulsante touch) chiama store.interact(id), anima Tony e fa avanzare
//    il tutorial; se l'interazione non e' disponibile lo store mostra `disabledLabel`.
import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { content } from '@/data';
import { INTERACTABLE_OVERRIDES } from '@/data/interactables';
import { colliderRegistry } from '@/game/core/collision';
import { isInteractableEnabled, interactionRegistry } from '@/game/interactions/registry';
import { resolveInteractable } from '@/game/systems/interactableOverrides';
import { pulseInteract } from '@/game/systems/playerSignals';
import { reachTutorial } from '@/game/systems/tutorial';
import { useInputAction } from '@/hooks/useInputAction';
import { gameStore, runtime } from '@/store/gameStore';
import { PIAZZA_POINTS } from '@/world/environments/piazzaColliders';

/** Raggio del collider della bici (non ne ha uno proprio in World). */
const BIKE_COLLIDER_RADIUS = 0.9;

export function InteractionSystem() {
  // Collider della bici (solida: Tony non ci cammina attraverso).
  useEffect(() => {
    colliderRegistry.add('gameplay:bike', {
      kind: 'circle',
      x: PIAZZA_POINTS.bike[0],
      z: PIAZZA_POINTS.bike[1],
      r: BIKE_COLLIDER_RADIUS,
    });
    return () => {
      colliderRegistry.remove('gameplay:bike');
    };
  }, []);

  // Registrazione (e re-registrazione al cambio di progresso) degli interagibili non-NPC.
  useEffect(() => {
    const offs = new Map<string, () => void>();
    const applied = new Map<string, number>();
    const sync = (progress: ReturnType<typeof gameStore.getState>['progress']): void => {
      for (const def of content.interactables) {
        const r = resolveInteractable(def, progress, INTERACTABLE_OVERRIDES);
        if (applied.get(def.id) === r.overrideIndex) continue;
        offs.get(def.id)?.();
        offs.set(def.id, interactionRegistry.register(r.def));
        applied.set(def.id, r.overrideIndex);
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
  }, []);

  useInputAction('interact', () => {
    const s = gameStore.getState();
    const id = runtime.nearestInteractableId;
    if (s.phase !== 'playing' || !id) return;
    if (s.interact(id)) {
      pulseInteract();
      reachTutorial('interact');
    }
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
