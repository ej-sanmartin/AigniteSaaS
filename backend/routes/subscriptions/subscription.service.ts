import { stripe } from '../../config/stripe';
import { executeQuery } from '../../db/queryExecutor';
import {
  UserSubscriptionData,
  UserStripeData,
  CreateSubscriptionResponse
} from '../../types/stripe.types';
import { CreateSubscriptionInput } from './subscription.validation';
import Stripe from 'stripe';

export class SubscriptionService {
  /**
   * Gets a user's subscription status
   */
  async getSubscriptionStatus(userId: number): Promise<UserSubscriptionData> {
    const query = {
      text: `
        SELECT 
          subscription_status,
          current_period_end,
          subscription_id,
          price_id
        FROM users 
        WHERE id = $1
      `,
      values: [userId]
    };

    const result = await executeQuery<UserSubscriptionData[]>(query);
    
    if (!result.length) {
      throw new Error('User not found');
    }

    return result[0];
  }

  /**
   * Gets or creates a Stripe customer for a user
   */
  private async getOrCreateStripeCustomer(
    userId: number,
    paymentMethodId: string
  ): Promise<string> {
    const query = {
      text: 'SELECT email, stripe_customer_id FROM users WHERE id = $1',
      values: [userId]
    };
    
    const result = await executeQuery<UserStripeData[]>(query);
    if (!result.length) {
      throw new Error('User not found');
    }

    let { stripe_customer_id: customerId, email } = result[0];
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      
      customerId = customer.id;
      
      await executeQuery({
        text: 'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        values: [customerId, userId]
      });
    }

    return customerId;
  }

  /**
   * Creates a new subscription
   */
  async createSubscription(
    userId: number,
    { priceId, paymentMethodId }: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResponse> {
    const customerId = await this.getOrCreateStripeCustomer(userId, paymentMethodId);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    }) as Stripe.Response<
      Stripe.Subscription & {
        latest_invoice: Stripe.Invoice & {
          payment_intent: Stripe.PaymentIntent;
        };
      }
    >;

    // Handle cases where immediate payment might not be needed
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    const subscriptionStatus = subscription.status;

    await executeQuery({
      text: `
        UPDATE users 
        SET 
          subscription_id = $1,
          subscription_status = $2,
          current_period_end = to_timestamp($3),
          price_id = $4
        WHERE id = $5
      `,
      values: [
        subscription.id,
        subscriptionStatus,
        subscription.current_period_end,
        priceId,
        userId
      ]
    });

    return {
      subscriptionId: subscription.id,
      clientSecret: clientSecret || null,
      status: subscriptionStatus
    };
  }
}

export const subscriptionService = new SubscriptionService(); 