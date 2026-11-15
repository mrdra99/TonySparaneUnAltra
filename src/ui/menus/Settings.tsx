// OWNER: UI/UX
// Impostazioni (panel 'settings', da menu principale o pausa): volume, muto, riduzione animazioni,
// qualita' grafica, distanza camera, sensibilita' e AZZERA PROGRESSI (con conferma).
import { useId, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { playSfx } from '@/audio/sfx';
import { SETTINGS_LIMITS } from '@/game/core/settings';
import type { QualitySetting } from '@/game/core/types';
import { useGameStore } from '@/store/gameStore';
import { Button } from '../shared/Button';
import { Sheet } from '../shared/Sheet';
import styles from './Settings.module.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  onCommit?: () => void;
}

function Slider({ label, value, min, max, step, format, onChange, onCommit }: SliderProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        id={id}
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
      />
      <output htmlFor={id} className={styles.value}>
        {format(value)}
      </output>
    </div>
  );
}

const QUALITY: readonly { value: QualitySetting; label: string }[] = [
  { value: 'auto', label: 'Automatica' },
  { value: 'high', label: 'Alta' },
  { value: 'low', label: 'Bassa' },
];

export function Settings() {
  const panel = useGameStore((s) => s.panel);
  const phase = useGameStore((s) => s.phase);
  const settings = useGameStore((s) => s.settings);
  const update = useGameStore((s) => s.updateSettings);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const closePanel = useGameStore((s) => s.closePanel);
  const [confirming, setConfirming] = useState(false);
  if (panel !== 'settings') return null;
  const L = SETTINGS_LIMITS;

  const doReset = (): void => {
    resetProgress();
    setConfirming(false);
    // dalla pausa si ripartirebbe senza missioni avviate: si torna al menu
    if (phase === 'paused') returnToMenu();
  };

  return (
    <Sheet
      title="Impostazioni"
      onClose={closePanel}
      footer={
        <Button variant="primary" onClick={closePanel}>
          Chiudi
        </Button>
      }
    >
      <div className={styles.group}>
        <Slider
          label="Volume"
          value={settings.volume}
          min={L.volume.min}
          max={L.volume.max}
          step={L.volume.step}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => update({ volume: v })}
          onCommit={() => playSfx('menuSelect')}
        />
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={settings.muted}
            onChange={(e) => update({ muted: e.target.checked })}
          />
          <span>Muto</span>
        </label>
      </div>

      <div className={styles.group}>
        <Slider
          label="Distanza camera"
          value={settings.cameraDistance}
          min={L.cameraDistance.min}
          max={L.cameraDistance.max}
          step={L.cameraDistance.step}
          format={(v) => `${v.toFixed(1)} m`}
          onChange={(v) => update({ cameraDistance: v })}
        />
        <Slider
          label="Sensibilità camera"
          value={settings.mouseSensitivity}
          min={L.mouseSensitivity.min}
          max={L.mouseSensitivity.max}
          step={L.mouseSensitivity.step}
          format={(v) => `${v.toFixed(1)}×`}
          onChange={(v) => update({ mouseSensitivity: v })}
        />
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Qualità grafica</legend>
        <div className={styles.segments}>
          {QUALITY.map((q) => (
            <label key={q.value} className={styles.segment}>
              <input
                type="radio"
                name="quality"
                value={q.value}
                checked={settings.quality === q.value}
                onChange={() => update({ quality: q.value })}
              />
              <span>{q.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.group}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => update({ reducedMotion: e.target.checked })}
          />
          <span>Riduci animazioni</span>
        </label>
      </div>

      <div className={styles.danger}>
        {confirming ? (
          <div role="alertdialog" aria-label="Conferma azzeramento">
            <p className={styles.dangerText}>
              Cancellare <strong>tutti i progressi</strong>? Non si torna indietro.
            </p>
            <div className={styles.row}>
              <Button variant="danger" onClick={doReset} autoFocus>
                Sì, azzera
              </Button>
              <Button onClick={() => setConfirming(false)}>Annulla</Button>
            </div>
          </div>
        ) : (
          <Button
            variant="danger"
            icon={<Trash2 size={20} strokeWidth={3} />}
            onClick={() => setConfirming(true)}
          >
            AZZERA PROGRESSI
          </Button>
        )}
      </div>
    </Sheet>
  );
}
