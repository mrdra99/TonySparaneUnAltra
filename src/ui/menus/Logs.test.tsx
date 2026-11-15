import { act, render, screen } from '@testing-library/react';
import { gameStore } from '@/store/gameStore';
import { LegendsLog } from './LegendsLog';
import { MissionLog } from './MissionLog';

describe('MissionLog / LegendsLog', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => {
      gameStore.setState({ phase: 'menu', panel: 'none', hasSave: false });
      gameStore.getState().newGame();
      gameStore.getState().finishIntro();
    });
  });

  it('MissionLog mostra la missione attiva con obiettivi e ricompensa', () => {
    act(() => gameStore.getState().openPanel('missions'));
    render(<MissionLog />);
    expect(screen.getByRole('dialog', { name: 'Missioni' })).toBeInTheDocument();
    expect(screen.getByText('LA NINNA CANNA')).toBeInTheDocument();
    expect(screen.getByText('IN CORSO')).toBeInTheDocument();
    expect(screen.getByText(/Ricompensa:/)).toBeInTheDocument();
  });

  it('LegendsLog mostra le storie non scoperte con ??? e quelle scoperte con titolo e punti', () => {
    act(() => gameStore.getState().openPanel('legends'));
    render(<LegendsLog />);
    expect(screen.getAllByText('???').length).toBeGreaterThan(0);
    expect(screen.queryByText('La leggenda della ninna canna')).not.toBeInTheDocument();
    act(() =>
      gameStore.getState().applyEffects([{ type: 'unlockStory', storyId: 'story-ninna-canna' }]),
    );
    expect(screen.getByText('La leggenda della ninna canna')).toBeInTheDocument();
    expect(screen.getByText('+50 pt')).toBeInTheDocument();
  });
});
