import { Multer } from 'multer';
import { Request } from 'express';
import { OAuthUser } from '../routes/auth/auth.types';
import { UserRole } from '../routes/users/user.types';
import { Session } from '../services/session/session.types';

// Token payload for JWT-authenticated requests. Like User but with minimal
// fields necessary for authentication.
export interface TokenPayload {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface User extends TokenPayload {}
  }
}

// Define a base user interface without provider fields
export interface BaseUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface RequestWithSession extends Request {
  user?: BaseUser | TokenPayload;
  session?: Session;
  file?: Multer.File;
}
