import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react';
import Login from './Login';

// Mock the fetch function
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock the navigation function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Helper function to render the component with router
const renderLogin = () => {
    return render(
        <BrowserRouter>
            <Login />
        </BrowserRouter>
    );
};

// Helper function to fill out the form
const fillForm = (username: string, password: string) => {
    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    fireEvent.change(usernameInput, { target: { value: username } });
    fireEvent.change(passwordInput, { target: { value: password } });
};

describe('Login Component', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        // Clear localStorage
        localStorage.clear();
    });

    it('renders login form correctly', () => {
        renderLogin();
        
        // Check for essential elements
        expect(screen.getByRole('heading', { name: /login/i })).toBeTruthy();
        expect(screen.getByLabelText(/username/i)).toBeTruthy();
        expect(screen.getByLabelText(/password/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /login/i })).toBeTruthy();
        expect(screen.getByText(/don't have an account/i)).toBeTruthy();
    });

    it('validates username requirements', async () => {
        renderLogin();
        
        // Test too short username
        fillForm('ab', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /login/i }));
        
        // Wait for validation message
        const shortUsernameError = await screen.findByText(/username must be at least 3 characters/i);
        expect(shortUsernameError).toBeTruthy();

        // Test invalid characters
        fillForm('user@name', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /login/i }));
        
        // Wait for validation message
        const invalidCharError = await screen.findByText(/username can only contain letters, numbers, and underscores/i);
        expect(invalidCharError).toBeTruthy();
    });

    it('validates password requirements', async () => {
        renderLogin();
        
        // Test minimum length
        fillForm('validuser', 'short');
        fireEvent.submit(screen.getByRole('button', { name: /login/i }));
        
        // Wait for validation message
        const shortPasswordError = await screen.findByText(/password must be at least 8 characters/i);
        expect(shortPasswordError).toBeTruthy();
    });

    it('handles successful login', async () => {
        renderLogin();
        
        // Mock successful API response
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ token: 'fake-token' }),
        });

        // Fill and submit form
        await act(async () => {
            fillForm('validuser', 'ValidPass1!');
            fireEvent.submit(screen.getByRole('button', { name: /login/i }));
        });

        // Wait for navigation
        await vi.waitFor(() => {
            expect(localStorage.getItem('token')).toBe('fake-token');
            expect(mockNavigate).toHaveBeenCalledWith('/tasks');
        });
    });

    it('handles authentication failure', async () => {
        renderLogin();
        
        // Mock API error response
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'Failed to authenticate user' }),
        });

        // Fill and submit form
        fillForm('wronguser', 'WrongPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /login/i }));

        // Wait for error message
        const errorMessage = await screen.findByText(/failed to authenticate user/i);
        expect(errorMessage).toBeTruthy();
    });

    it('handles network error', async () => {
        renderLogin();
        
        // Mock network error
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        // Fill and submit form
        fillForm('validuser', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /login/i }));

        // Wait for error message
        const errorMessage = await screen.findByText(/network error/i);
        expect(errorMessage).toBeTruthy();
    });

    it('disables form during submission', async () => {
        renderLogin();
        
        // Mock delayed API response
        mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

        // Fill and submit form
        fillForm('validuser', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /login/i }) as HTMLButtonElement);

        // Wait for loading state
        const loadingButton = await screen.findByRole('button', { name: /logging in\.\.\./i }) as HTMLButtonElement;

        // Check if form elements are disabled
        const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

        expect(usernameInput.disabled).toBe(true);
        expect(passwordInput.disabled).toBe(true);
        expect(loadingButton.disabled).toBe(true);
    });

    it('clears field-specific errors on input change', async () => {
        renderLogin();
        
        // Trigger validation error
        fillForm('ab', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /login/i }));

        // Wait for error message
        const errorMessage = await screen.findByText(/username must be at least 3 characters/i);
        expect(errorMessage).toBeTruthy();

        // Change input and verify error is cleared
        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'validuser' } });
        
        // Wait for error message to disappear
        await vi.waitFor(() => {
            expect(screen.queryByText(/username must be at least 3 characters/i)).toBeFalsy();
        });
    });

    it('navigates to register page when clicking sign up link', () => {
        renderLogin();
        
        // Click the sign up link
        const link = screen.getByText(/don't have an account/i).closest('a');
        expect(link).toBeTruthy();
        expect(link?.getAttribute('href')).toBe('/register');
    });
}); 