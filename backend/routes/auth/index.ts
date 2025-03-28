import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import config from '../../config/auth';
import { authController } from './auth.controller';
import { authLimiter } from '../../middleware/rateLimiter';
import verifyEmailRouter from '../verify_email';
import { Router } from 'express';

const router = Router();

// Setup Passport strategies
const setupPassportStrategies = (): void => {
  if (
    config.oauth.google.clientId && 
    config.oauth.google.clientSecret
  ) {
    passport.use(new GoogleStrategy({
      clientID: config.oauth.google.clientId,
      clientSecret: config.oauth.google.clientSecret,
      callbackURL: config.oauth.google.callbackURL,
    }, async (_accessToken, _refreshToken, profile, done) => {
      authController.handleOAuthUser(profile, 'google', done);
    }));
  } else {
    console.warn('Google OAuth credentials not configured');
  }

  if (
    config.oauth.linkedin.clientId &&
    config.oauth.linkedin.clientSecret
  ) {
    passport.use(new LinkedInStrategy({
      clientID: config.oauth.linkedin.clientId,
      clientSecret: config.oauth.linkedin.clientSecret,
      callbackURL: config.oauth.linkedin.callbackURL,
      scope: ['r_emailaddress', 'r_liteprofile']
    }, async (_accessToken, _refreshToken, profile, done) => {
      authController.handleOAuthUser(profile, 'linkedin', done);
    }));
  } else {
    console.warn('LinkedIn OAuth credentials not configured');
  }
};

setupPassportStrategies();

// Routes
router.get('/google', 
  (_req, res: express.Response, next: express.NextFunction): void => {
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
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  authLimiter,
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: '/login' 
  }),
  authController.handleOAuthCallback
);

router.get('/linkedin',
  (_req, res: express.Response, next: express.NextFunction): void => {
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
  passport.authenticate('linkedin')
);

router.get('/linkedin/callback',
  authLimiter,
  passport.authenticate('linkedin', { 
    session: false, 
    failureRedirect: '/login' 
  }),
  authController.handleOAuthCallback
);

router.post('/login', 
  authLimiter,
  (req, res) => authController.login(req, res)
);

router.post('/logout', 
  (req, res) => authController.logout(req, res)
);

router.get('/check',
  (req, res) => authController.checkAuth(req, res)
);

router.use('/verify', verifyEmailRouter);

export default router;