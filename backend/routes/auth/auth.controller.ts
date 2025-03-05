import { Request, Response } from 'express';
import { OAuthProfile, OAuthUser } from './auth.types';
import { authService } from './auth.service';
import { oAuthUserSchema } from './auth.validation';
import config from '../../config/auth';
import { userService } from '../users/user.service';
import { loginSchema } from './auth.validation';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
      let user = await authService.findUserByProviderId(provider, profile.id);

      if (!user) {
        const userData = oAuthUserSchema.parse({
          email: profile.emails?.[0]?.value,
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          provider,
          providerId: profile.id
        });

        user = await authService.createOAuthUser(userData);
      }

      done(null, user);
    } catch (error) {
      done(error);
    }
  }

  /**
   * Handles OAuth callback
   */
  async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as OAuthUser;
      if (!user) {
        res.status(401).json({ message: 'Authentication failed' });
        return;
      }

      const token = authService.generateToken({
        id: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id,
        email: user.email,
        role: user.role
      });

      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: authService.getMaxAge(config.jwt.expiresIn)
      });

      res.redirect('/auth-success');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/login?error=auth_failed');
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
}

export const authController = new AuthController(); 