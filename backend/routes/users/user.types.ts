// First, let's define allowed roles
export type UserRole = 'user' | 'admin';

// Database user model
export interface User {
  id: number;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isVerified?: boolean;
  oauthProvider?: string;
  providerId?: string;
  profileImageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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

export interface DashboardStats {
  lastLogin: string;
  accountCreated: string;
  subscriptionStatus: 'active' | 'inactive' | 'canceled';
}
