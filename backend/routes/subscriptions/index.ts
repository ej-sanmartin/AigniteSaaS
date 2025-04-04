import { Router, Request } from 'express';
import { subscriptionController } from './subscription.controller';
import { verifySession } from '../../middleware/auth';

const router = Router();

router.get(
  '/status',
  verifySession,
  (req: Request, res) => subscriptionController.getStatus(req, res)
);

router.post(
  '/',
  verifySession,
  (req: Request, res) => subscriptionController.create(req, res)
);

export default router; 