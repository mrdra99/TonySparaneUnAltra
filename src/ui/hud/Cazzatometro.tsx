// OWNER: UI/UX
// CAZZATOMETRO: barra 0-100 con tacche a 25/50/75; all'incremento "+N" vola e la barra pulsa.
import { useEffect, useState } from 'react';
import { CAZZATOMETRO_MAX, THRESHOLDS } from '@/game/progression/cazzatometro';
import styles from './Cazzatometro.module.css';

interface Floater {
  id: number;
  amount: number;
}

const FLOAT_MS = 1500;
let floaterSeq = 0;

export function Cazzatometro({ value }: { value: number }) {
  const shown = Math.round(value);
  const pct = Math.min(100, Math.max(0, (value / CAZZATOMETRO_MAX) * 100));

  // Rileva l'incremento durante il render (pattern "stato derivato"): niente effetto con setState.
  const [prev, setPrev] = useState(value);
  const [floaters, setFloaters] = useState<readonly Floater[]>([]);
  const [bump, setBump] = useState(0);
  if (value !== prev) {
    setPrev(value);
    if (value > prev) {
      setFloaters((f) => [...f, { id: ++floaterSeq, amount: Math.round(value - prev) }].slice(-4));
      setBump((b) => b + 1);
    }
  }

  useEffect(() => {
    if (floaters.length === 0) return undefined;
    const first = floaters[0];
    if (!first) return undefined;
    const t = window.setTimeout(
      () => setFloaters((f) => f.filter((x) => x.id !== first.id)),
      FLOAT_MS,
    );
    return () => window.clearTimeout(t);
  }, [floaters]);

  return (
    <div className={styles.root}>
      <p className={styles.label}>
        CAZZATOMETRO {shown}/{CAZZATOMETRO_MAX}
      </p>
      <div
        className={styles.track}
        role="progressbar"
        aria-label="Cazzatometro"
        aria-valuemin={0}
        aria-valuemax={CAZZATOMETRO_MAX}
        aria-valuenow={shown}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
        {bump > 0 && <span key={bump} className={styles.flash} aria-hidden="true" />}
        {THRESHOLDS.filter((t) => t < CAZZATOMETRO_MAX).map((t) => (
          <span
            key={t}
            className={`${styles.tick} ${value >= t ? styles.tickReached : ''}`}
            style={{ left: `${t}%` }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div className={styles.floaters} aria-hidden="true">
        {floaters.map((f) => (
          <span key={f.id} className={styles.floater}>
            +{f.amount}
          </span>
        ))}
      </div>
    </div>
  );
}
