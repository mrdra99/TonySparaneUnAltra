// OWNER: Architecture
// Timer di transizione tra fasi: intro -> playing (INTRO_DURATION_MS), ending -> schermata finale
// (ENDING_REVEAL_DELAY_MS). Con reducedMotion le attese sono dimezzate.
import { useEffect } from 'react';
import { ENDING_REVEAL_DELAY_MS, INTRO_DURATION_MS } from '@/game/core/constants';
import { gameStore, useGameStore } from '@/store/gameStore';

export function PhaseTimers() {
  const phase = useGameStore((s) => s.phase);
  const reduced = useGameStore((s) => s.settings.reducedMotion);
  // durante la cartolina fra i livelli la fase 'intro' la chiude l'overlay, non il timer
  const inTransition = useGameStore((s) => s.levelTransition !== null);

  useEffect(() => {
    const k = reduced ? 0.5 : 1;
    if (phase === 'intro' && !inTransition) {
      const t = window.setTimeout(() => gameStore.getState().finishIntro(), INTRO_DURATION_MS * k);
      return () => window.clearTimeout(t);
    }
    if (phase === 'ending') {
      const t = window.setTimeout(
        () => gameStore.getState().revealEnding(),
        ENDING_REVEAL_DELAY_MS * k,
      );
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [phase, reduced, inTransition]);

  return null;
}
