CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  auth_type VARCHAR(20) NOT NULL DEFAULT 'local' CHECK (auth_type IN ('local', 'google', 'linkedin')),
  password VARCHAR(255) NOT NULL CHECK ((auth_type = 'local' AND password IS NOT NULL) OR 
                                      (auth_type != 'local' AND password = '')),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verification_token_expires TIMESTAMP WITH TIME ZONE,
  
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

-- Add a unique constraint for auth_type + OAuth ID combination
CREATE UNIQUE INDEX idx_users_oauth ON users(auth_type, oauth_id) 
  WHERE auth_type != 'local' AND oauth_id IS NOT NULL;

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Add index for verification token lookups
CREATE INDEX idx_users_verification ON users(verification_token) 
  WHERE verification_token IS NOT NULL;

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Create refresh tokens table
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE,
  replaced_by VARCHAR(255),
  
  -- Add index for faster token lookups
  CONSTRAINT idx_refresh_token UNIQUE (token)
);

-- Add index for user's active tokens
CREATE INDEX idx_user_active_tokens ON refresh_tokens(user_id) 
  WHERE revoked_at IS NULL;
