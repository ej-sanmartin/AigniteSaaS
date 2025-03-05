import { Request, Response } from 'express';
import { subscriptionService } from './subscription.service';
import { createSubscriptionSchema } from './subscription.validation';
import { TokenPayload } from '../../types/auth.types';

export class SubscriptionController {
  /**
   * Handles getting subscription status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    const user = req.user as TokenPayload;
    
    if (!user?.id) {
      res.status(401).json({ 
        message: 'User not authenticated',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    try {
      const status = await subscriptionService.getSubscriptionStatus(user.id);
      res.json(status);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).json({ 
        message: 'Error fetching subscription status',
        code: 'SUBSCRIPTION_FETCH_ERROR'
      });
    }
  }

  /**
   * Handles creating new subscription
   */
  async create(req: Request, res: Response): Promise<void> {
    const user = req.user as TokenPayload;
    
    if (!user?.id) {
      res.status(401).json({ 
        message: 'User not authenticated',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    try {
      const validatedData = createSubscriptionSchema.parse(req.body);
      const subscription = await subscriptionService.createSubscription(
        user.id,
        validatedData
      );
      
      res.json(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ 
        message: 'Error creating subscription',
        code: 'SUBSCRIPTION_CREATE_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const subscriptionController = new SubscriptionController(); 