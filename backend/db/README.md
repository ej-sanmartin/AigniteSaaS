# Database Management

This directory contains the PostgreSQL database schema and utilities for the application.

## Setup

### MacOS Setup

1. Install PostgreSQL using Homebrew:
   ```bash
   # Install PostgreSQL
   brew install postgresql@14

   # Start PostgreSQL service
   brew services start postgresql@14
   ```

2. Create database and user:
   ```bash
   # Create a new database
   createdb saas_dev

   # Create a new user (if not using default postgres user)
   createuser -P saas_user
   # Enter a password when prompted

   # Grant privileges
   psql -d saas_dev -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO saas_user;"
   psql -d saas_dev -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO saas_user;"
   ```

3. Configure environment:
   ```bash
   # Add to .env
   DATABASE_URL=postgresql://saas_user:your_password@localhost:5432/saas_dev
   ```

### Linux Setup

1. Install PostgreSQL:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   ```

2. Create database and user:
   ```bash
   # Login to PostgreSQL
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE saas_dev;
   CREATE USER saas_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE saas_dev TO saas_user;
   ```

## Schema Overview

### Tables

1. **users**
   - User authentication (Local, Google, LinkedIn)
   - Role-based access control
   - OAuth integration
   - Subscription management
   - Automated timestamps

2. **subscription_history**
   - Subscription change tracking
   - User subscription timeline
   - Payment history reference

3. **subscription_prices**
   - Stripe price integration
   - Subscription tier management
   - Currency and billing settings

## Database Maintenance

```bash
# Backup
pg_dump -U saas_user -d saas_dev > backup.sql

# Restore
psql -U saas_user -d saas_dev < backup.sql

# Reset
dropdb -U saas_user saas_dev
createdb -U saas_user saas_dev
psql -U saas_user -d saas_dev -f schema.sql
```

## Best Practices

1. **Data Safety**
   - Use transactions for multi-step operations
   - Regular backups
   - Validate data before insertion

2. **Performance**
   - Utilize existing indexes
   - Regular VACUUM ANALYZE
   - Monitor query performance

3. **Security**
   - Use parameterized queries
   - Principle of least privilege
   - Regular security audits

## Troubleshooting

```bash
# Test connection
psql -U saas_user -d saas_dev -c "SELECT 1"

# Check PostgreSQL status (MacOS)
brew services list

# Check PostgreSQL status (Linux)
sudo service postgresql status
```

## Required Environment Variables

```bash
DATABASE_URL=postgresql://saas_user:password@localhost:5432/saas_dev
NODE_ENV=development|production|test  # Optional, defaults to development
```

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node-Postgres Documentation](https://node-postgres.com/)
