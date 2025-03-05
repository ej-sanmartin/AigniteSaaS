import { executeQuery } from '../../../utils/sql';
import { QueryResult } from './webhook.types';
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
      const updateResult = await executeQuery<QueryResult>({
        text: `
          UPDATE users 
          SET 
            subscription_status = $1,
            current_period_end = to_timestamp($2)
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
      await this.handleSubscriptionUpdate(data);

      await executeQuery({
        text: `
          UPDATE subscription_history 
          SET ended_at = NOW() 
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
}

export const webhookService = new WebhookService(); 