# Database Management

This directory contains the PostgreSQL database schema and utilities for the application.

## Setup

1. Install PostgreSQL:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib

   # macOS with Homebrew
   brew install postgresql
   ```

2. Create database and user:
   ```bash
   # Login to PostgreSQL
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE your_db_name;
   CREATE USER your_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE your_db_name TO your_user;
   ```

3. Initialize database:
   ```bash
   # Apply schema
   psql -U your_user -d your_db_name -f schema.sql
   ```

4. Configure environment:
   ```bash
   # Add to .env
   DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_db_name
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
pg_dump -U your_user -d your_db_name > backup.sql

# Restore
psql -U your_user -d your_db_name < backup.sql

# Reset
dropdb -U your_user your_db_name
createdb -U your_user your_db_name
psql -U your_user -d your_db_name -f schema.sql
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
psql -U your_user -d your_db_name -c "SELECT 1"

# Check PostgreSQL status
sudo service postgresql status
```

## Required Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
NODE_ENV=development|production|test  # Optional, defaults to development
```

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node-Postgres Documentation](https://node-postgres.com/)
