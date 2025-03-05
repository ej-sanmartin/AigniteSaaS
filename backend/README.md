# Backend Service

## Overview
This is the Node.js backend service that provides REST APIs and business logic implementation for the web application.

## Features
- User authentication (JWT + OAuth)
- Email verification
- Stripe subscription management
- User management
- PostgreSQL database integration
- Rate limiting
- Environment configuration
- Type-safe development

## Requirements
- Node.js (v18.17.0 or higher)
- npm (v9.0.0 or higher)
- PostgreSQL (v14 or higher)

## Tech Stack
- Express.js
- TypeScript
- Raw SQL for database queries
- JWT for authentication
- Passport.js for OAuth
- Stripe for payments
- Zod for validation

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/google` - Google OAuth login
- `GET /auth/linkedin` - LinkedIn OAuth login

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Email Verification
- `POST /auth/verify/email` - Send verification email
- `GET /auth/verify/:token` - Verify email token

### Subscriptions
- `GET /subscriptions/status` - Get subscription status
- `POST /subscriptions` - Create subscription
- `POST /webhooks/stripe` - Handle Stripe webhooks

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:3001/auth/linkedin/callback

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID=your_stripe_price_id

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@yourdomain.com
```

3. Set up the PostgreSQL database:
```bash
# Create database
createdb your_database_name

# Run migrations (after setting up your migration tool)
npm run migrate
```

4. Start the development server:
```bash
# Development with hot-reload
npm run dev

# Production build
npm run build
npm start
```

5. Test the installation:
- Server should be running at `http://localhost:3001`
- Test health endpoint: `curl http://localhost:3001/health`
- Verify database connection through logs

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port number | Yes |
| NODE_ENV | Environment (development/production) | Yes |
| DATABASE_URL | PostgreSQL connection string | Yes |
| JWT_SECRET | Secret key for JWT tokens | Yes |
| JWT_EXPIRATION | JWT token expiration time | Yes |
| GOOGLE_CLIENT_ID | Google OAuth client ID | No |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret | No |
| LINKEDIN_CLIENT_ID | LinkedIn OAuth client ID | No |
| LINKEDIN_CLIENT_SECRET | LinkedIn OAuth client secret | No |
| STRIPE_SECRET_KEY | Stripe API secret key | Yes |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signing secret | Yes |
| SMTP_HOST | SMTP server host | Yes |
| SMTP_PORT | SMTP server port | Yes |
| SMTP_USER | SMTP username | Yes |
| SMTP_PASS | SMTP password | Yes |

## API Documentation

### Authentication
- `POST /api/auth/login` - User login with email/password
- `POST /api/auth/register` - User registration
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/linkedin` - LinkedIn OAuth login
- `GET /api/auth/linkedin/callback` - LinkedIn OAuth callback

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Email Verification
- `POST /api/auth/verify/email` - Send verification email
- `GET /api/auth/verify/:token` - Verify email token

### Subscriptions
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions` - Create subscription
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## Additional Notes

This README provides a comprehensive overview of the backend service, its features, requirements, tech stack, API endpoints, installation and setup instructions, environment variables, and example usage. It's designed to help developers understand the service and its capabilities, as well as to guide them through the setup and deployment process.

If you have any questions or need further assistance, please don't hesitate to reach out.

## Database Setup

### Local Development

1. Install PostgreSQL:
```bash
# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

2. Create the database:
```bash
# Log into PostgreSQL
psql postgres

# Create a new database
CREATE DATABASE saas_dev;

# Create a user (if not using default postgres user)
CREATE USER myuser WITH PASSWORD 'mypassword';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE saas_dev TO myuser;
```

3. Set up your environment variables:
```bash
# Copy the example env file
cp .env.example .env

# Update these variables in .env
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=saas_dev
DB_HOST=localhost
DB_PORT=5432
```

4. Initialize the database schema:
```bash
# Run the schema creation script
psql -U myuser -d saas_dev -f schema.sql

# Or use your migration tool
npm run migrate
```

### Production Setup

For production, you'll typically use a connection string:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

The application will automatically detect the environment and configure SSL appropriately.