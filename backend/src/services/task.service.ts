import { Task } from '@prisma/client';
import prisma from '../db';

/**
 * Query all tasks for a user
 * @param userId - The ID of the user to query tasks for
 * @returns A list of tasks
 */
export async function getTasksService(userId: string): Promise<Task[]> {
    return prisma.task.findMany({
        where: {
            userId,
        },
    });
}

/**
 * Insert a new task into the database
 * @param userId - The ID of the user to create the task for
 * @param title - The title of the task
 * @param description - The description of the task
 * @returns The created task
 */
export async function createTaskService(userId: string, title: string, description?: string): Promise<Task> {
    return prisma.task.create({
        data: {
            userId,
            title,
            description,
        },
    });
}

/**
 * Update a task by id
 * @param taskId - The id of the task to update
 * @param title - The title of the task
 * @param description - The description of the task
 * @returns The updated task
 */
export async function updateTaskService(taskId: string, title: string, description?: string): Promise<Task> {
    return prisma.task.update({
        where: { id: taskId },
        data: { title, description },
    });
}


/**
 * Delete a task by id
 * @param taskId - The id of the task to delete
 * @returns The deleted task
 */
export async function deleteTaskService(taskId: string): Promise<Task> {
    return prisma.task.delete({ where: { id: taskId } });
}