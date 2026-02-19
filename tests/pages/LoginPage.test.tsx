import { render, screen, fireEvent, waitFor } from '../setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginPage } from '../../src/pages/admin/LoginPage';
import { useAuth } from '../../src/context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock dependencies
vi.mock('../../src/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('LoginPage Upgrade', () => {
    const mockLogin = vi.fn();
    const mockSetupAdmin = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({
            isAuthenticated: false,
            login: mockLogin,
            logout: vi.fn(),
            isBootstrapped: true,
            setupAdmin: mockSetupAdmin,
        });
    });

    it('renders login form when bootstrapped', () => {
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        expect(screen.getByText(/Acceso Admin/i)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/Confirmar contraseña/i)).not.toBeInTheDocument();
    });

    it('renders setup form when not bootstrapped', () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: false,
            login: mockLogin,
            logout: vi.fn(),
            isBootstrapped: false,
            setupAdmin: mockSetupAdmin,
        });

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        expect(screen.getByText(/Configuración Inicial/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirmar Contraseña/i)).toBeInTheDocument();
    });

    it('shows loading state when isBootstrapped is null', () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: false,
            login: mockLogin,
            logout: vi.fn(),
            isBootstrapped: null,
            setupAdmin: mockSetupAdmin,
        });

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        expect(screen.getByText(/Cargando.../i)).toBeInTheDocument();
    });

    it('calls login on form submission', async () => {
        mockLogin.mockResolvedValueOnce(undefined);
        
        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'mypassword' } });
        fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('mypassword');
            expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
        });
    });

    it('calls setupAdmin on form submission when not bootstrapped', async () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: false,
            login: mockLogin,
            logout: vi.fn(),
            isBootstrapped: false,
            setupAdmin: mockSetupAdmin,
        });

        mockSetupAdmin.mockResolvedValueOnce(undefined);

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'newpassword' } });
        fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/i), { target: { value: 'newpassword' } });
        
        fireEvent.click(screen.getByRole('button', { name: /Completar Configuración/i }));

        await waitFor(() => {
            expect(mockSetupAdmin).toHaveBeenCalledWith('newpassword');
            expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
        });
    });

    it('shows error if passwords do not match during setup', async () => {
        (useAuth as any).mockReturnValue({
            isAuthenticated: false,
            login: mockLogin,
            logout: vi.fn(),
            isBootstrapped: false,
            setupAdmin: mockSetupAdmin,
        });

        render(
            <BrowserRouter>
                <LoginPage />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/^Contraseña$/i), { target: { value: 'pass1' } });
        fireEvent.change(screen.getByLabelText(/Confirmar Contraseña/i), { target: { value: 'pass2' } });
        
        fireEvent.click(screen.getByRole('button', { name: /Completar Configuración/i }));

        expect(screen.getByText(/Las contraseñas no coinciden/i)).toBeInTheDocument();
        expect(mockSetupAdmin).not.toHaveBeenCalled();
    });
});
