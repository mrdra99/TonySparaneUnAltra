// OWNER: UI/UX
// Stub (Architecture). Visibile in fase 'paused' con panel 'pause'. Voci: Riprendi, Missioni,
// Registro delle leggende, Impostazioni, Riavvia partita, Torna al menu.
import { useGameStore } from '@/store/gameStore';

export function PauseMenu() {
  const phase = useGameStore((s) => s.phase);
  const panel = useGameStore((s) => s.panel);
  const resume = useGameStore((s) => s.resume);
  const openPanel = useGameStore((s) => s.openPanel);
  const restart = useGameStore((s) => s.restart);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  if (phase !== 'paused' || panel !== 'pause') return null;
  return (
    <div role="dialog" aria-label="Pausa" style={{ pointerEvents: 'auto' }}>
      <h2>PAUSA</h2>
      <button onClick={resume}>RIPRENDI</button>
      <button onClick={() => openPanel('missions')}>MISSIONI</button>
      <button onClick={() => openPanel('legends')}>REGISTRO DELLE LEGGENDE</button>
      <button onClick={() => openPanel('settings')}>IMPOSTAZIONI</button>
      <button onClick={restart}>RIAVVIA PARTITA</button>
      <button onClick={returnToMenu}>TORNA AL MENU</button>
    </div>
  );
}
