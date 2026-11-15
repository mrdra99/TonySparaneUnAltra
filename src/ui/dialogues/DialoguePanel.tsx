// OWNER: UI/UX
// Pannello dialogo (fase 'dialogue'). Legge `dialogue.state` dallo store:
//   active | consequence -> battuta con typewriter; Spazio / E / Invio / tap: prima completa il testo,
//                            poi avanza
//   choice                -> battuta + 2-3 scelte (tasti 1-3, frecce + Invio, mouse, touch >= 44px)
// Sottotitoli sempre visibili: il testo completo e' anche in una regione aria-live.
import { useEffect, useState, type MouseEvent } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { playSfx } from '@/audio/sfx';
import { content } from '@/data';
import { resolveSpeaker } from '@/game/dialogue/speakers';
import { useDeviceProfile } from '@/hooks/useDeviceProfile';
import { useInputAction } from '@/hooks/useInputAction';
import { gameStore, useGameStore } from '@/store/gameStore';
import { useReducedMotion } from '../shared/useReducedMotion';
import { Portrait } from './Portrait';
import styles from './DialoguePanel.module.css';

/** Caratteri rivelati per tick (24 ms): ~80 caratteri/s, "rapido". */
const CHARS_PER_TICK = 2;
const TICK_MS = 24;

function advanceStore(): void {
  const s = gameStore.getState();
  if (s.phase !== 'dialogue') return;
  const st = s.dialogue.state.status;
  if (st === 'active' || st === 'consequence') s.advanceDialogue();
}

function chooseStore(i: number): void {
  const s = gameStore.getState();
  if (s.phase === 'dialogue' && s.dialogue.state.status === 'choice') {
    const choices = s.dialogue.state.choices;
    if (i >= 0 && i < choices.length) s.chooseDialogue(i);
  }
}

interface Typed {
  /** Stato del motore a cui si riferisce (cambia a ogni passo). */
  ref: unknown;
  count: number;
  selected: number;
}

export function DialoguePanel() {
  const phase = useGameStore((s) => s.phase);
  const state = useGameStore((s) => s.dialogue.state);
  const close = useGameStore((s) => s.closeDialogue);
  const reduced = useReducedMotion();
  const { isTouch } = useDeviceProfile();

  const line =
    state.status === 'active' || state.status === 'consequence' || state.status === 'choice'
      ? state.line
      : null;
  const text = line?.text ?? '';
  const choices = state.status === 'choice' ? state.choices : [];

  // Typewriter + scelta selezionata, azzerati a ogni nuovo passo del motore (stato derivato).
  const [typed, setTyped] = useState<Typed>({ ref: state, count: 0, selected: 0 });
  if (typed.ref !== state) setTyped({ ref: state, count: 0, selected: 0 });
  const count = typed.ref === state ? typed.count : 0;
  const done = reduced || count >= text.length;
  const selected =
    typed.ref === state ? Math.min(typed.selected, Math.max(0, choices.length - 1)) : 0;
  const open = phase === 'dialogue' && line !== null;

  useEffect(() => {
    if (!open || done) return undefined;
    let n = 0;
    const id = window.setInterval(() => {
      n = Math.min(text.length, n + CHARS_PER_TICK);
      setTyped((t) => (t.ref === state ? { ...t, count: Math.max(t.count, n) } : t));
      playSfx('blip');
      if (n >= text.length) window.clearInterval(id);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [open, done, state, text]);

  const complete = (): void => setTyped((t) => ({ ...t, ref: state, count: text.length }));

  // Primo avanzamento = completa il testo; il secondo avanza. Se non e' ancora comparso nessun
  // carattere (<1 tick) l'input non e' una richiesta di "skip": avanza direttamente.
  const onAdvance = (): void => {
    if (!done && count > 0) complete();
    else advanceStore();
  };
  const onChoose = (i: number): void => chooseStore(i);

  useInputAction('advance', onAdvance);
  useInputAction('interact', onAdvance);
  useInputAction('choice1', () => onChoose(0));
  useInputAction('choice2', () => onChoose(1));
  useInputAction('choice3', () => onChoose(2));

  // Frecce + Invio per le scelte (e Invio per avanzare). Se un pulsante ha il focus, Invio e' suo.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      const onButton = e.target instanceof HTMLElement && e.target.tagName === 'BUTTON';
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (choices.length === 0) return;
        e.preventDefault();
        const d = e.key === 'ArrowDown' ? 1 : -1;
        setTyped((t) => ({
          ...t,
          ref: state,
          selected:
            (Math.min(t.selected, choices.length - 1) + d + choices.length) % choices.length,
        }));
      } else if (e.key === 'Enter' && !onButton) {
        e.preventDefault();
        if (choices.length > 0) onChoose(selected);
        else onAdvance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open || !line) return null;

  const speaker = resolveSpeaker(line.speaker, content);
  const narrator = !speaker.name;
  const visible = reduced ? text : text.slice(0, count);

  const onPanelClick = (): void => onAdvance();
  const stop = (e: MouseEvent): void => e.stopPropagation();

  return (
    <div className={styles.root}>
      <div
        className={`${styles.panel} ${narrator ? styles.narrator : ''}`}
        role="dialog"
        aria-label="Dialogo"
        onClick={onPanelClick}
      >
        {!narrator && (
          <Portrait name={speaker.name} src={speaker.portrait} appearance={speaker.appearance} />
        )}
        <div className={styles.main}>
          {!narrator && <p className={styles.name}>{speaker.name}</p>}
          <p className={styles.sr} aria-live="polite">
            {text}
          </p>
          <p className={styles.text} aria-hidden="true">
            {visible}
            {!done && <span className={styles.caret} />}
          </p>

          {choices.length > 0 && (
            <ul className={`${styles.choices} ${done ? '' : styles.pending}`} aria-label="Risposte">
              {choices.map((c, i) => (
                <li key={c.index}>
                  <button
                    type="button"
                    className={`${styles.choice} ${i === selected ? styles.selected : ''}`}
                    onClick={(e) => {
                      stop(e);
                      playSfx('menuSelect');
                      onChoose(c.index);
                    }}
                    onMouseEnter={() => setTyped((t) => ({ ...t, ref: state, selected: i }))}
                  >
                    <span className={styles.num} aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>{c.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.footer}>
            {choices.length === 0 ? (
              <span className={styles.more}>
                {done ? (
                  <>
                    <ChevronDown size={16} strokeWidth={3} aria-hidden="true" />{' '}
                    {isTouch ? 'Tocca per continuare' : 'Spazio per continuare'}
                  </>
                ) : isTouch ? (
                  'Tocca per completare'
                ) : (
                  'Spazio per completare'
                )}
              </span>
            ) : (
              <span className={styles.more}>{isTouch ? '' : 'Tasti 1-3, frecce + Invio'}</span>
            )}
            <button
              type="button"
              className={styles.close}
              onClick={(e) => {
                stop(e);
                playSfx('menuSelect');
                close();
              }}
            >
              <X size={16} strokeWidth={3} aria-hidden="true" />
              Chiudi{isTouch ? '' : ' (Esc)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
