import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react';
import Register from './Register';

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
const renderRegister = () => {
    return render(
        <BrowserRouter>
            <Register />
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

describe('Register Component', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        // Clear localStorage
        localStorage.clear();
    });

    it('renders register form correctly', () => {
        renderRegister();
        
        // Check for essential elements
        expect(screen.getByRole('heading', { name: /register/i })).toBeTruthy();
        expect(screen.getByLabelText(/username/i)).toBeTruthy();
        expect(screen.getByLabelText(/password/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /register/i })).toBeTruthy();
        expect(screen.getByText(/already have an account/i)).toBeTruthy();
    });

    it('validates username requirements', async () => {
        renderRegister();
        
        // Test too short username
        fillForm('ab', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /register/i }));
        
        // Wait for validation message
        const shortUsernameError = await screen.findByText(/username must be at least 3 characters/i);
        expect(shortUsernameError).toBeTruthy();

        // Test invalid characters
        fillForm('user@name', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /register/i }));
        
        // Wait for validation message
        const invalidCharError = await screen.findByText(/username can only contain letters, numbers, and underscores/i);
        expect(invalidCharError).toBeTruthy();
    });

    it('validates password requirements', async () => {
        renderRegister();
        
        // Test password without number
        fillForm('validuser', 'Password!');
        fireEvent.submit(screen.getByRole('button', { name: /register/i }));
        
        // Wait for validation message
        const noNumberError = await screen.findByText(/password must contain at least one number/i);
        expect(noNumberError).toBeTruthy();

        // Test password without special character
        fillForm('validuser', 'Password123');
        fireEvent.submit(screen.getByRole('button', { name: /register/i }));
        
        // Wait for validation message
        const noSpecialCharError = await screen.findByText(/password must contain at least one special character/i);
        expect(noSpecialCharError).toBeTruthy();
    });

    it('handles successful registration', async () => {
        renderRegister();
        
        // Mock successful API response
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ token: 'fake-token' }),
        });

        // Fill and submit form
        await act(async () => {
            fillForm('validuser', 'ValidPass1!');
            fireEvent.submit(screen.getByRole('button', { name: /register/i }));
        });

        // Wait for navigation
        await vi.waitFor(() => {
            expect(localStorage.getItem('token')).toBe('fake-token');
            expect(mockNavigate).toHaveBeenCalledWith('/tasks');
        });
    });

    it('handles user already exists error', async () => {
        renderRegister();
        
        // Mock API error response
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error: 'User already exists' }),
        });

        // Fill and submit form
        fillForm('existinguser', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /register/i }));

        // Wait for error message
        const errorMessage = await screen.findByText(/user already exists/i);
        expect(errorMessage).toBeTruthy();
    });

    it('handles network error', async () => {
        renderRegister();
        
        // Mock network error
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        // Fill and submit form
        fillForm('validuser', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /register/i }));

        // Wait for error message
        const errorMessage = await screen.findByText(/network error/i);
        expect(errorMessage).toBeTruthy();
    });

    it('disables form during submission', async () => {
        renderRegister();
        
        // Mock delayed API response
        mockFetch.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));

        // Fill and submit form
        fillForm('validuser', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /register/i }) as HTMLButtonElement);

        // Wait for loading state
        const loadingButton = await screen.findByRole('button', { name: /registering\.\.\./i }) as HTMLButtonElement;

        // Check if form elements are disabled
        const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

        expect(usernameInput.disabled).toBe(true);
        expect(passwordInput.disabled).toBe(true);
        expect(loadingButton.disabled).toBe(true);
    });

    it('clears field-specific errors on input change', async () => {
        renderRegister();
        
        // Trigger validation error
        fillForm('ab', 'ValidPass1!');
        fireEvent.submit(screen.getByRole('button', { name: /register/i }));

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
});
