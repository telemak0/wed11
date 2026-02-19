import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../setup';
import { BrowserRouter } from 'react-router-dom';
import { PlayerLoginPage } from '../../src/pages/public/PlayerLoginPage';
import * as PlayerAuthContext from '../../src/context/PlayerAuthContext';
import * as playerServiceModule from '../../src/services/playerService';

const mockLogin = vi.fn();

vi.spyOn(PlayerAuthContext, 'usePlayerAuth').mockReturnValue({
  isAuthenticated: false,
  playerId: null,
  playerName: null,
  login: mockLogin,
  logout: vi.fn(),
});

// Mock the playerService module
vi.mock('../../src/services/playerService', () => ({
  playerService: {
    getPlayerByCode: vi.fn(),
  },
}));

describe('PlayerLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form with code input', () => {
    render(
      <BrowserRouter>
        <PlayerLoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Acceso Jugador')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('should enable submit button when code is valid', () => {
    render(
      <BrowserRouter>
        <PlayerLoginPage />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('0000') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(input, { target: { value: '1234' } });

    expect(submitButton).not.toBeDisabled();
  });

  it('should disable submit button when code is less than 4 digits', () => {
    render(
      <BrowserRouter>
        <PlayerLoginPage />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('0000') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(input, { target: { value: '123' } });

    expect(submitButton).toBeDisabled();
  });

  it('should show error message when player not found', async () => {
    vi.mocked(playerServiceModule.playerService.getPlayerByCode).mockResolvedValue(null);

    render(
      <BrowserRouter>
        <PlayerLoginPage />
      </BrowserRouter>
    );

    const input = screen.getByPlaceholderText('0000') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(input, { target: { value: '9999' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Código inválido. Inténtalo de nuevo.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

