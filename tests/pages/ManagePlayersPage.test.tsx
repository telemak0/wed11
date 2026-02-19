import { render, screen, fireEvent, waitFor, act } from '../setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManagePlayersPage } from '../../src/pages/admin/ManagePlayersPage';
import { playerService } from '../../src/services/playerService';
import { BrowserRouter } from 'react-router-dom';
import i18n from '../../src/config/i18n';

// Mock playerService
vi.mock('../../src/services/playerService', () => ({
  playerService: {
    getPlayers: vi.fn(),
    createPlayer: vi.fn(),
    updatePlayer: vi.fn(),
    deletePlayer: vi.fn()
  }
}));

// Mock PlayerEditModal
vi.mock('../../src/components/ui/PlayerEditModal', () => ({
  PlayerEditModal: vi.fn(() => null)
}));

const mockPlayers = [
  { id: '1', name: 'Messi', type: 'active', createdAt: { toDate: () => new Date() } },
  { id: '2', name: 'Ronaldo', type: 'occasional', createdAt: { toDate: () => new Date() } }
];

describe('ManagePlayersPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
    vi.clearAllMocks();
    (playerService.getPlayers as any).mockResolvedValue(mockPlayers);
    (playerService.createPlayer as any).mockResolvedValue('new-id');
    (playerService.updatePlayer as any).mockResolvedValue(undefined);
    (playerService.deletePlayer as any).mockResolvedValue(undefined);
    window.confirm = vi.fn(() => true);
  });

  it('renders players list', async () => {
    render(
      <BrowserRouter>
        <ManagePlayersPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Messi')).toBeInTheDocument();
      expect(screen.getByText('Ronaldo')).toBeInTheDocument();
    });

    // Check sections
    expect(screen.getByText('Active Players')).toBeInTheDocument();
    expect(screen.getByText('Occasional Players')).toBeInTheDocument();
  });

  it('creates a new player with type', async () => {
    render(
      <BrowserRouter>
        <ManagePlayersPage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getByPlaceholderText('Enter player name (e.g., Lionel Messi)')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Enter player name (e.g., Lionel Messi)'), { target: { value: 'Neymar' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'occasional' } });
    fireEvent.click(screen.getByText('Add Player'));

    await waitFor(() => {
      expect(playerService.createPlayer).toHaveBeenCalledWith('Neymar', 'occasional');
    });
  });

  it('edits a player', async () => {
    const { PlayerEditModal } = await import('../../src/components/ui/PlayerEditModal');
    const mockPlayerEditModal = vi.mocked(PlayerEditModal);

    render(
      <BrowserRouter>
        <ManagePlayersPage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Edit')).toHaveLength(2));

    const editButtons = screen.getAllByText('Edit');
    await act(async () => {
      fireEvent.click(editButtons[0]); // Edit Messi
    });

    await waitFor(() => {
      expect(mockPlayerEditModal).toHaveBeenCalled();
    });

    const call = mockPlayerEditModal.mock.calls[0][0];
    expect(call.initialName).toBe('Messi');
    expect(call.initialType).toBe('active');
    expect(call.isOpen).toBe(true);

    // Simulate saving the edit
    const mockOnSave = mockPlayerEditModal.mock.calls[0][0].onSave;
    await act(async () => {
      await mockOnSave('New Name', 'occasional');
    });

    expect(playerService.updatePlayer).toHaveBeenCalledWith('1', 'New Name', 'occasional');
  });

  it('deletes a player', async () => {
    render(
      <BrowserRouter>
        <ManagePlayersPage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.getAllByText('Delete')).toHaveLength(2));

    const deleteButtons = screen.getAllByText('Delete');
    await act(async () => {
      fireEvent.click(deleteButtons[0]);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(playerService.deletePlayer).toHaveBeenCalledWith('1');
  });
});