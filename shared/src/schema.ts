import { z } from 'zod';

export const registerSchema = z.object({
    username: z.string(),
    password: z.string(),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const authenticateSchema = z.object({
    username: z.string(),
    password: z.string(),
});

export type AuthenticateSchema = z.infer<typeof authenticateSchema>;

