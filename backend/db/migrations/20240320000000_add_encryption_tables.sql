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

-- Create index for faster lookups
CREATE INDEX idx_encryption_keys_active ON encryption_keys(is_active);
CREATE INDEX idx_encryption_keys_expires ON encryption_keys(expires_at);
CREATE INDEX idx_encrypted_data_user ON encrypted_data(user_id);
CREATE INDEX idx_encrypted_data_key ON encrypted_data(key_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_encrypted_data_updated_at
    BEFORE UPDATE ON encrypted_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 