// OWNER: UI/UX
// Stub (Architecture). Visibile in fase 'menu' (con panel 'none'; i pannelli 'howto'/'credits' sono
// resi qui). Mostra titolo, sottotitolo e i pulsanti: NUOVA PARTITA, CONTINUA (solo se hasSave),
// COME SI GIOCA, CREDITI. Il canvas 3D e' visibile dietro (camera orbitante).
import { useGameStore } from '@/store/gameStore';

export function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const panel = useGameStore((s) => s.panel);
  const hasSave = useGameStore((s) => s.hasSave);
  const newGame = useGameStore((s) => s.newGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const openPanel = useGameStore((s) => s.openPanel);
  const closePanel = useGameStore((s) => s.closePanel);
  if (phase !== 'menu') return null;

  if (panel === 'howto' || panel === 'credits') {
    return (
      <div style={{ pointerEvents: 'auto' }}>
        <h2>{panel === 'howto' ? 'COME SI GIOCA' : 'CREDITI'}</h2>
        <p>
          {panel === 'howto'
            ? 'WASD/frecce: muovi - Shift: corri - Mouse: camera - E: interagisci - Spazio: avanti - Esc: pausa - M: missioni'
            : "Satira surreale e finzione comica: ogni riferimento a persone o fatti reali e' puramente inventato."}
        </p>
        <button onClick={closePanel}>INDIETRO</button>
      </div>
    );
  }
  if (panel !== 'none') return null;

  return (
    <div style={{ pointerEvents: 'auto' }}>
      <h1>TONY SPARANE UN&apos;ALTRA</h1>
      <p>
        <em>Le leggende della piazzetta.</em>
      </p>
      <button onClick={newGame}>NUOVA PARTITA</button>
      {hasSave && <button onClick={continueGame}>CONTINUA</button>}
      <button onClick={() => openPanel('howto')}>COME SI GIOCA</button>
      <button onClick={() => openPanel('credits')}>CREDITI</button>
      <button onClick={() => openPanel('settings')}>IMPOSTAZIONI</button>
    </div>
  );
}
