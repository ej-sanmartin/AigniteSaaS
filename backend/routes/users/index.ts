import { Router, Request, Response } from 'express';
import { userController } from './user.controller';
import { verifySession } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Public route for user registration
router.post(
  '/register',
  authLimiter,
  (req: Request, res: Response) => userController.createUser(req, res)
);

// Protected routes
router.get(
  '/',
  verifySession,
  (req: Request, res: Response) => userController.getAllUsers(req, res)
);

router.get(
  '/dashboard-stats',
  verifySession,
  (req: Request, res: Response) => userController.getDashboardStats(req, res)
);

router.get(
  '/profile',
  verifySession,
  (req: Request, res: Response) => userController.getUserProfile(req, res)
);

router.get(
  '/:id',
  verifySession,
  (req: Request, res: Response) => userController.getUserById(req, res)
);

router.put(
  '/:id',
  verifySession,
  (req: Request, res: Response) => userController.updateUser(req, res)
);

router.delete(
  '/:id',
  verifySession,
  (req: Request, res: Response) => userController.deleteUser(req, res)
);

// Avatar routes
router.get(
  '/avatar',
  verifySession,
  (req: Request, res: Response) => userController.getAvatar(req, res)
);

router.post(
  '/avatar',
  verifySession,
  upload.single('avatar'),
  (req: Request, res: Response) => userController.uploadAvatar(req, res)
);

export default router;