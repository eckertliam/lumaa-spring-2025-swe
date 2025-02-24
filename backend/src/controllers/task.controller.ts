import { Request, Response, NextFunction } from 'express';
import { createTaskService, getTasksService, updateTaskService, deleteTaskService } from '../services/task.service';
import { Task } from '@prisma/client';
import { SignedUser, verifyJwtService } from '../services/auth.service';
import {
    getTasksSchema,
    createTaskSchema,
    updateTaskSchema,
    updateTaskParamsSchema,
    deleteTaskSchema,
} from 'shared';

/**
 * Middleware to verify the authorization header exists and verify the JWT token
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function
 * @returns a 401 (unauthorized) response if the user is not authenticated
 */
export async function verifyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Verify authentication header exists
        const authHeader: string | undefined = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        // Verify JWT and get user details
        const user: SignedUser | undefined = await verifyJwtService(authHeader);
        if (!user) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        // attach the user to the request
        (req as any).user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}

/**
 * Get all tasks for a user GET /tasks
 * @param req - The request object
 * @param res - The response object
 * @returns A 200 (ok) response with a list of tasks, 
 * a 401 (unauthorized) response if the user is not authenticated, 
 * or a 400 (bad request) response if the request is invalid
 */
export async function getTasks(req: Request, res: Response): Promise<void> {
    try {
        // Get userId from the verified token (attached by verifyAuth middleware)
        const user = (req as any).user;
        
        // Validate user data
        const validatedData = getTasksSchema.safeParse({ userId: user?.id });
        if (!validatedData.success) {
            res.status(400).json({ 
                error: 'Invalid user ID', 
                details: validatedData.error.errors 
            });
            return;
        }

        const tasks: Task[] = await getTasksService(validatedData.data.userId);
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Create a new task POST /tasks
 * @param req - The request object
 * @param res - The response object
 * @returns A 201 (created) response with the created task, 
 * a 401 (unauthorized) response if the user is not authenticated, 
 * or a 400 (bad request) response if the request is invalid
 */
export async function createTask(req: Request, res: Response): Promise<void> {
    try {
        // Get userId from the verified token
        const user = (req as any).user;
        if (!user?.id) {
            res.status(401).json({ error: 'User ID not found in token' });
            return;
        }

        // Validate the request body (title and optional description)
        const validatedData = createTaskSchema.safeParse(req.body);
        
        if (!validatedData.success) {
            console.error('Validation failed:', validatedData.error.errors);
            res.status(400).json({ 
                error: 'Validation error', 
                details: validatedData.error.errors 
            });
            return;
        }

        // Extract validated data and create task with userId from token
        const { title, description } = validatedData.data;
        
        // Create task with the validated data and user ID from token
        const task: Task = await createTaskService(user.id, title, description);
        res.status(201).json(task);
    } catch (error: unknown) {
        // Log the full error details
        console.error('Task creation error:', {
            error,
            body: req.body,
            userId: (req as any).user?.id
        });
        
        res.status(500).json({ error: 'Internal server error' });
    }
}

/**
 * Update a task PUT /tasks/:id
 * @param req - The request object
 * @param res - The response object
 * @returns A 200 (ok) response with the updated task, 
 * a 401 (unauthorized) response if the user is not authenticated, 
 * or a 400 (bad request) response if the request is invalid
 */
export async function updateTask(req: Request, res: Response): Promise<void> {
    try {
        // Validate the taskId from params
        const paramsResult = updateTaskParamsSchema.safeParse({
            taskId: req.params.id
        });

        if (!paramsResult.success) {
            res.status(400).json({ 
                error: 'Invalid task ID', 
                details: paramsResult.error.errors 
            });
            return;
        }

        // Validate the request body
        const bodyResult = updateTaskSchema.safeParse(req.body);
        if (!bodyResult.success) {
            res.status(400).json({ 
                error: 'Invalid update data', 
                details: bodyResult.error.errors 
            });
            return;
        }

        const { taskId } = paramsResult.data;
        
        // Pass the validated data directly to the service
        const task: Task = await updateTaskService(taskId, bodyResult.data);
        res.status(200).json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

/**
 * Delete a task DELETE /tasks/:id
 * @param req - The request object
 * @param res - The response object
 * @returns A 200 (ok) response with the deleted task, 
 * a 401 (unauthorized) response if the user is not authenticated, 
 * or a 400 (bad request) response if the request is invalid
 */
export async function deleteTask(req: Request, res: Response): Promise<void> {
    try {
        // Validate the taskId from params
        const validatedData = deleteTaskSchema.safeParse({
            taskId: req.params.id
        });

        if (!validatedData.success) {
            res.status(400).json({ 
                error: 'Invalid task ID', 
                details: validatedData.error.errors 
            });
            return;
        }

        const task: Task = await deleteTaskService(validatedData.data.taskId);
        res.status(200).json(task);
    } catch (error) {
        console.error('Error deleting task:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

