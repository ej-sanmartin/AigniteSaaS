import rateLimit from 'express-rate-limit';
import { RateLimitRequestHandler } from 'express-rate-limit';

// Constants for rate limiting
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/**
 * General API rate limiter
 * Limits each IP to 100 requests per 15 minutes
 */
export const apiLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Stricter rate limiter for authentication routes
 * Limits each IP to 5 login attempts per hour
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: ONE_HOUR,
  max: 5,
  message: {
    error: 'Too many login attempts from this IP, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false, // Count failed requests against the rate limit
  skipSuccessfulRequests: true, // Don't count successful logins against limit
});

/**
 * Rate limiter for sending verification emails
 * Limits each IP to 3 requests per hour
 */
export const verificationEmailLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: ONE_HOUR,
  max: 3,
  message: {
    error: 'Too many verification email requests, please try again later',
    code: 'VERIFICATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for email verification attempts
 * Limits each IP to 10 verification attempts per 15 minutes
 */
export const verifyTokenLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 10,
  message: {
    error: 'Too many verification attempts, please try again later',
    code: 'VERIFY_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for token creation and refresh
 * Limits each IP to 10 token operations per hour
 */
export const tokenLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: ONE_HOUR,
  max: 10,
  message: {
    error: 'Too many token operations, please try again later',
    code: 'TOKEN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false, // Count failed requests against the rate limit
  skipSuccessfulRequests: true, // Don't count successful operations against limit
}); 