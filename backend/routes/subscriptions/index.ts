import { Router, Request } from 'express';
import { subscriptionController } from './subscription.controller';
import { verifyToken } from '../../middleware/auth';

const router = Router();

router.get(
  '/status',
  verifyToken,
  (req: Request, res) => subscriptionController.getStatus(req, res)
);

router.post(
  '/',
  verifyToken,
  (req: Request, res) => subscriptionController.create(req, res)
);

export default router; 