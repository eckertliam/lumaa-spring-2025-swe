import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { authService, registerService, SignedUser } from '../services/auth.service';

/**
 * Register a new user POST /auth/register
 * @param req - The request object
 * @param res - The response object
 * @returns A 201 (created) responds with a JWT & user details
 * or a 400 (bad request) response if the request is invalid
 */
export async function register(req: Request, res: Response): Promise<void> {
    const username: string | undefined = req.body.username;
    const password: string | undefined = req.body.password;
    // check against invalid request
    if (!username || !password) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }
    // register user and return JWT token
    const user: SignedUser | undefined = await registerService(username, password);
    if (!user) {
        res.status(400).json({ error: 'Failed to register user' });
        return;
    }
    res.status(201).json(user);
}

/**
 * Authenticate a user POST /auth/login
 * @param req - The request object
 * @param res - The response object
 * @returns A 200 (ok) responds with JWT & user details
 * or a 400 (bad request) response if the request is invalid
 */
export async function authenticate(req: Request, res: Response): Promise<void> {
    const username: string | undefined = req.body.username;
    const password: string | undefined = req.body.password;
    // check against invalid request
    if (!username || !password) {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }
    // authenticate user and return JWT token
    const user: SignedUser | undefined = await authService(username, password);
    if (!user) {
        res.status(400).json({ error: 'Failed to authenticate user' });
        return;
    }
    res.status(200).json(user);
}
