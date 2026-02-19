import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../setup';
import { BrowserRouter } from 'react-router-dom';
import i18n from '../../src/config/i18n';
import { PlayerDashboardPage } from '../../src/pages/public/PlayerDashboardPage';
import * as PlayerAuthContext from '../../src/context/PlayerAuthContext';
import * as playerStatsService from '../../src/services/playerStatsService';
import * as playerDetailService from '../../src/services/playerDetailService';
import * as playerService from '../../src/services/playerService';

const mockLogout = vi.fn();

vi.spyOn(PlayerAuthContext, 'usePlayerAuth').mockReturnValue({
  isAuthenticated: true,
  playerId: 'player123',
  playerName: 'John Doe',
  login: vi.fn(),
  logout: mockLogout,
});

vi.mock('../../src/services/playerStatsService', () => ({
  playerStatsService: {
    calculateStatsForPlayer: vi.fn(),
    getPlayerStats: vi.fn().mockResolvedValue([]),
  }
}));
vi.mock('../../src/services/playerDetailService', () => ({
  playerDetailService: {
    getTopTeammates: vi.fn(),
    getTopOpponents: vi.fn(),
  }
}));
vi.mock('../../src/services/playerService', () => ({
  playerService: {
    getPlayers: vi.fn().mockResolvedValue([]),
  }
}));

const mockStats = {
  matchesPlayed: 10,
  wins: 7,
  draws: 2,
  losses: 1,
  totalPoints: 23,
  pointsPerGame: 2.3,
  totalGoalsScored: 15,
  goalsPerGame: 1.5,
  totalGoalsConceded: 5,
  goalsAgainstPerGame: 0.5,
};

describe('PlayerDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    i18n.changeLanguage('en');
    // Default mocks
    (playerStatsService.playerStatsService.getPlayerStats as any).mockResolvedValue([]);
    (playerDetailService.playerDetailService.getTopTeammates as any).mockResolvedValue([]);
    (playerDetailService.playerDetailService.getTopOpponents as any).mockResolvedValue([]);
    (playerService.playerService.getPlayers as any).mockResolvedValue([]);
  });

  it('should render loading state initially', () => {
    (playerStatsService.playerStatsService.calculateStatsForPlayer as any).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <PlayerDashboardPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render player dashboard with player name', async () => {
    (playerStatsService.playerStatsService.calculateStatsForPlayer as any).mockResolvedValue(mockStats);

    render(
      <BrowserRouter>
        <PlayerDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/match statistics/i)).toBeInTheDocument();
    });
  });

  it('should display logout button', async () => {
    (playerStatsService.playerStatsService.calculateStatsForPlayer as any).mockResolvedValue(mockStats);

    render(
      <BrowserRouter>
        <PlayerDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeInTheDocument();
    });
  });

  it('should call logout when logout button is clicked', async () => {
    (playerStatsService.playerStatsService.calculateStatsForPlayer as any).mockResolvedValue(mockStats);

    render(
      <BrowserRouter>
        <PlayerDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);
    });

    expect(mockLogout).toHaveBeenCalled();
  });

  it('should display player statistics when loaded', async () => {
    (playerStatsService.playerStatsService.calculateStatsForPlayer as any).mockResolvedValue(mockStats);

    render(
      <BrowserRouter>
        <PlayerDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // matchesPlayed
      expect(screen.getByText('7')).toBeInTheDocument(); // wins
      expect(screen.getByText('2')).toBeInTheDocument(); // draws
      expect(screen.getByText('1')).toBeInTheDocument(); // losses
    });
  });

  it('should display no stats message when stats are empty', async () => {
    const emptyStats = {
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      totalPoints: 0,
      pointsPerGame: 0,
      totalGoalsScored: 0,
      goalsPerGame: 0,
      totalGoalsConceded: 0,
      goalsAgainstPerGame: 0,
    };
    (playerStatsService.playerStatsService.calculateStatsForPlayer as any).mockResolvedValue(emptyStats);

    render(
      <BrowserRouter>
        <PlayerDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/matches played/i)).toBeInTheDocument();
      expect(screen.getByText(/no teammates found/i)).toBeInTheDocument();
      expect(screen.getByText(/no opponents found/i)).toBeInTheDocument();
    });
  });

  it('should show error message when stats fail to load', async () => {
    (playerStatsService.playerStatsService.calculateStatsForPlayer as any).mockRejectedValue(
      new Error('Service error')
    );

    render(
      <BrowserRouter>
        <PlayerDashboardPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load your statistics/i)).toBeInTheDocument();
    });
  });
});

