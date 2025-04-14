import { Request, Response } from 'express';
import { authService } from './auth.service';
import { userService } from '../users/user.service';
import { TokenService } from '../../services/token/token';
import { SessionService } from '../../services/session/session.service';
import crypto from 'crypto';
import {
  OAuthUser,
  LinkedInProfile,
  GitHubProfile,
  GoogleProfile,
  LinkedInTokenResponse,
  LinkedInUserInfo,
  GitHubTokenResponse,
  GitHubUserInfo,
  GoogleTokenResponse,
  GoogleUserInfo,
  GitHubEmail
} from './auth.types';
import { loginSchema } from './auth.validation';
import bcrypt from 'bcrypt';
import axios from 'axios';
import config from '../../config/auth';
import securityConfig from '../../config/security';
import { auditService } from '../../services/audit/audit.service';
import { UserService } from '../users/user.service';
import redirectConfig from '../../config/redirect';
import { safeOAuthAuditLog } from '../../services/audit/audit.service';
import { User, UserRole } from '../users/user.types';

export class AuthController {
  private userService: UserService;
  private sessionService: SessionService;
  private tokenService: TokenService;

  constructor() {
    this.userService = new UserService();
    this.sessionService = new SessionService();
    this.tokenService = new TokenService();
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
          providerId: profile.id || (profile as LinkedInProfile).sub || '',
        };

