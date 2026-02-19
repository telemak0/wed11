import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../setup';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedPlayerRoute } from '../../src/components/route/ProtectedPlayerRoute';
import { usePlayerAuth } from '../../src/context/PlayerAuthContext';

vi.mock('../../src/context/PlayerAuthContext', () => ({
  usePlayerAuth: vi.fn(),
}));

describe('ProtectedPlayerRoute', () => {
  it('should render children when player is authenticated', () => {
    vi.mocked(usePlayerAuth).mockReturnValue({
      isAuthenticated: true,
      playerId: 'player123',
      playerName: 'John Doe',
      login: vi.fn(),
      logout: vi.fn(),
      resetInactivityTimer: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedPlayerRoute>
                <div>Protected Content</div>
              </ProtectedPlayerRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not render children when player is not authenticated', () => {
    vi.mocked(usePlayerAuth).mockReturnValue({
      isAuthenticated: false,
      playerId: null,
      playerName: null,
      login: vi.fn(),
      logout: vi.fn(),
      resetInactivityTimer: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedPlayerRoute>
                <div>Protected Content</div>
              </ProtectedPlayerRoute>
            }
          />
          <Route path="/player-login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
