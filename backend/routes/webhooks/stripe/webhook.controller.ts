import { Response } from 'express';
import { stripe, STRIPE_WEBHOOK_SECRET } from '../../../config/stripe';
import { webhookService } from './webhook.service';
import { 
  StripeWebhookRequest, 
  SubscriptionUpdatedEvent,
  SubscriptionDeletedEvent,
  SubscriptionCreatedEvent
} from './webhook.types';
import { subscriptionWebhookSchema } from './webhook.validation';

export class WebhookController {
  /**
   * Validates and processes Stripe webhook events
   */
  async handleWebhook(req: StripeWebhookRequest, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      res.status(400).json({ 
        message: 'Missing stripe signature',
        code: 'MISSING_SIGNATURE'
      });
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'customer.subscription.created': {
          const subscription = subscriptionWebhookSchema.parse(
            (event as SubscriptionCreatedEvent).data.object
          );

          await webhookService.handleSubscriptionCreation({
            customerId: subscription.customer,
            subscriptionId: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0].price.id,
            currentPeriodEnd: subscription.current_period_end,
          });
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = subscriptionWebhookSchema.parse(
            (event as SubscriptionUpdatedEvent).data.object
          );

          await webhookService.handleSubscriptionUpdate({
            customerId: subscription.customer,
            subscriptionId: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0].price.id,
            currentPeriodEnd: subscription.current_period_end,
          });
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = subscriptionWebhookSchema.parse(
            (event as SubscriptionDeletedEvent).data.object
          );

          await webhookService.handleSubscriptionDeletion({
            customerId: subscription.customer,
            subscriptionId: subscription.id,
            status: subscription.status,
            priceId: subscription.items.data[0].price.id,
            currentPeriodEnd: subscription.current_period_end,
          });
          break;
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ 
        message: 'Webhook error',
        code: 'WEBHOOK_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const webhookController = new WebhookController(); 