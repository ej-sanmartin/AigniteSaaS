-- First, temporarily remove the existing CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_password_check;

-- Update any existing OAuth users to have empty string passwords instead of null
UPDATE users 
SET password = '' 
WHERE oauth_provider != 'local' 
AND password IS NULL;

-- Add back the CHECK constraint
ALTER TABLE users 
ADD CONSTRAINT users_password_check 
CHECK ((oauth_provider = 'local' AND password IS NOT NULL) OR 
       (oauth_provider != 'local' AND password = ''));

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT users_password_check ON users IS 
'Ensures local users have a password and OAuth users have an empty string password'; 