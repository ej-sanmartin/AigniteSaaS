import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authConfig from '../config/auth';
import { TokenPayload } from '../types/auth.types';
import { UserRole } from '../routes/users/user.types';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwt.secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// TODO: Design role hierarchy for your project.
export const checkRole = (roles: UserRole[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void => {
    if (!req.user) {
      return res.status(403).json({ message: 'No user found' });
    }

    const user = req.user as TokenPayload;
    if (roles.includes(user.role as UserRole)) {
      next();
    } else {
      return res.status(403).json({ message: 'Required role not found' });
    }
  };
}; 