import { Request, Response } from 'express';
import { createTaskService, getTasksService, updateTaskService, deleteTaskService } from '../services/task.service';
import { Task } from '@prisma/client';
import { SignedUser, verifyJwtService } from '../services/auth.service';

// TODO: use zod to validate the request body and params

/**
 * Helper function to verify the authorization header exists and verify the JWT token
 * @param req - The request object
 * @param res - The response object
 * @returns The authenticated user or undefined if authentication fails
 */
async function verifyAuth(req: Request, res: Response): Promise<SignedUser | undefined> {
    // Verify authentication header exists
    const authHeader: string | undefined = req.headers.authorization;
    if (!authHeader) {
        res.status(403).json({ error: 'Authentication required' });
        return undefined;
    }

    // Verify JWT and get user details
    const user: SignedUser | undefined = await verifyJwtService(authHeader);
    if (!user) {
        res.status(403).json({ error: 'Invalid or expired token' });
        return undefined;
    }

    return user;
}

/**
 * Get all tasks for a user GET /tasks
 * @param req - The request object
 * @param res - The response object
 * @returns A 200 (ok) response with a list of tasks, 
 * a 403 (forbidden) response if the user is not authenticated, 
 * or a 400 (bad request) response if the request is invalid
 */
export async function getTasks(req: Request, res: Response): Promise<void> {
    // verify the jwt and get the user details
    const user: SignedUser | undefined = await verifyAuth(req, res);
    // short circuit if authentication fails verifyAuth will have already sent a response
    if (!user) {
        return;
    }

    // Validate user ID exists
    const userId: string = user.id;
    if (!userId) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }
    const tasks: Task[] = await getTasksService(userId);
    res.status(200).json(tasks);
}

/**
 * Create a new task POST /tasks
 * @param req - The request object
 * @param res - The response object
 * @returns A 201 (created) response with the created task, 
 * a 403 (forbidden) response if the user is not authenticated, 
 * or a 400 (bad request) response if the request is invalid
 */
export async function createTask(req: Request, res: Response): Promise<void> {
    // verify the jwt and get the user details
    const user: SignedUser | undefined = await verifyAuth(req, res);
    // short circuit if authentication fails verifyAuth will have already sent a response
    if (!user) {
        return;
    }

    // Validate user ID exists
    const userId: string | undefined = req.body.userId;
    const title: string | undefined = req.body.title;
    const description: string | undefined = req.body.description;
    // check against invalid request
    // description is optional
    if (!userId || !title) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }
    const task: Task = await createTaskService(userId, title, description);
    res.status(201).json(task);
}

/**
 * Update a task PUT /tasks/:id
 * @param req - The request object
 * @param res - The response object
 * @returns A 200 (ok) response with the updated task, 
 * a 403 (forbidden) response if the user is not authenticated, 
 * or a 400 (bad request) response if the request is invalid
 */
export async function updateTask(req: Request, res: Response): Promise<void> {
    // verify the jwt and get the user details
    const user: SignedUser | undefined = await verifyAuth(req, res);
    // short circuit if authentication fails verifyAuth will have already sent a response
    if (!user) {
        return;
    }

    // Validate user ID exists
    const userId: string = user.id;
    const taskId: string = req.params.id;
    const title: string | undefined = req.body.title;
    const description: string | undefined = req.body.description;
    // check against invalid request
    // description is optional
    if (!userId || !taskId || !title) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }
    const task: Task = await updateTaskService(taskId, title, description);
    res.status(200).json(task);
}

/**
 * Delete a task DELETE /tasks/:id
 * @param req - The request object
 * @param res - The response object
 * @returns A 200 (ok) response with the deleted task, 
 * a 403 (forbidden) response if the user is not authenticated, 
 * or a 400 (bad request) response if the request is invalid
 */
export async function deleteTask(req: Request, res: Response): Promise<void> {
    // verify the jwt and get the user details
    const user: SignedUser | undefined = await verifyAuth(req, res);
    // short circuit if authentication fails verifyAuth will have already sent a response
    if (!user) {
        return;
    }

    const userId: string | undefined = user.id;
    const taskId: string | undefined = req.params.id;
    // check against invalid request
    if (!userId || !taskId) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }
    const task: Task = await deleteTaskService(taskId);
    res.status(200).json(task);
}