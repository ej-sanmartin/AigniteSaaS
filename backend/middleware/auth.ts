import { Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session/session.service';
import { UserRole } from '../routes/users/user.types';
import { userService } from '../routes/users/user.service';
const sessionService = new SessionService();

export const verifySession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = req.cookies.session_id;
    
    if (!sessionId) {
      res.status(401).json({ 
        message: 'No session found',
        code: 'SESSION_MISSING'
      });
      return;
    }

    const session = await sessionService.getSession(sessionId);
    
    if (!session) {
      res.status(401).json({ 
        message: 'Invalid or expired session',
        code: 'SESSION_INVALID'
      });
      return;
    }

    // Update last activity
    await sessionService.updateSession(sessionId, {
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown'
    });

    // Get full user data
    const user = await userService.getUserById(session.user_id);
    if (!user) {
      res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const verifyRole = (allowedRoles: UserRole[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const sessionId = req.cookies.session_id;
      
      if (!sessionId) {
        return res.status(401).json({ 
          message: 'No session found',
          code: 'SESSION_MISSING'
        });
      }

      const session = await sessionService.getSession(sessionId);
      
      if (!session) {
        return res.status(401).json({ 
          message: 'Invalid or expired session',
          code: 'SESSION_INVALID'
        });
      }

      const user = await userService.getUserById(session.user_id);
      
      if (!user) {
        return res.status(401).json({ 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!allowedRoles.includes(user.role as UserRole)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};
