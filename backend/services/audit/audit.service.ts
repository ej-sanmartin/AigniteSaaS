import crypto from 'crypto';
import securityConfig from '../../config/security';
import { Request } from 'express';

export type AuditEventType = 
  | 'oauth_start' 
  | 'oauth_complete' 
  | 'token_refresh' 
  | 'session_create' 
  | 'session_destroy'
  | 'login'
  | 'logout'
  | 'token_rotation';

export type AuditEventStatus = 'success' | 'failure';

export interface AuditEvent {
  type: AuditEventType;
  userId: number;
  ip: string;
  userAgent: string;
  status: AuditEventStatus;
  provider?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  private static instance: AuditService;
  private readonly isDevelopment: boolean;
  private readonly isEnabled: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isEnabled = process.env.AUDIT_LOGGING_ENABLED !== 'false';
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Extracts IP address from request in an environment-aware way
   * @param req Express request object
   * @returns IP address string
   * @throws Error in production if IP cannot be determined
   */
  private getIpFromRequest(req: Request): string {
    // Try different methods to get IP, in order of reliability
    const ip = req.ip || 
               req.headers['x-forwarded-for']?.toString() || 
               req.socket.remoteAddress;

    if (!ip) {
      if (this.isDevelopment) {
        return '127.0.0.1';
      }
      throw new Error('Could not determine IP address for audit logging');
    }

    // If x-forwarded-for contains multiple IPs, take the first one
    return ip.split(',')[0].trim();
  }

  /**
   * Creates an audit event with proper IP detection
   * @param req Express request object
   * @param event Partial audit event without IP
   * @returns Complete audit event
   */
  public createAuditEvent(req: Request, event: Omit<AuditEvent, 'ip'>): AuditEvent {
    return {
      ...event,
      ip: this.getIpFromRequest(req),
    };
  }

  /**
   * Logs an authentication event with environment-aware handling
   * @param event The audit event to log
   */
  public logAuthEvent(event: AuditEvent): void {
    if (!this.isEnabled) {
      return;
    }

    const timestamp = new Date().toISOString();
    const hashedUserId = this.hashUserId(event.userId);
    
    const logEntry = {
      timestamp,
      eventType: event.type,
      userId: hashedUserId,
      ip: event.ip,
      userAgent: event.userAgent,
      status: event.status,
      provider: event.provider,
      error: event.error,
      ...(this.isDevelopment && securityConfig.logging.includeUserInfo
        ? { metadata: event.metadata }
        : {}),
    };

    if (this.isDevelopment) {
      // In development, log to console with proper formatting
      console.log('[AUDIT]', JSON.stringify(logEntry, null, 2));
    } else {
      // In production, prepare for database storage
      // TODO: Implement database storage
      // For now, we just validate the log entry is properly formatted
      this.validateLogEntry(logEntry);
    }
  }

  /**
   * Validates a log entry before storage
   * @param logEntry The log entry to validate
   */
  private validateLogEntry(logEntry: any): void {
    // Ensure no sensitive data is included in production
    if (!this.isDevelopment && logEntry.metadata) {
      throw new Error('Metadata should not be included in production logs');
    }
  }

  /**
   * Hashes a user ID for audit logging
   * @param userId The user ID to hash
   * @returns Hashed user ID
   */
  private hashUserId(userId: number): string {
    // Use a consistent salt for development to make debugging easier
    const salt = this.isDevelopment ? 'dev-salt' : process.env.USER_ID_HASH_SALT || '';
    return crypto
      .createHash('sha256')
      .update(userId.toString() + salt)
      .digest('hex');
  }
}

export const auditService = AuditService.getInstance(); 