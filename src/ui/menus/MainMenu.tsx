// OWNER: UI/UX
// Menu principale: overlay "manifesto da bar di paese" sopra la scena 3D (che resta visibile).
// Fase 'menu': panel 'none' = menu; 'howto' / 'credits' = pannelli; 'settings' lo rende <Settings />.
import { BookOpen, Play, RotateCcw, ScrollText, SlidersHorizontal } from 'lucide-react';
import '@/styles/ui-tokens.css';
import { useGameStore } from '@/store/gameStore';
import { Button } from '../shared/Button';
import { CreditsPanel } from './CreditsPanel';
import { HowToPlay } from './HowToPlay';
import styles from './MainMenu.module.css';

export function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const panel = useGameStore((s) => s.panel);
  const hasSave = useGameStore((s) => s.hasSave);
  const newGame = useGameStore((s) => s.newGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const openPanel = useGameStore((s) => s.openPanel);
  const closePanel = useGameStore((s) => s.closePanel);
  if (phase !== 'menu') return null;

  if (panel === 'howto') return <HowToPlay onClose={closePanel} />;
  if (panel === 'credits') return <CreditsPanel onClose={closePanel} />;
  if (panel !== 'none') return null;

  return (
    <main className={styles.root}>
      <div className={styles.column}>
        <header className={styles.poster}>
          <h1 className={styles.title}>
            <span className={styles.tony}>TONY</span>{' '}
            <span className={styles.sparane}>SPARANE UN&apos;ALTRA</span>
          </h1>
          <p className={styles.subtitle}>Le leggende della piazzetta.</p>
        </header>

        <nav className={styles.menu} aria-label="Menu principale">
          <Button
            variant="primary"
            block
            icon={<Play size={22} strokeWidth={3} />}
            onClick={newGame}
            autoFocus={!hasSave}
          >
            NUOVA PARTITA
          </Button>
          {hasSave && (
            <Button
              variant="teal"
              block
              icon={<RotateCcw size={22} strokeWidth={3} />}
              onClick={continueGame}
              autoFocus
            >
              CONTINUA
            </Button>
          )}
          <Button
            block
            icon={<BookOpen size={22} strokeWidth={3} />}
            onClick={() => openPanel('howto')}
          >
            COME SI GIOCA
          </Button>
          <Button
            block
            icon={<ScrollText size={22} strokeWidth={3} />}
            onClick={() => openPanel('credits')}
          >
            CREDITI
          </Button>
          <Button
            variant="ghost"
            icon={<SlidersHorizontal size={18} strokeWidth={3} />}
            onClick={() => openPanel('settings')}
          >
            Impostazioni
          </Button>
        </nav>

        <p className={styles.footnote}>
          Opera di finzione satirica. Ogni storia è un racconto di Tony.
        </p>
      </div>
    </main>
  );
}
