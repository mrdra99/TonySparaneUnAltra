import { act, fireEvent, render, screen } from '@testing-library/react';
import { gameStore } from '@/store/gameStore';
import { MainMenu } from './MainMenu';

describe('MainMenu', () => {
  beforeEach(() => {
    window.localStorage.clear();
    act(() => gameStore.setState({ phase: 'menu', panel: 'none', hasSave: false }));
  });

  it('mostra titolo, sottotitolo e i pulsanti; CONTINUA solo con salvataggio', () => {
    render(<MainMenu />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe("TONY SPARANE UN'ALTRA");
    expect(screen.getByText('Le leggende della piazzetta.')).toBeInTheDocument();
    expect(screen.getByText('NUOVA PARTITA')).toBeInTheDocument();
    expect(screen.getByText('COME SI GIOCA')).toBeInTheDocument();
    expect(screen.getByText('CREDITI')).toBeInTheDocument();
    expect(screen.queryByText('CONTINUA')).not.toBeInTheDocument();
    act(() => gameStore.setState({ hasSave: true }));
    expect(screen.getByText('CONTINUA')).toBeInTheDocument();
  });

  it('NUOVA PARTITA avvia l intro', () => {
    render(<MainMenu />);
    fireEvent.click(screen.getByText('NUOVA PARTITA'));
    expect(gameStore.getState().phase).toBe('intro');
  });

  it('COME SI GIOCA mostra comandi desktop e touch; CREDITI mostra il disclaimer', () => {
    render(<MainMenu />);
    fireEvent.click(screen.getByText('COME SI GIOCA'));
    expect(gameStore.getState().panel).toBe('howto');
    expect(screen.getByRole('dialog', { name: 'Come si gioca' })).toBeInTheDocument();
    expect(screen.getByText('Joystick a sinistra')).toBeInTheDocument();
    expect(screen.getByText('W A S D / frecce')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Indietro'));
    expect(gameStore.getState().panel).toBe('none');

    fireEvent.click(screen.getByText('CREDITI'));
    expect(screen.getByRole('note').textContent).toMatch(/Opera di finzione satirica/);
    expect(screen.getByText(/sintetizzati in tempo reale con WebAudio/)).toBeInTheDocument();
  });

  it('non compare fuori dalla fase menu', () => {
    act(() => gameStore.setState({ phase: 'playing' }));
    const { container } = render(<MainMenu />);
    expect(container).toBeEmptyDOMElement();
  });
});
