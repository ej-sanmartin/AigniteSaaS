-- Migration to update password handling for OAuth users
-- Changes empty string passwords to NULL for OAuth users

-- Step 1: Temporarily remove the CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_password_check;

-- Step 2: Update the password column to allow NULL
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Step 3: Update existing OAuth users to have NULL passwords
UPDATE users 
SET password = NULL 
WHERE oauth_provider != 'local' 
AND (password IS NULL OR password = '');

-- Step 4: Add new CHECK constraint that allows NULL for OAuth users
ALTER TABLE users 
ADD CONSTRAINT users_password_check 
CHECK (
  (oauth_provider = 'local' AND password IS NOT NULL) OR 
  (oauth_provider != 'local' AND password IS NULL)
);

-- Step 5: Add comment explaining the constraint
COMMENT ON CONSTRAINT users_password_check ON users IS 
'Ensures local users have a password and OAuth users have NULL password';

-- Step 6: Add index for faster password lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password) 
WHERE password IS NOT NULL; 