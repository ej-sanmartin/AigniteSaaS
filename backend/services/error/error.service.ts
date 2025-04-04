import { Request, Response } from 'express';

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AUTH_RATE_LIMIT_EXCEEDED = 'AUTH_RATE_LIMIT_EXCEEDED',
  TOKEN_RATE_LIMIT_EXCEEDED = 'TOKEN_RATE_LIMIT_EXCEEDED',
  VERIFICATION_RATE_LIMIT_EXCEEDED = 'VERIFICATION_RATE_LIMIT_EXCEEDED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Redirect errors
  INVALID_REDIRECT_URL = 'INVALID_REDIRECT_URL',
  REDIRECT_NOT_ALLOWED = 'REDIRECT_NOT_ALLOWED',
  REDIRECT_DOMAIN_NOT_ALLOWED = 'REDIRECT_DOMAIN_NOT_ALLOWED',
  REDIRECT_PATH_NOT_ALLOWED = 'REDIRECT_PATH_NOT_ALLOWED',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',
  
  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export class AppError extends Error {
  constructor(
    public message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class RedirectError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    public originalUrl?: string,
    statusCode: number = 400
  ) {
    super(message, code, statusCode);
    this.name = 'RedirectError';
  }
}

export const handleError = (error: Error, req: Request, res: Response): void => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      code: error.code
    });
    return;
  }

  // Handle rate limit errors
  if (error.message.includes('rate limit')) {
    res.status(429).json({
      message: 'Too many requests, please try again later',
      code: ErrorCode.RATE_LIMIT_EXCEEDED
    });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      message: 'Invalid input data',
      code: ErrorCode.VALIDATION_ERROR
    });
    return;
  }

  // Handle database errors
  if (error.name === 'PostgresError') {
    res.status(500).json({
      message: 'Database error occurred',
      code: ErrorCode.DATABASE_ERROR
    });
    return;
  }

  // Default error response
  res.status(500).json({
    message: 'An unexpected error occurred',
    code: ErrorCode.INTERNAL_SERVER_ERROR
  });
}; 