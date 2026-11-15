import { act, fireEvent, render, screen } from '@testing-library/react';
import { FINALE_KO_FLAG } from '@/game/progression/cazzatometro';
import { gameStore } from '@/store/gameStore';
import { EndingScreen, makeConfetti } from './EndingScreen';

describe('EndingScreen', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => {
      gameStore.setState({ phase: 'menu', panel: 'none', hasSave: false });
      gameStore.getState().newGame();
      gameStore.getState().finishIntro();
    });
  });

  it('non compare durante il gioco', () => {
    const { container } = render(<EndingScreen />);
    expect(container).toBeEmptyDOMElement();
  });

  it('prima del reveal mostra i fumetti, dopo la scheda con punteggio e statistiche', () => {
    render(<EndingScreen />);
    act(() =>
      gameStore.getState().applyEffects([
        { type: 'setFlag', flag: FINALE_KO_FLAG },
        { type: 'addCazzate', amount: 100, reason: 'Finale' },
      ]),
    );
    expect(gameStore.getState().phase).toBe('ending');
    expect(screen.getByText('SBAM!')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => gameStore.getState().revealEnding());
    expect(screen.getByRole('dialog', { name: 'Fine demo' })).toBeInTheDocument();
    expect(screen.getByText("TONY NE HA SPARATA UN'ALTRA!")).toBeInTheDocument();
    expect(screen.getByText('Missioni')).toBeInTheDocument();
    expect(screen.getByText('Leggende')).toBeInTheDocument();
    expect(screen.queryByText('SBAM!')).not.toBeInTheDocument();
  });

  it('RICOMINCIA e TORNA AL MENU', () => {
    render(<EndingScreen />);
    act(() => {
      gameStore.getState().applyEffects([
        { type: 'setFlag', flag: FINALE_KO_FLAG },
        { type: 'addCazzate', amount: 100, reason: 'Finale' },
      ]);
      gameStore.getState().revealEnding();
    });
    fireEvent.click(screen.getByText('TORNA AL MENU'));
    expect(gameStore.getState().phase).toBe('menu');
  });

  it('i coriandoli sono deterministici', () => {
    expect(makeConfetti(10)).toEqual(makeConfetti(10));
    expect(makeConfetti(10)).toHaveLength(10);
  });
});
