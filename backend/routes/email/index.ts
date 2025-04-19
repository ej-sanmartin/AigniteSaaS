import { Router } from 'express';
import { emailController } from './email.controller';
import { verifyTokenLimiter } from '../../middleware/rateLimiter';
import { verifySession } from '../../middleware/auth';

const router = Router();

// Email verification route
router.get(
  '/verify',
  verifyTokenLimiter,
  (req, res) => emailController.verifyEmail(req, res)
);

// Resend verification email route
router.post(
  '/resend-verification',
  verifyTokenLimiter,
  verifySession,
  (req, res) => emailController.resendVerification(req, res)
);

export default router; 