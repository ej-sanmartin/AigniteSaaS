import { executeQuery } from '../../db/queryExecutor';
import crypto from 'crypto';
import { encryptionService } from '../encryption/encryption.service';

interface TokenRecord {
  id: number;
  user_id: number;
  token: string;
  encrypted_token: string;
  iv: string;
  auth_tag: string;
  key_id: string;
  salt: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by: number | null;
  last_used_at: Date | null;
  device_info: Record<string, any> | null;
  ip_address: string | null;
}

export class TokenService {
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly MAX_SESSIONS_PER_USER = 3;
  private readonly TOKEN_ROTATION_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate a new refresh token
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Create a new refresh token for a user
   */
  async createRefreshToken(
    userId: number,
    deviceInfo?: Record<string, any>,
    ipAddress?: string
  ): Promise<string> {
    // Check session limit
    const sessionCount = await this.getUserSessionCount(userId);
    if (sessionCount >= this.MAX_SESSIONS_PER_USER) {
      throw new Error('Maximum number of active sessions reached');
    }

    const token = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY);

    // Encrypt the token
    const encryptedData = await encryptionService.encrypt(token);

    const query = {
      text: `
        INSERT INTO refresh_tokens (
          user_id, 
          token,
          encrypted_token,
          iv,
          auth_tag,
          key_id,
          salt,
          expires_at,
          device_info,
          ip_address
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      values: [
        userId,
        token,
        encryptedData.encryptedData,
        encryptedData.iv,
        encryptedData.authTag,
        encryptedData.keyId,
        encryptedData.salt,
        expiresAt,
        deviceInfo ? JSON.stringify(deviceInfo) : null,
        ipAddress
      ]
    };
    
    await executeQuery(query);
    return token;
  }

  /**
   * Check if a token needs rotation based on age
   */
  private async needsRotation(tokenId: number): Promise<boolean> {
    const query = {
      text: `
        SELECT created_at 
        FROM refresh_tokens 
        WHERE id = $1
      `,
      values: [tokenId]
    };

    const result = await executeQuery<{ created_at: Date }[]>(query);
    if (!result[0]) return false;

    const tokenAge = Date.now() - result[0].created_at.getTime();
    return tokenAge > this.TOKEN_ROTATION_THRESHOLD;
  }

  /**
   * Verify and get user ID from refresh token
   */
  async verifyRefreshToken(token: string): Promise<number | null> {
    try {
      // First, try to find the token in the database
      const query = {
        text: `
          SELECT id, user_id, encrypted_token, iv, auth_tag, key_id, salt
          FROM refresh_tokens
          WHERE token = $1
          AND revoked_at IS NULL
          AND expires_at > NOW()
        `,
        values: [token]
      };

      const result = await executeQuery<TokenRecord[]>(query);
      if (!result.length) return null;

      const tokenRecord = result[0];

      // Verify the token matches the encrypted version
      const decryptedToken = await encryptionService.decrypt({
        encryptedData: tokenRecord.encrypted_token,
        iv: tokenRecord.iv,
        authTag: tokenRecord.auth_tag,
        keyId: tokenRecord.key_id,
        salt: tokenRecord.salt
      });

      if (decryptedToken !== token) {
        return null;
      }

      // Check if token needs rotation
      if (await this.needsRotation(tokenRecord.id)) {
        // Create new token
        const newToken = await this.createRefreshToken(tokenRecord.user_id);
        // Revoke old token and link to new one
        const newTokenId = await this.getTokenId(newToken);
        if (newTokenId !== null) {
          await this.revokeRefreshToken(token, newTokenId);
        }
        return tokenRecord.user_id;
      }

      await this.updateLastUsed(tokenRecord.id);
      return tokenRecord.user_id;
    } catch (error) {
      console.error('Error verifying refresh token:', error);
      return null;
    }
  }

  /**
   * Update last used timestamp for a refresh token
   */
  private async updateLastUsed(tokenId: number): Promise<void> {
    const query = {
      text: `
        UPDATE refresh_tokens 
        SET last_used_at = NOW()
        WHERE id = $1
      `,
      values: [tokenId]
    };
    await executeQuery(query);
  }

  /**
   * Get the ID of a refresh token
   */
  async getTokenId(token: string): Promise<number | null> {
    const query = {
      text: `
        SELECT id 
        FROM refresh_tokens 
        WHERE token = $1
      `,
      values: [token]
    };

    const result = await executeQuery<{ id: number }[]>(query);
    return result[0]?.id || null;
  }

  /**
   * Revoke a refresh token and optionally replace it with a new token ID
   */
  async revokeRefreshToken(token: string, replacedById?: number): Promise<void> {
    const query = {
      text: `
        UPDATE refresh_tokens 
        SET revoked_at = NOW(), 
            replaced_by = $2
        WHERE token = $1
      `,
      values: [token, replacedById || null]
    };

    await executeQuery(query);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    const query = {
      text: `
        UPDATE refresh_tokens 
        SET revoked_at = NOW()
        WHERE user_id = $1 
          AND revoked_at IS NULL
      `,
      values: [userId]
    };

    await executeQuery(query);
  }

  /**
   * Clean up expired and revoked tokens
   */
  async cleanupTokens(): Promise<void> {
    const query = {
      text: `
        DELETE FROM refresh_tokens
        WHERE expires_at < NOW()
          OR revoked_at IS NOT NULL
      `
    };
    await executeQuery(query);
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: number): Promise<Array<{
    sessionId: string;
    deviceInfo: Record<string, any>;
    ipAddress: string;
    lastActivity: Date;
    expiresAt: Date;
  }>> {
    const query = {
      text: `
        SELECT 
          session_id,
          device_info,
          ip_address,
          last_activity_at,
          expires_at
        FROM sessions
        WHERE user_id = $1
        AND expires_at > NOW()
        ORDER BY last_activity_at DESC
      `,
      values: [userId]
    };

    const result = await executeQuery<Array<{
      session_id: string;
      device_info: Record<string, any>;
      ip_address: string;
      last_activity_at: Date;
      expires_at: Date;
    }>>(query);

    return result.map(row => ({
      sessionId: row.session_id,
      deviceInfo: row.device_info,
      ipAddress: row.ip_address,
      lastActivity: row.last_activity_at,
      expiresAt: row.expires_at
    }));
  }

  /**
   * Get current session count for a user
   */
  private async getUserSessionCount(userId: number): Promise<number> {
    const query = {
      text: `
        SELECT COUNT(*)::text as count
        FROM refresh_tokens
        WHERE user_id = $1
          AND revoked_at IS NULL
          AND expires_at > NOW()
      `,
      values: [userId]
    };

    const result = await executeQuery<{ count: string }[]>(query);
    return parseInt(result[0].count, 10);
  }

  /**
   * Create a new session for a user
   */
  async createSession(userId: number, deviceInfo: Record<string, any>, ipAddress: string): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY);

    const query = {
      text: `
        INSERT INTO sessions (
          user_id, session_id, expires_at, device_info, ip_address
        ) VALUES ($1, $2, $3, $4, $5)
      `,
      values: [userId, sessionId, expiresAt, deviceInfo, ipAddress]
    };

    await executeQuery(query);
    return sessionId;
  }

  /**
   * Update session last activity
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    const query = {
      text: `
        UPDATE sessions 
        SET last_activity_at = NOW()
        WHERE session_id = $1
      `,
      values: [sessionId]
    };

    await executeQuery(query);
  }

  /**
   * Revoke a session
   */
  async revokeSession(sessionId: string): Promise<void> {
    const query = {
      text: `
        DELETE FROM sessions 
        WHERE session_id = $1
      `,
      values: [sessionId]
    };

    await executeQuery(query);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupSessions(): Promise<void> {
    const query = {
      text: `
        DELETE FROM sessions
        WHERE expires_at < NOW()
      `
    };
    await executeQuery(query);
  }
}
