import { QueryConfig } from 'pg';
import bcrypt from 'bcryptjs';
import { executeQuery } from '../../utils/sql';
import { User, CreateUserDTO, UpdateUserDTO } from './user.types';

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
          role
        ) VALUES ($1, $2, $3, $4, $5)
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
        userData.role || 'user'
      ]
    };

    const result = await executeQuery<User[]>(query);
    
    if (!result.length) {
      throw new Error('Failed to create user');
    }

    return result[0];
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
}

export const userService = new UserService(); 