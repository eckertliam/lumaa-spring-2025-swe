import { Request, Response, NextFunction } from 'express';
import { Task } from '@prisma/client';
import { verifyAuth, getTasks, createTask, updateTask, deleteTask } from '../../src/controllers/task.controller';
import * as taskService from '../../src/services/task.service';
import * as authService from '../../src/services/auth.service';
import { SignedUser } from '../../src/services/auth.service';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the services
jest.mock('../../src/services/task.service', () => ({
    getTasksService: jest.fn(),
    createTaskService: jest.fn(),
    updateTaskService: jest.fn(),
    deleteTaskService: jest.fn(),
}));
jest.mock('../../src/services/auth.service');

describe('Task Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: jest.Mock;

    beforeEach(() => {
        mockRequest = {
            headers: {},
            body: {},
            params: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        } as Partial<Response>;
        nextFunction = jest.fn();
        jest.clearAllMocks();
    });

    describe('verifyAuth Middleware', () => {
        it('should return 403 if no authorization header is present', async () => {
            await verifyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should return 403 if JWT verification fails', async () => {
            mockRequest.headers = { authorization: 'Bearer invalid-token' };
            jest.spyOn(authService, 'verifyJwtService').mockResolvedValue(undefined);

            await verifyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
            expect(nextFunction).not.toHaveBeenCalled();
        });

        it('should call next() if authentication is successful', async () => {
            mockRequest.headers = { authorization: 'Bearer valid-token' };
            const mockUser: SignedUser = { id: '1', username: 'testuser', token: 'valid-token' };
            jest.spyOn(authService, 'verifyJwtService').mockResolvedValue(mockUser);

            await verifyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

            expect(nextFunction).toHaveBeenCalled();
            expect((mockRequest as any).user).toEqual(mockUser);
        });
    });

    describe('getTasks', () => {
        const mockTasks: Task[] = [
            { id: '1', title: 'Task 1', description: 'Desc 1', userId: '1', isComplete: false, createdAt: new Date(), updatedAt: new Date() },
            { id: '2', title: 'Task 2', description: 'Desc 2', userId: '1', isComplete: false, createdAt: new Date(), updatedAt: new Date() },
        ];

        it('should return tasks successfully', async () => {
            mockRequest.body = { userId: '1' };
            jest.spyOn(taskService, 'getTasksService').mockResolvedValue(mockTasks);

            await getTasks(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
        });

        it('should return 400 on invalid request', async () => {
            mockRequest.body = {}; // Invalid request body

            await getTasks(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid request' });
        });
    });

    describe('createTask', () => {
        const mockTask: Task = {
            id: '1',
            title: 'New Task',
            description: 'New Description',
            userId: '1',
            isComplete: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should create task successfully', async () => {
            mockRequest.body = {
                userId: '1',
                title: 'New Task',
                description: 'New Description',
            };
            jest.spyOn(taskService, 'createTaskService').mockResolvedValue(mockTask);

            await createTask(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
        });

        it('should create task without description', async () => {
            mockRequest.body = {
                userId: '1',
                title: 'New Task',
            };
            jest.spyOn(taskService, 'createTaskService').mockResolvedValue(mockTask);

            await createTask(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('should return 400 on invalid request', async () => {
            mockRequest.body = { userId: '1' }; // Missing required title

            await createTask(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid request' });
        });
    });

    describe('updateTask', () => {
        const mockUpdatedTask: Task = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Updated Task',
            description: 'Updated Description',
            userId: '1',
            isComplete: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should update task successfully', async () => {
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            mockRequest.body = {
                title: 'Updated Task',
                description: 'Updated Description',
            };
            jest.spyOn(taskService, 'updateTaskService').mockResolvedValue(mockUpdatedTask);

            await updateTask(mockRequest as Request, mockResponse as Response);

            expect(taskService.updateTaskService).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 'Updated Task', 'Updated Description');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedTask);
        });

        it('should return 400 on invalid taskId', async () => {
            mockRequest.params = { id: 'invalid-uuid' }; // Invalid UUID format
            mockRequest.body = {
                title: 'Updated Task',
                description: 'Updated Description',
            };

            await updateTask(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid request' });
        });
    });

    describe('deleteTask', () => {
        const mockDeletedTask: Task = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Deleted Task',
            description: 'Deleted Description',
            userId: '1',
            isComplete: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should delete task successfully', async () => {
            mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
            jest.spyOn(taskService, 'deleteTaskService').mockResolvedValue(mockDeletedTask);

            await deleteTask(mockRequest as Request, mockResponse as Response);

            expect(taskService.deleteTaskService).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockDeletedTask);
        });

        it('should return 400 on invalid taskId', async () => {
            mockRequest.params = { id: 'invalid-uuid' }; // Invalid UUID format

            await deleteTask(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid request' });
        });
    });
});
