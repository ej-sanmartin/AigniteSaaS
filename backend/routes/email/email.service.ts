import crypto from 'crypto';
import { executeQuery } from '../../db/queryExecutor';
import { sendEmailService } from '../../services/email/send_email';

export class EmailService {
  /**
   * Generates a secure random token and its hash
   * @returns Object containing raw token and its hash
   */
  private generateToken(): { rawToken: string; hashedToken: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, hashedToken };
  }

  /**
   * Creates a verification token for a user
   * @param userId - The ID of the user to create the token for
   * @returns The raw token that should be sent to the user
   */
  async createVerificationToken(userId: number): Promise<string> {
    const { rawToken, hashedToken } = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    // DEBUG: Log token generation
    console.log('DEBUG - Token Generation:');
    console.log('Raw Token:', rawToken);
    console.log('Hashed Token:', hashedToken);
    console.log('User ID:', userId);

    const query = {
      text: `
        UPDATE users 
        SET verification_token = $1,
            verification_token_expires = $2
        WHERE id = $3
        RETURNING email
      `,
      values: [hashedToken, expiresAt, userId]
    };

    const result = await executeQuery<{ email: string }[]>(query);
    
    if (!result.length) {
      throw new Error('User not found');
    }

    // DEBUG: Log before sending email
    console.log('DEBUG - Sending verification email to:', result[0].email);

    // Send verification email
    await sendEmailService.sendVerificationEmail(result[0].email, rawToken);

    return rawToken;
  }

  /**
   * Verifies a user's email using the provided token
   * @param token - The raw token from the verification link
   * @returns true if verification was successful, false otherwise
   */
  async verifyEmail(token: string): Promise<boolean> {
    // DEBUG: Log verification attempt
    console.log('DEBUG - Verification Attempt:');
    console.log('Received Token:', token);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    // DEBUG: Log hashed token
    console.log('Hashed Received Token:', hashedToken);

    const query = {
      text: `
        SELECT verification_token, verification_token_expires 
        FROM users 
        WHERE verification_token = $1
      `,
      values: [hashedToken]
    };

    // DEBUG: Log database query
    const storedTokenResult = await executeQuery<{ verification_token: string, verification_token_expires: Date }[]>(query);
    console.log('DEBUG - Database Query Result:');
    console.log('Stored Token:', storedTokenResult[0]?.verification_token);
    console.log('Token Expires:', storedTokenResult[0]?.verification_token_expires);

    const verificationQuery = {
      text: `
        UPDATE users 
        SET is_verified = true,
            verification_token = NULL,
            verification_token_expires = NULL
        WHERE verification_token = $1
          AND verification_token_expires > $2
        RETURNING id
      `,
      values: [hashedToken, now]
    };

    const result = await executeQuery<{ id: number }[]>(verificationQuery);
    return result.length > 0;
  }
}

// Export singleton instance
export const emailService = new EmailService(); 