// OWNER: UI/UX
// Controlli touch (montati SOLO su dispositivi touch e in fase 'playing'; in dialogo resta solo il pannello).
// Scrivono nell'input unificato (mai eventi DOM verso i consumer):
//   joystick FLOTTANTE nella meta' sinistra -> input.setJoystick(x, y), y > 0 = avanti; la base appare
//                                              dove si tocca e segue il pollice entro il raggio
//   area destra (drag)                      -> input.addLookDelta(dx, dy) in pixel CSS
//   pulsante contestuale                    -> input.trigger('interact'), etichetta = store.nearbyPrompt
//   CORRI (tenuto premuto)                  -> input.setTouchRun(true|false); la corsa e' anche automatica
//                                              oltre l'85% del joystick
//   pausa / missioni                        -> input.trigger('pause' | 'missions')
// Multi-touch: ogni controllo segue il PROPRIO pointerId, quindi joystick, look e pulsanti funzionano insieme.
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { Hand, ListChecks, Pause, Zap } from 'lucide-react';
import { input } from '@/game/core/input';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { useGameStore } from '@/store/gameStore';
import styles from './TouchControls.module.css';

/** Raggio massimo (px CSS) di spostamento del pollice. */
const JOY_RADIUS = 56;

interface Tracked {
  id: number;
  x: number;
  y: number;
}

function TouchLayer() {
  const prompt = useGameStore((s) => s.nearbyPrompt);
  const promptDisabled = useGameStore((s) => s.nearbyPromptDisabled);
  const rootRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<HTMLButtonElement>(null);
  const joy = useRef<Tracked | null>(null);
  const look = useRef<Tracked | null>(null);
  const runId = useRef<number | null>(null);

  // Alla smontatura (cambio fase: dialogo, pausa, menu) rilascia tutto.
  useEffect(
    () => () => {
      input.setJoystick(0, 0);
      input.setTouchRun(false);
    },
    [],
  );

  const showJoystick = (visible: boolean, x = 0, y = 0): void => {
    const base = baseRef.current;
    const root = rootRef.current;
    if (!base || !root) return;
    base.dataset['active'] = visible ? 'true' : 'false';
    if (visible) {
      const r = root.getBoundingClientRect();
      base.style.transform = `translate(${x - r.left}px, ${y - r.top}px)`;
    }
    const thumb = thumbRef.current;
    if (thumb) thumb.style.transform = 'translate(0px, 0px)';
  };

  const joyDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (joy.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    joy.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    showJoystick(true, e.clientX, e.clientY);
  };
  const joyMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const o = joy.current;
    if (!o || o.id !== e.pointerId) return;
    let dx = e.clientX - o.x;
    let dy = e.clientY - o.y;
    const len = Math.hypot(dx, dy);
    if (len > JOY_RADIUS) {
      dx = (dx / len) * JOY_RADIUS;
      dy = (dy / len) * JOY_RADIUS;
    }
    input.setJoystick(dx / JOY_RADIUS, -dy / JOY_RADIUS);
    const thumb = thumbRef.current;
    if (thumb) thumb.style.transform = `translate(${dx}px, ${dy}px)`;
  };
  const joyUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (joy.current?.id !== e.pointerId) return;
    joy.current = null;
    input.setJoystick(0, 0);
    showJoystick(false);
  };

  const lookDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (look.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    look.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const lookMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const l = look.current;
    if (!l || l.id !== e.pointerId) return;
    input.addLookDelta(e.clientX - l.x, e.clientY - l.y);
    l.x = e.clientX;
    l.y = e.clientY;
  };
  const lookUp = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (look.current?.id === e.pointerId) look.current = null;
  };

  const runDown = (e: ReactPointerEvent<HTMLButtonElement>): void => {
    if (runId.current !== null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    runId.current = e.pointerId;
    input.setTouchRun(true);
    runRef.current?.setAttribute('data-pressed', 'true');
  };
  const runUp = (e: ReactPointerEvent<HTMLButtonElement>): void => {
    if (runId.current !== e.pointerId) return;
    runId.current = null;
    input.setTouchRun(false);
    runRef.current?.setAttribute('data-pressed', 'false');
  };

  const noMenu = (e: { preventDefault(): void }): void => e.preventDefault();

  return (
    <div ref={rootRef} className={styles.root} onContextMenu={noMenu}>
      <div
        className={styles.moveZone}
        onPointerDown={joyDown}
        onPointerMove={joyMove}
        onPointerUp={joyUp}
        onPointerCancel={joyUp}
        onLostPointerCapture={joyUp}
      />
      <div
        className={styles.lookZone}
        onPointerDown={lookDown}
        onPointerMove={lookMove}
        onPointerUp={lookUp}
        onPointerCancel={lookUp}
        onLostPointerCapture={lookUp}
      />

      {/* indicatore fisso del joystick (aiuta a capire dove toccare) + base flottante */}
      <div className={styles.joyHint} aria-hidden="true" />
      <div ref={baseRef} className={styles.joyBase} data-active="false" aria-hidden="true">
        <div ref={thumbRef} className={styles.joyThumb} />
      </div>

      <div className={styles.topButtons}>
        <button
          type="button"
          className={styles.roundBtn}
          aria-label="Missioni"
          onClick={() => input.trigger('missions')}
        >
          <ListChecks size={22} strokeWidth={3} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.roundBtn}
          aria-label="Pausa"
          onClick={() => input.trigger('pause')}
        >
          <Pause size={22} strokeWidth={3} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.actions}>
        <button
          ref={runRef}
          type="button"
          className={styles.run}
          data-pressed="false"
          aria-label="Corri (tieni premuto)"
          onPointerDown={runDown}
          onPointerUp={runUp}
          onPointerCancel={runUp}
          onLostPointerCapture={runUp}
        >
          <Zap size={22} strokeWidth={3} aria-hidden="true" />
          <span>CORRI</span>
        </button>
        <button
          type="button"
          className={`${styles.interact} ${prompt ? styles.hasPrompt : ''} ${
            promptDisabled ? styles.unavailable : ''
          }`}
          aria-label={prompt ?? 'Interagisci'}
          aria-disabled={!prompt || promptDisabled}
          onClick={() => {
            if (prompt) input.trigger('interact');
          }}
        >
          <Hand size={26} strokeWidth={3} aria-hidden="true" />
          {prompt && <span className={styles.promptText}>{prompt}</span>}
        </button>
      </div>
    </div>
  );
}

export function TouchControls() {
  const { isTouch } = useDeviceProfile();
  const phase = useGameStore((s) => s.phase);
  if (!isTouch || phase !== 'playing') return null;
  return <TouchLayer />;
}
