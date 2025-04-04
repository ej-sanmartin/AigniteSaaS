import { z } from 'zod';
import { CookieOptions } from 'express';

const securityConfigSchema = z.object({
  cors: z.object({
    origin: z.array(z.string()),
    credentials: z.boolean(),
  }),
  cookies: z.object({
    secure: z.boolean(),
    sameSite: z.enum(['lax', 'strict', 'none']) as z.ZodType<CookieOptions['sameSite']>,
    httpOnly: z.boolean(),
  }),
  tokens: z.object({
    accessTokenExpiry: z.string(),
    refreshTokenExpiry: z.string(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    includeUserInfo: z.boolean(),
  }),
});

const isDevelopment = process.env.NODE_ENV === 'development';

export const securityConfig = {
  development: {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    },
    cookies: {
      secure: false,
      sameSite: 'lax' as const,
      httpOnly: true,
    },
    tokens: {
      accessTokenExpiry: '24h',
      refreshTokenExpiry: '30d',
    },
    logging: {
      level: 'debug',
      includeUserInfo: true,
    },
  },
  production: {
    cors: {
      origin: [process.env.FRONTEND_URL || ''],
      credentials: true,
    },
    cookies: {
      secure: true,
      sameSite: 'strict' as const,
      httpOnly: true,
    },
    tokens: {
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
    },
    logging: {
      level: 'info',
      includeUserInfo: false,
    },
  },
};

// Validate the configuration
const config = isDevelopment ? securityConfig.development : securityConfig.production;
securityConfigSchema.parse(config);

export default config; 