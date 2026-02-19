import { render, screen, fireEvent, waitFor } from '../setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { adminService } from '../../src/services/adminService';
import { onAuthStateChanged } from 'firebase/auth';
import React from 'react';

// Mock adminService and firebase/auth
vi.mock('../../src/services/adminService', () => ({
    adminService: {
        isBootstrapped: vi.fn(),
        login: vi.fn(),
        logout: vi.fn(),
        setupAdmin: vi.fn(),
    }
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn(),
}));

vi.mock('../../src/lib/firebase', () => ({
    auth: {}
}));

// Helper component to consume context
const TestConsumer = () => {
    const { isAuthenticated, login, logout, isBootstrapped } = useAuth();
    return (
        <div>
            <div data-testid="auth-status">{isAuthenticated ? 'LOGGED_IN' : 'LOGGED_OUT'}</div>
            <div data-testid="bootstrap-status">{isBootstrapped === null ? 'LOADING' : isBootstrapped ? 'BOOTSTRAPPED' : 'NOT_BOOTSTRAPPED'}</div>
            <button onClick={() => login('password')}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.mocked(adminService.isBootstrapped).mockResolvedValue(true);
        // Default to logged out
        vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
            // @ts-ignore - callback usually wants User | null
            callback(null);
            return () => {};
        });
    });

    it('defaults to unauthenticated and checks bootstrapping', async () => {
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
        await waitFor(() => {
            expect(screen.getByTestId('bootstrap-status')).toHaveTextContent('BOOTSTRAPPED');
        });
    });

    it('logs in correctly', async () => {
        vi.mocked(adminService.login).mockResolvedValue();
        
        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        fireEvent.click(screen.getByText('Login'));
        
        await waitFor(() => {
            expect(adminService.login).toHaveBeenCalledWith('password');
        });
        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN');
        expect(localStorage.getItem('wed11_last_login')).toBeDefined();
    });

    it('handles session timeout', async () => {
        // Mock active user
        vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
            // @ts-ignore
            callback({ uid: '123' });
            return () => {};
        });

        // Set last login to 2 hours ago
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        localStorage.setItem('wed11_last_login', twoHoursAgo.toString());

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(adminService.logout).toHaveBeenCalled();
        });
        expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_OUT');
    });

    it('stays logged in if session is fresh', async () => {
        vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
            // @ts-ignore
            callback({ uid: '123' });
            return () => {};
        });

        // Set last login to 30 mins ago
        const thirtyMinsAgo = Date.now() - (30 * 60 * 1000);
        localStorage.setItem('wed11_last_login', thirtyMinsAgo.toString());

        render(
            <AuthProvider>
                <TestConsumer />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGGED_IN');
        });
        expect(adminService.logout).not.toHaveBeenCalled();
    });
});
