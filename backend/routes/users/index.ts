import { Router } from 'express';
import { userController } from './user.controller';
import { verifySession } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

// Public route for user registration
router.post(
  '/register',
  (req, res) => userController.createUser(req, res)
);

// Protected routes
router.get(
  '/',
  verifySession,
  (req, res) => userController.getAllUsers(req, res)
);

router.get(
  '/dashboard-stats',
  verifySession,
  (req, res) => userController.getDashboardStats(req, res)
);

router.get(
  '/profile',
  verifySession,
  (req, res) => userController.getUserProfile(req, res)
);

router.get(
  '/:id',
  verifySession,
  (req, res) => userController.getUserById(req, res)
);

router.put(
  '/:id',
  verifySession,
  (req, res) => userController.updateUser(req, res)
);

router.delete(
  '/:id',
  verifySession,
  (req, res) => userController.deleteUser(req, res)
);

// Avatar routes
router.get(
  '/avatar',
  verifySession,
  (req, res) => userController.getAvatar(req, res)
);

router.post(
  '/avatar',
  verifySession,
  upload.single('avatar'),
  (req, res) => userController.uploadAvatar(req, res)
);

export default router;