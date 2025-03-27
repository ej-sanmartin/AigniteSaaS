import { Request, Response } from 'express';
import { OAuthProfile, OAuthUser } from './auth.types';
import { authService } from './auth.service';
import { oAuthUserSchema } from './auth.validation';
import config from '../../config/auth';
import { userService } from '../users/user.service';
import { loginSchema } from './auth.validation';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { tokenService } from '../../services/token/token';

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

      console.log('User found:', { id: user.id, email: user.email, provider: user.provider });

      const token = authService.generateToken({
        id: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id,
        email: user.email,
        role: user.role
      });

      // Remove password from user data
      const { password, ...userWithoutPassword } = user;

      console.log('Generated token and prepared response');

      // Set content type header and return JSON response with 302 status
      res.setHeader('Content-Type', 'application/json');
      res.status(302).json({
        token,
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

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          role: user.role 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '24h' }
      );

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        token,
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
      const refreshToken = req.cookies.refresh_token;
      
      if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token required' });
        return;
      }

      // Verify the refresh token
      const userId = await tokenService.verifyRefreshToken(refreshToken);
      
      if (!userId) {
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
      }

      // Generate new tokens
      const user = await userService.getUserById(userId);
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }

      // Generate new tokens
      const newAccessToken = authService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      // Generate new refresh token and revoke the old one
      const newRefreshToken = await tokenService.createRefreshToken(user.id);
      await tokenService.revokeRefreshToken(refreshToken, newRefreshToken);

      // Set the new cookies
      res.cookie('auth_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: authService.getMaxAge(config.jwt.expiresIn)
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: authService.getMaxAge(config.refreshToken.expiresIn)
      });

      res.json({ message: 'Token refreshed successfully' });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ message: 'Error refreshing token' });
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
   * Verifies the current user's authentication status
   */
  async checkAuth(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No valid Authorization header found');
        res.status(401).json({ 
          message: 'Not authenticated',
          code: 'AUTH_NOT_AUTHENTICATED'
        });
        return;
      }

      const token = authHeader.split(' ')[1];
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
        email: string;
        role: string;
      };

      // Get user from database
      const user = await userService.getUserById(decoded.id);
      
      if (!user) {
        console.log('User not found for token');
        res.status(401).json({ 
          message: 'User not found',
          code: 'AUTH_USER_NOT_FOUND'
        });
        return;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Check auth error:', error);
      res.status(401).json({ 
        message: 'Invalid token',
        code: 'AUTH_INVALID_TOKEN'
      });
    }
  }
}

export const authController = new AuthController(); 