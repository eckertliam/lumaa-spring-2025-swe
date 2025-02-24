import { z } from 'zod';

/**
 * Schema for user registration
 * @property {string} username - The desired username (3-30 chars, alphanumeric with underscores)
 * @property {string} password - The user's password (8-100 chars, must include number and special char)
 */
export const registerSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .trim(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password cannot exceed 100 characters')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter'),
});

/**
 * Type representing the data required for user registration
 * @property {string} username - The desired username
 * @property {string} password - The user's password
 */
export type RegisterSchema = z.infer<typeof registerSchema>;

/**
 * Schema for user authentication
 * @property {string} username - The user's username (3-30 chars, alphanumeric with underscores)
 * @property {string} password - The user's password (8-100 chars)
 */
export const authenticateSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username cannot exceed 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
        .trim(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password cannot exceed 100 characters'),
});

/**
 * Type representing the data required for user authentication
 * @property {string} username - The user's username
 * @property {string} password - The user's password
 */
export type AuthenticateSchema = z.infer<typeof authenticateSchema>;

/**
 * Schema for retrieving tasks for a specific user
 * @property {string} userId - The unique identifier of the user
 */
export const getTasksSchema = z.object({
    userId: z.string(),
});

/**
 * Type representing the parameters for retrieving user tasks
 * @property {string} userId - The unique identifier of the user
 */
export type GetTasksSchema = z.infer<typeof getTasksSchema>;

/**
 * Schema for creating a new task
 * @property {string} userId - The unique identifier of the user creating the task
 * @property {string} title - The title of the task
 * @property {string} [description] - Optional description of the task
 */
export const createTaskSchema = z.object({
    userId: z.string(),
    title: z.string(),
    description: z.string().optional(),
});

/**
 * Type representing the data required to create a new task
 * @property {string} userId - The unique identifier of the user creating the task
 * @property {string} title - The title of the task
 * @property {string} [description] - Optional description of the task
 */
export type CreateTaskSchema = z.infer<typeof createTaskSchema>;

/**
 * Schema for updating a task's content
 * @property {string} title - The new title of the task
 * @property {string} [description] - Optional new description of the task
 */
export const updateTaskSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
});

/**
 * Schema for validating task ID in URL parameters
 * @property {string} taskId - UUID of the task to be updated
 */
export const updateTaskParamsSchema = z.object({
    taskId: z.string().uuid(), // Validates UUID format
});

/**
 * Type representing the data required to update a task's content
 * @property {string} title - The new title of the task
 * @property {string} [description] - Optional new description of the task
 */
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>;

/**
 * Type representing the parameters for task update operations
 * @property {string} taskId - UUID of the task to be updated
 */
export type UpdateTaskParamsSchema = z.infer<typeof updateTaskParamsSchema>;

/**
 * Schema for validating task deletion parameters
 * @property {string} taskId - UUID of the task to be deleted
 */
export const deleteTaskSchema = z.object({
    taskId: z.string().uuid(), // Validates UUID format
});

/**
 * Type representing the parameters for task deletion
 * @property {string} taskId - UUID of the task to be deleted
 */
export type DeleteTaskSchema = z.infer<typeof deleteTaskSchema>;

