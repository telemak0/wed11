import { render, screen, waitFor } from '../setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../../src/pages/public/LandingPage';
import { matchService } from '../../src/services/matchService';
import { playerService } from '../../src/services/playerService';
import { Timestamp } from 'firebase/firestore';

// Mock Services
vi.mock('../../src/services/matchService', () => ({
  matchService: {
    getScheduledMatch: vi.fn(),
  }
}));

vi.mock('../../src/services/playerService', () => ({
  playerService: {
    getPlayers: vi.fn(),
  }
}));

// Mock PitchView to avoid SVG complexity in tests
vi.mock('../../src/components/ui/PitchView', () => ({
  PitchView: ({ interactive }: { interactive: boolean }) => (
    <div data-testid="pitch-view" data-interactive={interactive}>
      Pitch Visual
    </div>
  )
}));

describe('LandingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders "No upcoming matches" if no match found', async () => {
        (matchService.getScheduledMatch as any).mockResolvedValue(null);
        (playerService.getPlayers as any).mockResolvedValue([]);

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('No hay partidos próximos programados.')).toBeInTheDocument();
        });
    });

    it('renders the pitch view if match is scheduled', async () => {
        const mockMatch = {
            id: 'm1',
            date: { toDate: () => new Date() } as Timestamp,
            teamWhite: ['p1'],
            teamRed: ['p2']
        };
        const mockPlayers = [
            { id: 'p1', name: 'Messi' },
            { id: 'p2', name: 'Ronaldo' }
        ];

        (matchService.getScheduledMatch as any).mockResolvedValue(mockMatch);
        (playerService.getPlayers as any).mockResolvedValue(mockPlayers);

        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Próximo Partido')).toBeInTheDocument();
            expect(screen.getByTestId('pitch-view')).toBeInTheDocument();
            // Check non-interactive mode
            expect(screen.getByTestId('pitch-view')).toHaveAttribute('data-interactive', 'false');
        });
    });
});
