import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { PlayerAuthProvider, usePlayerAuth } from '../../src/context/PlayerAuthContext';

describe('PlayerAuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('login', () => {
    it('should set authenticated state and store session in localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerAuthProvider>{children}</PlayerAuthProvider>
      );
      const { result } = renderHook(() => usePlayerAuth(), { wrapper });

      act(() => {
        result.current.login('player-123', 'John Doe');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.playerId).toBe('player-123');
      expect(result.current.playerName).toBe('John Doe');

      const stored = localStorage.getItem('wed11_player_session');
      expect(stored).toBeDefined();
      const session = JSON.parse(stored!);
      expect(session.pid).toBe('player-123');
      expect(session.name).toBe('John Doe');
      expect(session.timestamp).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should clear authenticated state and remove localStorage session', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerAuthProvider>{children}</PlayerAuthProvider>
      );
      const { result } = renderHook(() => usePlayerAuth(), { wrapper });

      act(() => {
        result.current.login('player-123', 'John Doe');
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.playerId).toBeNull();
      expect(result.current.playerName).toBeNull();
      expect(localStorage.getItem('wed11_player_session')).toBeNull();
    });
  });

  describe('session persistence', () => {
    it('should restore session from localStorage on mount if not expired', () => {
      // Pre-populate localStorage with a valid session
      const now = Date.now();
      localStorage.setItem(
        'wed11_player_session',
        JSON.stringify({ pid: 'player-456', name: 'Jane Doe', timestamp: now })
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerAuthProvider>{children}</PlayerAuthProvider>
      );
      const { result } = renderHook(() => usePlayerAuth(), { wrapper });

      // Should be authenticated from localStorage
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.playerId).toBe('player-456');
      expect(result.current.playerName).toBe('Jane Doe');
    });

    it('should ignore expired session from localStorage', () => {
      // Pre-populate localStorage with an expired session (older than 15 minutes)
      const expired = Date.now() - (16 * 60 * 1000); // 16 minutes ago
      localStorage.setItem(
        'wed11_player_session',
        JSON.stringify({ pid: 'player-456', name: 'Jane Doe', timestamp: expired })
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerAuthProvider>{children}</PlayerAuthProvider>
      );
      const { result } = renderHook(() => usePlayerAuth(), { wrapper });

      // Should not be authenticated
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.playerId).toBeNull();
      expect(result.current.playerName).toBeNull();
      expect(localStorage.getItem('wed11_player_session')).toBeNull();
    });

    it('should handle corrupted localStorage session gracefully', () => {
      // Pre-populate localStorage with corrupted JSON
      localStorage.setItem('wed11_player_session', 'invalid json {');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerAuthProvider>{children}</PlayerAuthProvider>
      );
      const { result } = renderHook(() => usePlayerAuth(), { wrapper });

      // Should not be authenticated and corrupted data should be cleared
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('wed11_player_session')).toBeNull();
    });
  });

  describe('inactivity timeout', () => {
    it('should execute logout callback after timeout expires', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerAuthProvider>{children}</PlayerAuthProvider>
      );
      const { result } = renderHook(() => usePlayerAuth(), { wrapper });

      act(() => {
        result.current.login('player-123', 'Test Player');
      });
      expect(result.current.isAuthenticated).toBe(true);

      // Advance time to trigger logout (15 minutes)
      act(() => {
        vi.advanceTimersByTime(15 * 60 * 1000 + 10);
      });

      // Check that logout occurred
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.playerId).toBeNull();
      expect(localStorage.getItem('wed11_player_session')).toBeNull();
    }, 20000);

    it('should not auto-logout before timeout expires', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerAuthProvider>{children}</PlayerAuthProvider>
      );
      const { result } = renderHook(() => usePlayerAuth(), { wrapper });

      act(() => {
        result.current.login('player-123', 'Test Player');
      });

      // Advance time to 10 minutes (less than 15)
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });

      // Should still be authenticated
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.playerId).toBe('player-123');
    });
  });

  describe('resetInactivityTimer', () => {
    it('should reset the inactivity timer', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <PlayerAuthProvider>{children}</PlayerAuthProvider>
      );
      const { result } = renderHook(() => usePlayerAuth(), { wrapper });

      act(() => {
        result.current.login('player-123', 'Test Player');
      });

      // Advance 10 minutes
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });
      expect(result.current.isAuthenticated).toBe(true);

      // Reset timer
      act(() => {
        result.current.resetInactivityTimer();
      });

      // Advance another 10 minutes (total 20, but timer was reset at minute 10)
      act(() => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });
      // Still authenticated because the timer was reset
      expect(result.current.isAuthenticated).toBe(true);

      // Advance 5 more minutes to exceed 15 from reset
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000 + 10);
      });
      // Now should be logged out (15 minutes after reset)
      expect(result.current.isAuthenticated).toBe(false);
    }, 20000);
  });
});

