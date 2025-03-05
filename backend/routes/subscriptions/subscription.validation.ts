import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  priceId: z.string().min(1),
  paymentMethodId: z.string().min(1)
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>; 