import { I18nextProvider } from 'react-i18next';
import i18n from './config/i18n';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlayerAuthProvider } from './context/PlayerAuthContext';
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ManagePlayersPage } from './pages/admin/ManagePlayersPage';
import { NextLineupPage } from './pages/admin/NextLineupPage';
import { MatchHistoryPage } from './pages/admin/MatchHistoryPage';
import { PlayerStatsPage } from './pages/admin/PlayerStatsPage';
import { PlayerDetailPage } from './pages/admin/PlayerDetailPage';
import { AdminLayout } from './components/layouts/AdminLayout';
import { PlayerLoginPage } from './pages/public/PlayerLoginPage';
import { PlayerDashboardPage } from './pages/public/PlayerDashboardPage';
import { ProtectedPlayerRoute } from './components/route/ProtectedPlayerRoute';
import { migratePlayersAddNicknames } from './services/migration';

const LoginRoute = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/admin/dashboard" /> : <LoginPage />;
}

function App() {
  useEffect(() => {
    // Run migration to add nicknames to existing ACTIVE players
    const runMigration = async () => {
      const MIGRATION_KEY = 'migration_nicknames_v1';
      if (!localStorage.getItem(MIGRATION_KEY)) {
        try {
          await migratePlayersAddNicknames();
          localStorage.setItem(MIGRATION_KEY, 'true');
        } catch (err) {
          console.error('Nickname migration failed:', err);
        }
      }
    };
    runMigration();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <PlayerAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              
              <Route path="/admin" element={<LoginRoute />} />
              
              <Route element={<AdminLayout />}>
                 <Route path="/admin/dashboard" element={<DashboardPage />} />
                 <Route path="/admin/players" element={<ManagePlayersPage />} />
                 <Route path="/admin/next-lineup" element={<NextLineupPage />} />
                 <Route path="/admin/history" element={<MatchHistoryPage />} />
                 <Route path="/admin/player-stats" element={<PlayerStatsPage />} />
                 <Route path="/admin/player-stats/:playerId" element={<PlayerDetailPage />} />
              </Route>

              <Route path="/player-login" element={<PlayerLoginPage />} />
              <Route
                path="/player-dashboard"
                element={
                  <ProtectedPlayerRoute>
                    <PlayerDashboardPage />
                  </ProtectedPlayerRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </PlayerAuthProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
