// OWNER: UI/UX
// Pannello "COME SI GIOCA": comandi desktop E touch (tabella dalla specifica, sezione 7).
import { Sheet } from '../shared/Sheet';
import { Button } from '../shared/Button';
import styles from './Info.module.css';

interface Row {
  action: string;
  desktop: string;
  touch: string;
}

const ROWS: readonly Row[] = [
  { action: 'Muovi', desktop: 'W A S D / frecce', touch: 'Joystick a sinistra' },
  { action: 'Corri', desktop: 'Shift', touch: 'Joystick al massimo, o pulsante CORRI' },
  { action: 'Guarda attorno', desktop: 'Mouse (clic per agganciarlo)', touch: 'Trascina a destra' },
  { action: 'Interagisci', desktop: 'E', touch: 'Pulsante con il nome (es. PARLA CON MARCO)' },
  { action: 'Avanza dialogo', desktop: 'Spazio / E / clic', touch: 'Tocca il fumetto' },
  { action: 'Scegli risposta', desktop: '1 2 3, frecce + Invio, clic', touch: 'Tocca la risposta' },
  { action: 'Pausa', desktop: 'Esc', touch: 'Pulsante II in alto' },
  { action: 'Missioni', desktop: 'M', touch: 'Pulsante MISSIONI in alto' },
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <Sheet
      title="Come si gioca"
      onClose={onClose}
      size="wide"
      footer={
        <Button variant="primary" onClick={onClose}>
          Indietro
        </Button>
      }
    >
      <p className={styles.lead}>
        Gira per la piazzetta, parla con gli amici e <strong>sparane una dopo l&apos;altra</strong>:
        ogni storia assurda fa salire il CAZZATOMETRO. A 100, Tony ne ha sparata un&apos;altra.
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Azione</th>
            <th scope="col">Tastiera e mouse</th>
            <th scope="col">Touch</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.action}>
              <th scope="row">{r.action}</th>
              <td>{r.desktop}</td>
              <td>{r.touch}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>
        Suggerimento: le conversazioni si possono chiudere in qualsiasi momento (Esc) e riaprire
        parlando di nuovo con la stessa persona.
      </p>
    </Sheet>
  );
}
