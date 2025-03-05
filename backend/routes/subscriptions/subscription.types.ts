import { SubscriptionStatus } from '../../types/stripe.types';

export interface UserSubscriptionData {
  subscription_status: SubscriptionStatus;
  current_period_end: string;
  subscription_id: string;
  price_id: string;
}

export interface UserStripeData {
  email: string;
  stripe_customer_id: string | null;
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  clientSecret: string | null;
  status: string;
} 