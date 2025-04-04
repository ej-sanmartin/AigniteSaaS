-- Migration: Add revoked_at column to sessions table
-- Description: Adds a revoked_at timestamp column to the sessions table to support session revocation

-- Add the column
ALTER TABLE sessions ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE;

-- Add an index for faster lookups of revoked sessions
CREATE INDEX idx_sessions_revoked ON sessions(revoked_at) WHERE revoked_at IS NOT NULL;

-- Update the cleanup_expired_sessions function to also clean up revoked sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions 
    WHERE expires_at < NOW() 
    OR revoked_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql; 