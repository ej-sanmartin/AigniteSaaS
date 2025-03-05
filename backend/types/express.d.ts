import { TokenPayload } from './auth.types';
import { User } from './user.types';

declare namespace Express {
  export interface Request {
    user?: TokenPayload;
  }
}

export {}; 