export interface DeviceInfo {
  userAgent?: string;
  csrfToken?: string;
  ip?: string;
}

export type SessionType = 'user_session' | 'oauth_state';
export type OAuthProvider = 'google' | 'linkedin' | 'github';

// Base session interface with common fields
export interface BaseSession {
  id: number;
  session_id: string;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  device_info: DeviceInfo;
  ip_address: string;
}

// User session specific interface
export interface UserSession extends BaseSession {
  type: 'user_session';
  user_id: number;
  last_activity_at: Date;
}

// OAuth state session specific interface
export interface OAuthStateSession extends BaseSession {
  type: 'oauth_state';
  provider: OAuthProvider;
  state: string;
  metadata?: Record<string, any>;
}

// Union type for all session types
export type Session = UserSession | OAuthStateSession;

export interface SessionData {
  ip?: string;
  userAgent?: string;
  csrfToken?: string;
}

export interface OAuthStateSessionData {
  type: 'oauth_state';
  provider: OAuthProvider;
  state: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class SessionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'SessionError';
  }
}