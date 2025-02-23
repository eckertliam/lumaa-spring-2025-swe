import { Router } from 'express';
import { register, authenticate } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', authenticate);

export default router;