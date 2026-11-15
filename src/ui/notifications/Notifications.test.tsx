import { act, render, screen } from '@testing-library/react';
import { gameStore } from '@/store/gameStore';
import { Notifications } from './Notifications';

describe('Notifications', () => {
  beforeEach(() => {
    act(() => gameStore.setState({ phase: 'playing', notifications: [] }));
  });

  it('mostra il toast di missione completata con i punti e lo rimuove dopo durationMs', () => {
    vi.useFakeTimers();
    try {
      render(<Notifications />);
      act(() =>
        gameStore.getState().pushNotification({
          kind: 'mission',
          title: 'MISSIONE COMPLETATA',
          body: 'LA NINNA CANNA',
          icon: 'Trophy',
          points: 15,
          durationMs: 1000,
        }),
      );
      expect(screen.getByText('MISSIONE COMPLETATA')).toBeInTheDocument();
      expect(screen.getByText('LA NINNA CANNA')).toBeInTheDocument();
      expect(screen.getByText('+15 CAZZATOMETRO')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(screen.queryByText('MISSIONE COMPLETATA')).not.toBeInTheDocument();
      expect(gameStore.getState().notifications).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('icona sconosciuta non rompe il rendering (fallback)', () => {
    render(<Notifications />);
    act(() =>
      gameStore.getState().pushNotification({
        kind: 'story',
        title: 'NUOVA LEGGENDA',
        icon: 'NonEsiste',
        points: 50,
        durationMs: 5000,
      }),
    );
    expect(screen.getByText('NUOVA LEGGENDA')).toBeInTheDocument();
    expect(screen.getByText('+50 PUNTI')).toBeInTheDocument();
  });
});
