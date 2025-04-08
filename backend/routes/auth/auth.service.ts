import { QueryConfig } from 'pg';
import { Secret, SignOptions, sign as jwtSign } from 'jsonwebtoken';
import config from '../../config/auth';
import { executeQuery } from '../../db/queryExecutor';
import { OAuthUser } from './auth.types';
import bcrypt from 'bcrypt';
import { oAuthUserSchema } from './auth.validation';
import { UserRole } from '../users/user.types';
import { TokenPayload } from '../../types/express';
interface UserRecord {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  password?: string;
  oauth_provider?: string;
  oauth_id?: string;
  is_verified: boolean;
  created_at: Date;
}

export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Finds a user by their OAuth provider ID
   * @param provider - The OAuth provider (google/linkedin)
   * @param providerId - The user's ID from the provider
   * @returns The user if found, null otherwise
   */
  async findUserByProviderId(
    provider: string,
    providerId: string
  ): Promise<OAuthUser | null> {
    const query: QueryConfig = {
      text: `
        SELECT 
          id,
          email,
          first_name as "firstName",
          last_name as "lastName",
          role,
          oauth_provider as provider,
          oauth_id as "providerId",
          is_verified as "isVerified",
          created_at as "createdAt"
        FROM users 
        WHERE oauth_provider = $1 AND oauth_id = $2
      `,
      values: [provider, providerId]
    };
    
    const results = await executeQuery<OAuthUser[]>(query);
    return results[0] || null;
  }

  /**
   * Validates password complexity
   */
  private validatePasswordComplexity(password: string): boolean {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  }

  /**
   * Checks if account is locked out
   */
  private async isAccountLocked(userId: number): Promise<boolean> {
    const query = {
      text: `
        SELECT COUNT(*) as count
        FROM user_login_attempts
        WHERE user_id = $1
          AND success = false
          AND attempted_at > NOW() - ($2 || ' milliseconds')::interval
      `,
      values: [userId, this.LOCKOUT_DURATION]
    };

    const result = await executeQuery<{ count: number }[]>(query);
    return result[0].count >= this.MAX_LOGIN_ATTEMPTS;
  }

  /**
   * Records login attempt
   */
  private async recordLoginAttempt(
    userId: number,
    success: boolean,
    ipAddress?: string,
    deviceInfo?: Record<string, any>
  ): Promise<void> {
    const query = {
      text: `
        INSERT INTO user_login_attempts (
          user_id,
          success,
          ip_address,
          device_info
        )
        VALUES ($1, $2, $3, $4)
      `,
      values: [
        userId,
        success,
        ipAddress,
        deviceInfo ? JSON.stringify(deviceInfo) : null
      ]
    };

    await executeQuery(query);
  }

  /**
   * Creates a new OAuth user
   */
  async createOAuthUser(
    userData: Partial<OAuthUser> & {
      email: string;
      firstName: string;
      lastName: string;
      provider: string;
      providerId: string;
    }
  ): Promise<OAuthUser> {
    try {
      const validationResult = oAuthUserSchema.safeParse({
        ...userData,
        role: userData.role || 'user',
        isVerified: true
      });
      
      if (!validationResult.success) {
        throw new Error('Invalid OAuth user data');
      }

      // Check if user already exists
      const existingUserQuery = {
        text: 'SELECT * FROM users WHERE email = $1',
        values: [userData.email]
      };
      const existingUsers = await executeQuery<UserRecord[]>(existingUserQuery);
      
      if (existingUsers.length > 0) {
        return this.transformUserRecord(existingUsers[0]);
      }

      // Create new user
      const createUserQuery = {
        text: `
          INSERT INTO users (
            email,
            first_name,
            last_name,
            role,
            oauth_provider,
            oauth_id,
            is_verified,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
          RETURNING *
        `,
        values: [
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.role || 'user',
          userData.provider,
          userData.providerId,
          new Date(),
          new Date()
        ]
      };

      const newUsers = await executeQuery<UserRecord[]>(createUserQuery);
      return this.transformUserRecord(newUsers[0]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets user by email
   */
  async getUserByEmail(email: string): Promise<OAuthUser | null> {
    const query = {
      text: `
        SELECT 
          id,
          email,
          first_name,
          last_name,
          role,
          oauth_provider,
          oauth_id,
          is_verified,
          created_at
        FROM users
        WHERE email = $1
      `,
      values: [email]
    };

    const result = await executeQuery<UserRecord[]>(query);
    return result[0] ? this.transformUserRecord(result[0]) : null;
  }

  /**
   * Transforms database user record to OAuthUser type
   */
  private transformUserRecord(record: UserRecord): OAuthUser {
    return {
      id: record.id,
      email: record.email,
      firstName: record.first_name,
      lastName: record.last_name,
      role: record.role,
      provider: record.oauth_provider || 'local',
      providerId: record.oauth_id || '',
      isVerified: record.is_verified
    };
  }

  /**
   * Validates user credentials
   */
  async validateCredentials(
    email: string,
    password: string,
    ipAddress?: string,
    deviceInfo?: Record<string, any>
  ): Promise<OAuthUser | null> {
    // Get the raw user record from the database
    const query = {
      text: `
        SELECT 
          id,
          email,
          first_name,
          last_name,
          role,
          oauth_provider,
          oauth_id,
          is_verified,
          created_at,
          password
        FROM users
        WHERE email = $1
      `,
      values: [email]
    };

    const result = await executeQuery<UserRecord[]>(query);
    const userRecord = result[0];
    
    if (!userRecord) {
      return null;
    }

    // Check if account is locked
    const isLocked = await this.isAccountLocked(userRecord.id);
    if (isLocked) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    // For OAuth users without a password, they can't login with email/password
    if (userRecord.oauth_provider !== 'local' && !userRecord.password) {
      await this.recordLoginAttempt(userRecord.id, false, ipAddress, deviceInfo);
      return null;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, userRecord.password || '');
    
    // Record login attempt
    await this.recordLoginAttempt(userRecord.id, isValid, ipAddress, deviceInfo);

    if (!isValid) {
      return null;
    }

    // Transform to OAuthUser type (without password)
    return this.transformUserRecord(userRecord);
  }

  /**
   * Creates a new user with password
   */
  async createUser(userData: any): Promise<OAuthUser> {
    // Validate password complexity
    if (!this.validatePasswordComplexity(userData.password)) {
      throw new Error(
        'Password must be at least 12 characters long and contain at least ' +
        'one uppercase letter, one lowercase letter, one number, and one ' +
        'special character.'
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);

    const query = {
      text: `
        INSERT INTO users (
          email,
          first_name,
          last_name,
          password,
          role,
          oauth_provider,
          is_verified
        )
        VALUES ($1, $2, $3, $4, $5, 'local', false)
        RETURNING id, email, first_name, last_name, role, oauth_provider, oauth_id, is_verified, created_at
      `,
      values: [
        userData.email,
        userData.firstName,
        userData.lastName,
        hashedPassword,
        userData.role || 'user'
      ]
    };

    const result = await executeQuery<UserRecord[]>(query);
    return this.transformUserRecord(result[0]);
  }

  /**
   * Generates a JWT token
   */
  generateToken(payload: TokenPayload): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT secret is not configured');
    }

    return jwtSign(
      payload,
      process.env.JWT_SECRET as Secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );
  }

  /**
   * Calculates token expiration in milliseconds
   */
  getMaxAge(expiresIn: string | number): number {
    if (typeof expiresIn === 'string') {
      const unit = expiresIn.slice(-1);
      const value = parseInt(expiresIn.slice(0, -1), 10);
      
      switch(unit) {
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 24 * 60 * 60 * 1000;
      }
    }
    return expiresIn * 1000;
  }
}

export const authService = new AuthService(); 