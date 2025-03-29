import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TokenPayload } from '../types/auth.types';
import { UserRole } from '../routes/users/user.types';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Get token from Authorization header or cookies
  let token: string | undefined;
  
  // First try Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } 
  // If no Authorization header, try cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    
    // Set the user object on the request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Unauthorized: ' + error.message });
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