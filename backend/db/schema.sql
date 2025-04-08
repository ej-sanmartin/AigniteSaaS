CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  avatar_key VARCHAR(255);
  oauth_provider VARCHAR(20) NOT NULL DEFAULT 'local' CHECK (oauth_provider IN ('local', 'google', 'linkedin', 'github')),
  password VARCHAR(255) CHECK ((oauth_provider = 'local' AND password IS NOT NULL) OR 
                              (oauth_provider != 'local' AND password IS NULL)),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- OAuth ID from provider
  oauth_id VARCHAR(255),
  
  -- Subscription related columns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  current_period_end TIMESTAMP,
  price_id VARCHAR(255)
);

-- Add a unique constraint for oauth_provider + OAuth ID combination
CREATE UNIQUE INDEX idx_users_oauth ON users(oauth_provider, oauth_id) 
  WHERE oauth_provider != 'local' AND oauth_id IS NOT NULL;

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for faster last login lookups
CREATE INDEX idx_users_last_login ON users(last_login);

-- Add index for verification token lookups
CREATE INDEX idx_users_verification ON users(verification_token) 
  WHERE verification_token IS NOT NULL;

-- Add index for password lookups (only for local users)
CREATE INDEX idx_users_password ON users(password) 
  WHERE password IS NOT NULL;

-- Create encryption_keys table
CREATE TABLE encryption_keys (
    id VARCHAR(32) PRIMARY KEY,
    key BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

-- Create encrypted_data table for storing encrypted sensitive data
CREATE TABLE encrypted_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    key_id VARCHAR(32) REFERENCES encryption_keys(id),
    encrypted_data BYTEA NOT NULL,
    iv BYTEA NOT NULL,
    auth_tag BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create refresh_tokens table with encryption
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
    ip_address INET,
    salt BYTEA NOT NULL
);

-- Create sessions table
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    device_info JSONB,
    ip_address INET,
    UNIQUE(session_id)
);

-- Add index for revoked sessions
CREATE INDEX idx_sessions_revoked ON sessions(revoked_at) WHERE revoked_at IS NOT NULL;

-- Create user_login_attempts table for account lockout
CREATE TABLE user_login_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    device_info JSONB
);

-- Create subscription history table
CREATE TABLE subscription_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  subscription_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  price_id VARCHAR(255) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create subscription_prices table
CREATE TABLE subscription_prices (
  id SERIAL PRIMARY KEY,
  stripe_price_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  interval VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX idx_encryption_keys_active ON encryption_keys(is_active);
CREATE INDEX idx_encryption_keys_expires ON encryption_keys(expires_at);
CREATE INDEX idx_encrypted_data_user ON encrypted_data(user_id);
CREATE INDEX idx_encrypted_data_key ON encrypted_data(key_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked ON refresh_tokens(revoked_at);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_login_attempts_user ON user_login_attempts(user_id);
CREATE INDEX idx_login_attempts_ip ON user_login_attempts(ip_address);

-- Add functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions 
    WHERE expires_at < NOW() 
    OR revoked_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION trigger_session_cleanup()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM cleanup_expired_sessions();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encrypted_data_updated_at
    BEFORE UPDATE ON encrypted_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER cleanup_sessions_trigger
    AFTER INSERT OR UPDATE ON sessions
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_session_cleanup();
