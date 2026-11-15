// OWNER: UI/UX
import { Sheet } from '../shared/Sheet';
import { Button } from '../shared/Button';
import styles from './Info.module.css';

export const DISCLAIMER =
  'Opera di finzione satirica. Tutte le storie sono racconti inventati di Tony; ogni riferimento a persone o fatti reali è trasfigurato in chiave comica.';

export function CreditsPanel({ onClose }: { onClose: () => void }) {
  return (
    <Sheet
      title="Crediti"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Indietro
        </Button>
      }
    >
      <p className={styles.disclaimer} role="note">
        {DISCLAIMER}
      </p>

      <h3 className={styles.h3}>Chi l&apos;ha fatto</h3>
      <p>
        Progetto sviluppato da un team di agenti Claude coordinati: Architecture, World &amp; 3D,
        Gameplay, UI/UX e QA, con la regia dell&apos;orchestratore. Idea e personaggio: Tony, la
        piazzetta e i suoi racconti.
      </p>

      <h3 className={styles.h3}>Strumenti</h3>
      <ul className={styles.list}>
        <li>React, TypeScript e Vite</li>
        <li>three.js, React Three Fiber e drei per la scena 3D</li>
        <li>Zustand per lo stato di gioco</li>
        <li>lucide-react per le icone (licenza ISC)</li>
        <li>Anton e Rubik da Google Fonts (SIL Open Font License)</li>
      </ul>

      <h3 className={styles.h3}>Audio</h3>
      <p>
        Tutti gli effetti sonori sono sintetizzati in tempo reale con WebAudio: originali, nessun
        campione esterno, nessuna musica protetta, nessuna licenza da gestire.
      </p>
    </Sheet>
  );
}
