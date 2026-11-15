import { act, render, screen } from '@testing-library/react';
import { gameStore } from '@/store/gameStore';
import { Hud } from './Hud';

function startPlaying(): void {
  act(() => {
    gameStore.getState().newGame();
    gameStore.getState().finishIntro();
  });
}

describe('Hud', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => gameStore.setState({ phase: 'menu', panel: 'none', hasSave: false }));
  });

  it('non compare nel menu', () => {
    const { container } = render(<Hud />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra missione, obiettivo con contatore e Cazzatometro', () => {
    render(<Hud />);
    startPlaying();
    expect(screen.getByText(/MISSIONE: LA NINNA CANNA/)).toBeInTheDocument();
    expect(screen.getByText(/^0\/\d+$/)).toBeInTheDocument();
    expect(screen.getByText(/CAZZATOMETRO 0\/100/)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Cazzatometro' });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('il Cazzatometro sale e mostra il +N che vola', () => {
    render(<Hud />);
    startPlaying();
    act(() =>
      gameStore.getState().applyEffects([{ type: 'addCazzate', amount: 10, reason: 'Test' }]),
    );
    expect(screen.getByText(/CAZZATOMETRO 10\/100/)).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Cazzatometro' })).toHaveAttribute(
      'aria-valuenow',
      '10',
    );
  });

  it('mostra il prompt di interazione e il suggerimento tastiera', () => {
    render(<Hud />);
    startPlaying();
    act(() => gameStore.getState().setNearbyPrompt('PARLA CON MARCO'));
    expect(screen.getByText(/PARLA CON MARCO/)).toBeInTheDocument();
    expect(screen.getByText('Interagisci')).toBeInTheDocument();
  });
});
