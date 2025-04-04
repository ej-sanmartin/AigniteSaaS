-- Drop existing refresh_tokens table if it exists
DROP TABLE IF EXISTS refresh_tokens;

-- Create new refresh_tokens table with encryption
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token BYTEA NOT NULL,
    encrypted_token BYTEA NOT NULL,
    iv BYTEA NOT NULL,
    auth_tag BYTEA NOT NULL,
    key_id VARCHAR(32) REFERENCES encryption_keys(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    replaced_by INTEGER REFERENCES refresh_tokens(id),
    last_used_at TIMESTAMP WITH TIME ZONE,
    device_info JSONB,
    ip_address INET
);

-- Create sessions table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    device_info JSONB,
    ip_address INET,
    UNIQUE(session_id)
);

-- Create user_login_attempts table for account lockout
CREATE TABLE user_login_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    device_info JSONB
);

-- Create indexes for faster lookups
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked_at);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_login_attempts_user ON user_login_attempts(user_id);
CREATE INDEX idx_login_attempts_ip ON user_login_attempts(ip_address);

-- Add function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add function to check and enforce session limits
CREATE OR REPLACE FUNCTION check_session_limit(user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    session_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO session_count
    FROM sessions
    WHERE user_id = $1
    AND expires_at > NOW();

    RETURN session_count < 3; -- Max 3 sessions per user
END;
$$ LANGUAGE plpgsql;

-- Add function to check account lockout
CREATE OR REPLACE FUNCTION check_account_lockout(user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    failed_attempts INTEGER;
    last_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT 
        COUNT(*),
        MAX(attempted_at)
    INTO 
        failed_attempts,
        last_attempt
    FROM user_login_attempts
    WHERE user_id = $1
    AND success = false
    AND attempted_at > NOW() - INTERVAL '30 minutes';

    -- Return true if account should be locked (5 failed attempts in 30 minutes)
    RETURN failed_attempts >= 5 AND last_attempt > NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Add trigger for session cleanup
CREATE OR REPLACE FUNCTION trigger_session_cleanup()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM cleanup_expired_sessions();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_sessions_trigger
    AFTER INSERT OR UPDATE ON sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_session_cleanup(); 