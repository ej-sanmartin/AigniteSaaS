import { Router } from 'express';
import { webhookController } from './webhook.controller';
import { StripeWebhookRequest } from './webhook.types';

const router = Router();

router.post(
  '/',
  (req, res) => webhookController.handleWebhook(req as StripeWebhookRequest, res)
);

export default router; 