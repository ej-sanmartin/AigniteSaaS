import express from 'express';
import config from '../../config/auth';
import { authController } from './auth.controller';
import { authLimiter, tokenLimiter } from '../../middleware/rateLimiter';
import { redirectValidation } from '../../middleware/redirectValidation';
import verifyEmailRouter from '../verify_email';
import { Router, Request, Response } from 'express';
import { csrfProtection } from '../../middleware/csrf';
import { verifySession } from '../../middleware/auth';

const router = Router();

// Routes
router.get('/google', 
  (_req: express.Request, res: express.Response, next: express.NextFunction): void => {
    if (!config.oauth.google.clientId) {
      res.status(503).json({
        message: 'Google authentication is not configured',
        code: 'GOOGLE_AUTH_NOT_CONFIGURED'
      });
      return;
    }
    next();
  },
  authLimiter,
  redirectValidation,
  (req: Request, res: Response) => authController.initiateOAuth(req, res, 'google')
);

router.get(
  '/google/callback',
  authLimiter,
  redirectValidation,
  csrfProtection,
  (req: Request, res: Response) => authController.handleGoogleOAuthCallback(req, res)
);

router.get('/linkedin',
  (_req: express.Request, res: express.Response, next: express.NextFunction): void => {
    if (!config.oauth.linkedin.clientId) {
      res.status(503).json({
        message: 'LinkedIn authentication is not configured',
        code: 'LINKEDIN_AUTH_NOT_CONFIGURED'
      });
      return;
    }
    next();
  },
  authLimiter,
  redirectValidation,
  (req: Request, res: Response) => authController.initiateOAuth(req, res, 'linkedin')
);

router.get('/linkedin/callback',
  authLimiter,
  redirectValidation,
  csrfProtection,
  (req: Request, res: Response) => authController.handleLinkedInOAuthCallback(req, res)
);

router.get('/github',
  (_req: express.Request, res: express.Response, next: express.NextFunction): void => {
    if (!config.oauth.github.clientId) {
      res.status(503).json({
        message: 'GitHub authentication is not configured',
        code: 'GITHUB_AUTH_NOT_CONFIGURED'
      });
      return;
    }
    next();
  },
  authLimiter,
  redirectValidation,
  (req: Request, res: Response) => authController.initiateOAuth(req, res, 'github')
);

router.get(
  '/github/callback',
  authLimiter,
  redirectValidation,
  csrfProtection,
  (req: Request, res: Response) => authController.handleGitHubOAuthCallback(req, res)
);

router.post('/login', 
  authLimiter,
  (req, res) => authController.login(req, res)
);

router.post('/logout', 
  (req, res) => authController.logout(req, res)
);

router.get('/check',
  authLimiter,
  verifySession,
  (req, res) => authController.checkAuth(req, res)
);

router.post('/refresh', 
  tokenLimiter, 
  csrfProtection, 
  (req, res) => authController.refreshToken(req, res)
);

router.use('/verify', verifyEmailRouter);

export default router;