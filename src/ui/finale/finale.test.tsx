import { act, render, screen } from '@testing-library/react';
import { input } from '@/game/core/input';
import { FinaleController } from '@/levels/intercity/FinaleController';
import { FLAGS } from '@/levels/intercity/logic/ids';
import { KO_TIMELINE } from '@/levels/intercity/logic/ko';
import { CARD_MS, FADE_MS } from '@/levels/intercity/logic/transition';
import { gameStore } from '@/store/gameStore';
import { FinaleHud } from './FinaleHud';
import { KoOverlay } from './KoOverlay';
import { LevelTransition } from './LevelTransition';

function startPlaying(): void {
  window.localStorage.clear();
  act(() => {
    gameStore.setState({ phase: 'menu', panel: 'none', hasSave: false });
    gameStore.getState().newGame();
    gameStore.getState().finishIntro();
  });
}

function goTo(level: 'intercity-pisa' | 'intercity-viareggio' | 'intercity-torre'): void {
  act(() => {
    gameStore.setState({ level, levelTransition: null, phase: 'playing' });
  });
}

const setFlags = (...flags: string[]): void => {
  act(() => {
    const p = gameStore.getState().progress;
    gameStore.setState({ progress: { ...p, flags: [...p.flags, ...flags] } });
  });
};

describe('FinaleHud', () => {
  beforeEach(startPlaying);

  it('non compare in piazza', () => {
    const { container } = render(<FinaleHud />);
    expect(container).toBeEmptyDOMElement();
  });

  it('a Pisa mostra pazienza al 100% e il countdown', () => {
    goTo('intercity-pisa');
    render(<FinaleHud />);
    expect(screen.getByRole('progressbar', { name: 'Pazienza di Bogdan' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByRole('timer', { name: 'Intercity in partenza' })).toHaveTextContent('1:30');
  });

  it('la pazienza scende col prestito e il countdown sparisce dopo il treno', () => {
    goTo('intercity-pisa');
    render(<FinaleHud />);
    setFlags(FLAGS.loan);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
    setFlags(FLAGS.pisaBoarded);
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('a Viareggio mostra la colletta con Tony a 0,00 e le quote che si riempiono', () => {
    goTo('intercity-viareggio');
    render(<FinaleHud />);
    const panel = screen.getByRole('region', { name: 'Colletta alla romana' });
    expect(panel).toHaveTextContent('Tony');
    expect(panel).toHaveTextContent('0,00 €');
    expect(panel).toHaveTextContent('0,00 € / 35,00 €');
    setFlags(FLAGS.colNico);
    expect(screen.getByRole('region', { name: 'Colletta alla romana' })).toHaveTextContent(
      '7,00 € / 35,00 €',
    );
  });

  it('non compare durante la cartolina (fase intro)', () => {
    goTo('intercity-pisa');
    act(() => gameStore.setState({ phase: 'intro' }));
    const { container } = render(<FinaleHud />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('LevelTransition e FinaleController', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'Date',
        'performance',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    });
    startPlaying();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('cartolina: nero, swap del livello, ritorno al gioco', () => {
    render(<LevelTransition />);
    act(() => {
      gameStore.getState().startLevelTransition('intercity-viareggio');
    });
    expect(gameStore.getState().phase).toBe('intro');
    expect(gameStore.getState().level).toBe('piazza');
    act(() => vi.advanceTimersByTime(FADE_MS + 100));
    expect(gameStore.getState().level).toBe('intercity-viareggio');
    expect(screen.getByText('INTERCITY')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(CARD_MS + FADE_MS * 2));
    expect(gameStore.getState().phase).toBe('playing');
    expect(gameStore.getState().levelTransition).toBeNull();
  });

  it('si salta con E dopo il blocco iniziale', () => {
    render(<LevelTransition />);
    act(() => {
      gameStore.getState().startLevelTransition('intercity-torre');
    });
    act(() => vi.advanceTimersByTime(FADE_MS + 50));
    act(() => input.trigger('interact'));
    act(() => vi.advanceTimersByTime(FADE_MS + 700 + FADE_MS + 150));
    expect(gameStore.getState().phase).toBe('playing');
    expect(gameStore.getState().level).toBe('intercity-torre');
  });

  it('il controller passa alla tappa successiva appena il flag chiude la tappa', () => {
    render(<FinaleController />);
    goTo('intercity-pisa');
    act(() => {
      gameStore.getState().applyEffects([{ type: 'setFlag', flag: FLAGS.pisaBoarded }]);
    });
    expect(gameStore.getState().levelTransition?.to).toBe('intercity-viareggio');
    expect(gameStore.getState().phase).toBe('intro');
  });

  it('non avanza mentre il dialogo e ancora aperto', () => {
    render(<FinaleController />);
    goTo('intercity-pisa');
    act(() => gameStore.setState({ phase: 'dialogue' }));
    act(() => {
      gameStore.getState().applyEffects([{ type: 'setFlag', flag: FLAGS.pisaBoarded }]);
    });
    expect(gameStore.getState().levelTransition).toBeNull();
    act(() => gameStore.setState({ phase: 'playing' }));
    expect(gameStore.getState().levelTransition?.to).toBe('intercity-viareggio');
  });

  it('K.O. tecnico: scena, 100 a fine timeline, schermata finale', () => {
    render(
      <>
        <FinaleController />
        <KoOverlay />
      </>,
    );
    goTo('intercity-torre');
    act(() => {
      gameStore.getState().applyEffects([{ type: 'setFlag', flag: FLAGS.ninna }]);
    });
    expect(gameStore.getState().phase).toBe('dialogue');
    expect(gameStore.getState().finale.koStartedAt).not.toBeNull();
    expect(screen.getByText(/DING DING DING/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(KO_TIMELINE.count1 + 200));
    expect(screen.getByText('1…')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(KO_TIMELINE.banner - KO_TIMELINE.count1 + 200));
    expect(screen.getByText('K.O. TECNICO!')).toBeInTheDocument();
    expect(gameStore.getState().progress.cazzate).toBeLessThan(100);
    act(() => vi.advanceTimersByTime(KO_TIMELINE.done));
    expect(gameStore.getState().phase).toBe('ending');
    expect(gameStore.getState().progress.cazzate).toBe(100);
  });

  it('il countdown scorre a Pisa: scaduto, annuncio e nessun game over', () => {
    render(<FinaleController />);
    goTo('intercity-pisa');
    act(() => vi.advanceTimersByTime(91_000));
    const s = gameStore.getState();
    expect(s.phase).toBe('playing');
    expect(s.finale.delays).toBe(1);
    expect(s.notifications.some((n) => n.title.includes('Come sempre'))).toBe(true);
  });
});
