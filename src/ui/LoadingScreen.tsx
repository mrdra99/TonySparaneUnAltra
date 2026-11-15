// OWNER: UI/UX
// Visibile solo in fase 'loading'. L'avanzamento arriva da drei useProgress.
// Montato FUORI dal Canvas (overlay HTML): useProgress funziona anche cosi'.
import { useProgress } from '@react-three/drei';
import '@/styles/ui-tokens.css';
import { useGameStore } from '@/store/gameStore';
import styles from './LoadingScreen.module.css';

export function LoadingScreen() {
  const phase = useGameStore((s) => s.phase);
  const { progress } = useProgress();
  if (phase !== 'loading') return null;
  const pct = Math.round(Math.min(100, Math.max(0, progress)));
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <div className={styles.card}>
        <p className={styles.title}>
          <span className={styles.tony}>TONY</span> SPARANE UN&apos;ALTRA
        </p>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="Caricamento"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className={styles.fill} style={{ width: `${Math.max(6, pct)}%` }} />
        </div>
        <p className={styles.text}>CARICAMENTO DELLA PIAZZETTA... {pct}%</p>
      </div>
    </div>
  );
}
