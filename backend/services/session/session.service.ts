import { executeQuery } from '../../db/queryExecutor';
import { Session, SessionError } from '../../types/session';
import { validateDeviceInfo, validateSession } from './session.validation';
import crypto from 'crypto';

interface SessionData {
  ip?: string;
  userAgent?: string;
  csrfToken?: string;
}

export class SessionService {
  async createSession(userId: number, data: SessionData): Promise<Session> {
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

      const result = await executeQuery<Session[]>(query);
      if (!result[0]) {
        throw new SessionError('Failed to create session', 'SESSION_CREATION_FAILED');
      }

      return validateSession(result[0]);
    } catch (error) {
      if (error instanceof SessionError) {
        throw error;
      }
      throw new SessionError('Failed to create session', 'SESSION_CREATION_ERROR');
    }
  }

  async getSession(sessionId: string): Promise<Session | null> {
    try {
      const query = {
        text: 'SELECT * FROM sessions WHERE session_id = $1 AND revoked_at IS NULL',
        values: [sessionId]
      };

      const result = await executeQuery<Session[]>(query);
      if (!result[0]) {
        return null;
      }

      return validateSession(result[0]);
    } catch (error) {
      throw new SessionError('Failed to retrieve session', 'SESSION_RETRIEVAL_ERROR');
    }
  }

  async updateSession(sessionId: string, data: Partial<SessionData>): Promise<Session> {
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

      const result = await executeQuery<Session[]>(query);
      if (!result[0]) {
        throw new SessionError('Failed to update session', 'SESSION_UPDATE_FAILED');
      }

      return validateSession(result[0]);
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
} 