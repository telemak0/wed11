import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '../setup';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PlayerDetailPage } from '../../src/pages/admin/PlayerDetailPage';
import { playerDetailService } from '../../src/services/playerDetailService';
import { playerService } from '../../src/services/playerService';
import { Player, PlayerTeammateStats, PlayerOpponentStats } from '../../src/types';

vi.mock('../../src/services/playerDetailService');
vi.mock('../../src/services/playerService');

const mockPlayer: Player = { id: 'player1', name: 'John Doe', status: 'active' };

const mockTeammates: PlayerTeammateStats[] = [
  { playerId: 'player2', playerName: 'Jane Smith', gamesPlayed: 5 },
  { playerId: 'player3', playerName: 'Bob Johnson', gamesPlayed: 3 }
];

const mockOpponents: PlayerOpponentStats[] = [
  { playerId: 'player4', playerName: 'Alice Brown', gamesPlayed: 4 },
  { playerId: 'player5', playerName: 'Charlie Davis', gamesPlayed: 2 }
];

const renderWithRouter = (initialRoute = '/admin/player-stats/player1') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/admin/player-stats/:playerId" element={<PlayerDetailPage />} />
        <Route path="/admin/player-stats" element={<div>Back to stats</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('PlayerDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(playerService.getPlayerById).mockResolvedValue(mockPlayer);
    vi.mocked(playerDetailService.getTopTeammates).mockResolvedValue(mockTeammates);
    vi.mocked(playerDetailService.getTopOpponents).mockResolvedValue(mockOpponents);
    vi.mocked(playerDetailService.getTeamDistribution).mockResolvedValue({ white: 6, red: 4 });
    vi.mocked(playerDetailService.getResultDistribution).mockResolvedValue({
      wins: 5,
      draws: 2,
      losses: 3
    });
  });

  it('renders loading state initially', () => {
    renderWithRouter();
    expect(screen.getByText('Cargando detalles del jugador...')).toBeInTheDocument();
  });

  it('renders player name in header', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('displays back button', async () => {
    renderWithRouter();

    await waitFor(() => {
      const backButton = screen.getByText('← Volver a Estadísticas de Jugador');
      expect(backButton).toBeInTheDocument();
    });
  });

  it('displays team distribution section', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Distribución de Equipos')).toBeInTheDocument();
    });
  });

  it('displays results distribution section', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Distribución de Resultados')).toBeInTheDocument();
    });
  });

  it('displays teammates section', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Mejores Compañeros de Equipo')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('displays opponents section', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Mejores Oponentes')).toBeInTheDocument();
      expect(screen.getByText('Alice Brown')).toBeInTheDocument();
      expect(screen.getByText('Charlie Davis')).toBeInTheDocument();
    });
  });

  it('handles missing player gracefully', async () => {
    vi.mocked(playerService.getPlayerById).mockResolvedValue(null);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Jugador no encontrado')).toBeInTheDocument();
    });
  });

  it('handles loading errors', async () => {
    vi.mocked(playerService.getPlayerById).mockRejectedValue(new Error('Failed to load'));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Error al cargar detalles del jugador')).toBeInTheDocument();
    });
  });

  it('calls playerDetailService with correct playerId', async () => {
    renderWithRouter('/admin/player-stats/custom-id');

    await waitFor(() => {
      expect(vi.mocked(playerDetailService.getTopTeammates)).toHaveBeenCalledWith('custom-id');
      expect(vi.mocked(playerDetailService.getTopOpponents)).toHaveBeenCalledWith('custom-id');
      expect(vi.mocked(playerDetailService.getTeamDistribution)).toHaveBeenCalledWith('custom-id');
      expect(vi.mocked(playerDetailService.getResultDistribution)).toHaveBeenCalledWith('custom-id');
    });
  });

  it('displays empty state for teammates when none available', async () => {
    vi.mocked(playerDetailService.getTopTeammates).mockResolvedValue([]);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('No se encontraron compañeros de equipo')).toBeInTheDocument();
    });
  });

  it('displays empty state for opponents when none available', async () => {
    vi.mocked(playerDetailService.getTopOpponents).mockResolvedValue([]);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('No se encontraron oponentes')).toBeInTheDocument();
    });
  });
});
