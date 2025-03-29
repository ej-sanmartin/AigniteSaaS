import { Request } from 'express';
import { User, UserRole } from './user.types';

// First, let's define allowed roles
export type UserRole = 'user' | 'admin';

// Database user model
export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API response user model (without sensitive data)
export type SafeUser = Omit<User, 'password'>;

// DTOs for user operations
export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserDTO {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

export interface DashboardStats {
  lastLogin: string;
  accountCreated: string;
  subscriptionStatus: 'active' | 'inactive' | 'canceled';
}

// Custom type for authenticated requests
export interface AuthenticatedRequest extends Request {
  user?: User;
}