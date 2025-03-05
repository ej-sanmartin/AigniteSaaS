import { Request, Response, NextFunction } from 'express';
import { executeQuery } from '../utils/sql';
import { SubscriptionStatus } from '../types/stripe.types';
import { TokenPayload } from '../types/auth.types';

// Cache the current UTC date for 1 minute
let cachedNow: Date | null = null;
let cacheExpiry: Date | null = null;

const getCurrentUTCDate = (): Date => {
  const now = new Date();
  if (!cachedNow || !cacheExpiry || now > cacheExpiry) {
    cachedNow = new Date(Date.now());
    cacheExpiry = new Date(Date.now() + 60 * 1000);
  }
  return cachedNow;
};

interface SubscriptionData {
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string;
}

export const requireActiveSubscription = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const user = req.user as TokenPayload;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const query = {
      text: `
        SELECT 
          subscription_status as "subscriptionStatus", 
          current_period_end as "currentPeriodEnd"
        FROM users 
        WHERE id = $1
      `,
      values: [userId]
    };

    const result = await executeQuery<SubscriptionData[]>(query);
    
    if (!result.length) {
      return res.status(403).json({ 
        message: 'No subscription found',
        code: 'NO_SUBSCRIPTION'
      });
    }

    if (result[0].subscriptionStatus !== 'active') {
      return res.status(403).json({ 
        message: 'Subscription is not active',
        code: 'INACTIVE_SUBSCRIPTION'
      });
    }

    // Compare dates in UTC
    const periodEnd = new Date(result[0].currentPeriodEnd);
    const now = getCurrentUTCDate();

    if (periodEnd < now) {
      return res.status(403).json({ 
        message: 'Subscription has expired',
        code: 'EXPIRED_SUBSCRIPTION',
        expiryDate: periodEnd.toISOString()
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Error checking subscription status',
      code: 'SUBSCRIPTION_CHECK_ERROR'
    });
  }
}; 