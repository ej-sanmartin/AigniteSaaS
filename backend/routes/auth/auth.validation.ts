import { z } from 'zod';

export const oAuthUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  provider: z.enum(['local', 'google', 'linkedin', 'github']),
  providerId: z.string(),
  role: z.string().default('user'),
  password: z.undefined()
});

export type CreateOAuthUserInput = z.infer<typeof oAuthUserSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
}); 