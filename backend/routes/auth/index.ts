import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as OpenIDConnectStrategy, Profile as OpenIDProfile } from 'passport-openidconnect';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import config from '../../config/auth';
import { authController } from './auth.controller';
import { authLimiter } from '../../middleware/rateLimiter';
import verifyEmailRouter from '../verify_email';
import { Router } from 'express';
import { LinkedInProfile } from './auth.types';

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
    passport.use(new OpenIDConnectStrategy(
      {
      issuer: 'https://www.linkedin.com',
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      userInfoURL: 'https://api.linkedin.com/v2/userinfo',
      clientID: config.oauth.linkedin.clientId,
      clientSecret: config.oauth.linkedin.clientSecret,
      callbackURL: config.oauth.linkedin.callbackURL,
        scope: ['openid', 'profile', 'email'],
        passReqToCallback: true,
        proxy: true,
        skipUserProfile: false
      },
      async (_issuer: string, profile: OpenIDProfile, done: (error: any, user?: any) => void) => {
        try {
          if (!profile || !profile.id) {
            return done(new Error('LinkedIn returned empty or invalid profile'));
          }

          const transformedProfile: LinkedInProfile = {
            id: profile.id,
            emails: profile.emails || [],
            _json: {
              firstName: profile.name?.givenName || '',
              lastName: profile.name?.familyName || '',
              email: profile.emails?.[0]?.value || ''
            },
            displayName: profile.displayName || '',
            name: profile.name || { givenName: '', familyName: '' },
            photos: profile.photos || [],
            provider: 'linkedin',
            sub: profile.id,
            email: profile.emails?.[0]?.value || '',
            given_name: profile.name?.givenName || '',
            family_name: profile.name?.familyName || '',
            picture: profile.photos?.[0]?.value || ''
          };

          if (!transformedProfile.email) {
            return done(new Error('LinkedIn profile missing email'));
          }

          authController.handleOAuthUser(transformedProfile, 'linkedin', done);
        } catch (error) {
          done(error);
        }
      }
    ));
  } else {
    console.warn('LinkedIn OAuth credentials not configured');
  }

  if (
    config.oauth.github.clientId &&
    config.oauth.github.clientSecret
  ) {
    passport.use(new GitHubStrategy({
      clientID: config.oauth.github.clientId,
      clientSecret: config.oauth.github.clientSecret,
      callbackURL: config.oauth.github.callbackURL,
      scope: ['user:email']
    }, async (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: (error: any, user?: any) => void) => {
      try {
        if (!profile || !profile.id) {
          return done(new Error('GitHub returned empty or invalid profile'));
        }

        const transformedProfile = {
          id: profile.id,
          emails: profile.emails || [],
          _json: {
            firstName: profile.displayName?.split(' ')[0] || '',
            lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
            email: profile.emails?.[0]?.value || ''
          },
          displayName: profile.displayName || '',
          name: {
            givenName: profile.displayName?.split(' ')[0] || '',
            familyName: profile.displayName?.split(' ').slice(1).join(' ') || ''
          },
          photos: profile.photos || [],
          provider: 'github',
          sub: profile.id,
          email: profile.emails?.[0]?.value || '',
          given_name: profile.displayName?.split(' ')[0] || '',
          family_name: profile.displayName?.split(' ').slice(1).join(' ') || '',
          picture: profile.photos?.[0]?.value || ''
        };

        if (!transformedProfile.email) {
          return done(new Error('GitHub profile missing email'));
        }

        authController.handleOAuthUser(transformedProfile, 'github', done);
      } catch (error) {
        done(error);
      }
    }));
  } else {
    console.warn('GitHub OAuth credentials not configured');
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
  (req, res) => authController.handleOAuthCallback(req, res, 'google')
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
  passport.authenticate('openidconnect', {
    session: false,
    scope: ['openid', 'profile', 'email']
  } as any)
);

router.get('/linkedin/callback',
  authLimiter,
  (req, res) => authController.handleLinkedInOAuthCallback(req, res)
);

// Add GitHub routes
router.get('/github',
  (_req, res: express.Response, next: express.NextFunction): void => {
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
  passport.authenticate('github', {
    scope: ['user:email'],
    session: false
  })
);

router.get('/github/callback',
  authLimiter,
  passport.authenticate('github', {
    session: false,
    failureRedirect: '/login'
  }),
  (req, res) => authController.handleOAuthCallback(req, res, 'github')
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