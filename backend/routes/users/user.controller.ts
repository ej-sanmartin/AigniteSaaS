import { Request, Response } from 'express';
import { userService } from './user.service';
import { User, UpdateUserDTO } from './user.types';
import { updateUserSchema, createUserSchema } from './user.validation';
import bcrypt from 'bcrypt';
import { verifyEmailService } from '../verify_email/verify_email.service';
import { authService } from '../auth/auth.service';
import { TokenService } from '../../services/token/token';
import { SessionService } from '../../services/session/session.service';

export class UserController {
  private sessionService: SessionService;
  private tokenService: TokenService;

  constructor() {
    this.sessionService = new SessionService();
    this.tokenService = new TokenService();
  }

  /**
   * Handles user registration
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const returnTo = req.query.returnTo as string || '/dashboard';
      
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(validatedData.password, salt);

      const user = await userService.createUser({
        ...validatedData,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName
      });

      // Try to send verification email, but don't block if it fails
      try {
        await verifyEmailService.createVerificationToken(user.id);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      // Create session
      const session = await this.sessionService.createSession(user.id, {
        ip: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown'
      });

      // Generate tokens
      const accessToken = authService.generateToken({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });

      const refreshToken = await this.tokenService.createRefreshToken(user.id);

      // Set cookies with security config
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/'
      };

      // Set session cookie
      res.cookie('session_id', session.session_id, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Set access token cookie
      res.cookie('token', accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Set refresh token cookie
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Redirect to frontend with returnTo path
      res.redirect(`${process.env.FRONTEND_URL}${returnTo}`);
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific error codes
      if (errorMessage === 'EMAIL_ALREADY_EXISTS') {
        res.redirect(`${process.env.FRONTEND_URL}/signup?error=${encodeURIComponent('An account with this email already exists')}`);
        return;
      }

      // Handle other errors
      res.redirect(`${process.env.FRONTEND_URL}/signup?error=${encodeURIComponent('Error creating user')}`);
    }
  }
   
  /**
   * Handles getting all users (admin only)
   */
  async getAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        message: 'Error fetching users',
        code: 'USER_FETCH_ERROR'
      });
    }
  }

  /**
   * Handles getting a user by ID
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    const user = req.user;
    const userId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ 
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    if (userId !== (user as User).id) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    try {
      const userDetails = await userService.getUserById(userId);
      
      if (!userDetails) {
        res.status(404).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      res.json(userDetails);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Error fetching user', code: 'USER_FETCH_ERROR' });
    }
  }

  /**
   * Handles updating a user
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    const user = req.user;
    const { id } = req.params;
    const userId = (user as User).id;
    const updates: UpdateUserDTO = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      return;
    }

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ message: 'Invalid user ID', code: 'INVALID_USER_ID' });
      return;
    }

    if (userId !== parsedId) {
      res.status(403).json({ message: 'Access denied', code: 'ACCESS_DENIED' });
      return;
    }

    try {
      const validatedUpdates = updateUserSchema.parse(updates);
      const updatedUser = await userService.updateUser(parsedId, validatedUpdates);
      
      if (!updatedUser) {
        res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
        return;
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user', code: 'USER_UPDATE_ERROR' });
    }
  }

  /**
   * Handles deleting a user
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const parsedId = parseInt(id, 10);
      const deleted = await userService.deleteUser(parsedId);
      
      if (!deleted) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user', error });
    }
  }

  /**
   * Handles getting dashboard stats for a user
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies.session_id;
      
      if (!sessionId) {
        res.status(401).json({ 
          message: 'No session found',
          code: 'SESSION_MISSING'
        });
        return;
      }

      const session = await this.sessionService.getSession(sessionId);
      
      if (!session) {
        res.status(401).json({ 
          message: 'Invalid or expired session',
          code: 'SESSION_INVALID'
        });
        return;
      }

      const stats = await userService.getDashboardStats(session.user_id);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Gets the current user's profile
   */
  async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies.session_id;
      
      if (!sessionId) {
        res.status(401).json({ 
          message: 'No session found',
          code: 'SESSION_MISSING'
        });
        return;
      }

      const session = await this.sessionService.getSession(sessionId);
      
      if (!session) {
        res.status(401).json({ 
          message: 'Invalid or expired session',
          code: 'SESSION_INVALID'
        });
        return;
      }

      const user = await userService.getUserById(session.user_id);
      
      if (!user) {
        res.status(401).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Remove sensitive data
      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Gets the current user's avatar URL
   */
  async getAvatar(req: Request, res: Response): Promise<void> {
    const userId = (req.user as User).id;
    
    if (!userId) {
      res.status(401).json({ 
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    try {
      const avatarUrl = await userService.getAvatarUrl(userId);
      
      if (!avatarUrl) {
        res.status(404).json({ 
          message: 'No avatar found',
          code: 'AVATAR_NOT_FOUND'
        });
        return;
      }

      res.json({ avatarUrl });
    } catch (error) {
      console.error('Error getting avatar:', error);
      res.status(500).json({ 
        message: 'Failed to get avatar',
        code: 'AVATAR_FETCH_ERROR'
      });
    }
  }

  /**
   * Uploads a new avatar for the current user
   */
  async uploadAvatar(req: Request, res: Response): Promise<void> {
    const userId = (req.user as User).id;
    
    if (!userId) {
      res.status(401).json({ 
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    const file = req.file;
    
    if (!file) {
      res.status(400).json({ 
        message: 'No file uploaded',
        code: 'NO_FILE'
      });
      return;
    }

    try {
      await userService.uploadUserAvatar(userId, file.buffer);
      
      res.json({ 
        message: 'Avatar uploaded successfully',
        code: 'AVATAR_UPLOAD_SUCCESS'
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ 
        message: 'Failed to upload avatar',
        code: 'AVATAR_UPLOAD_ERROR'
      });
    }
  }
}

export const userController = new UserController(); 