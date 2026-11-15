// OWNER: UI/UX
// Stub (Architecture). Rende la coda `notifications` dello store (toast tipizzati GameNotification:
// kind, title, body, icon (nome lucide), points, durationMs). Ogni toast si auto-rimuove dopo
// durationMs con dismissNotification(id). Visibile in tutte le fasi di gioco (non nel loading).
import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

export function Notifications() {
  const notifications = useGameStore((s) => s.notifications);
  const dismiss = useGameStore((s) => s.dismissNotification);

  useEffect(() => {
    const timers = notifications.map((n) => window.setTimeout(() => dismiss(n.id), n.durationMs));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [notifications, dismiss]);

  return (
    <ul
      aria-live="polite"
      style={{
        position: 'absolute',
        top: '20%',
        left: 0,
        right: 0,
        margin: 0,
        padding: 0,
        listStyle: 'none',
        textAlign: 'center',
      }}
    >
      {notifications.slice(-3).map((n) => (
        <li key={n.id}>
          <strong>{n.title}</strong> {n.body}
        </li>
      ))}
    </ul>
  );
}
