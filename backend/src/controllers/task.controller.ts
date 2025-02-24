import { Request, Response, NextFunction } from 'express';
import { createTaskService, getTasksService, updateTaskService, deleteTaskService } from '../services/task.service';
import { Task } from '@prisma/client';
import { SignedUser, verifyJwtService } from '../services/auth.service';
import {
    getTasksSchema,
    GetTasksSchema,
    createTaskSchema,
    CreateTaskSchema,
    UpdateTaskSchema,
    updateTaskSchema,
    updateTaskParamsSchema,
    deleteTaskSchema,
    DeleteTaskSchema,
    UpdateTaskParamsSchema
} from 'shared';

/**
 * Middleware to verify the authorization header exists and verify the JWT token
 * @param req - The request object
 * @param res - The response object
 * @param next - The next function
 * @returns a 401 (unauthorized) response if the user is not authenticated
 */
export async function verifyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        const { userId }: GetTasksSchema = getTasksSchema.parse(req.body);
        const tasks: Task[] = await getTasksService(userId);
        res.status(200).json(tasks);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Invalid request' });
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
        const { userId, title, description }: CreateTaskSchema = createTaskSchema.parse(req.body);
        // check against invalid request
        // description is optional
        const task: Task = await createTaskService(userId, title, description);
        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Invalid request' });
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
        const { taskId }: UpdateTaskParamsSchema = updateTaskParamsSchema.parse({
            taskId: req.params.id
        });

        // Validate the body
        const { title, description }: UpdateTaskSchema = updateTaskSchema.parse(req.body);

        const task: Task = await updateTaskService(taskId, title, description);
        res.status(200).json(task);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(400).json({ error: 'Invalid request' });
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
        const { taskId }: DeleteTaskSchema = deleteTaskSchema.parse({
            taskId: req.params.id
        });

        const task: Task = await deleteTaskService(taskId);
        res.status(200).json(task);
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(400).json({ error: 'Invalid request' });
    }
}
