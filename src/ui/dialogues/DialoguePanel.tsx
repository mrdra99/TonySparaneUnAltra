// OWNER: UI/UX
// Stub (Architecture). Visibile in fase 'dialogue'. Legge `dialogue.state` (DialogueState) dallo store:
//   active | consequence -> mostra la battuta; avanti con Spazio / E / tap / click ('advance' | 'interact')
//   choice                -> pulsanti scelta (anche tasti 1-3: 'choice1'..'choice3'); su touch min 44px
// Il typewriter (e "completa il testo al primo avanzamento") e' responsabilita' di questo componente.
// Nome/ritratto: resolveSpeaker(line.speaker, content).
import { content } from '@/data';
import { resolveSpeaker } from '@/game/dialogue/speakers';
import { useInputAction } from '@/hooks/useInputAction';
import { gameStore, useGameStore } from '@/store/gameStore';

function advance(): void {
  const s = gameStore.getState();
  if (s.phase !== 'dialogue') return;
  const st = s.dialogue.state.status;
  if (st === 'active' || st === 'consequence') s.advanceDialogue();
}

function choose(i: number): void {
  const s = gameStore.getState();
  if (s.phase === 'dialogue' && s.dialogue.state.status === 'choice') s.chooseDialogue(i);
}

export function DialoguePanel() {
  const phase = useGameStore((s) => s.phase);
  const state = useGameStore((s) => s.dialogue.state);
  const close = useGameStore((s) => s.closeDialogue);
  useInputAction('advance', advance);
  useInputAction('interact', advance);
  useInputAction('choice1', () => choose(0));
  useInputAction('choice2', () => choose(1));
  useInputAction('choice3', () => choose(2));
  if (phase !== 'dialogue' || state.status === 'idle' || state.status === 'ended') return null;
  const speaker = resolveSpeaker(state.line.speaker, content);
  return (
    <div
      role="dialog"
      aria-label="Dialogo"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'auto' }}
      onClick={advance}
    >
      <strong>{speaker.name}</strong>
      <p>{state.line.text}</p>
      {state.status === 'choice' &&
        state.choices.map((c) => (
          <button
            key={c.index}
            style={{ minHeight: 44, display: 'block' }}
            onClick={(e) => {
              e.stopPropagation();
              choose(c.index);
            }}
          >
            {c.index + 1}. {c.text}
          </button>
        ))}
      <button
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
      >
        CHIUDI (Esc)
      </button>
    </div>
  );
}
