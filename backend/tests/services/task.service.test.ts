import { Task } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import prisma from '../../src/db';
import { 
    getTasksService, 
    createTaskService, 
    updateTaskService, 
    deleteTaskService 
} from '../../src/services/task.service';

// Mock the Prisma client
jest.mock('../../src/db', () => ({
    __esModule: true,
    default: mockDeep()
}));

describe('Task Service', () => {
    let prismaMock: DeepMockProxy<typeof prisma>;
    
    beforeEach(() => {
        prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;
        mockReset(prismaMock);
    });

    describe('getTasksService', () => {
        it('should return all tasks for a given user', async () => {
            // Arrange
            const userId = 'test-user-id';
            const mockTasks: Task[] = [
                { id: '1', title: 'Task 1', description: 'Desc 1', userId, isComplete: false, createdAt: new Date(), updatedAt: new Date() },
                { id: '2', title: 'Task 2', description: 'Desc 2', userId, isComplete: false, createdAt: new Date(), updatedAt: new Date() }
            ];
            prismaMock.task.findMany.mockResolvedValue(mockTasks);

            // Act
            const result = await getTasksService(userId);

            // Assert
            expect(result).toEqual(mockTasks);
            expect(prismaMock.task.findMany).toHaveBeenCalledWith({
                where: { userId }
            });
        });

        it('should return empty array when user has no tasks', async () => {
            // Arrange
            const userId = 'user-with-no-tasks';
            prismaMock.task.findMany.mockResolvedValue([]);

            // Act
            const result = await getTasksService(userId);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('createTaskService', () => {
        it('should create a new task successfully', async () => {
            // Arrange
            const userId = 'test-user-id';
            const title = 'New Task';
            const description = 'Task Description';
            const mockTask: Task = {
                id: '1',
                title,
                description,
                userId,
                isComplete: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prismaMock.task.create.mockResolvedValue(mockTask);

            // Act
            const result = await createTaskService(userId, title, description);

            // Assert
            expect(result).toEqual(mockTask);
            expect(prismaMock.task.create).toHaveBeenCalledWith({
                data: { userId, title, description }
            });
        });

        it('should create a task without description', async () => {
            // Arrange
            const userId = 'test-user-id';
            const title = 'New Task';
            const mockTask: Task = {
                id: '1',
                title,
                description: null,
                userId,
                isComplete: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prismaMock.task.create.mockResolvedValue(mockTask);

            // Act
            const result = await createTaskService(userId, title);

            // Assert
            expect(result).toEqual(mockTask);
            expect(prismaMock.task.create).toHaveBeenCalledWith({
                data: { userId, title, description: undefined }
            });
        });
    });

    describe('updateTaskService', () => {
        it('should update a task successfully', async () => {
            // Arrange
            const taskId = 'test-task-id';
            const title = 'Updated Task';
            const description = 'Updated Description';
            const mockUpdatedTask: Task = {
                id: taskId,
                title,
                description,
                userId: 'test-user-id',
                isComplete: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prismaMock.task.update.mockResolvedValue(mockUpdatedTask);

            // Act
            const result = await updateTaskService(taskId, title, description);

            // Assert
            expect(result).toEqual(mockUpdatedTask);
            expect(prismaMock.task.update).toHaveBeenCalledWith({
                where: { id: taskId },
                data: { title, description }
            });
        });

        it('should throw error when updating non-existent task', async () => {
            // Arrange
            const taskId = 'non-existent-task';
            prismaMock.task.update.mockRejectedValue(new Error('Task not found'));

            // Act & Assert
            await expect(updateTaskService(taskId, 'title')).rejects.toThrow('Task not found');
        });
    });

    describe('deleteTaskService', () => {
        it('should delete a task successfully', async () => {
            // Arrange
            const taskId = 'test-task-id';
            const mockDeletedTask: Task = {
                id: taskId,
                title: 'Task to delete',
                description: 'Description',
                userId: 'test-user-id',
                isComplete: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            prismaMock.task.delete.mockResolvedValue(mockDeletedTask);

            // Act
            const result = await deleteTaskService(taskId);

            // Assert
            expect(result).toEqual(mockDeletedTask);
            expect(prismaMock.task.delete).toHaveBeenCalledWith({
                where: { id: taskId }
            });
        });

        it('should throw error when deleting non-existent task', async () => {
            // Arrange
            const taskId = 'non-existent-task';
            prismaMock.task.delete.mockRejectedValue(new Error('Task not found'));

            // Act & Assert
            await expect(deleteTaskService(taskId)).rejects.toThrow('Task not found');
        });
    });
});
