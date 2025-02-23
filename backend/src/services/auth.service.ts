import { User } from '@prisma/client';
import prisma from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Read RSA keys once at module load
let privateKey: string;
let publicKey: string;

try {
    const keyDir = process.env.JWT_KEY_DIR || './keys';
    privateKey = fs.readFileSync(path.join(keyDir, 'private.pem'), 'utf8');
    publicKey = fs.readFileSync(path.join(keyDir, 'public.pem'), 'utf8');
} catch (error) {
    throw new Error(`Failed to load JWT keys: ${error instanceof Error ? error.message : error}`);
}

/**
 * Generate a JWT token for a user
 * @param user - User object containing at least id
 * @returns Signed JWT token
 */
export function signJwt(user: Pick<User, 'id'>): string {
    if (!user?.id) {
        throw new Error('Invalid user object for JWT generation');
    }

    // Create token with 1h expiration
    return jwt.sign(
        { sub: user.id },
        privateKey,
        {
            algorithm: 'RS256',
            expiresIn: '1h'
        }
    );
}

/**
 * Get public key for JWT verification
 * Exported for use in passport strategies
 */
export const getPublicKey = () => publicKey;

/**
 * User type with JWT token and no password
 */
export type SignedUser = 
    Omit<User, 'password' | 'createdAt' | 'updatedAt'>
    & { token: string };

/**
 * Register a new user
 * @param username - Username for the new user
 * @param password - Password for the new user
 * @returns Registered user
 */
export async function registerService(username: string, password: string): Promise<SignedUser | undefined> {
    // Check if user already exists
    const existingUser: User | null = await prisma.user.findUnique({
        where: { username }
    });

    if (existingUser) {
        console.error('User already exists');
        return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user: User = await prisma.user.create({
        data: { username, password: hashedPassword }
    });

    // Generate JWT token
    const token: string = signJwt(user);

    // Return user with token
    return {
        id: user.id,
        username: user.username,
        token
    };
}

/**
 * Authenticate a user
 * @param username - Username for the user
 * @param password - Password for the user
 * @returns Authenticated user
 */
export async function authService(username: string, password: string): Promise<SignedUser | undefined> {
    // Check if user exists
    const user: User | null = await prisma.user.findUnique({
        where: { username }
    });

    if (!user) {
        console.error('User not found');
        return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        console.error('Invalid password');
        return;
    }

    // Generate JWT token
    const token: string = signJwt(user);

    // Return user with token
    return {
        id: user.id,
        username: user.username,
        token
    };
}

/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @returns Verified user
 */
export async function verifyJwtService(token: string): Promise<SignedUser | undefined> {
    // Verify token
    const decoded: jwt.JwtPayload = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;

    // Check if user exists
    const user: User | null = await prisma.user.findUnique({
        where: { id: decoded.sub }
    });

    if (!user) {
        console.error('User not found');
        return;
    }

    // Return user
    return {
        id: user.id,
        username: user.username,
        token
    };
}