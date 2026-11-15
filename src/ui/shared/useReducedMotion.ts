// OWNER: UI/UX
import { prefersReducedMotion } from '@/game/core/device';
import { useGameStore } from '@/store/gameStore';

/** True se l'utente ha chiesto meno animazioni (impostazione di gioco o preferenza di sistema). */
export function useReducedMotion(): boolean {
  const setting = useGameStore((s) => s.settings.reducedMotion);
  return setting || prefersReducedMotion();
}
