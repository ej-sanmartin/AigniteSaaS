import { QueryConfig } from 'pg';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../../db/queryExecutor';
import { User, CreateUserDTO, UpdateUserDTO, DashboardStats } from './user.types';

export class UserService {
  /**
   * Creates a new user
   */
  async createUser(userData: CreateUserDTO): Promise<User> {
    const query = {
      text: `
        INSERT INTO users (
          email,
          password,
          first_name,
          last_name,
          role,
          is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
          id, 
          email, 
          first_name as "firstName",
          last_name as "lastName",
          password,
          role,
          is_verified as "isVerified",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `,
      values: [
        userData.email,
        userData.password,
        userData.firstName || '',
        userData.lastName || '',
        userData.role || 'user',
        false
      ]
    };

    try {
      const result = await executeQuery<User[]>(query);
      
      if (!result.length) {
        throw new Error('Failed to create user');
      }

      return result[0];
    } catch (error: any) {
      // Check for unique constraint violation
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }
      throw error;
    }
  }

  /**
   * Retrieves all users from the database
   */
  async getAllUsers(): Promise<User[]> {
    const query: QueryConfig = {
      text: `
        SELECT id, email, 
        first_name as "firstName", 
        last_name as "lastName", 
        role, 
        is_verified as "isVerified", 
        created_at as "createdAt", 
        updated_at as "updatedAt" 
        FROM users
      `
    };

    return await executeQuery<User[]>(query);
  }

  /**
   * Retrieves a user by their ID
   */
  async getUserById(id: number): Promise<User | null> {
    const query: QueryConfig = {
      text: `
        SELECT id, email, 
        first_name as "firstName", 
        last_name as "lastName", 
        role, 
        is_verified as "isVerified", 
        created_at as "createdAt", 
        updated_at as "updatedAt" 
        FROM users WHERE id = $1
      `,
      values: [id]
    };

    const users = await executeQuery<User[]>(query);
    return users[0] || null;
  }

  /**
   * Updates a user's information
   */
  async updateUser(id: number, updates: UpdateUserDTO): Promise<User | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let valueCount = 1;

    const fieldMappings: Record<keyof UpdateUserDTO, string> = {
      email: 'email',
      password: 'password',
      firstName: 'first_name',
      lastName: 'last_name',
      role: 'role'
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key in fieldMappings) {
        if (key === 'password') {
          value = bcrypt.hashSync(value, 10);
        }
        const field = fieldMappings[key as keyof UpdateUserDTO];
        updateFields.push(`${field} = $${valueCount}`);
        values.push(value);
        valueCount++;
      }
    });

    if (!updateFields.length) {
      return null;
    }

    values.push(id);
    const query: QueryConfig = {
      text: `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = NOW() 
        WHERE id = $${valueCount}
        RETURNING id, email, 
        first_name as "firstName", 
        last_name as "lastName", 
        role, 
        is_verified as "isVerified", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
      `,
      values
    };

    const users = await executeQuery<User[]>(query);
    return users[0] || null;
  }

  /**
   * Deletes a user by their ID
   */
  async deleteUser(id: number): Promise<boolean> {
    const query: QueryConfig = {
      text: 'DELETE FROM users WHERE id = $1 RETURNING id',
      values: [id]
    };

    const result = await executeQuery<User[]>(query);
    return result.length > 0;
  }

  /**
   * Gets a user by their email address
   * @param email - The email to search for
   * @returns The user if found, null otherwise
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const query: QueryConfig = {
      text: `
        SELECT 
          id,
          email,
          password,
          first_name as "firstName",
          last_name as "lastName",
          role,
          is_verified as "isVerified",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM users 
        WHERE email = $1
      `,
      values: [email]
    };
    
    const results = await executeQuery<User[]>(query);
    return results[0] || null;
  }

  /**
   * Updates the last login timestamp for a user
   */
  async updateLastLogin(userId: number): Promise<void> {
    const query: QueryConfig = {
      text: `
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP 
        WHERE id = $1
      `,
      values: [userId]
    };

    await executeQuery(query);
  }

  /**
   * Gets dashboard stats for a user
   * @param userId - The ID of the user to get stats for
   * @returns Dashboard stats including last login, account creation date, and subscription status
   */
  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const query: QueryConfig = {
      text: `
        SELECT 
          last_login as "lastLogin",
          created_at as "accountCreated",
          CASE 
            WHEN subscription_status IS NOT NULL THEN subscription_status
            ELSE 'inactive'
          END as "subscriptionStatus"
        FROM users 
        WHERE id = $1
      `,
      values: [userId]
    };

    interface DBResponse {
      lastLogin: Date | null;
      accountCreated: Date;
      subscriptionStatus: 'active' | 'inactive' | 'canceled';
    }

    const result = await executeQuery<DBResponse[]>(query);
    
    if (!result.length) {
      throw new Error('User not found');
    }

    return {
      lastLogin: result[0].lastLogin?.toISOString() || new Date().toISOString(),
      accountCreated: result[0].accountCreated.toISOString(),
      subscriptionStatus: result[0].subscriptionStatus
    };
  }
}

export const userService = new UserService(); 