import { Router } from 'express';
import { verifyEmailController } from './verify_email.controller';
import { verifyTokenLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Email verification route
router.get(
  '/verify-email',
  verifyTokenLimiter,
  (req, res) => verifyEmailController.verifyEmail(req, res)
);

export default router; 