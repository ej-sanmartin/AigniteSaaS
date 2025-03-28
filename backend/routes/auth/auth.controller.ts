import { Request, Response } from 'express';
import { OAuthProfile, OAuthUser } from './auth.types';
import { authService } from './auth.service';
import { oAuthUserSchema } from './auth.validation';
import { userService } from '../users/user.service';
import { loginSchema } from './auth.validation';
import bcrypt from 'bcrypt';
import { tokenService } from '../../services/token/token';
import { TokenPayload } from './auth.types';

export class AuthController {
  /**
   * Handles OAuth user authentication/creation
   */
  async handleOAuthUser(
    profile: OAuthProfile,
    provider: 'google' | 'linkedin',
    done: (error: any, user?: OAuthUser | false) => void
  ): Promise<void> {
    try {
      console.log('handleOAuthUser: Starting with profile:', {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        provider
      });

      let user = await authService.findUserByProviderId(provider, profile.id);
      console.log('handleOAuthUser: Existing user found:', user);

      if (!user) {
        console.log('handleOAuthUser: No existing user found, creating new user');
        const userData = oAuthUserSchema.parse({
          email: profile.emails?.[0]?.value,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          provider,
          providerId: profile.id
        });
        console.log('handleOAuthUser: Validated user data:', userData);

        user = await authService.createOAuthUser(userData);
        console.log('handleOAuthUser: New user created:', user);
      }

      done(null, user);
    } catch (error) {
      console.error('Error in handleOAuthUser:', error);
      done(error);
    }
  }

  /**
   * Handles OAuth callback
   */
  async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      console.log('Backend OAuth callback received');
      // Use type assertion to fix the TypeScript error
      const user = req.user as OAuthUser | undefined;
      
      if (!user) {
        console.log('No user found in request');
        res.setHeader('Content-Type', 'application/json');
        res.status(401).json({ message: 'Authentication failed' });
        return;
      }

      console.log('User found:', { 
        id: user.id, 
        email: user.email, 
        provider: user.provider,
        providerId: user.providerId 
      });

      // Verify user exists in database
      const dbUser = await userService.getUserById(user.id);
      if (!dbUser) {
        console.error('User not found in database after OAuth flow');
        res.setHeader('Content-Type', 'application/json');
        res.status(401).json({ message: 'User not found in database' });
        return;
      }

      // Update last login timestamp
      await userService.updateLastLogin(user.id);

      // Generate access token
      const accessToken = authService.generateToken({
        id: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id,
        email: user.email,
        role: user.role
      });

      // Generate refresh token
      const refreshToken = await tokenService.createRefreshToken(user.id);

      // Remove password from user data
      const { password, ...userWithoutPassword } = user;

      console.log('Generated tokens and prepared response');

      // Set content type header and return JSON response with 200 status
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        token: accessToken,
        refreshToken,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(401).json({ message: 'Authentication failed' });
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
  async logout(_req: Request, res: Response): Promise<void> {
    try {
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

      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ message: 'Failed to check auth status' });
    }
  }
}

export const authController = new AuthController();