import { z } from 'zod';
import { DeviceInfo } from './session.types';
import { convertOAuthSessionRow, convertUserSessionRow } from '../../utils/typeConverters';

export const deviceInfoSchema = z.object({
  userAgent: z.string().optional(),
  csrfToken: z.string().optional(),
  ip: z.string().optional()
});

// Base schema for common fields
export const baseSessionSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  created_at: z.date(),
  expires_at: z.date(),
  revoked_at: z.date().nullable(),
  device_info: deviceInfoSchema,
  ip_address: z.string()
});

// User session specific schema
export const userSessionSchema = baseSessionSchema.extend({
  user_id: z.number(),
  last_activity_at: z.date()
});

// OAuth state session specific schema
export const oauthStateSessionSchema = baseSessionSchema.extend({
  type: z.literal('oauth_state'),
  provider: z.enum(['google', 'linkedin', 'github'] as const),
  state: z.string(),
  metadata: z.record(z.any()).optional()
});

export function validateDeviceInfo(data: unknown): DeviceInfo {
  try {
    return deviceInfoSchema.parse(data);
  } catch (error) {
    throw new Error('Invalid device information');
  }
}

export function validateSession(session: unknown) {
  try {
    // First check if it's an OAuth state session
    if (typeof session === 'object' && session !== null && 'type' in session && session.type === 'oauth_state') {
      const convertedSession = convertOAuthSessionRow(session);
      return oauthStateSessionSchema.parse(convertedSession);
    }
    // Otherwise assume it's a user session
    const convertedSession = convertUserSessionRow(session);
    return userSessionSchema.parse(convertedSession);
  } catch (error) {
    throw new Error('Invalid session data');
  }
} 