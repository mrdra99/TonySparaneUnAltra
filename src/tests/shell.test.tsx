import { act, fireEvent, render, screen } from '@testing-library/react';
import { DialoguePanel } from '@/ui/dialogues/DialoguePanel';
import { Hud } from '@/ui/hud/Hud';
import { MainMenu } from '@/ui/menus/MainMenu';
import { PauseMenu } from '@/ui/menus/PauseMenu';
import { Notifications } from '@/ui/notifications/Notifications';
import { gameStore } from '@/store/gameStore';
import { input } from '@/game/core/input';

/** Test di integrazione dello shell UI <-> store (senza Canvas WebGL). */
describe('shell UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => {
      gameStore.setState({ phase: 'menu', panel: 'none', hasSave: false });
    });
  });

  it('il menu mostra i pulsanti e CONTINUA solo con salvataggio', () => {
    const { unmount } = render(<MainMenu />);
    expect(screen.getByText('NUOVA PARTITA')).toBeInTheDocument();
    expect(screen.getByText('COME SI GIOCA')).toBeInTheDocument();
    expect(screen.getByText('CREDITI')).toBeInTheDocument();
    expect(screen.queryByText('CONTINUA')).not.toBeInTheDocument();
    act(() => gameStore.setState({ hasSave: true }));
    expect(screen.getByText('CONTINUA')).toBeInTheDocument();
    unmount();
  });

  it('NUOVA PARTITA avvia l intro; HUD e pausa funzionano', () => {
    render(
      <>
        <MainMenu />
        <Hud />
        <PauseMenu />
        <Notifications />
      </>,
    );
    fireEvent.click(screen.getByText('NUOVA PARTITA'));
    expect(gameStore.getState().phase).toBe('intro');
    act(() => gameStore.getState().finishIntro());
    expect(screen.getByText(/CAZZATOMETRO 0\/100/)).toBeInTheDocument();
    act(() => gameStore.getState().pause());
    expect(screen.getByText('PAUSA')).toBeInTheDocument();
    fireEvent.click(screen.getByText('RIPRENDI'));
    expect(gameStore.getState().phase).toBe('playing');
  });

  it('dialogo: la UI mostra la battuta, le scelte e avanza con Spazio (azione input)', () => {
    render(<DialoguePanel />);
    act(() => {
      gameStore.getState().newGame();
      gameStore.getState().finishIntro();
      gameStore.getState().startDialogue('marco-cinque-euro');
    });
    expect(screen.getByText('Oh Tony, ma alla fine quei cinque euro?')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Fra, te li do domani/));
    expect(screen.getByText(/Domani, sempre domani/)).toBeInTheDocument();
    act(() => input.trigger('advance'));
    expect(screen.getByText('Oh fraaaa, ci vediamo.')).toBeInTheDocument();
    act(() => input.trigger('advance'));
    expect(gameStore.getState().phase).toBe('playing');
    expect(gameStore.getState().progress.missions['ninna-canna']?.status).toBe('completed');
  });
});
