import { Request, Response } from 'express';
import { userService } from './user.service';
import { User, UpdateUserDTO, SafeUser } from './user.types';
import { updateUserSchema, createUserSchema } from './user.validation';
import bcrypt from 'bcrypt';
import { TokenPayload } from './user.types';

export class UserController {
  /**
   * Handles user registration
   */
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createUserSchema.parse(req.body);
      
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(validatedData.password, salt);

      const user = await userService.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        message: 'User created successfully',
        user: userWithoutPassword as SafeUser
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(400).json({ 
        message: 'Error creating user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
    const user = req.user as User;
    const userId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({ 
        message: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    if (userId !== user.id) {
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
      res.status(500).json({ message: 'Error fetching user', error });
    }
  }

  /**
   * Handles updating a user
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = req.user as User;
    const userId = user?.id;
    const updates: UpdateUserDTO = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    if (userId !== parsedId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    try {
      const validatedUpdates = updateUserSchema.parse(updates);
      const updatedUser = await userService.updateUser(parsedId, validatedUpdates);
      
      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Error updating user', error });
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
    const user = req.user as TokenPayload;
    
    if (!user?.id) {
      res.status(401).json({ 
        message: 'User not authenticated',
        code: 'UNAUTHORIZED'
      });
      return;
    }

    try {
      const stats = await userService.getDashboardStats(user.id);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ 
        message: 'Error fetching dashboard stats',
        code: 'DASHBOARD_STATS_ERROR'
      });
    }
  }
}

export const userController = new UserController(); 