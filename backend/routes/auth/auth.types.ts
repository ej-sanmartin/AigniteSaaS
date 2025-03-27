import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface OAuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  provider: 'google' | 'linkedin';
  providerId: string;
  createdAt: Date;
  password?: string;
}

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

export interface OAuthProfile {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  emails?: { value: string }[];
} 