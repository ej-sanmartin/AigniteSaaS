import { Router } from 'express';
import { verifyEmailController } from './verify_email.controller';
import {
  verificationEmailLimiter,
  verifyTokenLimiter
} from '../../middleware/rateLimiter';

const router = Router();

router.post(
  '/send-verification',
  verificationEmailLimiter,
  (req, res) => verifyEmailController.handleVerificationEmail(req, res)
);

router.get(
  '/verify/:token',
  verifyTokenLimiter,
  (req, res) => verifyEmailController.handleVerifyToken(req, res)
);

export default router; 