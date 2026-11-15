// OWNER: UI/UX
// Menu di pausa (fase 'paused', panel 'pause'): Riprendi, Missioni, Registro delle leggende,
// Impostazioni, Riavvia partita (con conferma), Torna al menu.
import { useState } from 'react';
import { Home, ListChecks, Play, RotateCcw, ScrollText, SlidersHorizontal } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { Button } from '../shared/Button';
import { Sheet } from '../shared/Sheet';
import styles from './Menus.module.css';

export function PauseMenu() {
  const phase = useGameStore((s) => s.phase);
  const panel = useGameStore((s) => s.panel);
  const resume = useGameStore((s) => s.resume);
  const openPanel = useGameStore((s) => s.openPanel);
  const restart = useGameStore((s) => s.restart);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const [confirming, setConfirming] = useState(false);
  if (phase !== 'paused' || panel !== 'pause') return null;

  const icon = (I: typeof Play) => <I size={22} strokeWidth={3} />;

  return (
    <Sheet title="PAUSA" size="narrow">
      {confirming ? (
        <div className={styles.confirm} role="alertdialog" aria-label="Conferma riavvio">
          <p className={styles.confirmText}>
            Ricominciare da capo? <strong>Perdi tutti i progressi</strong> di questa partita.
          </p>
          <div className={styles.row}>
            <Button variant="danger" onClick={restart} autoFocus>
              Sì, ricomincia
            </Button>
            <Button onClick={() => setConfirming(false)}>Annulla</Button>
          </div>
        </div>
      ) : (
        <nav className={styles.stack} aria-label="Menu di pausa">
          <Button variant="primary" block icon={icon(Play)} onClick={resume} autoFocus>
            RIPRENDI
          </Button>
          <Button block icon={icon(ListChecks)} onClick={() => openPanel('missions')}>
            MISSIONI
          </Button>
          <Button block icon={icon(ScrollText)} onClick={() => openPanel('legends')}>
            REGISTRO DELLE LEGGENDE
          </Button>
          <Button block icon={icon(SlidersHorizontal)} onClick={() => openPanel('settings')}>
            IMPOSTAZIONI
          </Button>
          <Button block icon={icon(RotateCcw)} onClick={() => setConfirming(true)}>
            RIAVVIA PARTITA
          </Button>
          <Button block icon={icon(Home)} onClick={returnToMenu}>
            TORNA AL MENU
          </Button>
        </nav>
      )}
    </Sheet>
  );
}
