import { Router } from 'express';
import { createTask, deleteTask, getTasks, updateTask, verifyAuth } from '../controllers/task.controller';

const router = Router();

// verify the user is authenticated
router.use(verifyAuth);

// get all tasks for the user
router.get('/', getTasks);

// create a new task
router.post('/', createTask);

// update a task
router.put('/:id', updateTask);

// delete a task
router.delete('/:id', deleteTask);

export default router;
