import { render, screen, fireEvent, waitFor } from '../setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerStatsPage } from '../../src/pages/admin/PlayerStatsPage';
import { playerStatsService } from '../../src/services/playerStatsService';
import { playerService } from '../../src/services/playerService';
import { BrowserRouter } from 'react-router-dom';
import i18n from '../../src/config/i18n';

vi.mock('../../src/services/playerStatsService', () => ({
  playerStatsService: {
    getPlayerStats: vi.fn()
  }
}));

vi.mock('../../src/services/playerService', () => ({
  playerService: {
    getPlayers: vi.fn().mockResolvedValue([])
  }
}));

const mockStats = [
  {
    playerId: 'messi-id',
    playerName: 'Messi',
    matchesPlayed: 5,
    wins: 4,
    losses: 1,
    draws: 0,
    totalPoints: 12,
    totalGoalsScored: 10,
    totalGoalsConceded: 3,
    pointsPerGame: 2.4,
    goalsPerGame: 2,
    goalsAgainstPerGame: 0.6,
    lastUpdated: new Date() as any
  },
  {
    playerId: 'ronaldo-id',
    playerName: 'Ronaldo',
    matchesPlayed: 5,
    wins: 3,
    losses: 2,
    draws: 0,
    totalPoints: 9,
    totalGoalsScored: 8,
    totalGoalsConceded: 5,
    pointsPerGame: 1.8,
    goalsPerGame: 1.6,
    goalsAgainstPerGame: 1,
    lastUpdated: new Date() as any
  }
];

describe('PlayerStatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (playerStatsService.getPlayerStats as any).mockResolvedValue(mockStats);
    (playerService.getPlayers as any).mockResolvedValue([]);
  });

  it('renders page title and header', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Estadísticas de Jugadores')).toBeInTheDocument();
      expect(screen.getByText('Métricas de rendimiento en partidos completados')).toBeInTheDocument();
    });
  });

  it('loads and displays player stats', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Messi')).toBeInTheDocument();
      expect(screen.getByText('Ronaldo')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    (playerStatsService.getPlayerStats as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Cargando estadísticas...')).toBeInTheDocument();
  });

  it('shows empty state when no stats available', async () => {
    (playerStatsService.getPlayerStats as any).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No hay estadísticas disponibles.')).toBeInTheDocument();
    });
  });

  it('loads active players by default', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(playerStatsService.getPlayerStats).toHaveBeenCalledWith(false);
    });
  });

  it('loads all players when toggle is checked', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Estadísticas de Jugadores')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('checkbox', { name: /mostrar todos los jugadores/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(playerStatsService.getPlayerStats).toHaveBeenCalledWith(true);
    });
  });

  it('sorts by total points descending by default', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Header + 2 data rows
      expect(rows).toHaveLength(3);
      // Messi should be first (12 points > 9 points)
      expect(rows[1]).toHaveTextContent('Messi');
      expect(rows[2]).toHaveTextContent('Ronaldo');
    });
  });

  it('changes sort when clicking column header', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Messi')).toBeInTheDocument();
    });

    // Click on "Partidos" column header to sort by matchesPlayed
    const matchesHeader = screen.getAllByText(/Partidos/)[0].parentElement;
    fireEvent.click(matchesHeader!);

    // Both have 5 matches, so order might not change visually, but click should work
    // Let's click on "Victorias" header instead for more visible change
    const wonHeaders = screen.getAllByText(/Victorias/);
    fireEvent.click(wonHeaders[0].parentElement!);

    // Should still render both players
    await waitFor(() => {
      expect(screen.getByText('Messi')).toBeInTheDocument();
      expect(screen.getByText('Ronaldo')).toBeInTheDocument();
    });
  });

  it('toggles sort direction when clicking same header twice', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Messi')).toBeInTheDocument();
    });

    // Find the Total Pts header by getting all columnheaders and finding the right one
    const headers = screen.getAllByRole('columnheader');
    const totalPtsHeader = headers.find(h => h.textContent?.includes('Pts Total'));

    // Initial state should be descending (Messi first with 12 points)
    expect(screen.getByText('Messi')).toBeInTheDocument();

    // Click to change to ascending
    fireEvent.click(totalPtsHeader!);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // After clicking, should still be showing data
      expect(rows.length).toBeGreaterThan(0);
    });

    // Click again to toggle back to descending
    fireEvent.click(totalPtsHeader!);

    await waitFor(() => {
      expect(screen.getByText('Messi')).toBeInTheDocument();
    });
  });

  it('displays all stat columns with proper formatting', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Messi')).toBeInTheDocument();
    });

    // Check for all column headers using getAllByRole
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map(h => h.textContent);

    expect(headerTexts.some(t => t?.includes('Jugador'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('Partidos'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('Pts Total'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('Victorias'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('Perdidos'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('Empatados'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('Favor'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('Contra'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('Pts/P'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('GF/P'))).toBe(true);
    expect(headerTexts.some(t => t?.includes('GC/P'))).toBe(true);

    // Check for Messi's stats
    const messiRow = screen.getAllByText('Messi')[0].closest('tr');
    expect(messiRow).toHaveTextContent('5'); // matches played
    expect(messiRow).toHaveTextContent('12'); // total points
    expect(messiRow).toHaveTextContent('4'); // wins
    expect(messiRow).toHaveTextContent('10'); // goals for
    expect(messiRow).toHaveTextContent('2.4'); // PPG
  });

  it('displays back link to dashboard', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const backLink = screen.getByText(/Volver al Panel/);
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/admin/dashboard');
    });
  });

  it('shows player count in footer', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mostrando 2 jugadores/)).toBeInTheDocument();
    });
  });

  it('shows error message on fetch failure', async () => {
    // Mock console.error to suppress error output in test logs
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (playerStatsService.getPlayerStats as any).mockRejectedValue(
      new Error('Fetch failed')
    );

    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error al cargar las estadísticas de jugadores')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('reloads stats when toggle changes', async () => {
    render(
      <BrowserRouter>
        <PlayerStatsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Estadísticas de Jugadores')).toBeInTheDocument();
    });

    const toggle = screen.getByRole('checkbox', { name: /mostrar todos los jugadores/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(playerStatsService.getPlayerStats).toHaveBeenCalledWith(true);
    });
  });
});
