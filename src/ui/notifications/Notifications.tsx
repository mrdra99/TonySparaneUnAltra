// OWNER: UI/UX
// Coda `notifications` dello store resa come balloon da fumetto. Ogni toast ha il suo timer
// (durationMs) e si rimuove con dismissNotification(id). Visibile in tutte le fasi tranne il loading.
import { useEffect } from 'react';
import type { GameNotification, NotificationKind } from '@/game/progression/notifications';
import { useGameStore } from '@/store/gameStore';
import { Icon } from '../shared/icons';
import styles from './Notifications.module.css';

const VISIBLE = 3;

const BIG: ReadonlySet<NotificationKind> = new Set([
  'mission',
  'achievement',
  'story',
  'threshold',
]);

/** Cosa rappresentano i punti: Cazzatometro (cazzate, missione) o punteggio (achievement, storia). */
function pointsLabel(n: GameNotification): string | null {
  if (!n.points || n.kind === 'cazzate') return null;
  return n.kind === 'mission' ? `+${n.points} CAZZATOMETRO` : `+${n.points} PUNTI`;
}

function Toast({ n, onDone }: { n: GameNotification; onDone: (id: string) => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => onDone(n.id), n.durationMs);
    return () => window.clearTimeout(t);
  }, [n.id, n.durationMs, onDone]);

  const points = pointsLabel(n);
  const big = BIG.has(n.kind);
  return (
    <li className={`${styles.toast} ${styles[n.kind]} ${big ? styles.big : styles.small}`}>
      {n.icon && (
        <span className={styles.badge}>
          <Icon name={n.icon} size={big ? 26 : 18} />
        </span>
      )}
      <span className={styles.text}>
        <strong className={styles.title}>{n.title}</strong>
        {n.body && <span className={styles.body}>{n.body}</span>}
      </span>
      {points && <span className={styles.points}>{points}</span>}
    </li>
  );
}

export function Notifications() {
  const phase = useGameStore((s) => s.phase);
  const notifications = useGameStore((s) => s.notifications);
  const dismiss = useGameStore((s) => s.dismissNotification);
  if (phase === 'loading') return null;

  return (
    <ul className={styles.stack} aria-live="polite" role="status">
      {notifications.slice(-VISIBLE).map((n) => (
        <Toast key={n.id} n={n} onDone={dismiss} />
      ))}
    </ul>
  );
}
