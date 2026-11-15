// OWNER: UI/UX
// HUD non invasivo, visibile in fasi 'playing' | 'dialogue'.
//  - alto-sinistra: missione corrente + obiettivo
//  - alto-destra: Cazzatometro
//  - basso: prompt di interazione, suggerimenti tastiera (desktop) e tutorial contestuale.
//    Su touch il prompt sta sul pulsante di TouchControls e i suggerimenti tastiera non servono.
import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { content } from '@/data';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { getCurrentMission } from '@/game/quests/selectors';
import { useGameStore, type TutorialStep } from '@/store/gameStore';
import { Cazzatometro } from './Cazzatometro';
import styles from './Hud.module.css';

const TUTORIAL_DESKTOP: Readonly<Record<Exclude<TutorialStep, 'done'>, string>> = {
  move: 'Muoviti con W A S D o le frecce',
  look: 'Muovi il mouse per guardarti attorno',
  run: 'Tieni premuto SHIFT per correre',
  interact: 'Avvicinati a un amico e premi E',
};

const TUTORIAL_TOUCH: Readonly<Record<Exclude<TutorialStep, 'done'>, string>> = {
  move: 'Trascina a sinistra per muoverti',
  look: 'Trascina a destra per guardarti attorno',
  run: 'Spingi il joystick al massimo per correre',
  interact: 'Avvicinati a un amico e tocca il pulsante',
};

const HINTS: readonly (readonly [string, string])[] = [
  ['E', 'Interagisci'],
  ['SHIFT', 'Corri'],
  ['ESC', 'Pausa'],
  ['M', 'Missioni'],
];

let rotateHintShown = false;

/** Suggerimento NON bloccante per il portrait su touch: sparisce da solo e non torna. */
function RotateHint() {
  const [visible, setVisible] = useState(!rotateHintShown);
  useEffect(() => {
    if (!visible) return undefined;
    rotateHintShown = true;
    const t = window.setTimeout(() => setVisible(false), 7000);
    return () => window.clearTimeout(t);
  }, [visible]);
  if (!visible) return null;
  return (
    <button type="button" className={styles.rotate} onClick={() => setVisible(false)}>
      <RotateCw size={18} strokeWidth={3} aria-hidden="true" />
      Gira il telefono per giocare meglio
    </button>
  );
}

export function Hud() {
  const phase = useGameStore((s) => s.phase);
  const progress = useGameStore((s) => s.progress);
  const prompt = useGameStore((s) => s.nearbyPrompt);
  const promptDisabled = useGameStore((s) => s.nearbyPromptDisabled);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const { isTouch, orientation } = useDeviceProfile();
  if (phase !== 'playing' && phase !== 'dialogue') return null;

  const mission = getCurrentMission(progress, content);
  const playing = phase === 'playing';
  const tutorial =
    playing && tutorialStep !== 'done'
      ? (isTouch ? TUTORIAL_TOUCH : TUTORIAL_DESKTOP)[tutorialStep]
      : null;

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <div className={styles.mission}>
          {mission ? (
            <>
              <p className={styles.missionTitle}>MISSIONE: {mission.mission.title}</p>
              <p className={styles.objective}>
                <span>{mission.label}</span>
                <span className={styles.counter}>
                  {mission.completed}/{mission.total}
                </span>
              </p>
            </>
          ) : (
            <p className={styles.missionTitle}>Nessuna missione attiva</p>
          )}
        </div>
        <Cazzatometro value={progress.cazzate} />
      </div>

      {playing && (
        <div className={`${styles.bottom} ${isTouch ? styles.bottomTouch : ''}`}>
          {tutorial && (
            <p className={styles.tutorial} role="status">
              {tutorial}
            </p>
          )}
          {!isTouch && prompt && (
            <p
              className={`${styles.prompt} ${promptDisabled ? styles.promptDisabled : ''}`}
              role="status"
            >
              {promptDisabled ? (
                prompt
              ) : (
                <>
                  <kbd className={styles.key}>E</kbd> {prompt}
                </>
              )}
            </p>
          )}
          {!isTouch && (
            <ul className={styles.hints} aria-label="Comandi">
              {HINTS.map(([key, label]) => (
                <li key={key}>
                  <kbd className={styles.key}>{key}</kbd> {label}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {playing && isTouch && orientation === 'portrait' && <RotateHint />}
    </div>
  );
}
