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
import axios from 'axios';
import { userService } from '../users/user.service';
import { authService } from './auth.service';
import { tokenService } from '../../services/token/token';

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
  async (req: express.Request, res: express.Response) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        console.error('No authorization code provided');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
      }
      
      const tokenResponse = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: config.oauth.linkedin.callbackURL,
          client_id: config.oauth.linkedin.clientId || '',
          client_secret: config.oauth.linkedin.clientSecret || ''
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const { access_token } = tokenResponse.data;
      
      if (!access_token) {
        console.error('No access token received');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_access_token`);
      }
      
      const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      
      const userInfo = userInfoResponse.data;
      
      if (!userInfo || !userInfo.sub) {
        console.error('Invalid user info received');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_user_info`);
      }
      
      let user = await userService.getUserByEmail(userInfo.email);
      
      if (!user) {
        await authService.createOAuthUser({
          email: userInfo.email,
          firstName: userInfo.given_name || '',
          lastName: userInfo.family_name || '',
          provider: 'linkedin',
          providerId: userInfo.sub,
          role: 'user'
        });
        user = await userService.getUserByEmail(userInfo.email);
      }
      
      if (!user) {
        console.error('Failed to create or find user');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=user_creation_failed`);
      }
      
      await userService.updateLastLogin(user.id);
      const accessToken = authService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
      const refreshToken = await tokenService.createRefreshToken(user.id);
      
      const { password, ...userWithoutPassword } = user;
      
      const frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        throw new Error('Frontend URL not configured');
      }
      
      const redirectUrl = new URL(`${frontendUrl}/api/auth/callback`);
      redirectUrl.searchParams.set('auth', 'success');
      redirectUrl.searchParams.set('auth_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('user', JSON.stringify(userWithoutPassword));
      redirectUrl.searchParams.set('returnTo', req.query.returnTo as string || '/dashboard');
      
      res.redirect(redirectUrl.toString());
      
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`);
    }
  }
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