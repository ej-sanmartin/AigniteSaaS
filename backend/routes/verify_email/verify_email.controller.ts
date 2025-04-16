import { Request, Response } from 'express';
import { verifyEmailService } from './verify_email.service';

export class VerifyEmailController {
  /**
   * Handles email verification
   * @param req - Express request object
   * @param res - Express response object
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.redirect('/login?error=invalid_token');
      return;
    }

    try {
      const success = await verifyEmailService.verifyEmail(token);
      
      if (success) {
        res.redirect('/login?verified=true');
      } else {
        res.redirect('/login?error=invalid_or_expired_token');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      res.redirect('/login?error=verification_failed');
    }
  }
}

export const verifyEmailController = new VerifyEmailController(); 