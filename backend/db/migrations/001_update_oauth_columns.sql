-- Rename auth_type to oauth_provider
ALTER TABLE users RENAME COLUMN auth_type TO oauth_provider;

-- Drop existing constraints if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_auth_type_check') THEN
        ALTER TABLE users DROP CONSTRAINT users_auth_type_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_password_check') THEN
        ALTER TABLE users DROP CONSTRAINT users_password_check;
    END IF;
END $$;

-- Add new constraints
ALTER TABLE users ADD CONSTRAINT users_oauth_provider_check 
  CHECK (oauth_provider IN ('local', 'google', 'linkedin'));

ALTER TABLE users ADD CONSTRAINT users_password_check 
  CHECK ((oauth_provider = 'local' AND password IS NOT NULL) OR 
         (oauth_provider != 'local' AND password = ''));

-- Update the unique index
DROP INDEX IF EXISTS idx_users_oauth;
CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_id) 
  WHERE oauth_provider != 'local' AND oauth_id IS NOT NULL; 