import { Router } from 'express';
import { authController } from './auth.controller';
import { verifyToken } from '../../middleware/auth';

const router = Router();

router.get('/check', verifyToken, authController.checkAuth);
router.post('/refresh', authController.refreshToken);

export default router; 