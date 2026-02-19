import { render, screen, fireEvent, waitFor } from '../setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MatchHistoryPage } from '../../src/pages/admin/MatchHistoryPage';
import { matchService } from '../../src/services/matchService';
import { BrowserRouter } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';

// Mock matchService
vi.mock('../../src/services/matchService', () => ({
  matchService: {
    getAllMatches: vi.fn(),
    deleteMatch: vi.fn(),
    updateMatchScore: vi.fn()
  }
}));

const mockMatches = [
  {
    id: 'match-1',
    date: { toDate: () => new Date('2024-01-01') } as Timestamp,
    status: 'completed',
    teamWhite: [],
    teamRed: [],
    result: { goalsWhite: 2, goalsRed: 1 }
  },
  {
    id: 'match-2',
    date: { toDate: () => new Date('2024-02-01') } as Timestamp,
    status: 'scheduled',
    teamWhite: [],
    teamRed: []
  }
];

describe('MatchHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (matchService.getAllMatches as any).mockResolvedValue(mockMatches);
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
    // Mock window.prompt
    window.prompt = vi.fn();
  });

  it('renders matches list', async () => {
    render(
      <BrowserRouter>
        <MatchHistoryPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Final: 2 - 1')).toBeInTheDocument();
      expect(screen.getByText('Completado')).toBeInTheDocument();
    });
  });

  it('handles delete match', async () => {
    render(
      <BrowserRouter>
        <MatchHistoryPage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Eliminar')).toHaveLength(2));

    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(matchService.deleteMatch).toHaveBeenCalledWith('match-1');

    // Wait for the UI update to avoid act() warning
    await waitFor(() => {
       expect(screen.queryByText('Final: 2 - 1')).not.toBeInTheDocument();
    });
  });

  it('handles edit score', async () => {
    render(
      <BrowserRouter>
        <MatchHistoryPage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Editar Resultado')[0]).toBeInTheDocument());

    const editButtons = screen.getAllByText('Editar Resultado');
    fireEvent.click(editButtons[0]);
    
    // Modal should appear
    expect(screen.getByRole('heading', { name: 'Editar Resultado' })).toBeInTheDocument();
    
    const inputs = screen.getAllByRole('spinbutton');
    const whiteInput = inputs[0];
    const redInput = inputs[1];

    // Check initial values are loaded correctly
    expect(whiteInput).toHaveValue(2);
    expect(redInput).toHaveValue(1);

    fireEvent.change(whiteInput, { target: { value: '5' } });
    fireEvent.change(redInput, { target: { value: '5' } });

    fireEvent.click(screen.getByText('Guardar Resultado'));

    await waitFor(() => {
        expect(matchService.updateMatchScore).toHaveBeenCalledWith('match-1', 5, 5);
    });

    // Wait for the UI update
    await waitFor(() => {
        expect(screen.getByText('Final: 5 - 5')).toBeInTheDocument();
    });
    
    // Modal should close
    expect(screen.queryByRole('heading', { name: 'Editar Resultado' })).not.toBeInTheDocument();
  });
});
