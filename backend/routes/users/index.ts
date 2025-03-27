import { Router, Request } from 'express';
import { userController } from './user.controller';
import { verifyToken } from '../../middleware/auth';

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
  '/:id',
  verifyToken,
  (req: Request, res) => userController.getUserById(req, res)
);

router.put(
  '/:id',
  verifyToken,
  (req: Request, res) => userController.updateUser(req, res)
);

router.delete(
  '/:id',
  verifyToken,
  (req: Request, res) => userController.deleteUser(req, res)
);

router.get(
  '/dashboard-stats',
  verifyToken,
  (req: Request, res) => userController.getDashboardStats(req, res)
);

export default router; 