import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import securityConfig from '../config/security';

const CSRF_TOKEN_COOKIE = 'csrf_token';
const CSRF_HEADER = 'X-CSRF-Token';

export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Generate CSRF token if not exists (for both GET and non-GET requests)
  if (!req.cookies[CSRF_TOKEN_COOKIE]) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_TOKEN_COOKIE, token, {
      ...securityConfig.cookies,
      httpOnly: false, // Frontend needs to read this
      path: '/'
    });
  }

  // Only verify CSRF token for non-GET requests
  if (req.method !== 'GET') {
    const token = req.cookies[CSRF_TOKEN_COOKIE];
    const headerToken = req.headers[CSRF_HEADER.toLowerCase()];

    if (!token || !headerToken || token !== headerToken) {
      res.status(403).json({
        error: 'Invalid CSRF token',
        code: 'INVALID_CSRF_TOKEN'
      });
      return;
    }
  }

  next();
}; 