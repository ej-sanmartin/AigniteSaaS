import crypto from 'crypto';
import { QueryConfig } from 'pg';
import { executeQuery } from '../../db/queryExecutor';
import { emailService } from '../../services/email/email';
import {
  EmailVerificationResult,
  VerificationResult
} from './verify_email.types';

export class VerifyEmailService {
  /**
   * Generates a random verification token
   * @returns Hex string token
   */
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Updates user with new verification token
   * @param userId - User ID to update
   * @returns User email
   */
  async createVerificationToken(userId: number): Promise<string> {
    const token = this.generateVerificationToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const query: QueryConfig = {
      text: `
        UPDATE users 
        SET 
          verification_token = $1,
          verification_token_expires = $2
        WHERE id = $3
        RETURNING email
      `,
      values: [token, expires, userId]
    };

    const result = await executeQuery<EmailVerificationResult[]>(query);
    
    if (!result.length) {
      throw new Error('User not found');
    }

    await emailService.sendVerificationEmail(result[0].email, token);
    return result[0].email;
  }

  /**
   * Verifies email using token
   * @param token - Verification token
   * @returns User ID if verified
   */
  async verifyEmail(token: string): Promise<number> {
    const query: QueryConfig = {
      text: `
        UPDATE users 
        SET 
          is_verified = true,
          verification_token = NULL,
          verification_token_expires = NULL
        WHERE 
          verification_token = $1 
          AND verification_token_expires > NOW()
          AND is_verified = false
        RETURNING id
      `,
      values: [token]
    };

    const result = await executeQuery<VerificationResult[]>(query);

    if (!result.length) {
      throw new Error('Invalid or expired verification token');
    }

    return result[0].id;
  }
}

export const verifyEmailService = new VerifyEmailService(); 