        try {
          const newUser = await authService.createOAuthUser(userData);
          
          // Store OAuth avatar if available, but don't block if it fails
          if (profile.photos?.[0]?.value) {
            try {
              await userService.storeOAuthAvatar(newUser.id, profile.photos[0].value);
              safeOAuthAuditLog(
                {
                  type: 'oauth_avatar_upload',
                  userId: newUser.id,
                  status: 'success',
                  userAgent: 'OAuth Provider'
                },
                provider
              );
            } catch (avatarError) {
              // Log the error but don't throw it - we don't want to block the OAuth flow
              console.error('Failed to store OAuth avatar:', avatarError);
              safeOAuthAuditLog(
                {
                  type: 'oauth_avatar_upload',
                  userId: newUser.id,
                  status: 'failure',
                  error: avatarError instanceof Error ? avatarError.message : 'Unknown error',
                  userAgent: 'OAuth Provider'
                },
                provider
              );
            }
          }
          
          done(null, newUser);
        } catch (createError) {
          done(createError);
        }
      } else {
        // Transform existing user to match OAuthUser type
        const oauthUser: OAuthUser = {
          ...user,
          provider,
          providerId: profile.id || (profile as LinkedInProfile).sub || '',
          isVerified: user.isVerified || false,
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

      // Clear the connect.sid cookie
      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });

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

      // Revoke OAuth state session after successful user session creation
      const state = req.query.state as string;
      if (state) {
        const oauthSession = await this.sessionService.getOAuthStateSession(state);
        if (oauthSession) {
          await this.sessionService.revokeOAuthStateSession(oauthSession.session_id);
        }
      }

      // Generate access token
      const accessToken = authService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        sessionId: session.session_id
      } as User & { sessionId: string });

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
      const redirectPath = 
        redirectConfig.roleBasedRedirects.authenticated[userRole as UserRole] ??
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
      // Log failed OAuth completion
      auditService.logAuthEvent(
        auditService.createAuditEvent(req, {
          type: 'oauth_complete',
          userId: (req.user as OAuthUser)?.id,
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
      
      // If user doesn't exist, yet.
      if (!user) {
        // Use vague message for security
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // If user created account through OAuth signup processes and they haven't
      // set a password, they can't login with email/password.
      if (user.oauthProvider !== 'local' && !user.password) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        validatedData.password,
        user.password as string
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
      const userId = await this.tokenService.verifyRefreshToken(refreshToken);
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
      const newRefreshToken = await this.tokenService.createRefreshToken(user.id);

      // Get the ID of the new refresh token
      const newTokenId = await this.tokenService.getTokenId(newRefreshToken);
      if (!newTokenId) {
        throw new Error('Failed to get new token ID');
      }

      // Revoke old refresh token and link it to the new one
      await this.tokenService.revokeRefreshToken(refreshToken, newTokenId);

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
  async checkAuth(req: Request, res: Response): Promise<void> {
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
      res.status(500).end();
    }
  }

  /**
   * Handles LinkedIn OAuth callback. It's more complex than the other OAuth
   * callbacks because LinkedIn requires a second request to get the user info.
   */
  async handleLinkedInOAuthCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_params`);
    }

    const stateSession = await this.sessionService.getOAuthStateSession(state as string);
    if (!stateSession) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }

    // Clear the connect.sid cookie
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    const returnTo = stateSession.metadata?.returnTo || '/dashboard';

    // Get access token
    const tokenResponse = await axios.post<LinkedInTokenResponse>(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: config.oauth.linkedin.callbackURL,
        client_id: config.oauth.linkedin.clientId || '',
        client_secret: config.oauth.linkedin.clientSecret || ''
      }).toString()
    );
    
    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_access_token`);
    }
    
    // Get user info
    const userInfoResponse = await axios.get<LinkedInUserInfo>('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    // Create or update user
    const user = await authService.createOAuthUser({
      email: userInfoResponse.data.email,
      firstName: userInfoResponse.data.given_name,
      lastName: userInfoResponse.data.family_name,
      provider: 'linkedin',
      providerId: userInfoResponse.data.sub,
      role: 'user'
    });

    // Store OAuth avatar if available, but don't block if it fails
    if (userInfoResponse.data.picture) {
      try {
        await userService.storeOAuthAvatar(user.id, userInfoResponse.data.picture);
        safeOAuthAuditLog(
          {
            type: 'oauth_avatar_upload',
            userId: user.id,
            status: 'success',
            userAgent: 'LinkedIn OAuth'
          },
          'linkedin'
        );
      } catch (avatarError) {
        // Log the error but don't throw it - we don't want to block the OAuth flow
        console.error('Failed to store LinkedIn OAuth avatar:', avatarError);
        safeOAuthAuditLog(
          {
            type: 'oauth_avatar_upload',
            userId: user.id,
            status: 'failure',
            error: avatarError instanceof Error ? avatarError.message : 'Unknown error',
            userAgent: 'LinkedIn OAuth'
          },
          'linkedin'
        );
      }
    }

    // Generate access token
    const accessToken = authService.generateToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });

    // Create refresh token
    const refreshToken = await this.tokenService.createRefreshToken(user.id);

    // Create session
    const session = await this.sessionService.createSession(user.id, {
      ip: stateSession.ip_address,
      userAgent: stateSession.device_info?.userAgent || 'unknown'
    });

    // Revoke OAuth state session
    await this.sessionService.revokeOAuthStateSession(stateSession.session_id);

    // Set session cookie
    res.cookie('session_id', session.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Set access token cookie
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.redirect(`${process.env.FRONTEND_URL}${returnTo}`);
  }

  /**
   * Handles GitHub OAuth callback
   */
  async handleGitHubOAuthCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_params`);
    }

    const stateSession = await this.sessionService.getOAuthStateSession(state as string);
    if (!stateSession) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }

    // Clear the connect.sid cookie
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    const returnTo = stateSession.metadata?.returnTo;

    try {
      // Get access token
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
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }
      );
      
      const { access_token } = tokenResponse.data;
      
      if (!access_token) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_access_token`);
      }
      
      // Get user info
      const userInfoResponse = await axios.get<GitHubUserInfo>('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      });

      // Get user emails
      const emailsResponse = await axios.get<GitHubEmail[]>('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Accept': 'application/json'
        }
      });

      // Find primary email
      const primaryEmail = emailsResponse.data.find(email => email.primary)?.email;
      if (!primaryEmail) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_primary_email`);
      }

      // Create or update user
      const user = await authService.createOAuthUser({
        email: primaryEmail,
        firstName: userInfoResponse.data.name?.split(' ')[0] || userInfoResponse.data.login,
        lastName: userInfoResponse.data.name?.split(' ').slice(1).join(' ') || '',
        provider: 'github',
        providerId: userInfoResponse.data.id.toString(),
        role: 'user'
      });

      // Store OAuth avatar if available, but don't block if it fails
      if (userInfoResponse.data.avatar_url) {
        try {
          await userService.storeOAuthAvatar(user.id, userInfoResponse.data.avatar_url);
          safeOAuthAuditLog(
            {
              type: 'oauth_avatar_upload',
              userId: user.id,
              status: 'success',
              userAgent: 'GitHub OAuth'
            },
            'github'
          );
        } catch (avatarError) {
          console.error('Failed to store GitHub OAuth avatar:', avatarError);
          safeOAuthAuditLog(
            {
              type: 'oauth_avatar_upload',
              userId: user.id,
              status: 'failure',
              error: avatarError instanceof Error ? avatarError.message : 'Unknown error',
              userAgent: 'GitHub OAuth'
            },
            'github'
          );
        }
      }

      // Create session
      const session = await this.sessionService.createSession(user.id, {
        ip: stateSession.ip_address,
        userAgent: stateSession.device_info?.userAgent || 'unknown'
      });

      // Generate access token for the user for the frontend
      const accessToken = authService.generateToken({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sessionId: session.session_id
      } as User & { sessionId: string });

      // Generate refresh token
      const refreshToken = await this.tokenService.createRefreshToken(user.id);

      // Revoke OAuth state session
      await this.sessionService.revokeOAuthStateSession(stateSession.session_id);

      // Set secure cookies
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

      return res.redirect(`${process.env.FRONTEND_URL}${returnTo}`);
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Authentication failed')}`);
    }
  }

  /**
   * Refreshes the session
   */
  async refreshSession(req: Request, res: Response): Promise<void> {
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
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Initiates OAuth flow by creating a state session and redirecting to provider
   */
  async initiateOAuth(req: Request, res: Response, provider: 'google' | 'linkedin' | 'github'): Promise<void> {
    try {
      const state = crypto.randomBytes(32).toString('hex');
      const returnTo = req.query.returnTo as string;

      // Type assertion needed for OAuth state in express-session (standard OAuth flow requirement)
      (req.session as any).state = state;

      // Create OAuth state session
      await this.sessionService.createOAuthStateSession({
        type: 'oauth_state',
        provider,
        state,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { returnTo }
      });

      // Get OAuth provider URL
      let authUrl: string;
      switch (provider) {
        case 'linkedin':
          authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
            `response_type=code&` +
            `client_id=${config.oauth.linkedin.clientId}&` +
            `redirect_uri=${encodeURIComponent(config.oauth.linkedin.callbackURL)}&` +
            `state=${state}&` +
            `scope=openid%20profile%20email`;
          break;
        case 'github':
          authUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${config.oauth.github.clientId}&` +
            `redirect_uri=${encodeURIComponent(config.oauth.github.callbackURL)}&` +
            `state=${state}&` +
            `scope=read:user%20user:email`;
          break;
        case 'google':
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `response_type=code&` +
            `client_id=${config.oauth.google.clientId}&` +
            `redirect_uri=${encodeURIComponent(config.oauth.google.callbackURL)}&` +
            `state=${state}&` +
            `scope=openid%20profile%20email`;
          break;
      }

      // Log OAuth initiation
      safeOAuthAuditLog(
        {
          type: 'oauth_login',
          userAgent: req.headers['user-agent'] || 'unknown',
          status: 'success',
          metadata: { returnTo }
        },
        provider
      );

      res.redirect(authUrl);
    } catch (error) {
      console.error('OAuth initiation error:', error);
      
      // Log OAuth initiation failure
      safeOAuthAuditLog(
        {
          type: 'oauth_login',
          userAgent: req.headers['user-agent'] || 'unknown',
          status: 'failure',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        provider
      );

      res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Failed to initiate OAuth')}`);
    }
  }

  /**
   * Handles Google OAuth callback
   */
  async handleGoogleOAuthCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code;
    const state = req.query.state;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=missing_params`);
    }

    const stateSession = await this.sessionService.getOAuthStateSession(state as string);
    if (!stateSession) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=invalid_state`);
    }

    // Clear the connect.sid cookie
    res.clearCookie('connect.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    const returnTo = stateSession.metadata?.returnTo || '/dashboard';

    try {
      // Get access token for Google API
      const { data: tokenData } = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: config.oauth.google.callbackURL,
          client_id: config.oauth.google.clientId || '',
          client_secret: config.oauth.google.clientSecret || ''
        }).toString()
      );
      
      if (!tokenData.access_token) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_access_token`);
      }
      
      // Get user info
      const { data: userInfo } = await axios.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`
        }
      });

      // Create or update user
      const user = await authService.createOAuthUser({
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        provider: 'google',
        providerId: userInfo.sub,
        role: 'user'
      });

      // Store OAuth avatar if available, but don't block if it fails
      if (userInfo.picture) {
        try {
          await userService.storeOAuthAvatar(user.id, userInfo.picture);
          safeOAuthAuditLog(
            {
              type: 'oauth_avatar_upload',
              userId: user.id,
              status: 'success',
              userAgent: 'Google OAuth'
            },
            'google'
          );
        } catch (avatarError) {
          console.error('Failed to store Google OAuth avatar:', avatarError);
          safeOAuthAuditLog(
            {
              type: 'oauth_avatar_upload',
              userId: user.id,
              status: 'failure',
              error: avatarError instanceof Error ? avatarError.message : 'Unknown error',
              userAgent: 'Google OAuth'
            },
            'google'
          );
        }
      }

      // Create session
      const session = await this.sessionService.createSession(user.id, {
        ip: stateSession.ip_address,
        userAgent: stateSession.device_info?.userAgent || 'unknown'
      });

      // Generate access token for the user for the frontend
      const accessToken = authService.generateToken({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sessionId: session.session_id
      } as User & { sessionId: string });

      // Generate refresh token
      const refreshToken = await this.tokenService.createRefreshToken(user.id);

      // Revoke OAuth state session
      await this.sessionService.revokeOAuthStateSession(stateSession.session_id);

      // Set secure cookies
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

      return res.redirect(`${process.env.FRONTEND_URL}${returnTo}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent('Authentication failed')}`);
    }
  }
}

export const authController = new AuthController();