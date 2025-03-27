-- Add last_login column to users table
ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Add index for faster last_login lookups
CREATE INDEX idx_users_last_login ON users(last_login);

-- Update existing users to have their created_at as last_login
UPDATE users SET last_login = created_at WHERE last_login IS NULL; 