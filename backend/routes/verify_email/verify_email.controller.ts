import { Request, Response } from 'express';
import { verifyEmailService } from './verify_email.service';
import { verificationTokenSchema } from './verify_email.validation';
import { TokenPayload } from '../../types/auth.types';

export class VerifyEmailController {
  /**
   * Handles sending verification email
   */
  async handleVerificationEmail(
    req: Request,
    res: Response
  ): Promise<void> {
    const user = req.user as TokenPayload;
    const userId = user?.id;
    
    if (!userId) {
      res.status(401).json({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    try {
      await verifyEmailService.createVerificationToken(userId);

      res.json({ 
        message: 'Verification email sent',
        code: 'VERIFICATION_EMAIL_SENT'
      });
    } catch (error) {
      console.error('Error sending verification email:', error);
      res.status(500).json({
        message: 'Error sending verification email',
        code: 'VERIFICATION_EMAIL_ERROR'
      });
    }
  }

  /**
   * Handles email verification with token
   */
  async handleVerifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = verificationTokenSchema.parse(req.params);
      await verifyEmailService.verifyEmail(token);

      res.json({
        message: 'Email verified successfully',
        code: 'EMAIL_VERIFIED'
      });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(400).json({
        message: 'Invalid or expired verification token',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }
  }
}

export const verifyEmailController = new VerifyEmailController(); 