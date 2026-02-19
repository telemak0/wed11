import { render, screen, fireEvent, waitFor } from '../setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextLineupPage } from '../../src/pages/admin/NextLineupPage';
import { playerService } from '../../src/services/playerService';
import { matchService } from '../../src/services/matchService';
import { BrowserRouter } from 'react-router-dom';

// Mock services
vi.mock('../../src/services/playerService', () => ({
  playerService: {
    getPlayers: vi.fn()
  }
}));

vi.mock('../../src/services/matchService', () => ({
  matchService: {
    getScheduledMatch: vi.fn(),
    updateLineup: vi.fn()
  }
}));

const mockPlayers = [
  { id: '1', name: 'Messi', type: 'active', createdAt: { toDate: () => new Date() } },
  { id: '2', name: 'Ronaldo', type: 'occasional', createdAt: { toDate: () => new Date() } },
  { id: '3', name: 'Neymar', type: 'active', createdAt: { toDate: () => new Date() } }
];

const mockMatch = {
  id: 'match-1',
  date: { toDate: () => new Date() },
  status: 'scheduled',
  teamWhite: [],
  teamRed: []
};

describe('NextLineupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (playerService.getPlayers as any).mockResolvedValue(mockPlayers);
    (matchService.getScheduledMatch as any).mockResolvedValue(mockMatch);
    (matchService.updateLineup as any).mockResolvedValue(undefined);
  });

  it('groups players by type', async () => {
    render(
      <BrowserRouter>
        <NextLineupPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jugadores Activos')).toBeInTheDocument();
      expect(screen.getByText('Jugadores Ocasionales')).toBeInTheDocument();
    });

    // Check active players section
    expect(screen.getByText('Messi')).toBeInTheDocument();
    expect(screen.getByText('Neymar')).toBeInTheDocument();

    // Check occasional players section
    expect(screen.getByText('Ronaldo')).toBeInTheDocument();
  });

  it('adds player to active team', async () => {
    render(
      <BrowserRouter>
        <NextLineupPage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByText('Messi')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Messi'));

    await waitFor(() => {
      expect(matchService.updateLineup).toHaveBeenCalledWith('match-1', ['1'], []);
    });
  });
});