import { QueryConfig } from 'pg';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import config from '../../config/auth';
import { executeQuery } from '../../utils/sql';
import { OAuthUser, TokenPayload } from './auth.types';
import { CreateOAuthUserInput } from './auth.validation';

export class AuthService {
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
   * Creates a new OAuth user
   * @param userData - The user data from OAuth provider
   * @returns The created user
   */
  async createOAuthUser(userData: CreateOAuthUserInput): Promise<OAuthUser> {
    const query: QueryConfig = {
      text: `
        INSERT INTO users (
          email,
          first_name,
          last_name,
          auth_type,
          password,
          oauth_provider,
          oauth_id,
          is_verified
        )
        VALUES ($1, $2, $3, $4, '', $5, $6, true)
        RETURNING 
          id,
          email,
          first_name as "firstName",
          last_name as "lastName",
          role,
          oauth_provider as provider,
          oauth_id as "providerId",
          created_at as "createdAt"
      `,
      values: [
        userData.email,
        userData.firstName,
        userData.lastName,
        userData.provider,
        userData.providerId
      ]
    };
    
    const results = await executeQuery<OAuthUser[]>(query);
    return results[0];
  }

  /**
   * Generates a JWT token
   * @param payload - The data to encode in the token
   * @returns The generated token
   */
  generateToken(payload: TokenPayload): string {
    if (!config.jwt.secret) {
      throw new Error('JWT secret is not configured');
    }

    return jwt.sign(
      payload,
      config.jwt.secret as Secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );
  }

  /**
   * Calculates token expiration in milliseconds
   * @param expiresIn - Token expiration time
   * @returns Expiration in milliseconds
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