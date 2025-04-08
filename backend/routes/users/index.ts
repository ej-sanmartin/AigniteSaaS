import { Router } from 'express';
import { userController } from './user.controller';
import { verifySession } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import { RequestWithSession } from '../../types/express';

const router = Router();

// Public route for user registration
router.post(
  '/register',
  (req: RequestWithSession, res) => userController.createUser(req, res)
);

// Protected routes
router.get(
  '/',
  verifySession,
  (req: RequestWithSession, res) => userController.getAllUsers(req, res)
);

router.get(
  '/dashboard-stats',
  verifySession,
  (req: RequestWithSession, res) => userController.getDashboardStats(req, res)
);

router.get(
  '/profile',
  verifySession,
  (req: RequestWithSession, res) => userController.getUserProfile(req, res)
);

router.get(
  '/:id',
  verifySession,
  (req: RequestWithSession, res) => userController.getUserById(req, res)
);

router.put(
  '/:id',
  verifySession,
  (req: RequestWithSession, res) => userController.updateUser(req, res)
);

router.delete(
  '/:id',
  verifySession,
  (req: RequestWithSession, res) => userController.deleteUser(req, res)
);

// Avatar routes
router.get(
  '/avatar',
  verifySession,
  (req: RequestWithSession, res) => userController.getAvatar(req, res)
);

router.post(
  '/avatar',
  verifySession,
  upload.single('avatar'),
  (req: RequestWithSession, res) => userController.uploadAvatar(req, res)
);

export default router;