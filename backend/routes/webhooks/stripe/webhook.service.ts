import { executeQuery } from '../../../db/queryExecutor';
import { UserQueryResult,
         SubscriptionStatus } from './webhook.types';
import { SubscriptionWebhookData } from '../../../types/stripe.types';

export class WebhookService {
  /**
   * Updates user subscription details and history
   */
  async handleSubscriptionUpdate(data: SubscriptionWebhookData): Promise<void> {
    await executeQuery({
      text: 'BEGIN'
    });

    try {
      const updateResult = await executeQuery<UserQueryResult>({
        text: `
          UPDATE users 
          SET 
            subscription_status = $1,
            current_period_end = to_timestamp($2),
            updated_at = CURRENT_TIMESTAMP,
            role = CASE 
              WHEN $1 = 'active' AND role = 'user' THEN 'subscriber'
              WHEN $1 != 'active' AND role = 'subscriber' THEN 'user'
              ELSE role 
            END
          WHERE stripe_customer_id = $3
          RETURNING id
        `,
        values: [
          data.status,
          data.currentPeriodEnd,
          data.customerId
        ]
      });

      if (!updateResult.rowCount) {
        throw new Error(`No user found for customer: ${data.customerId}`);
      }

      // Track status change in history
      await executeQuery({
        text: `
          INSERT INTO subscription_history (
            user_id,
            subscription_id,
            status,
            price_id,
            started_at
          ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `,
        values: [
          updateResult.rows[0].id,
          data.subscriptionId,
          data.status,
          data.priceId
        ]
      });

      await executeQuery({
        text: 'COMMIT'
      });
    } catch (error) {
      await executeQuery({
        text: 'ROLLBACK'
      });
      throw error;
    }
  }

  /**
   * Handles subscription deletion and updates history
   */
  async handleSubscriptionDeletion(data: SubscriptionWebhookData): Promise<void> {
    await executeQuery({
      text: 'BEGIN'
    });

    try {
      await this.handleSubscriptionUpdate({
        ...data,
        status: 'canceled'
      });

      await executeQuery({
        text: `
          UPDATE subscription_history 
          SET ended_at = CURRENT_TIMESTAMP 
          WHERE subscription_id = $1 
            AND ended_at IS NULL
        `,
        values: [data.subscriptionId]
      });

      await executeQuery({
        text: 'COMMIT'
      });
    } catch (error) {
      await executeQuery({
        text: 'ROLLBACK'
      });
      throw error;
    }
  }

  /**
   * Handles initial subscription creation and setup
   * Updates user record, creates history, and sets up subscriber status
   */
  async handleSubscriptionCreation({
    customerId,
    subscriptionId,
    status,
    priceId,
    currentPeriodEnd,
  }: {
    customerId: string;
    subscriptionId: string;
    status: SubscriptionStatus;
    priceId: string;
    currentPeriodEnd: number;
  }) {
    await executeQuery({
      text: 'BEGIN'
    });

    try {
      const userResult = await executeQuery<UserQueryResult>({
        text: `
          UPDATE users 
          SET 
            subscription_id = $1,
            subscription_status = $2,
            price_id = $3,
            current_period_end = to_timestamp($4),
            updated_at = CURRENT_TIMESTAMP,
            role = CASE 
              WHEN $2 = 'active' AND role = 'user' THEN 'subscriber'
              ELSE role 
            END
          WHERE stripe_customer_id = $5
          RETURNING id
        `,
        values: [
          subscriptionId,
          status,
          priceId,
          currentPeriodEnd,
          customerId
        ]
      });

      if (!userResult.rowCount) {
        throw new Error(`No user found for Stripe customer: ${customerId}`);
      }

      await executeQuery({
        text: `
          INSERT INTO subscription_history (
            user_id,
            subscription_id,
            status,
            price_id,
            started_at
          ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        `,
        values: [
          userResult.rows[0].id,
          subscriptionId,
          status,
          priceId
        ]
      });

      await executeQuery({
        text: 'COMMIT'
      });
    } catch (error) {
      await executeQuery({
        text: 'ROLLBACK'
      });
      console.error('Error handling subscription creation:', error);
      throw error;
    }
  }
}

export const webhookService = new WebhookService(); 