export interface DeviceInfo {
  userAgent?: string;
  csrfToken?: string;
  ip?: string;
}

export interface Session {
  id: number;
  user_id: number;
  session_id: string;
  created_at: Date;
  last_activity_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  device_info: DeviceInfo;
  ip_address: string;
}

export interface SessionData {
  ip?: string;
  userAgent?: string;
  csrfToken?: string;
}

export class SessionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'SessionError';
  }
}