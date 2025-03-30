import { Request, Response } from 'express';
import { OAuthUser, LinkedInProfile } from './auth.types';
import { authService } from './auth.service';
import { oAuthUserSchema } from './auth.validation';
import { userService } from '../users/user.service';
import { loginSchema } from './auth.validation';
import bcrypt from 'bcrypt';
import { tokenService } from '../../services/token/token';
import { TokenPayload } from './auth.types';
import { Profile as GoogleProfile } from 'passport-google-oauth20';

export class AuthController {
  /**
   * Handles OAuth user authentication/creation
   */
  async handleOAuthUser(
    profile: GoogleProfile | LinkedInProfile,
    provider: 'google' | 'linkedin',
    done: (error: any, user?: OAuthUser | false) => void
  ): Promise<void> {
    try {
      // Find user by email instead of provider ID
      const user = await userService.getUserByEmail(profile.emails?.[0]?.value || '');

      if (!user) {
        const userData = oAuthUserSchema.parse({
          email: profile.emails?.[0]?.value,
          firstName: provider === 'google' 
            ? (profile as GoogleProfile)._json.given_name || ''
            : (profile as LinkedInProfile).given_name || '',
          lastName: provider === 'google'
            ? (profile as GoogleProfile)._json.family_name || ''
            : (profile as LinkedInProfile).family_name || '',
          provider,
          providerId: profile.id || (profile as LinkedInProfile).sub || ''
        });

        try {
          const newUser = await authService.createOAuthUser(userData);
          done(null, newUser);
        } catch (createError) {
          console.error('Error creating OAuth user:', createError);
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
      console.error(`Error in handleOAuthUser for ${provider}:`, error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      done(error);
    }
  }

  /**
   * Handles OAuth callback
   */
  async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as OAuthUser | undefined;
      const provider = req.params.provider || 'unknown';
      
      if (!user) {
        console.error(`No user found in ${provider} OAuth callback`);
        const errorUrl = `${process.env.FRONTEND_URL}/login`;
        res.redirect(`${errorUrl}?error=${encodeURIComponent('Authentication failed')}`);
        return;
      }

      // Verify user exists in database by email instead of ID
      const dbUser = await userService.getUserByEmail(user.email);
      if (!dbUser) {
        console.error(`User not found in database after ${provider} OAuth flow`);
        const errorUrl = `${process.env.FRONTEND_URL}/login`;
        res.redirect(`${errorUrl}?error=${encodeURIComponent('User not found')}`);
        return;
      }

      // Update last login timestamp
      await userService.updateLastLogin(dbUser.id);

      // Generate access token
      const accessToken = authService.generateToken({
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role
      });

      // Generate refresh token
      const refreshToken = await tokenService.createRefreshToken(dbUser.id);

      // Remove password from user data
      const { password, ...userWithoutPassword } = dbUser;

      // Get returnTo from query params or default to dashboard
      const returnTo = req.query.returnTo as string || '/dashboard';

      // Redirect back to frontend with tokens and user data
      const frontendUrl = process.env.FRONTEND_URL;
      if (!frontendUrl) {
        throw new Error('Frontend URL not configured');
      }

      const redirectUrl = new URL(`${frontendUrl}/api/auth/${provider}/callback`);
      redirectUrl.searchParams.set('token', accessToken);
      redirectUrl.searchParams.set('refreshToken', refreshToken);
      redirectUrl.searchParams.set('user', JSON.stringify(userWithoutPassword));
      redirectUrl.searchParams.set('returnTo', returnTo);

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('OAuth callback error:', error);
      const errorUrl = `${process.env.FRONTEND_URL}/login`;
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      res.redirect(`${errorUrl}?error=${encodeURIComponent(errorMessage)}`);
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
        role: user.role
      });

      // Generate new refresh token
      const newRefreshToken = await tokenService.createRefreshToken(user.id);

      // Revoke old refresh token
      await tokenService.revokeRefreshToken(refreshToken);

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
      // Get user ID from the authenticated request
      const user = req.user as TokenPayload;
      const userId = user?.id;
      
      if (userId) {
        // Revoke all refresh tokens for the user
        await tokenService.revokeAllUserTokens(userId);
      }

      // Clear cookies
      res.clearCookie('token');
      res.clearCookie('refreshToken');
      res.clearCookie('user');

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Error during logout' });
    }
  }

  /**
   * Check authentication status and return current user
   */
  async checkAuth(req: Request, res: Response): Promise<void> {
    try {
      console.log('Checking auth status');
      
      const user = req.user as TokenPayload;
      
      if (!user) {
        console.log('No user found in request');
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      // Get fresh user data from database
      const dbUser = await userService.getUserById(user.id);
      
      if (!dbUser) {
        console.log('User not found in database');
        res.status(401).json({ message: 'User not found' });
        return;
      }

      // Remove sensitive data
      const { password, ...userWithoutPassword } = dbUser;

      // Ensure isVerified is included in the response
      const userResponse = {
        ...userWithoutPassword,
        isVerified: dbUser.isVerified
      };

      res.json({ user: userResponse });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ message: 'Failed to check auth status' });
    }
  }
}

export const authController = new AuthController();