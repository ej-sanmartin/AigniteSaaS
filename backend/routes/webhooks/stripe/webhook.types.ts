import { Request } from 'express';
import Stripe from 'stripe';

export interface StripeWebhookRequest extends Request {
  body: string | Buffer;
  headers: {
    'stripe-signature': string;
  };
}

export interface QueryResult {
  rowCount: number;
}

// Use Stripe's event types for subscription events
export type SubscriptionUpdatedEvent = Stripe.Event & {
  type: 'customer.subscription.updated';
  data: {
    object: Stripe.Subscription;
  };
};

export type SubscriptionDeletedEvent = Stripe.Event & {
  type: 'customer.subscription.deleted';
  data: {
    object: Stripe.Subscription;
  };
}; 