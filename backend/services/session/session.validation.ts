import { z } from 'zod';
import { DeviceInfo } from '../../types/session';

export const deviceInfoSchema = z.object({
  userAgent: z.string().optional(),
  csrfToken: z.string().optional(),
  ip: z.string().optional()
});

export const sessionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  session_id: z.string(),
  created_at: z.date(),
  last_activity_at: z.date(),
  expires_at: z.date(),
  revoked_at: z.date().nullable(),
  device_info: deviceInfoSchema,
  ip_address: z.string()
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
    return sessionSchema.parse(session);
  } catch (error) {
    throw new Error('Invalid session data');
  }
} 