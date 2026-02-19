import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';

interface PlayerAuthContextType {
  isAuthenticated: boolean;
  playerId: string | null;
  playerName: string | null;
  login: (playerId: string, playerName: string) => void;
  logout: () => void;
  resetInactivityTimer: () => void;
}

const PlayerAuthContext = createContext<PlayerAuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'wed11_player_session';
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const PlayerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const { pid, name, timestamp } = JSON.parse(stored);
        const age = Date.now() - timestamp;
        if (age < INACTIVITY_TIMEOUT_MS) {
          setIsAuthenticated(true);
          setPlayerId(pid);
          setPlayerName(name);
        } else {
          // Session expired
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (err) {
        console.error('Failed to restore player session:', err);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new timer
    const newTimer = setTimeout(() => {
      setIsAuthenticated(false);
      setPlayerId(null);
      setPlayerName(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }, INACTIVITY_TIMEOUT_MS);

    inactivityTimerRef.current = newTimer;
  }, []);

  const login = (pid: string, name: string) => {
    setIsAuthenticated(true);
    setPlayerId(pid);
    setPlayerName(name);
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ pid, name, timestamp: Date.now() })
    );
    resetInactivityTimer();
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPlayerId(null);
    setPlayerName(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  // Attach activity listener to reset timer on user interaction
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      resetInactivityTimer();
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, resetInactivityTimer]);

  return (
    <PlayerAuthContext.Provider
      value={{ isAuthenticated, playerId, playerName, login, logout, resetInactivityTimer }}
    >
      {children}
    </PlayerAuthContext.Provider>
  );
};

export const usePlayerAuth = () => {
  const context = useContext(PlayerAuthContext);
  if (context === undefined) {
    throw new Error('usePlayerAuth must be used within a PlayerAuthProvider');
  }
  return context;
};
