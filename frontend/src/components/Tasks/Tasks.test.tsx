import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Tasks from './Tasks';

// Mock the fetch function
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock console.error
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock the navigation function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock environment variables
vi.stubGlobal('import.meta', { env: { VITE_API_URL: 'http://test-api' } });

// Sample task data for testing
const mockTasks = [
    { id: '1', title: 'Test Task 1', description: 'Description 1', isComplete: false },
    { id: '2', title: 'Test Task 2', isComplete: true },
];

// Helper function to render the component with router
const renderTasks = () => {
    return render(
        <BrowserRouter>
            <Tasks />
        </BrowserRouter>
    );
};

describe('Tasks Component', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        // Clear localStorage
        localStorage.clear();
        // Set default token with userId
        localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    });

    it('renders tasks page correctly', async () => {
        // Mock successful tasks fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTasks),
        });

        await act(async () => {
            renderTasks();
        });
        
        // Verify the request includes authorization header
        expect(mockFetch).toHaveBeenCalledWith(
            `${import.meta.env.VITE_API_URL}/tasks`,
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': expect.any(String),
                    'Content-Type': 'application/json'
                })
            })
        );
        
        // Check for essential elements
        expect(screen.getByText('Tasks')).toBeTruthy();
        expect(screen.getByLabelText(/task title/i)).toBeTruthy();
        expect(screen.getByLabelText(/description/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: /add task/i })).toBeTruthy();
        expect(screen.getByRole('button', { name: /logout/i })).toBeTruthy();

        // Wait for tasks to load
        await screen.findByText('Test Task 1');
        expect(screen.getByText('Description 1')).toBeTruthy();
        expect(screen.getByText('Test Task 2')).toBeTruthy();
    });

    it('handles unauthorized access', async () => {
        // Mock 401 response
        mockFetch.mockResolvedValueOnce({
            status: 401,
            ok: false,
        });

        await act(async () => {
            renderTasks();
        });

        // Wait for navigation
        await vi.waitFor(() => {
            expect(localStorage.getItem('token')).toBeNull();
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    it('creates a new task successfully', async () => {
        // Mock initial tasks fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTasks),
        });

        // Mock task creation
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ id: '3', title: 'New Task', description: 'New Description', isComplete: false }),
        });

        // Mock updated tasks fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([...mockTasks, { id: '3', title: 'New Task', description: 'New Description', isComplete: false }]),
        });

        await act(async () => {
            renderTasks();
        });

        // Fill and submit form
        await act(async () => {
            const titleInput = screen.getByLabelText(/task title/i);
            const descriptionInput = screen.getByLabelText(/description/i);
            
            fireEvent.change(titleInput, { target: { value: 'New Task' } });
            fireEvent.change(descriptionInput, { target: { value: 'New Description' } });
            fireEvent.submit(screen.getByRole('button', { name: /add task/i }));
        });

        // Verify the request body only includes title and description
        expect(mockFetch).toHaveBeenCalledWith(
            `${import.meta.env.VITE_API_URL}/tasks`,
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': expect.any(String),
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    title: 'New Task',
                    description: 'New Description'
                })
            })
        );

        // Wait for new task to appear
        await screen.findByText('New Task');
        expect(screen.getByText('New Description')).toBeTruthy();
    });

    it('deletes a task successfully', async () => {
        // Mock initial tasks fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTasks),
        });

        // Mock task deletion
        mockFetch.mockResolvedValueOnce({
            ok: true,
        });

        // Mock updated tasks fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([mockTasks[1]]),
        });

        await act(async () => {
            renderTasks();
        });

        // Wait for tasks to load and click delete
        await screen.findByText('Test Task 1');
        
        await act(async () => {
            const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
            fireEvent.click(deleteButtons[0]);
        });

        // Wait for task to be removed
        await vi.waitFor(() => {
            expect(screen.queryByText('Test Task 1')).toBeNull();
        });
    });

    it('updates task completion status', async () => {
        // Mock initial tasks fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTasks),
        });

        // Mock task update
        mockFetch.mockResolvedValueOnce({
            ok: true,
        });

        // Mock updated tasks fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTasks.map(t => 
                t.id === '1' ? { ...t, isComplete: true } : t
            )),
        });

        await act(async () => {
            renderTasks();
        });

        // Wait for tasks to load and find the specific task's button
        const taskElement = await screen.findByText('Test Task 1');
        const taskCard = taskElement.closest('.MuiCard-root');
        
        await act(async () => {
            const completeButton = taskCard?.querySelector('button:first-of-type');
            if (completeButton) {
                fireEvent.click(completeButton);
            }
        });

        // Wait for status to update on the specific task
        const updatedTaskCard = (await screen.findByText('Test Task 1')).closest('.MuiCard-root');
        const updatedButton = updatedTaskCard?.querySelector('button:first-of-type');
        expect(updatedButton?.textContent).toBe('Completed');
    });

    it('handles network error during tasks fetch', async () => {
        // Mock network error
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await act(async () => {
            renderTasks();
        });

        // Check console error was called
        await vi.waitFor(() => {
            expect(mockConsoleError).toHaveBeenCalledWith('Error fetching tasks:', expect.any(Error));
        });
    });

    it('handles error responses from API', async () => {
        // Mock error response
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        await act(async () => {
            renderTasks();
        });

        // Check console error was called
        await vi.waitFor(() => {
            expect(mockConsoleError).toHaveBeenCalledWith('Error fetching tasks:', expect.any(Error));
        });
    });

    it('validates required fields when creating task', async () => {
        // Mock initial tasks fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTasks),
        });

        await act(async () => {
            renderTasks();
        });

        // Try to submit without title
        const addButton = screen.getByRole('button', { name: /add task/i });
        
        await act(async () => {
            fireEvent.click(addButton);
        });

        // Verify that no additional fetch calls were made
        expect(mockFetch).toHaveBeenCalledTimes(1); // Only the initial tasks fetch
    });

    it('handles logout correctly', async () => {
        // Mock initial tasks fetch
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockTasks),
        });

        await act(async () => {
            renderTasks();
        });

        // Find and click logout button
        const logoutButton = screen.getByRole('button', { name: /logout/i });
        
        await act(async () => {
            fireEvent.click(logoutButton);
        });

        // Verify logout actions
        expect(localStorage.getItem('token')).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});
