// Define the valid subscription status values
export type SubscriptionStatus = 
  | 'active' 
  | 'past_due' 
  | 'canceled' 
  | 'incomplete';

// Rename this interface to be more descriptive
export interface SubscriptionDetails {
  active: boolean;
  currentPeriodEnd: Date;
  subscriptionId: string;
  customerId: string;
  priceId: string;
}

export interface CreateSubscriptionDTO {
  priceId: string;
  paymentMethodId: string;
}

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

export interface SubscriptionWebhookData {
  customerId: string;
  subscriptionId: string;
  status: SubscriptionStatus;
  priceId: string;
  currentPeriodEnd: number;
} 