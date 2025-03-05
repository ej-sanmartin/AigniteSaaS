import { z } from 'zod';

export const verificationTokenSchema = z.object({
  token: z.string().length(64) // 32 bytes in hex = 64 characters
});

export type VerificationTokenInput = z.infer<typeof verificationTokenSchema>; 