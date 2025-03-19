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

export interface UserQueryResult extends QueryResult {
  rows: Array<{
    id: number;
  }>;
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

export interface SubscriptionCreatedEvent {
  id: string;
  object: 'event';
  type: 'customer.subscription.created';
  data: {
    object: {
      id: string;
      object: 'subscription';
      customer: string;
      status: SubscriptionStatus;
      items: {
        data: Array<{
          price: {
            id: string;
          };
        }>;
      };
      current_period_end: number;
    };
  };
}

export type SubscriptionStatus = 
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'; 