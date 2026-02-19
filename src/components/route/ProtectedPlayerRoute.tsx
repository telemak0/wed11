import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlayerAuth } from '../../context/PlayerAuthContext';

interface ProtectedPlayerRouteProps {
  children: React.ReactNode;
}

export const ProtectedPlayerRoute = ({ children }: ProtectedPlayerRouteProps) => {
  const { isAuthenticated } = usePlayerAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/player-login" state={{ from: location }} />;
  }

  return <>{children}</>;
};
