import { Request, Response } from 'express';
import { authService } from './auth.service';
import { userService } from '../users/user.service';
import { tokenService } from '../../services/token/token';
import { SessionService } from '../../services/session/session.service';
import { OAuthUser, LinkedInProfile, GitHubProfile, GoogleProfile } from './auth.types';
import crypto from 'crypto';
import { RequestWithSession } from '../../types/express';
import {
  LinkedInTokenResponse,
  LinkedInUserInfo,
  GitHubTokenResponse,
  GitHubUserInfo
} from './auth.types';
import { loginSchema } from './auth.validation';
import bcrypt from 'bcrypt';
import { TokenPayload } from './auth.types';
import axios from 'axios';
import config from '../../config/auth';
import securityConfig from '../../config/security';
import { auditService } from '../../services/audit/audit.service';
import { UserService } from '../users/user.service';
import redirectConfig from '../../config/redirect';

export class AuthController {
  private userService: UserService;
  private sessionService: SessionService;
  private tokenService: typeof tokenService;

  constructor() {
    this.userService = new UserService();
    this.sessionService = new SessionService();
    this.tokenService = tokenService;
  }

  /**
   * Handles OAuth user authentication/creation
   */
  async handleOAuthUser(
    profile: GoogleProfile | LinkedInProfile | GitHubProfile,
    provider: 'google' | 'linkedin' | 'github',
    done: (error: any, user?: OAuthUser | false) => void
  ): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      
      if (!email) {
        done(new Error('No email found in profile'));
        return;
      }
      
      let user = await userService.getUserByEmail(email);

