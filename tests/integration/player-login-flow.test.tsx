import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../setup';
import App from '../../src/App';
import { playerService } from '../../src/services/playerService';
import { playerStatsService } from '../../src/services/playerStatsService';
import { generatePlayerCode } from '../../src/utils/code-generator';
import i18n from '../../src/config/i18n';

// Mock firebase
vi.mock('../../src/lib/firebase', () => ({
  db: {},
  auth: {},
}));

// Mock services
vi.mock('../../src/services/playerService', () => ({
  playerService: {
    getPlayers: vi.fn(),
    getPlayerByCode: vi.fn(),
  }
}));
vi.mock('../../src/services/matchService', () => ({
  matchService: {
    getScheduledMatch: vi.fn().mockResolvedValue(null),
    getAllMatches: vi.fn().mockResolvedValue([]),
  }
}));
vi.mock('../../src/services/playerStatsService');
vi.mock('../../src/services/playerDetailService', () => ({
  playerDetailService: {
    getTopTeammates: vi.fn().mockResolvedValue([]),
    getTopOpponents: vi.fn().mockResolvedValue([]),
  }
}));

const mockPlayer = {
  id: 'player-1',
  name: 'Thomas Müller',
  type: 'active',
  loginCode: '1234',
  createdAt: new Date(),
};

const mockPlayerStats = {
  playerId: 'player-1',
  matchesPlayed: 12,
  wins: 8,
  draws: 2,
  losses: 2,
  pointsPerGame: 2.25,
  totalGoalsScored: 15,
  goalsPerGame: 1.25,
  totalGoalsConceded: 10,
  goalsAgainstPerGame: 0.83,
  winRate: 66.67,
  totalPoints: 26
};

describe('Player Login Flow Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.pushState({}, '', '/');
    await i18n.changeLanguage('en');
    (playerService.getPlayers as any).mockResolvedValue([]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should allow player to login with valid code and view stats', async () => {
    // Mock service responses
    vi.mocked(playerService.getPlayerByCode).mockResolvedValue(mockPlayer);
    vi.mocked(playerStatsService.calculateStatsForPlayer).mockResolvedValue(mockPlayerStats);

    render(
      <App />
    );

    // Navigate to login page
    const loginBtn = screen.getByRole('button', { name: /player login/i });
    fireEvent.click(loginBtn);

    // Should see login form
    await waitFor(() => {
      expect(screen.getByText(/enter your 4-digit code/i)).toBeInTheDocument();
    });

    // Enter valid code
    const codeInput = screen.getByRole('textbox');
    fireEvent.change(codeInput, { target: { value: '1234' } });

    // Click login button
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    // Should redirect to dashboard
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      expect(screen.getByText(/your match statistics/i)).toBeInTheDocument();
    });

    // Should display player name
    expect(screen.getByText(new RegExp(mockPlayer.name))).toBeInTheDocument();

    // Should display stats
    expect(screen.getByText("12")).toBeInTheDocument(); // matches played
    expect(screen.getByText("8")).toBeInTheDocument(); // wins
    expect(screen.getByText(/2.25/)).toBeInTheDocument(); // PPG
  });

  it('should reject invalid code and show error', async () => {
    // Mock getPlayerByCode to return null for invalid code
    vi.mocked(playerService.getPlayerByCode).mockResolvedValue(null);

    render(
      <App />
    );

    const loginBtn = screen.getByRole('button', { name: /player login/i });
    fireEvent.click(loginBtn);

    // Enter invalid code
    const codeInput = screen.getByRole('textbox');
    fireEvent.change(codeInput, { target: { value: '9999' } });

    // Click login button
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument();
    });

    // Should NOT have redirected
    expect(screen.queryByText(/your match statistics/i)).not.toBeInTheDocument();
  });

  it('should persist session to localStorage', async () => {
    vi.mocked(playerService.getPlayerByCode).mockResolvedValue(mockPlayer);
    vi.mocked(playerStatsService.calculateStatsForPlayer).mockResolvedValue(mockPlayerStats);

    render(
      <App />
    );

    // Login with valid code
    const loginBtn = screen.getByRole('button', { name: /player login/i });
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByText(/enter your 4-digit code/i)).toBeInTheDocument();
    });

    const codeInput = screen.getByRole('textbox');
    fireEvent.change(codeInput, { target: { value: '1234' } });

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      expect(screen.getByText(/your match statistics/i)).toBeInTheDocument();
    });

    // Check localStorage
    const storedSession = localStorage.getItem('wed11_player_session');
    expect(storedSession).toBeTruthy();

    const session = JSON.parse(storedSession!);
    expect(session.pid).toBe('player-1');
    expect(session.name).toBe('Thomas Müller');
    expect(session.timestamp).toBeTruthy();
  });

  it('should block access to dashboard without valid session', async () => {
    window.history.pushState({}, '', '/player-dashboard');
    render(
      <App />
    );

    // Should redirect to login
    await waitFor(() => {
      expect(screen.getByText(/enter your 4-digit code/i)).toBeInTheDocument();
    });
  });

  it('should logout when logout button is clicked', async () => {
    vi.mocked(playerService.getPlayerByCode).mockResolvedValue(mockPlayer);
    vi.mocked(playerStatsService.calculateStatsForPlayer).mockResolvedValue(mockPlayerStats);

    render(
      <App />
    );

    // Login
    const loginBtn = screen.getByRole('button', { name: /player login/i });
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByText(/enter your 4-digit code/i)).toBeInTheDocument();
    });

    const codeInput = screen.getByRole('textbox');
    fireEvent.change(codeInput, { target: { value: '1234' } });

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      expect(screen.getByText(/your match statistics/i)).toBeInTheDocument();
    });

    // Click logout
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    // Should redirect to login and clear session
    await waitFor(() => {
      expect(screen.getByText(/enter your 4-digit code/i)).toBeInTheDocument();
      expect(localStorage.getItem('playerAuthSession')).toBeNull();
    });
  });

  it('should only display own statistics, never other players stats', async () => {
    const otherPlayerStats = {
      playerId: 'player-456',
      matchesPlayed: 20,
      wins: 15,
    };

    vi.mocked(playerService.getPlayerByCode).mockResolvedValue(mockPlayer);
    vi.mocked(playerStatsService.calculateStatsForPlayer).mockResolvedValue(mockPlayerStats);

    render(
      <App />
    );

    // Login and navigate to dashboard
    const loginBtn = screen.getByRole('button', { name: /player login/i });
    fireEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByText(/enter your 4-digit code/i)).toBeInTheDocument();
    });

    const codeInput = screen.getByRole('textbox');
    fireEvent.change(codeInput, { target: { value: '1234' } });

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      expect(screen.getByText(/your match statistics/i)).toBeInTheDocument();
    });

    // Verify only own stats are shown (12 matches, not 20)
    expect(screen.getByText(/12/)).toBeInTheDocument(); // own matches
    expect(screen.queryByText(/20/)).not.toBeInTheDocument(); // other player's matches

    // Verify playerStatsService was called only with own playerId
    expect(vi.mocked(playerStatsService.calculateStatsForPlayer)).toHaveBeenCalledWith('player-1');
  });
});
