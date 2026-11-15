// OWNER: UI/UX
// Stub (Architecture). Visibile in fase 'ending' quando `endingRevealed` e' true (lo imposta PhaseTimers
// dopo ENDING_REVEAL_DELAY_MS). Prima, la scena mostra la celebrazione 3D: UI/UX aggiunge fumetti e
// coriandoli leggendo `celebration` dallo store. Mostra punteggio e statistiche; Rigioca = restart().
import { content } from '@/data';
import { useGameStore } from '@/store/gameStore';

export function EndingScreen() {
  const phase = useGameStore((s) => s.phase);
  const revealed = useGameStore((s) => s.endingRevealed);
  const progress = useGameStore((s) => s.progress);
  const restart = useGameStore((s) => s.restart);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  if (phase !== 'ending' || !revealed) return null;
  const done = content.missionOrder.filter(
    (id) => progress.missions[id]?.status === 'completed',
  ).length;
  return (
    <div role="dialog" aria-label="Fine demo" style={{ pointerEvents: 'auto' }}>
      <h1>TONY NE HA SPARATA UN&apos;ALTRA!</h1>
      <p>Punteggio: {progress.score}</p>
      <p>
        Missioni: {done}/{content.missionOrder.length} - Leggende: {progress.unlockedStories.length}
        /{content.storyOrder.length} - Dialoghi: {progress.stats.dialoguesStarted} - Scelte:{' '}
        {progress.stats.choicesMade}
      </p>
      <button onClick={restart}>RIGIOCA</button>
      <button onClick={returnToMenu}>TORNA AL MENU</button>
    </div>
  );
}
