import { act, fireEvent, render, screen } from '@testing-library/react';
import { gameStore } from '@/store/gameStore';
import { Settings } from './Settings';

describe('Settings', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() =>
      gameStore.setState({
        phase: 'menu',
        panel: 'settings',
        settings: { ...gameStore.getState().settings, volume: 0.7, muted: false, quality: 'auto' },
      }),
    );
  });

  it('compare solo con panel settings', () => {
    act(() => gameStore.setState({ panel: 'none' }));
    const { container } = render(<Settings />);
    expect(container).toBeEmptyDOMElement();
  });

  it('volume, muto, animazioni, qualita e camera aggiornano lo store', () => {
    render(<Settings />);
    fireEvent.change(screen.getByLabelText('Volume'), { target: { value: '0.3' } });
    expect(gameStore.getState().settings.volume).toBeCloseTo(0.3);
    fireEvent.click(screen.getByLabelText('Muto'));
    expect(gameStore.getState().settings.muted).toBe(true);
    fireEvent.click(screen.getByLabelText('Riduci animazioni'));
    expect(gameStore.getState().settings.reducedMotion).toBe(true);
    fireEvent.click(screen.getByLabelText('Bassa'));
    expect(gameStore.getState().settings.quality).toBe('low');
    fireEvent.change(screen.getByLabelText('Distanza camera'), { target: { value: '8' } });
    expect(gameStore.getState().settings.cameraDistance).toBe(8);
    fireEvent.change(screen.getByLabelText('Sensibilità camera'), { target: { value: '2' } });
    expect(gameStore.getState().settings.mouseSensitivity).toBe(2);
  });

  it('AZZERA PROGRESSI chiede conferma', () => {
    act(() =>
      gameStore.getState().applyEffects([{ type: 'addCazzate', amount: 5, reason: 'Test' }]),
    );
    render(<Settings />);
    fireEvent.click(screen.getByText('AZZERA PROGRESSI'));
    expect(gameStore.getState().progress.cazzate).toBe(5);
    fireEvent.click(screen.getByText('Annulla'));
    expect(gameStore.getState().progress.cazzate).toBe(5);
    fireEvent.click(screen.getByText('AZZERA PROGRESSI'));
    fireEvent.click(screen.getByText('Sì, azzera'));
    expect(gameStore.getState().progress.cazzate).toBe(0);
  });

  it('Chiudi torna al menu', () => {
    render(<Settings />);
    fireEvent.click(screen.getAllByText('Chiudi')[0] as HTMLElement);
    expect(gameStore.getState().panel).toBe('none');
  });
});
