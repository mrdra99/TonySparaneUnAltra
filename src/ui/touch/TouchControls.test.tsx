import { act, fireEvent, render, screen } from '@testing-library/react';
import { input } from '@/game/core/input';
import { gameStore } from '@/store/gameStore';
import { TouchControls } from './TouchControls';

vi.mock('@/hooks/useDeviceProfile', () => ({
  useDeviceProfile: () => ({ isTouch: true }),
}));

function startPlaying(): void {
  act(() => {
    gameStore.getState().newGame();
    gameStore.getState().finishIntro();
  });
}

describe('TouchControls', () => {
  beforeAll(() => {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  beforeEach(() => {
    window.localStorage.clear();
    input.reset();
    act(() => gameStore.setState({ phase: 'menu', panel: 'none', hasSave: false }));
  });

  it('compare solo in fase playing e sparisce in dialogo', () => {
    const { container } = render(<TouchControls />);
    expect(container).toBeEmptyDOMElement();
    startPlaying();
    expect(screen.getByRole('button', { name: 'Pausa' })).toBeInTheDocument();
    act(() => gameStore.setState({ phase: 'dialogue' }));
    expect(container).toBeEmptyDOMElement();
  });

  it('il pulsante di interazione e disabilitato senza prompt e mostra l etichetta con un prompt', () => {
    render(<TouchControls />);
    startPlaying();
    const triggered = vi.fn();
    const off = input.onAction('interact', triggered);
    const btn = screen.getByRole('button', { name: 'Interagisci' });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(btn);
    expect(triggered).not.toHaveBeenCalled();

    act(() => gameStore.getState().setNearbyPrompt('PARLA CON MARCO'));
    const active = screen.getByRole('button', { name: 'PARLA CON MARCO' });
    expect(active).toHaveAttribute('aria-disabled', 'false');
    fireEvent.click(active);
    expect(triggered).toHaveBeenCalledTimes(1);
    off();
  });

  it('pausa e missioni scrivono sull input unificato', () => {
    render(<TouchControls />);
    startPlaying();
    const pause = vi.fn();
    const missions = vi.fn();
    const offA = input.onAction('pause', pause);
    const offB = input.onAction('missions', missions);
    fireEvent.click(screen.getByRole('button', { name: 'Pausa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Missioni' }));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(missions).toHaveBeenCalledTimes(1);
    offA();
    offB();
  });

  it('CORRI tenuto premuto imposta la corsa touch e il rilascio la toglie', () => {
    render(<TouchControls />);
    startPlaying();
    const run = screen.getByRole('button', { name: /Corri/ });
    fireEvent.pointerDown(run, { pointerId: 7 });
    expect(input.run).toBe(true);
    fireEvent.pointerUp(run, { pointerId: 7 });
    expect(input.run).toBe(false);
  });

  it('smontando rilascia joystick e corsa', () => {
    const { unmount } = render(<TouchControls />);
    startPlaying();
    input.setJoystick(1, 1);
    input.setTouchRun(true);
    unmount();
    expect(input.moveAxis.x).toBe(0);
    expect(input.moveAxis.y).toBe(0);
    expect(input.run).toBe(false);
  });
});
