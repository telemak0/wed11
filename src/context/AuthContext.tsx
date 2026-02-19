import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { adminService } from '../services/adminService';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  isBootstrapped: boolean | null;
  setupAdmin: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 3600000; // 1 hour in ms

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isBootstrapped, setIsBootstrapped] = useState<boolean | null>(null);

  const logout = useCallback(async () => {
    try {
      await adminService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      localStorage.removeItem('wed11_last_login');
      setIsAuthenticated(false);
    }
  }, []);

  const checkSessionTimeout = useCallback(() => {
    const lastLogin = localStorage.getItem('wed11_last_login');
    if (lastLogin) {
      const now = Date.now();
      if (now - parseInt(lastLogin) > SESSION_TIMEOUT) {
        logout();
        return true;
      }
    }
    return false;
  }, [logout]);

  useEffect(() => {
    // Check bootstrapping status
    adminService.isBootstrapped().then(setIsBootstrapped);

    // Watch auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const timedOut = checkSessionTimeout();
        if (!timedOut) {
          setIsAuthenticated(true);
        }
      } else {
        setIsAuthenticated(false);
      }
    });

    // Periodic session timeout check
    const interval = setInterval(checkSessionTimeout, 60000); // Check every minute

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [checkSessionTimeout]);

  const login = async (password: string) => {
    await adminService.login(password);
    localStorage.setItem('wed11_last_login', Date.now().toString());
    setIsAuthenticated(true);
  };

  const setupAdmin = async (password: string) => {
    await adminService.setupAdmin(password);
    localStorage.setItem('wed11_last_login', Date.now().toString());
    setIsAuthenticated(true);
    setIsBootstrapped(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isBootstrapped, setupAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
