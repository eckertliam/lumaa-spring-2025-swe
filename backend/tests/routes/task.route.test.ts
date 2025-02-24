import { Request, Response } from 'express';
import { Task } from '@prisma/client';
import { createTask, deleteTask, getTasks, updateTask, verifyAuth } from '../../src/controllers/task.controller';
import prisma from '../../src/db';
import * as authService from '../../src/services/auth.service';
import { SignedUser } from '../../src/services/auth.service';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
    user?: SignedUser;
}

// Mock prisma
jest.mock('../../src/db', () => ({
    task: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
    }
}));

// Mock auth service
jest.mock('../../src/services/auth.service', () => ({
    verifyJwtService: jest.fn()
}));

describe('Task Routes', () => {
    let req: Partial<AuthenticatedRequest>;
    let res: Partial<Response>;
    let next: jest.Mock;

    // Mock authenticated user data
    const mockUser = {
        id: 'user-123',
        username: 'testuser',
        token: 'valid-token'
    };

    // Mock task data with valid UUID
    const mockTask: Task = {
        id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
        title: 'Test Task',
        description: 'Test Description',
        userId: mockUser.id,
        isComplete: false,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Helper to create mock request and response
    const mockRequestResponse = () => {
        const req = {
            headers: {},
            body: {},
            params: {},
            user: mockUser
        } as Partial<AuthenticatedRequest>;
        
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as Partial<Response>;
        
        return { req, res };
    };

    beforeEach(() => {
        const mocked = mockRequestResponse();
        req = mocked.req;
        res = mocked.res;
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('verifyAuth Middleware', () => {
        it('should allow authenticated requests', async () => {
            // Setup auth header
            req.headers = { authorization: 'Bearer valid-token' };
            
            // Mock successful auth verification
            (authService.verifyJwtService as jest.Mock).mockResolvedValueOnce(mockUser);

            await verifyAuth(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toEqual(mockUser);
        });

        it('should reject requests without auth header', async () => {
            await verifyAuth(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('should reject requests with invalid token', async () => {
            req.headers = { authorization: 'Bearer invalid-token' };
            (authService.verifyJwtService as jest.Mock).mockResolvedValueOnce(undefined);

            await verifyAuth(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('getTasks', () => {
        it('should return tasks for authenticated user', async () => {
            // Setup request with valid user ID
            (req as any).user = { id: mockUser.id };
            
            // Mock database response
            (prisma.task.findMany as jest.Mock).mockResolvedValueOnce([mockTask]);

            await getTasks(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([mockTask]);
            expect(prisma.task.findMany).toHaveBeenCalledWith({
                where: { userId: mockUser.id }
            });
        });

        it('should return 400 for invalid request', async () => {
            // No user attached to request
            (req as any).user = undefined;
            await getTasks(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid user ID'
            }));
            expect(prisma.task.findMany).not.toHaveBeenCalled();
        });
    });

    describe('createTask', () => {
        beforeEach(() => {
            // Setup authenticated user for each test
            (req as any).user = { id: mockUser.id };
        });

        it('should create a new task', async () => {
            req.body = {
                title: 'Test Task',
                description: 'Test Description'
            };
            (prisma.task.create as jest.Mock).mockResolvedValueOnce(mockTask);

            await createTask(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockTask);
            expect(prisma.task.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUser.id,
                    title: 'Test Task',
                    description: 'Test Description'
                }
            });
        });

        it('should create a task without description', async () => {
            req.body = {
                title: 'Test Task'
            };
            (prisma.task.create as jest.Mock).mockResolvedValueOnce(mockTask);

            await createTask(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockTask);
            expect(prisma.task.create).toHaveBeenCalledWith({
                data: {
                    userId: mockUser.id,
                    title: 'Test Task',
                    description: undefined
                }
            });
        });

        it('should return 400 for invalid request', async () => {
            req.body = {}; // Missing required title

            await createTask(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Validation error'
            }));
            expect(prisma.task.create).not.toHaveBeenCalled();
        });
    });

    describe('updateTask', () => {
        it('should update an existing task', async () => {
            req.params = { id: mockTask.id };
            req.body = {
                title: 'Updated Task',
                description: 'Updated Description'
            };
            (prisma.task.update as jest.Mock).mockResolvedValueOnce({
                ...mockTask,
                title: 'Updated Task',
                description: 'Updated Description'
            });

            await updateTask(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(prisma.task.update).toHaveBeenCalledWith({
                where: { id: mockTask.id },
                data: {
                    title: 'Updated Task',
                    description: 'Updated Description'
                }
            });
        });

        it('should return 400 for invalid task ID', async () => {
            req.params = { id: 'invalid-uuid' };
            req.body = {
                title: 'Updated Task'
            };

            await updateTask(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid task ID'
            }));
            expect(prisma.task.update).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid update data', async () => {
            req.params = { id: mockTask.id };
            req.body = {
                title: '', // Invalid empty title
                description: ''
            };

            await updateTask(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid update data'
            }));
            expect(prisma.task.update).not.toHaveBeenCalled();
        });
    });

    describe('deleteTask', () => {
        it('should delete an existing task', async () => {
            req.params = { id: mockTask.id };
            (prisma.task.delete as jest.Mock).mockResolvedValueOnce(mockTask);

            await deleteTask(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockTask);
            expect(prisma.task.delete).toHaveBeenCalledWith({
                where: { id: mockTask.id }
            });
        });

        it('should return 400 for invalid task ID', async () => {
            req.params = { id: 'invalid-uuid' };

            await deleteTask(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid task ID'
            }));
            expect(prisma.task.delete).not.toHaveBeenCalled();
        });
    });
});
