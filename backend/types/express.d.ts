import { TokenPayload } from './auth.types';
import { User } from './user.types';
import { Request } from 'express';
import { OAuthUser } from '../routes/auth/auth.types';

declare namespace Express {
  export interface Request {
    user?: TokenPayload;
  }
}

// Define a base user interface without provider fields
export interface BaseUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

declare global {
  namespace Express {
    // Extend the base user interface for Express
    interface User extends BaseUser {
      provider?: string;
      providerId?: string;
    }
  }
}

export interface RequestWithSession extends Request {
  user?: Express.User;
}

export {}; 