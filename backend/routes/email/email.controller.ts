import { Request, Response } from 'express';
import { emailService } from './email.service';

export class EmailController {
  /**
   * Handles email verification
   * @param req - Express request object
   * @param res - Express response object
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    try {
      const success = await emailService.verifyEmail(token);
      
      if (success) {
        res.json({
          message: 'Email verified successfully',
          code: 'VERIFICATION_SUCCESS'
        });
      } else {
        res.status(400).json({
          message: 'Invalid or expired verification token',
          code: 'INVALID_OR_EXPIRED_TOKEN'
        });
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({
        message: 'Failed to verify email',
        code: 'VERIFICATION_FAILED'
      });
    }
  }

  /**
   * Handles resending verification email
   * @param req - Express request object
   * @param res - Express response object
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    const userId = (req.user as any)?.id;

    if (!userId) {
      res.status(401).json({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    try {
      await emailService.createVerificationToken(userId);
      res.json({
        message: 'Verification email sent successfully',
        code: 'VERIFICATION_EMAIL_SENT'
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      res.status(500).json({
        message: 'Failed to send verification email',
        code: 'VERIFICATION_EMAIL_FAILED'
      });
    }
  }
}

export const emailController = new EmailController(); 