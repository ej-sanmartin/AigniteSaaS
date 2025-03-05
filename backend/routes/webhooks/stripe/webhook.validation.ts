import { z } from 'zod';
import { SubscriptionStatus } from '../../../types/stripe.types';

export const subscriptionStatusSchema = z.enum([
  'active',
  'past_due',
  'canceled',
  'incomplete'
] as const satisfies readonly SubscriptionStatus[]);

export const subscriptionWebhookSchema = z.object({
  customer: z.string(),
  id: z.string(),
  status: subscriptionStatusSchema,
  items: z.object({
    data: z.array(
      z.object({
        price: z.object({
          id: z.string()
        })
      })
    ).min(1)
  }),
  current_period_end: z.number()
});

export type ValidatedSubscriptionWebhook = z.infer<typeof subscriptionWebhookSchema>;