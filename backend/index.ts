import './config/env';

import express from 'express';
import passport from 'passport';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { apiLimiter } from './middleware/rateLimiter';
import { securityHeaders, corsMiddleware } from './middleware/security';
import { OAuthSessionStore } from './services/session/oauth_session.store';
import authRoutes from './routes/auth/index';
import verifyEmailRoutes from './routes/verify_email/index';
import userRoutes from './routes/users/index';
import subscriptionRoutes from './routes/subscriptions/index';
import stripeWebhookRoutes from './routes/webhooks/stripe/index';

const app = express();

// Basic security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      sandbox: ['allow-forms', 'allow-scripts', 'allow-same-origin']
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "same-origin" }
}));

// Custom security middleware
app.use(securityHeaders);
app.use(corsMiddleware);

// Body parser and cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use(apiLimiter);

// OAuth session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  store: new OAuthSessionStore(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes for OAuth state
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/verify-email', verifyEmailRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks/stripe', stripeWebhookRoutes);

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;