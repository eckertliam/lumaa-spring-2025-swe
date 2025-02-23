import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { authService, registerService, SignedUser } from '../services/auth.service';
import { registerSchema, authenticateSchema, RegisterSchema, AuthenticateSchema } from 'shared';

/**
 * Register a new user POST /auth/register
 * @param req - The request object
 * @param res - The response object
 * @returns A 201 (created) responds with a JWT & user details
 * or a 400 (bad request) response if the request is invalid
 * or a 409 (conflict) response if the user already exists
 */
export async function register(req: Request, res: Response): Promise<void> {
    try {
        const { username, password }: RegisterSchema = registerSchema.parse(req.body);
        // register user and return JWT token
        const user: SignedUser | undefined = await registerService(username, password);
        // undefined if user already exists
        if (!user) {
            res.status(409).json({ error: 'User already exists' });
            return;
        }
        res.status(201).json(user);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Invalid request' });
    }
}

/**
 * Authenticate a user POST /auth/login
 * @param req - The request object
 * @param res - The response object
 * @returns A 200 (ok) responds with JWT & user details
 * or a 400 (bad request) response if the request is invalid
 */
export async function authenticate(req: Request, res: Response): Promise<void> {
    try {
        const { username, password }: AuthenticateSchema = authenticateSchema.parse(req.body);
        // authenticate user and return JWT token
        const user: SignedUser | undefined = await authService(username, password);
        // undefined if user does not exist
        if (!user) {
            res.status(400).json({ error: 'Failed to authenticate user' });
            return;
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Invalid request' });
    }
}
