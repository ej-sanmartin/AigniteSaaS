import { Request, Response, NextFunction } from 'express';
import config from '../config/redirect';
import { RedirectError, ErrorCode } from '../services/error/error.service';
import { apiLimiter } from './rateLimiter';
import { User } from '../routes/users/user.types';

/**
 * Validates redirect URLs against the configured whitelist
 * and applies role-based redirects when needed.
 */
export const validateRedirect = (req: Request, _res: Response, next: NextFunction): void => {
  const returnTo = req.query.returnTo as string;
  
  // If no redirect specified, continue
  if (!returnTo) {
    return next();
  }

  try {
    // Handle relative paths (starting with /)
    if (returnTo.startsWith('/')) {
      // Validate path
      const isPathAllowed = config.allowedPaths.some(path => 
        returnTo.startsWith(path)
      );

      if (!isPathAllowed) {
        throw new RedirectError(
          'Redirect path not allowed',
          ErrorCode.REDIRECT_PATH_NOT_ALLOWED,
          returnTo
        );
      }

      // If we get here, the path is valid
      return next();
    }

    // Handle full URLs (legacy support)
    const url = new URL(returnTo);
    
    // Validate domain
    const isDomainAllowed = config.allowedDomains.some(domain => 
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );

    if (!isDomainAllowed) {
      throw new RedirectError(
        'Redirect domain not allowed',
        ErrorCode.REDIRECT_DOMAIN_NOT_ALLOWED,
        returnTo
      );
    }

    // Validate path
    const isPathAllowed = config.allowedPaths.some(path => 
      url.pathname.startsWith(path)
    );

    if (!isPathAllowed) {
      throw new RedirectError(
        'Redirect path not allowed',
        ErrorCode.REDIRECT_PATH_NOT_ALLOWED,
        returnTo
      );
    }

    // If we get here, the URL is valid
    return next();
  } catch (error) {
    if (error instanceof RedirectError) {
      // If it's already a RedirectError, pass it through
      return next(error);
    } else if (error instanceof TypeError && error.message.includes('URL')) {
      // Handle invalid URL format
      return next(new RedirectError(
        'Invalid redirect URL format',
        ErrorCode.INVALID_REDIRECT_URL,
        returnTo
      ));
    } else {
      // Handle other errors
      return next(new RedirectError(
        'Redirect validation failed',
        ErrorCode.REDIRECT_NOT_ALLOWED,
        returnTo
      ));
    }
  }
};

/**
 * Applies role-based redirects when validation fails
 */
export const applyRoleBasedRedirect = (req: Request, _res: Response, next: NextFunction): void => {
  const error = req.query.error as string;
  const returnTo = req.query.returnTo as string;
  
  // If there's no error or returnTo, continue
  if (!error || !returnTo) {
    return next();
  }

  try {
    // Get user role from request (assuming it's set by auth middleware)
    const userRole = (req.user as User)?.role;
    const isAuthenticated = !!req.user;

    // Apply role-based redirect
    if (isAuthenticated && userRole && config.roleBasedRedirects.authenticated[userRole]) {
      req.query.returnTo = config.roleBasedRedirects.authenticated[userRole];
    } else {
      req.query.returnTo = config.roleBasedRedirects.unauthenticated;
    }

    next();
  } catch (error) {
    // If role-based redirect fails, use default
    req.query.returnTo = config.defaultRedirect;
    next();
  }
};

// Export middleware with rate limiting
export const redirectValidation = [
  apiLimiter,
  validateRedirect,
  applyRoleBasedRedirect
]; 