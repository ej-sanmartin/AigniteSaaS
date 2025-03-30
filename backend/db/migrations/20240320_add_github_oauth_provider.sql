-- Add github as a valid OAuth provider
ALTER TABLE users DROP CONSTRAINT users_oauth_provider_check;
ALTER TABLE users ADD CONSTRAINT users_oauth_provider_check 
    CHECK (oauth_provider IN ('google', 'linkedin', 'github')); 