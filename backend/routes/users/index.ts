import { Router, Request } from 'express';
import { userController } from './user.controller';
import { verifyToken } from '../../middleware/auth';
import { AuthenticatedRequest } from './user.types';

const router = Router();

// Public route for user registration
router.post(
  '/register',
  (req: Request, res) => userController.createUser(req, res)
);

// Protected routes
router.get(
  '/',
  verifyToken,
  (req: Request, res) => userController.getAllUsers(req, res)
);

router.get(
  '/dashboard-stats',
  verifyToken,
  (req: Request, res) => userController.getDashboardStats(req as AuthenticatedRequest, res)
);

router.get(
  '/:id',
  verifyToken,
  (req: Request, res) => userController.getUserById(req as AuthenticatedRequest, res)
);

router.put(
  '/:id',
  verifyToken,
  (req: Request, res) => userController.updateUser(req as AuthenticatedRequest, res)
);

router.delete(
  '/:id',
  verifyToken,
  (req: Request, res) => userController.deleteUser(req, res)
);

export default router; 