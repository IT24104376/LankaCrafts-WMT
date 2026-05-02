import { Router } from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { login, getMe } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.get('/me', protectAdmin, getMe);

export default router;
