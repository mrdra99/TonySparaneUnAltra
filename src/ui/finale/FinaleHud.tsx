// OWNER: Finale. HUD del flashback "La notte dell'Intercity" (solo nei livelli del flashback):
//  - PAZIENZA DI BOGDAN (sempre)         - countdown "Intercity in partenza" (Pisa)
//  - COLLETTA ALLA ROMANA (Viareggio)
// Legge store e regole pure; niente dati per-frame (il countdown cambia una volta al secondo).
import { Clock, Coins } from 'lucide-react';
import { FLAGS, isFlashbackLevel, type FlashbackLevelId } from '@/levels/intercity/logic/ids';
import {
  collettaState,
  formatCountdown,
  formatEuro,
  patienceFromFlags,
  type CollettaState,
} from '@/levels/intercity/logic/rules';
import { useGameStore } from '@/store/gameStore';
import styles from './FinaleHud.module.css';

export function PatienceBar({ value }: { value: number }) {
  const low = value <= 20;
  return (
    <div
      className={`${styles.card} ${styles.patience} ${low ? styles.low : ''}`}
      role="progressbar"
      aria-label="Pazienza di Bogdan"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <p className={styles.label}>
        PAZIENZA DI BOGDAN <span className={styles.value}>{value}%</span>
      </p>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function CountdownChip({ sec, delays }: { sec: number; delays: number }) {
  return (
    <div
      className={`${styles.card} ${styles.countdown}`}
      role="timer"
      aria-label="Intercity in partenza"
    >
      <Clock size={18} strokeWidth={3} aria-hidden="true" />
      <div>
        <p className={styles.label}>INTERCITY IN PARTENZA</p>
        <p className={styles.time}>
          {formatCountdown(sec)}
          {delays > 0 && <span className={styles.delay}> ritardo +{delays * 5} min</span>}
        </p>
      </div>
    </div>
  );
}

export function CollettaPanel({ state }: { state: CollettaState }) {
  return (
    <section className={`${styles.card} ${styles.colletta}`} aria-label="Colletta alla romana">
      <p className={styles.label}>
        <Coins size={16} strokeWidth={3} aria-hidden="true" /> COLLETTA ALLA ROMANA
        <span className={styles.value}>
          {formatEuro(state.collected)} / {formatEuro(state.fare)}
        </span>
      </p>
      <ul className={styles.rows}>
        {state.rows.map((r) => (
          <li
            key={r.id}
            className={`${styles.row} ${r.amount === null ? styles.pending : ''} ${
              r.id === 'tony' ? styles.tony : ''
            }`}
            title={r.note}
          >
            <span className={styles.who}>{r.name}</span>
            <span className={styles.amount}>{r.amount === null ? '—' : formatEuro(r.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StageWidgets({ level }: { level: FlashbackLevelId }) {
  const flags = useGameStore((s) => s.progress.flags);
  const finale = useGameStore((s) => s.finale);
  if (level === 'intercity-pisa' && !flags.includes(FLAGS.pisaBoarded)) {
    return <CountdownChip sec={finale.countdownSec} delays={finale.delays} />;
  }
  if (level === 'intercity-viareggio') return <CollettaPanel state={collettaState(flags)} />;
  return null;
}

export function FinaleHud() {
  const phase = useGameStore((s) => s.phase);
  const level = useGameStore((s) => s.level);
  const flags = useGameStore((s) => s.progress.flags);
  if (!isFlashbackLevel(level) || (phase !== 'playing' && phase !== 'dialogue')) return null;
  return (
    <div className={styles.root}>
      <PatienceBar value={patienceFromFlags(flags)} />
      {phase === 'playing' && <StageWidgets level={level} />}
    </div>
  );
}
