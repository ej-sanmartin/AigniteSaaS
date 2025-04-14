import { executeQuery } from '../../db/queryExecutor';
import { UserSession, OAuthStateSession, SessionData, OAuthStateSessionData, SessionError } from './session.types';
import { validateDeviceInfo, validateSession } from './session.validation';
import { convertUserSessionRow } from '../../utils/typeConverters';
import crypto from 'crypto';

export class SessionService {
  async createSession(userId: number, data: SessionData): Promise<UserSession> {
    try {
      const deviceInfo = validateDeviceInfo(data);
      const sessionId = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      const query = {
        text: `INSERT INTO sessions (
          user_id, 
          session_id, 
          created_at, 
          last_activity_at, 
          expires_at, 
          device_info, 
          ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        values: [
          userId,
          sessionId,
          now,
          now,
          expiresAt,
          JSON.stringify(deviceInfo),
          data.ip || ''
        ]
      };

      const result = await executeQuery<UserSession[]>(query);
      if (!result[0]) {
        throw new SessionError('Failed to create session', 'SESSION_CREATION_FAILED');
      }

      const convertedSession = convertUserSessionRow(result[0]);
      return validateSession(convertedSession) as UserSession;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError('Failed to create session', 'SESSION_CREATION_ERROR');
    }
  }

  async createOAuthStateSession(data: OAuthStateSessionData): Promise<OAuthStateSession> {
    try {
      const deviceInfo = validateDeviceInfo(data);
      const sessionId = crypto.randomBytes(32).toString('hex');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes for OAuth state

      const query = {
        text: `INSERT INTO oauth_sessions (
          session_id, 
          created_at, 
          expires_at, 
          device_info, 
          ip_address,
          type,
          provider,
          state,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        values: [
          sessionId,
          now,
          expiresAt,
          JSON.stringify(deviceInfo),
          data.ip || '',
          data.type,
          data.provider,
          data.state,
          data.metadata ? JSON.stringify(data.metadata) : null
        ]
      };

      const result = await executeQuery<OAuthStateSession[]>(query);

      if (!result[0]) {
        throw new SessionError('Failed to create OAuth state session', 'OAUTH_SESSION_CREATION_FAILED');
      }

      try {
        const validatedSession = validateSession(result[0]);
        return validatedSession as OAuthStateSession;
      } catch (validationError) {
        throw new SessionError('Failed to validate OAuth state session', 'OAUTH_SESSION_VALIDATION_ERROR');
      }
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError('Failed to create OAuth state session', 'OAUTH_SESSION_CREATION_ERROR');
    }
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    try {
      const query = {
        text: 'SELECT * FROM sessions WHERE session_id = $1 AND revoked_at IS NULL',
        values: [sessionId]
      };

      const result = await executeQuery<UserSession[]>(query);
      if (!result[0]) {
        return null;
      }

      return validateSession(result[0]) as UserSession;
    } catch (error) {
      throw new SessionError('Failed to retrieve session', 'SESSION_RETRIEVAL_ERROR');
    }
  }

  async getOAuthStateSession(state: string): Promise<OAuthStateSession | null> {
    try {
      const query = {
        text: 'SELECT * FROM oauth_sessions WHERE state = $1 AND revoked_at IS NULL',
        values: [state]
      };

      const result = await executeQuery<OAuthStateSession[]>(query);
      if (!result[0]) {
        return null;
      }

      return validateSession(result[0]) as OAuthStateSession;
    } catch (error) {
      throw new SessionError('Failed to retrieve OAuth state session', 'OAUTH_SESSION_RETRIEVAL_ERROR');
    }
  }

  async getOAuthStateSessionBySessionId(sessionId: string): Promise<OAuthStateSession | null> {
    try {
      const query = {
        text: 'SELECT * FROM oauth_sessions WHERE session_id = $1 AND type = $2 AND revoked_at IS NULL',
        values: [sessionId, 'oauth_state']
      };

      const result = await executeQuery<OAuthStateSession[]>(query);
      if (!result[0]) {
        return null;
      }

      return validateSession(result[0]) as OAuthStateSession;
    } catch (error) {
      throw new SessionError('Failed to retrieve OAuth state session', 'OAUTH_SESSION_RETRIEVAL_ERROR');
    }
  }

  async updateSession(sessionId: string, data: Partial<SessionData>): Promise<UserSession> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new SessionError('Session not found', 'SESSION_NOT_FOUND');
      }

      const deviceInfo = validateDeviceInfo({
        ...session.device_info,
        ...data
      });

      const query = {
        text: `UPDATE sessions 
         SET last_activity_at = $1, 
             device_info = $2
         WHERE session_id = $3
         RETURNING *`,
        values: [new Date(), JSON.stringify(deviceInfo), sessionId]
      };

      const result = await executeQuery<UserSession[]>(query);
      if (!result[0]) {
        throw new SessionError('Failed to update session', 'SESSION_UPDATE_FAILED');
      }

      return validateSession(result[0]) as UserSession;
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError('Failed to update session', 'SESSION_UPDATE_ERROR');
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      const query = {
        text: 'UPDATE sessions SET revoked_at = $1 WHERE session_id = $2',
        values: [new Date(), sessionId]
      };

      const result = await executeQuery<{ rowCount: number }>(query);
      if (result.rowCount === 0) {
        throw new SessionError('Session not found', 'SESSION_NOT_FOUND');
      }
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError('Failed to revoke session', 'SESSION_REVOKE_ERROR');
    }
  }

  async revokeOAuthStateSession(sessionId: string): Promise<void> {
    try {
      const query = {
        text: 'UPDATE oauth_sessions SET revoked_at = $1 WHERE session_id = $2',
        values: [new Date(), sessionId]
      };

      const result = await executeQuery<{ rowCount: number }>(query);
      if (result.rowCount === 0) {
        throw new SessionError('OAuth state session not found', 'OAUTH_SESSION_NOT_FOUND');
      }
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError('Failed to revoke OAuth state session', 'OAUTH_SESSION_REVOKE_ERROR');
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      const query = {
        text: 'SELECT cleanup_expired_sessions()'
      };
      await executeQuery(query);
    } catch (error) {
      throw new SessionError('Failed to cleanup sessions', 'SESSION_CLEANUP_ERROR');
    }
  }

  async cleanupExpiredOAuthSessions(): Promise<void> {
    try {
      const query = {
        text: 'SELECT cleanup_expired_oauth_sessions()'
      };
      await executeQuery(query);
    } catch (error) {
      throw new SessionError('Failed to cleanup OAuth sessions', 'OAUTH_SESSION_CLEANUP_ERROR');
    }
  }
} 