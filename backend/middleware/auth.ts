import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/auth.types';
import { UserRole } from '../routes/users/user.types';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid Authorization header found');
    return res.status(403).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Verifying token:', token.substring(0, 20) + '...');

  try {
    console.log('Attempting to verify token with JWT_SECRET');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    console.log('Token decoded successfully. Payload:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      raw: decoded
    });
    
    // Set the user object on the request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    console.log('User set on request:', req.user);
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT Error type:', error.name);
      console.error('JWT Error message:', error.message);
    }
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