import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { input } from '@/game/core/input';
import { gameStore } from '@/store/gameStore';
import { DialoguePanel } from './DialoguePanel';

const LINE = 'Oh Tony, ma alla fine quei cinque euro?';

function openDialogue(): void {
  act(() => {
    gameStore.getState().newGame();
    gameStore.getState().finishIntro();
    gameStore.getState().startDialogue('marco-cinque-euro');
  });
}

/** Testo mostrato dal typewriter (la copia aria-hidden), non il sottotitolo completo per screen reader. */
function typedText(container: HTMLElement): string {
  return container.querySelector('p[aria-hidden="true"]')?.textContent ?? '';
}

describe('DialoguePanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => gameStore.setState({ phase: 'menu', panel: 'none', hasSave: false }));
  });

  it('non compare fuori dal dialogo', () => {
    const { container } = render(<DialoguePanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra nome, sottotitolo completo e scelte numerate', () => {
    render(<DialoguePanel />);
    openDialogue();
    expect(screen.getByText('Marco')).toBeInTheDocument();
    expect(screen.getByText(LINE)).toBeInTheDocument(); // sottotitolo sempre completo (aria-live)
    expect(
      within(screen.getByRole('list', { name: 'Risposte' })).getAllByRole('button').length,
    ).toBeGreaterThanOrEqual(2);
  });

  it('il typewriter rivela il testo e il primo tocco lo completa', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<DialoguePanel />);
      openDialogue();
      expect(typedText(container)).toBe('');
      act(() => {
        vi.advanceTimersByTime(120);
      });
      expect(typedText(container).length).toBeGreaterThan(0);
      expect(typedText(container).length).toBeLessThan(LINE.length);
      fireEvent.click(screen.getByRole('dialog', { name: 'Dialogo' }));
      expect(typedText(container)).toBe(LINE);
    } finally {
      vi.useRealTimers();
    }
  });

  it('le scelte funzionano da tastiera: tasto 1', () => {
    render(<DialoguePanel />);
    openDialogue();
    act(() => input.trigger('choice1'));
    expect(gameStore.getState().dialogue.state.status).not.toBe('choice');
    expect(gameStore.getState().progress.stats.choicesMade).toBe(1);
  });

  it('frecce giu + Invio scelgono la seconda risposta', () => {
    render(<DialoguePanel />);
    openDialogue();
    act(() => {
      fireEvent.keyDown(window, { key: 'ArrowDown' });
    });
    act(() => {
      fireEvent.keyDown(window, { key: 'Enter' });
    });
    expect(gameStore.getState().progress.stats.choicesMade).toBe(1);
  });

  it('avanza solo dopo aver completato il testo, e si chiude con CHIUDI', () => {
    vi.useFakeTimers();
    try {
      render(<DialoguePanel />);
      openDialogue();
      act(() => input.trigger('choice1'));
      act(() => {
        vi.advanceTimersByTime(50); // qualche carattere e' comparso
      });
      const before = gameStore.getState().dialogue.state;
      act(() => input.trigger('advance')); // completa il testo
      expect(gameStore.getState().dialogue.state).toBe(before);
      act(() => input.trigger('advance')); // avanza
      expect(gameStore.getState().dialogue.state).not.toBe(before);
      fireEvent.click(screen.getByText(/Chiudi/));
      expect(gameStore.getState().phase).toBe('playing');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
