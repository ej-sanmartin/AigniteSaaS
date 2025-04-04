-- Add salt column to refresh_tokens table
ALTER TABLE refresh_tokens
ADD COLUMN salt BYTEA NOT NULL;

-- Add comment to explain the column's purpose
COMMENT ON COLUMN refresh_tokens.salt IS 'Salt used for PBKDF2 key derivation in token encryption'; 