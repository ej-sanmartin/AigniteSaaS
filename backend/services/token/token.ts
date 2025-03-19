import { executeQuery } from '../../db/queryExecutor';
import crypto from 'crypto';

export class TokenService {
  /**
   * Generate a new refresh token
   */
  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  /**
   * Create a new refresh token for a user
   */
  async createRefreshToken(userId: number): Promise<string> {
    const token = this.generateRefreshToken();
    const expiresAt = new Date();
    // 7 day expiration
    expiresAt.setDate(expiresAt.getDate() + 7);

    const query = {
      text: `
        INSERT INTO refresh_tokens (user_id, token, expires_at)
        VALUES ($1, $2, $3)
        RETURNING token
      `,
      values: [userId, token, expiresAt]
    };
    const result = await executeQuery<{token: string}>(query);
    return result[0].token;
  }

  /**
   * Verify and get user ID from refresh token
   */
  async verifyRefreshToken(token: string): Promise<number | null> {
    const query = {
      text: `
        SELECT user_id 
        FROM refresh_tokens 
        WHERE token = $1 
          AND expires_at > NOW() 
          AND revoked_at IS NULL
      `,
      values: [token]
    };

    const result = await executeQuery<{user_id: number}>(query);
    return result[0]?.user_id || null;
  }

  /**
   * Revoke a refresh token and optionally replace it
   */
  async revokeRefreshToken(token: string, replacedBy?: string): Promise<void> {
    const query = {
      text: `
        UPDATE refresh_tokens 
        SET revoked_at = NOW(), 
            replaced_by = $2
        WHERE token = $1
      `,
      values: [token, replacedBy]
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
}

export const tokenService = new TokenService(); 