import formData from 'form-data';
import Mailgun from 'mailgun.js';
import emailConfig from '../../config/email';

interface SubscriptionDetails {
  planName: string;
  startDate: Date;
  endDate: Date;
  amount: string;
  currency: string;
}

export class SendEmailService {
  private mailgun: any;
  private readonly fromEmail: string;
  private readonly domain: string;

  constructor() {
    const { mailgunConfig } = emailConfig;
    this.fromEmail = mailgunConfig.fromEmail || "";
    this.domain = mailgunConfig.domain || "";
    
    const mailgun = new Mailgun(formData);
    this.mailgun = mailgun.client({
      username: 'api',
      key: mailgunConfig.apiKey || "",
    });
  }

  /**
   * Sends a verification email to the user
   * @param to - Recipient email address
   * @param token - Raw verification token
   */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL;
    if (!baseUrl) {
      throw new Error('FRONTEND_URL environment variable is not set');
    }

    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
    
    await this.mailgun.messages.create(this.domain, {
      from: `${emailConfig.mailgunConfig.fromName} <${this.fromEmail}>`,
      to,
      subject: 'Verify Your Email',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <p>
          <a href="${verificationUrl}">Verify Email</a>
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    });
  }

  /**
   * Sends a password reset email to the user
   * @param to - Recipient email address
   * @param token - Raw reset token
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL;
    if (!baseUrl) {
      throw new Error('FRONTEND_URL environment variable is not set');
    }

    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    await this.mailgun.messages.create(this.domain, {
      from: `${emailConfig.mailgunConfig.fromName} <${this.fromEmail}>`,
      to,
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p>
          <a href="${resetUrl}">Reset Password</a>
        </p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    });
  }

  /**
   * Sends a subscription confirmation email
   * @param to - Recipient email address
   * @param details - Subscription details
   */
  async sendSubscriptionConfirmation(
    to: string, 
    details: SubscriptionDetails
  ): Promise<void> {
    const formattedStartDate = details.startDate.toLocaleDateString();
    const formattedEndDate = details.endDate.toLocaleDateString();

    await this.mailgun.messages.create(this.domain, {
      from: `${emailConfig.mailgunConfig.fromName} <${this.fromEmail}>`,
      to,
      subject: 'Subscription Confirmation',
      html: `
        <h1>Subscription Confirmed</h1>
        <p>Thank you for your subscription! Here are your subscription details:</p>
        <ul>
          <li>Plan: ${details.planName}</li>
          <li>Start Date: ${formattedStartDate}</li>
          <li>End Date: ${formattedEndDate}</li>
          <li>Amount: ${details.amount} ${details.currency}</li>
        </ul>
        <p>
          If you have any questions about your subscription, 
          please contact our support team.
        </p>
      `
    });
  }
}

// Export singleton instance
export const sendEmailService = new SendEmailService(); 