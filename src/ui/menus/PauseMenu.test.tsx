import { act, fireEvent, render, screen } from '@testing-library/react';
import { gameStore } from '@/store/gameStore';
import { PauseMenu } from './PauseMenu';

function pauseGame(): void {
  act(() => {
    gameStore.getState().newGame();
    gameStore.getState().finishIntro();
    gameStore.getState().pause();
  });
}

describe('PauseMenu', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => gameStore.setState({ phase: 'menu', panel: 'none', hasSave: false }));
  });

  it('compare solo in pausa e ha tutte le voci', () => {
    const { container } = render(<PauseMenu />);
    expect(container).toBeEmptyDOMElement();
    pauseGame();
    expect(screen.getByRole('dialog', { name: 'PAUSA' })).toBeInTheDocument();
    for (const label of [
      'RIPRENDI',
      'MISSIONI',
      'REGISTRO DELLE LEGGENDE',
      'IMPOSTAZIONI',
      'RIAVVIA PARTITA',
      'TORNA AL MENU',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('RIPRENDI torna al gioco; i sotto-pannelli si aprono dallo store', () => {
    render(<PauseMenu />);
    pauseGame();
    fireEvent.click(screen.getByText('MISSIONI'));
    expect(gameStore.getState().panel).toBe('missions');
    act(() => gameStore.getState().closePanel());
    expect(gameStore.getState().panel).toBe('pause');
    fireEvent.click(screen.getByText('RIPRENDI'));
    expect(gameStore.getState().phase).toBe('playing');
  });

  it('RIAVVIA PARTITA chiede conferma prima di azzerare', () => {
    render(<PauseMenu />);
    pauseGame();
    act(() =>
      gameStore.getState().applyEffects([{ type: 'addCazzate', amount: 10, reason: 'Test' }]),
    );
    fireEvent.click(screen.getByText('RIAVVIA PARTITA'));
    expect(gameStore.getState().phase).toBe('paused');
    expect(gameStore.getState().progress.cazzate).toBe(10);
    fireEvent.click(screen.getByText('Annulla'));
    expect(screen.getByText('RIPRENDI')).toBeInTheDocument();
    fireEvent.click(screen.getByText('RIAVVIA PARTITA'));
    fireEvent.click(screen.getByText('Sì, ricomincia'));
    expect(gameStore.getState().progress.cazzate).toBe(0);
    expect(gameStore.getState().phase).toBe('intro');
  });

  it('TORNA AL MENU', () => {
    render(<PauseMenu />);
    pauseGame();
    fireEvent.click(screen.getByText('TORNA AL MENU'));
    expect(gameStore.getState().phase).toBe('menu');
  });
});
