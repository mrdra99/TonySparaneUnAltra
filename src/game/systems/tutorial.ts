// OWNER: Gameplay
// Tutorial contestuale: ogni sistema segnala cosa ha fatto il giocatore; `reachTutorial` fa avanzare
// anche i passi precedenti (se chi gioca interagisce prima di guardarsi attorno, non resta incastrato).
import { gameStore, type TutorialStep } from '@/store/gameStore';

const ORDER: readonly TutorialStep[] = ['move', 'look', 'run', 'interact'];

export function reachTutorial(step: Exclude<TutorialStep, 'done'>): void {
  const s = gameStore.getState();
  if (s.tutorialStep === 'done') return;
  const upTo = ORDER.indexOf(step);
  for (let i = 0; i <= upTo; i++) {
    const from = ORDER[i];
    if (from) s.advanceTutorial(from);
  }
}