      if (!user) {
        const userData = {
          email,
          firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
          lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
          provider,
          providerId: profile.id || (profile as LinkedInProfile).sub || ''
        };

        try {
          const newUser = await authService.createOAuthUser(userData);
          done(null, newUser);
        } catch (createError) {
          done(createError);
        }
      } else {
        // Transform existing user to match OAuthUser type
        const oauthUser: OAuthUser = {
          ...user,
          provider,
          providerId: profile.id || (profile as LinkedInProfile).sub || ''
        };
        done(null, oauthUser);
      }
    } catch (error) {
      done(error);
    }
  }

  /**
   * Handles OAuth callback
   */
  async handleOAuthCallback(req: Request, res: Response, provider: string): Promise<void> {
    try {
      const user = req.user as OAuthUser;
      if (!user) {
        throw new Error('No user found in request');
      }

      // Log successful OAuth completion
      auditService.logAuthEvent(
        auditService.createAuditEvent(req, {
          type: 'oauth_complete',
          userId: user.id,
          userAgent: req.headers['user-agent'] || 'unknown',
          status: 'success',
          provider,
        })
      );

      // Update last login
      await this.userService.updateLastLogin(user.id);

      // Create session
      const session = await this.sessionService.createSession(user.id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown',
      });

      // Generate access token
      const accessToken = authService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.session_id
      } as TokenPayload & { sessionId: string });

      // Generate refresh token
      const refreshToken = await this.tokenService.createRefreshToken(user.id);

      // Set cookies using security config
      const cookieOptions = {
        httpOnly: securityConfig.cookies.httpOnly,
        secure: securityConfig.cookies.secure,
        sameSite: securityConfig.cookies.sameSite as 'lax' | 'strict' | 'none',
      };

      // Set session cookie
      res.cookie('session_id', session.session_id, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Set access token cookie
      res.cookie('token', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      // Set refresh token cookie
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Get the validated redirect path using existing config
      const returnTo = req.query.returnTo as string;
      const userRole = user.role;
      const redirectPath = redirectConfig.roleBasedRedirects.authenticated[userRole] || 
                          redirectConfig.defaultRedirect;

      // Log the redirect event
      auditService.logAuthEvent(
        auditService.createAuditEvent(req, {
          type: 'oauth_complete',
          userId: user.id,
          userAgent: req.headers['user-agent'] || 'unknown',
          status: 'success',
          provider,
          metadata: {
            requestedPath: returnTo,
            finalPath: redirectPath
          }
        })
      );

      res.redirect(`${frontendUrl}${redirectPath}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      
      // Log failed OAuth completion
      auditService.logAuthEvent(
        auditService.createAuditEvent(req, {
          type: 'oauth_complete',
          userId: req.user?.id || 0,
          userAgent: req.headers['user-agent'] || 'unknown',
          status: 'failure',
          provider,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );

      // Redirect to login with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Authentication failed')}`);
    }
  }

  /**
   * Handles user login with standard email/password.
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await userService.getUserByEmail(validatedData.email);
      
      if (!user) {
        // Use vague message for security
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        validatedData.password,
        user.password
      );

      if (!isPasswordValid) {
        // Use vague message for security
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Update last login timestamp
      await userService.updateLastLogin(user.id);

      // Generate access token using authService
      const accessToken = authService.generateToken({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        token: accessToken,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ 
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token is required' });
        return;
      }

      // Verify refresh token
      const userId = await tokenService.verifyRefreshToken(refreshToken);
      if (!userId) {
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
      }

      // Get user data
      const user = await userService.getUserById(userId);
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }

      // Generate new access token
      const accessToken = authService.generateToken({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });

      // Generate new refresh token
      const newRefreshToken = await tokenService.createRefreshToken(user.id);

      // Get the ID of the new refresh token
      const newTokenId = await tokenService.getTokenId(newRefreshToken);
      if (!newTokenId) {
        throw new Error('Failed to get new token ID');
      }

      // Revoke old refresh token and link it to the new one
      await tokenService.revokeRefreshToken(refreshToken, newTokenId);

      // Set secure cookies
      res.cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        token: accessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).json({ message: 'Failed to refresh token' });
    }
  }

  /**
   * Handles user logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies.session_id;
      const refreshToken = req.cookies.refreshToken;

      if (sessionId) {
        await this.sessionService.revokeSession(sessionId);
      }

      if (refreshToken) {
        await this.tokenService.revokeRefreshToken(refreshToken);
      }

      // Clear all cookies using security config
      const cookieOptions = {
        httpOnly: securityConfig.cookies.httpOnly,
        secure: securityConfig.cookies.secure,
        sameSite: securityConfig.cookies.sameSite as 'lax' | 'strict' | 'none',
      };

      // Clear session cookie
      res.clearCookie('session_id', cookieOptions);
      
      // Clear access token cookie
      res.clearCookie('token', cookieOptions);
      
      // Clear refresh token cookie
      res.clearCookie('refreshToken', cookieOptions);
      
      // Clear CSRF token cookie
      res.clearCookie('csrf_token', cookieOptions);

      res.json({ message: 'Successfully logged out' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Checks authentication status
   */
  async checkAuth(req: RequestWithSession, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies.session_id;
      
      if (!sessionId) {
        res.status(401).end();
        return;
      }

      const session = await this.sessionService.getSession(sessionId);
      
      if (!session) {
        res.status(401).end();
        return;
      }

      // Log successful session validation
      auditService.logAuthEvent(
        auditService.createAuditEvent(req, {
          type: 'session_create',
          userId: session.user_id,
          userAgent: req.headers['user-agent'] || 'unknown',
          status: 'success',
        })
      );

      res.status(200).end();
    } catch (error) {
      console.error('[AUTH-DEBUG] Check auth error:', error);
      res.status(500).end();
    }
  }

  /**
   * Handles LinkedIn OAuth callback. It's more complex than the other OAuth
   * callbacks because LinkedIn requires a second request to get the user info.
   */
  async handleLinkedInOAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      
      if (!code) {
        console.error('No authorization code provided');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
      }
      
      const tokenResponse = await axios.post<LinkedInTokenResponse>(
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
      
      const userInfoResponse = await axios.get<LinkedInUserInfo>('https://api.linkedin.com/v2/userinfo', {
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
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
      const refreshToken = await tokenService.createRefreshToken(user.id);
      
      const frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        throw new Error('Frontend URL not configured');
      }
      
      // Create session
      const session = await this.sessionService.createSession(user.id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown'
      });

      // Set secure cookies
      res.cookie('session_id', session.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to frontend with returnTo
      const returnTo = req.query.returnTo as string || '/dashboard';
      res.redirect(`${frontendUrl}${returnTo}`);
      
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  /**
   * Handles GitHub OAuth callback. It's more complex than the other OAuth
   * callbacks because GitHub requires a second request to get the user info.
   */
  async handleGitHubOAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      
      if (!code) {
        console.error('No authorization code provided');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
      }
      
      const tokenResponse = await axios.post<GitHubTokenResponse>(
        'https://github.com/login/oauth/access_token',
        new URLSearchParams({
          client_id: config.oauth.github.clientId || '',
          client_secret: config.oauth.github.clientSecret || '',
          code: code as string,
          redirect_uri: config.oauth.github.callbackURL
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
      
      const userInfoResponse = await axios.get<GitHubUserInfo>('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      
      const userInfo = userInfoResponse.data;
      
      if (!userInfo || !userInfo.id) {
        console.error('Invalid user info received');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_user_info`);
      }
      
      let user = await userService.getUserByEmail(userInfo.email);
      
      if (!user) {
        await authService.createOAuthUser({
          email: userInfo.email,
          firstName: userInfo.name?.split(' ')[0] || userInfo.login,
          lastName: userInfo.name?.split(' ').slice(1).join(' ') || '',
          provider: 'github',
          providerId: userInfo.id.toString(),
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
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
      const refreshToken = await tokenService.createRefreshToken(user.id);
      
      const frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        throw new Error('Frontend URL not configured');
      }
      
      // Create session
      const session = await this.sessionService.createSession(user.id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown'
      });

      // Set secure cookies
      res.cookie('session_id', session.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.cookie('token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to frontend with returnTo
      const returnTo = req.query.returnTo as string || '/dashboard';
      res.redirect(`${frontendUrl}${returnTo}`);
      
    } catch (error) {
      console.error('GitHub callback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`);
    }
  }

  /**
   * Refreshes the session
   */
  async refreshSession(req: RequestWithSession, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies.session_id;
      
      if (!sessionId) {
        res.status(401).json({ error: 'No session found' });
        return;
      }

      const session = await this.sessionService.getSession(sessionId);
      
      if (!session) {
        res.status(401).json({ error: 'Invalid or expired session' });
        return;
      }

      // Create a new session
      const newSession = await this.sessionService.createSession(session.user_id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown'
      });

      // Set new session cookie
      res.cookie('session_id', newSession.session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Set new CSRF token
      const csrfToken = crypto.randomBytes(32).toString('hex');
      res.cookie('csrf_token', csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Store CSRF token in session
      await this.sessionService.updateSession(newSession.session_id, { csrfToken });

      // Revoke old session
      await this.sessionService.revokeSession(sessionId);

      res.json({ success: true });
    } catch (error) {
      console.error('[AUTH-DEBUG] Session refresh error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const authController = new AuthController();