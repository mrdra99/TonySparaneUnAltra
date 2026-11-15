// OWNER: Finale. Dissolvenza a nero + "cartolina" a tutto schermo fra le tappe del flashback.
// Skippabile con E / Spazio / tap (dopo un breve blocco anti doppio-tocco). Mentre e' attiva la fase dello store
// e' 'intro' (Tony fermo, nessuna interazione); a schermo nero si monta la tappa nuova (`swapLevel`).
import { useEffect, useRef, useState } from 'react';
import { useInputAction } from '@/hooks/useInputAction';
import {
  POSTCARDS,
  transitionStageAt,
  type TransitionStage,
} from '@/levels/intercity/logic/transition';
import { gameStore, useGameStore } from '@/store/gameStore';
import styles from './LevelTransition.module.css';

const TICK_MS = 50;

function Run({ to }: { to: string }) {
  const [stage, setStage] = useState<TransitionStage>('fadeOut');
  const t0 = useRef(0);
  const skippedAt = useRef<number | null>(null);
  const stageRef = useRef<TransitionStage>('fadeOut');
  // il primo frame parte trasparente: cosi' la dissolvenza a nero e' animata dal CSS
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    t0.current = performance.now();
    const raf = window.requestAnimationFrame(() => setEntered(true));
    let swapped = false;
    let ended = false;
    const id = window.setInterval(() => {
      const el = performance.now() - t0.current;
      const s = transitionStageAt(el, skippedAt.current);
      stageRef.current = s;
      setStage(s);
      // schermo nero (cartolina o oltre): si cambia livello una sola volta
      if (!swapped && s !== 'fadeOut') {
        swapped = true;
        gameStore.getState().swapLevel();
      }
      if (s === 'done' && !ended) {
        ended = true;
        window.clearInterval(id);
        gameStore.getState().endLevelTransition();
      }
    }, TICK_MS);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, []);

  const skip = (): void => {
    if (stageRef.current === 'card' && skippedAt.current === null) {
      skippedAt.current = performance.now() - t0.current;
    }
  };
  useInputAction('interact', skip);
  useInputAction('advance', skip);

  const card = (POSTCARDS as Record<string, (typeof POSTCARDS)[keyof typeof POSTCARDS]>)[to];
  const black = entered && stage !== 'fadeIn' && stage !== 'done';
  return (
    <div
      className={styles.root}
      data-black={black}
      data-stage={stage}
      onPointerDown={skip}
      role="status"
      aria-live="polite"
    >
      {card && (
        <section className={styles.card} data-show={stage === 'card'}>
          <p className={styles.kicker}>{card.kicker}</p>
          <h2 className={styles.title}>{card.title}</h2>
          <p className={styles.sub}>{card.sub}</p>
          <p className={styles.stamp}>{card.stamp}</p>
        </section>
      )}
      <p className={styles.skip} data-show={stage === 'card'}>
        <kbd className={styles.key}>E</kbd> / <kbd className={styles.key}>SPAZIO</kbd> / tocca per
        saltare
      </p>
    </div>
  );
}

export function LevelTransition() {
  const t = useGameStore((s) => s.levelTransition);
  if (!t) return null;
  return <Run key={t.nonce} to={t.to} />;
}
